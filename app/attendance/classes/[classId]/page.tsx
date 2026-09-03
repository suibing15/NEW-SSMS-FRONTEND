"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Send } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Status = "present" | "absent";

export default function MarkAttendancePage({ params }: { params: { classId: string } }) {
  const { classId } = params;
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [classPassword, setClassPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyMarkedBy, setAlreadyMarkedBy] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.attendanceClassStudents(classId), api.attendanceToday(classId)])
      .then(([studentsRes, todayRes]) => {
        setStudents(studentsRes.students);
        // Default everyone to present — a teacher unchecking the few
        // who are actually absent is faster than the reverse for the
        // common case. If today was already marked, use those exact
        // values instead so re-opening the page doesn't lose anything.
        const initial: Record<string, Status> = {};
        studentsRes.students.forEach((s) => {
          const existingStatus = todayRes.existing?.students?.[s.id];
          initial[s.id] = existingStatus === "absent" ? "absent" : "present";
        });
        setMarks(initial);
        if (todayRes.existing) {
          setAlreadyMarkedBy(todayRes.existing.teacherId);
        }
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load this class.")
      )
      .finally(() => setLoading(false));
  }, [classId]);

  function toggle(studentId: string) {
    setMarks((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  }

  async function handleSubmit() {
    if (!classPassword) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.markAttendance(classId, classPassword, marks);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to submit attendance. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const presentCount = Object.values(marks).filter((v) => v === "present").length;

  return (
    <main className="min-h-screen bg-parchment px-6 py-10">
      <div className="max-w-lg mx-auto animate-rise-in">
        <Link
          href="/attendance/classes"
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} /> Back to classes
        </Link>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink/40 text-center">
          {classId} · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink text-center">
          Mark Attendance
        </h1>

        {loading && <p className="mt-8 text-sm text-ink/45 text-center">Loading…</p>}

        {error && (
          <Card className="p-4 mt-6 border-clay/30 bg-clay/[0.04]">
            <p className="text-sm text-clay">{error}</p>
          </Card>
        )}

        {alreadyMarkedBy && !submitted && (
          <Card className="p-4 mt-6 border-gold/40 bg-gold/[0.05]">
            <p className="text-sm text-ink">
              Attendance was already submitted for today. Showing what was recorded, adjust and
              resubmit if needed.
            </p>
          </Card>
        )}

        {submitted ? (
          <Card className="p-8 mt-6 text-center border-sage/30 bg-sage/[0.05]">
            <CheckCircle2 size={32} className="mx-auto text-sage mb-3" />
            <p className="font-medium text-ink">Attendance submitted successfully</p>
            <p className="text-sm text-ink/55 mt-1">
              {presentCount} of {students.length} present today.
            </p>
          </Card>
        ) : (
          !loading &&
          students.length > 0 && (
            <>
              <Card className="mt-6 overflow-hidden">
                <div className="px-5 py-3 border-b border-ink/[0.06] flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">Students</span>
                  <span className="font-mono text-xs text-ink/40">
                    {presentCount} of {students.length} present
                  </span>
                </div>
                <div className="divide-y divide-ink/[0.05] max-h-[50vh] overflow-y-auto">
                  {students.map((s) => {
                    const status = marks[s.id] || "present";
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggle(s.id)}
                        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-ink/[0.02] transition-colors"
                      >
                        <span className="text-sm text-ink">{s.name}</span>
                        {status === "present" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage">
                            <CheckCircle2 size={15} /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-clay">
                            <XCircle size={15} /> Absent
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5 mt-4">
                <label className="block text-xs font-medium text-ink/60 mb-1.5">
                  Class password
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={classPassword}
                    onChange={(e) => setClassPassword(e.target.value)}
                    className="flex-1 rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
                  />
                  <Button onClick={handleSubmit} disabled={!classPassword || submitting}>
                    <Send size={14} /> {submitting ? "Submitting…" : "Submit"}
                  </Button>
                </div>
              </Card>
            </>
          )
        )}
      </div>
    </main>
  );
}
