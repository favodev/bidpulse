"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Navbar, Footer } from "@/components/layout";
import { Button, Alert } from "@/components/ui";
import { Bell, Save, Loader2 } from "lucide-react";
import { getUserProfile, updateUserSettings } from "@/services/user.service";
import { UserSettings } from "@/types/user.types";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de las preferencias 
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    pushNotifications: false,
    outbidAlerts: true,
    endingSoonAlerts: true,
    currency: "CLP",
    language: "es",
  });

  // Cargar configuración actual del usuario
  useEffect(() => {
    async function loadSettings() {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        const profile = await getUserProfile(user.uid);
        if (profile?.settings) {
          setSettings(profile.settings);
        }
      } catch (err) {
        console.error("Error cargando configuración:", err);
        setError(t.common.error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user, router, t]);

  // Alternar una preferencia específica
  const handleToggle = (key: keyof UserSettings) => {
    if (typeof settings[key] === "boolean") {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  // Guardar cambios en Firebase
  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      
      await updateUserSettings(user.uid, settings);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error guardando configuración:", err);
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
        <Footer />
      </>
    );
  }

  // Redirigir si no hay usuario
  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {t.settings.title}
          </h1>
          <p className="text-slate-400">{t.settings.subtitle}</p>
        </div>

        {/* Alertas */}
        {success && (
          <div className="mb-6">
            <Alert
              variant="success"
              title={t.settings.saved}
              message={t.settings.savedDesc}
              onClose={() => setSuccess(false)}
            />
          </div>
        )}

        {error && (
          <div className="mb-6">
            <Alert
              variant="error"
              title="Error"
              message={error}
              onClose={() => setError(null)}
            />
          </div>
        )}

        {/* Sección de Notificaciones */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="text-blue-500" size={20} />
              {t.settings.notifications.title}
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <ToggleItem
              label={t.settings.notifications.emailOutbid}
              checked={settings.outbidAlerts}
              onChange={() => handleToggle("outbidAlerts")}
            />
            <ToggleItem
              label={t.settings.notifications.emailWon}
              checked={settings.emailNotifications}
              onChange={() => handleToggle("emailNotifications")}
            />
            <ToggleItem
              label={t.settings.notifications.emailSold}
              checked={settings.endingSoonAlerts}
              onChange={() => handleToggle("endingSoonAlerts")}
            />
            <ToggleItem
              label={t.settings.notifications.pushOutbid}
              checked={settings.pushNotifications}
              onChange={() => handleToggle("pushNotifications")}
            />
          </div>
          <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex justify-end">
            <Button onClick={handleSave} isLoading={saving}>
              <Save size={16} className="mr-2" />
              {t.settings.save}
            </Button>
          </div>
        </div>

        {/* Zona de Peligro (minimal) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-red-400">
                {t.settings.danger.deleteAccount}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {t.settings.danger.deleteDesc}
              </p>
            </div>

            <div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-700 text-red-500 hover:bg-red-950/30 hover:border-red-500"
              >
                {t.settings.danger.deleteBtn}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}

function ToggleItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-200">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer ${
          checked ? "bg-emerald-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
