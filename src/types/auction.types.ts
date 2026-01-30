import { Timestamp } from "firebase/firestore";

export type AuctionStatus = "draft" | "scheduled" | "active" | "ended" | "cancelled";

export type AuctionCategory =
  | "electronics"
  | "vehicles"
  | "fashion"
  | "home"
  | "sports"
  | "toys"
  | "books"
  | "music"
  | "art"
  | "antiques"
  | "jewelry"
  | "tools"
  | "garden"
  | "pets"
  | "baby"
  | "health"
  | "other";

export const CATEGORY_LABELS: Record<AuctionCategory, string> = {
  electronics: "Electrónica y Tecnología",
  vehicles: "Vehículos y Accesorios",
  fashion: "Ropa, Zapatos y Accesorios",
  home: "Hogar y Decoración",
  sports: "Deportes y Fitness",
  toys: "Juguetes y Hobbies",
  books: "Libros, Películas y Música",
  music: "Instrumentos Musicales",
  art: "Arte y Antigüedades",
  antiques: "Coleccionables y Memorabilia",
  jewelry: "Joyería y Relojes",
  tools: "Herramientas y Bricolaje",
  garden: "Jardín y Exterior",
  pets: "Mascotas y Accesorios",
  baby: "Bebés y Niños",
  health: "Salud y Belleza",
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
