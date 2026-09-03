"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  FileText,
  BookOpenCheck,
  ClipboardList,
  Download,
  History,
} from "lucide-react";
import { api, ApiError, API_BASE } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-url";
import { formatDate } from "@/lib/format-date";
import { Card } from "@/components/ui/card";

type DashboardData = Awaited<ReturnType<typeof api.parentDashboard>>;

export default function ParentDashboardPage({ params }: { params: { studentId: string } }) {
  const { studentId } = params;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .parentDashboard(studentId)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this dashboard."))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-parchment">
        <p className="text-sm text-ink/45">Loading…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
        <Card className="p-8 max-w-sm text-center border-clay/30 bg-clay/[0.04]">
          <p className="text-sm text-clay">{error || "Something went wrong."}</p>
          <Link href="/parent/search" className="mt-4 inline-block text-sm text-indigo hover:text-gold-dark transition-colors">
            ← Search again
          </Link>
        </Card>
      </main>
    );
  }

  const { student, average, pdfs } = data;

  return (
    <main className="min-h-screen bg-parchment px-6 py-10">
      <div className="max-w-2xl mx-auto animate-rise-in">
        <Link
          href="/parent/search"
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} /> Search another student
        </Link>

        {/* Student card */}
        <Card className="mt-6 p-6 overflow-hidden">
          <div className="h-1 -mx-6 -mt-6 mb-5 bg-gradient-to-r from-indigo via-indigo-light to-indigo" />
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center overflow-hidden border-2 border-gold/40 shrink-0">
              {student.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
              ) : (
                <GraduationCap size={30} />
              )}
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-ink">{student.name}</p>
              <p className="text-sm text-ink/55">{student.className}</p>
              <p className="font-mono text-xs text-ink/40 mt-0.5">{student.id}</p>
            </div>
          </div>
        </Card>

        {/* Average */}
        <Card className="mt-4 p-6 text-center border-gold/40 bg-gold/[0.05]">
          <p className="text-xs font-medium text-ink/50 uppercase tracking-wide">Overall Average</p>
          <p className="mt-1 font-display text-3xl font-semibold text-ink">
            {average !== null ? average : "—"}
          </p>
          {average === null && (
            <p className="text-xs text-ink/45 mt-1">No results recorded yet.</p>
          )}
        </Card>

        {/* Three persistent documents */}
        <div className="mt-6 space-y-3">
          <PdfRow
            icon={ClipboardList}
            label="Tests Summary"
            description="Test 1, 2, and 3 across every subject"
            file={pdfs.tests}
          />
          <PdfRow
            icon={BookOpenCheck}
            label="Exam Summary"
            description="Exam scores across every subject"
            file={pdfs.exam}
          />
          <PdfRow
            icon={FileText}
            label="Report Sheet"
            description="The full, official term report"
            file={pdfs.reportSheet}
          />
        </div>

        {/* Individual submissions — the same detailed, question-by-question
            PDFs the old system always showed, one per CBT sitting, sitting
            alongside the two summaries above rather than replacing them. */}
        {data.individualSubmissions.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <History size={13} /> Individual test &amp; exam submissions
            </p>
            <Card className="divide-y divide-ink/[0.05] overflow-hidden">
              {data.individualSubmissions.map((sub, i) => (
                <a
                  key={i}
                  href={resolveMediaUrl(sub.filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-5 py-3 text-sm hover:bg-ink/[0.02] transition-colors"
                >
                  <span className="text-ink">
                    {sub.subject || "Subject"}
                    <span className="text-ink/40 font-mono text-xs ml-2">
                      {(sub.examType || "").toUpperCase()}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 text-ink/40 text-xs">
                    {formatDate(sub.timestamp)}
                    <Download size={13} />
                  </span>
                </a>
              ))}
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

function PdfRow({
  icon: Icon,
  label,
  description,
  file,
}: {
  icon: typeof FileText;
  label: string;
  description: string;
  file: { filePath: string; updatedAt: string } | null;
}) {
  return (
    <Card className="p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center shrink-0">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-ink">{label}</p>
          <p className="text-xs text-ink/50">{description}</p>
          {file && (
            <p className="text-xs text-ink/40 mt-0.5">
              Updated {formatDate(file.updatedAt)}
            </p>
          )}
        </div>
      </div>
      {file ? (
        <a
          href={resolveMediaUrl(file.filePath)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo hover:text-gold-dark transition-colors shrink-0"
        >
          <Download size={15} /> Download
        </a>
      ) : (
        <span className="text-xs text-ink/35 shrink-0">Not yet available</span>
      )}
    </Card>
  );
}
