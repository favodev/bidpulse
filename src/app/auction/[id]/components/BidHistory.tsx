"use client";

import { Trophy, User } from "lucide-react";
import { Bid } from "@/types/bid.types";
import { formatBidAmount } from "@/services/bid.service";

interface BidHistoryProps {
  bids: Bid[];
  currentUserId: string;
}

export default function BidHistory({ bids, currentUserId }: BidHistoryProps) {
  if (bids.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl p-8 text-center">
        <p className="text-gray-400">
          Aún no hay pujas. ¡Sé el primero en pujar!
        </p>
      </div>
    );
  }

  const formatTime = (timestamp: { toDate: () => Date } | null) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(date);
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-emerald-500" />
        Historial de pujas
      </h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {bids.map((bid, index) => {
          const isWinning = index === 0;
          const isCurrentUser = bid.bidderId === currentUserId;

          return (
            <div
              key={bid.id}
              className={`flex items-center justify-between p-4 rounded-xl ${
                isWinning
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : "bg-[#252525]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isWinning ? "bg-emerald-500/20" : "bg-slate-800"
                  }`}
                >
                  {bid.bidderAvatar ? (
                    <img
                      src={bid.bidderAvatar}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User
                      className={`w-5 h-5 ${
                        isWinning ? "text-emerald-400" : "text-gray-400"
                      }`}
                    />
                  )}
                </div>

                <div>
                  <p
                    className={`font-medium ${
                      isCurrentUser ? "text-emerald-400" : "text-white"
                    }`}
                  >
                    {isCurrentUser ? "Tú" : bid.bidderName}
                    {isWinning && (
                      <span className="ml-2 text-xs text-emerald-400">
                        Puja más alta
                      </span>
                    )}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {formatTime(bid.createdAt)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={`font-bold ${
                    isWinning ? "text-emerald-400" : "text-white"
                  }`}
                >
                  {formatBidAmount(bid.amount)}
                </p>
                {bid.previousBid && (
                  <p className="text-gray-500 text-xs">
                    +{formatBidAmount(bid.amount - bid.previousBid)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {bids.length >= 20 && (
        <button className="w-full mt-4 text-center text-emerald-500 hover:text-emerald-400 text-sm">
          Ver más pujas
        </button>
      )}
    </div>
  );
}
