import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assalam International Academic School — Portal",
  description: "School management portal for administrators, teachers, students, and parents.",
};

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
