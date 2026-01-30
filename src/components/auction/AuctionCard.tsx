"use client";

import Link from "next/link";
import { Clock, Gavel, Tag } from "lucide-react";
import { Auction, CATEGORY_LABELS } from "@/types/auction.types";
import { Timestamp } from "firebase/firestore";

interface AuctionCardProps {
  auction: Auction;
  compact?: boolean;
}

// Función para formatear tiempo restante
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

// Función para formatear precio
function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function AuctionCard({ auction, compact = false }: AuctionCardProps) {
  const isEnded = auction.status === "ended";
  const timeRemaining = formatTimeRemaining(auction.endTime);
  const isEndingSoon = !isEnded && auction.endTime.toDate().getTime() - Date.now() < 3600000;

  return (
    <Link href={`/auction/${auction.id}`}>
      <div className="group bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer h-full">
        {/* Imagen */}
        <div className={`relative ${compact ? "aspect-4/3" : "aspect-square"} bg-slate-800 overflow-hidden`}>
          {auction.images?.[0] ? (
            <img
              src={auction.images[0]}
              alt={auction.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gavel className="w-12 h-12 text-gray-600" />
            </div>
          )}

          {/* Badge de estado */}
          {isEnded ? (
            <div className="absolute top-3 left-3 bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">
              Finalizada
            </div>
          ) : isEndingSoon ? (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              ¡Termina pronto!
            </div>
          ) : null}

          {/* Categoría */}
          {!compact && (
            <div className="absolute top-3 right-3 bg-black/70 text-gray-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {CATEGORY_LABELS[auction.category]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className={`font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors ${compact ? "text-sm" : ""}`}>
            {auction.title}
          </h3>

          <div className="flex items-center justify-between text-sm mb-3">
            <div>
              <p className="text-gray-500 text-xs">Puja actual</p>
              <p className={`text-emerald-400 font-bold ${compact ? "text-sm" : ""}`}>
                {formatPrice(auction.currentBid)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-gray-500 text-xs flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                {isEnded ? "Terminó" : "Termina en"}
              </p>
              <p className={`font-medium ${isEndingSoon ? "text-red-400" : "text-gray-300"} ${compact ? "text-sm" : ""}`}>
                {timeRemaining}
              </p>
            </div>
          </div>

          {/* Footer */}
          {!compact && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <Gavel className="w-3 h-3" />
                {auction.bidsCount} pujas
              </div>

              {auction.sellerAvatar ? (
                <img
                  src={auction.sellerAvatar}
                  alt={auction.sellerName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-xs text-gray-400">
                    {auction.sellerName?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
