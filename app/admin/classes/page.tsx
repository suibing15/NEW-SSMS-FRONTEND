"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import { BookOpen, Plus, Trash2, Lock, Unlock, ChevronRight, GraduationCap } from "lucide-react";
import { api, ApiError, SchoolClass } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

type ClassWithCount = SchoolClass & { studentCount: number };

export default function ClassesPage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPromoteForm, setShowPromoteForm] = useState(false);
  const [promoteFrom, setPromoteFrom] = useState("");
  const [promoteTo, setPromoteTo] = useState("");
  const [promoting, setPromoting] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const { classes: cls } = await api.adminClasses();
      const withCounts = await Promise.all(
        cls.map(async (c) => {
          try {
            const { students } = await api.adminClassStudents(c.id);
            return { ...c, studentCount: students.length };
          } catch {
            return { ...c, studentCount: 0 };
          }
        })
      );
      setClasses(withCounts);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Your admin session isn't active. Please log in again."
          : "Couldn't load classes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddClass(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const id = String(formData.get("id") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const password = String(formData.get("password") || "").trim();

    try {
      await api.addClass(id, name, password || undefined);
      showToast(`Class "${name}" added successfully.`);
      form.reset();
      setShowAddForm(false);
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to add class.", "error");
    }
  }

  async function handleToggleLock(c: ClassWithCount) {
    try {
      const { locked } = await api.toggleClassLock(c.id, !c.locked);
      showToast(`${c.name} ${locked ? "locked" : "unlocked"} successfully.`);
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to update class.", "error");
    }
  }

  async function handleDelete(c: ClassWithCount) {
    const warning =
      c.studentCount > 0
        ? `Delete ${c.name}? This will also delete all ${c.studentCount} student(s) in this class. This cannot be undone.`
        : `Delete ${c.name}? This cannot be undone.`;
    if (!confirm(warning)) return;
    try {
      await api.deleteClass(c.id);
      showToast(`${c.name} deleted successfully.`);
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete class.", "error");
    }
  }

  async function handlePromote() {
    if (!promoteFrom || !promoteTo) return;
    const fromName = classes.find((c) => c.id === promoteFrom)?.name || promoteFrom;
    const toName = classes.find((c) => c.id === promoteTo)?.name || promoteTo;
    if (
      !confirm(
        `Promote every student in ${fromName} to ${toName}? Their results and report sheets stay with the class they came from, only their current class changes. This cannot be undone.`
      )
    )
      return;
    setPromoting(true);
    try {
      const { count } = await api.promoteStudents(promoteFrom, promoteTo);
      showToast(`Promoted ${count} student(s) from ${fromName} to ${toName} successfully.`);
      setShowPromoteForm(false);
      setPromoteFrom("");
      setPromoteTo("");
      loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to promote students.", "error");
    } finally {
      setPromoting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">Manage</p>
          <h1 className="font-display text-2xl font-semibold text-ink mt-1">Classes &amp; Subjects</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowPromoteForm((v) => !v)}>
            <GraduationCap size={16} /> Promote Students
          </Button>
          <Button onClick={() => setShowAddForm((v) => !v)}>
            <Plus size={16} /> Add Class
          </Button>
        </div>
      </div>

      {showPromoteForm && (
        <Card className="p-5 mb-6">
          <h2 className="font-display font-semibold text-ink mb-1">Promote students to next class</h2>
          <p className="text-xs text-ink/50 mb-4">
            Moves every student in one class into another. Their class changes only, their own
            personal results and report history stay attached to them.
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">From class</label>
              <select
                value={promoteFrom}
                onChange={(e) => setPromoteFrom(e.target.value)}
                className="rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              >
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentCount})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">To class</label>
              <select
                value={promoteTo}
                onChange={(e) => setPromoteTo(e.target.value)}
                className="rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              >
                <option value="">Select class…</option>
                {classes
                  .filter((c) => c.id !== promoteFrom)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <Button onClick={handlePromote} disabled={!promoteFrom || !promoteTo || promoting}>
              {promoting ? "Promoting…" : "Promote"}
            </Button>
          </div>
        </Card>
      )}

      {showAddForm && (
        <Card className="p-5 mb-6">
          <h2 className="font-display font-semibold text-ink mb-4">New class</h2>
          <form onSubmit={handleAddClass} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Class ID</label>
              <input
                name="id"
                required
                placeholder="e.g. JS1"
                className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">Class name</label>
              <input
                name="name"
                required
                placeholder="e.g. Junior Secondary 1"
                className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1.5">
                Password <span className="text-ink/35">(optional)</span>
              </label>
              <input
                name="password"
                className="w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
              />
            </div>
            <div className="sm:col-span-3 flex items-center gap-2 pt-1">
              <Button type="submit">Save class</Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && (
        <Card className="p-4 mb-6 border-clay/30 bg-clay/[0.04]">
          <p className="text-sm text-clay">{error}</p>
        </Card>
      )}

      <Card>
        <div className="px-5 py-4 border-b border-ink/[0.06] flex items-center justify-between">
          <h2 className="font-display font-semibold text-ink">All classes</h2>
          <span className="font-mono text-xs text-ink/40">{classes.length} total</span>
        </div>
        <div className="divide-y divide-ink/[0.06]">
          {loading && <p className="px-5 py-8 text-sm text-ink/45 text-center">Loading…</p>}
          {!loading && classes.length === 0 && (
            <p className="px-5 py-8 text-sm text-ink/45 text-center">
              No classes yet. Add one above to get started.
            </p>
          )}
          {!loading &&
            classes.map((c) => (
              <div key={c.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <Link
                  href={`/admin/classes/${encodeURIComponent(c.id)}`}
                  className="flex items-center gap-3 min-w-0 group"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate group-hover:text-indigo transition-colors">
                      {c.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-ink/40">{c.id}</span>
                      <span className="text-xs text-ink/40">
                        {c.studentCount} student{c.studentCount === 1 ? "" : "s"}
                      </span>
                      {c.locked && (
                        <Badge tone="warning">
                          <Lock size={11} /> Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant={c.locked ? "secondary" : "ghost"} onClick={() => handleToggleLock(c)}>
                    {c.locked ? <Unlock size={14} /> : <Lock size={14} />}
                    {c.locked ? "Unlock" : "Lock"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(c)}>
                    <Trash2 size={14} />
                  </Button>
                  <Link href={`/admin/classes/${encodeURIComponent(c.id)}`}>
                    <ChevronRight size={18} className="text-ink/30" />
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
