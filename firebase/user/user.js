import { db, auth } from "../firebase.js";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import {
  updatePassword as firebaseUpdatePassword,
  signInWithEmailAndPassword,
  updateEmail,
  verifyBeforeUpdateEmail,
} from "firebase/auth";

export async function uploadUser(updates, uid) {
  try {
    const userRef = doc(db, "users", uid);

    const finalUpdates = { ...updates };

    // Si categoría es un string vacío, la eliminamos
    if (finalUpdates.categoria === "") {
      finalUpdates.categoria = deleteField();
    }

    await updateDoc(userRef, finalUpdates);
  } catch (error) {
    console.error("Error updating the user:", error);
    throw error;
  }
}

export async function updateUserPassword(email, newPassword, beforePassword) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      beforePassword
    );

    // Asegurate de pasar userCredential.user, no el objeto entero
    await firebaseUpdatePassword(userCredential.user, newPassword);
    return;
  } catch (error) {
    console.error("Error updating password: ", error);
    throw error;
  }
}

export async function requestEmailChange(email, newEmail, password) {
  try {
    // Reautenticar al usuario
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Enviar email de verificación
    await verifyBeforeUpdateEmail(userCredential.user, newEmail);

    // cambiar email en usuarios
    await updateDoc(doc(db, "users", userCredential.user.uid), {
      email: newEmail,
    });
    return;
  } catch (error) {
    console.error("Error requesting user email verification: ", error);
    throw error;
  }
}