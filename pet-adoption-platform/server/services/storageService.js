const fs = require('fs');
const path = require('path');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const uploadFile = async (file, folder = 'pawbridge/pets') => {
  if (!file) return null;

  if (isCloudinaryConfigured()) {
    const isPdf = file.mimetype === 'application/pdf';
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: isPdf ? 'raw' : 'image',
      transformation: isPdf ? undefined : [{ quality: 'auto:good', fetch_format: 'auto', width: 1400, crop: 'limit' }],
    });

    // Clean up temporary disk file after upload to Cloudinary
    fs.unlink(file.path, () => {});
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  // Development local storage fallback (relative URL served via Express /uploads)
  const filename = path.basename(file.path);
  return {
    url: `/uploads/${filename}`,
    publicId: filename,
  };
};

const deleteFile = async (publicId) => {
  if (!publicId) return;
  if (isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn('Cloudinary delete failed:', err.message);
    }
    return;
  }

  const localPath = path.join(__dirname, '..', 'uploads', path.basename(publicId));
  fs.unlink(localPath, () => {});
};

module.exports = {
  uploadFile,
  deleteFile,
};
