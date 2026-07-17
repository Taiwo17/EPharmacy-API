const bcrypt = require('bcryptjs')
const { User } = require('../models')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { success } = require('../utils/apiResponse')
const storageService = require('../services/storage.services')

const getMe = asyncHandler(async (req, res) => {
  const {
    id,
    fullName,
    email,
    phone,
    role,
    branchId,
    avatarUrl,
    isVerified,
    createdAt,
  } = req.user
  return success(res, {
    id,
    fullName,
    email,
    phone,
    role,
    branchId,
    avatarUrl,
    isVerified,
    createdAt,
  })
})

const updateMe = asyncHandler(async (req, res) => {
  const { fullName, email, phone } = req.body
  const user = await User.findByPk(req.user.id)
  await user.update({ fullName, email, phone })
  return success(res, user)
})

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('An image file is required')
  const { url } = await storageService.uploadBuffer(req.file.buffer, {
    folder: 'avatars',
    mimetype: req.file.mimetype,
    originalName: req.file.originalname,
  })
  const user = await User.findByPk(req.user.id)
  user.avatarUrl = url
  await user.save()
  return success(res, { avatarUrl: url })
})

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await User.findByPk(req.user.id)

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash || '')
  if (!isMatch) throw ApiError.unauthorized('Current password is incorrect')

  user.passwordHash = await bcrypt.hash(
    newPassword,
    Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  )
  await user.save()
  return success(res, { changed: true })
})

module.exports = { getMe, updateMe, uploadAvatar, changePassword }
