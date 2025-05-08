import {
  collection,
  query,
  getDocs,
  orderBy,
  getDoc,
  setDoc,
  doc,
  deleteDoc,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { moveCloudinaryImage } from "../../cloudinary/cloudinary.js";

export async function getPotentialUsers() {
  try {
    const q = query(collection(db, "potentialUsers"), orderBy("id"));

    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        surname: data.surname,
        photoUrl: data.photoURL,
      };
    });

    return users;
  } catch (error) {
    console.error("Hubo un error intentando traer a los usuarios: ", error);
    throw error;
  }
}

export async function acceptUser(myId, userId, category) {
  try {
    // Paso 1: Verificar que myId es admin
    const adminRef = doc(db, "users", myId);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists() || !adminSnap.data().admin) {
      throw new Error(
        "Acceso denegado. Solo los administradores pueden aceptar usuarios."
      );
    }

    // Paso 2: Obtener los datos del usuario potencial
    const potentialRef = doc(db, "potentialUsers", userId);
    const potentialSnap = await getDoc(potentialRef);

    if (!potentialSnap.exists()) {
      throw new Error("El usuario potencial no existe.");
    }

    const userData = potentialSnap.data();

    // Paso 3: Mover imagen en Cloudinary y actualizar photoURL
    const newPhotoURL = await moveCloudinaryImage(userId);
    const updatedUserData = {
      ...userData,
      photoURL: newPhotoURL,
      ...(category && { categoria: category }) // 👈 renombrás aquí
    };

    // Paso 4: Copiar a la colección "users"
    const usersRef = doc(db, "users", userId);
    await setDoc(usersRef, updatedUserData);

    // Paso 5: Eliminar de potentialUsers
    await deleteDoc(potentialRef);

    console.log(`Usuario ${userId} aceptado correctamente.`);
  } catch (error) {
    console.log("Hubo un error aceptando el usuario:", error);
    throw error;
  }
}


export async function getUsersPossibleAdmins(currentUserId) {
  try {
    const q = query(
      collection(db, "users"),
      where("id", "!=", currentUserId),
      orderBy("id") // obligatorio cuando usás '!='
    );

    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs
      .map((doc) => doc.data())
      .filter((data) => data.admin === false) // solo los que tienen admin: false
      .map((data) => ({
        id: data.id,
        name: data.name,
        surname: data.surname,
        photoUrl: data.photoURL,
      }));

    return users;
  } catch (error) {
    console.error("Hubo un error intentando traer a los usuarios: ", error);
    throw error;
  }
}

export async function setNewAdmin(myId, userId) {
  try {
    // Paso 1: Verificar que myId es admin
    const adminRef = doc(db, "users", myId);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists() || !adminSnap.data().admin) {
      throw new Error(
        "Acceso denegado. Solo los administradores pueden aceptar usuarios."
      );
    }

    // Paso 2: Verificar que el usuario existe
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("El usuario potencial no existe.");
    }

    // Paso 3: Actualizar el usuario agregando la propiedad admin: true
    await updateDoc(userRef, {
      admin: true,
    });

    console.log(`Usuario con ID ${userId} ahora es administrador.`);
  } catch (error) {
    console.error("Hubo un error intentando hacer el nuevo admin: ", error);
    throw error;
  }
}
