"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { Users, Search, Trash2, CreditCard, Plus, X, Ban, CheckCircle2, Lock, Unlock, Package } from "lucide-react";
import { api, ApiError, Teacher, downloadBlob } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-url";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export default function TeachersPage() {
  const { showToast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [justCreated, setJustCreated] = useState<{ id: string; password: string } | null>(null);
  const [generatingCards, setGeneratingCards] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const { teachers: t } = await api.adminTeachers();
      setTeachers(t);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Your admin session isn't active. Please log in again."
          : "Couldn't load teachers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
    );
  }, [teachers, search]);

  const selectedInView = useMemo(
    () => filtered.filter((t) => selected.has(t.id)),
    [filtered, selected]
  );
  const allVisibleSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));

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
        filtered.forEach((t) => next.delete(t.id));
      } else {
        filtered.forEach((t) => next.add(t.id));
      }
      return next;
    });
  }

  async function handleAddTeacher(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await api.addTeacher(formData);
      if (result.generatedPassword) {
        setJustCreated({ id: String(formData.get("id")), password: result.generatedPassword });
      }
      form.reset();
      setShowAddForm(false);
      showToast("Teacher added successfully.");
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to add teacher.", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Delete teacher ${id}? This cannot be undone.`)) return;
    try {
      await api.deleteTeacher(id);
      showToast(`Teacher ${id} deleted successfully.`);
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete teacher.", "error");
    }
  }

  async function handleDeleteAll() {
    if (!confirm("This deletes EVERY teacher in the school. This cannot be undone. Continue?")) return;
    if (!confirm("Are you absolutely sure? Click OK only if you really want to delete all staff now."))
      return;
    try {
      const { deleted } = await api.deleteAllTeachers();
      showToast(`Deleted ${deleted} teachers successfully.`);
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete all teachers.", "error");
    }
  }

  async function handleDownloadCard(id: string) {
    try {
      const blob = await api.teacherIdCard(id);
      downloadBlob(blob, `teacher_${id}_idcard.pdf`);
      showToast("ID card generated successfully.");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to generate ID card.", "error");
    }
  }

  async function handleToggleBlock(t: Teacher) {
    const action = t.blocked ? "unblock" : "block";
    if (!confirm(`${t.blocked ? "Unblock" : "Block"} ${t.name}?${!t.blocked ? " They won't be able to log in or mark attendance while blocked." : ""}`))
      return;
    try {
      const { blocked } = await api.toggleTeacherBlock(t.id);
      showToast(`${t.name} ${blocked ? "blocked" : "unblocked"} successfully.`);
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : `Failed to ${action} teacher.`, "error");
    }
  }

  async function handleBulkDownloadCards() {
    const targets = selectedInView.length > 0 ? selectedInView : filtered;
    if (targets.length === 0) return;
    if (
      !confirm(`Generate one combined PDF (several cards per page) for ${targets.length} teacher(s)?`)
    )
      return;

    setGeneratingCards(true);
    try {
      const blob = await api.bulkTeacherIdCards(targets.map((t) => t.id));
      downloadBlob(blob, "teacher_id_cards.pdf");
      showToast(`Generated a combined ID card sheet for ${targets.length} teacher(s).`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Bulk ID card generation failed.", "error");
    } finally {
      setGeneratingCards(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">Manage</p>
          <h1 className="font-display text-2xl font-semibold text-ink mt-1">Teachers</h1>
        </div>
        <Button onClick={() => setShowAddForm((v) => !v)}>
          <Plus size={16} /> Add Teacher
        </Button>
      </div>

      {justCreated && (
        <Card className="p-4 mb-6 border-gold/40 bg-gold/[0.06] flex items-center justify-between gap-4">
          <p className="text-sm text-ink">
            Teacher <span className="font-mono font-medium">{justCreated.id}</span> added. Login
            password: <span className="font-mono font-semibold">{justCreated.password}</span>
            <br />
            <span className="text-ink/50">Write this down now, it won&apos;t be shown again.</span>
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="secondary" onClick={() => handleDownloadCard(justCreated.id)}>
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

      {showAddForm && (
        <Card className="p-5 mb-6">
          <h2 className="font-display font-semibold text-ink mb-4">New teacher</h2>
          <form onSubmit={handleAddTeacher} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Teacher ID</label>
              <input
                name="id"
                required
                placeholder="e.g. ASLM/P/01"
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
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Password</label>
              <input
                name="password"
                required
                className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Photo (optional)</label>
              <input name="photo" type="file" accept="image/*" className="text-sm" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 pt-1">
              <Button type="submit">Save teacher</Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
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
        <Button variant="danger" size="sm" onClick={handleDeleteAll}>
          <Trash2 size={14} /> Delete all
        </Button>
      </div>

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
            <h2 className="font-display font-semibold text-ink">All teachers</h2>
          </div>
          <span className="font-mono text-xs text-ink/40">
            {filtered.length} of {teachers.length}
            {selectedInView.length > 0 ? ` · ${selectedInView.length} selected` : ""}
          </span>
        </div>
        <div className="divide-y divide-ink/[0.06]">
          {loading && <p className="px-5 py-8 text-sm text-ink/45 text-center">Loading…</p>}
          {!loading && filtered.length === 0 && (
            <p className="px-5 py-8 text-sm text-ink/45 text-center">
              {search ? "No teachers match your search." : "No teachers yet."}
            </p>
          )}
          {!loading &&
            filtered.map((t) => (
              <div key={t.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleOne(t.id)}
                    className="w-4 h-4 accent-indigo shrink-0"
                    aria-label={`Select ${t.name}`}
                  />
                  <div className="w-9 h-9 rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center shrink-0 overflow-hidden">
                    {t.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMediaUrl(t.photo)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-ink/40">{t.id}</span>
                      {t.blocked ? (
                        <Badge tone="danger">
                          <Ban size={11} /> Blocked
                        </Badge>
                      ) : (
                        <Badge tone="success">
                          <CheckCircle2 size={11} /> Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={t.blocked ? "secondary" : "ghost"}
                    onClick={() => handleToggleBlock(t)}
                    title={t.blocked ? "Unblock this teacher" : "Block this teacher from logging in or marking attendance"}
                  >
                    {t.blocked ? <Unlock size={14} /> : <Lock size={14} />}
                    {t.blocked ? "Unblock" : "Block"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDownloadCard(t.id)}>
                    <CreditCard size={14} /> ID Card
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(t.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
