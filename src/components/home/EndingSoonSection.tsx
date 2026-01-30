"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { getEndingSoonAuctions } from "@/services/auction.service";
import { Auction } from "@/types/auction.types";
import { Timestamp } from "firebase/firestore";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
  }).format(price);
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

function EndingSoonCard({ auction }: { auction: Auction }) {
  const timeLeft = formatTimeRemaining(auction.endTime);

  return (
    <Link href={`/auction/${auction.id}`}>
      <div className="flex gap-4 bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/50 transition-colors cursor-pointer">
        {/* Imagen */}
        <div className="relative w-32 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-800">
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-slate-900/90 text-white text-xs px-2 py-1 rounded-md">
            <Clock className="w-3 h-3 text-red-400" />
            <span>{timeLeft}</span>
          </div>
          {auction.images?.[0] ? (
            <img
              src={auction.images[0]}
              alt={auction.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
              Sin imagen
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-semibold text-white truncate">{auction.title}</h3>
            <p className="text-slate-500 text-sm truncate">{auction.description}</p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-slate-500 text-xs uppercase">Puja Actual</p>
              <p className="text-emerald-400 font-bold text-lg">
                {formatPrice(auction.currentBid)}
              </p>
            </div>
            <Button size="sm" variant="secondary">
              Pujar
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function EndingSoonSection() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuctions() {
      try {
        const data = await getEndingSoonAuctions(4);
        setAuctions(data);
      } catch (err) {
        console.error("Error loading ending soon auctions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAuctions();
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto flex justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-2xl font-bold text-white">Terminan Pronto</h2>
          </div>
          <Link
            href="/auctions?sort=endTime-asc"
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            Ver todas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid o mensaje vacío */}
        {auctions.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay subastas terminando pronto</p>
            <p className="text-slate-500 text-sm mt-1">¡Vuelve más tarde o crea una nueva subasta!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auctions.map((auction) => (
              <EndingSoonCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default EndingSoonSection;
