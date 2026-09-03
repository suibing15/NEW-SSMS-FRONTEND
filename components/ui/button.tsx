import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-indigo text-parchment hover:bg-indigo-light active:bg-indigo-dark shadow-card",
  secondary:
    "bg-transparent text-indigo border border-indigo/30 hover:border-indigo hover:bg-indigo/5",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  danger: "bg-clay text-parchment hover:bg-clay/90",
};

const sizeStyles: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-[6px]",
  md: "text-sm px-4 py-2.5 rounded-card",
  lg: "text-base px-6 py-3 rounded-card",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
