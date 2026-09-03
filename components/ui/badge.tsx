import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "gold";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-ink/[0.06] text-ink/70",
  success: "bg-sage/10 text-sage",
  warning: "bg-gold/15 text-gold-dark",
  danger: "bg-clay/10 text-clay",
  gold: "bg-gold/15 text-gold-dark border border-gold/30",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium font-mono tracking-wide",
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
