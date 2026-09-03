import { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "indigo" | "gold" | "sage" | "clay";
  hint?: string;
}

const accentStyles = {
  indigo: "bg-indigo/[0.08] text-indigo",
  gold: "bg-gold/[0.12] text-gold-dark",
  sage: "bg-sage/[0.10] text-sage",
  clay: "bg-clay/[0.10] text-clay",
};

export function StatCard({ label, value, icon: Icon, accent = "indigo", hint }: StatCardProps) {
  return (
    <Card className="p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
        <p className="mt-1.5 text-3xl font-display font-semibold text-ink">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink/45">{hint}</p>}
      </div>
      <div className={cn("rounded-full p-2.5", accentStyles[accent])}>
        <Icon size={20} strokeWidth={2} />
      </div>
    </Card>
  );
}
