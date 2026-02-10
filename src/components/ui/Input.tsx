"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", rightElement, type, id: providedId, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const autoId = providedId || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const errorId = autoId ? `${autoId}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={autoId} className="block text-sm font-medium text-gray-200 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={autoId}
            type={inputType}
            aria-invalid={!!error}
            aria-describedby={error && errorId ? errorId : undefined}
            className={`
              w-full px-4 py-3 
              bg-slate-800 
              border border-slate-700 
              rounded-lg 
              text-white 
              placeholder:text-slate-500
              focus:outline-none focus:border-emerald-500
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? "border-red-500" : ""}
              ${isPassword || rightElement ? "pr-12" : ""}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
          {rightElement && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-400" role="alert">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
