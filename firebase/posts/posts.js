import { db } from "../firebase.js";
import { addDoc, collection, getDocs, getDoc, doc, query, orderBy } from "firebase/firestore";

export async function uploadNewPost(id, description, imageUrls) {
  try {
    const newPost = {
      userId: id,
      description,
      imageUrls,
      createdAt: new Date(),
    };

    // Agrega el documento con ID generado automáticamente
    await addDoc(collection(db, "posts"), newPost);

    return;
  } catch (error) {
    console.error("Error uploading the post: ", error);
    throw error;
  }
}

export async function getAllPostsOrdered() {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
  
      const posts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
  
      const postsWithUser = await Promise.all(
        posts.map(async (post) => {
          try {
            const userRef = doc(db, "users", post.userId);
            const userSnap = await getDoc(userRef);
  
            const userData = userSnap.exists() ? userSnap.data() : null;
  
            return {
              post,
              user: userData,
            };
          } catch (err) {
            console.error(`Error fetching user ${post.userId}:`, err);
            return {
              post,
              user: null,
            };
          }
        })
      );
  
      return postsWithUser;
    } catch (error) {
      console.error("Error getting the posts: ", error);
      throw error;
    }
  }
