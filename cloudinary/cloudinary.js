import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});

// Configuration
cloudinary.config({
  cloud_name: process.env.cloudinary_cloud_name,
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_secret_api_key, // Click 'View API Keys' above to copy your API secret
});

export async function uploadToCloudinary(fileBuffer, userId) {
  return new Promise((resolve, reject) => {
    if (!userId) {
      console.error("Error: no hay id del usuario");
      return reject("No userId");
    }

    const publicId = `users/${userId}/profile`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        invalidate: true,
        transformation: [
          {
            width: 500,
            height: 500,
            crop: "limit",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) {
          console.error("Error uploading to Cloudinary:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    // Convertir el buffer a stream y enviarlo
    const readableStream = Readable.from(fileBuffer);
    readableStream.pipe(uploadStream);
  });
}
