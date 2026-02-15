import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

/**
 * POST /api/payments/connect/dashboard
 * Genera un enlace al dashboard de Stripe Express para el vendedor.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookieToken = request.cookies.get("bp_session")?.value || null;
    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();
    const decoded = await auth.verifyIdToken(token);

    // Buscar cuenta Connect
    const connectSnap = await db
      .collection("connect_accounts")
      .where("userId", "==", decoded.uid)
      .limit(1)
      .get();

    if (connectSnap.empty) {
      return NextResponse.json({ error: "No connect account found" }, { status: 404 });
    }

    const accountId = connectSnap.docs[0].data().providerAccountId;

    const loginLink = await stripe.accounts.createLoginLink(accountId);

    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    console.error("[Payments] Error creating dashboard link:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
