"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, Users, ArrowLeft, Heart, Share2, Shield } from "lucide-react";
import { Auction } from "@/types/auction.types";
import { Bid } from "@/types/bid.types";
import {
  subscribeToAuction,
  formatTimeRemaining,
  getTimeRemaining,
  checkAndFinalizeAuction,
} from "@/services/auction.service";
import { subscribeToAuctionBids, formatBidAmount } from "@/services/bid.service";
import { Navbar } from "@/components/layout";
import BidForm from "./components/BidForm";
import BidHistory from "./components/BidHistory";

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!auctionId) return;

    const unsubscribe = subscribeToAuction(auctionId, async (data) => {
      if (data) {
        const finalizedAuction = await checkAndFinalizeAuction(data);
        setAuction(finalizedAuction);
      } else {
        setAuction(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auctionId]);

  useEffect(() => {
    if (!auctionId) return;

    const unsubscribe = subscribeToAuctionBids(auctionId, (data) => {
      setBids(data);
    });

    return () => unsubscribe();
  }, [auctionId]);

  useEffect(() => {
    if (!auction) return;

    const updateTime = () => {
      const remaining = getTimeRemaining(auction.endTime);
      if (remaining.total <= 0) {
        setTimeRemaining("Finalizada");
      } else {
        setTimeRemaining(formatTimeRemaining(auction.endTime));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <p className="text-gray-400 text-lg">Subasta no encontrada</p>
          <button
            onClick={() => router.push("/")}
            className="text-emerald-500 hover:text-emerald-400 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const isEnding = getTimeRemaining(auction.endTime).total < 300000; 

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navegación */}
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Galería de imágenes */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden">
              {auction.images && auction.images.length > 0 ? (
                <img
                  src={auction.images[selectedImage]}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Sin imagen
                </div>
              )}

              {/* Badge estado */}
              {auction.status === "active" && (
                <div
                  className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                    isEnding
                      ? "bg-red-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {isEnding ? "¡Termina pronto!" : "En vivo"}
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {auction.images && auction.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {auction.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 ${
                      selectedImage === idx
                        ? "ring-2 ring-emerald-500"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info de la subasta */}
          <div className="space-y-6">
            {/* Título y acciones */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {auction.title}
                </h1>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-slate-900 text-gray-400 hover:text-white transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg bg-slate-900 text-gray-400 hover:text-white transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-gray-500 mt-1">
                Vendedor: {auction.sellerName}
              </p>
            </div>

            {/* Precio actual */}
            <div className="bg-slate-900 rounded-2xl p-6">
              <p className="text-gray-400 text-sm mb-1">Puja actual</p>
              <p className="text-3xl sm:text-4xl font-bold text-white">
                {formatBidAmount(auction.currentBid)}
              </p>

              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className={isEnding ? "text-red-400 font-medium" : ""}>
                    {timeRemaining}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{auction.bidsCount} pujas</span>
                </div>
              </div>
            </div>

            {/* Formulario de puja */}
            <BidForm auction={auction} />

            {/* Garantías */}
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span>Transacción segura • Vendedor verificado</span>
            </div>

            {/* Descripción */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Descripción
              </h2>
              <p className="text-gray-400 leading-relaxed">
                {auction.description}
              </p>
            </div>
          </div>
        </div>

        {/* Historial de pujas */}
        <div className="mt-12">
          <BidHistory bids={bids} currentUserId="" />
        </div>
      </main>
    </div>
  );
}
