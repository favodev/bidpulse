import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const FAVORITES_COLLECTION = "favorites";
const AUCTIONS_COLLECTION = "auctions";

export interface Favorite {
  id: string;
  userId: string;
  auctionId: string;
  createdAt: Date;
}

export async function addToFavorites(userId: string, auctionId: string): Promise<void> {
  try {
    const favoriteId = `${userId}_${auctionId}`;
    const docRef = doc(db, FAVORITES_COLLECTION, favoriteId);
    
    await setDoc(docRef, {
      userId,
      auctionId,
      createdAt: serverTimestamp(),
    });

    // Increment watchersCount on the auction
    const auctionRef = doc(db, AUCTIONS_COLLECTION, auctionId);
    await updateDoc(auctionRef, {
      watchersCount: increment(1),
    }).catch(() => {});
  } catch (error) {
    console.error("[FavoriteService] Error adding to favorites:", error);
    throw error;
  }
}

export async function removeFromFavorites(userId: string, auctionId: string): Promise<void> {
  try {
    const favoriteId = `${userId}_${auctionId}`;
    const docRef = doc(db, FAVORITES_COLLECTION, favoriteId);
    await deleteDoc(docRef);

    // Decrement watchersCount on the auction
    const auctionRef = doc(db, AUCTIONS_COLLECTION, auctionId);
    await updateDoc(auctionRef, {
      watchersCount: increment(-1),
    }).catch(() => {});
  } catch (error) {
    console.error("[FavoriteService] Error removing from favorites:", error);
    throw error;
  }
}

export async function isFavorite(userId: string, auctionId: string): Promise<boolean> {
  try {
    const favoriteId = `${userId}_${auctionId}`;
    const docRef = doc(db, FAVORITES_COLLECTION, favoriteId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("[FavoriteService] Error checking favorite:", error);
    return false;
  }
}

export async function getUserFavoriteIds(userId: string): Promise<string[]> {
  try {
    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data().auctionId);
  } catch (error) {
    console.error("[FavoriteService] Error getting user favorites:", error);
    throw error;
  }
}

export function subscribeToUserFavorites(
  userId: string,
  callback: (auctionIds: string[]) => void
): Unsubscribe {
  const q = query(
    collection(db, FAVORITES_COLLECTION),
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const auctionIds = querySnapshot.docs.map((doc) => doc.data().auctionId);
      callback(auctionIds);
    },
    (error) => {
      console.error("[FavoriteService] Subscription error:", error);
    }
  );
}

export async function toggleFavorite(userId: string, auctionId: string): Promise<boolean> {
  const isCurrentlyFavorite = await isFavorite(userId, auctionId);
  
  if (isCurrentlyFavorite) {
    await removeFromFavorites(userId, auctionId);
    return false;
  } else {
    await addToFavorites(userId, auctionId);
    return true;
  }
}
