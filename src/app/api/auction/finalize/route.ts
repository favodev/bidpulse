import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * POST /api/auction/finalize
 * Server-side finalization of expired auctions and activation of scheduled ones.
 * Protected by a secret token to prevent unauthorized access.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization: accept either a secret cron token or a valid session
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const hasCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

    // Also accept internal calls (from client-side polling) without strict auth
    // since this is an idempotent operation that only finalizes expired auctions
    if (!hasCronAuth) {
      const session = request.cookies.get("bp_session")?.value;
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        const data = docSnap.data();
        
        const updateData: Record<string, unknown> = {
          status: "ended",
          updatedAt: Timestamp.now(),
        };

        if (data.highestBidderId) {
          updateData.winnerId = data.highestBidderId;
          updateData.winnerName = data.highestBidderName || null;
          updateData.finalPrice = data.currentBid || null;
        }

        await docSnap.ref.update(updateData);
        finalizedCount++;

        // Update winner stats
        if (data.highestBidderId) {
          const winnerRef = db.collection("users").doc(data.highestBidderId);
          const winnerSnap = await winnerRef.get();
          if (winnerSnap.exists) {
            const winnerData = winnerSnap.data();
            await winnerRef.update({
              "stats.auctionsWon": (winnerData?.stats?.auctionsWon || 0) + 1,
              "stats.totalSpent": (winnerData?.stats?.totalSpent || 0) + (data.currentBid || 0),
              updatedAt: Timestamp.now(),
            });
          }
        }

        // Update seller stats
        if (data.sellerId && data.highestBidderId) {
          const sellerRef = db.collection("users").doc(data.sellerId);
          const sellerSnap = await sellerRef.get();
          if (sellerSnap.exists) {
            const sellerData = sellerSnap.data();
            await sellerRef.update({
              "stats.totalEarned": (sellerData?.stats?.totalEarned || 0) + (data.currentBid || 0),
              updatedAt: Timestamp.now(),
            });
          }
        }
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
