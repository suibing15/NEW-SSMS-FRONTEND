import { LucideIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PortalCardProps {
  href: string;
  role: string;
  code: string; // e.g. "PORTAL · ADMIN" — printed like a ticket stub code
  description: string;
  icon: LucideIcon;
  delayMs?: number;
}

export function PortalCard({ href, role, code, description, icon: Icon, delayMs = 0 }: PortalCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col bg-white rounded-card border border-ink/[0.08]",
        "shadow-card hover:shadow-lift hover:-translate-y-1 transition-all duration-300",
        "ticket-notch overflow-hidden animate-rise-in"
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gold scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
      <div className="p-6 pb-20">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-indigo/[0.08] text-indigo group-hover:bg-gold/[0.15] group-hover:text-gold-dark transition-colors duration-300">
          <Icon size={22} strokeWidth={2} />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold text-ink">{role}</h3>
        <p className="mt-1.5 text-sm text-ink/60 leading-relaxed">{description}</p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-between px-6">
        <span className="font-mono text-[11px] tracking-widest text-ink/40 uppercase">
          {code}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo group-hover:text-gold-dark transition-colors">
          Enter
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
