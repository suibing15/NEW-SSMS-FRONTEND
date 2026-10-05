"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HomeLink } from "@/components/home-link";
import { ArrowLeft, BookOpen, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { api, ApiError, ClassCompletion } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { SignatureUploadPanel } from "@/components/teacher/signature-upload-panel";

export default function TeacherClassSubjectsPage({ params }: { params: { classId: string } }) {
  const { classId } = params;
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [completion, setCompletion] = useState<ClassCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadCompletion() {
    // Kept separate from the subject list on purpose: if this check
    // ever fails, the teacher can still pick a subject and enter
    // scores — it only affects the status badges and signature prompt.
    api
      .classCompletion(classId)
      .then(setCompletion)
      .catch(() => setCompletion(null));
  }

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
    loadCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const statusById = new Map((completion?.subjects || []).map((s) => [s.id, s]));
  const incompleteCount = (completion?.subjects || []).filter((s) => s.missing > 0).length;
  const totalSubjects = completion?.subjects.length ?? subjects.length;

  return (
    <main className="min-h-screen bg-parchment px-6 py-12">
      <div className="max-w-lg mx-auto animate-rise-in">
        <div className="flex items-center justify-between">
          <Link
            href="/teacher/classes"
            className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
          >
            <ArrowLeft size={15} /> Back to classes
          </Link>
          <HomeLink />
        </div>

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

        {completion && totalSubjects > 0 && (
          <p className="mt-4 text-xs text-ink/50 text-center font-mono">
            {totalSubjects - incompleteCount} of {totalSubjects} subjects complete
          </p>
        )}

        <div className="mt-6 space-y-2.5">
          {subjects.map((s) => {
            const st = statusById.get(s.id);
            return (
              <Link key={s.id} href={`/teacher/classes/${encodeURIComponent(classId)}/${encodeURIComponent(s.id)}`}>
                <Card className="px-5 py-3.5 flex items-center justify-between gap-3 hover:shadow-lift transition-shadow">
                  <span className="flex items-center gap-3 min-w-0">
                    <BookOpen size={16} className="text-indigo shrink-0" />
                    <span className="font-medium text-ink truncate">{s.name}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {st && (st.missing === 0 ? (
                      <span className="flex items-center gap-1 text-xs text-sage">
                        <CheckCircle2 size={14} /> Complete
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gold-dark">
                        <AlertTriangle size={13} /> {st.missing} missing
                      </span>
                    ))}
                    <ChevronRight size={16} className="text-ink/30" />
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>

        {completion?.allComplete ? (
          <SignatureUploadPanel
            classId={classId}
            hasSignature={completion.hasSignature}
            onUploaded={loadCompletion}
          />
        ) : (
          completion &&
          totalSubjects > 0 && (
            <p className="mt-6 text-xs text-ink/45 text-center">
              You&apos;ll be asked for your signature once every subject&apos;s scores are
              entered{incompleteCount > 0 ? ` (${incompleteCount} still to go)` : ""}.
            </p>
          )
        )}
      </div>
    </main>
  );
}
