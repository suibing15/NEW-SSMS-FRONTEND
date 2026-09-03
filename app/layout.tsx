import type { Metadata } from "next";
import "./globals.css";
import { api } from "@/lib/api";

// Previously a fixed, hardcoded title naming one specific school —
// this frontend serves any school's backend, so the browser tab title
// needs to reflect whichever school's data it's actually showing.
// generateMetadata is Next.js's async version of the static
// `metadata` export, letting this fetch real data the same way any
// Server Component page already does.
export async function generateMetadata(): Promise<Metadata> {
  let schoolName = "School Portal";
  try {
    const { meta } = await api.meta();
    if (meta.schoolName) schoolName = meta.schoolName;
  } catch {
    // Falls back to the generic title above if the backend isn't
    // reachable yet — never names a specific school here, since a
    // fallback showing the wrong school's name would be worse than a
    // neutral one.
  }
  return {
    title: `${schoolName} — Portal`,
    description: "School management portal for administrators, teachers, students, and parents.",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
