const { Prescription, User } = require('../models')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { success, paginated } = require('../utils/apiResponse')
const { getPagination } = require('../utils/pagination')
const { PRESCRIPTION_STATUS } = require('../config/constants')
const storageService = require('../services/storage.services')
const { notifyUser } = require('../services/notification.services')

/** POST /prescriptions — customer uploads image/PDF (multipart, field name "file") */
const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('A prescription file is required')

  const { url } = await storageService.uploadBuffer(req.file.buffer, {
    folder: 'prescriptions',
    mimetype: req.file.mimetype,
    originalName: req.file.originalname,
  })

  const prescription = await Prescription.create({
    customerId: req.user.id,
    imageUrl: url,
    notes: req.body.notes || null,
    status: PRESCRIPTION_STATUS.SUBMITTED,
  })

  return success(res, prescription, 201)
})

/** GET /prescriptions/mine — customer's own prescriptions + status timeline */
const listMine = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query)
  const { rows, count } = await Prescription.findAndCountAll({
    where: { customerId: req.user.id },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })
  return paginated(res, rows, count, page, limit)
})

/** GET /prescriptions/queue — pharmacist review queue */
const queue = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query)
  const { status } = req.query
  const where = status ? { status } : { status: PRESCRIPTION_STATUS.SUBMITTED }

  const { rows, count } = await Prescription.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'fullName', 'phone', 'email'],
      },
    ],
    limit,
    offset,
    order: [['createdAt', 'ASC']],
  })
  return paginated(res, rows, count, page, limit)
})

const getById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findByPk(req.params.id, {
    include: [{ model: User, as: 'customer', attributes: ['id', 'fullName'] }],
  })
  if (!prescription) throw ApiError.notFound('Prescription not found')

  const isOwner = prescription.customerId === req.user.id
  const isStaff = ['pharmacist', 'admin'].includes(req.user.role)
  if (!isOwner && !isStaff) throw ApiError.forbidden()

  return success(res, prescription)
})

/** PATCH /prescriptions/:id/review — pharmacist approve/reject with reason (PRD 5.3) */
const review = asyncHandler(async (req, res) => {
  const { decision, reviewNote } = req.body // decision: 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) {
    throw ApiError.badRequest('decision must be "approved" or "rejected"')
  }

  const prescription = await Prescription.findByPk(req.params.id)
  if (!prescription) throw ApiError.notFound('Prescription not found')
  if (prescription.status === PRESCRIPTION_STATUS.APPROVED) {
    throw ApiError.conflict('This prescription has already been approved')
  }

  prescription.status = decision
  prescription.reviewerId = req.user.id
  prescription.reviewNote = reviewNote || null
  prescription.reviewedAt = new Date()
  await prescription.save()

  await notifyUser(prescription.customerId, {
    type: 'prescription_status',
    title:
      decision === 'approved'
        ? 'Prescription approved'
        : 'Prescription needs attention',
    body:
      decision === 'approved'
        ? 'Your prescription has been approved. You can now complete checkout for the linked items.'
        : `Your prescription was not approved. ${reviewNote || 'Please re-upload a clearer copy.'}`,
    data: { prescriptionId: prescription.id, status: decision },
  })

  return success(res, prescription)
})

module.exports = { upload, listMine, queue, getById, review }
