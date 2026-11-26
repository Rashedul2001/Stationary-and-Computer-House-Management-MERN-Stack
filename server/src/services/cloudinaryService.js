import { cloudinary, configureCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

export async function uploadImageBuffer(buffer, folder = 'laksam_it_house') {
  if (!isCloudinaryConfigured()) {
    const error = new Error(
      'Cloudinary is not configured yet. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env.'
    );
    error.statusCode = 503;
    throw error;
  }

  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => {
        if (err) return reject(err);
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteCloudinaryImage(publicId) {
  if (!publicId || !isCloudinaryConfigured()) return;
  configureCloudinary();
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('[Cloudinary] Cleanup failed:', err.message);
  }
}
