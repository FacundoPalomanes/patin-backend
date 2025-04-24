import {
  signOut,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, adminAuth, db } from "../firebase.js";
import { uploadToCloudinary } from "../../cloudinary/cloudinary.js";

export async function logIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    console.log(
      "ha habido un error al iniciar sesion o no existe el usuario",
      error
    );
    throw error;
  }
}

export async function logInGetUserDB(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);
    if (userSnapshot.exists()) {
      return userSnapshot.data();
    }else{
      return null;
    }
  } catch (error) {
    console.log(
      "ha habido un error al traer el usuario de la base de datos",
      error
    );
    throw error;
  }
}

export async function addUserToDB(
  name,
  email,
  password,
  phoneNumber,
  fechaNacimiento,
  categoria,
  dni
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: name,
    });

    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: email,
        name: name,
        phoneNumber: phoneNumber,
        fechaNacimiento: fechaNacimiento,
        categoria: categoria,
        dni: dni,
      });

      console.log(`Usuario ${user.uid} registrado correctamente.`);
      await sendEmailVerification(user);
    } else {
      console.log(`Usuario ${user.uid} ya existe en la base de datos.`);
    }

    return user;
  } catch (error) {
    console.log("ha habido un error con el usuario o ya existe", error);
    throw error;
  }
}

export async function addImageToDB(file, user) {
  try {
    const photoURL = await uploadToCloudinary(file.buffer, user.uid);

    await updateDoc(doc(db, "users", user.uid), {
      photoURL,
    });

    // ✅ Agregá esto para setear photoURL
    await updateProfile(user, {
      photoURL: photoURL,
    });

    return photoURL;
  } catch (error) {
    console.error("Error en addImageToDB:", error);
    throw error;
  }
}

export async function verifyEmail(userId) {
  try {
    // Buscar al usuario en Firebase
    const userRecord = await adminAuth.getUser(userId);
    return userRecord.emailVerified;
  } catch (error) {
    console.error("Error tratando de verificar mail:", error);
    throw error;
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (err) {
    console.log(err);
  }
}
