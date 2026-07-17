const { Op } = require('sequelize');
const { Branch } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

// Haversine distance in km — used for "nearby branches" / auto-detect (PRD 4.1, 8 Branch Selection)
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { search, lat, lng } = req.query;

  const where = {};
  if (search) {
    where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { address: { [Op.iLike]: `%${search}%` } }];
  }

  const { rows, count } = await Branch.findAndCountAll({ where, limit, offset, order: [['name', 'ASC']] });

  let data = rows;
  if (lat && lng) {
    data = rows
      .map((b) => ({
        ...b.toJSON(),
        distanceKm:
          b.latitude && b.longitude
            ? Number(haversineKm(Number(lat), Number(lng), Number(b.latitude), Number(b.longitude)).toFixed(2))
            : null,
      }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  return paginated(res, data, count, page, limit);
});

const getById = asyncHandler(async (req, res) => {
  const branch = await Branch.findByPk(req.params.id);
  if (!branch) throw ApiError.notFound('Branch not found');
  return success(res, branch);
});

const create = asyncHandler(async (req, res) => {
  const branch = await Branch.create(req.body);
  return success(res, branch, 201);
});

const update = asyncHandler(async (req, res) => {
  const branch = await Branch.findByPk(req.params.id);
  if (!branch) throw ApiError.notFound('Branch not found');
  await branch.update(req.body);
  return success(res, branch);
});

const remove = asyncHandler(async (req, res) => {
  const branch = await Branch.findByPk(req.params.id);
  if (!branch) throw ApiError.notFound('Branch not found');
  await branch.destroy();
  return success(res, { deleted: true });
});

module.exports = { list, getById, create, update, remove };
