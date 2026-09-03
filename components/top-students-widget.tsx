"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { api, ApiError, SchoolClass } from "@/lib/api";
import { Card } from "@/components/ui/card";

export function TopStudentsWidget({ classes }: { classes: SchoolClass[] }) {
  const [classId, setClassId] = useState(classes[0]?.id || "");
  const [top5, setTop5] = useState<{ studentId: string; name: string; avg: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    api
      .topStudents(classId)
      .then((r) => setTop5(r.top5))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load analytics."))
      .finally(() => setLoading(false));
  }, [classId]);

  if (classes.length === 0) return null;

  return (
    <Card className="mt-6">
      <div className="px-5 py-4 border-b border-ink/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-gold-dark" />
          <h2 className="font-display font-semibold text-ink">Top Students</h2>
        </div>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="rounded-[8px] border border-ink/15 px-2.5 py-1.5 text-xs focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="px-5 py-4">
        {loading && <p className="text-sm text-ink/45 text-center py-3">Loading…</p>}
        {error && <p className="text-sm text-clay">{error}</p>}
        {!loading && !error && top5.length === 0 && (
          <p className="text-sm text-ink/45 text-center py-3">No results recorded for this class yet.</p>
        )}
        {!loading && !error && top5.length > 0 && (
          <ol className="space-y-2">
            {top5.map((s, i) => (
              <li key={s.studentId} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      i === 0 ? "bg-gold text-indigo-dark" : "bg-ink/[0.06] text-ink/60"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-ink font-medium">{s.name}</span>
                </span>
                <span className="font-mono text-xs text-ink/50">{s.avg}% avg</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
