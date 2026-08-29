// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
//
// FIX: multer-storage-cloudinary@4 was built for multer@1.x. multer@2 changed
// the file stream from a Node.js Readable to a Web API ReadableStream —
// multer-storage-cloudinary@4 calls file.stream.pipe() internally, which does
// not exist on a Web ReadableStream, so every upload silently produced
// req.files = [] with no error thrown to the caller.
//
// Solution: use multer's built-in memoryStorage (always compatible, no
// third-party storage engine involved) and upload the buffer directly to
// Cloudinary inside the controller via the upload_stream API. This approach
// is recommended in Cloudinary's own Node.js docs for multer@2 environments.
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

// Only holds files in memory — no disk I/O, no third-party storage engine.
// The 5 MB limit stays the same as before.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ALLOWED = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'image/gif', 'image/bmp', 'image/tiff', 'image/heif', 'image/heic',
    ];
    if (ALLOWED.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported image type: ${file.mimetype}`), false);
    }
  },
});

/**
 * Upload a single in-memory buffer to Cloudinary.
 * Returns a Promise<{ url, public_id }>.
 *
 * @param {Buffer}  buffer   - file.buffer from multer memoryStorage
 * @param {string}  folder   - Cloudinary folder (default: 'pcl/products')
 */
function uploadBufferToCloudinary(buffer, folder = 'pcl/products') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        public_id: `product_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, public_id: result.public_id });
      },
    );
    // streamifier converts the Node.js Buffer back into a Node.js Readable
    // that Cloudinary's upload_stream can consume — this is the correct
    // pattern for multer memoryStorage + Cloudinary.
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * Upload all images from req.files (populated by multer memoryStorage) to
 * Cloudinary. Returns an array of secure_url strings, one per uploaded file.
 * If no files are present, returns an empty array (caller decides what to do).
 *
 * @param {Express.Multer.File[]} files - req.files
 */
async function uploadProductImages(files = []) {
  if (!files.length) return [];
  const results = await Promise.all(
    files.map((f) => uploadBufferToCloudinary(f.buffer)),
  );
  return results.map((r) => r.url);
}

module.exports = { upload, uploadProductImages };
