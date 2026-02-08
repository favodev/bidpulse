import { Timestamp } from "firebase/firestore";

export type ReportReason =
  | "spam"
  | "fraud"
  | "harassment"
  | "fake_listing"
  | "inappropriate_content"
  | "counterfeit"
  | "misleading_description"
  | "other";

export type ReportTargetType = "user" | "auction";

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  details?: string;
  auctionId?: string | null;
  conversationId?: string | null;
  status: "pending" | "reviewing" | "resolved";
  createdAt: Timestamp;
}

export interface AuctionReport {
  id: string;
  reporterId: string;
  auctionId: string;
  auctionTitle: string;
  sellerId: string;
  reason: ReportReason;
  details?: string;
  status: "pending" | "reviewing" | "resolved";
  createdAt: Timestamp;
}

export interface CreateUserReportData {
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  details?: string;
  auctionId?: string | null;
  conversationId?: string | null;
}

export interface CreateAuctionReportData {
  reporterId: string;
  auctionId: string;
  auctionTitle: string;
  sellerId: string;
  reason: ReportReason;
  details?: string;
}
