/**
 * Validación de datos en servidor
 * Funciones de validación reutilizables para API routes y servicios
 */

import { sanitizeNumber, isValidEmail } from "./sanitize";

// ─── Tipos de resultado de validación ───

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}

function merge(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

// ─── Validadores primitivos ───

export function validateRequired(value: unknown, fieldName: string): ValidationResult {
  if (value === null || value === undefined) {
    return fail(`${fieldName} es requerido`);
  }
  if (typeof value === "string" && value.trim().length === 0) {
    return fail(`${fieldName} no puede estar vacío`);
  }
  return ok();
}

export function validateString(value: unknown, fieldName: string, minLen = 1, maxLen = 1000): ValidationResult {
  if (typeof value !== "string") {
    return fail(`${fieldName} debe ser texto`);
  }
  const clean = value.trim();
  if (clean.length < minLen) {
    return fail(`${fieldName} debe tener al menos ${minLen} caracteres`);
  }
  if (clean.length > maxLen) {
    return fail(`${fieldName} no puede exceder ${maxLen} caracteres`);
  }
  return ok();
}

export function validateNumber(value: unknown, fieldName: string, min?: number, max?: number): ValidationResult {
  const num = sanitizeNumber(value);
  if (isNaN(num)) {
    return fail(`${fieldName} debe ser un número válido`);
  }
  if (min !== undefined && num < min) {
    return fail(`${fieldName} debe ser al menos ${min}`);
  }
  if (max !== undefined && num > max) {
    return fail(`${fieldName} no puede exceder ${max}`);
  }
  return ok();
}

export function validateEmailField(value: unknown, fieldName: string): ValidationResult {
  if (typeof value !== "string") {
    return fail(`${fieldName} debe ser texto`);
  }
  if (!isValidEmail(value.trim())) {
    return fail(`${fieldName} no tiene un formato válido`);
  }
  return ok();
}

// ─── Validadores de dominio ───

const VALID_CATEGORIES = [
  "electronics", "vehicles", "fashion", "home", "sports", "toys",
  "books", "music", "art", "antiques", "jewelry", "tools",
  "garden", "pets", "baby", "health", "other",
];

/**
 * Valida datos de creación de subasta (server-side)
 */
export function validateCreateAuction(data: Record<string, unknown>): ValidationResult {
  return merge(
    validateRequired(data.title, "Título"),
    validateString(data.title, "Título", 3, 200),
    validateString(data.description, "Descripción", 0, 5000),
    validateCategory(data.category),
    validateNumber(data.startingPrice, "Precio inicial", 0.01, 999_999_999),
    validateNumber(data.bidIncrement, "Incremento de puja", 0.01, 999_999),
    data.reservePrice != null
      ? validateNumber(data.reservePrice, "Precio reserva", 0.01, 999_999_999)
      : ok(),
    validateAuctionImages(data.images),
    validateAuctionDates(data.startTime, data.endTime),
  );
}

function validateCategory(value: unknown): ValidationResult {
  if (typeof value !== "string" || !VALID_CATEGORIES.includes(value)) {
    return fail(`Categoría inválida. Debe ser una de: ${VALID_CATEGORIES.join(", ")}`);
  }
  return ok();
}

function validateAuctionImages(images: unknown): ValidationResult {
  if (!Array.isArray(images)) {
    return fail("Las imágenes deben ser un array");
  }
  if (images.length === 0) {
    return fail("Debes agregar al menos 1 imagen");
  }
  if (images.length > 5) {
    return fail("Máximo 5 imágenes permitidas");
  }
  for (const img of images) {
    if (typeof img !== "string") {
      return fail("Cada imagen debe ser un string válido");
    }
    // Skip already-uploaded URL images
    if (img.startsWith("http")) continue;
    // Base64 images: reject SVGs (XSS vector) and verify format
    if (!img.startsWith("data:image/")) {
      return fail("Formato de imagen inválido");
    }
    if (img.startsWith("data:image/svg")) {
      return fail("Formato SVG no permitido por seguridad");
    }
    // Check max size (~2MB in base64 = ~2.7M chars)
    if (img.length > 2_700_000) {
      return fail("Imagen demasiado grande. Máximo 2MB por imagen");
    }
  }
  return ok();
}

function validateAuctionDates(startTime: unknown, endTime: unknown): ValidationResult {
  const errors: string[] = [];

  if (!startTime) {
    errors.push("Fecha de inicio es requerida");
  }
  if (!endTime) {
    errors.push("Fecha de fin es requerida");
  }

  if (startTime && endTime) {
    const start = startTime instanceof Date ? startTime.getTime() : new Date(startTime as string).getTime();
    const end = endTime instanceof Date ? endTime.getTime() : new Date(endTime as string).getTime();
    const now = Date.now();

    if (isNaN(start)) errors.push("Fecha de inicio inválida");
    if (isNaN(end)) errors.push("Fecha de fin inválida");

    if (!isNaN(start) && !isNaN(end)) {
      // Check start time is in the future (with 1 minute tolerance)
      if (start < now - 60_000) {
        errors.push("La fecha de inicio debe ser en el futuro");
      }

      if (end <= start) {
        errors.push("La fecha de fin debe ser posterior a la de inicio");
      }

      const minDuration = 60 * 60 * 1000; // 1 hora mínimo
      if (end - start < minDuration) {
        errors.push("La subasta debe durar al menos 1 hora");
      }

      const maxDuration = 30 * 24 * 60 * 60 * 1000; // 30 días máximo
      if (end - start > maxDuration) {
        errors.push("La subasta no puede durar más de 30 días");
      }
    }
  }

  return errors.length > 0 ? fail(...errors) : ok();
}

/**
 * Valida datos de puja (server-side)
 */
export function validateBidData(data: Record<string, unknown>): ValidationResult {
  return merge(
    validateRequired(data.auctionId, "ID de subasta"),
    validateRequired(data.bidderId, "ID de pujador"),
    validateString(data.bidderName, "Nombre del pujador", 1, 100),
    validateNumber(data.amount, "Monto de puja", 0.01, 999_999_999),
    data.maxAutoBid != null
      ? validateNumber(data.maxAutoBid, "Límite auto puja", 0.01, 999_999_999)
      : ok(),
  );
}

/**
 * Valida datos de contacto (server-side)
 */
export function validateContactForm(data: Record<string, unknown>): ValidationResult {
  const results = [
    validateRequired(data.name, "Nombre"),
    validateString(data.name, "Nombre", 2, 100),
    validateRequired(data.email, "Email"),
    validateEmailField(data.email, "Email"),
    validateRequired(data.subject, "Asunto"),
    validateString(data.subject, "Asunto", 2, 200),
    validateRequired(data.message, "Mensaje"),
    validateString(data.message, "Mensaje", 10, 5000),
  ];
  return merge(...results);
}

/**
 * Valida datos de actualización de perfil (server-side)
 */
export function validateProfileUpdate(data: Record<string, unknown>): ValidationResult {
  const results: ValidationResult[] = [];

  if (data.displayName !== undefined) {
    results.push(validateString(data.displayName, "Nombre", 2, 100));
  }
  if (data.bio !== undefined) {
    results.push(validateString(data.bio, "Bio", 0, 500));
  }

  return results.length > 0 ? merge(...results) : ok();
}

/**
 * Valida los datos de una review
 */
export function validateReviewData(data: Record<string, unknown>): ValidationResult {
  return merge(
    validateRequired(data.sellerId, "ID del vendedor"),
    validateRequired(data.auctionId, "ID de subasta"),
    validateNumber(data.rating, "Calificación", 1, 5),
    data.comment ? validateString(data.comment, "Comentario", 0, 1000) : ok(),
  );
}

/**
 * Valida datos de solicitud de verificación de vendedor
 */
export function validateVerificationRequest(data: Record<string, unknown>): ValidationResult {
  return merge(
    validateRequired(data.userId, "ID de usuario"),
    validateRequired(data.reason, "Razón de solicitud"),
    validateString(data.reason, "Razón de solicitud", 20, 1000),
  );
}
