const UserError = require('./../utils/UserError')
const logger = require('./../../logger')

module.exports = (error, req, res, next) => {
  if (!res) {
    return logger.error(new Error('Missing "res" object.'))
  }

  // Intentional error messages to be delivered to users
  const isUserError = error instanceof UserError

  // ENOENT or missing file errors, typically harmless, so do not log stacktrace
  const isENOENTError = error instanceof Error && error.code === 'ENOENT'

  if (!isUserError && !isENOENTError) {
    logger.error(error)
  }

  const statusCode = isUserError
    ? error.statusCode
    : 500

  const description = isUserError
    ? error.message
    : 'An unexpected error occurred. Try again?'

  return res
    .status(statusCode)
    .json({ success: false, description })
}
