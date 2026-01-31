"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Gavel,
  Clock,
  CheckCircle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Navbar } from "@/components/layout";
import { Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { getAuctions, deleteAuction } from "@/services/auction.service";
import { Auction } from "@/types/auction.types";
import { Timestamp } from "firebase/firestore";
import { useLanguage } from "@/i18n";

type TabType = "active" | "ended" | "all";

const formatPrice = (price: number) => {
  const formatted = new Intl.NumberFormat("es-CL", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(price);
  return `$${formatted} CLP`;
};

function formatTimeRemaining(endTime: Timestamp, endedText: string): string {
  const now = new Date();
  const end = endTime.toDate();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return endedText;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function AuctionRow({
  auction,
  onDelete,
  t,
}: {
  auction: Auction;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isEnded = auction.status === "ended" || auction.endTime.toDate() < new Date();
  const timeLeft = formatTimeRemaining(auction.endTime, t.auction.ended);

  const handleDelete = async () => {
    if (!confirm(t.myAuctions.deleteConfirm)) return;
    setDeleting(true);
    try {
      await deleteAuction(auction.id);
      onDelete(auction.id);
    } catch (err) {
      console.error("Error deleting auction:", err);
      alert("Error al eliminar la subasta");
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
      <div className="flex gap-4">
        {/* Imagen */}
        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-800">
          {auction.images?.[0] ? (
            <img
              src={auction.images[0]}
              alt={auction.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gavel className="w-8 h-8 text-slate-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-white truncate">{auction.title}</h3>
              <p className="text-slate-500 text-sm truncate">{auction.description}</p>
            </div>

            {/* Menu de acciones */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1">
                    <Link
                      href={`/auction/${auction.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      {t.myAuctions.view}
                    </Link>
                    {!isEnded && (
                      <Link
                        href={`/auction/${auction.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        {t.myAuctions.edit}
                      </Link>
                    )}
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      {deleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {t.myAuctions.delete}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">{t.auction.currentBid}:</span>
              <span className="text-emerald-400 font-semibold">
                {formatPrice(auction.currentBid)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gavel className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">{auction.bidsCount} {t.auction.bids}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className={isEnded ? "text-slate-500" : "text-slate-400"}>
                {timeLeft}
              </span>
            </div>
          </div>
        </div>

        {/* Estado */}
        <div className="shrink-0">
          {isEnded ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-full">
              <CheckCircle className="w-3 h-3" />
              {t.auction.ended}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {t.myAuctions.activeStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyAuctionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadAuctions() {
      if (!user) return;

      try {
        const data = await getAuctions({
          sellerId: user.uid,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        setAuctions(data);
      } catch (err) {
        console.error("Error loading auctions:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadAuctions();
    }
  }, [user]);

  const handleDelete = (id: string) => {
    setAuctions((prev) => prev.filter((a) => a.id !== id));
  };

  const filteredAuctions = auctions.filter((auction) => {
    const isEnded = auction.status === "ended" || auction.endTime.toDate() < new Date();
    if (activeTab === "active") return !isEnded;
    if (activeTab === "ended") return isEnded;
    return true;
  });

  const activeCount = auctions.filter(
    (a) => a.status !== "ended" && a.endTime.toDate() >= new Date()
  ).length;
  const endedCount = auctions.length - activeCount;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{t.myAuctions.title}</h1>
          <p className="text-slate-500 mt-1">
            {t.myAuctions.subtitle}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {t.myAuctions.all} ({auctions.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "active"
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {t.myAuctions.active} ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab("ended")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "ended"
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {t.myAuctions.ended} ({endedCount})
          </button>
        </div>

        {/* Lista de subastas */}
        {filteredAuctions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            {activeTab === "all" ? (
              <>
                <Gavel className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t.myAuctions.noAuctions}
                </h3>
                <p className="text-slate-500 mb-6">
                  {t.myAuctions.createFirst}
                </p>
                <Link href="/auction/create">
                  <Button>
                    {t.myAuctions.createFirstButton}
                  </Button>
                </Link>
              </>
            ) : activeTab === "active" ? (
              <>
                <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t.myAuctions.noActiveAuctions}
                </h3>
                <p className="text-slate-500">
                  {t.myAuctions.noActiveDesc}
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t.myAuctions.noEndedAuctions}
                </h3>
                <p className="text-slate-500">
                  {t.myAuctions.noEndedDesc}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAuctions.map((auction) => (
              <AuctionRow
                key={auction.id}
                auction={auction}
                onDelete={handleDelete}
                t={t}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
