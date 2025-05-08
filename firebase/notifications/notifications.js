import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase.js";

export async function getUsers(currentUserId) {
  try {
    const q = query(
      collection(db, "users"),
      where("id", "!=", currentUserId),
      orderBy("id") // requerido al usar !=
    );

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

export async function postNotification(description, receiverId, senderId) {
  try {
    const notification = {
      description,
      createdAt: new Date().toISOString(),
      senderId
    };

    const targetId = receiverId && receiverId !== "0" ? receiverId : "all";
    const docRef = doc(db, "notifications", targetId);

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Si el documento existe, actualizar el array de notificaciones
      await updateDoc(docRef, {
        notifications: arrayUnion(notification),
      });
    } else {
      // Si no existe, crear el documento con un array de notificaciones
      await setDoc(docRef, {
        notifications: [notification],
      });
    }
  } catch (error) {
    console.error("Hubo un error intentando crear la notificacion: ", error);
    throw error;
  }
}

export async function getNotifications(userId) {
  try {
    const userDocRef = doc(db, "notifications", userId);
    const allDocRef = doc(db, "notifications", "all");

    const [userDocSnap, allDocSnap] = await Promise.all([
      getDoc(userDocRef),
      getDoc(allDocRef)
    ]);

    const userNotifications = userDocSnap.exists() ? userDocSnap.data().notifications || [] : [];
    const allNotifications = allDocSnap.exists() ? allDocSnap.data().notifications || [] : [];

    // Unir y ordenar por fecha (más reciente primero)
    const combined = [...userNotifications, ...allNotifications].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Obtener datos del senderId y agregarlos
    const notificationsWithSenderData = await Promise.all(combined.map(async (notification) => {
      if (!notification.senderId) return notification;

      const senderRef = doc(db, "users", notification.senderId);
      const senderSnap = await getDoc(senderRef);

      if (senderSnap.exists()) {
        const senderData = senderSnap.data();
        return {
          ...notification,
          sender: {
            name: senderData.name || "",
            surname: senderData.surname || "",
            photoURL: senderData.photoURL || ""
          }
        };
      } else {
        return {
          ...notification,
          sender: null
        };
      }
    }));

    return notificationsWithSenderData;
  } catch (error) {
    console.error("Hubo un error trayendo las notificaciones: ", error);
    throw error;
  }
}
