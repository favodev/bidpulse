import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; icon: React.ReactNode }> = {
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/50",
    icon: <Info className="w-5 h-5 text-blue-400" />,
  },
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/50",
    icon: <CheckCircle className="w-5 h-5 text-green-400" />,
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/50",
    icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/50",
    icon: <XCircle className="w-5 h-5 text-red-400" />,
  },
};

export function Alert({
  variant = "info",
  title,
  message,
  onClose,
  className = "",
}: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`
        relative flex items-start gap-3 p-4
        ${styles.bg} ${styles.border}
        border rounded-lg
        ${className}
      `}
      role="alert"
    >
      <div className="flex-shrink-0">{styles.icon}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-semibold text-white mb-0.5">{title}</h4>
        )}
        <p className="text-sm text-slate-300">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-slate-400 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Alert;
