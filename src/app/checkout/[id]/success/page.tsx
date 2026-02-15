"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Package,
  MessageCircle,
  Star,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/i18n";
import { getAuction } from "@/services/auction.service";
import { getTransactionByAuction } from "@/services/payment.service";
import { Auction } from "@/types/auction.types";
import { Transaction } from "@/types/payment.types";

export default function CheckoutSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const auctionId = params.id as string;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [auctionData, txnData] = await Promise.all([
          getAuction(auctionId),
          getTransactionByAuction(auctionId),
        ]);
        setAuction(auctionData);
        setTransaction(txnData);
      } catch (err) {
        console.error("Error loading success data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [auctionId]);

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

  const finalPrice = auction?.finalPrice || auction?.currentBid || 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icono de éxito */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              {t.payments?.successTitle || "¡Pago exitoso!"}
            </h1>
            <p className="text-slate-400 mt-2">
              {t.payments?.successSubtitle ||
                "Tu pago ha sido procesado correctamente. El vendedor será notificado."}
            </p>
          </div>

          {/* Resumen de la compra */}
          {auction && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-left mb-8">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                  {auction.images && auction.images.length > 0 ? (
                    <img
                      src={auction.images[0]}
                      alt={auction.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{auction.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {t.payments?.seller || "Vendedor"}: {auction.sellerName}
                  </p>
                  <p className="text-lg font-bold text-blue-400 mt-2">
                    {formatPrice(finalPrice)}
                  </p>
                </div>
              </div>

              {transaction && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">
                        {t.payments?.transactionId || "ID Transacción"}
                      </span>
                      <p className="text-white font-mono text-xs mt-0.5">
                        {transaction.id.slice(0, 16)}...
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">
                        {t.payments?.status || "Estado"}
                      </span>
                      <p className="text-green-400 font-medium mt-0.5">
                        {t.payments?.statusCompleted || "Completado"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Acciones siguientes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {t.payments?.whatsNext || "¿Qué sigue?"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href={`/auction/${auctionId}`} className="block">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors">
                  <Package className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">
                    {t.payments?.viewAuction || "Ver subasta"}
                  </p>
                </div>
              </Link>

              {auction && (
                <Link href={`/users/${auction.sellerId}`} className="block">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors">
                    <MessageCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">
                      {t.payments?.contactSeller || "Contactar vendedor"}
                    </p>
                  </div>
                </Link>
              )}

              {auction && (
                <Link
                  href={`/reviews/create?auctionId=${auctionId}&sellerId=${auction.sellerId}`}
                  className="block"
                >
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors">
                    <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">
                      {t.payments?.leaveReview || "Dejar reseña"}
                    </p>
                  </div>
                </Link>
              )}
            </div>

            <div className="pt-4">
              <Link href="/transactions">
                <Button variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  {t.payments?.viewTransactions || "Ver historial de transacciones"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
