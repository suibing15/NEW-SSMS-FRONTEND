"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { api, ApiError, API_BASE, Question } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FloatingCalculator } from "@/components/floating-calculator";

type Phase = "instructions" | "running" | "submitted" | "blocked";

export default function TakeExamPage({
  params,
}: {
  params: { classId: string; studentId: string; subjectId: string; type: string };
}) {
  const { classId, studentId, subjectId, type } = params;

  const [phase, setPhase] = useState<Phase>("instructions");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [unansweredQids, setUnansweredQids] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number } | null>(
    null
  );
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    api
      .examQuestions(classId, subjectId, type)
      .then((r) => {
        if (r.error) {
          setLoadError(r.error);
        } else {
          setQuestions(r.items);
          setDurationMinutes(r.duration);
          setSecondsLeft(r.duration * 60);
        }
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Couldn't load questions."))
      .finally(() => setLoading(false));
  }, [classId, subjectId, type]);

  // Warn on tab close / refresh mid-exam. This is the strongest thing
  // a browser actually allows here — every browser deliberately
  // refuses to let any website fully block a refresh or close, that's
  // a safety rule protecting people from "you can never leave" pages,
  // no code can override it. This shows the browser's own native
  // confirmation prompt instead.
  useEffect(() => {
    if (phase !== "running") return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  // The back button, unlike refresh, genuinely can be trapped: push a
  // placeholder history entry, and every time "back" is pressed during
  // the exam, immediately push right back onto it — the student never
  // actually leaves this page, and sees a clear warning each time.
  const [showBackWarning, setShowBackWarning] = useState(false);
  useEffect(() => {
    if (phase !== "running") return;

    window.history.pushState(null, "", window.location.href);
    function handlePopState() {
      window.history.pushState(null, "", window.location.href);
      setShowBackWarning(true);
      setTimeout(() => setShowBackWarning(false), 3000);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [phase]);

  function startExam() {
    setPhase("running");
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Time's up — submit whatever's answered. A hard deadline
          // has to actually be a deadline; the "don't allow incomplete
          // submission" rule below applies to a student manually
          // clicking Submit, not to running out of time.
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function selectAnswer(qid: string, option: string) {
    setAnswers((prev) => ({ ...prev, [qid]: option }));
    setUnansweredQids((prev) => prev.filter((id) => id !== qid));
  }

  async function handleSubmit(fromTimeout = false) {
    if (!fromTimeout) {
      const missing = questions.filter((q) => !answers[q.qid]).map((q) => q.qid);
      if (missing.length > 0) {
        setUnansweredQids(missing);
        const firstQid = missing[0];
        questionRefs.current[firstQid]?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await api.submitExam(studentId, classId, subjectId, type, answers);
      setResult({ score: res.score, total: res.total, percentage: res.percentage });
      setPhase("submitted");
    } catch (err) {
      setBlockedMessage(
        err instanceof ApiError ? err.message : "Something went wrong while submitting."
      );
      setPhase("blocked");
    } finally {
      setSubmitting(false);
    }
  }

  const answeredCount = questions.filter((q) => answers[q.qid]).length;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const lowTime = secondsLeft <= 60;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-parchment">
        <p className="text-sm text-ink/45">Loading…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
        <Card className="p-8 max-w-sm text-center border-clay/30 bg-clay/[0.04]">
          <AlertTriangle size={28} className="mx-auto text-clay mb-3" />
          <p className="text-sm text-clay">{loadError}</p>
          <Link
            href={`/exam/classes/${encodeURIComponent(classId)}/${encodeURIComponent(studentId)}`}
            className="mt-4 inline-block text-sm text-indigo hover:text-gold-dark transition-colors"
          >
            ← Back to subject selection
          </Link>
        </Card>
      </main>
    );
  }

  if (phase === "blocked") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
        <Card className="p-8 max-w-sm text-center border-clay/30 bg-clay/[0.04]">
          <AlertTriangle size={28} className="mx-auto text-clay mb-3" />
          <p className="text-sm text-clay">{blockedMessage}</p>
          <Link
            href={`/exam/classes/${encodeURIComponent(classId)}/${encodeURIComponent(studentId)}`}
            className="mt-4 inline-block text-sm text-indigo hover:text-gold-dark transition-colors"
          >
            ← Back to subject selection
          </Link>
        </Card>
      </main>
    );
  }

  if (phase === "submitted" && result) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
        <Card className="p-10 max-w-sm text-center border-sage/30 bg-sage/[0.05] animate-rise-in">
          <CheckCircle2 size={36} className="mx-auto text-sage mb-4" />
          <p className="font-display text-xl font-semibold text-ink">Submitted successfully</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-ink">
            {result.score}/{result.total}
          </p>
          <p className="text-sm text-ink/55 mt-1">{result.percentage}%</p>
          <Link
            href={`/exam/classes/${encodeURIComponent(classId)}/${encodeURIComponent(studentId)}`}
            className="mt-6 inline-block text-sm font-medium text-indigo hover:text-gold-dark transition-colors"
          >
            ← Back to subject selection
          </Link>
        </Card>
      </main>
    );
  }

  if (phase === "instructions") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
        <Card className="p-8 max-w-md animate-rise-in">
          <h1 className="font-display text-xl font-semibold text-ink">
            {type.toUpperCase()} — Instructions
          </h1>
          <ul className="mt-4 space-y-2 text-sm text-ink/70 list-disc pl-5">
            <li>You have {durationMinutes} minute{durationMinutes === 1 ? "" : "s"} to complete this.</li>
            <li>Every question must be answered before you can submit.</li>
            <li>If time runs out, whatever you&apos;ve answered so far is submitted automatically.</li>
            <li>Read each question carefully before choosing your answer.</li>
            <li>Once submitted, answers cannot be changed.</li>
          </ul>
          <Button onClick={startExam} size="lg" className="w-full mt-6">
            Start {type.toUpperCase()}
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-parchment pb-24">
      {/* Shown briefly whenever the back button is pressed mid-exam */}
      {showBackWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-clay text-parchment px-6 py-3 text-center text-sm font-medium shadow-lift animate-rise-in">
          <AlertTriangle size={15} className="inline mr-1.5 -mt-0.5" />
          You can&apos;t leave this page while the exam is in progress. Submit your answers to continue.
        </div>
      )}

      {/* Sticky header: timer + progress, always visible */}
      <div className="sticky top-0 z-30 bg-indigo text-parchment shadow-md">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-parchment/60">
            {subjectId} · {type.toUpperCase()}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-sm font-semibold ${
              lowTime ? "text-gold animate-pulse" : ""
            }`}
          >
            <Clock size={15} />
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 mt-6">
        <Card className="p-4 mb-6 flex items-center justify-between">
          <span className="text-sm text-ink/60">
            Answered: <span className="font-semibold text-ink">{answeredCount}</span> / {questions.length}
          </span>
          <div className="w-32 h-2 rounded-full bg-ink/[0.08] overflow-hidden">
            <div
              className="h-full bg-sage transition-all duration-300"
              style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {unansweredQids.length > 0 && (
          <Card className="p-4 mb-6 border-clay/40 bg-clay/[0.06] flex items-start gap-3">
            <AlertTriangle size={18} className="text-clay shrink-0 mt-0.5" />
            <p className="text-sm text-clay">
              You have {unansweredQids.length} unanswered question
              {unansweredQids.length === 1 ? "" : "s"}. Every question must be answered before you
              can submit — they&apos;re highlighted below.
            </p>
          </Card>
        )}

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isFlagged = unansweredQids.includes(q.qid);
            return (
              <Card
                key={q.qid}
                ref={(el) => {
                  questionRefs.current[q.qid] = el;
                }}
                className={`p-5 transition-colors ${
                  isFlagged ? "border-clay ring-2 ring-clay/20" : ""
                }`}
              >
                <p className="text-sm font-medium text-ink">
                  <span className="font-mono text-ink/40 mr-1.5">{idx + 1}.</span>
                  {q.text}
                </p>
                {q.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_BASE}${q.image}`}
                    alt=""
                    className="mt-3 max-w-full rounded-[8px] border border-ink/[0.08]"
                  />
                )}
                <div className="mt-3 space-y-2">
                  {(q.options || []).map((opt, i) => {
                    const selected = answers[q.qid] === opt;
                    return (
                      <button
                        key={i}
                        onClick={() => selectAnswer(q.qid, opt)}
                        className={`w-full text-left px-4 py-2.5 rounded-[8px] border text-sm transition-colors ${
                          selected
                            ? "bg-indigo/[0.08] border-indigo text-ink font-medium"
                            : "bg-white border-ink/[0.1] text-ink/75 hover:border-indigo/30"
                        }`}
                      >
                        <span className="font-mono text-xs text-ink/40 mr-2">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        <Button
          onClick={() => handleSubmit(false)}
          size="lg"
          className="w-full mt-8"
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Submit Answers"}
        </Button>
      </div>

      <FloatingCalculator />
    </main>
  );
}
