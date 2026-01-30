import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Auction,
  AuctionStatus,
  CreateAuctionData,
  AuctionFilters,
} from "@/types/auction.types";

const AUCTIONS_COLLECTION = "auctions";
const auctionsRef = collection(db, AUCTIONS_COLLECTION);

export async function getAuction(auctionId: string): Promise<Auction | null> {
  try {
    const docRef = doc(db, AUCTIONS_COLLECTION, auctionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Auction;
  } catch (error) {
    console.error("[AuctionService] Error getting auction:", error);
    throw error;
  }
}

export async function getAuctions(filters: AuctionFilters = {}): Promise<Auction[]> {
  try {
    let q = query(auctionsRef);

    // Filtrar por categoría
    if (filters.category) {
      q = query(q, where("category", "==", filters.category));
    }

    // Filtrar por estado
    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }

    // Filtrar por vendedor
    if (filters.sellerId) {
      q = query(q, where("sellerId", "==", filters.sellerId));
    }

    // Ordenar
    const sortField = filters.sortBy || "endTime";
    const sortDirection = filters.sortOrder || "asc";
    q = query(q, orderBy(sortField, sortDirection));

    // Limitar resultados
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const querySnapshot = await getDocs(q);
    const auctions: Auction[] = [];

    querySnapshot.forEach((doc) => {
      auctions.push({
        id: doc.id,
        ...doc.data(),
      } as Auction);
    });

    return auctions;
  } catch (error) {
    console.error("[AuctionService] Error getting auctions:", error);
    throw error;
  }
}

export async function getActiveAuctions(limitCount = 20): Promise<Auction[]> {
  return getAuctions({
    status: "active",
    sortBy: "endTime",
    sortOrder: "asc",
    limit: limitCount,
  });
}

export async function getEndingSoonAuctions(limitCount = 10): Promise<Auction[]> {
  try {
    const now = Timestamp.now();
    const q = query(
      auctionsRef,
      where("status", "==", "active"),
      where("endTime", ">", now),
      orderBy("endTime", "asc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const auctions: Auction[] = [];

    querySnapshot.forEach((doc) => {
      auctions.push({
        id: doc.id,
        ...doc.data(),
      } as Auction);
    });

    return auctions;
  } catch (error) {
    console.error("[AuctionService] Error getting ending soon auctions:", error);
    throw error;
  }
}

export async function getPopularAuctions(limitCount = 10): Promise<Auction[]> {
  return getAuctions({
    status: "active",
    sortBy: "bidsCount",
    sortOrder: "desc",
    limit: limitCount,
  });
}

export async function createAuction(
  data: CreateAuctionData,
  sellerId: string,
  sellerName: string,
  sellerAvatar?: string
): Promise<string> {
  try {
    const now = serverTimestamp();

    const auctionData: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      category: data.category,
      images: data.images,
      startingPrice: data.startingPrice,
      bidIncrement: data.bidIncrement,
      sellerId,
      sellerName,
      sellerAvatar: sellerAvatar || "",
      currentBid: data.startingPrice,
      bidsCount: 0,
      watchersCount: 0,
      status: "active" as AuctionStatus,
      startTime: Timestamp.fromDate(data.startTime),
      endTime: Timestamp.fromDate(data.endTime),
      createdAt: now,
      updatedAt: now,
    };

    // Solo agregar reservePrice si tiene valor
    if (data.reservePrice !== undefined && data.reservePrice !== null) {
      auctionData.reservePrice = data.reservePrice;
    }

    const docRef = await addDoc(auctionsRef, auctionData);
    return docRef.id;
  } catch (error) {
    console.error("[AuctionService] Error creating auction:", error);
    throw error;
  }
}

export async function updateAuction(
  auctionId: string,
  data: Partial<Auction>
): Promise<void> {
  try {
    const docRef = doc(db, AUCTIONS_COLLECTION, auctionId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[AuctionService] Error updating auction:", error);
    throw error;
  }
}

export async function deleteAuction(auctionId: string): Promise<void> {
  try {
    const docRef = doc(db, AUCTIONS_COLLECTION, auctionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("[AuctionService] Error deleting auction:", error);
    throw error;
  }
}

export function subscribeToAuction(
  auctionId: string,
  callback: (auction: Auction | null) => void
): Unsubscribe {
  const docRef = doc(db, AUCTIONS_COLLECTION, auctionId);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({
          id: docSnap.id,
          ...docSnap.data(),
        } as Auction);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("[AuctionService] Subscription error:", error);
    }
  );
}

export function subscribeToActiveAuctions(
  callback: (auctions: Auction[]) => void,
  limitCount = 20
): Unsubscribe {
  const q = query(
    auctionsRef,
    where("status", "==", "active"),
    orderBy("endTime", "asc"),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const auctions: Auction[] = [];
      querySnapshot.forEach((doc) => {
        auctions.push({
          id: doc.id,
          ...doc.data(),
        } as Auction);
      });
      callback(auctions);
    },
    (error) => {
      console.error("[AuctionService] Subscription error:", error);
    }
  );
}

export function isAuctionActive(auction: Auction): boolean {
  const now = Timestamp.now();
  return (
    auction.status === "active" &&
    auction.startTime.toMillis() <= now.toMillis() &&
    auction.endTime.toMillis() > now.toMillis()
  );
}

export function getTimeRemaining(endTime: Timestamp): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = Date.now();
  const end = endTime.toMillis();
  const total = Math.max(0, end - now);

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    total,
  };
}

export function formatTimeRemaining(endTime: Timestamp): string {
  const { days, hours, minutes, seconds } = getTimeRemaining(endTime);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
