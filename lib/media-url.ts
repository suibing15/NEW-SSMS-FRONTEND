// Resolves a stored photo/logo/signature/PDF path into something an
// <img> or <a href> can actually use.
//
// This exists specifically because of the move to Supabase Storage:
// anything uploaded *after* that migration is now a full, absolute
// URL (e.g. "https://xxxxx.supabase.co/storage/v1/object/public/...")
// and must be used exactly as-is. Anything uploaded *before* the
// migration is still an old relative path (e.g. "/uploads/xyz.jpg")
// and still needs the backend's own domain in front of it to resolve
// at all. Blindly doing either one on every value would break one of
// the two — this checks which kind it actually is first.
export function resolveMediaUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl; // already a full URL — Supabase Storage
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return `${API_BASE}${pathOrUrl}`; // old-style relative path — still needs the backend's domain
}
