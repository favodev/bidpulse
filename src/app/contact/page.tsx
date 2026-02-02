"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Navbar, Footer } from "@/components/layout";
import { Button, Input, Alert } from "@/components/ui";
import { Send, CheckCircle, Mail } from "lucide-react";
import { sendContactMessage } from "@/services/contact.service";

/**
 * Página de Contacto
 * Permite a usuarios enviar mensajes al equipo de soporte
 * Si el usuario está logueado, auto-rellena nombre y email
 */
export default function ContactPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Auto-rellenar datos del usuario logueado
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Manejar cambios en inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Enviar mensaje a Firebase y por email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sendContactMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        userId: user?.uid,
      });
      
      setSuccess(true);
      // Limpiar solo asunto y mensaje (mantener nombre/email del usuario)
      setFormData((prev) => ({ ...prev, subject: "", message: "" }));
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar si el usuario está logueado para deshabilitar campos
  const isLoggedIn = !!user;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Encabezado */}
          <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t.contact.title}
          </h1>
          <p className="text-slate-400 text-lg">
            {t.contact.subtitle}
          </p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8">
          {success ? (
            // Estado de éxito
            <div className="space-y-6 text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-semibold text-white">
                {t.contact.success}
              </h3>
              <Button onClick={() => setSuccess(false)} variant="outline">
                {t.contact.sendAnother}
              </Button>
            </div>
          ) : (
            // Formulario de contacto
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error */}
              {error && (
                <Alert
                  variant="error"
                  title="Error"
                  message={error}
                  onClose={() => setError(null)}
                />
              )}

              {/* Nombre y Email - Solo lectura si está logueado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    {t.contact.name}
                  </label>
                  <Input 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required 
                    placeholder={t.contact.namePlaceholder} 
                    className={`bg-slate-950 border-slate-800 ${isLoggedIn ? "opacity-70" : ""}`}
                    disabled={isLoggedIn}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    {t.contact.email}
                  </label>
                  <Input 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required 
                    placeholder={t.contact.emailPlaceholder} 
                    className={`bg-slate-950 border-slate-800 ${isLoggedIn ? "opacity-70" : ""}`}
                    disabled={isLoggedIn}
                  />
                </div>
              </div>

              {/* Selector de asunto */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  {t.contact.subject}
                </label>
                <select 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-md border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
                  required
                >
                  <option value="">{t.contact.selectSubject}</option>
                  <option value="general">{t.contact.subjects.general}</option>
                  <option value="support">{t.contact.subjects.support}</option>
                  <option value="billing">{t.contact.subjects.billing}</option>
                  <option value="report">{t.contact.subjects.report}</option>
                  <option value="other">{t.contact.subjects.other}</option>
                </select>
              </div>

              {/* Mensaje */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  {t.contact.message}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-3 py-2 rounded-md border border-slate-800 bg-slate-950 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                  placeholder={t.contact.messagePlaceholder}
                />
              </div>

              {/* Botón de envío */}
              <Button type="submit" className="w-full" isLoading={loading}>
                <Send size={16} className="mr-2" />
                {t.contact.send}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}
