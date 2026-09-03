"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, BookOpen, ChevronRight } from "lucide-react";
import { api, API_BASE, Student } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-url";
import { Card } from "@/components/ui/card";

const TYPES: { key: string; label: string }[] = [
  { key: "test1", label: "Test 1" },
  { key: "test2", label: "Test 2" },
  { key: "test3", label: "Test 3" },
  { key: "exam", label: "Exam" },
];

export default function ExamSubjectSelectPage({
  params,
}: {
  params: { classId: string; studentId: string };
}) {
  const { classId, studentId } = params;
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [activeType, setActiveType] = useState<string | null>(null);

  useEffect(() => {
    api.examClassStudents(classId).then((r) => {
      setStudent(r.students.find((s) => s.id === studentId) || null);
    });
    api.examClassSubjects(classId).then((r) => setSubjects(r.subjects)).catch(() => {});
  }, [classId, studentId]);

  return (
    <main className="min-h-screen bg-parchment px-6 py-10">
      <div className="max-w-lg mx-auto animate-rise-in">
        <Link
          href={`/exam/classes/${encodeURIComponent(classId)}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </Link>

        {/* Student card — the professional identity card for this session */}
        <Card className="mt-6 p-6 text-center overflow-hidden">
          <div className="h-1 -mx-6 -mt-6 mb-5 bg-gradient-to-r from-indigo via-indigo-light to-indigo" />
          <div className="w-20 h-20 mx-auto rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center overflow-hidden border-2 border-gold/40">
            {student?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
            ) : (
              <GraduationCap size={30} />
            )}
          </div>
          <p className="mt-3 font-display text-lg font-semibold text-ink">
            {student?.name || "Loading…"}
          </p>
          <p className="font-mono text-xs text-ink/40">
            {studentId} · {classId}
          </p>
        </Card>

        {/* Step 1: which assessment */}
        <div className="mt-6">
          <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">
            1. Choose assessment type
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveType(t.key)}
                className={`px-4 py-3 rounded-card border text-sm font-medium transition-colors ${
                  activeType === t.key
                    ? "bg-indigo text-parchment border-indigo"
                    : "bg-white border-ink/[0.08] text-ink hover:border-indigo/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: which subject */}
        {activeType && (
          <div className="mt-6 animate-rise-in">
            <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">
              2. Choose subject
            </p>
            <div className="space-y-2">
              {subjects.map((s) => (
                <Link
                  key={s.id}
                  href={`/exam/classes/${encodeURIComponent(classId)}/${encodeURIComponent(studentId)}/${encodeURIComponent(s.id)}/${encodeURIComponent(activeType)}`}
                >
                  <Card className="px-5 py-3.5 flex items-center justify-between hover:shadow-lift transition-shadow">
                    <span className="flex items-center gap-3">
                      <BookOpen size={16} className="text-indigo" />
                      <span className="font-medium text-ink">{s.name}</span>
                    </span>
                    <ChevronRight size={16} className="text-ink/30" />
                  </Card>
                </Link>
              ))}
              {subjects.length === 0 && (
                <p className="text-sm text-ink/45 text-center py-4">
                  No subjects have been set up for this class yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
