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
