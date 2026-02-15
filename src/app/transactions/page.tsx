"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Filter,
  ImageIcon,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/i18n";
import {
  getTransactions,
  getTransactionStats,
} from "@/services/payment.service";
import { Transaction, PaymentStatus, TransactionStats } from "@/types/payment.types";

const STATUS_CONFIG: Record<
  PaymentStatus,
  { icon: typeof CheckCircle; color: string; bg: string }
> = {
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  processing: { icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-400/10" },
  completed: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" },
  refunded: { icon: RefreshCw, color: "text-purple-400", bg: "bg-purple-400/10" },
  cancelled: { icon: XCircle, color: "text-slate-400", bg: "bg-slate-400/10" },
};

export default function TransactionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "purchases" | "sales">("all");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");

  useEffect(() => {
    async function loadTransactions() {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);

        // Cargar compras y ventas en paralelo
        const [purchases, sales, txnStats] = await Promise.all([
          getTransactions({ userId: user.uid, role: "buyer" }),
          getTransactions({ userId: user.uid, role: "seller" }),
          getTransactionStats(user.uid),
        ]);

        // Combinar y deduplicar
        const allMap = new Map<string, Transaction & { txnRole: "buyer" | "seller" }>();
        purchases.forEach((t) => allMap.set(t.id, { ...t, txnRole: "buyer" as const }));
        sales.forEach((t) => {
          if (!allMap.has(t.id)) {
            allMap.set(t.id, { ...t, txnRole: "seller" as const });
          }
        });

        const all = Array.from(allMap.values()).sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setTransactions(all);
        setStats(txnStats);
      } catch (err) {
        console.error("Error loading transactions:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, [user, router]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (activeTab === "purchases") {
      filtered = filtered.filter((t) => t.buyerId === user?.uid);
    } else if (activeTab === "sales") {
      filtered = filtered.filter((t) => t.sellerId === user?.uid);
    }

    if (statusFilter) {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    return filtered;
  }, [transactions, activeTab, statusFilter, user]);

  const formatDate = (timestamp: { seconds: number } | null) => {
    if (!timestamp) return "—";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: PaymentStatus): string => {
    const labels: Record<PaymentStatus, string> = {
      pending: t.payments?.statusPending || "Pendiente",
      processing: t.payments?.statusProcessing || "Procesando",
      completed: t.payments?.statusCompleted || "Completado",
      failed: t.payments?.statusFailed || "Fallido",
      refunded: t.payments?.statusRefunded || "Reembolsado",
      cancelled: t.payments?.statusCancelled || "Cancelado",
    };
    return labels[status];
  };

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

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Receipt className="w-7 h-7 text-blue-400" />
              {t.payments?.transactionsTitle || "Historial de Transacciones"}
            </h1>
            <p className="text-slate-400 mt-2">
              {t.payments?.transactionsSubtitle || "Revisa todas tus compras y ventas"}
            </p>
          </div>

          {/* Stat Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  {t.payments?.totalTransactions || "Transacciones"}
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalTransactions}</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  {t.payments?.totalSpent || "Total gastado"}
                </div>
                <p className="text-2xl font-bold text-red-400">{formatPrice(stats.totalSpent)}</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  {t.payments?.totalEarned || "Total ganado"}
                </div>
                <p className="text-2xl font-bold text-green-400">{formatPrice(stats.totalEarned)}</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  {t.payments?.pendingPaymentsCount || "Pendientes"}
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats.pendingPayments}</p>
              </div>
            </div>
          )}

          {/* Tabs y filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex bg-slate-900/50 border border-slate-800 rounded-lg p-1">
              {(["all", "purchases", "sales"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "all"
                    ? t.payments?.tabAll || "Todas"
                    : tab === "purchases"
                      ? t.payments?.tabPurchases || "Compras"
                      : t.payments?.tabSales || "Ventas"}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "")}
              className="bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">{t.payments?.allStatuses || "Todos los estados"}</option>
              <option value="pending">{t.payments?.statusPending || "Pendiente"}</option>
              <option value="completed">{t.payments?.statusCompleted || "Completado"}</option>
              <option value="failed">{t.payments?.statusFailed || "Fallido"}</option>
              <option value="refunded">{t.payments?.statusRefunded || "Reembolsado"}</option>
            </select>
          </div>

          {/* Lista de transacciones */}
          {filteredTransactions.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
              <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {t.payments?.noTransactions || "Sin transacciones"}
              </h3>
              <p className="text-slate-400">
                {t.payments?.noTransactionsDesc ||
                  "Aún no tienes transacciones. Cuando ganes una subasta, podrás realizar el pago aquí."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((txn) => {
                const isBuyer = txn.buyerId === user.uid;
                const statusConf = STATUS_CONFIG[txn.status];
                const StatusIcon = statusConf.icon;

                return (
                  <Link key={txn.id} href={`/auction/${txn.auctionId}`}>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Imagen */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                          {txn.auctionImage ? (
                            <img
                              src={txn.auctionImage}
                              alt={txn.auctionTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-slate-600" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium truncate">
                              {txn.auctionTitle}
                            </span>
                            {isBuyer ? (
                              <span className="shrink-0 inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
                                <ArrowUpRight className="w-3 h-3" />
                                {t.payments?.purchase || "Compra"}
                              </span>
                            ) : (
                              <span className="shrink-0 inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
                                <ArrowDownLeft className="w-3 h-3" />
                                {t.payments?.sale || "Venta"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span>
                              {isBuyer
                                ? `${t.payments?.seller || "Vendedor"}: ${txn.sellerName}`
                                : `${t.payments?.buyer || "Comprador"}: ${txn.buyerName}`}
                            </span>
                            <span>·</span>
                            <span>{formatDate(txn.createdAt)}</span>
                          </div>
                        </div>

                        {/* Monto y estado */}
                        <div className="text-right shrink-0">
                          <p
                            className={`text-lg font-bold ${
                              isBuyer ? "text-red-400" : "text-green-400"
                            }`}
                          >
                            {isBuyer ? "-" : "+"}
                            {formatPrice(isBuyer ? txn.amount : txn.sellerAmount)}
                          </p>
                          <div
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusConf.bg} ${statusConf.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {getStatusLabel(txn.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
