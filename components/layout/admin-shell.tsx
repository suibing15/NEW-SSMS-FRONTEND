"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";

// Owns the drawer open/close state so admin/layout.tsx (a Server
// Component, fetching schoolName server-side same as before) doesn't
// need to become a Client Component itself just to hold this one
// piece of interactive state — it stays exactly as it was, just
// rendering this instead of the sidebar directly.
export function AdminShell({
  schoolName,
  children,
}: {
  schoolName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex bg-parchment min-h-screen">
      {/* Mobile-only top bar — hidden entirely at md and up, where the
          sidebar is already always visible and this would be
          redundant. Fixed so it stays reachable while scrolling a
          long admin page, matching how a native app's own top bar
          behaves rather than scrolling away with the content. */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center gap-3 bg-indigo-dark text-parchment px-4 h-14 border-b border-parchment/10">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-1.5 -ml-1.5 rounded-[8px] hover:bg-parchment/[0.08] transition-colors"
        >
          <Menu size={22} strokeWidth={2} />
        </button>
        <p className="font-display font-semibold text-sm truncate">{schoolName}</p>
      </div>

      {/* Backdrop — mobile only, only rendered while the drawer is
          open. Tapping it closes the drawer, same as tapping outside
          a native app's own slide-out menu. */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar schoolName={schoolName} mobileOpen={open} onClose={() => setOpen(false)} />

      {/* pt-14 clears the fixed mobile top bar's own height — only
          needed below md, where that bar actually exists; md:pt-0
          removes it again once the sidebar is a normal static column
          instead and there's no top bar to clear. */}
      <div className="flex-1 min-w-0 pt-14 md:pt-0">{children}</div>
    </div>
  );
}
