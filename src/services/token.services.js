const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { RefreshToken } = require('../models');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, branchId: user.branchId || null },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function generateOpaqueToken() {
  return crypto.randomBytes(48).toString('hex');
}

function parseExpiryToDate(expiresInStr) {
  // supports simple formats like '30d', '15m', '1h'
  const match = /^(\d+)([smhd])$/.exec(expiresInStr);
  const now = new Date();
  if (!match) {
    now.setDate(now.getDate() + 30);
    return now;
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(now.getTime() + value * multipliers[unit]);
}

async function issueRefreshToken(user, meta = {}) {
  const token = generateOpaqueToken();
  const expiresAt = parseExpiryToDate(process.env.JWT_REFRESH_EXPIRES_IN || '30d');
  await RefreshToken.create({
    userId: user.id,
    token,
    expiresAt,
    userAgent: meta.userAgent || null,
    ipAddress: meta.ipAddress || null,
  });
  return { token, expiresAt };
}

async function rotateRefreshToken(oldTokenRecord, user, meta = {}) {
  oldTokenRecord.revoked = true;
  await oldTokenRecord.save();
  return issueRefreshToken(user, meta);
}

async function revokeRefreshToken(token) {
  const record = await RefreshToken.findOne({ where: { token } });
  if (record) {
    record.revoked = true;
    await record.save();
  }
}

async function findValidRefreshToken(token) {
  const record = await RefreshToken.findOne({ where: { token } });
  if (!record || record.revoked || record.expiresAt < new Date()) {
    return null;
  }
  return record;
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  findValidRefreshToken,
  generateOpaqueToken,
};
