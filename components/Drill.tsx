"use client";

import { useEffect, useMemo, useState } from "react";
import { getSubject } from "@/lib/subjects";
import type { Problem, Topic } from "@/lib/subjects/types";
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

export default function Drill({ subjectId }: { subjectId: string }) {
  const subject = useMemo(() => getSubject(subjectId), [subjectId]);
  // Only checkable topics drill here — "reveal"-mode term recall lives in TermQuiz instead.
  const topics = useMemo<Topic[]>(() => subject?.topics.filter((t) => t.mode !== "reveal") ?? [], [subject]);
  const topicIds = useMemo(() => topics.map((t) => t.id), [topics]);

  const [state, setState] = useState<SubjectState | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [supabase] = useState(() => createClient());
  const [attempt, setAttempt] = useState(0);

  // Init state + pull remote progress on mount. Wrapped defensively: any
  // failure here used to leave the "Loading drill…" placeholder stuck
  // forever with no way out, which is the bug this guards against.
  useEffect(() => {
    if (!subject) return;
    // localStorage/auth aren't available during SSR, so this whole block has
    // to run and sync state on mount rather than via useState initializers.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadError(false);

    try {
      const local = loadLocalProgress(subject);
      setState(local);

      const topicId = pickTopicSafe(topicIds, local.topics, local.last);
      const topic = topics.find((t) => t.id === topicId);
      if (!topic) throw new Error("no topics available");
      setProblem(topic.generate());
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
        // Auth/remote sync is best-effort; local drill state already loaded above.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.id, attempt]);

  if (!subject) {
    return <div className="p-8 text-center text-pf-icon">Unknown subject.</div>;
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center text-pf-icon">
        <p>Something went wrong loading this drill.</p>
        <button
          onClick={() => setAttempt((n) => n + 1)}
          className="rounded-full border border-pf-border px-5 py-2 font-medium text-pf-text transition-colors hover:border-pf-primary hover:text-pf-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!state || !problem) {
    return <div className="p-8 text-center text-pf-icon">Loading drill…</div>;
  }

  const nextProblem = (state2: SubjectState) => {
    const topicId = pickTopicSafe(topicIds, state2.topics, state2.last);
    const topic = topics.find((t) => t.id === topicId);
    setProblem(topic ? topic.generate() : null);
    setAnswer("");
    setShowHint(false);
    setShowSol(false);
    setFeedback(null);
  };

  const check = () => {
    if (feedback) return; // already graded, waiting for Next
    const { state: next, correct } = gradeAnswer(state, problem.id, answer, problem.ans, problem.unit);
    setState(next);
    setFeedback(correct ? "correct" : "wrong");
    setShowSol(true);
    saveLocalProgress(subject.id, next);
    if (userId) {
      upsertTopicProgress(supabase, userId, subject.id, problem.id, next.topics[problem.id]);
    }
  };

  const skip = () => {
    // "I'm stuck" — reveal the solution without grading as wrong yet; user can hit Next after.
    setShowSol(true);
    setShowHint(true);
  };

  const next = () => nextProblem(state);

  const resetTopic = (topicId: string) => {
    if (!confirm("Reset progress for this topic?")) return;
    const updated = resetTopicProgress(state, topicId);
    setState(updated);
    saveLocalProgress(subject.id, updated);
    if (userId) resetRemoteTopicProgress(supabase, userId, subject.id, topicId);
    if (problem?.id === topicId) nextProblem(updated);
  };

  const resetAll = () => {
    if (!confirm("Reset ALL progress for this drill? This can't be undone.")) return;
    const fresh = resetAllProgress(subject);
    setState(fresh);
    saveLocalProgress(subject.id, fresh);
    if (userId) resetRemoteSubjectProgress(supabase, userId, subject.id);
    nextProblem(fresh);
  };

  const mastered = topics.filter((t) => (state.topics[t.id]?.box ?? 1) >= 5).length;
  const attempted = topics.reduce((a, t) => a + (state.topics[t.id]?.seen ?? 0), 0);
  const correctCount = topics.reduce((a, t) => a + (state.topics[t.id]?.ok ?? 0), 0);
  const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <div className="rounded-3xl border border-pf-border bg-pf-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-pf-secondary-soft px-3 py-1 text-xs font-medium text-pf-secondary">
            {topics.find((t) => t.id === problem.id)?.name ?? problem.id}
          </span>
          <span className="text-xs text-pf-icon">
            Box {state.topics[problem.id]?.box ?? 1}/5
          </span>
        </div>

        <p
          className="mb-4 text-lg leading-relaxed text-pf-text [&_b]:font-semibold"
          dangerouslySetInnerHTML={{ __html: problem.prompt }}
        />

        <div className="flex items-center gap-2">
          <input
            type={problem.unit === "text" ? "text" : "number"}
            step="any"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Your answer"
            className="flex-1 rounded-full border border-pf-border bg-pf-input px-4 py-2.5 text-pf-text outline-none placeholder:text-pf-icon focus:border-pf-primary"
          />
          {problem.unit === "percent" && <span className="text-pf-icon">%</span>}
        </div>

        {feedback && (
          <p
            className={`mt-3 text-sm font-medium ${
              feedback === "correct" ? "text-pf-success" : "text-pf-danger"
            }`}
          >
            {feedback === "correct" ? "Correct!" : `Not quite. Answer: ${problem.ans}`}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            onClick={check}
            disabled={!!feedback}
            className="rounded-full bg-pf-primary px-5 py-2 font-medium text-white transition-colors hover:bg-pf-primary-dark disabled:opacity-40"
          >
            Check
          </button>
          <button
            onClick={skip}
            className="rounded-full border border-pf-border px-5 py-2 font-medium text-pf-text transition-colors hover:border-pf-primary hover:text-pf-primary"
          >
            I&apos;m stuck
          </button>
          <button
            onClick={() => setShowHint((v) => !v)}
            className="rounded-full border border-pf-border px-5 py-2 font-medium text-pf-text transition-colors hover:border-pf-primary hover:text-pf-primary"
          >
            Hint
          </button>
          <button
            onClick={next}
            className="ml-auto rounded-full border border-pf-border px-5 py-2 font-medium text-pf-text transition-colors hover:border-pf-primary hover:text-pf-primary"
          >
            Next →
          </button>
        </div>

        {showHint && (
          <p className="mt-3 rounded-2xl bg-pf-primary-soft p-3 text-sm text-pf-primary-dark">
            {problem.hint}
          </p>
        )}

        {showSol && (
          <pre
            className="mt-3 overflow-x-auto rounded-2xl bg-pf-surface-soft p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-pf-icon [&_.k]:font-bold [&_.k]:text-pf-text"
            dangerouslySetInnerHTML={{ __html: problem.sol }}
          />
        )}
      </div>

      <div className="rounded-3xl border border-pf-border bg-pf-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-pf-text">Mastery</h2>
          <button onClick={resetAll} className="text-xs font-medium text-pf-danger hover:underline">
            Reset all progress
          </button>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Mastered" value={`${mastered}/${topics.length}`} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Streak" value={String(state.stats.streak)} />
          <Stat label="Best streak" value={String(state.stats.best)} />
        </div>
        <div className="flex flex-col divide-y divide-pf-border">
          {topics.map((t) => {
            const box = state.topics[t.id]?.box ?? 1;
            return (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate text-sm text-pf-text">{t.name}</span>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex gap-1" title={`Box ${BOX_LABELS[box]}/5`}>
                    {[1, 2, 3, 4, 5].map((k) => (
                      <span
                        key={k}
                        className={`h-2 w-2 rounded-full ${
                          k <= box
                            ? box >= 5
                              ? "bg-pf-success"
                              : "bg-pf-primary"
                            : "bg-pf-border"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => resetTopic(t.id)}
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
