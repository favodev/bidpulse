import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CreateUserReportData, CreateAuctionReportData } from "@/types/report.types";

const USER_REPORTS_COLLECTION = "user_reports";
const AUCTION_REPORTS_COLLECTION = "auction_reports";

export async function createUserReport(
  data: CreateUserReportData
): Promise<string> {
  try {
    const reportsRef = collection(db, USER_REPORTS_COLLECTION);
    const docRef = await addDoc(reportsRef, {
      ...data,
      details: data.details || "",
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
      details: data.details || "",
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("[ReportService] Error creating auction report:", error);
    throw error;
  }
}
