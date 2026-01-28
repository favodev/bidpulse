"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US").format(price);
};

// Datos de ejemplo por ahora :v
const endingSoonAuctions = [
  {
    id: "1",
    title: "Vintage Rolex Submariner",
    subtitle: "Ref. 5513 - Circa 1970 - Full Set",
    image: "/assets/placeholder-watch.jpg",
    currentBid: 12500,
    timeLeft: "04:23",
  },
  {
    id: "2",
    title: "1967 Ford Mustang GT",
    subtitle: "Fastback - 390 V8 - 4 Speed Manual",
    image: "/assets/placeholder-car.jpg",
    currentBid: 45000,
    timeLeft: "08:15",
  },
];

interface AuctionCardProps {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  currentBid: number;
  timeLeft: string;
}

function EndingSoonCard({
  id,
  title,
  subtitle,
  image,
  currentBid,
  timeLeft,
}: AuctionCardProps) {
  return (
    <div className="flex gap-4 bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
      {/* Imagen con timer */}
      <div className="relative w-32 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-800">
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-slate-900/90 text-white text-xs px-2 py-1 rounded-md">
          <Clock className="w-3 h-3 text-red-400" />
          <span>{timeLeft} Left</span>
        </div>
        <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-500 text-xs">
          Imagen
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white truncate">{title}</h3>
            <button className="shrink-0 text-slate-500 hover:text-red-400 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-500 text-sm truncate">{subtitle}</p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-slate-500 text-xs uppercase">Puja Actual</p>
            <p className="text-blue-400 font-bold text-lg">
              ${formatPrice(currentBid)}
            </p>
          </div>
          <Link href={`/auction/${id}`}>
            <Button size="sm" variant="secondary">
              Pujar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function EndingSoonSection() {
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
            href="/auctions?sort=ending"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            Ver Todas →
          </Link>
        </div>

        {/* Grid de subastas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {endingSoonAuctions.map((auction) => (
            <EndingSoonCard key={auction.id} {...auction} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default EndingSoonSection;
