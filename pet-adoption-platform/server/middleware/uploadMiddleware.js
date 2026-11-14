const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext) ? ext : '';
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`;
    cb(null, uniqueName);
  },
});

const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/x-png', 'image/webp'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  if (!allowedMimes.includes(file.mimetype) && !allowedExts.includes(ext)) {
    return cb(new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed.'), false);
  }
  cb(null, true);
};

const documentFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.jfif', '.png', '.webp', '.gif', '.bmp', '.heic', '.pdf'];
  const isAllowedMime = mime.startsWith('image/') || mime === 'application/pdf' || mime === 'application/x-pdf';
  if (!isAllowedMime && !allowedExts.includes(ext)) {
    return cb(new ApiError(400, 'Please upload an image (JPG, PNG, WebP) or PDF document.'), false);
  }
  cb(null, true);
};

const uploadPetImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per image
    files: 6,
  },
});

const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max for high-res photos/PDF scans
    files: 1,
  },
});

module.exports = {
  uploadPetImages,
  uploadDocument,
};
