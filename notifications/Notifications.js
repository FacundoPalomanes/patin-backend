import express from "express";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage });
import jwt from "jsonwebtoken";
import { verifyToken } from "../JWTVerify.js";
import { getNotifications, getUsers, postNotification } from "../firebase/notifications/notifications.js";

const Notifications = express.Router();

Notifications.get("/getUsers", verifyToken, async (req, res) => {
  try {
    const token = req.cookies.user;
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, process.env.jwt_decoding);
    const users = await getUsers(decoded.id);
    res.status(200).json(users);
  } catch (error) {
    console.error("Hubo un error obteniendo los usuarios: ", error);
    res.status(500).json({ message: "Hubo un error obteniendo los usuarios" });
  }
});

Notifications.post("/addNotification", verifyToken,upload.none(), async (req, res) => {
  try {
    const { description, receiverId } = req.body;
    const token = req.cookies.user;
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, process.env.jwt_decoding);

    if (!description || description.trim() === "") {
      return res.status(400).json({ message: "La descripción es obligatoria" });
    }

    await postNotification(description, receiverId, decoded.id);

    res.status(200).json({ message: "Notificación enviada con éxito" });
  } catch (error) {
    console.error("Hubo un error añadiendo una notificación:", error);
    res.status(500).json({ message: "Hubo un error enviando la notificación" });
  }
});

Notifications.get("/getNotifications", verifyToken, async (req, res) => {
  try {
    const token = req.cookies.user;
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, process.env.jwt_decoding);

    const notifications = await getNotifications(decoded.id);

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Hubo un error añadiendo una notificación:", error);
    res.status(500).json({ message: "Hubo un error enviando la notificación" });
  }
});

export default Notifications;
