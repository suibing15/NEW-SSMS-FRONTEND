"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, FileText, Trash2, Users2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { api, ApiError, SchoolClass } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-url";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type StudentLite = { id: string; name: string };
type DayRecord = { teacherId?: string; teacherName?: string; students: Record<string, string> };
type AttendanceMap = Record<string, DayRecord>;

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function toDateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

// Monday of the week containing `d` — attendance weeks always run
// Monday to Friday, matching a normal school week.
function mondayOf(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function weekdaysOf(monday: Date) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isPresent(status: string | undefined) {
  return status === "present" || status === "Present" || status === "P";
}

export default function AttendancePage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [generating, setGenerating] = useState(false);
  const [absenceThreshold, setAbsenceThreshold] = useState(2);

  const [teacherAttendance, setTeacherAttendance] = useState<Record<string, Record<string, string>>>({});
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [generatingTeacherPdf, setGeneratingTeacherPdf] = useState(false);

  const weekDays = useMemo(() => weekdaysOf(weekStart), [weekStart]);
  const weekDayKeys = useMemo(() => weekDays.map(toDateKey), [weekDays]);
  const todayKey = toDateKey(new Date());

  useEffect(() => {
    api.adminClasses().then(({ classes }) => setClasses(classes)).catch(() => {});
    api.adminTeachers().then(({ teachers }) => setTeachers(teachers)).catch(() => {});
  }, []);

  async function loadClassAttendance(id: string) {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [{ students: s }, { attendance: a }] = await Promise.all([
        api.adminClassStudents(id),
        api.classAttendance(id),
      ]);
      setStudents(s);
      setAttendance(a);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Your admin session isn't active. Please log in again."
          : "Couldn't load attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (classId) loadClassAttendance(classId);
    else {
      setStudents([]);
      setAttendance({});
    }
  }, [classId]);

  useEffect(() => {
    setLoadingTeachers(true);
    api
      .teacherAttendance()
      .then((r) => setTeacherAttendance(r.attendance))
      .catch(() => {})
      .finally(() => setLoadingTeachers(false));
  }, [weekStart]);

  // For every student, how many of THIS week's weekdays were they
  // marked absent on — the basis for the "who needs following up on"
  // filter below.
  const absenceCounts = useMemo(() => {
    return students
      .map((s) => {
        let absent = 0;
        weekDayKeys.forEach((d) => {
          const status = attendance[d]?.students?.[s.id];
          if (status !== undefined && !isPresent(status)) absent++;
        });
        return { ...s, absent };
      })
      .sort((a, b) => b.absent - a.absent);
  }, [students, attendance, weekDayKeys]);

  const flagged = absenceCounts.filter((s) => s.absent >= absenceThreshold);

  function shiftWeek(delta: number) {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta * 7);
      return next;
    });
  }

  async function handleGeneratePdf() {
    if (!classId) return;
    setGenerating(true);
    try {
      const { file } = await api.generateAttendancePdf(classId, weekDayKeys[0], weekDayKeys[4]);
      window.open(resolveMediaUrl(file), "_blank");
      showToast("Attendance PDF generated successfully.");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to generate attendance PDF.", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateTeacherPdf() {
    setGeneratingTeacherPdf(true);
    try {
      const { file } = await api.generateTeacherAttendancePdf(weekDayKeys[0], weekDayKeys[4]);
      window.open(resolveMediaUrl(file), "_blank");
      showToast("Teacher attendance PDF generated successfully.");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to generate teacher attendance PDF.", "error");
    } finally {
      setGeneratingTeacherPdf(false);
    }
  }

  async function handleDeleteAttendance() {
    if (!classId) return;
    const className = classes.find((c) => c.id === classId)?.name || classId;
    if (!confirm(`Permanently delete ALL attendance history for ${className}? This cannot be undone.`))
      return;
    try {
      await api.deleteClassAttendance(classId);
      showToast(`Attendance for ${className} deleted successfully.`);
      loadClassAttendance(classId);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete attendance.", "error");
    }
  }

  const weekLabel = `${weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekDays[4].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">Manage</p>
        <h1 className="font-display text-2xl font-semibold text-ink mt-1">Attendance</h1>
      </div>

      {/* Week navigator — shared by both the class and teacher tables below */}
      <Card className="p-4 mb-6 flex items-center justify-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => shiftWeek(-1)}>
          <ChevronLeft size={16} />
        </Button>
        <span className="font-mono text-sm text-ink font-medium">{weekLabel}</span>
        <Button variant="ghost" size="sm" onClick={() => shiftWeek(1)}>
          <ChevronRight size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekStart(mondayOf(new Date()))}>
          This week
        </Button>
      </Card>

      {/* ============ CLASS ATTENDANCE ============ */}
      <Card className="p-5 mb-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1.5">Class</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
            >
              <option value="">Select a class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleGeneratePdf} disabled={!classId || generating}>
            <FileText size={14} /> {generating ? "Generating…" : "Generate PDF (this week)"}
          </Button>
          {classId && (
            <Button variant="danger" onClick={handleDeleteAttendance}>
              <Trash2 size={14} /> Delete this class&apos;s attendance
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <Card className="p-4 mb-6 border-clay/30 bg-clay/[0.04]">
          <p className="text-sm text-clay">{error}</p>
        </Card>
      )}

      {!classId && (
        <Card className="p-10 text-center mb-8">
          <CalendarCheck size={28} className="mx-auto text-ink/25 mb-3" />
          <p className="text-sm text-ink/45">Select a class above to view its weekly attendance.</p>
        </Card>
      )}

      {classId && loading && <p className="text-sm text-ink/45 text-center py-8">Loading…</p>}

      {classId && !loading && students.length > 0 && (
        <>
          <Card className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-ink/[0.08]">
                  <th className="text-left px-4 py-3 font-mono text-xs text-ink/50 sticky left-0 bg-white">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-ink/60 sticky left-0 bg-white">Name</th>
                  {weekDays.map((d, i) => (
                    <th key={i} className="px-3 py-3 text-center text-xs text-ink/60 whitespace-nowrap">
                      {WEEKDAY_LABELS[i]}
                      <div className="font-mono text-[10px] text-ink/35 font-normal">
                        {d.getDate()}/{d.getMonth() + 1}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-ink/[0.05] last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs text-ink/40">{s.id}</td>
                    <td className="px-4 py-2.5 font-medium text-ink">{s.name}</td>
                    {weekDayKeys.map((d) => {
                      const status = attendance[d]?.students?.[s.id];
                      const marked = status !== undefined;
                      const present = isPresent(status);
                      return (
                        <td key={d} className="px-3 py-2.5 text-center">
                          {!marked ? (
                            <span className="text-ink/20">—</span>
                          ) : present ? (
                            <span className="inline-flex w-6 h-6 rounded-full bg-sage/15 text-sage items-center justify-center font-semibold text-xs">
                              P
                            </span>
                          ) : (
                            <span className="inline-flex w-6 h-6 rounded-full bg-clay/15 text-clay items-center justify-center font-semibold text-xs">
                              A
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Absence filter — the "who needs following up on" report */}
          <Card className="mb-8">
            <div className="px-5 py-4 border-b border-ink/[0.06] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-clay" />
                <h2 className="font-display font-semibold text-ink">Absent this week</h2>
              </div>
              <label className="flex items-center gap-2 text-xs text-ink/60">
                Flag students absent
                <select
                  value={absenceThreshold}
                  onChange={(e) => setAbsenceThreshold(Number(e.target.value))}
                  className="rounded-[6px] border border-ink/15 px-2 py-1 text-xs"
                >
                  <option value={1}>1+ day</option>
                  <option value={2}>2+ days</option>
                  <option value={3}>3+ days</option>
                  <option value={5}>all 5 days</option>
                </select>
              </label>
            </div>
            <div className="px-5 py-4">
              {flagged.length === 0 ? (
                <p className="text-sm text-ink/45 text-center py-2">
                  No student is absent {absenceThreshold}+ day(s) this week.
                </p>
              ) : (
                <ul className="space-y-2">
                  {flagged.map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-sm">
                      <span>
                        <span className="font-medium text-ink">{s.name}</span>{" "}
                        <span className="font-mono text-xs text-ink/40">({s.id})</span>
                      </span>
                      <span className="font-mono text-xs text-clay font-medium">
                        absent {s.absent}/{weekDayKeys.length} day(s)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </>
      )}

      {classId && !loading && students.length === 0 && !error && (
        <Card className="p-10 text-center mb-8">
          <p className="text-sm text-ink/45">No students in this class yet.</p>
        </Card>
      )}

      {/* ============ TEACHER ATTENDANCE ============ */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold text-ink flex items-center gap-2">
          <Users2 size={18} className="text-indigo" /> Teacher Attendance
        </h2>
        <Button variant="secondary" onClick={handleGenerateTeacherPdf} disabled={generatingTeacherPdf}>
          <FileText size={14} /> {generatingTeacherPdf ? "Generating…" : "Generate PDF (this week)"}
        </Button>
      </div>

      {loadingTeachers && <p className="text-sm text-ink/45 text-center py-8">Loading…</p>}

      {!loadingTeachers && teachers.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-ink/[0.08]">
                <th className="text-left px-4 py-3 font-mono text-xs text-ink/50">ID</th>
                <th className="text-left px-4 py-3 font-medium text-ink/60">Name</th>
                {weekDays.map((d, i) => (
                  <th key={i} className="px-3 py-3 text-center text-xs text-ink/60 whitespace-nowrap">
                    {WEEKDAY_LABELS[i]}
                    <div className="font-mono text-[10px] text-ink/35 font-normal">
                      {d.getDate()}/{d.getMonth() + 1}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-b border-ink/[0.05] last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs text-ink/40">{t.id}</td>
                  <td className="px-4 py-2.5 font-medium text-ink">{t.name}</td>
                  {weekDayKeys.map((d) => {
                    const record = teacherAttendance[t.id]?.[d];
                    const loggedIn = record !== undefined && record !== null && record !== "";
                    const isFuture = d > todayKey;
                    return (
                      <td key={d} className="px-3 py-2.5 text-center">
                        {isFuture ? (
                          <span className="text-ink/20">—</span>
                        ) : loggedIn ? (
                          <span className="inline-flex w-6 h-6 rounded-full bg-sage/15 text-sage items-center justify-center font-semibold text-xs">
                            P
                          </span>
                        ) : (
                          <span className="inline-flex w-6 h-6 rounded-full bg-clay/15 text-clay items-center justify-center font-semibold text-xs">
                            A
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
