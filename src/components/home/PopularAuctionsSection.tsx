"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Loader2, ArrowRight } from "lucide-react";
import { getPopularAuctions } from "@/services/auction.service";
import { Auction } from "@/types/auction.types";
import { Timestamp } from "firebase/firestore";
import { useLanguage } from "@/i18n";
import { useCurrency } from "@/hooks/useCurrency";

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

function PopularAuctionCard({ auction, t, formatPrice }: { auction: Auction; t: ReturnType<typeof useLanguage>['t']; formatPrice: (amount: number) => string }) {
  const [isLiked, setIsLiked] = useState(false);
  const timeLeft = formatTimeRemaining(auction.endTime, t.auction.ended);

  return (
    <Link
      href={`/auction/${auction.id}`}
      className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all hover:scale-[1.02]"
    >
      {/* Imagen */}
      <div className="relative aspect-square bg-slate-800">
        {auction.images?.[0] ? (
          <img
            src={auction.images[0]}
            alt={auction.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-500">
            No image
          </div>
        )}

        {/* Badge de pujas */}
        <div className="absolute bottom-3 left-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
          {auction.bidsCount} {t.home.bids}
        </div>

        {/* Botón favorito */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-red-400 transition-colors"
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-red-400 text-red-400" : ""}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
          {auction.title}
        </h3>
        <p className="text-slate-500 text-sm truncate mb-3">{auction.sellerName}</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs">{t.auction.currentBid}</p>
            <p className="text-white font-bold">{formatPrice(auction.currentBid)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs">{t.auction.timeRemaining}</p>
            <p className="text-emerald-400 font-medium">{timeLeft}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PopularAuctionsSection() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    async function loadAuctions() {
      try {
        const data = await getPopularAuctions(8);
        setAuctions(data);
      } catch (err) {
        console.error("Error loading popular auctions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAuctions();
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto flex justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{t.home.popularAuctions}</h2>
            <p className="text-slate-500 text-sm mt-1">
              {t.home.popularSubtitle}
            </p>
          </div>

          <Link
            href="/search"
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            {t.home.viewAll}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid de subastas o mensaje vacío */}
        {auctions.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
            <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">{t.home.noAuctions}</p>
            <Link
              href="/auction/create"
              className="inline-block mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
            >
              {t.nav.sellItem}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {auctions.map((auction) => (
              <PopularAuctionCard key={auction.id} auction={auction} t={t} formatPrice={formatPrice} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default PopularAuctionsSection;
