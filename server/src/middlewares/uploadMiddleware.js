import multer from 'multer';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const uploadImageMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const err = new Error('Only JPEG, PNG, WEBP, or GIF images are allowed.');
      err.statusCode = 400;
      return cb(err);
    }
    return cb(null, true);
  },
});
