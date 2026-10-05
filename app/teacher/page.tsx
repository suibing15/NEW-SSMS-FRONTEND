"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api, ApiError, ScoreCaps, DEFAULT_SCORE_CAPS, ClassCompletion } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { SignatureUploadPanel } from "@/components/teacher/signature-upload-panel";

type ScoreField = "test1" | "test2" | "test3" | "exam";
type StudentScores = {
  id: string;
  name: string;
  test1: number | null;
  test2: number | null;
  test3: number | null;
  exam: number | null;
};

const FIELDS: { key: ScoreField; label: string }[] = [
  { key: "test1", label: "Test 1" },
  { key: "test2", label: "Test 2" },
  { key: "test3", label: "Test 3" },
  { key: "exam", label: "Exam" },
];

// A per-cell save/error state, separate from the score data itself,
// so one slow or failed save never blocks or confuses another cell.
type CellStatus = "idle" | "saving" | "saved" | "error";

export default function ScoreEntryPage({
  params,
}: {
  params: { classId: string; subjectId: string };
}) {
  const { classId, subjectId } = params;
  const [students, setStudents] = useState<StudentScores[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [cellStatus, setCellStatus] = useState<Record<string, CellStatus>>({});

  // The school's grading scale comes from the server (admin-configurable
  // per school), never hardcoded here — it's what each input's max and
  // column label use, so a teacher still gets immediate feedback instead
  // of only a rejection after submitting.
  const [caps, setCaps] = useState<ScoreCaps>(DEFAULT_SCORE_CAPS);
  // Class-wide (every subject) completion — decides when the signature
  // is asked for. null until loaded / if the check fails.
  const [completion, setCompletion] = useState<ClassCompletion | null>(null);

  function refreshCompletion() {
    api.classCompletion(classId).then(setCompletion).catch(() => setCompletion(null));
  }

  // Tracks what's actually been SAVED to the server, per cell,
  // separately from what's currently shown on screen. The two look
  // the same right after typing (since typing updates the screen
  // immediately for responsiveness), which is exactly why comparing
  // "on screen" to "on screen" to decide whether to save was the bug:
  // it always looked unchanged and the save never fired at all. This
  // ref is the real baseline to compare against instead.
  const lastSavedRef = useRef<Record<string, number | null>>({});

  useEffect(() => {
    api
      .classSubjectScores(classId, subjectId)
      .then((r) => {
        setStudents(r.students);
        if (r.scoreCaps) setCaps(r.scoreCaps);
        refreshCompletion();
        const saved: Record<string, number | null> = {};
        r.students.forEach((s) => {
          FIELDS.forEach(({ key }) => {
            saved[`${s.id}_${key}`] = s[key];
          });
        });
        lastSavedRef.current = saved;
      })
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 403
            ? "You haven't unlocked this class yet."
            : "Couldn't load scores."
        )
      )
      .finally(() => setLoading(false));
  }, [classId, subjectId]);

  // Per-field and overall missing counts — computed fresh from
  // whatever's currently in state, so it updates live as cells are
  // filled in, not just once on page load.
  // Assessments with a maximum of 0 aren't used by this school — they're
  // hidden and never counted as "missing".
  const activeFields = useMemo(() => FIELDS.filter(({ key }) => caps[key] > 0), [caps]);

  const missingCounts = useMemo(() => {
    const counts: Record<ScoreField, number> = { test1: 0, test2: 0, test3: 0, exam: 0 };
    students.forEach((s) => {
      activeFields.forEach(({ key }) => {
        if (s[key] === null) counts[key]++;
      });
    });
    return counts;
  }, [students, activeFields]);

  const totalMissing = Object.values(missingCounts).reduce((a, b) => a + b, 0);

  // Re-check the class-wide status only when it can actually change: this
  // subject just became complete, or the class was complete and an edit
  // may have reopened it. (Not on every single cell saved.)
  useEffect(() => {
    if (loading) return;
    if (totalMissing === 0 || completion?.allComplete) refreshCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMissing]);

  const otherIncomplete = (completion?.subjects || []).filter(
    (s) => s.missing > 0 && s.id !== subjectId
  ).length;

  const visibleStudents = showOnlyIncomplete
    ? students.filter((s) => activeFields.some(({ key }) => s[key] === null))
    : students;

  async function handleCellBlur(studentId: string, field: ScoreField, rawValue: string) {
    const cellKey = `${studentId}_${field}`;
    const value = rawValue.trim() === "" ? null : Number(rawValue);

    // Compare against what was actually last SAVED, not what's on
    // screen right now — those are the same the instant after typing,
    // which is exactly why this check used to always skip the save.
    if (lastSavedRef.current[cellKey] === value) return;

    setCellStatus((prev) => ({ ...prev, [cellKey]: "saving" }));
    try {
      const result = await api.saveScore(classId, subjectId, studentId, field, value);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, [field]: result.value } : s))
      );
      lastSavedRef.current[cellKey] = result.value;
      setCellStatus((prev) => ({ ...prev, [cellKey]: "saved" }));
      setTimeout(() => {
        setCellStatus((prev) => ({ ...prev, [cellKey]: "idle" }));
      }, 1500);
    } catch {
      setCellStatus((prev) => ({ ...prev, [cellKey]: "error" }));
    }
  }

  function handleCellChange(studentId: string, field: ScoreField, rawValue: string) {
    // Optimistic local update as the teacher types — the real save
    // only fires on blur, this just keeps the input responsive.
    const value = rawValue.trim() === "" ? null : Number(rawValue);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, [field]: value } : s)));
  }

  return (
    <main className="min-h-screen bg-parchment px-6 py-10">
      <div className="max-w-4xl mx-auto animate-rise-in">
        <Link
          href={`/teacher/classes/${encodeURIComponent(classId)}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} /> Back to subjects
        </Link>

        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">
              {classId} · {subjectId}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Score Entry</h1>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/60">
            <input
              type="checkbox"
              checked={showOnlyIncomplete}
              onChange={(e) => setShowOnlyIncomplete(e.target.checked)}
              className="w-4 h-4 accent-indigo"
            />
            Show only incomplete
          </label>
        </div>

        {error && (
          <Card className="p-4 mt-6 border-clay/30 bg-clay/[0.04]">
            <p className="text-sm text-clay">{error}</p>
          </Card>
        )}

        {loading && <p className="text-sm text-ink/45 text-center py-10">Loading…</p>}

        {!loading && !error && (
          <>
            {/* Summary strip — the whole point: see the gaps without opening anyone */}
            <Card
              className={`p-4 mt-6 flex items-center gap-4 flex-wrap ${
                totalMissing > 0 ? "border-gold/40 bg-gold/[0.05]" : "border-sage/30 bg-sage/[0.05]"
              }`}
            >
              {totalMissing > 0 ? (
                <AlertTriangle size={18} className="text-gold-dark shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="text-sage shrink-0" />
              )}
              <p className="text-sm text-ink">
                {totalMissing === 0 ? (
                  <span className="font-medium text-sage">
                    Every score is filled in for this subject.
                  </span>
                ) : (
                  <>
                    <span className="font-medium">{totalMissing}</span> score
                    {totalMissing === 1 ? "" : "s"} still missing across {students.length} student
                    {students.length === 1 ? "" : "s"}
                  </>
                )}
              </p>
              {totalMissing > 0 && (
                <div className="flex items-center gap-3 font-mono text-xs text-ink/50 ml-auto">
                  {activeFields.map(({ key, label }) =>
                    missingCounts[key] > 0 ? (
                      <span key={key}>
                        {label}: {missingCounts[key]}
                      </span>
                    ) : null
                  )}
                </div>
              )}
            </Card>

            {totalMissing === 0 && completion?.allComplete && (
              <SignatureUploadPanel
                classId={classId}
                hasSignature={completion.hasSignature}
                onUploaded={refreshCompletion}
              />
            )}

            {totalMissing === 0 && completion && !completion.allComplete && otherIncomplete > 0 && (
              <Card className="mt-4 p-4 flex items-start gap-3">
                <CheckCircle2 size={17} className="text-sage shrink-0 mt-0.5" />
                <p className="text-sm text-ink/70">
                  This subject is complete.{" "}
                  <span className="font-medium text-ink">
                    {otherIncomplete} other subject{otherIncomplete === 1 ? "" : "s"}
                  </span>{" "}
                  still need scores — you&apos;ll be asked for your class signature once every
                  subject is done.{" "}
                  <Link
                    href={`/teacher/classes/${encodeURIComponent(classId)}`}
                    className="text-indigo hover:text-gold-dark font-medium transition-colors"
                  >
                    Back to subjects
                  </Link>
                </p>
              </Card>
            )}

            <Card className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-ink/[0.08]">
                    <th className="text-left px-4 py-3 font-mono text-xs text-ink/50 sticky left-0 bg-white">
                      ID
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-ink/60 sticky left-0 bg-white">
                      Name
                    </th>
                    {activeFields.map(({ key, label }) => (
                      <th key={key} className="px-3 py-3 text-center text-xs text-ink/60">
                        {label}
                        <span className="block font-mono text-[10px] text-ink/35">/ {caps[key]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleStudents.map((s) => (
                    <tr key={s.id} className="border-b border-ink/[0.05] last:border-0">
                      <td className="px-4 py-2 font-mono text-xs text-ink/40">{s.id}</td>
                      <td className="px-4 py-2 font-medium text-ink whitespace-nowrap">{s.name}</td>
                      {activeFields.map(({ key }) => {
                        const cellKey = `${s.id}_${key}`;
                        const status = cellStatus[cellKey] || "idle";
                        const isMissing = s[key] === null;
                        return (
                          <td key={key} className="px-2 py-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                max={caps[key]}
                                value={s[key] === null ? "" : s[key]!}
                                placeholder={isMissing ? "—" : undefined}
                                onChange={(e) => handleCellChange(s.id, key, e.target.value)}
                                onBlur={(e) => handleCellBlur(s.id, key, e.target.value)}
                                className={`w-20 rounded-[6px] border px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 transition-colors ${
                                  status === "error"
                                    ? "border-clay focus:ring-clay/20"
                                    : isMissing
                                    ? "border-gold/50 bg-gold/[0.06] focus:border-indigo focus:ring-indigo/15"
                                    : "border-ink/15 focus:border-indigo focus:ring-indigo/15"
                                }`}
                              />
                              {status === "saving" && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo animate-pulse" />
                              )}
                              {status === "saved" && (
                                <CheckCircle2
                                  size={13}
                                  className="absolute -top-1.5 -right-1.5 text-sage bg-white rounded-full"
                                />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
