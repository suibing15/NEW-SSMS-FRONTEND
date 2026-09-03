"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export function PortalGuide({
  title,
  steps,
}: {
  title: string;
  steps: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="mt-4 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-ink/[0.02] transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
          <HelpCircle size={16} className="text-indigo" />
          How to use {title}
        </span>
        {open ? (
          <ChevronUp size={16} className="text-ink/40" />
        ) : (
          <ChevronDown size={16} className="text-ink/40" />
        )}
      </button>

      {open && (
        <ol className="px-5 pb-5 pt-1 space-y-2 animate-rise-in">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink/70">
              <span className="font-mono text-xs text-indigo font-semibold shrink-0 mt-0.5">
                {i + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
