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
import { auth, db } from "@/lib/firebase";
import {
  Auction,
  AuctionStatus,
  CreateAuctionData,
  AuctionFilters,
} from "@/types/auction.types";
import { notifyAuctionWon, notifyAuctionEnded } from "./notification.service";
import { sanitizeText, sanitizeMultiline, sanitizeNumber } from "@/lib/sanitize";
import { validateCreateAuction } from "@/lib/validation";
import { incrementUserStat } from "./user.service";
import { uploadAuctionImages } from "./storage.service";

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
    // Validación server-side
    const validation = validateCreateAuction({
      ...data,
      startTime: data.startTime,
      endTime: data.endTime,
    } as unknown as Record<string, unknown>);
    if (!validation.valid) {
      throw new Error(validation.errors[0]);
    }

    // Sanitización de inputs
    const sanitizedTitle = sanitizeText(data.title).slice(0, 200);
    const sanitizedDescription = sanitizeMultiline(data.description).slice(0, 5000);
    const sanitizedSellerName = sanitizeText(sellerName).slice(0, 100);
    const sanitizedStartingPrice = sanitizeNumber(data.startingPrice);
    const sanitizedBidIncrement = sanitizeNumber(data.bidIncrement);

    if (isNaN(sanitizedStartingPrice) || sanitizedStartingPrice <= 0) {
      throw new Error("Precio inicial inválido");
    }
    if (isNaN(sanitizedBidIncrement) || sanitizedBidIncrement <= 0) {
      throw new Error("Incremento de puja inválido");
    }

    const now = serverTimestamp();
    const nowDate = new Date();
    const isScheduled = data.startTime.getTime() > nowDate.getTime();

    const auctionData: Record<string, unknown> = {
      title: sanitizedTitle,
      description: sanitizedDescription,
      category: data.category,
      images: [], // Will be updated after upload to Storage
      startingPrice: sanitizedStartingPrice,
      bidIncrement: sanitizedBidIncrement,
      sellerId,
      sellerName: sanitizedSellerName,
      sellerAvatar: sellerAvatar || "",
      currentBid: sanitizedStartingPrice,
      bidsCount: 0,
      watchersCount: 0,
      status: (isScheduled ? "scheduled" : "active") as AuctionStatus,
      startTime: Timestamp.fromDate(data.startTime),
      endTime: Timestamp.fromDate(data.endTime),
      createdAt: now,
      updatedAt: now,
    };

    // Solo agregar reservePrice si tiene valor
    if (data.reservePrice !== undefined && data.reservePrice !== null) {
      const sanitizedReservePrice = sanitizeNumber(data.reservePrice);
      if (!isNaN(sanitizedReservePrice) && sanitizedReservePrice > 0) {
        auctionData.reservePrice = sanitizedReservePrice;
      }
    }

    const docRef = await addDoc(auctionsRef, auctionData);

    // Upload images to Firebase Storage and update the doc with URLs
    if (data.images && data.images.length > 0) {
      try {
        const imageUrls = await uploadAuctionImages(docRef.id, data.images);
        await updateDoc(doc(db, AUCTIONS_COLLECTION, docRef.id), { images: imageUrls });
      } catch (imgErr) {
        console.error("[AuctionService] Error uploading images:", imgErr);
      }
    }

    // Increment seller's auctionsCreated stat
    incrementUserStat(sellerId, "auctionsCreated", 1).catch((err) =>
      console.error("[AuctionService] Error incrementing auctionsCreated:", err)
    );

    return docRef.id;
  } catch (error) {
    console.error("[AuctionService] Error creating auction:", error);
    throw error;
  }
}

// Allowed fields for client-side auction updates
const ALLOWED_UPDATE_FIELDS = new Set([
  "title", "description", "category", "images",
  "startingPrice", "reservePrice", "bidIncrement",
  "startTime", "endTime", "status",
]);

export async function updateAuction(
  auctionId: string,
  data: Partial<Auction>
): Promise<void> {
  try {
    const docRef = doc(db, AUCTIONS_COLLECTION, auctionId);
    // Filter to only allowed fields to prevent overwriting sensitive data
    const safeData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (ALLOWED_UPDATE_FIELDS.has(key)) {
        safeData[key] = value;
      }
    }
    // Allow status updates from internal finalization
    if (data.status === "ended") {
      if (data.winnerId !== undefined) safeData.winnerId = data.winnerId;
      if (data.winnerName !== undefined) safeData.winnerName = data.winnerName;
      if (data.finalPrice !== undefined) safeData.finalPrice = data.finalPrice;
    }
    await updateDoc(docRef, {
      ...safeData,
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

export async function finalizeAuction(auctionId: string): Promise<boolean> {
  try {
    const auction = await getAuction(auctionId);
    if (!auction) return false;

    const now = Timestamp.now();
    const isExpired = auction.endTime.toMillis() <= now.toMillis();
    const isActive = auction.status === "active";

    if (!isExpired || !isActive) return false;

    await updateAuction(auctionId, {
      status: "ended" as AuctionStatus,
      winnerId: auction.highestBidderId,
      winnerName: auction.highestBidderName,
      finalPrice: auction.currentBid,
    });

    // Send notifications
    if (auction.highestBidderId) {
      notifyAuctionWon(
        auction.highestBidderId,
        auctionId,
        auction.title,
        auction.currentBid
      ).catch((err) => console.error("[AuctionService] Error notifying winner:", err));
    }
    notifyAuctionEnded(
      auction.sellerId,
      auctionId,
      auction.title,
      auction.currentBid,
      auction.highestBidderName
    ).catch((err) => console.error("[AuctionService] Error notifying seller:", err));

    console.log(`[AuctionService] Auction ${auctionId} finalized`);
    return true;
  } catch (error) {
    console.error(`[AuctionService] Error finalizing auction ${auctionId}:`, error);
    return false;
  }
}

export async function finalizeExpiredAuctions(): Promise<number> {
  try {
    const now = Timestamp.now();
    
    // Buscar subastas activas cuyo tiempo ha expirado
    const q = query(
      auctionsRef,
      where("status", "==", "active"),
      where("endTime", "<=", now),
      limit(50) 
    );

    const querySnapshot = await getDocs(q);
    let finalizedCount = 0;

    const updatePromises = querySnapshot.docs.map(async (docSnap) => {
      try {
        const auctionData = docSnap.data() as Auction;
        
        await updateDoc(doc(db, AUCTIONS_COLLECTION, docSnap.id), {
          status: "ended" as AuctionStatus,
          winnerId: auctionData.highestBidderId,
          winnerName: auctionData.highestBidderName,
          finalPrice: auctionData.currentBid,
          updatedAt: serverTimestamp(),
        });
        finalizedCount++;
        console.log(`[AuctionService] Finalized auction: ${docSnap.id}`);

        // Enviar notificaciones
        // Notificar al ganador
        if (auctionData.highestBidderId) {
          notifyAuctionWon(
            auctionData.highestBidderId,
            docSnap.id,
            auctionData.title,
            auctionData.currentBid
          ).catch((err) => console.error("[AuctionService] Error notifying winner:", err));
        }

        // Notificar al vendedor
        notifyAuctionEnded(
          auctionData.sellerId,
          docSnap.id,
          auctionData.title,
          auctionData.currentBid,
          auctionData.highestBidderName
        ).catch((err) => console.error("[AuctionService] Error notifying seller:", err));

      } catch (err) {
        console.error(`[AuctionService] Failed to finalize ${docSnap.id}:`, err);
      }
    });

    await Promise.all(updatePromises);

    if (finalizedCount > 0) {
      console.log(`[AuctionService] Finalized ${finalizedCount} expired auctions`);
    }

    return finalizedCount;
  } catch (error) {
    console.error("[AuctionService] Error finalizing expired auctions:", error);
    return 0;
  }
}

export async function checkAndFinalizeAuction(auction: Auction): Promise<Auction> {
  const now = Timestamp.now();
  const isExpired = auction.endTime.toMillis() <= now.toMillis();
  const isActive = auction.status === "active";

  if (isExpired && isActive) {
    await finalizeAuction(auction.id);
    return {
      ...auction,
      status: "ended",
      winnerId: auction.highestBidderId,
      winnerName: auction.highestBidderName,
      finalPrice: auction.currentBid,
    };
  }

  return auction;
}

export async function activateScheduledAuctions(): Promise<number> {
  try {
    const now = Timestamp.now();

    const q = query(
      auctionsRef,
      where("status", "==", "scheduled"),
      where("startTime", "<=", now),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    let activatedCount = 0;

    const updatePromises = querySnapshot.docs.map(async (docSnap) => {
      try {
        await updateDoc(doc(db, AUCTIONS_COLLECTION, docSnap.id), {
          status: "active" as AuctionStatus,
          updatedAt: serverTimestamp(),
        });
        activatedCount++;
      } catch (err) {
        console.error(`[AuctionService] Failed to activate ${docSnap.id}:`, err);
      }
    });

    await Promise.all(updatePromises);

    if (activatedCount > 0) {
      console.log(`[AuctionService] Activated ${activatedCount} scheduled auctions`);
    }

    return activatedCount;
  } catch (error) {
    console.error("[AuctionService] Error activating scheduled auctions:", error);
    return 0;
  }
}

export async function checkAndActivateAuction(auction: Auction): Promise<Auction> {
  const now = Timestamp.now();
  const shouldActivate = auction.status === "scheduled" && auction.startTime.toMillis() <= now.toMillis();

  if (shouldActivate) {
    await updateAuction(auction.id, {
      status: "active" as AuctionStatus,
    });
    return { ...auction, status: "active" };
  }

  return auction;
}

export async function endAuctionEarly(
  auctionId: string,
  _sellerId?: string
): Promise<boolean> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error("No authenticated user");
    }

    const response = await fetch(`/api/auction/${auctionId}/end`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      console.error("[AuctionService] Server end-auction failed:", errorPayload);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[AuctionService] Error ending auction early:", error);
    return false;
  }
}
