"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { GraduationCap, Search, Trash2, CreditCard, Plus, X, Package, Receipt, UploadCloud, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { api, ApiError, Student, SchoolClass, downloadBlob } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-url";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

type StudentWithClass = Student & { className: string };

export default function StudentsPage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [receiptTerm, setReceiptTerm] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [generatingReceipts, setGeneratingReceipts] = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkCredentials, setBulkCredentials] = useState<{ id: string; name: string; password: string }[]>([]);
  const [justCreated, setJustCreated] = useState<{ id: string; password: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editPasswordResult, setEditPasswordResult] = useState<{ id: string; password: string } | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const { classes: cls } = await api.adminClasses();
      setClasses(cls);

      const perClass = await Promise.all(
        cls.map(async (c) => {
          try {
            const { students: s } = await api.adminClassStudents(c.id);
            return s.map((st) => ({ ...st, className: c.name }));
          } catch {
            return [];
          }
        })
      );
      setStudents(perClass.flat());
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Your admin session isn't active. Please log in again."
          : "Couldn't load students."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    let list = students;
    if (classFilter) list = list.filter((s) => s.classId === classFilter);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [students, search, classFilter]);

  // Only ever act on students actually visible in the current
  // filter/search — selecting "all" never silently includes someone
  // hidden by a search term or class filter.
  const selectedInView = useMemo(
    () => filtered.filter((s) => selected.has(s.id)),
    [filtered, selected]
  );
  const allVisibleSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((s) => next.delete(s.id));
      } else {
        filtered.forEach((s) => next.add(s.id));
      }
      return next;
    });
  }

  async function handleAddStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await api.addStudent(formData);
      if (result.generatedPassword) {
        setJustCreated({ id: String(formData.get("id")), password: result.generatedPassword });
      }
      form.reset();
      setShowAddForm(false);
      showToast("Student added successfully.");
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to add student.", "error");
    }
  }

  async function handleUpdateStudent(e: FormEvent<HTMLFormElement>, currentId: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    // An empty ID field means "leave it as-is" — the backend only
    // renames when newId is present, non-empty, and actually different,
    // so this is safe to always send.
    setSavingEdit(true);
    try {
      const result = await api.updateStudent(currentId, formData);
      if (result.generatedPassword) {
        setEditPasswordResult({ id: result.id, password: result.generatedPassword });
      }
      showToast("Student updated successfully.");
      setEditingId(null);
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to update student.", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Delete student ${id}? This cannot be undone.`)) return;
    try {
      await api.deleteStudent(id);
      showToast(`Student ${id} deleted successfully.`);
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete student.", "error");
    }
  }

  async function handleDeleteAll() {
    if (!confirm("This deletes EVERY student in the school. This cannot be undone. Continue?")) return;
    if (!confirm("Are you absolutely sure? Click OK only if you really want to delete all students now."))
      return;
    try {
      const { deleted } = await api.deleteAllStudents();
      showToast(`Deleted ${deleted} students successfully.`);
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete all students.", "error");
    }
  }

  async function handleDownloadCard(id: string, plainPassword?: string) {
    try {
      const blob = await api.studentIdCard(id, plainPassword);
      downloadBlob(blob, `${id}_idcard.pdf`);
      showToast("ID card generated successfully.");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to generate ID card.", "error");
    }
  }

  // Selection with nothing checked falls back to "everyone currently
  // visible" — so the button still works if the admin never touches
  // a checkbox, matching how it behaved before selection existed.
  function effectiveTargets(): StudentWithClass[] {
    return selectedInView.length > 0 ? selectedInView : filtered;
  }

  async function handleBulkDownloadCards() {
    const targets = effectiveTargets();
    if (targets.length === 0) return;
    if (
      !confirm(
        `Generate one combined PDF (several cards per page) for ${targets.length} student(s)?`
      )
    )
      return;

    setGeneratingCards(true);
    try {
      const blob = await api.bulkStudentIdCards(targets.map((s) => s.id));
      downloadBlob(blob, `student_id_cards_${classFilter || "selection"}.pdf`);
      showToast(`Generated a combined ID card sheet for ${targets.length} student(s).`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Bulk ID card generation failed.", "error");
    } finally {
      setGeneratingCards(false);
    }
  }

  async function handleGenerateReceipts() {
    const targets = effectiveTargets();
    if (!receiptTerm || !receiptAmount) return;
    if (targets.length === 0) {
      showToast("No students to generate receipts for.", "error");
      return;
    }
    // Receipts are grouped per class server-side, so a mixed-class
    // selection isn't meaningful here — require a single class.
    const classIds = new Set(targets.map((s) => s.classId));
    if (classIds.size > 1) {
      showToast("Select students from one class at a time for receipts.", "error");
      return;
    }

    setGeneratingReceipts(true);
    try {
      const blob = await api.bulkReceipts(
        targets[0].classId,
        receiptTerm,
        receiptAmount,
        targets.map((s) => ({ id: s.id, name: s.name }))
      );
      downloadBlob(blob, `receipts_${targets[0].classId}_${receiptTerm.replace(/\s+/g, "_")}.pdf`);
      showToast(`Generated ${targets.length} receipt(s) successfully.`);
      setShowReceiptForm(false);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to generate receipts.", "error");
    } finally {
      setGeneratingReceipts(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">Manage</p>
          <h1 className="font-display text-2xl font-semibold text-ink mt-1">Students</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowBulkForm((v) => !v)}>
            <UploadCloud size={16} /> Bulk Upload
          </Button>
          <Button onClick={() => setShowAddForm((v) => !v)}>
            <Plus size={16} /> Add Student
          </Button>
        </div>
      </div>

      {justCreated && (
        <Card className="p-4 mb-6 border-gold/40 bg-gold/[0.06] flex items-center justify-between gap-4">
          <p className="text-sm text-ink">
            Student <span className="font-mono font-medium">{justCreated.id}</span> added. Login
            password: <span className="font-mono font-semibold">{justCreated.password}</span>
            <br />
            <span className="text-ink/50">Write this down now, it won&apos;t be shown again.</span>
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleDownloadCard(justCreated.id, justCreated.password)}
            >
              <CreditCard size={14} /> Generate card
            </Button>
            <button
              onClick={() => setJustCreated(null)}
              className="text-ink/40 hover:text-ink transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </Card>
      )}

      {editPasswordResult && (
        <Card className="p-4 mb-6 border-gold/40 bg-gold/[0.06] flex items-center justify-between gap-4">
          <p className="text-sm text-ink">
            Password changed for <span className="font-mono font-medium">{editPasswordResult.id}</span>.
            New password: <span className="font-mono font-semibold">{editPasswordResult.password}</span>
            <br />
            <span className="text-ink/50">Write this down now, it won&apos;t be shown again.</span>
          </p>
          <button
            onClick={() => setEditPasswordResult(null)}
            className="text-ink/40 hover:text-ink transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </Card>
      )}

      {showAddForm && (
        <Card className="p-5 mb-6">
          <h2 className="font-display font-semibold text-ink mb-4">New student</h2>
          <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Student ID</label>
              <input
                name="id"
                required
                className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Full name</label>
              <input
                name="name"
                required
                className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Class</label>
              <select
                name="classId"
                required
                className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              >
                <option value="">Select a class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">
                Password <span className="text-ink/35">(optional — defaults to their ID)</span>
              </label>
              <input
                name="password"
                className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Photo (optional)</label>
              <input name="photo" type="file" accept="image/*" className="text-sm" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 pt-1">
              <Button type="submit">Save student</Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showBulkForm && (
        <Card className="p-5 mb-6">
          <h2 className="font-display font-semibold text-ink mb-1">Bulk upload students</h2>
          <p className="text-xs text-ink/50 mb-4">
            Columns: Student ID, Full Name, Class, Password (optional, defaults to their ID), and
            optionally Image (a filename, e.g. &ldquo;0136A.jpg&rdquo;).
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              setBulkSubmitting(true);
              try {
                const result = await api.bulkUploadStudents(formData);
                let msg = `${result.added} student(s) added`;
                if (result.skipped) msg += `, ${result.skipped} skipped`;
                if (result.imagesAttached) msg += `, ${result.imagesAttached} photo(s) attached`;
                showToast(msg + ".");
                if (result.unmatchedImages && result.unmatchedImages.length) {
                  showToast(
                    `These uploaded photos didn't match any row: ${result.unmatchedImages.join(", ")}`,
                    "error"
                  );
                }
                if (result.skipReasons && result.skipReasons.length) {
                  showToast(result.skipReasons.join(" · "), "error");
                }
                setBulkCredentials(result.credentials || []);
                form.reset();
                loadAll();
              } catch (err) {
                showToast(err instanceof ApiError ? err.message : "Bulk upload failed.", "error");
              } finally {
                setBulkSubmitting(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">
                Student sheet (CSV, TSV, or Excel)
              </label>
              <input type="file" name="csv" accept=".csv,.tsv,.txt,.xlsx,.xls" required className="text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">
                Photos for this batch (optional)
              </label>
              <input type="file" name="photos" accept="image/*" multiple className="text-sm w-full" />
              <p className="text-xs text-ink/45 mt-1">
                Each photo&apos;s filename must exactly match what you typed in the sheet&apos;s
                Image column.
              </p>
            </div>
            <Button type="submit" disabled={bulkSubmitting}>
              {bulkSubmitting ? "Uploading…" : "Upload"}
            </Button>
          </form>

          {bulkCredentials.length > 0 && (
            <div className="mt-5 border-t border-ink/[0.06] pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-ink">
                  Login details for {bulkCredentials.length} new student(s)
                </p>
                <button
                  onClick={() => setBulkCredentials([])}
                  className="text-ink/40 hover:text-ink transition-colors"
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-ink/50 mb-3">Write these down now, they won&apos;t be shown again.</p>
              <div className="max-h-56 overflow-y-auto space-y-1.5">
                {bulkCredentials.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs bg-gold/[0.06] border border-gold/20 rounded-[6px] px-3 py-2">
                    <span>
                      <span className="font-medium text-ink">{c.name}</span>{" "}
                      <span className="font-mono text-ink/40">({c.id})</span>
                    </span>
                    <span className="font-mono font-semibold text-ink">{c.password}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            className="w-full rounded-[8px] border border-ink/15 pl-9 pr-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBulkDownloadCards}
          disabled={generatingCards || filtered.length === 0}
        >
          <Package size={14} />
          {generatingCards
            ? "Generating…"
            : selectedInView.length > 0
            ? `ID Cards (${selectedInView.length} selected)`
            : `ID Cards (all ${filtered.length} shown)`}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowReceiptForm((v) => !v)}>
          <Receipt size={14} /> Bulk Receipts
        </Button>
        <Button variant="danger" size="sm" onClick={handleDeleteAll}>
          <Trash2 size={14} /> Delete all
        </Button>
      </div>

      {showReceiptForm && (
        <Card className="p-5 mb-6">
          <h2 className="font-display font-semibold text-ink mb-1">Bulk receipt generator</h2>
          <p className="text-xs text-ink/50 mb-4">
            Uses your checked selection below, or every student currently shown if nothing's
            checked. Everyone must be from the same class.
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Term</label>
              <input
                value={receiptTerm}
                onChange={(e) => setReceiptTerm(e.target.value)}
                placeholder="e.g. Second Term"
                className="rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Amount</label>
              <input
                value={receiptAmount}
                onChange={(e) => setReceiptAmount(e.target.value)}
                placeholder="e.g. NGN 15,000"
                className="rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>
            <Button
              onClick={handleGenerateReceipts}
              disabled={!receiptTerm || !receiptAmount || generatingReceipts}
            >
              {generatingReceipts ? "Generating…" : "Generate receipts"}
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 mb-6 border-clay/30 bg-clay/[0.04]">
          <p className="text-sm text-clay">{error}</p>
        </Card>
      )}

      <Card>
        <div className="px-5 py-4 border-b border-ink/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              disabled={filtered.length === 0}
              className="w-4 h-4 accent-indigo"
              aria-label="Select all shown"
            />
            <h2 className="font-display font-semibold text-ink">All students</h2>
          </div>
          <span className="font-mono text-xs text-ink/40">
            {filtered.length} of {students.length}
            {selectedInView.length > 0 ? ` · ${selectedInView.length} selected` : ""}
          </span>
        </div>
        <div className="divide-y divide-ink/[0.06]">
          {loading && <p className="px-5 py-8 text-sm text-ink/45 text-center">Loading…</p>}
          {!loading && filtered.length === 0 && (
            <p className="px-5 py-8 text-sm text-ink/45 text-center">
              {search ? "No students match your search." : "No students yet."}
            </p>
          )}
          {!loading &&
            filtered.map((s) => (
              <div key={s.id}>
                <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                      className="w-4 h-4 accent-indigo shrink-0"
                      aria-label={`Select ${s.name}`}
                    />
                    <div className="w-9 h-9 rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center shrink-0 overflow-hidden">
                      {s.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveMediaUrl(s.photo)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <GraduationCap size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink truncate">{s.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs text-ink/40">{s.id}</span>
                        <Badge tone="neutral">{s.className}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingId((cur) => (cur === s.id ? null : s.id))}
                    >
                      <Pencil size={14} /> Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleDownloadCard(s.id)}>
                      <CreditCard size={14} /> ID Card
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(s.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {editingId === s.id && (
                  <form
                    onSubmit={(e) => handleUpdateStudent(e, s.id)}
                    className="px-5 pb-4 pt-1 bg-ink/[0.015] grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-ink/60 mb-1.5">
                        Student ID
                      </label>
                      <input
                        name="newId"
                        defaultValue={s.id}
                        className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink/60 mb-1.5">Full name</label>
                      <input
                        name="name"
                        defaultValue={s.name}
                        required
                        className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink/60 mb-1.5">Class</label>
                      <select
                        name="classId"
                        defaultValue={s.classId}
                        className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink/60 mb-1.5">
                        New password <span className="text-ink/35">(leave blank to keep it unchanged)</span>
                      </label>
                      <input
                        name="password"
                        className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-ink/60 mb-1.5">
                        Replace photo <span className="text-ink/35">(optional)</span>
                      </label>
                      <input name="photo" type="file" accept="image/*" className="text-sm" />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                      <Button type="submit" disabled={savingEdit}>
                        {savingEdit ? "Saving…" : "Save changes"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
