const { nanoid } = require('nanoid')
const { ReferralCode, Referral } = require('../models')
const { REFERRAL_STATUS } = require('../config/constants')
const { notifyUser } = require('./notification.services')

const DEFAULT_GIVER_REWARD = 1000 // currency units — tune per campaign
const DEFAULT_RECEIVER_REWARD = 1000

async function getOrCreateReferralCode(userId) {
  let referralCode = await ReferralCode.findOne({ where: { userId } })
  if (!referralCode) {
    referralCode = await ReferralCode.create({
      userId,
      code: nanoid(8).toUpperCase(),
      rewardGiverAmount: DEFAULT_GIVER_REWARD,
      rewardReceiverAmount: DEFAULT_RECEIVER_REWARD,
    })
  }
  return referralCode
}

/** Called at signup when a new user provides a referral code. */
async function applyReferralOnSignup(code, newUserId) {
  const referralCode = await ReferralCode.findOne({
    where: { code: code.toUpperCase() },
  })
  if (!referralCode) return null // invalid code — silently ignore, don't block signup

  const referral = await Referral.create({
    referrerId: referralCode.userId,
    refereeId: newUserId,
    code: referralCode.code,
    status: REFERRAL_STATUS.JOINED,
  })

  await notifyUser(referralCode.userId, {
    type: 'promo',
    title: 'Your friend just joined MedCart!',
    body: 'Complete your first qualifying order together to unlock both your rewards.',
    data: { referralId: referral.id },
  })

  return referral
}

/** Called when the referee's qualifying order (e.g. first order) completes. */
async function rewardQualifyingReferral(refereeId) {
  const referral = await Referral.findOne({
    where: { refereeId, status: REFERRAL_STATUS.JOINED },
  })
  if (!referral) return null

  const referralCode = await ReferralCode.findOne({
    where: { userId: referral.referrerId },
  })

  referral.status = REFERRAL_STATUS.REWARDED
  referral.rewardAmount =
    referralCode?.rewardGiverAmount || DEFAULT_GIVER_REWARD
  referral.rewardedAt = new Date()
  await referral.save()

  // NOTE: crediting the reward amount itself is done as a wallet/loyalty-points credit —
  // wire this to loyalty.service.earnPoints or a wallet ledger once the reward currency
  // (points vs cash-equivalent) is confirmed with the client.

  await notifyUser(referral.referrerId, {
    type: 'promo',
    title: 'Referral reward unlocked!',
    body: `You just earned ${referral.rewardAmount} for referring a friend.`,
    data: { referralId: referral.id },
  })

  return referral
}

module.exports = {
  getOrCreateReferralCode,
  applyReferralOnSignup,
  rewardQualifyingReferral,
}
