"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, ArrowLeft, Loader2 } from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import { ReviewList } from "@/components/review/ReviewCard";
import { SellerRatingSummaryCard } from "@/components/review/SellerRatingSummary";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import {
  getUserReviews,
  getSellerReviews,
  getSellerRatingSummary,
  deleteReview,
  addSellerResponse,
} from "@/services/review.service";
import { Review, SellerRatingSummary } from "@/types/review.types";

type TabType = "received" | "given";

export default function MyReviewsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>("received");
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  const [givenReviews, setGivenReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<SellerRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [received, given, summaryData] = await Promise.all([
          getSellerReviews(user.uid, 50),
          getUserReviews(user.uid, 50),
          getSellerRatingSummary(user.uid),
        ]);

        setReceivedReviews(received);
        setGivenReviews(given);
        setSummary(summaryData);
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleDelete = async (reviewId: string) => {
    if (!user) return;
    
    if (!confirm(t.reviews?.confirmDelete || "¿Estás seguro de eliminar esta valoración?")) {
      return;
    }
    
    try {
      await deleteReview(reviewId, user.uid);
      // Recargar las reviews dadas
      const updatedGiven = await getUserReviews(user.uid, 50);
      setGivenReviews(updatedGiven);
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const handleRespond = async (reviewId: string, response: string) => {
    if (!user) return;
    
    try {
      await addSellerResponse(reviewId, user.uid, response);
      // Recargar las reviews recibidas
      const updatedReceived = await getSellerReviews(user.uid, 50);
      setReceivedReviews(updatedReceived);
    } catch (error) {
      console.error("Error responding to review:", error);
      throw error;
    }
  };

  // No autenticado
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <Star className="w-16 h-16 text-gray-600" />
          <p className="text-gray-400 text-lg">
            {t.reviews?.mustLoginToSee || "Debes iniciar sesión para ver tus valoraciones"}
          </p>
          <Button onClick={() => router.push("/login")}>{t.auth.loginButton}</Button>
        </div>
        <Footer />
      </div>
    );
  }

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

  const tabs = [
    { 
      id: "received" as TabType, 
      label: t.reviews?.received || "Recibidas",
      count: receivedReviews.length 
    },
    { 
      id: "given" as TabType, 
      label: t.reviews?.given || "Dadas",
      count: givenReviews.length 
    },
  ];

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

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {t.reviews?.myReviews || "Mis Valoraciones"}
          </h1>
          <p className="text-gray-400">
            {t.reviews?.myReviewsDesc || "Gestiona las valoraciones que has recibido y dado"}
          </p>
        </div>

        {/* Summary Card (solo para reviews recibidas) */}
        {activeTab === "received" && summary && summary.totalReviews > 0 && (
          <div className="mb-8">
            <SellerRatingSummaryCard summary={summary} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 font-medium transition-colors relative
                ${activeTab === tab.id 
                  ? "text-white" 
                  : "text-gray-400 hover:text-gray-300"}
              `}
            >
              {tab.label} ({tab.count})
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {activeTab === "received" ? (
          <ReviewList
            reviews={receivedReviews}
            showAuction={true}
            onRespond={handleRespond}
            currentUserId={user.uid}
            sellerId={user.uid}
            emptyMessage={t.reviews?.noReceivedReviews || "Aún no has recibido valoraciones"}
          />
        ) : (
          <ReviewList
            reviews={givenReviews}
            showAuction={true}
            onDelete={handleDelete}
            currentUserId={user.uid}
            emptyMessage={t.reviews?.noGivenReviews || "Aún no has dado ninguna valoración"}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
