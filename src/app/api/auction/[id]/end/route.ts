import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const cookieToken = request.cookies.get("bp_session")?.value || null;
    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();
    const decoded = await auth.verifyIdToken(token);

    // Use a transaction to atomically end the auction and update stats
    await db.runTransaction(async (transaction) => {
      const docRef = db.collection("auctions").doc(id);
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists) {
        throw new Error("Auction not found");
      }

      const data = docSnap.data();
      if (!data) {
        throw new Error("Auction not found");
      }

      if (data.sellerId !== decoded.uid || data.status !== "active") {
        throw new Error("Forbidden");
      }

      transaction.update(docRef, {
        status: "ended",
        endTime: Timestamp.now(),
        winnerId: data.highestBidderId || null,
        winnerName: data.highestBidderName || null,
        finalPrice: data.currentBid || null,
        updatedAt: Timestamp.now(),
      });

      // Update winner stats if there is a winner
      if (data.highestBidderId) {
        const winnerRef = db.collection("users").doc(data.highestBidderId);
        transaction.update(winnerRef, {
          "stats.auctionsWon": FieldValue.increment(1),
          "stats.totalSpent": FieldValue.increment(data.currentBid || 0),
          updatedAt: Timestamp.now(),
        });

        // Update seller stats
        const sellerRef = db.collection("users").doc(data.sellerId);
        transaction.update(sellerRef, {
          "stats.totalEarned": FieldValue.increment(data.currentBid || 0),
          updatedAt: Timestamp.now(),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Forbidden" ? 403 : message === "Auction not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
