import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import Admin from "./admin/Admin.js";
import Auth from "./auth/Auth.js";
import User from "./user/User.js";
import Posts from "./Posts/Posts.js";
import Notifications from "./notifications/Notifications.js";

const app = express();
const PORT = 8000;

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});

app.use(
  cors({
    origin: `${process.env.fetchUrl}`,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
); // CORS TO DENY ANY BAD URLS FROM ACCESSING OUR API

app.use(cookieParser()); // function to make cookies accessible in req.cookies

app.use(express.json());

app.use('/auth', Auth);
app.use('/user', User);
app.use('/posts', Posts);
app.use('/notifications', Notifications);
app.use('/admin', Admin);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
