interface RateLimitEntry {
  timestamps: number[];
}

// Almacenamiento en memoria (por sesión de navegador)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuración por defecto
const DEFAULT_WINDOW_MS = 60 * 1000; 
const DEFAULT_MAX_REQUESTS = 5; 

export function checkRateLimit(
  key: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS
): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  total: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key) || { timestamps: [] };

  // Limpiar timestamps fuera de la ventana
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    // Rate limit excedido
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = windowMs - (now - oldestInWindow);

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
      total: maxRequests,
    };
  }

  // Permitir y registrar
  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
    total: maxRequests,
  };
}

export function checkBidRateLimit(userId: string, auctionId: string): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  message?: string;
} {
  // Límite por usuario por subasta: 5 pujas/minuto
  const perAuction = checkRateLimit(
    `bid:${userId}:${auctionId}`,
    5,    
    60_000 
  );

  if (!perAuction.allowed) {
    const seconds = Math.ceil(perAuction.retryAfterMs / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: perAuction.retryAfterMs,
      message: `Demasiadas pujas. Intenta de nuevo en ${seconds} segundos.`,
    };
  }

  // Límite global por usuario: 20 pujas/minuto en total
  const global = checkRateLimit(
    `bid:${userId}:global`,
    20,    
    60_000 
  );

  if (!global.allowed) {
    const seconds = Math.ceil(global.retryAfterMs / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: global.retryAfterMs,
      message: `Has alcanzado el límite global de pujas. Intenta en ${seconds} segundos.`,
    };
  }

  return {
    allowed: true,
    remaining: perAuction.remaining,
    retryAfterMs: 0,
  };
}

/**
 * Rate limiter para contacto.
 * Limita a 3 mensajes cada 5 minutos.
 */
export function checkContactRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterMs: number;
  message?: string;
} {
  const result = checkRateLimit(
    `contact:${identifier}`,
    3,        
    300_000   
  );

  if (!result.allowed) {
    const seconds = Math.ceil(result.retryAfterMs / 1000);
    return {
      allowed: false,
      retryAfterMs: result.retryAfterMs,
      message: `Demasiados mensajes. Intenta en ${seconds} segundos.`,
    };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function cleanupRateLimitStore(maxAgeMs = 600_000): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // Eliminar si todos los timestamps son viejos
    const newest = Math.max(...entry.timestamps, 0);
    if (now - newest > maxAgeMs) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto-cleanup cada 10 minutos
if (typeof window !== "undefined") {
  setInterval(() => cleanupRateLimitStore(), 600_000);
}
