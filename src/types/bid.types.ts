import { Timestamp } from "firebase/firestore";

export interface Bid {
  id: string;
  
  auctionId: string;
  bidderId: string;
  bidderName: string;
  bidderAvatar?: string;
  amount: number;
  previousBid?: number;
  createdAt: Timestamp;
  isWinning: boolean;
  isAutoBid: boolean; 
}

export interface CreateBidData {
  auctionId: string;
  bidderId: string;
  bidderName: string;
  bidderAvatar?: string;
  amount: number;
}

export interface BidResult {
  success: boolean;
  bidId?: string;
  newCurrentBid?: number;
  timeExtended?: boolean;
  error?: BidError;
}

export type BidErrorCode =
  | "auction-not-found"
  | "auction-ended"
  | "auction-not-active"
  | "bid-too-low"
  | "self-bid"
  | "not-authenticated"
  | "network-error"
  | "unknown";

export interface BidError {
  code: BidErrorCode;
  message: string;
}

export const BID_ERROR_MESSAGES: Record<BidErrorCode, string> = {
  "auction-not-found": "La subasta no existe.",
  "auction-ended": "La subasta ya ha terminado.",
  "auction-not-active": "La subasta no está activa.",
  "bid-too-low": "Tu puja debe ser mayor a la puja actual más el incremento mínimo.",
  "self-bid": "No puedes pujar en tu propia subasta.",
  "not-authenticated": "Debes iniciar sesión para pujar.",
  "network-error": "Error de conexión. Intenta nuevamente.",
  "unknown": "Ocurrió un error inesperado.",
};
