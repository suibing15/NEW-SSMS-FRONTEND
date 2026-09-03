import { GraduationCap, Users, BookOpen, Lock } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopStudentsWidget } from "@/components/top-students-widget";
import { api, ApiError, SchoolClass } from "@/lib/api";
import { cookies } from "next/headers";

async function getDashboardData() {
  const cookieHeader = cookies().toString();
  try {
    const [{ classes }, { teachers }] = await Promise.all([
      api.adminClasses(cookieHeader),
      api.adminTeachers(cookieHeader),
    ]);

    const withCounts = await Promise.all(
      classes.map(async (c) => {
        try {
          const { students } = await api.classStudents(c.id, cookieHeader);
          return { ...c, studentCount: students.length };
        } catch {
          return { ...c, studentCount: 0 };
        }
      })
    );

    const totalStudents = withCounts.reduce((sum, c) => sum + c.studentCount, 0);

    return { classes: withCounts, teachers, totalStudents, error: null as string | null };
  } catch (err) {
    // Show the real reason, not a guess — a 401 here almost always
    // means "please log in again", not "the server is offline".
    let message = "Couldn't load the dashboard.";
    if (err instanceof ApiError) {
      message =
        err.status === 401
          ? "Your admin session isn't active. Please log in again."
          : err.message;
    }
    return {
      classes: [] as (SchoolClass & { studentCount: number })[],
      teachers: [],
      totalStudents: 0,
      error: message,
    };
  }
}

export default async function AdminDashboardPage() {
  const { classes, teachers, totalStudents, error } = await getDashboardData();

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
        <StatCard label="Teachers" value={teachers.length} icon={Users} accent="gold" />
        <StatCard label="Classes" value={classes.length} icon={BookOpen} accent="sage" />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-ink/[0.06] flex items-center justify-between">
          <h2 className="font-display font-semibold text-ink">Classes</h2>
          <span className="font-mono text-xs text-ink/40">{classes.length} total</span>
        </div>
        <div className="divide-y divide-ink/[0.06]">
          {classes.length === 0 && !error && (
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
