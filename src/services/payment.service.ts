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
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Transaction,
  PaymentMethod,
  SellerConnectAccount,
  TransactionFilters,
  PaymentResult,
  PaymentStatus,
  TransactionStats,
} from "@/types/payment.types";

// ─── Colecciones ────────────────────────────────────────────────────────────

const TRANSACTIONS_COLLECTION = "transactions";
const PAYMENT_METHODS_COLLECTION = "payment_methods";
const CONNECT_ACCOUNTS_COLLECTION = "connect_accounts";

const transactionsRef = collection(db, TRANSACTIONS_COLLECTION);
const paymentMethodsRef = collection(db, PAYMENT_METHODS_COLLECTION);
const connectAccountsRef = collection(db, CONNECT_ACCOUNTS_COLLECTION);

// ─── Transacciones ──────────────────────────────────────────────────────────

/** Obtener una transacción por ID */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return { id: docSnap.id, ...docSnap.data() } as Transaction;
  } catch (error) {
    console.error("[PaymentService] Error getting transaction:", error);
    throw error;
  }
}

/** Obtener transacción por ID de subasta */
export async function getTransactionByAuction(auctionId: string): Promise<Transaction | null> {
  try {
    const q = query(transactionsRef, where("auctionId", "==", auctionId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Transaction;
  } catch (error) {
    console.error("[PaymentService] Error getting transaction by auction:", error);
    throw error;
  }
}

/** Listar transacciones con filtros */
export async function getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  try {
    let q = query(transactionsRef);

    if (filters.userId && filters.role === "buyer") {
      q = query(q, where("buyerId", "==", filters.userId));
    } else if (filters.userId && filters.role === "seller") {
      q = query(q, where("sellerId", "==", filters.userId));
    } else if (filters.userId) {
      // Sin rol específico, buscar como comprador
      q = query(q, where("buyerId", "==", filters.userId));
    }

    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }

    if (filters.auctionId) {
      q = query(q, where("auctionId", "==", filters.auctionId));
    }

    const sortField = filters.sortBy || "createdAt";
    const sortDirection = filters.sortOrder || "desc";
    q = query(q, orderBy(sortField, sortDirection));

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
  } catch (error) {
    console.error("[PaymentService] Error getting transactions:", error);
    throw error;
  }
}

/** Suscribirse a transacciones en tiempo real */
export function subscribeToTransactions(
  userId: string,
  role: "buyer" | "seller",
  callback: (transactions: Transaction[]) => void
): Unsubscribe {
  const field = role === "buyer" ? "buyerId" : "sellerId";
  const q = query(
    transactionsRef,
    where(field, "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const transactions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
    callback(transactions);
  });
}

/** Calcular estadísticas de transacciones */
export async function getTransactionStats(userId: string): Promise<TransactionStats> {
  try {
    // Compras
    const buyerQ = query(transactionsRef, where("buyerId", "==", userId));
    const buyerSnap = await getDocs(buyerQ);
    const buyerTxns = buyerSnap.docs.map((d) => d.data() as Omit<Transaction, "id">);

    // Ventas
    const sellerQ = query(transactionsRef, where("sellerId", "==", userId));
    const sellerSnap = await getDocs(sellerQ);
    const sellerTxns = sellerSnap.docs.map((d) => d.data() as Omit<Transaction, "id">);

    const allTxns = [...buyerTxns, ...sellerTxns];

    return {
      totalTransactions: allTxns.length,
      totalSpent: buyerTxns
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0),
      totalEarned: sellerTxns
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + t.sellerAmount, 0),
      pendingPayments: allTxns.filter((t) => t.status === "pending" || t.status === "processing").length,
      completedPayments: allTxns.filter((t) => t.status === "completed").length,
    };
  } catch (error) {
    console.error("[PaymentService] Error getting transaction stats:", error);
    throw error;
  }
}

// ─── Métodos de pago ────────────────────────────────────────────────────────

/** Obtener métodos de pago de un usuario */
export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  try {
    const q = query(
      paymentMethodsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentMethod));
  } catch (error) {
    console.error("[PaymentService] Error getting payment methods:", error);
    throw error;
  }
}

/** Guardar método de pago desde Stripe */
export async function savePaymentMethod(data: Omit<PaymentMethod, "id" | "createdAt" | "updatedAt">): Promise<PaymentResult> {
  try {
    // Si es default, quitar default de los demás
    if (data.isDefault) {
      const existing = await getPaymentMethods(data.userId);
      for (const pm of existing) {
        if (pm.isDefault) {
          await updateDoc(doc(db, PAYMENT_METHODS_COLLECTION, pm.id), {
            isDefault: false,
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    await addDoc(paymentMethodsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("[PaymentService] Error saving payment method:", error);
    return { success: false, error: "Error al guardar método de pago" };
  }
}

/** Establecer un método de pago como predeterminado */
export async function setDefaultPaymentMethod(userId: string, methodId: string): Promise<PaymentResult> {
  try {
    const existing = await getPaymentMethods(userId);
    for (const pm of existing) {
      await updateDoc(doc(db, PAYMENT_METHODS_COLLECTION, pm.id), {
        isDefault: pm.id === methodId,
        updatedAt: serverTimestamp(),
      });
    }
    return { success: true };
  } catch (error) {
    console.error("[PaymentService] Error setting default payment method:", error);
    return { success: false, error: "Error al actualizar método de pago" };
  }
}

/** Eliminar un método de pago */
export async function deletePaymentMethod(methodId: string): Promise<PaymentResult> {
  try {
    const { deleteDoc: deleteFn } = await import("firebase/firestore");
    await deleteFn(doc(db, PAYMENT_METHODS_COLLECTION, methodId));
    return { success: true };
  } catch (error) {
    console.error("[PaymentService] Error deleting payment method:", error);
    return { success: false, error: "Error al eliminar método de pago" };
  }
}

// ─── Stripe Connect (cuentas de vendedor) ───────────────────────────────────

/** Obtener cuenta Connect de un seller */
export async function getConnectAccount(userId: string): Promise<SellerConnectAccount | null> {
  try {
    const q = query(connectAccountsRef, where("userId", "==", userId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { ...d.data(), userId: d.data().userId } as SellerConnectAccount;
  } catch (error) {
    console.error("[PaymentService] Error getting connect account:", error);
    throw error;
  }
}

/** Suscribirse a cambios en la cuenta Connect */
export function subscribeToConnectAccount(
  userId: string,
  callback: (account: SellerConnectAccount | null) => void
): Unsubscribe {
  const q = query(connectAccountsRef, where("userId", "==", userId), limit(1));
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
      return;
    }
    const d = snap.docs[0];
    callback({ ...d.data(), userId: d.data().userId } as SellerConnectAccount);
  });
}

// ─── Checkout (llama a API routes) ──────────────────────────────────────────

/** Crear sesión de checkout para una subasta ganada */
export async function createCheckoutSession(auctionId: string, currency: string): Promise<{ sessionUrl: string } | { error: string }> {
  try {
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auctionId, currency }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Error al crear sesión de pago" };
    return { sessionUrl: data.sessionUrl };
  } catch (error) {
    console.error("[PaymentService] Error creating checkout session:", error);
    return { error: "Error de conexión al crear sesión de pago" };
  }
}

/** Iniciar onboarding de Stripe Connect para vendedores */
export async function createConnectOnboarding(): Promise<{ onboardingUrl: string } | { error: string }> {
  try {
    const res = await fetch("/api/payments/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Error al crear cuenta de vendedor" };
    return { onboardingUrl: data.onboardingUrl };
  } catch (error) {
    console.error("[PaymentService] Error creating connect onboarding:", error);
    return { error: "Error de conexión al configurar cuenta de vendedor" };
  }
}

/** Obtener enlace al dashboard de Stripe Connect */
export async function getConnectDashboardLink(): Promise<{ url: string } | { error: string }> {
  try {
    const res = await fetch("/api/payments/connect/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Error al obtener enlace" };
    return { url: data.url };
  } catch (error) {
    console.error("[PaymentService] Error getting connect dashboard link:", error);
    return { error: "Error de conexión" };
  }
}
