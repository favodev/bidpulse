import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bid, CreateBidData, BidResult, BID_ERROR_MESSAGES } from "@/types/bid.types";
import { Auction } from "@/types/auction.types";
import { notifyOutbid, notifyNewBid } from "./notification.service";

const BIDS_COLLECTION = "bids";
const AUCTIONS_COLLECTION = "auctions";
const bidsRef = collection(db, BIDS_COLLECTION);


const MIN_BID_INCREMENT_PERCENT = 5;
const MIN_BID_INCREMENT_ABSOLUTE = 1;


const ANTI_SNIPING_THRESHOLD = 60;
const ANTI_SNIPING_EXTENSION = 120;

export async function placeBid(data: CreateBidData): Promise<BidResult> {
  const { auctionId, bidderId, bidderName, amount } = data;

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Leer la subasta
      const auctionRef = doc(db, AUCTIONS_COLLECTION, auctionId);
      const auctionSnap = await transaction.get(auctionRef);

      if (!auctionSnap.exists()) {
        return {
          success: false,
          error: {
            code: "auction-not-found" as const,
            message: BID_ERROR_MESSAGES["auction-not-found"],
          },
        };
      }

      const auction = { id: auctionSnap.id, ...auctionSnap.data() } as Auction;

      // 2. Validar estado de la subasta
      const now = Timestamp.now();

      if (auction.status !== "active") {
        return {
          success: false,
          error: {
            code: "auction-not-active" as const,
            message: BID_ERROR_MESSAGES["auction-not-active"],
          },
        };
      }

      if (auction.endTime.toMillis() < now.toMillis()) {
        return {
          success: false,
          error: {
            code: "auction-ended" as const,
            message: BID_ERROR_MESSAGES["auction-ended"],
          },
        };
      }

      // 3. Validar que no sea el vendedor
      if (auction.sellerId === bidderId) {
        return {
          success: false,
          error: {
            code: "self-bid" as const,
            message: BID_ERROR_MESSAGES["self-bid"],
          },
        };
      }

      // 4. Calcular puja mínima
      const minIncrement = Math.max(
        auction.currentBid * (MIN_BID_INCREMENT_PERCENT / 100),
        MIN_BID_INCREMENT_ABSOLUTE
      );
      const minBid = auction.currentBid + minIncrement;

      if (amount < minBid) {
        return {
          success: false,
          error: {
            code: "bid-too-low" as const,
            message: `${BID_ERROR_MESSAGES["bid-too-low"]} Mínimo: $${minBid.toFixed(2)}`,
          },
        };
      }

      // 5. Calcular anti-sniping
      const timeRemaining = auction.endTime.toMillis() - now.toMillis();
      const isSnipingAttempt = timeRemaining < ANTI_SNIPING_THRESHOLD * 1000;

      let newEndTime = auction.endTime;
      if (isSnipingAttempt) {
        const extensionMs = ANTI_SNIPING_EXTENSION * 1000;
        newEndTime = Timestamp.fromMillis(now.toMillis() + extensionMs);
      }

      // 6. Crear la puja
      const bidRef = doc(collection(db, BIDS_COLLECTION));
      const bidData: Record<string, unknown> = {
        auctionId,
        bidderId,
        bidderName,
        amount,
        previousBid: auction.currentBid,
        createdAt: serverTimestamp(),
        isWinning: true,
      };

      // Agregar avatar si existe
      if (data.bidderAvatar) {
        bidData.bidderAvatar = data.bidderAvatar;
      }

      transaction.set(bidRef, bidData);

      // 7. Marcar puja anterior como no ganadora
      if (auction.highestBidderId && auction.highestBidderId !== bidderId) {
        const previousBidsQuery = query(
          bidsRef,
          where("auctionId", "==", auctionId),
          where("bidderId", "==", auction.highestBidderId),
          where("isWinning", "==", true)
        );
      }

      // 8. Actualizar la subasta
      const auctionUpdate: Record<string, unknown> = {
        currentBid: amount,
        highestBidderId: bidderId,
        highestBidderName: bidderName,
        bidsCount: auction.bidsCount + 1,
        updatedAt: serverTimestamp(),
      };

      if (isSnipingAttempt) {
        auctionUpdate.endTime = newEndTime;
      }

      transaction.update(auctionRef, auctionUpdate);

      return {
        success: true,
        bidId: bidRef.id,
        newCurrentBid: amount,
        timeExtended: isSnipingAttempt,
        // Datos para notificaciones (fuera de la transacción)
        _notificationData: {
          previousBidderId: auction.highestBidderId,
          sellerId: auction.sellerId,
          auctionTitle: auction.title,
        },
      };
    });

    // Enviar notificaciones fuera de la transacción
    if (result.success && result._notificationData) {
      const { previousBidderId, sellerId, auctionTitle } = result._notificationData;

      // Notificar al pujador anterior que fue superado
      if (previousBidderId && previousBidderId !== bidderId) {
        notifyOutbid(previousBidderId, auctionId, auctionTitle, amount, bidderName).catch(
          (err) => console.error("[BidService] Error notifying outbid:", err)
        );
      }

      // Notificar al vendedor de la nueva puja
      if (sellerId !== bidderId) {
        notifyNewBid(sellerId, auctionId, auctionTitle, amount, bidderName).catch(
          (err) => console.error("[BidService] Error notifying seller:", err)
        );
      }

      // Limpiar datos internos antes de retornar
      delete (result as Record<string, unknown>)._notificationData;
    }

    return result;
  } catch (error) {
    console.error("[BidService] Error placing bid:", error);
    return {
      success: false,
      error: {
        code: "unknown",
        message: BID_ERROR_MESSAGES["unknown"],
      },
    };
  }
}

export async function getAuctionBids(
  auctionId: string,
  limitCount = 50
): Promise<Bid[]> {
  try {
    const q = query(
      bidsRef,
      where("auctionId", "==", auctionId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const bids: Bid[] = [];

    querySnapshot.forEach((doc) => {
      bids.push({
        id: doc.id,
        ...doc.data(),
      } as Bid);
    });

    return bids;
  } catch (error) {
    console.error("[BidService] Error getting bids:", error);
    throw error;
  }
}

export async function getUserBids(
  userId: string,
  limitCount = 50
): Promise<Bid[]> {
  try {
    const q = query(
      bidsRef,
      where("bidderId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const bids: Bid[] = [];

    querySnapshot.forEach((doc) => {
      bids.push({
        id: doc.id,
        ...doc.data(),
      } as Bid);
    });

    return bids;
  } catch (error) {
    console.error("[BidService] Error getting user bids:", error);
    throw error;
  }
}

export function subscribeToAuctionBids(
  auctionId: string,
  callback: (bids: Bid[]) => void,
  limitCount = 20
): Unsubscribe {
  const q = query(
    bidsRef,
    where("auctionId", "==", auctionId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const bids: Bid[] = [];
      querySnapshot.forEach((doc) => {
        bids.push({
          id: doc.id,
          ...doc.data(),
        } as Bid);
      });
      callback(bids);
    },
    (error) => {
      console.error("[BidService] Subscription error:", error);
    }
  );
}

export async function deleteBid(auctionId: string, bidId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Obtener las 2 mejores pujas actuales
    const bidsRef = collection(db, BIDS_COLLECTION);
    const q = query(bidsRef, where("auctionId", "==", auctionId), orderBy("amount", "desc"), limit(2));
    const querySnapshot = await getDocs(q);
    const topBids = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bid));

    await runTransaction(db, async (transaction) => {
      const bidRef = doc(db, BIDS_COLLECTION, bidId);
      const auctionRef = doc(db, AUCTIONS_COLLECTION, auctionId);
      
      const bidSnap = await transaction.get(bidRef);
      const auctionSnap = await transaction.get(auctionRef);

      if (!bidSnap.exists()) throw new Error("Puja no encontrada");
      if (!auctionSnap.exists()) throw new Error("Subasta no encontrada");

      const bid = bidSnap.data() as Bid;
      const auction = { id: auctionSnap.id, ...auctionSnap.data() } as Auction;

      if (bid.bidderId !== userId) throw new Error("No tienes permiso para eliminar esta puja");

      // Si estamos eliminando la puja ganadora
      if (auction.currentBid === bid.amount && auction.highestBidderId === userId) {
        
        let newTopBid = null;
        // topBids[0] debería ser la puja actual (la que borramos)
        // Por seguridad verificamos si topBids[0] es la que borramos
        if (topBids.length > 0 && topBids[0].id === bidId) {
             if (topBids.length > 1) {
               newTopBid = topBids[1];
             }
        } 
        
        // Si topBids[0] no es la que borramos, significa que la query de arriba está desactualizada
        // respecto a la transacción (alguien pujó más alto justo antes).
        // Pero si auction.currentBid COINCIDE con bid.amount, entonces la subasta DICE que somos winner.
        // Si topBids[0] no es bidId, hay una inconsistencia o raza rara. 
        // Asumiremos que si currentBid == bid.amount, RESTAURAMOS.

        if (newTopBid) {
           transaction.update(auctionRef, {
             currentBid: newTopBid.amount,
             highestBidderId: newTopBid.bidderId,
             highestBidderName: newTopBid.bidderName,
             // Si newTopBid tiene avatar, también? Auction no guarda winnerAvatar explícito siempre?
             // Auction type tiene highestBidderName.
             bidsCount: Math.max(0, auction.bidsCount - 1)
           });
        } else {
           // No quedan pujas
           transaction.update(auctionRef, {
             currentBid: auction.startingPrice,
             highestBidderId: deleteField(),
             highestBidderName: deleteField(),
             bidsCount: Math.max(0, auction.bidsCount - 1)
           });
        }
      } else {
        // Solo actualizar contador
        transaction.update(auctionRef, {
             bidsCount: Math.max(0, auction.bidsCount - 1)
        });
      }

      transaction.delete(bidRef);
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting bid:", error);
    return { success: false, error: error.message };
  }
}

export function calculateMinBid(currentBid: number): number {
  const increment = Math.max(
    currentBid * (MIN_BID_INCREMENT_PERCENT / 100),
    MIN_BID_INCREMENT_ABSOLUTE
  );
  return currentBid + increment;
}

export function formatBidAmount(amount: number): string {
  const formatted = new Intl.NumberFormat("es-CL", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
  return `$${formatted} CLP`;
}
