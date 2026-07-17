const { verifyAccessToken } = require('../services/token.services')
const { User } = require('../models')
const ApiError = require('../utils/ApiError')
const asyncHandler = require('../utils/asyncHandler')

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Missing or malformed Authorization header')
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired access token')
  }

  const user = await User.findByPk(payload.sub)
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User no longer exists or is deactivated')
  }

  req.user = user
  next()
})

// Attaches req.user if a valid token is present, but does not fail the request otherwise.
// Useful for endpoints that behave differently for guests vs logged-in users.
const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme === 'Bearer' && token) {
    try {
      const payload = verifyAccessToken(token)
      const user = await User.findByPk(payload.sub)
      if (user && user.isActive) req.user = user
    } catch (err) {
      // ignore — treat as guest
    }
  }
  next()
})

module.exports = { authenticate, optionalAuthenticate }
