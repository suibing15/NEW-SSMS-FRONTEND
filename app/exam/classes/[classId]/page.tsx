"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { api, ApiError, API_BASE, Student } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ExamStudentsPage({ params }: { params: { classId: string } }) {
  const { classId } = params;
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.examClassStudents(classId).then((r) => setStudents(r.students)).catch(() => {});
  }, [classId]);

  async function handleUnlock(studentId: string) {
    setError(null);
    setLoading(true);
    try {
      await api.verifyStudentPassword(studentId, password);
      router.push(`/exam/classes/${encodeURIComponent(classId)}/${encodeURIComponent(studentId)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-parchment px-6 py-12">
      <div className="max-w-lg mx-auto animate-rise-in">
        <Link
          href="/exam/classes"
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} /> Back to classes
        </Link>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink/40 text-center">
          Class · {classId}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink text-center">
          Find your name
        </h1>

        <div className="mt-8 space-y-2.5">
          {students.map((s) => (
            <Card key={s.id} className="p-0 overflow-hidden">
              <button
                onClick={() => {
                  setSelected(selected === s.id ? null : s.id);
                  setError(null);
                  setPassword("");
                }}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-ink/[0.02] transition-colors"
              >
                <span className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center overflow-hidden shrink-0">
                    {s.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`${API_BASE}${s.photo}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <GraduationCap size={16} />
                    )}
                  </div>
                  <span className="font-medium text-ink">{s.name}</span>
                </span>
                <span className="font-mono text-xs text-ink/40">{s.id}</span>
              </button>

              {selected === s.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUnlock(s.id);
                  }}
                  className="px-5 pb-4 flex items-center gap-2"
                >
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
                  />
                  <Button type="submit" size="sm" disabled={loading}>
                    {loading ? "…" : "Continue"}
                  </Button>
                </form>
              )}
            </Card>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-sm text-clay bg-clay/[0.06] border border-clay/20 rounded-[8px] px-3 py-2 text-center">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
