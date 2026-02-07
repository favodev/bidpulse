/**
 * Servicio de Contacto
 * Gestiona mensajes de contacto enviados por usuarios
 * Los mensajes se guardan en Firestore y se envían por email via Resend
 */

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sanitizeContactForm } from "@/lib/sanitize";
import { validateContactForm } from "@/lib/validation";
import { checkContactRateLimit } from "@/lib/rateLimit";

const CONTACT_COLLECTION = "contact_messages";

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string; 
  status: "pending" | "read" | "replied";
  createdAt: ReturnType<typeof serverTimestamp>;
}

/**
 * Envía un mensaje de contacto
 * 1. Guarda el mensaje en Firestore para registro
 * 2. Envía email via API de Resend
 */
export async function sendContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string;
}): Promise<string> {
  try {
    // Rate limiting
    const rateCheck = checkContactRateLimit(data.userId || data.email);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.message || "Demasiados mensajes. Intenta más tarde.");
    }

    // Validación server-side
    const validation = validateContactForm(data as unknown as Record<string, unknown>);
    if (!validation.valid) {
      throw new Error(validation.errors[0]);
    }

    // Sanitización
    const sanitized = sanitizeContactForm(data);

    // 1. Guardar en Firestore
    const contactRef = collection(db, CONTACT_COLLECTION);
    
    const docRef = await addDoc(contactRef, {
      name: sanitized.name,
      email: sanitized.email,
      subject: sanitized.subject,
      message: sanitized.message,
      userId: data.userId || null,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    console.log("[ContactService] Mensaje guardado con ID:", docRef.id);

    // 2. Enviar email via API Route
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        }),
      });

      if (!response.ok) {
        console.warn("[ContactService] Email no enviado, pero mensaje guardado");
      } else {
        console.log("[ContactService] Email enviado correctamente");
      }
    } catch (emailError) {
      // Si falla el email, el mensaje ya está guardado en Firestore
      console.warn("[ContactService] Error enviando email:", emailError);
    }

    return docRef.id;
  } catch (error) {
    console.error("[ContactService] Error enviando mensaje:", error);
    throw error;
  }
}
