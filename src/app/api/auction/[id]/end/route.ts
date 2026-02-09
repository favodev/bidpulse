import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

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

    const docRef = db.collection("auctions").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    const data = docSnap.data();
    if (!data) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (data.sellerId !== decoded.uid || data.status !== "active") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await docRef.update({
      status: "ended",
      endTime: Timestamp.now(),
      winnerId: data.highestBidderId || null,
      winnerName: data.highestBidderName || null,
      finalPrice: data.currentBid || null,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
