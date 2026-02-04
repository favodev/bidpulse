import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CreateUserReportData } from "@/types/report.types";

const REPORTS_COLLECTION = "user_reports";

export async function createUserReport(
  data: CreateUserReportData
): Promise<string> {
  try {
    const reportsRef = collection(db, REPORTS_COLLECTION);
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
    console.error("[ReportService] Error creating report:", error);
    throw error;
  }
}
