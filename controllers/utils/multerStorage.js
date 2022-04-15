const fs = require('fs')
const path = require('path')
const blake3 = require('blake3')
const mkdirp = require('mkdirp')
const logger = require('./../../logger')

const REQUIRED_WEIGHT = 2

function DiskStorage (opts) {
  this.getFilename = opts.filename

  if (typeof opts.destination === 'string') {
    mkdirp.sync(opts.destination)
    this.getDestination = function ($0, $1, cb) { cb(null, opts.destination) }
  } else {
    this.getDestination = opts.destination
  }

  this.clamscan = opts.clamscan
}

DiskStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  const that = this

  // "weighted" callback, to be able to "await" multiple callbacks
  let tempError = null
  let tempObject = {}
  let tempWeight = 0
  const _cb = (err, result, weight = 1) => {
    tempError = err
    tempWeight += weight
    tempObject = Object.assign(result, tempObject)
    if (tempError || tempWeight >= REQUIRED_WEIGHT) {
      cb(tempError, tempObject)
    }
  }

  that.getDestination(req, file, function (err, destination) {
    if (err) return _cb(err)

    that.getFilename(req, file, function (err, filename) {
      if (err) return _cb(err)

      const finalPath = path.join(destination, filename)
      const onerror = err => {
        hash.dispose()
        _cb(err)
      }

      let outStream
      let hash
      if (file._isChunk) {
        if (!file._chunksData.stream) {
          file._chunksData.stream = fs.createWriteStream(finalPath, { flags: 'a' })
          file._chunksData.stream.on('error', onerror)
        }
        if (!file._chunksData.hasher) {
          file._chunksData.hasher = blake3.createHash()
        }

        outStream = file._chunksData.stream
        hash = file._chunksData.hasher
      } else {
        outStream = fs.createWriteStream(finalPath)
        outStream.on('error', onerror)
        hash = blake3.createHash()
      }

      file.stream.on('error', onerror)
      file.stream.on('data', d => hash.update(d))

      if (file._isChunk) {
        file.stream.on('end', () => {
          _cb(null, {
            destination,
            filename,
            path: finalPath
          }, 2)
        })
        file.stream.pipe(outStream, { end: false })
      } else {
        outStream.on('finish', () => {
          _cb(null, {
            destination,
            filename,
            path: finalPath,
            size: outStream.bytesWritten,
            hash: hash.digest('hex')
          }, that.clamscan.passthrough ? 1 : 2)
        })

        if (that.clamscan.passthrough) {
          logger.debug(`[ClamAV]: ${filename}: Passthrough scanning\u2026`)
          const clamStream = that.clamscan.instance.passthrough()
          clamStream.on('scan-complete', result => {
            _cb(null, {
              clamscan: result
            })
          })
          file.stream.pipe(clamStream).pipe(outStream)
        } else {
          file.stream.pipe(outStream)
        }
      }
    })
  })
}

DiskStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  const path = file.path

  delete file.destination
  delete file.filename
  delete file.path

  fs.unlink(path, cb)
}

module.exports = function (opts) {
  return new DiskStorage(opts)
}
