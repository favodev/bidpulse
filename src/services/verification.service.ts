import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, VerificationRequest, VerificationStatus } from "@/types/user.types";
import { sanitizeMultiline } from "@/lib/sanitize";
import { validateVerificationRequest } from "@/lib/validation";

const VERIFICATION_COLLECTION = "verification_requests";
const USERS_COLLECTION = "users";

/**
 * Criterios mínimos para solicitar verificación
 */
export interface VerificationEligibility {
  eligible: boolean;
  reasons: string[];
  details: {
    emailVerified: boolean;
    accountAge: number; // días
    auctionsCreated: number;
    hasNoPendingRequest: boolean;
    isAlreadyVerified: boolean;
  };
}

/**
 * Verifica si un usuario es elegible para solicitar verificación
 */
export async function checkVerificationEligibility(
  userId: string,
  emailVerified: boolean
): Promise<VerificationEligibility> {
  const reasons: string[] = [];
  
  // Obtener perfil del usuario
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return {
      eligible: false,
      reasons: ["Usuario no encontrado"],
      details: {
        emailVerified: false,
        accountAge: 0,
        auctionsCreated: 0,
        hasNoPendingRequest: true,
        isAlreadyVerified: false,
      },
    };
  }

  const profile = { id: userSnap.id, ...userSnap.data() } as UserProfile;

  // Ya verificado
  if (profile.isVerified) {
    return {
      eligible: false,
      reasons: ["Ya estás verificado como vendedor"],
      details: {
        emailVerified,
        accountAge: daysSince(profile.createdAt),
        auctionsCreated: profile.stats.auctionsCreated,
        hasNoPendingRequest: true,
        isAlreadyVerified: true,
      },
    };
  }

  // Verificar email
  if (!emailVerified) {
    reasons.push("Debes verificar tu email primero");
  }

  // Antigüedad de la cuenta (mínimo 7 días)
  const accountAgeDays = daysSince(profile.createdAt);
  if (accountAgeDays < 7) {
    reasons.push(`Tu cuenta debe tener al menos 7 días (tienes ${accountAgeDays})`);
  }

  // Al menos 1 subasta creada
  if (profile.stats.auctionsCreated < 1) {
    reasons.push("Debes haber creado al menos 1 subasta");
  }

  // Verificar si ya tiene una solicitud pendiente
  const pendingRequest = await getPendingVerificationRequest(userId);
  const hasNoPendingRequest = !pendingRequest;
  if (!hasNoPendingRequest) {
    reasons.push("Ya tienes una solicitud de verificación pendiente");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    details: {
      emailVerified,
      accountAge: accountAgeDays,
      auctionsCreated: profile.stats.auctionsCreated,
      hasNoPendingRequest,
      isAlreadyVerified: false,
    },
  };
}

/**
 * Envía una solicitud de verificación de vendedor
 */
export async function requestSellerVerification(
  userId: string,
  userName: string,
  userEmail: string,
  reason: string,
  emailVerified: boolean
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    // Validación
    const validation = validateVerificationRequest({
      userId,
      reason,
    } as Record<string, unknown>);
    if (!validation.valid) {
      return { success: false, error: validation.errors[0] };
    }

    // Verificar elegibilidad
    const eligibility = await checkVerificationEligibility(userId, emailVerified);
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reasons[0] };
    }

    // Sanitizar razón
    const sanitizedReason = sanitizeMultiline(reason).slice(0, 1000);

    // Obtener stats del usuario
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    const profile = userSnap.exists() ? (userSnap.data() as UserProfile) : null;

    // Crear solicitud
    const verificationRef = collection(db, VERIFICATION_COLLECTION);
    const requestData = {
      userId,
      userName,
      userEmail,
      reason: sanitizedReason,
      status: "pending" as VerificationStatus,
      auctionsCreated: profile?.stats.auctionsCreated || 0,
      rating: profile?.stats.rating || 0,
      reviewsCount: profile?.stats.reviewsCount || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(verificationRef, requestData);

    // Actualizar perfil del usuario
    await updateDoc(userRef, {
      verificationStatus: "pending",
      verificationRequestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("[VerificationService] Request created:", docRef.id);
    return { success: true, requestId: docRef.id };
  } catch (error) {
    console.error("[VerificationService] Error requesting verification:", error);
    return { success: false, error: "Error al enviar la solicitud" };
  }
}

/**
 * Obtiene la solicitud de verificación pendiente de un usuario
 */
export async function getPendingVerificationRequest(
  userId: string
): Promise<VerificationRequest | null> {
  try {
    const q = query(
      collection(db, VERIFICATION_COLLECTION),
      where("userId", "==", userId),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as VerificationRequest;
  } catch (error) {
    console.error("[VerificationService] Error getting pending request:", error);
    return null;
  }
}

/**
 * Obtiene la última solicitud de verificación de un usuario
 */
export async function getLatestVerificationRequest(
  userId: string
): Promise<VerificationRequest | null> {
  try {
    const q = query(
      collection(db, VERIFICATION_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;

    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as VerificationRequest;
  } catch (error) {
    console.error("[VerificationService] Error getting latest request:", error);
    return null;
  }
}

/**
 * Aprueba una solicitud de verificación (admin)
 */
export async function approveVerification(requestId: string): Promise<boolean> {
  try {
    return await runTransaction(db, async (transaction) => {
      const requestRef = doc(db, VERIFICATION_COLLECTION, requestId);
      const requestSnap = await transaction.get(requestRef);

      if (!requestSnap.exists()) return false;

      const request = requestSnap.data() as VerificationRequest;
      const userRef = doc(db, USERS_COLLECTION, request.userId);

      // Atomically update request + user profile
      transaction.update(requestRef, {
        status: "approved",
        updatedAt: serverTimestamp(),
      });

      transaction.update(userRef, {
        isVerified: true,
        isSeller: true,
        verificationStatus: "approved",
        verificationApprovedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("[VerificationService] Approved verification for user:", request.userId);
      return true;
    });
  } catch (error) {
    console.error("[VerificationService] Error approving verification:", error);
    return false;
  }
}

/**
 * Rechaza una solicitud de verificación (admin)
 */
export async function rejectVerification(
  requestId: string,
  rejectionReason: string
): Promise<boolean> {
  try {
    return await runTransaction(db, async (transaction) => {
      const requestRef = doc(db, VERIFICATION_COLLECTION, requestId);
      const requestSnap = await transaction.get(requestRef);

      if (!requestSnap.exists()) return false;

      const request = requestSnap.data() as VerificationRequest;
      const userRef = doc(db, USERS_COLLECTION, request.userId);

      // Atomically update request + user profile
      transaction.update(requestRef, {
        status: "rejected",
        rejectionReason,
        updatedAt: serverTimestamp(),
      });

      transaction.update(userRef, {
        verificationStatus: "rejected",
        updatedAt: serverTimestamp(),
      });

      return true;
    });
  } catch (error) {
    console.error("[VerificationService] Error rejecting verification:", error);
    return false;
  }
}

// ─── Helpers ───

function daysSince(timestamp: Timestamp): number {
  if (!timestamp?.toMillis) return 0;
  const now = Date.now();
  const created = timestamp.toMillis();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

/**
 * Obtiene todas las solicitudes de verificación (admin)
 */
export async function getAllVerificationRequests(
  statusFilter?: VerificationStatus
): Promise<VerificationRequest[]> {
  try {
    const verificationRef = collection(db, VERIFICATION_COLLECTION);
    let q;

    if (statusFilter) {
      q = query(verificationRef, where("status", "==", statusFilter), orderBy("createdAt", "desc"));
    } else {
      q = query(verificationRef, orderBy("createdAt", "desc"));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as VerificationRequest));
  } catch (error) {
    console.error("[VerificationService] Error getting all requests:", error);
    return [];
  }
}
