import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/payments/webhook
 * Recibe eventos de Stripe y actualiza transacciones en Firestore.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      console.error("[Webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const db = getAdminDb();

    switch (event.type) {
      // ── Pago completado ────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { auctionId, buyerId, sellerId } = session.metadata || {};

        if (!auctionId) break;

        // Actualizar transacción
        const txnSnap = await db
          .collection("transactions")
          .where("providerSessionId", "==", session.id)
          .limit(1)
          .get();

        if (!txnSnap.empty) {
          const txnRef = txnSnap.docs[0].ref;
          await txnRef.update({
            status: "completed",
            providerPaymentId: session.payment_intent as string,
            completedAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }

        // Marcar subasta como pagada
        const auctionRef = db.collection("auctions").doc(auctionId);
        await auctionRef.update({
          paymentStatus: "paid",
          paymentCompletedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Crear notificaciones
        if (buyerId) {
          await db.collection("notifications").add({
            userId: buyerId,
            type: "payment_confirmed",
            title: "Pago confirmado",
            message: `Tu pago por la subasta ha sido procesado exitosamente.`,
            data: { auctionId },
            read: false,
            sent: false,
            createdAt: Timestamp.now(),
          });
        }

        if (sellerId) {
          await db.collection("notifications").add({
            userId: sellerId,
            type: "payment_received",
            title: "Pago recibido",
            message: `Has recibido un pago por tu subasta.`,
            data: { auctionId },
            read: false,
            sent: false,
            createdAt: Timestamp.now(),
          });
        }

        break;
      }

      // ── Pago fallido ───────────────────────────────────────────────
      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        let sessionId: string | undefined;
        let errorMessage: string = "Payment failed";

        if (event.type === "checkout.session.expired") {
          sessionId = (event.data.object as Stripe.Checkout.Session).id;
          errorMessage = "Payment session expired";
        } else {
          const pi = event.data.object as Stripe.PaymentIntent;
          errorMessage = pi.last_payment_error?.message || "Payment failed";
          // Buscar la transacción por payment intent
          const txnByPI = await db
            .collection("transactions")
            .where("providerPaymentId", "==", pi.id)
            .limit(1)
            .get();
          if (!txnByPI.empty) {
            await txnByPI.docs[0].ref.update({
              status: "failed",
              statusMessage: errorMessage,
              updatedAt: Timestamp.now(),
            });
          }
          break;
        }

        if (sessionId) {
          const txnSnap = await db
            .collection("transactions")
            .where("providerSessionId", "==", sessionId)
            .limit(1)
            .get();

          if (!txnSnap.empty) {
            await txnSnap.docs[0].ref.update({
              status: "failed",
              statusMessage: errorMessage,
              updatedAt: Timestamp.now(),
            });
          }
        }
        break;
      }

      // ── Reembolso ──────────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          const txnSnap = await db
            .collection("transactions")
            .where("providerPaymentId", "==", paymentIntentId)
            .limit(1)
            .get();

          if (!txnSnap.empty) {
            const txnRef = txnSnap.docs[0].ref;
            const txnData = txnSnap.docs[0].data();
            await txnRef.update({
              status: "refunded",
              refundedAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });

            // Notificar al comprador
            if (txnData.buyerId) {
              await db.collection("notifications").add({
                userId: txnData.buyerId,
                type: "payment_refunded",
                title: "Reembolso procesado",
                message: `Tu pago por la subasta "${txnData.auctionTitle}" ha sido reembolsado.`,
                data: { auctionId: txnData.auctionId },
                read: false,
                sent: false,
                createdAt: Timestamp.now(),
              });
            }
          }
        }
        break;
      }

      // ── Actualización de cuenta Connect ────────────────────────────
      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        const connectSnap = await db
          .collection("connect_accounts")
          .where("providerAccountId", "==", account.id)
          .limit(1)
          .get();

        if (!connectSnap.empty) {
          const connectRef = connectSnap.docs[0].ref;
          await connectRef.update({
            chargesEnabled: account.charges_enabled || false,
            payoutsEnabled: account.payouts_enabled || false,
            detailsSubmitted: account.details_submitted || false,
            status: account.charges_enabled
              ? "active"
              : account.details_submitted
                ? "restricted"
                : "pending",
            updatedAt: Timestamp.now(),
          });
        }
        break;
      }

      default:
        // Evento no manejado
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
