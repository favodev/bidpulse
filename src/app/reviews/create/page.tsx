"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Star, Loader2 } from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Button, Alert } from "@/components/ui";
import { ReviewForm } from "@/components/review/ReviewForm";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import { getAuction } from "@/services/auction.service";
import { createReview, hasReviewForAuction, getReviewForAuction } from "@/services/review.service";
import { Auction } from "@/types/auction.types";
import { Review, CreateReviewData } from "@/types/review.types";

export default function CreateReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t } = useLanguage();

  const auctionId = searchParams.get("auctionId");

  const [auction, setAuction] = useState<Auction | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!auctionId) {
        setError(t.reviews?.noAuctionId || "No se especificó la subasta");
        setLoading(false);
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Cargar la subasta
        const auctionData = await getAuction(auctionId);
        
        if (!auctionData) {
          setError(t.auction.notFound);
          setLoading(false);
          return;
        }

        // Verificar que el usuario ganó la subasta
        if (auctionData.highestBidderId !== user.uid) {
          setError(t.reviews?.notWinner || "Solo el ganador de la subasta puede dejar una valoración");
          setLoading(false);
          return;
        }

        // Verificar que la subasta terminó
        if (auctionData.status !== "ended") {
          setError(t.reviews?.auctionNotEnded || "La subasta aún no ha terminado");
          setLoading(false);
          return;
        }

        setAuction(auctionData);

        // Verificar si ya existe una review
        const existing = await getReviewForAuction(auctionId);
        if (existing && existing.reviewerId === user.uid) {
          setExistingReview(existing);
        }
      } catch (err) {
        console.error("Error loading auction:", err);
        setError(t.common.error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [auctionId, user, t]);

  const handleSubmit = async (data: CreateReviewData) => {
    if (!user || !auction) return;

    setSubmitting(true);
    setError("");

    try {
      await createReview(
        user.uid,
        user.displayName || user.email?.split("@")[0] || "Usuario",
        user.photoURL || undefined,
        data
      );
      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push(`/auction/${auctionId}`);
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t.common.error;
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  // No autenticado
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <Star className="w-16 h-16 text-gray-600" />
          <p className="text-gray-400 text-lg">{t.reviews?.mustLogin || "Debes iniciar sesión para dejar una valoración"}</p>
          <Button onClick={() => router.push("/login")}>{t.auth.loginButton}</Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Cargando
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

  // Error
  if (error && !auction) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <p className="text-red-400 text-lg">{error}</p>
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.common.back}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Ya existe una review
  if (existingReview) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {t.reviews?.alreadyReviewed || "Ya has valorado esta subasta"}
            </h1>
            <p className="text-gray-400 mb-6">
              {t.reviews?.alreadyReviewedDesc || "Solo puedes dejar una valoración por subasta."}
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="ghost" onClick={() => router.back()}>
                {t.common.back}
              </Button>
              <Button onClick={() => router.push(`/auction/${auctionId}`)}>
                {t.notifications.viewAuction}
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {t.reviews?.thankYou || "¡Gracias por tu valoración!"}
            </h1>
            <p className="text-gray-400">
              {t.reviews?.reviewSubmitted || "Tu valoración ha sido enviada exitosamente."}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
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
            {t.reviews?.leaveReview || "Dejar una valoración"}
          </h1>
          <p className="text-gray-400">
            {t.reviews?.leaveReviewDesc || "Comparte tu experiencia con otros usuarios"}
          </p>
        </div>

        {error && (
          <Alert variant="error" message={error} onClose={() => setError("")} className="mb-6" />
        )}

        {auction && (
          <ReviewForm
            auctionId={auction.id}
            auctionTitle={auction.title}
            auctionImage={auction.images?.[0]}
            sellerId={auction.sellerId}
            sellerName={auction.sellerName}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isLoading={submitting}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
