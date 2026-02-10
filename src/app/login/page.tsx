"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import { Input, Button, Logo, Alert } from "@/components/ui";

interface FormErrors {
  email?: string;
  password?: string;
}

function validateForm(email: string, password: string, t: ReturnType<typeof useLanguage>['t']): FormErrors {
  const errors: FormErrors = {};

  if (!email) {
    errors.email = t.auth.emailRequired;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = t.auth.emailInvalid;
  }

  if (!password) {
    errors.password = t.auth.passwordRequired;
  } else if (password.length < 6) {
    errors.password = t.auth.passwordMinLength;
  }

  return errors;
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

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, error, clearError, loading } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validar formulario
    const errors = validateForm(email, password, t);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const result = await login({ email, password });

    if (result.success) {
      router.push("/");
    }

    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    clearError();
    setIsSubmitting(true);

    const result = await loginWithGoogle();

    if (result.success) {
      router.push("/");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo de la app */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Título y descripción */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t.auth.welcomeBack}</h1>
          <p className="text-slate-400">
            {t.auth.welcomeBackSubtitle}
          </p>
        </div>

        {/* Formulario de login */}
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
            {/* Campo de correo */}
            <Input
              type="email"
              label={t.auth.email}
              placeholder={t.auth.emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formErrors.email) {
                  setFormErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              error={formErrors.email}
              autoComplete="email"
              disabled={isSubmitting}
            />

            {/* Campo de contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-200">
                  {t.auth.password}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {t.auth.forgotPassword}
                </Link>
              </div>
              <Input
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) {
                    setFormErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                error={formErrors.password}
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>

            {/* Botón iniciar sesión */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting || loading}
            >
              {t.auth.loginButton}
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

          {/* Botón iniciar con Google */}
          <Button
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            leftIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            {t.auth.loginWithGoogle}
          </Button>
        </div>

        {/* Enlace a registro */}
        <p className="text-center mt-6 text-slate-400">
          {t.auth.noAccount}{" "}
          <Link
            href="/signup"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {t.auth.register}
          </Link>
        </p>

      </div>
    </div>
  );
}
