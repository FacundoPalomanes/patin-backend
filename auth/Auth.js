import express from "express";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import {
  addUserToDB,
  addImageToDB,
  verifyEmail,
  logIn,
  logInGetUserDB,
} from "../firebase/auth/auth.js";
import multer from "multer";
import { verifyToken } from "../JWTVerify.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const Auth = express.Router();

Auth.post("/login", upload.none(), async (req, res) => {
  // login endpoint, check if user is correct then redirect to main if it's not, return error
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(401).json({ error: "Please fill all fields" });

  try {
    const user = await logIn(email, password);

    const userDocs = await logInGetUserDB(user.uid)

    // JWT Serialize for cookie
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // expires in 7 days
        id: user.uid,
        isVerified: user.emailVerified,
      },
      "secret"
    );

    const serialized = serialize("user", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // solo acepta la token del mismo sitio esto tendria q cambiarlo al hacerlo hosting en nodejs
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    });

    res.setHeader("Set-Cookie", serialized);
    return res.json({
      message: "login Successfully",
      isVerified: user.emailVerified,
      user: userDocs,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json("Error intentando de hacer el logIn");
  }
});

Auth.post("/register", upload.single("uploadPhoto"), async (req, res) => {
  const {
    name,
    email,
    password,
    phoneNumber,
    fechaNacimiento,
    categoria,
    dni,
  } = req.body;
  const file = req.file;

  if (
    !name ||
    !email ||
    !password ||
    !phoneNumber ||
    !file ||
    !fechaNacimiento ||
    !categoria ||
    !dni
  )
    return res.status(401).json({ error: "Please fill all fields" });

  try {
    const user = await addUserToDB(
      name,
      email,
      password,
      phoneNumber,
      fechaNacimiento,
      categoria,
      dni
    );

    if (!user)
      return res
        .status(401)
        .json({ error: "Error creating user, user may already exist" });

    await addImageToDB(file, user);

    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        id: user.uid,
        isVerified: user.emailVerified,
      },
      "secret"
    );

    const serialized = serialize("user", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    });

    res.setHeader("Set-Cookie", serialized);
    return res.status(200).json({ user: user });
  } catch (error) {
    console.log("Hubo un error creando el usuario: ", error);
    res.status(400).json({ error: "Error creando el usuario" });
  }
});

Auth.get("/cookiesProfile", (req, res) => {
  const userCookies = req.cookies.user;
  if (!userCookies) return res.status(401).json({ error: "no token" });

  try {
    const user = jwt.verify(userCookies, "secret");

    return res.json({
      token: userCookies,
      id: user.id,
      isVerified: user.isVerified,
    });
  } catch (error) {
    return res.status(401).json({ error: "Invalid Token" });
  }
});

Auth.get("/waitingVerify", verifyToken, async (req, res) => {
  try {
    const token = req.cookies?.user;

    if (!token)
      return res.status(401).json({ message: "Token no proporcionado" });

    // Validar el token
    const decoded = jwt.verify(token, "secret");
    const status = await verifyEmail(decoded.id);
    if (status) {
      const userDocs = await logInGetUserDB(decoded.id)
      const newToken = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 días
          id: decoded.id,
          isVerified: true,
        },
        "secret"
      );

      // Serializamos la nueva cookie
      const serialized = serialize("user", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      res.setHeader("Set-Cookie", serialized);
      return res.status(200).json({ verified: true, user: userDocs });
    }
    return res.status(200).json({ verified: false });
  } catch (error) {
    console.error("Error verificando usuario:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

Auth.get("/logout", verifyToken, (req, res) => {
  const { user } = req.cookies;
  if (!user) return res.status(401).json({ error: "no token" });

  try {
    jwt.verify(user, "secret"); // se puede extraer los valores de esto si se requiere
    const serialized = serialize("user", null, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // secure the token
      maxAge: 0, // put the maxAge that is expiration to 0 equals the cookie should be expired
      path: "/",
    });
    res.setHeader("Set-Cookie", serialized);
    res.status(200).json("logout successfully"); // en el return se tendria q hacer q automaticamente se vaya para el login page
  } catch (error) {
    return res.status(401).json({ error: "Invalid Token" });
  }
});

export default Auth;
