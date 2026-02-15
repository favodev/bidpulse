"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Navbar, Footer } from "@/components/layout";
import { Button, Alert } from "@/components/ui";
import { Bell, Save, Loader2, CreditCard, ExternalLink, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { getUserProfile, updateUserSettings } from "@/services/user.service";
import { UserSettings } from "@/types/user.types";
import { getConnectAccount, createConnectOnboarding, getConnectDashboardLink } from "@/services/payment.service";
import type { SellerConnectAccount } from "@/types/payment.types";

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

  // Stripe Connect state
  const [connectAccount, setConnectAccount] = useState<SellerConnectAccount | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

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

  // Cargar cuenta Connect
  useEffect(() => {
    async function loadConnect() {
      if (!user) return;
      try {
        const account = await getConnectAccount(user.uid);
        setConnectAccount(account);
      } catch (err) {
        console.error("Error loading connect account:", err);
      }
    }
    loadConnect();
  }, [user]);

  // Iniciar onboarding de Stripe Connect
  const handleConnectOnboarding = async () => {
    setConnectLoading(true);
    setConnectError(null);
    try {
      const result = await createConnectOnboarding();
      if ("error" in result) {
        setConnectError(result.error);
      } else {
        window.location.href = result.onboardingUrl;
      }
    } catch (err) {
      console.error("Error creating connect onboarding:", err);
      setConnectError("Error al iniciar la configuración de pagos");
    } finally {
      setConnectLoading(false);
    }
  };

  // Abrir dashboard de Stripe
  const handleOpenDashboard = async () => {
    setConnectLoading(true);
    try {
      const result = await getConnectDashboardLink();
      if ("error" in result) {
        setConnectError(result.error);
      } else {
        window.open(result.url, "_blank");
      }
    } catch (err) {
      console.error("Error opening dashboard:", err);
    } finally {
      setConnectLoading(false);
    }
  };

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

        {/* Sección de Pagos - Stripe Connect */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CreditCard className="text-blue-500" size={20} />
              {t.payments?.settingsTitle || "Configuración de Pagos"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {t.payments?.settingsDesc || "Configura tu cuenta para recibir pagos por tus ventas"}
            </p>
          </div>
          <div className="p-6">
            {connectError && (
              <div className="mb-4">
                <Alert variant="error" message={connectError} onClose={() => setConnectError(null)} />
              </div>
            )}

            {!connectAccount ? (
              // No tiene cuenta Connect
              <div className="text-center py-4">
                <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">
                  {t.payments?.connectSetup || "Configura tu cuenta de vendedor"}
                </h3>
                <p className="text-slate-400 text-sm mb-4 max-w-md mx-auto">
                  {t.payments?.connectSetupDesc || "Conecta tu cuenta bancaria a través de Stripe para recibir pagos cuando vendas artículos en BidPulse."}
                </p>
                <Button
                  onClick={handleConnectOnboarding}
                  isLoading={connectLoading}
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                >
                  {t.payments?.connectStart || "Configurar con Stripe"}
                </Button>
              </div>
            ) : connectAccount.status === "active" ? (
              // Cuenta activa
              <div>
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-green-300 font-medium">
                      {t.payments?.connectActive || "Cuenta de pagos activa"}
                    </p>
                    <p className="text-green-300/70 text-sm">
                      {t.payments?.connectActiveDesc || "Tu cuenta está configurada para recibir pagos."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenDashboard}
                  isLoading={connectLoading}
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                >
                  {t.payments?.connectDashboard || "Abrir panel de Stripe"}
                </Button>
              </div>
            ) : connectAccount.status === "pending" ? (
              // Onboarding incompleto
              <div>
                <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
                  <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-yellow-300 font-medium">
                      {t.payments?.connectPending || "Configuración pendiente"}
                    </p>
                    <p className="text-yellow-300/70 text-sm">
                      {t.payments?.connectPendingDesc || "Completa la configuración de tu cuenta para empezar a recibir pagos."}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleConnectOnboarding}
                  isLoading={connectLoading}
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                >
                  {t.payments?.connectContinue || "Completar configuración"}
                </Button>
              </div>
            ) : (
              // Restringida
              <div>
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <p className="text-red-300 font-medium">
                      {t.payments?.connectRestricted || "Cuenta restringida"}
                    </p>
                    <p className="text-red-300/70 text-sm">
                      {t.payments?.connectRestrictedDesc || "Tu cuenta tiene restricciones. Accede al panel de Stripe para resolver los problemas pendientes."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleConnectOnboarding}
                    isLoading={connectLoading}
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                  >
                    {t.payments?.connectUpdate || "Actualizar información"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenDashboard}
                    isLoading={connectLoading}
                  >
                    {t.payments?.connectDashboard || "Panel de Stripe"}
                  </Button>
                </div>
              </div>
            )}
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
                onClick={() => router.push("/profile")}
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
