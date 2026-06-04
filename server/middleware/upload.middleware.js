import multer from 'multer';
import ApiError from '../utils/ApiError.js';

/**
 * Multer configuration for file uploads.
 * Uses memory storage so files can be directly uploaded to Cloudinary.
 * Limits: 5MB max file size, image files only.
 */

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(400, `Invalid file type: ${file.mimetype}. Only JPEG, PNG, WebP, and GIF images are allowed.`),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

export default upload;
