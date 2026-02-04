"use client";

import { useEffect, useState } from "react";
import { Gavel, Loader2, TrendingUp } from "lucide-react";
import { Auction } from "@/types/auction.types";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/i18n";
import { placeBid, calculateMinBid, getUserAutoBid, removeAutoBid } from "@/services/bid.service";
import { Alert } from "@/components/ui";

interface BidFormProps {
  auction: Auction;
}

export default function BidForm({ auction }: BidFormProps) {
  const { user, userAvatar } = useAuth();
  const { t } = useLanguage();
  const { formatPrice, convertToCLP, convertFromCLP, currencyInfo } = useCurrency();
  const [bidAmount, setBidAmount] = useState("");
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [autoBidMax, setAutoBidMax] = useState("");
  const [loadingAutoBid, setLoadingAutoBid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const minBidCLP = calculateMinBid(auction.currentBid);
  
  const minBidDisplay = convertFromCLP(minBidCLP);
  
  const suggestedBidsDisplay = [
    convertFromCLP(minBidCLP),
    convertFromCLP(minBidCLP + auction.bidIncrement),
    convertFromCLP(minBidCLP + auction.bidIncrement * 2),
  ];

  useEffect(() => {
    if (!user) return;

    const loadAutoBid = async () => {
      setLoadingAutoBid(true);
      try {
        const config = await getUserAutoBid(auction.id, user.uid);
        if (config && config.active) {
          setAutoBidEnabled(true);
          setAutoBidMax(convertFromCLP(config.maxAmount).toFixed(2));
        }
      } catch (err) {
        console.error("[BidForm] Error loading auto bid:", err);
      } finally {
        setLoadingAutoBid(false);
      }
    };

    loadAutoBid();
  }, [auction.id, user, convertFromCLP]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError(t.auction.mustLogin);
      setTimeout(() => setError(""), 5000);
      return;
    }

    const amountInput = parseFloat(bidAmount);
    const amountCLP = convertToCLP(amountInput);

    let maxAutoBidCLP: number | undefined;
    if (autoBidEnabled) {
      const maxInput = parseFloat(autoBidMax);
      maxAutoBidCLP = convertToCLP(maxInput);

      if (isNaN(maxInput) || maxAutoBidCLP < minBidCLP) {
        setError(t.auction.autoBidMaxInvalid || "El límite de auto puja no es válido");
        setTimeout(() => setError(""), 5000);
        return;
      }

      if (amountCLP > maxAutoBidCLP) {
        setError(t.auction.autoBidMaxTooLow || "El límite de auto puja debe ser mayor o igual a tu puja");
        setTimeout(() => setError(""), 5000);
        return;
      }
    }

    if (isNaN(amountInput) || amountCLP < minBidCLP) {
      setError(`${t.auction.minBid}: ${formatPrice(minBidCLP)}`);
      setTimeout(() => setError(""), 5000);
      return;
    }

    setLoading(true);

    const result = await placeBid({
      auctionId: auction.id,
      bidderId: user.uid,
      bidderName: user.displayName || "Anónimo",
      bidderAvatar: userAvatar || user.photoURL || undefined,
      amount: amountCLP,
      maxAutoBid: maxAutoBidCLP,
    });

    setLoading(false);

    if (result.success) {
      setSuccess(t.auction.bidSuccess);
      setBidAmount("");
      
      if (result.timeExtended) {
        setSuccess(t.auction.bidSuccessExtended);
      }

      // Desaparece en 5 seg
      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } else {
      setError(result.error?.message || "Error al realizar la puja");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleDisableAutoBid = async () => {
    if (!user) return;
    setLoadingAutoBid(true);
    try {
      await removeAutoBid(auction.id, user.uid);
      setAutoBidEnabled(false);
      setAutoBidMax("");
    } catch (err) {
      console.error("[BidForm] Error disabling auto bid:", err);
      setError(t.auction.autoBidDisableError || "No se pudo desactivar la auto puja");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoadingAutoBid(false);
    }
  };

  const handleQuickBid = (amountDisplay: number) => {
    setBidAmount(amountDisplay.toFixed(2));
  };

  const isAuctionEnded = auction.status !== "active";
  const isSeller = user?.uid === auction.sellerId;

  if (isAuctionEnded) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 text-center">
        <p className="text-gray-400">
          {auction.status === "scheduled"
            ? t.auction.scheduledMessage || "Subasta programada"
            : t.auction.auctionEnded}
        </p>
        {auction.winnerName && (
          <p className="text-white mt-2">
            {t.auction.winner}: <span className="text-emerald-400">{auction.winnerName}</span>
          </p>
        )}
      </div>
    );
  }

  if (isSeller) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 text-center">
        <p className="text-gray-400">{t.auction.cannotBidOwn}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-6 space-y-4">
      {error && <Alert variant="error" message={error} />}
      {success && <Alert variant="success" message={success} />}

      {/* Pujas rápidas */}
      <div>
        <p className="text-gray-400 text-sm mb-2">{t.auction.quickBids}</p>
        <div className="flex gap-2 flex-wrap">
          {suggestedBidsDisplay.map((amountDisplay, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickBid(amountDisplay)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700 transition-colors"
            >
              {currencyInfo.symbol}{amountDisplay.toLocaleString(currencyInfo.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm block mb-2">
            {t.auction.yourBid} ({t.auction.minBid}: {formatPrice(minBidCLP)})
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {currencyInfo.symbol}
            </span>
            <input
              type="number"
              step="0.01"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={minBidDisplay.toFixed(2)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Auto puja */}
        <div className="bg-slate-800/60 rounded-lg p-4 space-y-3">
          <label className="flex items-center justify-between text-gray-300 text-sm">
            <span>{t.auction.autoBidLabel || "Auto puja"}</span>
            <input
              type="checkbox"
              checked={autoBidEnabled}
              onChange={(e) => {
                if (!e.target.checked) {
                  handleDisableAutoBid();
                } else {
                  setAutoBidEnabled(true);
                }
              }}
              disabled={loading || loadingAutoBid}
              className="h-4 w-4"
            />
          </label>

          {autoBidEnabled && (
            <div>
              <label className="text-gray-400 text-sm block mb-2">
                {t.auction.autoBidMaxLabel || "Límite máximo"}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {currencyInfo.symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={autoBidMax}
                  onChange={(e) => setAutoBidMax(e.target.value)}
                  placeholder={minBidDisplay.toFixed(2)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
                  disabled={loading || loadingAutoBid}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t.auction.autoBidHint || "Pujaremos automáticamente hasta tu límite."}
              </p>
            </div>
          )}

          {autoBidEnabled && (
            <button
              type="button"
              onClick={handleDisableAutoBid}
              disabled={loading || loadingAutoBid}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              {t.auction.autoBidDisable || "Desactivar auto puja"}
            </button>
          )}
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
              {t.auction.placeBid}
            </>
          )}
        </button>

        {!user && (
          <p className="text-center text-gray-400 text-sm">
            <a href="/login" className="text-emerald-500 hover:underline">
              {t.nav.login}
            </a>{" "}
            {t.auction.mustLogin.toLowerCase().includes("log") ? "to bid" : "para pujar"}
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
