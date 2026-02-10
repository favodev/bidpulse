"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import { Input, Button, Logo, Alert } from "@/components/ui";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword, error, clearError } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setEmailError("");

    if (!email) {
      setEmailError(t.auth.emailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t.auth.emailInvalid);
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(email);

    if (result.success) {
      setSent(true);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {sent ? (
          /* Success state */
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {t.auth.emailSent}
            </h2>
            <p className="text-slate-400 mb-6">
              {t.auth.recoveryLinkSent}
            </p>
            <Link href="/login">
              <Button variant="primary" fullWidth>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.auth.backToLogin}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {t.auth.forgotPasswordTitle}
              </h1>
              <p className="text-slate-400">
                {t.auth.forgotPasswordSubtitle}
              </p>
            </div>

            {/* Form */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
              {error && (
                <Alert
                  variant="error"
                  message={error.message}
                  onClose={clearError}
                  className="mb-6"
                />
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  type="email"
                  label={t.auth.email}
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  error={emailError}
                  autoComplete="email"
                  disabled={isSubmitting}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isSubmitting}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {t.auth.sendRecoveryLink}
                </Button>
              </form>
            </div>

            {/* Back to login */}
            <p className="text-center mt-6">
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.auth.backToLogin}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
