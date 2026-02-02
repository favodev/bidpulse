"use client";

import { Star } from "lucide-react";
import { StarRating, RatingDistribution } from "@/components/ui/StarRating";
import { SellerRatingSummary } from "@/types/review.types";
import { useLanguage } from "@/i18n";

interface SellerRatingSummaryCardProps {
  summary: SellerRatingSummary;
  sellerName?: string;
  compact?: boolean;
}

export function SellerRatingSummaryCard({
  summary,
  sellerName,
  compact = false,
}: SellerRatingSummaryCardProps) {
  const { t } = useLanguage();

  if (summary.totalReviews === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 text-center">
        <Star className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-gray-400">
          {t.reviews?.noReviewsYet || "Sin valoraciones aún"}
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <StarRating rating={summary.averageRating} size="sm" />
        <span className="text-white font-medium">{summary.averageRating.toFixed(1)}</span>
        <span className="text-gray-500">
          ({summary.totalReviews} {summary.totalReviews === 1 
            ? t.reviews?.review || "valoración" 
            : t.reviews?.reviews || "valoraciones"})
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      {sellerName && (
        <h3 className="text-lg font-semibold text-white mb-4">
          {t.reviews?.ratingsFor || "Valoraciones de"} {sellerName}
        </h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Promedio General */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-900/50 rounded-xl">
          <div className="text-5xl font-bold text-white mb-2">
            {summary.averageRating.toFixed(1)}
          </div>
          <StarRating rating={summary.averageRating} size="lg" />
          <div className="text-gray-400 mt-2">
            {summary.totalReviews} {summary.totalReviews === 1 
              ? t.reviews?.review || "valoración" 
              : t.reviews?.reviews || "valoraciones"}
          </div>
        </div>

        {/* Distribución */}
        <div>
          <RatingDistribution
            distribution={summary.ratingDistribution}
            totalReviews={summary.totalReviews}
          />
        </div>
      </div>

      {/* Promedios por Aspecto */}
      {summary.aspectAverages && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <h4 className="text-sm font-medium text-gray-400 mb-4">
            {t.reviews?.detailedRatings || "Valoraciones detalladas"}
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">
                {t.reviews?.communication || "Comunicación"}
              </div>
              <div className="flex items-center justify-center gap-2">
                <StarRating rating={summary.aspectAverages.communication} size="sm" />
                <span className="text-white font-medium">
                  {summary.aspectAverages.communication.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">
                {t.reviews?.itemAsDescribed || "Como se describe"}
              </div>
              <div className="flex items-center justify-center gap-2">
                <StarRating rating={summary.aspectAverages.itemAsDescribed} size="sm" />
                <span className="text-white font-medium">
                  {summary.aspectAverages.itemAsDescribed.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">
                {t.reviews?.shipping || "Envío"}
              </div>
              <div className="flex items-center justify-center gap-2">
                <StarRating rating={summary.aspectAverages.shipping} size="sm" />
                <span className="text-white font-medium">
                  {summary.aspectAverages.shipping.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerRatingSummaryCard;
