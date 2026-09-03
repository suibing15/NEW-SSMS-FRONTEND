"use client";

// Converted from a Server Component to a Client Component.
//
// The original version ran on the Next.js server and read the login
// session via cookies() from next/headers — but that only ever sees
// cookies the browser attached to its request to the Next.js server's
// OWN origin. The actual admin session cookie (school.sid) is set by
// the separate Express backend, on ITS origin — a browser never
// forwards one site's cookies to a different site during normal page
// navigation. So this page always looked logged-out server-side, even
// immediately after a real, successful login, and showed "Your admin
// session isn't active" every time.
//
// Fetching client-side instead means the browser itself makes the
// request, with credentials: "include" (already built into
// lib/api.ts's request() helper) — exactly the same way the login
// page's own fetch works, and exactly why every other admin page
// (attendance, classes, students, teachers, reports, settings) was
// already built this way and never had this bug.
import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Users, BookOpen, Lock } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopStudentsWidget } from "@/components/top-students-widget";
import { api, ApiError, SchoolClass } from "@/lib/api";

type ClassWithCount = SchoolClass & { studentCount: number };

export default function AdminDashboardPage() {
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [teacherCount, setTeacherCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [{ classes: rawClasses }, { teachers }] = await Promise.all([
          api.adminClasses(),
          api.adminTeachers(),
        ]);

        const withCounts = await Promise.all(
          rawClasses.map(async (c) => {
            try {
              const { students } = await api.classStudents(c.id);
              return { ...c, studentCount: students.length };
            } catch {
              return { ...c, studentCount: 0 };
            }
          })
        );

        if (cancelled) return;
        setClasses(withCounts);
        setTeacherCount(teachers.length);
        setTotalStudents(withCounts.reduce((sum, c) => sum + c.studentCount, 0));
        setError(null);
      } catch (err) {
        if (cancelled) return;
        // A 401 here almost always means "please log in again", not
        // "the server is offline" — shown as the real reason, not a
        // guess, same as every other admin page already does.
        let message = "Couldn't load the dashboard.";
        if (err instanceof ApiError) {
          message =
            err.status === 401
              ? "Your admin session isn't active. Please log in again."
              : err.message;
        }
        setClasses([]);
        setTeacherCount(0);
        setTotalStudents(0);
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">Overview</p>
          <h1 className="font-display text-2xl font-semibold text-ink mt-1">
            Good day, Administrator
          </h1>
        </div>
      </div>

      {error && (
        <Card className="p-4 mb-6 border-clay/30 bg-clay/[0.04] flex items-center justify-between gap-4">
          <p className="text-sm text-clay">{error}</p>
          {error.includes("log in") && (
            <Link
              href="/manage-unlock"
              className="text-sm font-medium text-clay underline underline-offset-2 whitespace-nowrap"
            >
              Go to login
            </Link>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard label="Students" value={totalStudents} icon={GraduationCap} accent="indigo" />
        <StatCard label="Teachers" value={teacherCount} icon={Users} accent="gold" />
        <StatCard label="Classes" value={classes.length} icon={BookOpen} accent="sage" />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-ink/[0.06] flex items-center justify-between">
          <h2 className="font-display font-semibold text-ink">Classes</h2>
          <span className="font-mono text-xs text-ink/40">{classes.length} total</span>
        </div>
        <div className="divide-y divide-ink/[0.06]">
          {!loading && classes.length === 0 && !error && (
            <p className="px-5 py-8 text-sm text-ink/45 text-center">
              No classes yet. Add one from Classes &amp; Subjects.
            </p>
          )}
          {classes.map((c) => (
            <div key={c.id} className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-display font-medium text-ink">{c.name}</span>
                <span className="font-mono text-xs text-ink/40">{c.id}</span>
                {c.locked && (
                  <Badge tone="warning">
                    <Lock size={11} /> Locked
                  </Badge>
                )}
              </div>
              <span className="font-mono text-sm text-ink/60">
                {c.studentCount} student{c.studentCount === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <TopStudentsWidget classes={classes} />
    </div>
  );
}
