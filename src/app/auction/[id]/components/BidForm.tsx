"use client";

import { useState } from "react";
import { Gavel, Loader2, TrendingUp } from "lucide-react";
import { Auction } from "@/types/auction.types";
import { useAuth } from "@/hooks/useAuth";
import { placeBid, calculateMinBid, formatBidAmount } from "@/services/bid.service";
import { Alert } from "@/components/ui";

interface BidFormProps {
  auction: Auction;
}

export default function BidForm({ auction }: BidFormProps) {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const minBid = calculateMinBid(auction.currentBid);
  const suggestedBids = [
    minBid,
    minBid + auction.bidIncrement,
    minBid + auction.bidIncrement * 2,
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Debes iniciar sesión para pujar");
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minBid) {
      setError(`La puja mínima es ${formatBidAmount(minBid)}`);
      return;
    }

    setLoading(true);

    const result = await placeBid({
      auctionId: auction.id,
      bidderId: user.uid,
      bidderName: user.displayName || "Anónimo",
      amount,
    });

    setLoading(false);

    if (result.success) {
      setSuccess("¡Puja realizada con éxito!");
      setBidAmount("");
      
      if (result.timeExtended) {
        setSuccess("¡Puja realizada! Se extendió el tiempo de la subasta.");
      }
    } else {
      setError(result.error?.message || "Error al realizar la puja");
    }
  };

  const handleQuickBid = (amount: number) => {
    setBidAmount(amount.toString());
  };

  const isAuctionEnded = auction.status !== "active";
  const isSeller = user?.uid === auction.sellerId;

  if (isAuctionEnded) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 text-center">
        <p className="text-gray-400">Esta subasta ha finalizado</p>
        {auction.winnerName && (
          <p className="text-white mt-2">
            Ganador: <span className="text-emerald-400">{auction.winnerName}</span>
          </p>
        )}
      </div>
    );
  }

  if (isSeller) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 text-center">
        <p className="text-gray-400">No puedes pujar en tu propia subasta</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-6 space-y-4">
      {error && <Alert variant="error" message={error} />}
      {success && <Alert variant="success" message={success} />}

      {/* Pujas rápidas */}
      <div>
        <p className="text-gray-400 text-sm mb-2">Pujas rápidas</p>
        <div className="flex gap-2 flex-wrap">
          {suggestedBids.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickBid(amount)}
              className="px-4 py-2 rounded-lg bg-[#252525] text-white text-sm hover:bg-[#303030] transition-colors"
            >
              {formatBidAmount(amount)}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm block mb-2">
            Tu puja (mínimo: {formatBidAmount(minBid)})
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min={minBid}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={minBid.toFixed(2)}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg pl-8 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !user}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Gavel className="w-5 h-5" />
              Realizar puja
            </>
          )}
        </button>

        {!user && (
          <p className="text-center text-gray-400 text-sm">
            <a href="/login" className="text-emerald-500 hover:underline">
              Inicia sesión
            </a>{" "}
            para pujar
          </p>
        )}
      </form>

      {/* Indicador de competencia */}
      {auction.bidsCount > 5 && (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>Alta demanda - {auction.watchersCount} personas observando</span>
        </div>
      )}
    </div>
  );
}
