import express from "express";
import multer from "multer";
import { verifyToken } from "../JWTVerify.js";
const storage = multer.memoryStorage();
const upload = multer({ storage });
import jwt from "jsonwebtoken";
import {
  updateUserPassword,
  uploadUser,
  requestEmailChange,
} from "../firebase/user/user.js";
import { updatePhoto } from "../cloudinary/cloudinary.js";

const User = express.Router();

User.post("/editUser", upload.single("foto"), verifyToken, async (req, res) => {
  const token = req.cookies.user;
  if (!token) return res.status(401).json({ error: "No token" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.jwt_decoding);
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }

  const uid = decoded.id;
  if (!uid) return res.status(401).json({ error: "No autorizado" });

  const { nombre, apellido, categoria, dni, telefono } = req.body;
  const foto = req.file;

  const updates = {};

  if (nombre) updates.name = nombre;
  if (apellido) updates.surname = apellido;
  if (dni) updates.dni = dni;
  if (telefono) updates.phoneNumber = telefono;

  // Pasamos la categoría tal cual venga (puede ser "", string válido o undefined)
  updates.categoria = categoria;

  try {
    if (foto) await updatePhoto(foto, uid);

    if (
      Object.values(updates).every((val) => val === undefined) &&
      !foto
    ) {
      return res
        .status(400)
        .json({ message: "No hay cambios para actualizar." });
    }

    await uploadUser(updates, uid);

    if (foto) updates.photoURL = "Photo updated successfully";

    return res
      .status(200)
      .json({ message: "Perfil actualizado con éxito.", updates: updates });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return res.status(500).json({ error: "Error actualizando el perfil" });
  }
});

User.post("/changePassword", verifyToken, async (req, res) => {
  try {
    const { actualPassword, newPassword, email } = req.body;

    await updateUserPassword(email, newPassword, actualPassword);

    return res
      .status(200)
      .json({ message: "Contraseña actualizada con éxito." });
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);
    return res.status(500).json({ error: "Error actualizando la contraseña" });
  }
});

User.post("/requestEmailChange", verifyToken, async (req, res) => {
  try {
    const { email, newEmail, password } = req.body;

    await requestEmailChange(email, newEmail, password);

    return res.status(200).json({
      message: "Se envió un correo de verificación al nuevo email.",
    });
  } catch (error) {
    console.error("Error al solicitar cambio de email:", error);
    return res
      .status(500)
      .json({ error: "No se pudo iniciar el cambio de email." });
  }
});

export default User;