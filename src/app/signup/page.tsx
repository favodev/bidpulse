"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import { Input, Button, Logo, Alert } from "@/components/ui";
import { Check, X } from "lucide-react";

interface FormErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface FormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function validateForm(data: FormData, t: ReturnType<typeof useLanguage>['t']): FormErrors {
  const errors: FormErrors = {};

  if (!data.displayName) {
    errors.displayName = t.auth.nameRequired;
  } else if (data.displayName.length < 2) {
    errors.displayName = t.auth.nameMinLength;
  }

  if (!data.email) {
    errors.email = t.auth.emailRequired;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = t.auth.emailInvalid;
  }

  if (!data.password) {
    errors.password = t.auth.passwordRequired;
  } else if (data.password.length < 6) {
    errors.password = t.auth.passwordMinLength;
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = t.auth.confirmPasswordRequired;
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = t.auth.passwordsNotMatch;
  }

  return errors;
}

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function getPasswordRequirements(password: string, t: ReturnType<typeof useLanguage>['t']): PasswordRequirement[] {
  return [
    { label: t.auth.atLeast6Chars, met: password.length >= 6 },
    { label: t.auth.oneUppercase, met: /[A-Z]/.test(password) },
    { label: t.auth.oneLowercase, met: /[a-z]/.test(password) },
    { label: t.auth.oneNumber, met: /\d/.test(password) },
  ];
}

function PasswordStrengthIndicator({ password, t }: { password: string; t: ReturnType<typeof useLanguage>['t'] }) {
  const requirements = getPasswordRequirements(password, t);
  const metCount = requirements.filter((r) => r.met).length;

  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3">
      {/* Barra de fuerza */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index < metCount ? strengthColors[metCount - 1] : "bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Lista de requisitos */}
      <div className="grid grid-cols-2 gap-2">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={`flex items-center gap-1.5 text-xs ${
              req.met ? "text-green-400" : "text-slate-500"
            }`}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            {req.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginWithGoogle, error, clearError, loading } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<FormData>({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validar formulario
    const errors = validateForm(formData, t);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!acceptTerms) {
      return;
    }

    setIsSubmitting(true);

    const result = await signup({
      email: formData.email,
      password: formData.password,
      displayName: formData.displayName,
    });

    if (result.success) {
      router.push("/");
    }

    setIsSubmitting(false);
  };

  const handleGoogleSignup = async () => {
    clearError();
    setIsSubmitting(true);

    const result = await loginWithGoogle();

    if (result.success) {
      router.push("/");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo de la app */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Título y descripción */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t.auth.createAccount}</h1>
          <p className="text-slate-400">
            {t.auth.createAccountSubtitle}
          </p>
        </div>

        {/* Formulario de registro */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
          {/* Alerta de error */}
          {error && (
            <Alert
              variant="error"
              message={error.message}
              onClose={clearError}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo de nombre */}
            <Input
              type="text"
              label={t.auth.displayName}
              placeholder={t.auth.displayNamePlaceholder}
              value={formData.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
              error={formErrors.displayName}
              autoComplete="name"
              disabled={isSubmitting}
            />

            {/* Campo de correo */}
            <Input
              type="email"
              label={t.auth.email}
              placeholder={t.auth.emailPlaceholder}
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              error={formErrors.email}
              autoComplete="email"
              disabled={isSubmitting}
            />

            {/* Campo de contraseña */}
            <div>
              <Input
                type="password"
                label={t.auth.password}
                placeholder={t.auth.createPasswordSecure}
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                error={formErrors.password}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              <PasswordStrengthIndicator password={formData.password} t={t} />
            </div>

            {/* Confirmar contraseña */}
            <Input
              type="password"
              label={t.auth.confirmPassword}
              placeholder={t.auth.confirmPasswordPlaceholder}
              value={formData.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              error={formErrors.confirmPassword}
              autoComplete="new-password"
              disabled={isSubmitting}
            />

            {/* Aceptar términos */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
              />
              <label htmlFor="terms" className="text-sm text-slate-400">
                {t.auth.termsAgree}{" "}
                <Link
                  href="/terms"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {t.auth.termsOfService}
                </Link>{" "}
                {t.auth.and}{" "}
                <Link
                  href="/privacy"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {t.auth.privacyPolicy}
                </Link>
              </label>
            </div>

            {/* Botón crear cuenta */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting || loading}
              disabled={!acceptTerms}
            >
              {t.auth.signupButton}
            </Button>
          </form>

          {/* Separador */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900/50 text-slate-500">
                {t.auth.orContinueWith}
              </span>
            </div>
          </div>

          {/* Botón registrarse con Google */}
          <Button
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            leftIcon={<GoogleIcon />}
            onClick={handleGoogleSignup}
            disabled={isSubmitting}
          >
            {t.auth.loginWithGoogle}
          </Button>
        </div>

        {/* Enlace a login */}
        <p className="text-center mt-6 text-slate-400">
          {t.auth.hasAccount}{" "}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {t.auth.login}
          </Link>
        </p>

        {/* Enlaces legales */}
        <div className="flex justify-center gap-6 mt-6 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">
            {t.auth.privacyPolicy}
          </Link>
          <Link href="/terms" className="hover:text-slate-400 transition-colors">
            {t.auth.termsOfService}
          </Link>
        </div>
      </div>
    </div>
  );
}
