// lib/server-meta.ts
//
// Server-side fetches of the school's public details (name, logo,
// address, phone...) for the landing page and the browser-tab title.
//
// Why this exists: these used to go through the ordinary api.meta()
// call, which Next.js caches by default — and the landing page was
// even prerendered as a static page at BUILD time. So whatever the
// backend answered during the build (including nothing at all, if a
// sleeping Render server hadn't woken up yet) was frozen into the page
// until the next deploy. That's why a school's logo, address and phone
// would "sometimes load and sometimes not". Here:
//   - the landing page's fetch is never cached (cache: "no-store"),
//   - every attempt has a hard time limit so a slow or asleep backend
//     can't hang the page,
//   - and the page is told whether the fetch actually worked, so it can
//     keep retrying in the background instead of settling for a blank.

import { cache } from "react";
import type { SchoolMeta } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

async function attempt(init: RequestInit & { next?: { revalidate: number } }, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/api/meta`, { ...init, signal: controller.signal });
    // A 404/HTML reply (e.g. the address points at the website itself
    // rather than the backend) must count as a failure, not as "no data".
    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (!res.ok || !isJson) return null;
    const body = await res.json();
    return (body?.meta as SchoolMeta) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// For the landing page: always fresh. React's cache() makes the page and
// the metadata function share one result per request instead of each
// calling the backend separately.
export const fetchSchoolMeta = cache(async (): Promise<{ meta: SchoolMeta; ok: boolean }> => {
  for (let i = 0; i < 2; i++) {
    const meta = await attempt({ cache: "no-store" }, 6000);
    if (meta) return { meta, ok: true };
  }
  return { meta: {}, ok: false };
});

// For the browser-tab title only (used by the root layout, which wraps
// every page). Deliberately NOT no-store: that would make every portal
// page wait on the backend just to render a title. Revalidating every
// 5 minutes keeps those pages fast and still lets a missed fetch (a cold
// backend) heal itself shortly afterwards instead of sticking forever.
export const fetchSchoolName = cache(async (): Promise<string | null> => {
  const meta = await attempt({ next: { revalidate: 300 } }, 4000);
  return meta?.schoolName || null;
});
