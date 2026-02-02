"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Users, ArrowLeft, Heart, Share2, Shield, Trophy, Loader2, Star } from "lucide-react";
import { Auction } from "@/types/auction.types";
import { Bid } from "@/types/bid.types";
import {
  subscribeToAuction,
  formatTimeRemaining,
  getTimeRemaining,
  checkAndFinalizeAuction,
} from "@/services/auction.service";
import { subscribeToAuctionBids } from "@/services/bid.service";
import { isFavorite, toggleFavorite } from "@/services/favorite.service";
import { hasReviewForAuction, getSellerRatingSummary } from "@/services/review.service";
import { SellerRatingSummary } from "@/types/review.types";
import { Navbar, Footer } from "@/components/layout";
import { ShareModal } from "@/components/ui/ShareModal";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/i18n";
import BidForm from "./components/BidForm";
import BidHistory from "./components/BidHistory";

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const auctionId = params.id as string;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Estados para compartir y favoritos
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const [showWinnerBanner, setShowWinnerBanner] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [sellerRating, setSellerRating] = useState<SellerRatingSummary | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    const unsubscribe = subscribeToAuction(auctionId, async (data) => {
      if (data) {
        const finalizedAuction = await checkAndFinalizeAuction(data);
        setAuction(finalizedAuction);
        
        // Verificar si el usuario ganó la subasta
        if (user && finalizedAuction.status === "ended" && finalizedAuction.highestBidderId === user.uid) {
          setShowWinnerBanner(true);
        }
      } else {
        setAuction(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auctionId, user]);

  // Verificar si está en favoritos
  useEffect(() => {
    async function checkFavorite() {
      if (!user || !auctionId) return;
      const fav = await isFavorite(user.uid, auctionId);
      setIsFav(fav);
    }
    checkFavorite();
  }, [user, auctionId]);

  // Verificar si ya dejó review y cargar rating del vendedor
  useEffect(() => {
    async function checkReviewAndRating() {
      if (!auction) return;
      
      // Cargar rating del vendedor
      try {
        const rating = await getSellerRatingSummary(auction.sellerId);
        setSellerRating(rating);
      } catch (err) {
        console.error("Error loading seller rating:", err);
      }

      // Verificar si el usuario ganador ya dejó review
      if (user && auction.status === "ended" && auction.highestBidderId === user.uid) {
        try {
          const reviewed = await hasReviewForAuction(user.uid, auctionId);
          setHasReview(reviewed);
        } catch (err) {
          console.error("Error checking review:", err);
        }
      }
    }
    checkReviewAndRating();
  }, [auction, user, auctionId]);

  // Toggle favorito
  const handleToggleFavorite = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    
    setLoadingFav(true);
    try {
      const newState = await toggleFavorite(user.uid, auctionId);
      setIsFav(newState);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setLoadingFav(false);
    }
  };

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
        setTimeRemaining(t.auction.ended);
      } else {
        setTimeRemaining(formatTimeRemaining(auction.endTime));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [auction, t]);

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
          <p className="text-gray-400 text-lg">{t.auction.notFound}</p>
          <button
            onClick={() => router.push("/")}
            className="text-emerald-500 hover:text-emerald-400 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.auction.backToHome}
          </button>
        </div>
      </div>
    );
  }

  const isEnding = getTimeRemaining(auction.endTime).total < 300000; 

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Navegación */}
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.auction.back}
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
                  {t.auction.noImage}
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
                  {isEnding ? t.auction.endingSoon : t.auction.live}
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
                  <button 
                    onClick={handleToggleFavorite}
                    disabled={loadingFav}
                    className={`p-2 rounded-lg transition-colors ${
                      isFav 
                        ? "bg-red-500/20 text-red-500" 
                        : "bg-slate-900 text-gray-400 hover:text-white"
                    }`}
                  >
                    {loadingFav ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
                    )}
                  </button>
                  <button 
                    onClick={() => setShowShareModal(true)}
                    className="p-2 rounded-lg bg-slate-900 text-gray-400 hover:text-white transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Seller info with rating */}
              <div className="flex items-center gap-2 mt-1">
                <Link
                  href={`/reviews/seller/${auction.sellerId}`}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {t.auction.seller}: {auction.sellerName}
                </Link>
                {sellerRating && sellerRating.totalReviews > 0 && (
                  <Link
                    href={`/reviews/seller/${auction.sellerId}`}
                    className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
                  >
                    <StarRating rating={sellerRating.averageRating} size="sm" />
                    <span className="text-gray-500">
                      ({sellerRating.totalReviews})
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Precio actual */}
            <div className="bg-slate-900 rounded-2xl p-6">
              <p className="text-gray-400 text-sm mb-1">{t.auction.currentBid}</p>
              <p className="text-3xl sm:text-4xl font-bold text-white">
                {formatPrice(auction.currentBid)}
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
                  <span>{auction.bidsCount} {t.auction.bids}</span>
                </div>
              </div>
            </div>

            {/* Formulario de puja */}
            <BidForm auction={auction} />

            {/* Garantías */}
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span>{t.auction.secureTransaction}</span>
            </div>

            {/* Call-to-action para dejar review (solo para ganador) */}
            {user && auction.status === "ended" && auction.highestBidderId === user.uid && !hasReview && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {t.reviews?.leaveReview || "¡Deja tu valoración!"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {t.reviews?.leaveReviewDesc || "Comparte tu experiencia con otros usuarios"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/reviews/create?auctionId=${auctionId}`)}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    {t.reviews?.submitReview || "Valorar"}
                  </Button>
                </div>
              </div>
            )}

            {/* Mensaje si ya dejó review */}
            {user && auction.status === "ended" && auction.highestBidderId === user.uid && hasReview && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                  </div>
                  <p className="text-emerald-300">
                    {t.reviews?.thankYou || "¡Gracias por tu valoración!"}
                  </p>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">
                {t.auction.description}
              </h2>
              <p className="text-gray-400 leading-relaxed">
                {auction.description}
              </p>
            </div>
          </div>
        </div>

        {/* Historial de pujas */}
        <div className="mt-12">
          <BidHistory bids={bids} currentUserId={user?.uid || ""} />
        </div>
      </main>

      <Footer />

      {/* Modal de compartir */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={auction?.title || ""}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />

      {/* Banner de ganador */}
      {showWinnerBanner && auction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowWinnerBanner(false)} />
          <div className="relative bg-slate-900 rounded-2xl border border-emerald-500/50 w-full max-w-md p-8 shadow-xl text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t.auction.congratulations}</h2>
            <p className="text-slate-400 mb-4">
              {t.auction.youWonAuction} <strong className="text-white">{auction.title}</strong>
            </p>
            <p className="text-3xl font-bold text-emerald-500 mb-6">
              {formatPrice(auction.currentBid)}
            </p>
            <p className="text-slate-500 text-sm mb-6">
              {t.auction.contactSeller} <strong className="text-slate-300">{auction.sellerName}</strong> {t.auction.forPaymentDelivery}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWinnerBanner(false)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                {t.auction.understood}
              </button>
              {!hasReview && (
                <button
                  onClick={() => {
                    setShowWinnerBanner(false);
                    router.push(`/reviews/create?auctionId=${auctionId}`);
                  }}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  {t.reviews?.submitReview || "Valorar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
