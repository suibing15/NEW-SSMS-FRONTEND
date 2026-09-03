"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight } from "lucide-react";
import { api, ApiError, SchoolClass } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TeacherClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.publicClasses().then((r) => setClasses(r.classes)).catch(() => {});
  }, []);

  async function handleUnlock(classId: string) {
    setError(null);
    setLoading(true);
    try {
      await api.teacherClassLogin(classId, password);
      router.push(`/teacher/classes/${encodeURIComponent(classId)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-parchment px-6 py-12">
      <div className="max-w-lg mx-auto animate-rise-in">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 text-center">
          Teacher Portal
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink text-center">
          Select your class
        </h1>

        <div className="mt-8 space-y-2.5">
          {classes.map((c) => (
            <Card key={c.id} className="p-0 overflow-hidden">
              <button
                onClick={() => {
                  setSelected(selected === c.id ? null : c.id);
                  setError(null);
                  setPassword("");
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-ink/[0.02] transition-colors"
              >
                <span className="flex items-center gap-3">
                  <BookOpen size={16} className="text-indigo" />
                  <span className="font-medium text-ink">{c.name}</span>
                </span>
                <ArrowRight
                  size={16}
                  className={`text-ink/30 transition-transform ${selected === c.id ? "rotate-90" : ""}`}
                />
              </button>

              {selected === c.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUnlock(c.id);
                  }}
                  className="px-5 pb-4 flex items-center gap-2"
                >
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Class password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
                  />
                  <Button type="submit" size="sm" disabled={loading}>
                    {loading ? "…" : "Unlock"}
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
