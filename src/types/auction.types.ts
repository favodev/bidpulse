import { Timestamp } from "firebase/firestore";

export type AuctionStatus = "draft" | "scheduled" | "active" | "ended" | "cancelled";

export type AuctionCategory =
  | "watches"
  | "vehicles"
  | "art"
  | "electronics"
  | "collectibles"
  | "jewelry"
  | "fashion"
  | "other";

export const CATEGORY_LABELS: Record<AuctionCategory, string> = {
  watches: "Relojes",
  vehicles: "Vehículos",
  art: "Arte & Diseño",
  electronics: "Electrónica",
  collectibles: "Coleccionables",
  jewelry: "Joyería",
  fashion: "Moda",
  other: "Otros",
};

export interface Auction {
  id: string;
  
  // Info básica
  title: string;
  description: string;
  category: AuctionCategory;
  images: string[]; 
  
  // Vendedor
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  
  // Precios
  startingPrice: number;
  currentBid: number;
  reservePrice?: number; 
  bidIncrement: number; 
  
  // Contadores
  bidsCount: number;
  watchersCount: number;
  
  // Tiempos
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Estado
  status: AuctionStatus;
  
  // Pujador más alto actual
  highestBidderId?: string;
  highestBidderName?: string;
  
  // Ganador 
  winnerId?: string;
  winnerName?: string;
  finalPrice?: number;
}

export interface CreateAuctionData {
  title: string;
  description: string;
  category: AuctionCategory;
  images: string[];
  startingPrice: number;
  reservePrice?: number;
  bidIncrement: number;
  startTime: Date;
  endTime: Date;
}

export interface AuctionFilters {
  category?: AuctionCategory;
  status?: AuctionStatus;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  sortBy?: "endTime" | "currentBid" | "bidsCount" | "createdAt";
  sortOrder?: "asc" | "desc";
  limit?: number;
}
