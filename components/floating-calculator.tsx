"use client";

import { useState } from "react";
import { Calculator, X, Delete } from "lucide-react";
import { safeEvaluate } from "@/lib/safe-calculator";

const BUTTONS = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"];

export function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState("");

  function press(val: string) {
    if (val === "=") {
      setDisplay(safeEvaluate(display));
    } else {
      setDisplay((prev) => (prev === "ERR" ? val : prev + val));
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-indigo text-parchment shadow-lift flex items-center justify-center hover:bg-indigo-light transition-colors"
        aria-label="Open calculator"
      >
        <Calculator size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-64 bg-white rounded-card border border-ink/[0.1] shadow-lift overflow-hidden animate-rise-in">
      <div className="flex items-center justify-between px-3 py-2 bg-indigo text-parchment">
        <span className="text-xs font-medium flex items-center gap-1.5">
          <Calculator size={13} /> Calculator
        </span>
        <button onClick={() => setOpen(false)} aria-label="Close calculator">
          <X size={15} />
        </button>
      </div>
      <div className="p-3">
        <div className="mb-2 flex items-center gap-2">
          <input
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
            className="flex-1 rounded-[6px] border border-ink/15 px-2.5 py-2 text-right font-mono text-sm"
            placeholder="0"
          />
          <button
            onClick={() => setDisplay((prev) => prev.slice(0, -1))}
            className="p-2 rounded-[6px] border border-ink/15 text-ink/50 hover:text-ink"
            aria-label="Backspace"
          >
            <Delete size={15} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {BUTTONS.map((b) => (
            <button
              key={b}
              onClick={() => press(b)}
              className={`py-2 rounded-[6px] text-sm font-medium transition-colors ${
                b === "="
                  ? "bg-gold text-indigo-dark hover:bg-gold-light col-span-1"
                  : "bg-ink/[0.04] text-ink hover:bg-ink/[0.08]"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDisplay("")}
          className="mt-1.5 w-full py-1.5 rounded-[6px] text-xs font-medium text-clay hover:bg-clay/[0.06] transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
