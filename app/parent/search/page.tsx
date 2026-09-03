"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ParentStudentSearchPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await api.verifyStudentId(studentId.trim());
      if (r.valid) {
        router.push(`/parent/dashboard/${encodeURIComponent(r.student.id)}`);
      } else {
        setError("Student ID not found.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Student ID not found.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
      <div className="w-full max-w-sm animate-rise-in">
        <Link
          href="/parent"
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </Link>

        <Card className="mt-6 p-8">
          <div className="w-11 h-11 rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center">
            <Search size={20} />
          </div>
          <h1 className="mt-4 font-display text-xl font-semibold text-ink">Find your child</h1>
          <p className="mt-1 text-sm text-ink/55">Enter their student ID to view their dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="studentId" className="block text-xs font-medium text-ink/60 mb-1.5">
                Student ID
              </label>
              <input
                id="studentId"
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-[8px] border border-ink/15 px-3.5 py-2.5 text-sm text-ink font-mono focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>

            {error && (
              <p className="text-sm text-clay bg-clay/[0.06] border border-clay/20 rounded-[8px] px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? "Searching…" : "View Dashboard"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
