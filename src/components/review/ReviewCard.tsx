"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, MessageSquare, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Review } from "@/types/review.types";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui";
import { useLanguage } from "@/i18n";
import { formatDistanceToNow } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
  showAuction?: boolean;
  showSellerResponseForm?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onRespond?: (reviewId: string, response: string) => void;
  isOwner?: boolean;
  isSeller?: boolean;
}

export function ReviewCard({
  review,
  showAuction = true,
  showSellerResponseForm = false,
  onEdit,
  onDelete,
  onRespond,
  isOwner = false,
  isSeller = false,
}: ReviewCardProps) {
  const { t } = useLanguage();
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const createdAt = review.createdAt?.toDate?.() 
    ? formatDistanceToNow(review.createdAt.toDate())
    : "";

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !onRespond) return;
    
    setSubmitting(true);
    try {
      await onRespond(review.id, responseText);
      setShowResponse(false);
      setResponseText("");
    } catch (error) {
      console.error("Error submitting response:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const isLongComment = review.comment.length > 200;

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0">
            {review.reviewerAvatar ? (
              <img
                src={review.reviewerAvatar}
                alt={review.reviewerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                {review.reviewerName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {review.reviewerName}
              </span>
              {review.isVerified && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle className="w-3 h-3" />
                  {t.reviews?.verified || "Verificado"}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">{createdAt}</span>
            {review.isEdited && (
              <span className="text-xs text-gray-600 ml-2">
                ({t.reviews?.edited || "editado"})
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {(isOwner || isSeller) && (
          <div className="flex items-center gap-2">
            {isOwner && onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title={t.common.edit}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {isOwner && onDelete && (
              <button
                onClick={() => onDelete(review.id)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                title={t.common.delete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {isSeller && !review.sellerResponse && showSellerResponseForm && (
              <button
                onClick={() => setShowResponse(!showResponse)}
                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                title={t.reviews?.respond || "Responder"}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rating & Title */}
      <div className="mb-3">
        <StarRating rating={review.rating} size="sm" />
        {review.title && (
          <h4 className="font-medium text-white mt-2">{review.title}</h4>
        )}
      </div>

      {/* Comment */}
      <p className={`text-gray-300 ${!expanded && isLongComment ? "line-clamp-3" : ""}`}>
        {review.comment}
      </p>
      {isLongComment && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-2 transition-colors"
        >
          {expanded ? (
            <>
              {t.common.seeLess} <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              {t.common.seeMore} <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {/* Aspect Ratings */}
      {review.aspects && (
        <div className="mt-4 grid grid-cols-3 gap-4 p-3 bg-slate-900/50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">
              {t.reviews?.communication || "Comunicación"}
            </div>
            <StarRating rating={review.aspects.communication} size="sm" />
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">
              {t.reviews?.itemAsDescribed || "Como se describe"}
            </div>
            <StarRating rating={review.aspects.itemAsDescribed} size="sm" />
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">
              {t.reviews?.shipping || "Envío"}
            </div>
            <StarRating rating={review.aspects.shipping} size="sm" />
          </div>
        </div>
      )}

      {/* Auction info */}
      {showAuction && review.auctionTitle && (
        <Link
          href={`/auction/${review.auctionId}`}
          className="mt-4 flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors group"
        >
          {review.auctionImage && (
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
              <img
                src={review.auctionImage}
                alt={review.auctionTitle}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <span className="text-sm text-gray-400 group-hover:text-white transition-colors truncate">
            {review.auctionTitle}
          </span>
        </Link>
      )}

      {/* Seller Response */}
      {review.sellerResponse && (
        <div className="mt-4 pl-4 border-l-2 border-blue-500/50">
          <div className="text-sm font-medium text-blue-400 mb-1">
            {t.reviews?.sellerResponse || "Respuesta del vendedor"}
          </div>
          <p className="text-sm text-gray-300">{review.sellerResponse.comment}</p>
          {review.sellerResponse.respondedAt && (
            <span className="text-xs text-gray-500 mt-1 block">
              {formatDistanceToNow(review.sellerResponse.respondedAt.toDate())}
            </span>
          )}
        </div>
      )}

      {/* Response Form */}
      {showResponse && (
        <div className="mt-4 space-y-3">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder={t.reviews?.responsePlaceholder || "Escribe tu respuesta..."}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResponse(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitResponse}
              isLoading={submitting}
              disabled={!responseText.trim()}
            >
              {t.reviews?.submitResponse || "Enviar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ReviewListProps {
  reviews: Review[];
  showAuction?: boolean;
  emptyMessage?: string;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onRespond?: (reviewId: string, response: string) => void;
  currentUserId?: string;
  sellerId?: string;
}

export function ReviewList({
  reviews,
  showAuction = true,
  emptyMessage,
  onEdit,
  onDelete,
  onRespond,
  currentUserId,
  sellerId,
}: ReviewListProps) {
  const { t } = useLanguage();

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">
          {emptyMessage || t.reviews?.noReviews || "No hay valoraciones aún"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          showAuction={showAuction}
          isOwner={currentUserId === review.reviewerId}
          isSeller={currentUserId === sellerId}
          showSellerResponseForm={currentUserId === sellerId}
          onEdit={onEdit}
          onDelete={onDelete}
          onRespond={onRespond}
        />
      ))}
    </div>
  );
}

export default ReviewCard;
