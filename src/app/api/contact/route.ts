import { NextResponse } from "next/server";
import { Resend } from "resend";
import { sanitizeContactForm, escapeHtml } from "@/lib/sanitize";
import { validateContactForm } from "@/lib/validation";

// Inicializar Resend con la API key desde variables de entorno
const resend = new Resend(process.env.RESEND_API_KEY);

// Email de destino para los mensajes de contacto
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "fernando.aurelio.ortiz@gmail.com";

// Rate limiting en memoria para el servidor
const contactRateLimit = new Map<string, number[]>();
const CONTACT_RATE_WINDOW = 300_000; // 5 minutos
const CONTACT_RATE_MAX = 3;

function checkServerRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (contactRateLimit.get(ip) || []).filter(
    (ts) => now - ts < CONTACT_RATE_WINDOW
  );
  if (timestamps.length >= CONTACT_RATE_MAX) return false;
  timestamps.push(now);
  contactRateLimit.set(ip, timestamps);
  return true;
}

export async function POST(request: Request) {
  try {
    // Rate limiting por IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkServerRateLimit(ip)) {
      return NextResponse.json(
        { error: "Demasiados mensajes. Intenta más tarde." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validación server-side
    const validation = validateContactForm(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }

    // Sanitización
    const { name, email, subject, message } = sanitizeContactForm(body);

    // Validar campos requeridos post-sanitización
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Enviar email usando Resend - todo escapado contra XSS
    const { data, error } = await resend.emails.send({
      from: "BidPulse <onboarding@resend.dev>", 
      to: [CONTACT_EMAIL],
      replyTo: email,
      subject: `[BidPulse Contacto] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Nuevo mensaje de contacto</h2>
          <hr style="border: 1px solid #e2e8f0;" />
          
          <p><strong>De:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Asunto:</strong> ${escapeHtml(subject)}</p>
          
          <h3 style="color: #334155;">Mensaje:</h3>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            ${escapeHtml(message).replace(/\n/g, "<br>")}
          </div>
          
          <hr style="border: 1px solid #e2e8f0; margin-top: 24px;" />
          <p style="color: #64748b; font-size: 12px;">
            Este mensaje fue enviado desde el formulario de contacto de BidPulse.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[API Contact] Error Resend:", error);
      return NextResponse.json(
        { error: "Error al enviar el email" },
        { status: 500 }
      );
    }

    console.log("[API Contact] Email enviado:", data?.id);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("[API Contact] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
