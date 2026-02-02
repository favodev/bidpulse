"use client";

import { X, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/i18n";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: "danger" | "primary";
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmVariant = "danger",
}: ConfirmModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const confirmStyles =
    confirmVariant === "danger"
      ? "bg-red-600 hover:bg-red-500"
      : "bg-emerald-600 hover:bg-emerald-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {title || t.common?.confirm || "Confirmar"}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label={t.common?.cancel || "Cancelar"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-6">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            {cancelLabel || t.common?.cancel || "Cancelar"}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white transition-colors ${confirmStyles}`}
          >
            {confirmLabel || t.common?.delete || "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
