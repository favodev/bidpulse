"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import { ReviewList } from "@/components/review/ReviewCard";
import { SellerRatingSummaryCard } from "@/components/review/SellerRatingSummary";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import { getUserProfile } from "@/services/user.service";
import {
  getSellerReviews,
  getSellerRatingSummary,
  addSellerResponse,
  deleteReview,
} from "@/services/review.service";
import { UserProfile } from "@/types/user.types";
import { Review, SellerRatingSummary } from "@/types/review.types";

export default function SellerReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const sellerId = params.sellerId as string;

  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<SellerRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!sellerId) return;

      try {
        const [sellerData, reviewsData, summaryData] = await Promise.all([
          getUserProfile(sellerId),
          getSellerReviews(sellerId, 50),
          getSellerRatingSummary(sellerId),
        ]);

        setSeller(sellerData);
        setReviews(reviewsData);
        setSummary(summaryData);
      } catch (error) {
        console.error("Error loading seller reviews:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [sellerId]);

  const handleRespond = async (reviewId: string, response: string) => {
    if (!user) return;
    
    try {
      await addSellerResponse(reviewId, user.uid, response);
      // Recargar reviews
      const updatedReviews = await getSellerReviews(sellerId, 50);
      setReviews(updatedReviews);
    } catch (error) {
      console.error("Error responding to review:", error);
      throw error;
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!user) return;
    
    if (!confirm(t.reviews?.confirmDelete || "¿Estás seguro de eliminar esta valoración?")) {
      return;
    }
    
    try {
      await deleteReview(reviewId, user.uid);
      // Recargar reviews y summary
      const [updatedReviews, updatedSummary] = await Promise.all([
        getSellerReviews(sellerId, 50),
        getSellerRatingSummary(sellerId),
      ]);
      setReviews(updatedReviews);
      setSummary(updatedSummary);
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <p className="text-gray-400 text-lg">{t.reviews?.sellerNotFound || "Vendedor no encontrado"}</p>
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.common.back}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isSeller = user?.uid === sellerId;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common.back}
        </button>

        {/* Seller Info */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-slate-800 overflow-hidden shrink-0">
            {seller.avatar ? (
              <img
                src={seller.avatar}
                alt={seller.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{seller.displayName}</h1>
            <p className="text-gray-400">
              {t.reviews?.reviewsTitle || "Valoraciones del vendedor"}
            </p>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-8">
            <SellerRatingSummaryCard summary={summary} />
          </div>
        )}

        {/* Reviews List */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {t.reviews?.allReviews || "Todas las valoraciones"} ({reviews.length})
          </h2>
          <ReviewList
            reviews={reviews}
            showAuction={true}
            onDelete={handleDelete}
            onRespond={isSeller ? handleRespond : undefined}
            currentUserId={user?.uid}
            sellerId={sellerId}
            emptyMessage={t.reviews?.noReviewsForSeller || "Este vendedor aún no tiene valoraciones"}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
