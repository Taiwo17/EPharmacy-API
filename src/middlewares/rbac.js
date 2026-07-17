const ApiError = require('../utils/ApiError');

/**
 * Usage: router.post('/products', authenticate, requireRole('admin', 'branch_staff'), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires one of roles: ${allowedRoles.join(', ')}`));
    }
    next();
  };
}

/**
 * Restricts branch_staff/pharmacist to acting only within their own branch,
 * unless they are admin (who can act across all branches).
 * Expects the target branchId to be resolvable from req.params.branchId,
 * req.body.branchId, or req.resourceBranchId (set by a prior loader middleware).
 */
function scopeToOwnBranch(req, res, next) {
  if (req.user.role === 'admin') return next();

  const targetBranchId =
    req.resourceBranchId || req.params.branchId || req.body.branchId || req.query.branchId;

  if (!targetBranchId) return next(); // let controller-level filtering handle it

  if (String(req.user.branchId) !== String(targetBranchId)) {
    return next(ApiError.forbidden('You do not have access to this branch'));
  }
  next();
}

module.exports = { requireRole, scopeToOwnBranch };
