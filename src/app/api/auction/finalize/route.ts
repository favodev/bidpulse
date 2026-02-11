import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const hasCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!hasCronAuth) {
      // Require authenticated session
      const session = request.cookies.get("bp_session")?.value;
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verify the session belongs to an admin or valid user
      try {
        const auth = getAdminAuth();
        await auth.verifyIdToken(session);
      } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }
    }

    const db = getAdminDb();
    const now = Timestamp.now();
    let finalizedCount = 0;
    let activatedCount = 0;

    // 1. Finalize expired active auctions
    const expiredQuery = db
      .collection("auctions")
      .where("status", "==", "active")
      .where("endTime", "<=", now)
      .limit(50);

    const expiredSnap = await expiredQuery.get();

    for (const docSnap of expiredSnap.docs) {
      try {
        // Use a transaction to atomically finalize and update stats
        await db.runTransaction(async (transaction) => {
          const auctionRef = docSnap.ref;
          const auctionSnap = await transaction.get(auctionRef);
          const data = auctionSnap.data();
          if (!data || data.status !== "active") return; // Already finalized

          const updateData: Record<string, unknown> = {
            status: "ended",
            updatedAt: Timestamp.now(),
          };

          if (data.highestBidderId) {
            updateData.winnerId = data.highestBidderId;
            updateData.winnerName = data.highestBidderName || null;
            updateData.finalPrice = data.currentBid || null;
          }

          transaction.update(auctionRef, updateData);

          // Update winner stats atomically with FieldValue.increment
          if (data.highestBidderId) {
            const winnerRef = db.collection("users").doc(data.highestBidderId);
            transaction.update(winnerRef, {
              "stats.auctionsWon": FieldValue.increment(1),
              "stats.totalSpent": FieldValue.increment(data.currentBid || 0),
              updatedAt: Timestamp.now(),
            });
          }

          // Update seller stats atomically with FieldValue.increment
          if (data.sellerId && data.highestBidderId) {
            const sellerRef = db.collection("users").doc(data.sellerId);
            transaction.update(sellerRef, {
              "stats.totalEarned": FieldValue.increment(data.currentBid || 0),
              updatedAt: Timestamp.now(),
            });
          }
        });

        finalizedCount++;
      } catch (err) {
        console.error(`[FinalizeAPI] Failed to finalize ${docSnap.id}:`, err);
      }
    }

    // 2. Activate scheduled auctions whose start time has passed
    const scheduledQuery = db
      .collection("auctions")
      .where("status", "==", "scheduled")
      .where("startTime", "<=", now)
      .limit(50);

    const scheduledSnap = await scheduledQuery.get();

    for (const docSnap of scheduledSnap.docs) {
      try {
        await docSnap.ref.update({
          status: "active",
          updatedAt: Timestamp.now(),
        });
        activatedCount++;
      } catch (err) {
        console.error(`[FinalizeAPI] Failed to activate ${docSnap.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      finalized: finalizedCount,
      activated: activatedCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
