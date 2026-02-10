import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sanitizeMultiline } from "@/lib/sanitize";
import type { CreateUserReportData, CreateAuctionReportData, UserReport, AuctionReport } from "@/types/report.types";

const USER_REPORTS_COLLECTION = "user_reports";
const AUCTION_REPORTS_COLLECTION = "auction_reports";

export async function createUserReport(
  data: CreateUserReportData
): Promise<string> {
  try {
    const reportsRef = collection(db, USER_REPORTS_COLLECTION);
    const docRef = await addDoc(reportsRef, {
      ...data,
      details: data.details ? sanitizeMultiline(data.details).slice(0, 2000) : "",
      auctionId: data.auctionId || null,
      conversationId: data.conversationId || null,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("[ReportService] Error creating user report:", error);
    throw error;
  }
}

export async function createAuctionReport(
  data: CreateAuctionReportData
): Promise<string> {
  try {
    const reportsRef = collection(db, AUCTION_REPORTS_COLLECTION);
    const docRef = await addDoc(reportsRef, {
      ...data,
      details: data.details ? sanitizeMultiline(data.details).slice(0, 2000) : "",
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("[ReportService] Error creating auction report:", error);
    throw error;
  }
}

/**
 * Get all user reports (admin)
 */
export async function getUserReports(
  statusFilter?: "pending" | "reviewing" | "resolved"
): Promise<UserReport[]> {
  try {
    const reportsRef = collection(db, USER_REPORTS_COLLECTION);
    const q = statusFilter
      ? query(reportsRef, where("status", "==", statusFilter), orderBy("createdAt", "desc"))
      : query(reportsRef, orderBy("createdAt", "desc"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UserReport));
  } catch (error) {
    console.error("[ReportService] Error getting user reports:", error);
    return [];
  }
}

/**
 * Get all auction reports (admin)
 */
export async function getAuctionReports(
  statusFilter?: "pending" | "reviewing" | "resolved"
): Promise<AuctionReport[]> {
  try {
    const reportsRef = collection(db, AUCTION_REPORTS_COLLECTION);
    const q = statusFilter
      ? query(reportsRef, where("status", "==", statusFilter), orderBy("createdAt", "desc"))
      : query(reportsRef, orderBy("createdAt", "desc"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AuctionReport));
  } catch (error) {
    console.error("[ReportService] Error getting auction reports:", error);
    return [];
  }
}

/**
 * Update report status (admin) with audit trail
 */
export async function updateReportStatus(
  reportId: string,
  type: "user" | "auction",
  status: "pending" | "reviewing" | "resolved"
): Promise<void> {
  try {
    const collectionName = type === "user" ? USER_REPORTS_COLLECTION : AUCTION_REPORTS_COLLECTION;
    const reportRef = doc(db, collectionName, reportId);
    await updateDoc(reportRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[ReportService] Error updating report status:", error);
    throw error;
  }
}
