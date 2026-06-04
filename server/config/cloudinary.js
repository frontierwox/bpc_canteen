import { v2 as cloudinary } from 'cloudinary';

/**
 * Configures Cloudinary SDK with environment credentials.
 * Used for menu item image uploads and logo storage.
 */
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return cloudinary;
};

export { configureCloudinary };
export default cloudinary;
