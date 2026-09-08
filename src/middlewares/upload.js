/* const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage(); // controller/service pushes buffer to S3-compatible storage

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
 */

'use strict'

const multer = require('multer')
const ApiError = require('../utils/ApiError')

const storage = multer.memoryStorage()

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `Unsupported file type: ${file.mimetype}. Only JPEG, PNG, and WebP images are allowed.`,
      ),
    )
  }

  cb(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5, // Maximum 5 files
  },
})

module.exports = upload
