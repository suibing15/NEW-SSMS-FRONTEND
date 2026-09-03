"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";

export default function TeacherClassSubjectsPage({ params }: { params: { classId: string } }) {
  const { classId } = params;
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .teacherClassSubjects(classId)
      .then((r) => setSubjects(r.subjects))
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 403
            ? "You haven't unlocked this class yet."
            : "Couldn't load subjects."
        )
      )
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <main className="min-h-screen bg-parchment px-6 py-12">
      <div className="max-w-lg mx-auto animate-rise-in">
        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} /> Back to classes
        </Link>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink/40 text-center">
          Class · {classId}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink text-center">
          Select a subject
        </h1>

        {loading && <p className="mt-8 text-sm text-ink/45 text-center">Loading…</p>}

        {error && (
          <p className="mt-6 text-sm text-clay bg-clay/[0.06] border border-clay/20 rounded-[8px] px-3 py-2 text-center">
            {error}
          </p>
        )}

        {!loading && !error && subjects.length === 0 && (
          <p className="mt-8 text-sm text-ink/45 text-center">
            No subjects have been set up for this class yet.
          </p>
        )}

        <div className="mt-8 space-y-2.5">
          {subjects.map((s) => (
            <Link key={s.id} href={`/teacher/classes/${encodeURIComponent(classId)}/${encodeURIComponent(s.id)}`}>
              <Card className="px-5 py-3.5 flex items-center justify-between hover:shadow-lift transition-shadow">
                <span className="flex items-center gap-3">
                  <BookOpen size={16} className="text-indigo" />
                  <span className="font-medium text-ink">{s.name}</span>
                </span>
                <ChevronRight size={16} className="text-ink/30" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
