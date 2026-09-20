"use client";

import { useEffect, useMemo, useState } from "react";
import { getSubject } from "@/lib/subjects";
import type { TermEntry } from "@/lib/subjects/types";
import {
  fetchRemoteProgress,
  gradeAnswer,
  initSubjectState,
  loadLocalProgress,
  mergeRemoteIntoLocal,
  pickTopicSafe,
  resetAllProgress,
  resetRemoteSubjectProgress,
  resetRemoteTopicProgress,
  resetTopicProgress,
  saveLocalProgress,
  upsertTopicProgress,
  type SubjectState,
} from "@/lib/drill/progress";
import { createClient } from "@/lib/supabase/client";

const BOX_LABELS = ["", "1", "2", "3", "4", "5"];
type QuizMode = "mc" | "id";

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TermQuiz({ subjectId }: { subjectId: string }) {
  const subject = useMemo(() => getSubject(subjectId), [subjectId]);
  const terms = useMemo(() => subject?.terms ?? [], [subject]);
  const termIds = useMemo(() => terms.map((t) => t.id), [terms]);

  const [quizMode, setQuizMode] = useState<QuizMode>("mc");
  const [state, setState] = useState<SubjectState | null>(null);
  const [current, setCurrent] = useState<TermEntry | null>(null);
  const [choices, setChoices] = useState<TermEntry[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [supabase] = useState(() => createClient());
  const [attempt, setAttempt] = useState(0);

  const buildRound = (term: TermEntry, mode: QuizMode) => {
    if (mode === "mc") {
      const distractors = shuffled(terms.filter((t) => t.id !== term.id)).slice(0, 3);
      setChoices(shuffled([term, ...distractors]));
    }
    setPicked(null);
    setAnswer("");
    setFeedback(null);
  };

  useEffect(() => {
    if (!subject || terms.length === 0) return;
    // localStorage/auth aren't available during SSR, so this whole block has
    // to run and sync state on mount rather than via useState initializers.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadError(false);

    try {
      const local = loadLocalProgress(subject);
      setState(local);
      const termId = pickTopicSafe(termIds, local.topics, local.last);
      const term = terms.find((t) => t.id === termId);
      if (!term) throw new Error("no terms available");
      setCurrent(term);
      buildRound(term, quizMode);
    } catch {
      setLoadError(true);
      return;
    }

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id ?? null;
        setUserId(uid);
        if (!uid) return;
        const remoteTopics = await fetchRemoteProgress(supabase, uid, subject.id);
        if (remoteTopics && Object.keys(remoteTopics).length > 0) {
          setState((prev) => {
            const merged = mergeRemoteIntoLocal(prev ?? initSubjectState(subject), remoteTopics);
            saveLocalProgress(subject.id, merged);
            return merged;
          });
        }
      } catch {
        // Auth/remote sync is best-effort; local state already loaded above.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.id, attempt]);

  if (!subject || terms.length === 0) {
    return <div className="p-8 text-center text-pf-icon">No flashcards for this subject.</div>;
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center text-pf-icon">
        <p>Something went wrong loading the flashcards.</p>
        <button
          onClick={() => setAttempt((n) => n + 1)}
          className="rounded-full border border-pf-border px-5 py-2 font-medium text-pf-text transition-colors hover:border-pf-primary hover:text-pf-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!state || !current) {
    return <div className="p-8 text-center text-pf-icon">Loading flashcards…</div>;
  }

  const nextCard = (state2: SubjectState, mode: QuizMode = quizMode) => {
    const termId = pickTopicSafe(termIds, state2.topics, state2.last);
    const term = terms.find((t) => t.id === termId) ?? null;
    setCurrent(term);
    if (term) buildRound(term, mode);
  };

  const gradeAndAdvance = (userAnswer: string) => {
    if (feedback || !current || !state) return;
    const { state: next, correct } = gradeAnswer(state, current.id, userAnswer, current.term, "text");
    setState(next);
    setFeedback(correct ? "correct" : "wrong");
    saveLocalProgress(subject.id, next);
    if (userId) {
      upsertTopicProgress(supabase, userId, subject.id, current.id, next.topics[current.id]);
    }
  };

  const pickChoice = (choice: TermEntry) => {
    if (feedback) return;
    setPicked(choice.id);
    gradeAndAdvance(choice.term);
  };

  const submitId = () => gradeAndAdvance(answer);

  const next = () => state && nextCard(state);

  const switchMode = (m: QuizMode) => {
    setQuizMode(m);
    if (current) buildRound(current, m);
  };

  const resetTerm = (termId: string) => {
    if (!confirm("Reset progress for this term?")) return;
    const updated = resetTopicProgress(state, termId);
    setState(updated);
    saveLocalProgress(subject.id, updated);
    if (userId) resetRemoteTopicProgress(supabase, userId, subject.id, termId);
    if (current?.id === termId) nextCard(updated);
  };

  const resetAll = () => {
    if (!confirm("Reset ALL flashcard progress for this subject? This can't be undone.")) return;
    const fresh = resetAllProgress(subject);
    setState(fresh);
    saveLocalProgress(subject.id, fresh);
    if (userId) resetRemoteSubjectProgress(supabase, userId, subject.id);
    nextCard(fresh);
  };

  const mastered = terms.filter((t) => (state.topics[t.id]?.box ?? 1) >= 5).length;
  const attempted = terms.reduce((a, t) => a + (state.topics[t.id]?.seen ?? 0), 0);
  const correctCount = terms.reduce((a, t) => a + (state.topics[t.id]?.ok ?? 0), 0);
  const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <div className="rounded-3xl border border-pf-border bg-pf-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1.5 rounded-full bg-pf-surface-soft p-1">
            <button
              onClick={() => switchMode("mc")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                quizMode === "mc" ? "bg-pf-primary text-white" : "text-pf-icon hover:text-pf-text"
              }`}
            >
              Multiple choice
            </button>
            <button
              onClick={() => switchMode("id")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                quizMode === "id" ? "bg-pf-primary text-white" : "text-pf-icon hover:text-pf-text"
              }`}
            >
              Identification
            </button>
          </div>
          <span className="text-xs text-pf-icon">Box {state.topics[current.id]?.box ?? 1}/5</span>
        </div>

        <p className="mb-1 text-xs font-medium text-pf-secondary">
          {current.week ? `Week ${current.week}` : ""}
        </p>
        <p className="mb-5 text-lg leading-relaxed text-pf-text">{current.def}</p>

        {quizMode === "mc" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {choices.map((c) => {
              const isPicked = picked === c.id;
              const isRight = c.id === current.id;
              const showState = !!feedback;
              return (
                <button
                  key={c.id}
                  onClick={() => pickChoice(c)}
                  disabled={!!feedback}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    showState && isRight
                      ? "border-pf-success bg-pf-success/10 text-pf-success"
                      : showState && isPicked && !isRight
                        ? "border-pf-danger bg-pf-danger/10 text-pf-danger"
                        : "border-pf-border text-pf-text hover:border-pf-primary"
                  } disabled:cursor-default`}
                >
                  {c.term}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitId()}
              disabled={!!feedback}
              placeholder="Type the term…"
              className="flex-1 rounded-full border border-pf-border bg-pf-input px-4 py-2.5 text-pf-text outline-none placeholder:text-pf-icon focus:border-pf-primary disabled:opacity-60"
            />
            <button
              onClick={submitId}
              disabled={!!feedback}
              className="rounded-full bg-pf-primary px-5 py-2 font-medium text-white transition-colors hover:bg-pf-primary-dark disabled:opacity-40"
            >
              Check
            </button>
          </div>
        )}

        {feedback && (
          <p className={`mt-4 text-sm font-medium ${feedback === "correct" ? "text-pf-success" : "text-pf-danger"}`}>
            {feedback === "correct" ? "Correct!" : `Not quite. Answer: ${current.term}`}
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={next}
            className="rounded-full border border-pf-border px-5 py-2 font-medium text-pf-text transition-colors hover:border-pf-primary hover:text-pf-primary"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-pf-border bg-pf-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-pf-text">Mastery</h2>
          <button onClick={resetAll} className="text-xs font-medium text-pf-danger hover:underline">
            Reset all progress
          </button>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Mastered" value={`${mastered}/${terms.length}`} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Attempted" value={String(attempted)} />
          <Stat label="Correct" value={String(correctCount)} />
        </div>
        <div className="flex flex-col divide-y divide-pf-border">
          {terms.map((t) => {
            const box = state.topics[t.id]?.box ?? 1;
            return (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate text-sm text-pf-text">{t.term}</span>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex gap-1" title={`Box ${BOX_LABELS[box]}/5`}>
                    {[1, 2, 3, 4, 5].map((k) => (
                      <span
                        key={k}
                        className={`h-2 w-2 rounded-full ${
                          k <= box ? (box >= 5 ? "bg-pf-success" : "bg-pf-primary") : "bg-pf-border"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => resetTerm(t.id)}
                    className="text-xs text-pf-icon hover:text-pf-danger hover:underline"
                  >
                    Reset
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {!userId && (
          <p className="mt-5 text-xs text-pf-icon">
            Progress is saved on this device only.{" "}
            <a href="/signup" className="font-medium text-pf-primary underline">
              Create an account
            </a>{" "}
            to sync across devices.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-pf-surface-soft px-3 py-2.5">
      <div className="text-lg font-bold text-pf-text">{value}</div>
      <div className="mt-0.5 text-[11px] text-pf-icon">{label}</div>
    </div>
  );
}
