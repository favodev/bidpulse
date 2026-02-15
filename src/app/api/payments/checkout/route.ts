import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

/**
 * POST /api/payments/checkout
 * Crea una sesión de Stripe Checkout para una subasta ganada.
 * Body: { auctionId: string, currency: string }
 */
export async function POST(request: NextRequest) {
  try {
    // ── Autenticación ────────────────────────────────────────────────
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
    const buyerId = decoded.uid;

    // ── Parsear body ─────────────────────────────────────────────────
    const { auctionId, currency = "clp" } = await request.json();

    if (!auctionId) {
      return NextResponse.json({ error: "auctionId is required" }, { status: 400 });
    }

    // ── Validar subasta ──────────────────────────────────────────────
    const auctionRef = db.collection("auctions").doc(auctionId);
    const auctionSnap = await auctionRef.get();

    if (!auctionSnap.exists) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    const auction = auctionSnap.data()!;

    // Solo el ganador puede pagar
    if (auction.winnerId !== buyerId) {
      return NextResponse.json({ error: "Only the auction winner can pay" }, { status: 403 });
    }

    // Solo subastas finalizadas
    if (auction.status !== "ended") {
      return NextResponse.json({ error: "Auction is not ended" }, { status: 400 });
    }

    // Verificar que no exista ya una transacción completada
    const existingTxn = await db
      .collection("transactions")
      .where("auctionId", "==", auctionId)
      .where("status", "==", "completed")
      .limit(1)
      .get();

    if (!existingTxn.empty) {
      return NextResponse.json({ error: "This auction has already been paid" }, { status: 400 });
    }

    // ── Verificar cuenta Connect del vendedor ────────────────────────
    const connectSnap = await db
      .collection("connect_accounts")
      .where("userId", "==", auction.sellerId)
      .where("chargesEnabled", "==", true)
      .limit(1)
      .get();

    let stripeAccountId: string | null = null;
    if (!connectSnap.empty) {
      stripeAccountId = connectSnap.docs[0].data().providerAccountId;
    }

    // ── Calcular montos ──────────────────────────────────────────────
    const amount = auction.finalPrice || auction.currentBid;
    const platformFee = 0; // Sin comisión por ahora
    const sellerAmount = amount - platformFee;

    // Stripe requiere montos en la unidad más pequeña
    const currencyLower = currency.toLowerCase();
    const isZeroDecimal = ["clp", "jpy", "krw", "vnd"].includes(currencyLower);
    const stripeAmount = isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);

    // ── Crear Stripe Checkout Session ────────────────────────────────
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currencyLower,
            product_data: {
              name: auction.title,
              description: `Subasta ganada en BidPulse — ${auction.title}`,
              images: auction.images?.length > 0 ? [auction.images[0]] : [],
            },
            unit_amount: stripeAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${auctionId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${auctionId}`,
      metadata: {
        auctionId,
        buyerId,
        sellerId: auction.sellerId,
        amount: amount.toString(),
        currency: currencyLower,
      },
      customer_email: decoded.email || undefined,
    };

    // Si el vendedor tiene cuenta Connect, usar split payment
    if (stripeAccountId) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: stripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // ── Crear transacción en Firestore (pendiente) ───────────────────
    await db.collection("transactions").add({
      auctionId,
      auctionTitle: auction.title,
      auctionImage: auction.images?.[0] || null,
      buyerId,
      buyerName: decoded.name || decoded.email || "Comprador",
      sellerId: auction.sellerId,
      sellerName: auction.sellerName || "Vendedor",
      amount,
      currency: currencyLower,
      platformFee,
      sellerAmount,
      provider: "stripe",
      providerSessionId: session.id,
      providerPaymentId: null,
      providerTransferId: null,
      status: "pending",
      statusMessage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      completedAt: null,
      refundedAt: null,
    });

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error("[Payments] Error creating checkout session:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
