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

    const folderPath = `potentialUsers/${userId}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderPath,
        public_id: "profile",
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

    const readableStream = Readable.from(fileBuffer);
    readableStream.pipe(uploadStream);
  });
}

export async function moveCloudinaryImage(userId) {
  const fromPublicId = `potentialUsers/${userId}/profile`; // Ruta original
  const toPublicId = `users/${userId}/profile`; // Nueva ruta

  try {
    // Obtener los detalles de la imagen original
    const resource = await cloudinary.api.resource(fromPublicId).catch(() => null);
    if (!resource) {
      console.error("La imagen no fue encontrada:", fromPublicId);
      return null;
    }

    // Usamos la URL de la imagen ya alojada en Cloudinary para subirla a la nueva ubicación
    const uploadResult = await cloudinary.uploader.upload(resource.secure_url, {
      public_id: toPublicId,  // Subimos con el nuevo public_id
      overwrite: true,
    });

    // Eliminar la imagen original de 'potentialUsers/{userId}/profile' si la carga fue exitosa
    await cloudinary.uploader.destroy(fromPublicId);

    console.log("Imagen movida exitosamente:", uploadResult.secure_url);
    return uploadResult.secure_url;
  } catch (error) {
    console.error("Error al mover la imagen en Cloudinary:", error);
    throw error;
  }
}

export async function updatePhoto(file, userId) {
  return new Promise((resolve, reject) => {
    if (!file || !userId) {
      return reject("Faltan archivo o userId");
    }

    const folderPath = `users/${userId}`; // siempre se sobreescribe la misma foto

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderPath,
        public_id: "profile",
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
          console.error("Error subiendo imagen a Cloudinary:", error);
          return reject(error);
        }
        if (!result?.secure_url) {
          return reject("No se obtuvo una URL de Cloudinary");
        }
        resolve(result.secure_url);
      }
    );

    const readableStream = Readable.from(file.buffer);
    readableStream.pipe(uploadStream);
  });
}

export async function uploadPostsPhotos(files) {
  // Subir imágenes a Cloudinary
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "posts" }, (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url); // URL de la imagen
        })
        .end(file.buffer);
    });
  });

  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}
