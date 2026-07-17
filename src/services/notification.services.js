const { Notification } = require('../models');
const logger = require('../utils/logger');

/**
 * Creates the in-app notification record and (in production) fans out to
 * FCM push + email. Push/email providers are pluggable via env config
 * (FCM_SERVER_KEY, EMAIL_PROVIDER_API_KEY) — wire in the real SDKs there.
 */
async function notifyUser(userId, { type, title, body, data = {} }) {
  const notification = await Notification.create({ userId, type, title, body, data });

  if (process.env.FCM_SERVER_KEY) {
    // TODO: send push via Firebase Cloud Messaging
  } else {
    logger.debug(`[push:dev] would push to user ${userId}: ${title} — ${body}`);
  }

  return notification;
}

async function notifyMany(userIds, payload) {
  return Promise.all(userIds.map((id) => notifyUser(id, payload)));
}

module.exports = { notifyUser, notifyMany };
