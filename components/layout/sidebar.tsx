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

export function Sidebar({ schoolName }: { schoolName: string }) {
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
    <aside className="w-60 shrink-0 bg-indigo-dark text-parchment flex flex-col min-h-screen">
      <div className="px-5 py-5 border-b border-parchment/10">
        <p className="font-mono text-[10px] tracking-widest uppercase text-parchment/50">
          Admin Panel
        </p>
        <p className="mt-1 font-display font-semibold text-sm leading-snug text-parchment/95">
          {schoolName}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
