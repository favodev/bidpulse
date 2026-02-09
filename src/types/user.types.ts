import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  id: string;
  
  // Info básica
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;

  location?: string;
  stats: UserStats;
  settings: UserSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  isVerified: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  
  // Verificación de vendedor
  verificationStatus?: VerificationStatus;
  verificationRequestedAt?: Timestamp;
  verificationApprovedAt?: Timestamp;
}

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  reason: string;
  status: VerificationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Datos que respaldan la solicitud
  auctionsCreated: number;
  rating: number;
  reviewsCount: number;
  rejectionReason?: string;
}

export interface UserStats {
  auctionsCreated: number;
  auctionsWon: number;
  totalBids: number;
  totalSpent: number;
  totalEarned: number;
  rating: number; // 0-5
  reviewsCount: number;
}

// la confi

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  outbidAlerts: boolean;
  endingSoonAlerts: boolean;
  currency: string;
  language: string;
}

// actualizar perfil

export interface UpdateProfileData {
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  settings?: Partial<UserSettings>;
}

// lista de seguimiento

export interface WatchlistItem {
  auctionId: string;
  addedAt: Timestamp;
}
