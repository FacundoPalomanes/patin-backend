import express from "express";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage });
import jwt from "jsonwebtoken";
import { verifyToken } from "../JWTVerify.js";
import { uploadPostsPhotos } from "../cloudinary/cloudinary.js";
import { uploadNewPost, getAllPostsOrdered } from "../firebase/posts/posts.js";

const Posts = express.Router();

Posts.post(
  "/newPost",
  verifyToken,
  upload.array("images"),
  async (req, res) => {
    try {
      const token = req.cookies.user;
      if (!token) return res.status(401).json({ error: "No token" });

      const decoded = jwt.verify(token, process.env.jwt_decoding);

      const { description } = req.body;
      const files = req.files;

      if (!description) {
        return res
          .status(400)
          .json({ message: "Faltan datos para crear el post." });
      }

      let imageUrls;
      if (files) {
        imageUrls = await uploadPostsPhotos(files);
      }

       await uploadNewPost(decoded.id, description, imageUrls);
      // SI lo llego a necesitar puedo poner el posts id y devolverlo en ese json de abajo o ponerle el id de la persona a todos los posts q crea entonces obtener todos los suyos
      return res
        .status(201)
        .json({ message: "Post creado con éxito" });
    } catch (error) {
      console.error("Error al publicar un nuevo post:", error);
      res.status(500).json({ message: "No se pudo crear el post" });
    }
  }
);

Posts.get("/getPosts", verifyToken, async (_req, res) => {
  try {
    const posts = await getAllPostsOrdered();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error intentando traer los posts: ", error);
    res
      .status(500)
      .json({ message: "No se pudo traer los posts mas recientes" });
  }
});

export default Posts;
