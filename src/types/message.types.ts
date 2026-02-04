import { Timestamp } from "firebase/firestore";

export interface Conversation {
  id: string;
  auctionId: string;
  auctionTitle: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string | null;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string | null;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateConversationData {
  auctionId: string;
  auctionTitle: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string | null;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  text: string;
  createdAt: Timestamp;
}

export interface CreateMessageData {
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  text: string;
}
