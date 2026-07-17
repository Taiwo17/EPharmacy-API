const crypto = require('crypto');

/**
 * Thin abstraction over S3-compatible object storage.
 * Swap the internals for @aws-sdk/client-s3 (or MinIO SDK) once credentials are available —
 * every call site in this codebase only depends on this module's exported shape,
 * so the storage backend can change without touching controllers.
 */
async function uploadBuffer(buffer, { folder = 'misc', mimetype, originalName }) {
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

module.exports = { uploadBuffer };
