// Entities map para escape
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

const ENTITY_REGEX = /[&<>"'`/]/g;

/**
 * Escapa todos los caracteres HTML especiales de un string.
 * Uso: cuando quieres mostrar texto sin interpretar HTML.
 */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(ENTITY_REGEX, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Elimina TODOS los tags HTML de un string.
 * Uso: campos de texto plano (nombre, título, etc.)
 */
export function stripHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "") // Eliminar tags HTML
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Eliminar event handlers residuales
    .replace(/javascript\s*:/gi, "") // Eliminar javascript: URIs
    .replace(/data\s*:/gi, "") // Eliminar data: URIs
    .trim();
}

/**
 * Sanitiza un string para uso seguro.
 * Elimina tags HTML, scripts, y caracteres potencialmente peligrosos.
 * Permite texto plano seguro.
 */
export function sanitizeText(str: string): string {
  if (typeof str !== "string") return "";
  return stripHtml(str)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Eliminar caracteres de control
    .trim();
}

/**
 * Sanitiza texto que puede contener saltos de línea (descripciones, mensajes).
 * Preserva \n pero elimina HTML.
 */
export function sanitizeMultiline(str: string): string {
  if (typeof str !== "string") return "";
  return stripHtml(str)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Eliminar caracteres de control (preserva \n \r \t)
    .trim();
}

/**
 * Sanitiza un email.
 * Verifica formato básico y elimina caracteres peligrosos.
 */
export function sanitizeEmail(str: string): string {
  if (typeof str !== "string") return "";
  const cleaned = str.trim().toLowerCase();
  // Solo permitir caracteres válidos de email
  return cleaned.replace(/[^a-z0-9@._+\-]/g, "");
}

/**
 * Valida que un email tenga formato correcto.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitiza un número, retornando NaN si no es válido.
 */
export function sanitizeNumber(value: unknown): number {
  if (typeof value === "number") {
    return isFinite(value) ? value : NaN;
  }
  if (typeof value === "string") {
    const num = parseFloat(value);
    return isFinite(num) ? num : NaN;
  }
  return NaN;
}

/**
 * Sanitiza un objeto completo recorriendo sus propiedades string.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitizeText(value);
    }
  }
  return result;
}

/**
 * Sanitiza datos de formulario de contacto.
 */
export function sanitizeContactForm(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): { name: string; email: string; subject: string; message: string } {
  return {
    name: sanitizeText(data.name),
    email: sanitizeEmail(data.email),
    subject: sanitizeText(data.subject),
    message: sanitizeMultiline(data.message),
  };
}

/**
 * Sanitiza datos de creación de subasta.
 */
export function sanitizeAuctionData(data: {
  title: string;
  description: string;
  category: string;
  startingPrice: number;
  reservePrice?: number;
  bidIncrement: number;
}): {
  title: string;
  description: string;
  category: string;
  startingPrice: number;
  reservePrice?: number;
  bidIncrement: number;
} {
  return {
    title: sanitizeText(data.title).slice(0, 200), // Límite de longitud
    description: sanitizeMultiline(data.description).slice(0, 5000),
    category: sanitizeText(data.category),
    startingPrice: sanitizeNumber(data.startingPrice),
    reservePrice: data.reservePrice != null ? sanitizeNumber(data.reservePrice) : undefined,
    bidIncrement: sanitizeNumber(data.bidIncrement),
  };
}

/**
 * Sanitiza datos de perfil de usuario.
 */
export function sanitizeProfileData(data: {
  displayName?: string;
  bio?: string;
}): { displayName?: string; bio?: string } {
  return {
    displayName: data.displayName ? sanitizeText(data.displayName).slice(0, 100) : undefined,
    bio: data.bio ? sanitizeMultiline(data.bio).slice(0, 500) : undefined,
  };
}
