"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US").format(price);
};

// Datos de ejemplo por ahora :v
const popularAuctions = [
  {
    id: "1",
    title: "Abstract #42 - Limited Edition",
    seller: "Sarah Jenkins",
    image: "/assets/placeholder-art.jpg",
    currentBid: 2450,
    bidsCount: 24,
    endsIn: "2h 14m",
  },
  {
    id: "2",
    title: "Leica M6 TTL Black Paint",
    seller: "Mint Condition - Original Box",
    image: "/assets/placeholder-camera.jpg",
    currentBid: 3800,
    bidsCount: 18,
    endsIn: "5h 30m",
  },
  {
    id: "3",
    title: "Custom Mechanical Keyboard",
    seller: "GMK Keycaps - Brass Plate",
    image: "/assets/placeholder-keyboard.jpg",
    currentBid: 450,
    bidsCount: 32,
    endsIn: "45m",
  },
  {
    id: "4",
    title: "Amazing Fantasy #15",
    seller: "CGC 4.0 - First Appearance Spiderman",
    image: "/assets/placeholder-comic.jpg",
    currentBid: 15200,
    bidsCount: 12,
    endsIn: "3d 12h",
  },
];

interface AuctionCardProps {
  id: string;
  title: string;
  seller: string;
  image: string;
  currentBid: number;
  bidsCount: number;
  endsIn: string;
}

function PopularAuctionCard({
  id,
  title,
  seller,
  currentBid,
  bidsCount,
  endsIn,
}: AuctionCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <Link
      href={`/auction/${id}`}
      className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all hover:scale-[1.02]"
    >
      {/* Imagen */}
      <div className="relative aspect-square bg-slate-800">
        <div className="w-full h-full bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-500">
          Imagen
        </div>

        {/* Badge de pujas */}
        <div className="absolute bottom-3 left-3 bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
          {bidsCount} Pujas
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
        <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="text-slate-500 text-sm truncate mb-3">{seller}</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs">Puja Actual</p>
            <p className="text-white font-bold">${formatPrice(currentBid)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs">Termina en</p>
            <p className="text-blue-400 font-medium">{endsIn}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PopularAuctionsSection() {
  const [scrollIndex, setScrollIndex] = useState(0);
  const maxIndex = Math.max(0, popularAuctions.length - 4);

  const handlePrev = () => {
    setScrollIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setScrollIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <section className="py-12 px-4 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Subastas Populares</h2>
            <p className="text-slate-500 text-sm mt-1">
              Artículos con alta actividad en este momento.
            </p>
          </div>

          {/* Controles del carrusel */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={scrollIndex === 0}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={scrollIndex >= maxIndex}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grid de subastas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularAuctions.map((auction) => (
            <PopularAuctionCard key={auction.id} {...auction} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PopularAuctionsSection;
