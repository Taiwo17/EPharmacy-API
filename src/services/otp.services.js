const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { OtpCode } = require('../models');
const ApiError = require('../utils/ApiError');

const OTP_LENGTH = Number(process.env.OTP_LENGTH) || 6;
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES) || 10;
const MAX_ATTEMPTS = 5;

function generateNumericCode(length) {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(length, '0');
}

/**
 * Creates and "sends" an OTP. In production this plugs into an SMS/email provider.
 * For now it logs to console in non-production and returns the raw code only in dev/test
 * so integration tests / manual QA can proceed without a live SMS provider.
 */
async function issueOtp(destination, purpose) {
  const code = generateNumericCode(OTP_LENGTH);
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  await OtpCode.destroy({ where: { destination, purpose, consumedAt: null } });
  await OtpCode.create({ destination, purpose, codeHash, expiresAt });

  // TODO: wire to SMS/email provider (see .env EMAIL_PROVIDER_API_KEY / SMS_PROVIDER_API_KEY)
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`[OTP:DEV] ${purpose} code for ${destination}: ${code}`);
  }

  return { expiresAt, devCode: process.env.NODE_ENV !== 'production' ? code : undefined };
}

async function verifyOtp(destination, purpose, code) {
  const record = await OtpCode.findOne({
    where: { destination, purpose, consumedAt: null },
    order: [['createdAt', 'DESC']],
  });

  if (!record) throw ApiError.badRequest('No pending verification code found. Please request a new one.');
  if (record.expiresAt < new Date()) throw ApiError.badRequest('Code has expired. Please request a new one.');
  if (record.attempts >= MAX_ATTEMPTS) throw ApiError.badRequest('Too many attempts. Please request a new code.');

  const isValid = await bcrypt.compare(code, record.codeHash);
  if (!isValid) {
    record.attempts += 1;
    await record.save();
    throw ApiError.badRequest('Invalid code.');
  }

  record.consumedAt = new Date();
  await record.save();
  return true;
}

module.exports = { issueOtp, verifyOtp };
