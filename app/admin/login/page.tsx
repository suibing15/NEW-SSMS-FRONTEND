"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.adminLogin(username, password);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
      <div className="w-full max-w-sm animate-rise-in">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} /> Back to portals
        </Link>

        <div className="mt-6 bg-white rounded-card border border-ink/[0.08] shadow-card p-8">
          <div className="w-11 h-11 rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center">
            <ShieldCheck size={22} strokeWidth={2} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Administrator</h1>
          <p className="mt-1 text-sm text-ink/55">Sign in to manage the school.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-ink/60 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
