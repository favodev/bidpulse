"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ReportReason } from "@/types/report.types";
import { useLanguage } from "@/i18n";

interface ReportUserModalProps {
  isOpen: boolean;
  userName?: string;
  onClose: () => void;
  onSubmit: (data: { reason: ReportReason; details: string }) => void;
  isSubmitting?: boolean;
}

export function ReportUserModal({
  isOpen,
  userName,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ReportUserModalProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");

  const reasonOptions: { value: ReportReason; label: string }[] = [
    { value: "spam", label: t.messages?.reasons?.spam || "Spam" },
    { value: "fraud", label: t.messages?.reasons?.fraud || "Fraud" },
    { value: "harassment", label: t.messages?.reasons?.harassment || "Harassment" },
    {
      value: "fake_listing",
      label: t.messages?.reasons?.fakeListing || "Fake listing",
    },
    { value: "other", label: t.messages?.reasons?.other || "Other" },
  ];

  useEffect(() => {
    if (isOpen) {
      setReason("spam");
      setDetails("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {(t.messages?.reportTitle || "Report user")}
              {userName ? `: ${userName}` : ""}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label={t.common?.cancel || "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1.5">
              {t.messages?.reasonLabel || "Reason"}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1.5">
              {t.messages?.detailsLabel || "Details (optional)"}
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t.messages?.detailsPlaceholder || "Describe the issue..."}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {details.length}/1000
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose}>
            {t.common?.cancel || "Cancel"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onSubmit({ reason, details })}
            isLoading={isSubmitting}
          >
            {t.messages?.submitReport || "Send report"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReportUserModal;
