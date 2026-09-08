// const crypto = require('crypto');

/**
 * Thin abstraction over S3-compatible object storage.
 * Swap the internals for @aws-sdk/client-s3 (or MinIO SDK) once credentials are available —
 * every call site in this codebase only depends on this module's exported shape,
 * so the storage backend can change without touching controllers.
 */
/* async function uploadBuffer(buffer, { folder = 'misc', mimetype, originalName }) {
  const ext = originalName ? originalName.split('.').pop() : 'bin';
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

  if (!process.env.S3_ENDPOINT) {
    // Local/dev fallback: no object storage configured yet.
    // Returns a deterministic pseudo-URL so the rest of the app can be built and tested end-to-end.
    return {
      key,
      url: `${process.env.APP_URL || 'http://localhost:4000'}/uploads/${key}`,
      mimetype,
      sizeBytes: buffer.length,
    };
  }

  // TODO: implement real upload via @aws-sdk/client-s3 PutObjectCommand once S3_* env vars are set.
  throw new Error('S3 storage configured but upload implementation is not yet wired.');
}

module.exports = { uploadBuffer }; */

'use strict'

const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')

const cloudinary = require('../config/cloudinary')

/**
 * Check whether Cloudinary has been configured.
 */
function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  )
}

/**
 * Generate a unique file key.
 */
function generateKey(folder, originalName) {
  const ext = originalName ? path.extname(originalName).toLowerCase() : '.bin'

  const fileName = `${Date.now()}-${crypto
    .randomBytes(8)
    .toString('hex')}${ext}`

  return `${folder}/${fileName}`
}

/**
 * Save file locally.
 */
async function saveLocalFile(buffer, key) {
  const filePath = path.join(process.cwd(), 'uploads', key)

  await fs.mkdir(path.dirname(filePath), {
    recursive: true,
  })

  await fs.writeFile(filePath, buffer)

  return filePath
}

/**
 * Upload a file.
 *
 * LOCAL:
 * If Cloudinary credentials are missing,
 * the file is saved inside /uploads.
 *
 * PRODUCTION:
 * If Cloudinary credentials exist,
 * the file is uploaded to Cloudinary.
 */
async function uploadBuffer(
  buffer,
  { folder = 'misc', mimetype, originalName } = {},
) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('A valid file buffer is required')
  }

  const key = generateKey(folder, originalName)

  /*
   * LOCAL DEVELOPMENT
   */
  if (!isCloudinaryConfigured()) {
    await saveLocalFile(buffer, key)

    return {
      key,
      url: `${process.env.APP_URL || 'http://localhost:4000'}/uploads/${key}`,
      mimetype,
      sizeBytes: buffer.length,
      storage: 'local',
    }
  }

  /*
   * PRODUCTION - CLOUDINARY
   */
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        transformation: [
          {
            width: 1600,
            height: 1600,
            crop: 'limit',
            quality: 'auto',
            fetch_format: 'auto',
          },
        ],
      },

      (error, result) => {
        if (error) {
          return reject(error)
        }

        resolve(result)
      },
    )

    uploadStream.end(buffer)
  })

  return {
    key: result.public_id,
    url: result.secure_url,
    mimetype,
    sizeBytes: buffer.length,
    storage: 'cloudinary',
  }
}

/**
 * Delete a file.
 */
async function deleteFile(key) {
  if (!key) return

  /*
   * LOCAL FILE
   */
  if (!isCloudinaryConfigured()) {
    const filePath = path.join(process.cwd(), 'uploads', key)

    try {
      await fs.unlink(filePath)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    return
  }

  /*
   * CLOUDINARY FILE
   */
  await cloudinary.uploader.destroy(key, {
    resource_type: 'image',
  })
}

module.exports = {
  uploadBuffer,
  deleteFile,
}
