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
import serializeCookie from "../serializeCookie.js";
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

    const userDocs = await logInGetUserDB(user.uid);

    // JWT Serialize for cookie

    const serialized = await serializeCookie(user.uid, user.emailVerified, userDocs.isFinalUser)

    res.setHeader("Set-Cookie", serialized);
    return res.json({
      message: "login Successfully",
      isVerified: user.emailVerified,
      user: userDocs,
      status: userDocs.isFinalUser
    });
  } catch (error) {
    console.log(error);
    res.status(400).json("Error intentando de hacer el logIn");
  }
});

// DONE
Auth.post("/register", upload.single("uploadPhoto"), async (req, res) => {
  const {
    name,
    surname,
    email,
    password,
    phoneNumber,
    fechaNacimiento,
    dni,
    responsibleName,
    responsiblePhone,
  } = req.body;
  const file = req.file;

  if (
    !name ||
    !surname ||
    !email ||
    !password ||
    !phoneNumber ||
    !file ||
    !fechaNacimiento ||
    !dni
  )
    return res.status(401).json({ error: "Please fill all fields" });

  try {
    const user = await addUserToDB(
      name,
      surname,
      email,
      password,
      phoneNumber,
      fechaNacimiento,
      dni,
      responsibleName,
      responsiblePhone
    );

    if (!user)
      return res
        .status(401)
        .json({ error: "Error creating user, user may already exist" });

    await addImageToDB(file, user);

    const serialized = await serializeCookie(user.uid, user.emailVerified, false);

    res.setHeader("Set-Cookie", serialized);
    return res.status(200).json({ user: user });
  } catch (error) {
    console.error("Hubo un error creando el usuario: ", error);
    res.status(400).json({ error: "Error creando el usuario" });
  }
});

Auth.get("/waitingVerify", verifyToken, async (req, res) => {
  try {
    const token = req.cookies?.user;

    if (!token)
      return res.status(401).json({ message: "Token no proporcionado" });

    const decoded = jwt.verify(token, process.env.jwt_decoding);
    const status = await verifyEmail(decoded.id);

    if (status) {
      const userDocs = await logInGetUserDB(decoded.id);

      if (!userDocs)
        return res.status(404).json({ message: "Usuario no encontrado" });

      const serialized = await serializeCookie(decoded.id, true, userDocs.isFinalUser);

      res.setHeader("Set-Cookie", serialized);
      return res.status(200).json({ verified: true, user: userDocs, status: userDocs.isFinalUser });
    }

    return res.status(200).json({ verified: false });
  } catch (error) {
    console.error("Error verificando usuario:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});



// DONE
Auth.get("/cookiesProfile", (req, res) => {
  const userCookies = req.cookies.user;
  if (!userCookies) return res.status(401).json({ error: "no token" });

  try {
    const user = jwt.verify(userCookies, process.env.jwt_decoding);

    return res.json({
      token: userCookies,
      id: user.id,
      isVerified: user.isVerified,
      status: user.status,
    });
  } catch (error) {
    return res.status(401).json({ error: "Invalid Token" });
  }
});

// DONE BCAUSE this is when the user is already in the app
Auth.get("/getUserWithCookie", async (req, res) => {
  try {
    const token = req.cookies?.user;

    if (!token)
      return res.status(401).json({ message: "Token no proporcionado" });

    // Validar el token
    const decoded = jwt.verify(token, process.env.jwt_decoding);
    const userDocs = await logInGetUserDB(decoded.id);

    const serialized = await serializeCookie(decoded.id, true, true);

    res.setHeader("Set-Cookie", serialized);
    return res.status(200).json({ verified: true, user: userDocs });
  } catch (error) {
    console.error("Error verificando usuario:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

//DONE
Auth.get("/logout", (req, res) => {
  const { user } = req.cookies;
  if (!user) return res.status(401).json({ error: "no token" });

  try {
    jwt.verify(user, process.env.jwt_decoding); // se puede extraer los valores de esto si se requiere
    const serialized = serialize("user", null, {
      httpOnly: true,
      secure: true,
      sameSite: "none", // secure the token
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
