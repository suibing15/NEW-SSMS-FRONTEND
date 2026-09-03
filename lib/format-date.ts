// Formats a timestamp for display, falling back to something
// sensible instead of literally showing the string "Invalid Date" —
// which is exactly what `new Date(x).toLocaleDateString()` returns
// when `x` is missing, malformed, or otherwise unparseable. Older
// records (from before some of this system's more recent additions)
// aren't guaranteed to have a clean timestamp, so this guards every
// place a date gets shown to a real person.
export function formatDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
): string {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, options);
}
