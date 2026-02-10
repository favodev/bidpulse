"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button, Input, Alert } from "@/components/ui";
import { StarRatingInput } from "@/components/ui/StarRating";
import { useLanguage } from "@/i18n";
import { CreateReviewData, ReviewAspects } from "@/types/review.types";

interface ReviewFormProps {
  auctionId: string;
  auctionTitle: string;
  auctionImage?: string;
  sellerId: string;
  sellerName: string;
  onSubmit: (data: CreateReviewData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ReviewForm({
  auctionId,
  auctionTitle,
  auctionImage,
  sellerId,
  sellerName,
  onSubmit,
  onCancel,
  isLoading = false,
}: ReviewFormProps) {
  const { t } = useLanguage();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [showAspects, setShowAspects] = useState(false);
  const [aspects, setAspects] = useState<ReviewAspects>({
    communication: 0,
    itemAsDescribed: 0,
    shipping: 0,
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (rating === 0) {
      setError(t.reviews?.ratingRequired || "La valoración es requerida");
      return;
    }

    if (!comment.trim()) {
      setError(t.reviews?.commentRequired || "El comentario es requerido");
      return;
    }

    if (comment.trim().length < 10) {
      setError(t.reviews?.commentTooShort || "El comentario debe tener al menos 10 caracteres");
      return;
    }

    const reviewData: CreateReviewData = {
      auctionId,
      auctionTitle,
      auctionImage,
      sellerId,
      sellerName,
      rating,
      title: title.trim(),
      comment: comment.trim(),
    };

    // Solo agregar aspectos si se han valorado todos
    if (showAspects && aspects.communication > 0 && aspects.itemAsDescribed > 0 && aspects.shipping > 0) {
      reviewData.aspects = aspects;
    }

    try {
      await onSubmit(reviewData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al enviar la valoración";
      setError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auction Preview */}
      <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        {auctionImage && (
          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
            <img
              src={auctionImage}
              alt={auctionTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-medium text-white truncate">{auctionTitle}</h3>
          <p className="text-sm text-gray-400">
            {t.reviews?.ratingFor || "Valorar a"}: {sellerName}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" message={error} onClose={() => setError("")} />
      )}

      {/* Rating Principal */}
      <StarRatingInput
        value={rating}
        onChange={setRating}
        label={t.reviews?.overallRating || "Valoración general"}
        required
      />

      {/* Título (opcional) */}
      <Input
        label={t.reviews?.reviewTitle || "Título (opcional)"}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t.reviews?.reviewTitlePlaceholder || "Resume tu experiencia"}
        maxLength={100}
      />

      {/* Comentario */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-200 mb-1.5">
          {t.reviews?.comment || "Comentario"} <span className="text-red-400">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.reviews?.commentPlaceholder || "Describe tu experiencia con este vendedor..."}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          rows={4}
          maxLength={1000}
        />
        <div className="mt-1 text-xs text-gray-500 text-right">
          {comment.length}/1000
        </div>
      </div>

      {/* Toggle Aspectos Detallados */}
      <button
        type="button"
        onClick={() => setShowAspects(!showAspects)}
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
      >
        <Star className="w-4 h-4" />
        {showAspects
          ? t.reviews?.hideDetailedRatings || "Ocultar valoraciones detalladas"
          : t.reviews?.showDetailedRatings || "Agregar valoraciones detalladas (opcional)"}
      </button>

      {/* Aspectos Detallados */}
      {showAspects && (
        <div className="p-4 bg-slate-800/30 rounded-xl space-y-4">
          <StarRatingInput
            value={aspects.communication}
            onChange={(v) => setAspects({ ...aspects, communication: v })}
            label={t.reviews?.communication || "Comunicación"}
            size="md"
          />
          <StarRatingInput
            value={aspects.itemAsDescribed}
            onChange={(v) => setAspects({ ...aspects, itemAsDescribed: v })}
            label={t.reviews?.itemAsDescribed || "Artículo como se describe"}
            size="md"
          />
          <StarRatingInput
            value={aspects.shipping}
            onChange={(v) => setAspects({ ...aspects, shipping: v })}
            label={t.reviews?.shipping || "Envío"}
            size="md"
          />
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
          >
            {t.common.cancel}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1"
          disabled={rating === 0 || !comment.trim()}
        >
          {t.reviews?.submitReview || "Enviar valoración"}
        </Button>
      </div>
    </form>
  );
}

export default ReviewForm;
