import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = (fileBuffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return resolve('');
    
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error);
          resolve('');
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );
    
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};
