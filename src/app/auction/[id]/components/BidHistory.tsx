"use client";

import { Trophy, User, Trash2 } from "lucide-react";
import { Bid } from "@/types/bid.types";
import { useLanguage } from "@/i18n";
import { useCurrency } from "@/hooks/useCurrency";
import { deleteBid } from "@/services/bid.service";
import { useState } from "react";
import { Alert, ConfirmModal } from "@/components/ui";

interface BidHistoryProps {
  bids: Bid[];
  currentUserId: string;
}

export default function BidHistory({ bids, currentUserId }: BidHistoryProps) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [error, setError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingBid, setPendingBid] = useState<Bid | null>(null);

  const handleDeleteClick = (bid: Bid) => {
    setPendingBid(bid);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingBid) return;
    const res = await deleteBid(pendingBid.auctionId, pendingBid.id!, currentUserId);
    if (!res.success) {
      setError(res.error || "Failed to delete");
      setTimeout(() => setError(""), 5000);
    }
    setIsConfirmOpen(false);
    setPendingBid(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setPendingBid(null);
  };

  if (bids.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl p-8 text-center">
        <p className="text-gray-400">
          {t.auction.noBidsFirst}
        </p>
      </div>
    );
  }

  const formatTime = (timestamp: { toDate: () => Date } | null) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
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
        {t.auction.bidHistory}
      </h2>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={t.common?.confirm || "Confirmar"}
        message={t.common?.confirmDelete || "Are you sure you want to delete this bid?"}
        confirmLabel={t.common?.delete || "Eliminar"}
        cancelLabel={t.common?.cancel || "Cancelar"}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmVariant="danger"
      />

      {error && <div className="mb-4"><Alert variant="error" message={error} /></div>}

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
                  : "bg-slate-800"
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
                    {isCurrentUser ? t.auction.you : bid.bidderName}
                    {isWinning && (
                      <span className="ml-2 text-xs text-emerald-400">
                        {t.auction.highestBid}
                      </span>
                    )}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {formatTime(bid.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      isWinning ? "text-emerald-400" : "text-white"
                    }`}
                  >
                    {formatPrice(bid.amount)}
                  </p>
                  {bid.previousBid && (
                    <p className="text-gray-500 text-xs">
                      +{formatPrice(bid.amount - bid.previousBid)}
                    </p>
                  )}
                </div>

                {isCurrentUser && (
                   <button 
                     onClick={() => handleDeleteClick(bid)}
                     className="text-gray-500 hover:text-red-400 transition-colors p-1"
                     title={t.common?.delete || "Eliminar"}
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
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
