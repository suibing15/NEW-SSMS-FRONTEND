"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";

export default function AttendanceClassesPage() {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api.attendanceClasses().then((r) => setClasses(r.classes)).catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-parchment px-6 py-12">
      <div className="max-w-lg mx-auto animate-rise-in">
        <Link
          href="/attendance"
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </Link>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink/40 text-center">
          Attendance Portal
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink text-center">
          Select a class
        </h1>

        <div className="mt-8 space-y-2.5">
          {classes.map((c) => (
            <Link key={c.id} href={`/attendance/classes/${encodeURIComponent(c.id)}`}>
              <Card className="px-5 py-3.5 flex items-center justify-between hover:shadow-lift transition-shadow">
                <span className="flex items-center gap-3">
                  <BookOpen size={16} className="text-indigo" />
                  <span className="font-medium text-ink">{c.name}</span>
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
