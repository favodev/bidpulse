import { Timestamp } from "firebase/firestore";

// ─── Estados ────────────────────────────────────────────────────────────────

export type PaymentStatus =
  | "pending"       // Creado, esperando pago
  | "processing"    // Pago en proceso
  | "completed"     // Pago exitoso
  | "failed"        // Pago fallido
  | "refunded"      // Reembolsado
  | "cancelled";    // Cancelado por usuario

export type PaymentProvider = "stripe"; 

export type PaymentMethodType = "card" | "bank_transfer" | "wallet";

export type ConnectStatus = "not_started" | "pending" | "active" | "restricted";

// ─── Transacción ────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;

  // Referencia a la subasta
  auctionId: string;
  auctionTitle: string;
  auctionImage?: string;

  // Participantes
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;

  // Montos
  amount: number;           // Monto total en la moneda original
  currency: string;         // Código de moneda (CLP, USD, etc.)
  platformFee: number;      // Comisión de la plataforma (0 por ahora)
  sellerAmount: number;     // Monto que recibe el vendedor
  
  // Stripe
  provider: PaymentProvider;
  providerPaymentId?: string;     // Stripe PaymentIntent ID
  providerSessionId?: string;     // Stripe Checkout Session ID
  providerTransferId?: string;    // Stripe Transfer ID

  // Estado
  status: PaymentStatus;
  statusMessage?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  refundedAt?: Timestamp;
}

// ─── Método de pago guardado ────────────────────────────────────────────────

export interface PaymentMethod {
  id: string;
  userId: string;
  
  // Tipo
  type: PaymentMethodType;
  provider: PaymentProvider;
  providerMethodId: string;    
  
  // Detalles de tarjeta 
  card?: {
    brand: string;     
    last4: string;
    expMonth: number;
    expYear: number;
  };
  
  // Estado
  isDefault: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Stripe Connect para vendedores ─────────────────────────────────────────

export interface SellerConnectAccount {
  userId: string;
  provider: PaymentProvider;
  providerAccountId: string; 
  status: ConnectStatus;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── DTOs / Inputs ──────────────────────────────────────────────────────────

export interface CreateCheckoutData {
  auctionId: string;
  currency: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  sessionUrl: string;
}

export interface CreateConnectAccountData {
  returnUrl: string;
  refreshUrl: string;
}

export interface ConnectOnboardingResult {
  accountId: string;
  onboardingUrl: string;
}

// ─── Filtros de transacciones ───────────────────────────────────────────────

export interface TransactionFilters {
  userId?: string;
  role?: "buyer" | "seller";
  status?: PaymentStatus;
  auctionId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "createdAt" | "amount";
  sortOrder?: "asc" | "desc";
  limit?: number;
}

// ─── Resultados genéricos ───────────────────────────────────────────────────

export interface PaymentResult {
  success: boolean;
  error?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  totalSpent: number;
  totalEarned: number;
  pendingPayments: number;
  completedPayments: number;
}
