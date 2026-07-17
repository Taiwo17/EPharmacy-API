const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { User } = require('../models')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { success } = require('../utils/apiResponse')
const tokenService = require('../services/token.services')
const otpService = require('../services/otp.services')
const referralService = require('../services/referral.services')

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10

function issueSession(user, meta) {
  return Promise.all([
    tokenService.signAccessToken(user),
    tokenService.issueRefreshToken(user, meta),
  ])
}

function sanitizeUser(user) {
  const { id, fullName, email, phone, role, branchId, avatarUrl, isVerified } =
    user
  return { id, fullName, email, phone, role, branchId, avatarUrl, isVerified }
}

const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, referralCode } = req.body

  const existing = await User.findOne({
    where: {
      [Op.or]: [email ? { email } : null, phone ? { phone } : null].filter(
        Boolean,
      ),
    },
  })
  if (existing)
    throw ApiError.conflict('An account with this email/phone already exists')

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await User.create({ fullName, email, phone, passwordHash })

  if (referralCode) {
    await referralService
      .applyReferralOnSignup(referralCode, user.id)
      .catch(() => null)
  }

  // Kick off phone/email verification
  await otpService.issueOtp(email || phone, 'signup_verify')

  const [accessToken, refreshToken] = await issueSession(user, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  })

  return success(
    res,
    { user: sanitizeUser(user), accessToken, refreshToken: refreshToken.token },
    201,
  )
})

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body

  const user = await User.findOne({
    where: { [Op.or]: [{ email: identifier }, { phone: identifier }] },
  })
  if (!user || !user.passwordHash)
    throw ApiError.unauthorized('Invalid credentials')

  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) throw ApiError.unauthorized('Invalid credentials')
  if (!user.isActive)
    throw ApiError.forbidden('This account has been deactivated')

  user.lastLoginAt = new Date()
  await user.save()

  const [accessToken, refreshToken] = await issueSession(user, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  })

  return success(res, {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: refreshToken.token,
  })
})

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body

  const record = await tokenService.findValidRefreshToken(refreshToken)
  if (!record) throw ApiError.unauthorized('Invalid or expired refresh token')

  const user = await User.findByPk(record.userId)
  if (!user || !user.isActive)
    throw ApiError.unauthorized('User no longer active')

  const accessToken = tokenService.signAccessToken(user)
  const newRefreshToken = await tokenService.rotateRefreshToken(record, user, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  })

  return success(res, { accessToken, refreshToken: newRefreshToken.token })
})

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) await tokenService.revokeRefreshToken(refreshToken)
  return success(res, { loggedOut: true })
})

const sendOtp = asyncHandler(async (req, res) => {
  const { destination, purpose } = req.body
  const result = await otpService.issueOtp(destination, purpose)
  return success(res, { expiresAt: result.expiresAt, devCode: result.devCode })
})

const verifyOtp = asyncHandler(async (req, res) => {
  const { destination, purpose, code } = req.body
  await otpService.verifyOtp(destination, purpose, code)

  if (purpose === 'signup_verify') {
    await User.update(
      { isVerified: true },
      { where: { [Op.or]: [{ email: destination }, { phone: destination }] } },
    )
  }

  return success(res, { verified: true })
})

const forgotPassword = asyncHandler(async (req, res) => {
  const { destination } = req.body
  await otpService.issueOtp(destination, 'password_reset')
  return success(res, { sent: true })
})

const resetPassword = asyncHandler(async (req, res) => {
  const { destination, code, newPassword } = req.body
  await otpService.verifyOtp(destination, 'password_reset', code)

  const user = await User.findOne({
    where: { [Op.or]: [{ email: destination }, { phone: destination }] },
  })
  if (!user) throw ApiError.notFound('Account not found')

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await user.save()

  return success(res, { reset: true })
})

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id)

  if (!user) {
    throw ApiError.notFound('User not found')
  }

  return success(res, sanitizeUser(user))
})

module.exports = {
  register,
  login,
  refresh,
  logout,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  getProfile,
}
