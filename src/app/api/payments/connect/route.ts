import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

/**
 * POST /api/payments/connect
 * Crea o recupera una cuenta de Stripe Connect para el vendedor
 * y devuelve el enlace de onboarding.
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
    const userId = decoded.uid;

    // ── Verificar si ya tiene cuenta Connect ─────────────────────────
    const existingSnap = await db
      .collection("connect_accounts")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    let stripeAccountId: string;

    if (!existingSnap.empty) {
      // Ya existe una cuenta, recuperar
      stripeAccountId = existingSnap.docs[0].data().providerAccountId;

      // Verificar que la cuenta aún exista en Stripe
      try {
        await stripe.accounts.retrieve(stripeAccountId);
      } catch {
        // La cuenta no existe en Stripe, crear una nueva
        const newAccount = await stripe.accounts.create({
          type: "express",
          email: decoded.email || undefined,
          metadata: { userId, platform: "bidpulse" },
        });
        stripeAccountId = newAccount.id;

        // Actualizar en Firestore
        await existingSnap.docs[0].ref.update({
          providerAccountId: stripeAccountId,
          status: "pending",
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
          updatedAt: Timestamp.now(),
        });
      }
    } else {
      // Crear nueva cuenta en Stripe
      const account = await stripe.accounts.create({
        type: "express",
        email: decoded.email || undefined,
        metadata: { userId, platform: "bidpulse" },
      });
      stripeAccountId = account.id;

      // Guardar en Firestore
      await db.collection("connect_accounts").add({
        userId,
        provider: "stripe",
        providerAccountId: stripeAccountId,
        status: "pending",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    // ── Crear enlace de onboarding ───────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/settings?tab=payments&refresh=true`,
      return_url: `${appUrl}/settings?tab=payments&connect=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      accountId: stripeAccountId,
      onboardingUrl: accountLink.url,
    });
  } catch (error) {
    console.error("[Payments] Error creating connect account:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
