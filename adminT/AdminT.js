import express from "express";
import jwt from "jsonwebtoken";
import { verifyToken } from "../JWTVerify.js";
import {
  getPotentialUsers,
  acceptUser,
  getUsersPossibleAdmins,
  setNewAdmin
} from "../firebase/admin/admin.js";

const AdminT = express.Router();

AdminT.get("/getPosibleUsers", verifyToken, async (_req, res) => {
  try {
    const users = await getPotentialUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("Hubo un error trayendo los usuarios: ", error);
    res.status(500).json({ message: "Hubo un error trayendo los usuarios" });
  }
});

AdminT.post("/acceptUser", verifyToken, async (req, res) => {
  try {
    const { userId, category } = req.body; 
    const token = req.cookies?.user;

    if (!token)
      return res.status(401).json({ message: "Token no proporcionado" });

    const decoded = jwt.verify(token, process.env.jwt_decoding);

    await acceptUser(decoded.id, userId, category); 

    res.status(200).json({ message: "Usuario aceptado con exito" });
  } catch (error) {
    console.error("Hubo un error aceptando el usuario: ", error);
    res.status(500).json({ message: "Hubo un error aceptando el usuario" });
  }
});

AdminT.get("/getUsersPossibleAdmins", verifyToken, async (req, res) => {
  try {
    const token = req.cookies?.user;

    if (!token)
      return res.status(401).json({ message: "Token no proporcionado" });

    const decoded = jwt.verify(token, process.env.jwt_decoding);

    const users = await getUsersPossibleAdmins(decoded.id);

    res.status(200).json(users);
  } catch (error) {
    console.error(
      "Hubo un error trayendo los usuarios para administrador: ",
      error
    );
    res.status(500).json({
      message: "Hubo un error trayendo los usuarios para administrador",
    });
  }
});

AdminT.post("/newAdmin", verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;

    const token = req.cookies?.user;

    if (!token)
      return res.status(401).json({ message: "Token no proporcionado" });

    const decoded = jwt.verify(token, process.env.jwt_decoding);

    await setNewAdmin(decoded.id, userId);
    
    res.status(200).json({message: "Admin creado con exito"});
  } catch (error) {
    console.error("Hubo un error intentando hacer admin al usuario: ", error);
    res.status(500).json({
      message: "Hubo un error intentando hacer administrador al usuario",
    });
  }
});

export default AdminT;