import jwt from 'jsonwebtoken'

// Middleware para verificar el JWT en rutas protegidas
export function verifyToken (req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res
      .status(403)
      .json({ message: "Acceso denegado, no se proporcionó el token." });
  }

  jwt.verify(token, process.env.jwt_decoding, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido o expirado." });
    }
    req.user = decoded; // Almacenar la información decodificada en la solicitud
    next();
  });
};