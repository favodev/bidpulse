import { Timestamp } from "firebase/firestore";

export type NotificationType = 
  | "outbid"           
  | "auction_won"     
  | "auction_ending"   
  | "auction_ended"    
  | "new_bid"         
  | "new_message"     
  | "welcome"         
  | "system";          

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  
  // Datos adicionales según el tipo
  data?: {
    auctionId?: string;
    auctionTitle?: string;
    bidAmount?: number;
    bidderName?: string;
    conversationId?: string;
    senderId?: string;
    senderName?: string;
  };
  
  // Estado
  read: boolean;
  createdAt: Timestamp;
  
  // Para push notifications
  sent: boolean;
  sentAt?: Timestamp;
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Notification["data"];
}

// Para notificaciones push del navegador
export interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Timestamp;
  userAgent?: string;
}

// Preferencias de notificaciones 
export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  outbidAlerts: boolean;
  endingSoonAlerts: boolean;
}

// Resultado de operaciones
export interface NotificationResult {
  success: boolean;
  error?: string;
}
