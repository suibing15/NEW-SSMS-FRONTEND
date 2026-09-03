import Link from "next/link";
import { LucideIcon, ArrowLeft } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
      <div className="max-w-sm text-center animate-rise-in">
        <div className="mx-auto w-14 h-14 rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center">
          <Icon size={26} strokeWidth={2} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink/55 leading-relaxed">{description}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-indigo hover:text-gold-dark transition-colors"
        >
          <ArrowLeft size={15} /> Back to portals
        </Link>
      </div>
    </main>
  );
}
