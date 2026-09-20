"use client";

import { useEffect, useState } from "react";
import { FileText, Users, Files, Trash2, AlertTriangle } from "lucide-react";
import { api, ApiError, SchoolClass } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-url";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function ReportsPage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [generatingIndividual, setGeneratingIndividual] = useState(false);
  const [generatingCombined, setGeneratingCombined] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<string[]>([]);

  useEffect(() => {
    api.adminClasses().then(({ classes }) => setClasses(classes)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      return;
    }
    api.adminClassStudents(classId).then(({ students }) => setStudents(students)).catch(() => setStudents([]));
  }, [classId]);

  async function handleGenerateIndividual() {
    if (!classId) return;
    setGeneratingIndividual(true);
    setGeneratedReports([]);
    try {
      const { reports, count } = await api.generateClassReports(classId, selectedStudentId || undefined);
      setGeneratedReports(reports);
      showToast(
        selectedStudentId
          ? "Generated that student's report sheet successfully."
          : `Generated ${count} individual report sheet(s) successfully.`
      );
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Failed to generate report sheets.",
        "error"
      );
    } finally {
      setGeneratingIndividual(false);
    }
  }

  async function handleGenerateCombined() {
    if (!classId) return;
    setGeneratingCombined(true);
    try {
      const { file } = await api.generateCombinedReport(classId);
      window.open(resolveMediaUrl(file), "_blank");
      showToast("Combined class report generated successfully.");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Failed to generate the combined report.",
        "error"
      );
    } finally {
      setGeneratingCombined(false);
    }
  }

  async function handleDeleteAll() {
    if (
      !confirm(
        "This permanently deletes EVERY student's results, across the ENTIRE school, not just PDF files. This cannot be undone. Continue?"
      )
    )
      return;
    if (
      !confirm(
        "Are you absolutely certain? Every score for every student in every class will be erased. Click OK only if you really mean to do this now."
      )
    )
      return;

    setDeletingAll(true);
    try {
      const { resultsCleared, filesDeleted } = await api.deleteAllReports();
      showToast(`Cleared ${resultsCleared} result(s) and deleted ${filesDeleted} PDF file(s).`);
      setGeneratedReports([]);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete all reports.", "error");
    } finally {
      setDeletingAll(false);
    }
  }

  const className = classes.find((c) => c.id === classId)?.name;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">Manage</p>
        <h1 className="font-display text-2xl font-semibold text-ink mt-1">Report Sheets</h1>
      </div>

      <Card className="p-5 mb-6">
        <label className="block text-xs font-medium text-ink/60 mb-1.5">Class</label>
        <select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setSelectedStudentId("");
            setGeneratedReports([]);
          }}
          className="rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
        >
          <option value="">Select a class…</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Card>

      {!classId && (
        <Card className="p-10 text-center mb-6">
          <FileText size={28} className="mx-auto text-ink/25 mb-3" />
          <p className="text-sm text-ink/45">Select a class above to generate its report sheets.</p>
        </Card>
      )}

      {classId && (
        <>
          <Card className="p-5 mb-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="font-medium text-ink flex items-center gap-2">
                  <Users size={16} className="text-indigo" /> Individual report sheets
                </p>
                <p className="text-xs text-ink/50 mt-1 max-w-md">
                  {selectedStudentId
                    ? "Just this one student's report — faster than generating the whole class."
                    : `One PDF per student in ${className || classId}, each with their own subjects, scores, and position in class.`}
                </p>
              </div>
              <Button onClick={handleGenerateIndividual} disabled={generatingIndividual}>
                <FileText size={14} /> {generatingIndividual ? "Generating…" : "Generate"}
              </Button>
            </div>
            <label className="block text-xs font-medium text-ink/60 mb-1.5">
              Student (optional — leave blank to generate the whole class)
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
            >
              <option value="">Whole class ({students.length} students)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Card>

          {generatedReports.length > 0 && (
            <Card className="p-5 mb-4">
              <p className="text-sm font-medium text-ink mb-3">
                {generatedReports.length} report(s) ready
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                {generatedReports.map((path) => {
                  const filename = path.split("/").pop() || path;
                  return (
                    <a
                      key={path}
                      href={resolveMediaUrl(path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-indigo hover:text-gold-dark transition-colors truncate"
                    >
                      <Files size={13} className="shrink-0" />
                      <span className="truncate">{filename}</span>
                    </a>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="p-5 mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-ink flex items-center gap-2">
                <Files size={16} className="text-gold-dark" /> Full class report
              </p>
              <p className="text-xs text-ink/50 mt-1 max-w-md">
                One combined PDF: every student in {className || classId}, ranked, plus a class
                summary page.
              </p>
            </div>
            <Button variant="secondary" onClick={handleGenerateCombined} disabled={generatingCombined}>
              <FileText size={14} /> {generatingCombined ? "Generating…" : "Generate"}
            </Button>
          </Card>
        </>
      )}

      <Card className="p-5 border-clay/30 bg-clay/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <AlertTriangle size={18} className="text-clay shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ink">Delete all report data</p>
            <p className="text-xs text-ink/55 mt-1">
              Erases every student&apos;s results across the entire school, and every generated
              report PDF file. Not limited to one class. This cannot be undone.
            </p>
          </div>
          <Button
            variant="danger"
            onClick={handleDeleteAll}
            disabled={deletingAll}
            className="w-full sm:w-auto justify-center"
          >
            <Trash2 size={14} /> {deletingAll ? "Deleting…" : "Delete everything"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
