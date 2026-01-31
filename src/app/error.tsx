"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useLanguage } from "@/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();
  
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Ícono */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        {/* Mensaje */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          {t.errors.somethingWentWrong}
        </h1>
        <p className="text-slate-400 mb-8">
          {t.errors.unexpectedError}
        </p>

        {/* Detalles del error (solo en desarrollo) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800 text-left">
            <p className="text-red-400 text-sm font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-5 h-5" />
            {t.errors.tryAgain}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
          >
            <Home className="w-5 h-5" />
            {t.errors.goHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
