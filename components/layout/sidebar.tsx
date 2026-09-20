"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const navItems = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/teachers", label: "Teachers", icon: Users },
  { href: "/admin/classes", label: "Classes & Subjects", icon: BookOpen },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/admin/reports", label: "Report Sheets", icon: FileText },
  { href: "/admin/settings", label: "School Settings", icon: Settings },
];

// mobileOpen/onClose are only meaningful below the md breakpoint — on
// desktop the sidebar is always visible exactly as it always was,
// these props simply have no effect there. Below md, the sidebar was
// previously still rendered at a fixed w-60 (240px), permanently
// eating into a phone-width screen and forcing the whole layout wider
// than the viewport — which is what made every admin page need
// pinch-zooming to use at all, unlike every other portal, which never
// carries a permanent side rail like this in the first place.
export function Sidebar({
  schoolName,
  mobileOpen = false,
  onClose,
}: {
  schoolName: string;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  async function handleSignOut() {
    try {
      await api.adminLogout();
    } catch {
      // even if the request fails, still send them away from the
      // admin area — an expired session shouldn't trap someone here
    }
    // A full reload rather than client-side navigation — Next.js can
    // otherwise keep a cached copy of admin pages in memory, which
    // could briefly show stale content if the browser's back button
    // is used right after signing out. This guarantees a clean break.
    window.location.href = "/manage-unlock";
  }

  return (
    <aside
      className={cn(
        "w-60 shrink-0 bg-indigo-dark text-parchment flex flex-col min-h-screen",
        // Below md: an off-canvas drawer, fixed to the viewport and
        // slid fully out of view by default — translate-x-0 when
        // mobileOpen brings it on screen, sliding back out on close.
        // At md and up: back to being a normal, always-visible, static
        // (non-fixed) column exactly as this always was on desktop.
        "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:static md:translate-x-0"
      )}
    >
      <div className="px-5 py-5 border-b border-parchment/10">
        <p className="font-mono text-[10px] tracking-widest uppercase text-parchment/50">
          Admin Panel
        </p>
        <p className="mt-1 font-display font-semibold text-sm leading-snug text-parchment/95">
          {schoolName}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-gold text-indigo-dark"
                  : "text-parchment/75 hover:bg-parchment/[0.08] hover:text-parchment"
              )}
            >
              <item.icon size={17} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-parchment/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-sm font-medium text-parchment/60 hover:bg-parchment/[0.08] hover:text-parchment transition-colors w-full"
        >
          <LogOut size={17} strokeWidth={2} />
          Sign out
        </button>
        <p className="mt-3 px-3 font-mono text-[10px] text-parchment/30">
          © {new Date().getFullYear()} SUIBING IT SERVICES
        </p>
      </div>
    </aside>
  );
}
