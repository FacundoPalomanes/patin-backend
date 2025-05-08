import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export default async function serializeCookie(uid, isVerified, status) {
  try {
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        id: uid,
        isVerified: isVerified,
        status: status,
      },
      process.env.jwt_decoding
    );
    const serialized = serialize("user", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    });

    return serialized;
  } catch (error) {
    console.error("Hubo un error creando la cookie: ", error);
    throw error;
  }
}
