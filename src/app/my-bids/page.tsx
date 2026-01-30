"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Gavel,
  Clock,
  Trophy,
  TrendingUp,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { getUserBids } from "@/services/bid.service";
import { getAuction } from "@/services/auction.service";
import { Bid } from "@/types/bid.types";
import { Auction } from "@/types/auction.types";
import { Timestamp } from "firebase/firestore";

type TabType = "active" | "won" | "outbid" | "all";

interface BidWithAuction extends Bid {
  auction?: Auction;
}

const formatPrice = (price: number) => {
  const formatted = new Intl.NumberFormat("es-CL", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(price);
  return `$${formatted} CLP`;
};

function formatTimeRemaining(endTime: Timestamp): string {
  const now = new Date();
  const end = endTime.toDate();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Finalizada";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function BidCard({ bid }: { bid: BidWithAuction }) {
  const auction = bid.auction;
  if (!auction) return null;

  const isEnded = auction.status === "ended" || auction.endTime.toDate() < new Date();
  const isWinning = auction.highestBidderId === bid.bidderId;
  const hasWon = isEnded && isWinning;
  const wasOutbid = !isWinning && !isEnded;
  const lostAuction = isEnded && !isWinning;

  const getStatusBadge = () => {
    if (hasWon) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
          <Trophy className="w-3 h-3" />
          Ganaste
        </span>
      );
    }
    if (isWinning) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
          <TrendingUp className="w-3 h-3" />
          Puja más alta
        </span>
      );
    }
    if (wasOutbid) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
          <AlertCircle className="w-3 h-3" />
          Superada
        </span>
      );
    }
    if (lostAuction) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
          <AlertCircle className="w-3 h-3" />
          No ganaste
        </span>
      );
    }
    return null;
  };

  return (
    <div className={`bg-slate-900 border rounded-xl p-4 transition-colors ${
      hasWon ? 'border-emerald-500/50 bg-emerald-500/5' : 
      wasOutbid ? 'border-amber-500/50' : 
      'border-slate-800 hover:border-slate-700'
    }`}>
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white truncate">{auction.title}</h3>
                {getStatusBadge()}
              </div>
              <p className="text-slate-500 text-sm truncate">{auction.description}</p>
            </div>

            {/* Ver subasta */}
            <Link
              href={`/auction/${auction.id}`}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            >
              <Eye className="w-5 h-5" />
            </Link>
          </div>

          {/* Detalles de puja */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="text-slate-500">Tu puja:</span>
              <span className="ml-1 font-semibold text-white">{formatPrice(bid.amount)}</span>
            </div>
            <div>
              <span className="text-slate-500">Puja actual:</span>
              <span className={`ml-1 font-semibold ${isWinning ? 'text-emerald-400' : 'text-amber-400'}`}>
                {formatPrice(auction.currentBid)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className={isEnded ? "text-red-400" : "text-slate-400"}>
                {formatTimeRemaining(auction.endTime)}
              </span>
            </div>
          </div>

          {/* Call to action si fue superada */}
          {wasOutbid && (
            <div className="mt-3">
              <Link
                href={`/auction/${auction.id}`}
                className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Pujar de nuevo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyBidsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bids, setBids] = useState<BidWithAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("active");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadBids() {
      if (!user) return;

      setLoading(true);
      try {
        // Obtener todas las pujas del usuario
        const userBids = await getUserBids(user.uid, 100);

        // Agrupar por subasta
        const bidsByAuction = new Map<string, Bid>();
        userBids.forEach((bid) => {
          const existing = bidsByAuction.get(bid.auctionId);
          if (!existing || bid.amount > existing.amount) {
            bidsByAuction.set(bid.auctionId, bid);
          }
        });

        // Cargar info de cada subasta
        const bidsWithAuctions: BidWithAuction[] = [];
        for (const [auctionId, bid] of bidsByAuction.entries()) {
          try {
            const auction = await getAuction(auctionId);
            if (auction) {
              bidsWithAuctions.push({ ...bid, auction });
            }
          } catch (err) {
            console.error(`Error loading auction ${auctionId}:`, err);
          }
        }

        // Ordenar por fecha de fin (más próximas primero)
        bidsWithAuctions.sort((a, b) => {
          const aEnd = a.auction?.endTime.toMillis() || 0;
          const bEnd = b.auction?.endTime.toMillis() || 0;
          return aEnd - bEnd;
        });

        setBids(bidsWithAuctions);
      } catch (err) {
        console.error("Error loading bids:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBids();
  }, [user]);

  // Filtrar por tab
  const getFilteredBids = () => {
    const now = new Date();

    return bids.filter((bid) => {
      const auction = bid.auction;
      if (!auction) return false;

      const isEnded = auction.status === "ended" || auction.endTime.toDate() < now;
      const isWinning = auction.highestBidderId === bid.bidderId;

      switch (activeTab) {
        case "active":
          return !isEnded && isWinning;
        case "won":
          return isEnded && isWinning;
        case "outbid":
          return !isEnded && !isWinning;
        case "all":
        default:
          return true;
      }
    });
  };

  const filteredBids = getFilteredBids();

  // Contar para badges
  const counts = {
    active: bids.filter((b) => {
      const isEnded = b.auction?.status === "ended" || (b.auction?.endTime.toDate() || new Date()) < new Date();
      return !isEnded && b.auction?.highestBidderId === b.bidderId;
    }).length,
    won: bids.filter((b) => {
      const isEnded = b.auction?.status === "ended" || (b.auction?.endTime.toDate() || new Date()) < new Date();
      return isEnded && b.auction?.highestBidderId === b.bidderId;
    }).length,
    outbid: bids.filter((b) => {
      const isEnded = b.auction?.status === "ended" || (b.auction?.endTime.toDate() || new Date()) < new Date();
      return !isEnded && b.auction?.highestBidderId !== b.bidderId;
    }).length,
    all: bids.length,
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "active", label: "Ganando", icon: <TrendingUp className="w-4 h-4" />, count: counts.active },
    { id: "outbid", label: "Superadas", icon: <AlertCircle className="w-4 h-4" />, count: counts.outbid },
    { id: "won", label: "Ganadas", icon: <Trophy className="w-4 h-4" />, count: counts.won },
    { id: "all", label: "Todas", icon: <Gavel className="w-4 h-4" />, count: counts.all },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Mis Pujas</h1>
          <p className="text-slate-400">
            Gestiona las subastas en las que has participado
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <Gavel className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {activeTab === "active" && "No tienes pujas activas ganando"}
              {activeTab === "won" && "Aún no has ganado ninguna subasta"}
              {activeTab === "outbid" && "No tienes pujas superadas"}
              {activeTab === "all" && "No has realizado ninguna puja"}
            </h3>
            <p className="text-slate-500 mb-6">
              {activeTab === "all" 
                ? "Explora las subastas disponibles y comienza a pujar"
                : "Explora las subastas disponibles"}
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              <Gavel className="w-5 h-5" />
              Explorar Subastas
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBids.map((bid) => (
              <BidCard key={`${bid.auctionId}-${bid.id}`} bid={bid} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
