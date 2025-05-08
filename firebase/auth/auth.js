import {
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
    console.error(
      "ha habido un error al iniciar sesion o no existe el usuario",
      error
    );
    throw error;
  }
}

export async function logInGetUserDB(uid) {
  try {
    // Buscar en la colección "users"
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);
    if (userSnapshot.exists()) {
      return { ...userSnapshot.data(), isFinalUser: true };
    }

    // Si no está, buscar en "potentialUsers"
    const potentialUserRef = doc(db, "potentialUsers", uid);
    const potentialUserSnapshot = await getDoc(potentialUserRef);
    if (potentialUserSnapshot.exists()) {
      return { ...potentialUserSnapshot.data(), isFinalUser: false };
    }

    // No existe en ninguna
    return null;
  } catch (error) {
    console.error("Error al traer el usuario de la base de datos", error);
    throw error;
  }
}

export async function addUserToDB(
  name,
  surname,
  email,
  password,
  phoneNumber,
  fechaNacimiento,
  dni,
  responsibleName,
  responsiblePhone
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: name.concat(" ", surname),
    });

    const userRef = doc(db, "potentialUsers", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      if (responsibleName !== undefined && responsiblePhone !== undefined) {
        await setDoc(userRef, {
          id: user.uid,
          surname: surname,
          email: email,
          name: name,
          phoneNumber: phoneNumber,
          fechaNacimiento: fechaNacimiento,
          dni: dni,
          admin: false,
          responsibleName: responsibleName,
          responsiblePhone: responsiblePhone,
        });
      } else {
        await setDoc(userRef, {
          id: user.uid,
          surname: surname,
          email: email,
          name: name,
          phoneNumber: phoneNumber,
          fechaNacimiento: fechaNacimiento,
          dni: dni,
          admin: false
        });
      }

      console.log(`Usuario ${user.uid} registrado correctamente.`);
      await sendEmailVerification(user);
    } else {
      console.log(`Usuario ${user.uid} ya existe en la base de datos.`);
    }

    return user;
  } catch (error) {
    console.error("ha habido un error con el usuario o ya existe", error);
    throw error;
  }
}

export async function addImageToDB(file, user) {
  try {
    const photoURL = await uploadToCloudinary(file.buffer, user.uid);

    // Actualiza en potentialUsers, no en users
    await updateDoc(doc(db, "potentialUsers", user.uid), {
      photoURL,
    });

    // Actualiza también el perfil de Firebase Auth (opcional)
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
