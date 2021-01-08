class UserError extends Error {
  constructor (message, statusCode) {
    super(message)

    this.statusCode = statusCode !== undefined
      ? statusCode
      : 400
  }
}

module.exports = UserError
