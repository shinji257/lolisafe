const blake3 = require('blake3')
const fs = require('fs')
const path = require('path')
const paths = require('../controllers/pathsController')
const utils = require('../controllers/utilsController')
const config = require('./../config')
const db = require('knex')(config.database)

const self = {
  mode: null
}

;(async () => {
  const location = process.argv[1].replace(process.cwd() + '/', '')
  const args = process.argv.slice(2)

  self.mode = parseInt(args[0])

  if (![0, 1, 2].includes(self.mode) ||
    args.includes('--help') ||
    args.includes('-h')) {
    return console.log(utils.stripIndents(`
      Rebuild file hashes.

      Usage  :
      node ${location} <mode=0|1|2> [parallel]

      mode:
      0 = Dry run (recalculate hashes, print them, but do NOT store to DB).
      1 = Recalculate hashes, print them, and store to DB.
      2 = Quiet (recalculate hashes and store to DB).

      parallel:
      Amount of uploads to hash in parallel (not to be confused with multi-threading).
    `).trim())
  }

  const dryrun = self.mode === 0
  const quiet = self.mode === 2
  const parallel = Math.min(Math.max(parseInt(args[1]), 0), 32) || 8

  const hrstart = process.hrtime()
  const uploads = await db.table('files')
    .select('id', 'name', 'hash')
  console.log(`Uploads : ${uploads.length}`)
  console.log(`Parallel: ${parallel}`)

  let lastProgressOut
  await utils.parallelLimit(uploads.map(upload => {
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(paths.uploads, upload.name))
        .on('error', () => reject)
        .pipe(blake3.createHash())
        .on('data', async hasher => {
          const hash = hasher.toString('hex')
          if (!quiet) console.log(`${upload.name}: ${hash}`)
          if (!dryrun && upload.hash !== hash) {
            await db.table('files')
              .update('hash', hash)
              .where('id', upload.id)
          }
          resolve()
        })
    })
  }), parallel, progress => {
    const now = Date.now()
    if (!lastProgressOut || (now - lastProgressOut >= 1000) || progress.done === progress.total) {
      console.log(`Progress: ${progress.done}/${progress.total}`)
      lastProgressOut = now
    }
  })

  const hrend = process.hrtime(hrstart)
  console.log(`Done in : ${(hrend[0] + (hrend[1] / 1e9)).toFixed(4)}s`)
  if (dryrun) {
    console.log('INFO: This was a dry run. DB had not been modified.')
  }
})()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
