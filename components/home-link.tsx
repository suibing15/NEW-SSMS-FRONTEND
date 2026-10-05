import Link from "next/link";
import { Home } from "lucide-react";

// One consistent way back to the landing page from anywhere in the
// portals, styled to match the existing "Back" links it sits beside.
export function HomeLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors ${className}`}
    >
      <Home size={15} /> Home
    </Link>
  );
}
