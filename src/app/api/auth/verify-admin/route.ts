import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/auth/verify-admin
 * Verifies the session cookie and checks if the user is admin.
 * Used by middleware for admin route protection.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("bp_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();
    const decoded = await auth.verifyIdToken(token);

    // Check admin status in Firestore
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, uid: decoded.uid });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
