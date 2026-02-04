import { Timestamp } from "firebase/firestore";

export type ReportReason =
  | "spam"
  | "fraud"
  | "harassment"
  | "fake_listing"
  | "other";

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

export interface CreateUserReportData {
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  details?: string;
  auctionId?: string | null;
  conversationId?: string | null;
}
