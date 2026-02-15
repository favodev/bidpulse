"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  Shield,
  Clock,
  User,
  ImageIcon,
  AlertCircle,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Button, Alert } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/i18n";
import { getAuction } from "@/services/auction.service";
import { getTransactionByAuction, createCheckoutSession } from "@/services/payment.service";
import { getConnectAccount } from "@/services/payment.service";
import { Auction } from "@/types/auction.types";
import { Transaction } from "@/types/payment.types";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const { t } = useLanguage();
  const auctionId = params.id as string;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [existingTransaction, setExistingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellerHasConnect, setSellerHasConnect] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);

        const auctionData = await getAuction(auctionId);
        if (!auctionData) {
          setError(t.payments?.auctionNotFound || "Subasta no encontrada");
          setLoading(false);
          return;
        }

        // Verificar que el usuario es el ganador
        if (auctionData.winnerId !== user.uid) {
          setError(t.payments?.notWinner || "Solo el ganador puede realizar el pago");
          setLoading(false);
          return;
        }

        // Verificar que la subasta terminó
        if (auctionData.status !== "ended") {
          setError(t.payments?.auctionNotEnded || "La subasta aún no ha finalizado");
          setLoading(false);
          return;
        }

        setAuction(auctionData);

        // Verificar transacción existente
        const txn = await getTransactionByAuction(auctionId);
        if (txn) {
          setExistingTransaction(txn);
          if (txn.status === "completed") {
            router.push(`/checkout/${auctionId}/success`);
            return;
          }
        }

        // Verificar si el vendedor tiene cuenta Connect
        const connectAccount = await getConnectAccount(auctionData.sellerId);
        setSellerHasConnect(connectAccount?.chargesEnabled === true);
      } catch (err) {
        console.error("Error loading checkout data:", err);
        setError(t.payments?.loadError || "Error al cargar los datos del pago");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, auctionId, router, t]);

  const handleCheckout = async () => {
    if (!auction || !user) return;

    setProcessing(true);
    setError(null);

    try {
      const result = await createCheckoutSession(auctionId, currency);

      if ("error" in result) {
        setError(result.error);
        setProcessing(false);
        return;
      }

      // Redirigir a Stripe Checkout
      window.location.href = result.sessionUrl;
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError(t.payments?.checkoutError || "Error al iniciar el proceso de pago");
      setProcessing(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <Footer />
      </>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (error && !auction) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Alert variant="error" title="Error" message={error} />
            <div className="mt-6 text-center">
              <Link href="/my-bids">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t.payments?.backToBids || "Volver a Mis Pujas"}
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!auction) return null;

  const finalPrice = auction.finalPrice || auction.currentBid;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/auction/${auctionId}`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.payments?.backToAuction || "Volver a la subasta"}
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <ShoppingCart className="w-7 h-7 text-blue-400" />
              {t.payments?.checkoutTitle || "Checkout"}
            </h1>
            <p className="text-slate-400 mt-2">
              {t.payments?.checkoutSubtitle || "Completa el pago para finalizar tu compra"}
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <Alert variant="error" message={error} onClose={() => setError(null)} />
            </div>
          )}

          {/* Transacción pendiente existente */}
          {existingTransaction && existingTransaction.status === "pending" && (
            <div className="mb-6">
              <Alert
                variant="warning"
                title={t.payments?.pendingPayment || "Pago pendiente"}
                message={
                  t.payments?.pendingPaymentDesc ||
                  "Tienes un intento de pago anterior pendiente. Puedes reintentar el pago."
                }
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* ── Resumen del artículo (3 cols) ────────────────────────── */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {t.payments?.orderSummary || "Resumen del pedido"}
                </h2>

                <div className="flex gap-4">
                  {/* Imagen */}
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                    {auction.images && auction.images.length > 0 ? (
                      <img
                        src={auction.images[0]}
                        alt={auction.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg truncate">
                      {auction.title}
                    </h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <User className="w-4 h-4" />
                        <span>
                          {t.payments?.seller || "Vendedor"}: {auction.sellerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>
                          {t.payments?.bidsCount || "Pujas"}: {auction.bidsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles del precio */}
                <div className="mt-6 pt-4 border-t border-slate-700 space-y-3">
                  <div className="flex justify-between text-slate-300">
                    <span>{t.payments?.winningBid || "Puja ganadora"}</span>
                    <span className="font-medium">{formatPrice(finalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>{t.payments?.platformFee || "Comisión plataforma"}</span>
                    <span className="text-green-400">
                      {t.payments?.free || "Gratis"}
                    </span>
                  </div>
                  <div className="flex justify-between text-white text-lg font-bold pt-3 border-t border-slate-700">
                    <span>{t.payments?.total || "Total"}</span>
                    <span className="text-blue-400">{formatPrice(finalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Info del vendedor y Connect */}
              {sellerHasConnect === false && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-300">
                        {t.payments?.sellerNotConnected || "Vendedor sin cuenta de pago"}
                      </h4>
                      <p className="text-sm text-yellow-300/70 mt-1">
                        {t.payments?.sellerNotConnectedDesc ||
                          "El vendedor aún no ha configurado su cuenta para recibir pagos. El pago se procesará y se retendrá hasta que el vendedor complete su configuración."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Panel de pago (2 cols) ───────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  {t.payments?.paymentMethod || "Método de pago"}
                </h2>

                <p className="text-sm text-slate-400 mb-6">
                  {t.payments?.stripeInfo ||
                    "Serás redirigido a Stripe para completar el pago de forma segura."}
                </p>

                {/* Badges de seguridad */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>{t.payments?.securePayment || "Pago 100% seguro"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>
                      {t.payments?.acceptedCards || "Visa, Mastercard, AMEX"}
                    </span>
                  </div>
                </div>

                {/* Botón de pago */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={processing}
                  onClick={handleCheckout}
                  leftIcon={<CreditCard className="w-5 h-5" />}
                >
                  {processing
                    ? t.payments?.processing || "Procesando..."
                    : `${t.payments?.payNow || "Pagar"} ${formatPrice(finalPrice)}`}
                </Button>

                <p className="text-xs text-slate-500 text-center mt-4">
                  {t.payments?.termsNotice ||
                    "Al realizar el pago, aceptas los términos y condiciones de BidPulse."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
