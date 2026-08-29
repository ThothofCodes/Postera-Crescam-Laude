// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// ImgBB Free Image Upload — Used for Tech Hub article images
// Docs: https://api.imgbb.com/
// Free tier: 32MB per image, unlimited uploads, direct URL

const axios = require('axios');
const FormData = require('form-data');

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

/**
 * Upload a buffer to ImgBB (free image hosting)
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Original filename
 * @param {string} [expiration] - Expiration time in seconds (0 = no expiration). Default: 0
 * @returns {Promise<{url: string, deleteUrl: string, width: number, height: number, size: number}>}
 */
async function uploadToImgBB(buffer, filename, expiration = 0) {
  if (!IMGBB_API_KEY) {
    throw new Error('ImgBB API key not configured. Set IMGBB_API_KEY in backend/.env');
  }

  const form = new FormData();
  form.append('key', IMGBB_API_KEY);
  form.append('image', buffer, {
    filename: filename || `upload_${Date.now()}.jpg`,
    contentType: 'image/jpeg',
  });
  if (expiration > 0) {
    form.append('expiration', String(expiration));
  }

  const { data } = await axios.post(IMGBB_API_URL, form, {
    headers: form.getHeaders(),
    timeout: 30000,
    maxContentLength: 50 * 1024 * 1024,
  });

  if (!data.success) {
    throw new Error(data.error?.message || 'ImgBB upload failed');
  }

  const img = data.data;
  return {
    url: img.url,            // Direct URL (http)
    displayUrl: img.display_url, // Alternative display URL
    deleteUrl: img.delete_url,   // URL to delete the image
    width: img.width,
    height: img.height,
    size: img.size,          // File size in bytes
    mime: img.mime,
    extension: img.extension,
  };
}

/**
 * Upload multiple images to ImgBB
 * @param {Array<{buffer: Buffer, filename: string}>} files
 * @returns {Promise<Array<{url: string, deleteUrl: string}>>}
 */
async function uploadMultipleToImgBB(files) {
  if (!files.length) return [];
  const results = await Promise.all(
    files.map((f) => uploadToImgBB(f.buffer, f.filename)),
  );
  return results;
}

/**
 * Delete an image from ImgBB using the delete URL
 * @param {string} deleteUrl - The delete URL returned from upload
 * @returns {Promise<boolean>}
 */
async function deleteFromImgBB(deleteUrl) {
  if (!deleteUrl) return false;
  try {
    await axios.get(deleteUrl, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  uploadToImgBB,
  uploadMultipleToImgBB,
  deleteFromImgBB,
  isConfigured: !!IMGBB_API_KEY,
};
