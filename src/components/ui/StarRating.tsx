"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  showValue = false,
  className = "",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => {
          const starIndex = index + 1;
          const isFilled = starIndex <= displayRating;
          const isHalf = !isFilled && starIndex - 0.5 <= displayRating;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              onMouseLeave={handleMouseLeave}
              className={`
                ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
                focus:outline-none
                disabled:opacity-100
              `}
              aria-label={`${starIndex} estrellas`}
            >
              <Star
                className={`
                  ${sizeClasses[size]}
                  transition-colors duration-150
                  ${
                    isFilled
                      ? "text-yellow-400 fill-yellow-400"
                      : isHalf
                      ? "text-yellow-400 fill-yellow-400/50"
                      : "text-gray-500"
                  }
                  ${interactive && hoverRating >= starIndex ? "text-yellow-300 fill-yellow-300" : ""}
                `}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="ml-1 text-gray-400 text-sm">
          {rating > 0 ? rating.toFixed(1) : "—"}
        </span>
      )}
    </div>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  label?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  required?: boolean;
}

export function StarRatingInput({
  value,
  onChange,
  label,
  error,
  size = "lg",
  required = false,
}: StarRatingInputProps) {
  const ratingLabels = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-200 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center gap-3">
        <StarRating
          rating={value}
          size={size}
          interactive
          onChange={onChange}
        />
        {value > 0 && (
          <span className="text-sm text-gray-400">
            {ratingLabels[value]}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

interface RatingDistributionProps {
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalReviews: number;
}

export function RatingDistribution({
  distribution,
  totalReviews,
}: RatingDistributionProps) {
  const ratings = [5, 4, 3, 2, 1] as const;

  return (
    <div className="space-y-2">
      {ratings.map((rating) => {
        const count = distribution[rating];
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-2">
            <span className="text-sm text-gray-400 w-3">{rating}</span>
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default StarRating;
