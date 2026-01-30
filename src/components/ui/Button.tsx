import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-blue-600 hover:bg-blue-700 
    text-white 
    shadow-lg shadow-blue-600/25
    active:scale-[0.98]
  `,
  secondary: `
    bg-slate-700 hover:bg-slate-600 
    text-white
    active:scale-[0.98]
  `,
  outline: `
    bg-transparent 
    border-2 border-slate-600 hover:border-slate-500
    text-white
    hover:bg-slate-800/50
    active:scale-[0.98]
  `,
  ghost: `
    bg-transparent 
    text-slate-300 hover:text-white
    hover:bg-slate-800/50
    active:scale-[0.98]
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2
          font-semibold
          rounded-lg
          transition-all duration-200
          cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
