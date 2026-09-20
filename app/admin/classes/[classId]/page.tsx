"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  FileText,
  Timer,
  ArrowRightCircle,
  Eye,
  Pencil,
} from "lucide-react";
import { api, ApiError, Subject, SchoolClass, Question } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-url";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const QUESTION_TYPES = ["test1", "test2", "test3", "exam"] as const;
const TYPE_LABELS: Record<string, string> = {
  test1: "Test 1",
  test2: "Test 2",
  test3: "Test 3",
  exam: "Exam",
};

export default function ClassSubjectsPage({ params }: { params: { classId: string } }) {
  const { classId } = params;
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allClasses, setAllClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<{ subjectId: string; panel: string } | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);

  const currentClassName = allClasses.find((c) => c.id === classId)?.name || "";
  const resetConfirmMatches = resetConfirmText.length > 0 && resetConfirmText === currentClassName;

  async function loadSubjects() {
    setLoading(true);
    setError(null);
    try {
      const [{ subjects: subs }, { classes }] = await Promise.all([
        api.subjectsByClass(classId),
        api.adminClasses(),
      ]);
      setSubjects(subs);
      setAllClasses(classes);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Your admin session isn't active. Please log in again."
          : "Couldn't load subjects."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function handleAddSubject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const id = String(formData.get("id") || "").trim();
    const name = String(formData.get("name") || "").trim();

    try {
      await api.addSubject(id, name, classId);
      showToast(`Subject "${name}" added successfully.`);
      form.reset();
      setShowAddForm(false);
      loadSubjects();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to add subject.", "error");
    }
  }

  async function handleDeleteSubject(subj: Subject) {
    if (!confirm(`Delete ${subj.name}? All its questions will be deleted too. This cannot be undone.`))
      return;
    try {
      await api.deleteSubject(subj.id, classId);
      showToast(`${subj.name} deleted successfully.`);
      loadSubjects();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete subject.", "error");
    }
  }

  async function handleDeleteAllQuestions() {
    if (!resetConfirmMatches) return;
    setResetting(true);
    try {
      const j = await api.deleteAllQuestions(classId, resetConfirmText);
      showToast(`Cleared ${j.questionsDeleted} question(s) across ${j.subjectsAffected} subject(s).`);
      setResetConfirmText("");
      loadSubjects();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete all questions.", "error");
    } finally {
      setResetting(false);
    }
  }

  async function handleDeleteAllSubjects() {
    if (!resetConfirmMatches) return;
    if (
      !confirm(
        "This also clears this class's existing test/exam scores, not just its subjects. Continue?"
      )
    )
      return;
    setResetting(true);
    try {
      const j = await api.deleteAllSubjects(classId, resetConfirmText);
      showToast(`Deleted ${j.subjectsDeleted} subject(s) and ${j.resultsDeleted} result(s).`);
      setResetConfirmText("");
      loadSubjects();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete all subjects.", "error");
    } finally {
      setResetting(false);
    }
  }

  function togglePanel(subjectId: string, panel: string) {
    setExpandedPanel((cur) =>
      cur && cur.subjectId === subjectId && cur.panel === panel ? null : { subjectId, panel }
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/admin/classes"
        className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors mb-4"
      >
        <ArrowLeft size={15} /> Back to classes
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">
            Class · {classId}
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink mt-1">Subjects</h1>
        </div>
        <Button onClick={() => setShowAddForm((v) => !v)}>
          <Plus size={16} /> Add Subject
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-5 mb-6">
          <h2 className="font-display font-semibold text-ink mb-4">New subject</h2>
          <form onSubmit={handleAddSubject} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Subject ID</label>
              <input
                name="id"
                required
                placeholder="e.g. MATH"
                className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Subject name</label>
              <input
                name="name"
                required
                placeholder="e.g. Mathematics"
                className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 pt-1">
              <Button type="submit">Save subject</Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-5 mb-6">
        <h2 className="font-display font-semibold text-ink mb-1">
          Fresh term reset — {currentClassName || classId}
        </h2>
        <p className="text-xs text-ink/50 mb-3">
          Type this class&apos;s exact name below to enable these buttons. &quot;Delete All
          Questions&quot; empties every subject&apos;s question bank but keeps the subjects
          themselves. &quot;Delete All Subjects&quot; removes the subjects entirely and clears
          this class&apos;s existing test/exam scores too — a genuinely clean slate for a new
          term. Neither can be undone.
        </p>
        <input
          value={resetConfirmText}
          onChange={(e) => setResetConfirmText(e.target.value)}
          placeholder={`Type "${currentClassName || "class name"}" to confirm`}
          className="w-full max-w-xs rounded-[8px] border border-ink/15 px-3 py-2 text-sm mb-3 focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={handleDeleteAllQuestions}
            disabled={!resetConfirmMatches || resetting}
          >
            Delete All Questions
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAllSubjects}
            disabled={!resetConfirmMatches || resetting}
          >
            Delete All Subjects (+ Results)
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 mb-6 border-clay/30 bg-clay/[0.04]">
          <p className="text-sm text-clay">{error}</p>
        </Card>
      )}

      {loading && <p className="text-sm text-ink/45 text-center py-8">Loading…</p>}

      {!loading && subjects.length === 0 && !error && (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink/45">No subjects yet. Add one above to get started.</p>
        </Card>
      )}

      <div className="space-y-4">
        {subjects.map((subj) => {
          const panelKey = (p: string) =>
            expandedPanel?.subjectId === subj.id && expandedPanel?.panel === p;
          return (
            <Card key={subj.id} className="overflow-hidden">
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold text-ink">{subj.name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="font-mono text-xs text-ink/40">{subj.id}</span>
                    {QUESTION_TYPES.map((t) => (
                      <span key={t} className="font-mono text-xs text-ink/50">
                        {TYPE_LABELS[t]}: {(subj.questions?.[t] || []).length}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Button size="sm" variant="secondary" onClick={() => togglePanel(subj.id, "view")}>
                    <Eye size={14} /> Questions
                    {panelKey("view") ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => togglePanel(subj.id, "timings")}>
                    <Timer size={14} /> Timings
                    {panelKey("timings") ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => togglePanel(subj.id, "forward")}>
                    <ArrowRightCircle size={14} /> Forward
                    {panelKey("forward") ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => togglePanel(subj.id, "addOne")}>
                    <Plus size={14} /> Add Question
                    {panelKey("addOne") ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => togglePanel(subj.id, "upload")}>
                    <UploadCloud size={14} /> Bulk upload
                    {panelKey("upload") ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteSubject(subj)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {panelKey("view") && (
                <QuestionsViewPanel subject={subj} classId={classId} onChanged={loadSubjects} />
              )}
              {panelKey("timings") && (
                <TimingsPanel subject={subj} classId={classId} onChanged={loadSubjects} />
              )}
              {panelKey("forward") && (
                <ForwardPanel subject={subj} classId={classId} allClasses={allClasses} />
              )}
              {panelKey("addOne") && (
                <AddQuestionPanel subjectId={subj.id} classId={classId} onDone={loadSubjects} />
              )}
              {panelKey("upload") && (
                <BulkUploadPanel subjectId={subj.id} classId={classId} onDone={loadSubjects} />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function QuestionsViewPanel({
  subject,
  classId,
  onChanged,
}: {
  subject: Subject;
  classId: string;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [activeType, setActiveType] = useState<(typeof QUESTION_TYPES)[number]>("test1");
  const [generating, setGenerating] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const questions = subject.questions?.[activeType] || [];

  async function handleGeneratePdf() {
    setGenerating(true);
    try {
      const { file } = await api.generateQuestionsPdf(classId, subject.id, activeType);
      window.open(resolveMediaUrl(file), "_blank");
      showToast("Question paper PDF generated successfully.");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to generate PDF.", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteAll() {
    if (!questions.length) return;
    if (
      !confirm(
        `Delete ALL ${questions.length} question(s) in ${TYPE_LABELS[activeType]} for ${subject.name}? This cannot be undone.`
      )
    )
      return;
    setDeletingAll(true);
    try {
      for (const q of questions) {
        await api.deleteQuestion(subject.id, q.qid, classId);
      }
      showToast(`Deleted all ${TYPE_LABELS[activeType]} questions successfully.`);
      onChanged();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete all questions.", "error");
    } finally {
      setDeletingAll(false);
    }
  }

  async function handleDeleteOne(qid: string) {
    if (!confirm("Delete this question?")) return;
    try {
      await api.deleteQuestion(subject.id, qid, classId);
      showToast("Question deleted successfully.");
      onChanged();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete question.", "error");
    }
  }

  return (
    <div className="border-t border-ink/[0.06] bg-parchment-dim/60 px-5 py-5">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {QUESTION_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              activeType === t ? "bg-indigo text-parchment" : "bg-white border border-ink/15 text-ink/60"
            }`}
          >
            {TYPE_LABELS[t]} ({(subject.questions?.[t] || []).length})
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleGeneratePdf} disabled={generating || !questions.length}>
            <FileText size={14} /> {generating ? "Generating…" : "Generate PDF"}
          </Button>
          <Button size="sm" variant="danger" onClick={handleDeleteAll} disabled={deletingAll || !questions.length}>
            <Trash2 size={14} /> Delete all {TYPE_LABELS[activeType]}
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-ink/45 py-6 text-center">No {TYPE_LABELS[activeType]} questions yet.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {questions.map((q, i) => (
            <QuestionRow
              key={q.qid}
              q={q}
              index={i}
              subjectId={subject.id}
              classId={classId}
              onDelete={() => handleDeleteOne(q.qid)}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionRow({
  q,
  index,
  subjectId,
  classId,
  onDelete,
  onChanged,
}: {
  q: Question;
  index: number;
  subjectId: string;
  classId: string;
  onDelete: () => void;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.editQuestion(subjectId, q.qid, classId, {
        text: String(fd.get("text") || ""),
        options: String(fd.get("options") || ""),
        answer: String(fd.get("answer") || ""),
        marks: Number(fd.get("marks")) || undefined,
      });
      showToast("Question updated successfully.");
      setEditing(false);
      onChanged();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to save changes.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="bg-white rounded-[8px] border border-indigo/30 p-3.5 space-y-2.5"
      >
        <div>
          <label className="block text-xs font-medium text-ink/50 mb-1">Question text</label>
          <textarea
            name="text"
            defaultValue={q.text}
            required
            rows={2}
            className="w-full rounded-[6px] border border-ink/15 px-2.5 py-1.5 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/50 mb-1">
            Options (comma-separated)
          </label>
          <input
            name="options"
            defaultValue={q.options?.join(", ")}
            className="w-full rounded-[6px] border border-ink/15 px-2.5 py-1.5 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
          />
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-ink/50 mb-1">Answer</label>
            <input
              name="answer"
              defaultValue={q.answer}
              className="w-32 rounded-[6px] border border-ink/15 px-2.5 py-1.5 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/50 mb-1">Marks</label>
            <input
              name="marks"
              type="number"
              defaultValue={q.marks}
              className="w-20 rounded-[6px] border border-ink/15 px-2.5 py-1.5 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
            />
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white rounded-[8px] border border-ink/[0.08] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink flex-1">
          <span className="font-mono text-xs text-ink/40 mr-1.5">{index + 1}.</span>
          {q.text}
        </p>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="text-ink/30 hover:text-indigo transition-colors"
            aria-label="Edit question"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="text-ink/30 hover:text-clay transition-colors"
            aria-label="Delete question"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {q.options?.length > 0 && (
        <p className="text-xs text-ink/55 mt-1.5 pl-5">{q.options.join("   |   ")}</p>
      )}
      <div className="flex items-center gap-3 mt-1.5 pl-5">
        <span className="font-mono text-xs text-sage">Answer: {q.answer}</span>
        <span className="font-mono text-xs text-ink/40">{q.marks} mark(s)</span>
      </div>
    </div>
  );
}

function TimingsPanel({
  subject,
  classId,
  onChanged,
}: {
  subject: Subject;
  classId: string;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.setSubjectTimings(subject.id, classId, {
        test1: Number(fd.get("test1")) || 30,
        test2: Number(fd.get("test2")) || 30,
        test3: Number(fd.get("test3")) || 30,
        exam: Number(fd.get("exam")) || 60,
      });
      showToast("Timings saved successfully.");
      onChanged();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to save timings.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-ink/[0.06] bg-parchment-dim/60 px-5 py-5">
      <form onSubmit={handleSubmit} className="flex items-end gap-4 flex-wrap">
        {QUESTION_TYPES.map((t) => (
          <div key={t}>
            <label className="block text-xs font-medium text-ink/60 mb-1.5">
              {TYPE_LABELS[t]} (minutes)
            </label>
            <input
              name={t}
              type="number"
              min={1}
              defaultValue={subject.timeLimits?.[t] ?? (t === "exam" ? 60 : 30)}
              className="w-24 rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
            />
          </div>
        ))}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save timings"}
        </Button>
      </form>
    </div>
  );
}

function ForwardPanel({
  subject,
  classId,
  allClasses,
}: {
  subject: Subject;
  classId: string;
  allClasses: SchoolClass[];
}) {
  const { showToast } = useToast();
  const [target, setTarget] = useState("");
  const [forwarding, setForwarding] = useState(false);

  async function handleForward() {
    if (!target) return;
    const targetName = allClasses.find((c) => c.id === target)?.name || target;
    if (
      !confirm(
        `Copy all of ${subject.name}'s questions into ${targetName}? If that class already has this subject, its questions will be replaced.`
      )
    )
      return;
    setForwarding(true);
    try {
      await api.forwardQuestions(classId, target, subject.id);
      showToast(`Questions forwarded to ${targetName} successfully.`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to forward questions.", "error");
    } finally {
      setForwarding(false);
    }
  }

  return (
    <div className="border-t border-ink/[0.06] bg-parchment-dim/60 px-5 py-5">
      <p className="text-xs text-ink/50 mb-3">
        Copies every question in {subject.name} to the same subject in another class.
      </p>
      <div className="flex items-center gap-2">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
        >
          <option value="">Select target class…</option>
          {allClasses
            .filter((c) => c.id !== classId)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
        <Button onClick={handleForward} disabled={!target || forwarding}>
          {forwarding ? "Forwarding…" : "Forward questions"}
        </Button>
      </div>
    </div>
  );
}

function AddQuestionPanel({
  subjectId,
  classId,
  onDone,
}: {
  subjectId: string;
  classId: string;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  // React state updates aren't instant — disabled={submitting} only
  // takes effect once the component actually re-renders, which is a
  // moment too late for a fast double-click: both click events can
  // fire before the button visually disables. A plain variable
  // checked synchronously at the very top of handleSubmit closes that
  // gap completely, since it updates the instant it's assigned, not
  // on the next render. This is what was producing "added
  // successfully" and "failed to add" together: the first click
  // genuinely succeeded and reset the form, and the second click's
  // handler — already in flight — then read that just-reset (now
  // empty) form and submitted blank required fields, which the
  // backend correctly rejected as a separate, later failure.
  const submittingRef = useRef(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await api.addQuestion({
        subjectId,
        classId,
        type: String(fd.get("type") || "test1"),
        qid: String(fd.get("qid") || `Q${Date.now()}`),
        text: String(fd.get("text") || ""),
        options: String(fd.get("options") || ""),
        answer: String(fd.get("answer") || ""),
        marks: Number(fd.get("marks")) || 1,
      });
      showToast("Question added successfully.");
      e.currentTarget.reset();
      onDone();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to add question.", "error");
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  return (
    <div className="border-t border-ink/[0.06] bg-parchment-dim/60 px-5 py-5">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1.5">Test type</label>
          <select
            name="type"
            defaultValue="test1"
            className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1.5">
            Question ID <span className="text-ink/35">(optional)</span>
          </label>
          <input
            name="qid"
            placeholder="Auto-generated if left blank"
            className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-ink/60 mb-1.5">Question text</label>
          <textarea
            name="text"
            required
            rows={2}
            className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-ink/60 mb-1.5">
            Options (comma-separated)
          </label>
          <input
            name="options"
            placeholder="e.g. Lagos, Abuja, Kano, Ibadan"
            className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1.5">Correct answer</label>
          <input
            name="answer"
            required
            className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1.5">Marks</label>
          <input
            name="marks"
            type="number"
            defaultValue={1}
            min={1}
            className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add question"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function BulkUploadPanel({
  subjectId,
  classId,
  onDone,
}: {
  subjectId: string;
  classId: string;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("subjectId", subjectId);
    formData.append("classId", classId);

    setSubmitting(true);
    try {
      const result = await api.bulkUploadQuestions(formData);
      let msg = `${result.added} question(s) added`;
      if (result.skipped) msg += `, ${result.skipped} skipped`;
      if (result.imagesAttached) msg += `, ${result.imagesAttached} picture(s) attached`;
      showToast(msg + ".");
      if (result.unmatchedImages && result.unmatchedImages.length) {
        showToast(
          `These uploaded pictures didn't match any row: ${result.unmatchedImages.join(", ")}`,
          "error"
        );
      }
      form.reset();
      onDone();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Bulk upload failed.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-ink/[0.06] bg-parchment-dim/60 px-5 py-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1.5">
            Question sheet (CSV, TSV, or Excel)
          </label>
          <input
            type="file"
            name="csv"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            required
            className="text-sm w-full"
          />
          <p className="text-xs text-ink/45 mt-1">
            Columns: Type, QuestionID, QuestionText, Options, Answer, Mark, and optionally Image
            (a filename, e.g. &ldquo;q5_diagram.png&rdquo;).
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1.5">
            Pictures for this batch (optional)
          </label>
          <input type="file" name="images" accept="image/*" multiple className="text-sm w-full" />
          <p className="text-xs text-ink/45 mt-1">
            Each picture&apos;s filename must exactly match what you typed in the sheet&apos;s
            Image column.
          </p>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Uploading…" : "Upload"}
        </Button>
      </form>
    </div>
  );
}
