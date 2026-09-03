"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PortalGuide } from "@/components/portal-guide";
import { Footer } from "@/components/footer";

export default function AttendanceLoginPage() {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.attendanceTeacherLogin(teacherId, password);
      router.push("/attendance/classes");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-parchment px-6 py-10">
      <div className="w-full max-w-sm animate-rise-in">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} /> Back to portals
        </Link>

        <div className="mt-6 bg-white rounded-card border border-ink/[0.08] shadow-card overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-gold via-gold-light to-gold" />
          <div className="p-8">
            <div className="w-11 h-11 rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center">
              <CalendarCheck size={22} strokeWidth={2} />
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Attendance Portal</h1>
            <p className="mt-1 text-sm text-ink/55">Sign in with your own teacher ID and password.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="teacherId" className="block text-xs font-medium text-ink/60 mb-1.5">
                  Teacher ID
                </label>
                <input
                  id="teacherId"
                  type="text"
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full rounded-[8px] border border-ink/15 px-3.5 py-2.5 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
                  autoComplete="username"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-ink/60 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[8px] border border-ink/15 px-3.5 py-2.5 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-clay bg-clay/[0.06] border border-clay/20 rounded-[8px] px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Continue"}
              </Button>
            </form>
          </div>
        </div>

        <PortalGuide
          title="the Attendance Portal"
          steps={[
            "Sign in with your own teacher ID and password — separate from the shared portal password used elsewhere.",
            "Pick the class you're marking today.",
            "Every student defaults to Present — tap a name to flip it to Absent for anyone who isn't in.",
            "If attendance was already submitted earlier today, it shows exactly what was recorded so you can correct one entry without starting over.",
            "Enter the class password and submit — only the teacher who first submitted for the day can update it again that same day.",
          ]}
        />
      </div>
      <Footer />
    </main>
  );
}
