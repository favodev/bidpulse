import { Timestamp } from "firebase/firestore";

export interface Review {
  id: string;
  
  // Subasta relacionada
  auctionId: string;
  auctionTitle: string;
  auctionImage?: string;
  
  // Quien escribe la review (comprador)
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  
  // Quien recibe la review (vendedor)
  sellerId: string;
  sellerName: string;
  
  // Contenido de la review
  rating: number; 
  title: string;
  comment: string;
  
  // Aspectos específicos (opcional)
  aspects?: ReviewAspects;
  
  // Respuesta del vendedor (opcional)
  sellerResponse?: SellerResponse;
  
  // Metadatos
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Estado
  isVerified: boolean; 
  isEdited: boolean;
}

export interface ReviewAspects {
  communication: number; 
  itemAsDescribed: number; 
  shipping: number;
}

export interface SellerResponse {
  comment: string;
  respondedAt: Timestamp;
}

export interface CreateReviewData {
  auctionId: string;
  auctionTitle: string;
  auctionImage?: string;
  sellerId: string;
  sellerName: string;
  rating: number;
  title: string;
  comment: string;
  aspects?: ReviewAspects;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  comment?: string;
  aspects?: ReviewAspects;
}

export interface ReviewFilters {
  sellerId?: string;
  reviewerId?: string;
  auctionId?: string;
  minRating?: number;
  sortBy?: "createdAt" | "rating";
  sortOrder?: "asc" | "desc";
  limit?: number;
}

export interface SellerRatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  aspectAverages?: {
    communication: number;
    itemAsDescribed: number;
    shipping: number;
  };
}
