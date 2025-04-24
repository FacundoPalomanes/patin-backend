import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import "dotenv/config";
import { getFirestore } from "firebase/firestore";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../firebase-admin-key.json");

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ✅ Inicializamos Admin SDK solo una vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminAuth = admin.auth();
