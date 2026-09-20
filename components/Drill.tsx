"use client";

import { useEffect, useMemo, useState } from "react";
import { getSubject } from "@/lib/subjects";
import type { Problem } from "@/lib/subjects/types";
import {
  fetchRemoteProgress,
  gradeAnswer,
  initSubjectState,
  loadLocalProgress,
  mergeRemoteIntoLocal,
  pickTopic,
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

function pickSafe(
  topicIds: string[],
  topics: SubjectState["topics"],
  last: string | null,
): string {
  try {
    const id = pickTopic(topicIds, topics, last);
    if (id && topics[id]) return id;
  } catch {
    // fall through to a safe default below
  }
  return topicIds.find((id) => topics[id]) ?? topicIds[0];
}

export default function Drill({ subjectId }: { subjectId: string }) {
  const subject = useMemo(() => getSubject(subjectId), [subjectId]);
  const topicIds = useMemo(() => subject?.topics.map((t) => t.id) ?? [], [subject]);

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

      const topicId = pickSafe(topicIds, local.topics, local.last);
      const topic = subject.topics.find((t) => t.id === topicId);
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
    return <div className="p-8 text-center text-mv-dim">Unknown subject.</div>;
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center text-mv-dim">
        <p>Something went wrong loading this drill.</p>
        <button
          onClick={() => setAttempt((n) => n + 1)}
          className="border border-mv-border px-4 py-2 font-ui text-[11px] tracking-[0.16em] text-mv-white uppercase transition-colors hover:border-mv-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!state || !problem) {
    return <div className="p-8 text-center text-mv-dim">Loading drill…</div>;
  }

  const nextProblem = (state2: SubjectState) => {
    const topicId = pickSafe(topicIds, state2.topics, state2.last);
    const topic = subject.topics.find((t) => t.id === topicId);
    setProblem(topic ? topic.generate() : null);
    setAnswer("");
    setShowHint(false);
    setShowSol(false);
    setFeedback(null);
  };

  const check = () => {
    if (feedback) return; // already graded, waiting for Next
    const user = parseFloat(answer);
    const { state: next, correct } = gradeAnswer(state, problem.id, user, problem.ans, problem.unit);
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
    if (!confirm("Reset ALL progress for this subject? This can't be undone.")) return;
    const fresh = resetAllProgress(subject);
    setState(fresh);
    saveLocalProgress(subject.id, fresh);
    if (userId) resetRemoteSubjectProgress(supabase, userId, subject.id);
    nextProblem(fresh);
  };

  const mastered = Object.values(state.topics).filter((t) => t.box >= 5).length;
  const accuracy = state.stats.done > 0 ? Math.round((state.stats.correct / state.stats.done) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <div className="border border-mv-border bg-mv-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="border border-mv-blue-glow px-3 py-1 font-ui text-[10px] tracking-[0.2em] text-mv-blue uppercase">
            {subject.topics.find((t) => t.id === problem.id)?.name ?? problem.id}
          </span>
          <span className="font-ui text-[11px] text-mv-dim">
            Box {state.topics[problem.id]?.box ?? 1}/5
          </span>
        </div>

        <p
          className="mb-4 text-lg leading-relaxed text-mv-white [&_b]:font-semibold"
          dangerouslySetInnerHTML={{ __html: problem.prompt }}
        />

        <div className="flex items-center gap-2">
          <input
            type="number"
            step="any"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Your answer"
            className="flex-1 border border-mv-border bg-mv-black px-3 py-2.5 text-mv-white outline-none placeholder:text-mv-dim focus:border-mv-blue"
          />
          {problem.unit === "percent" && <span className="text-mv-dim">%</span>}
        </div>

        {feedback && (
          <p
            className={`mt-3 text-sm font-medium ${
              feedback === "correct" ? "text-mv-success" : "text-mv-danger"
            }`}
          >
            {feedback === "correct" ? "Correct!" : `Not quite. Answer: ${problem.ans}`}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={check}
            disabled={!!feedback}
            className="border border-mv-white bg-mv-white px-4 py-2 font-ui text-[11px] tracking-[0.16em] text-mv-black uppercase transition-colors hover:border-mv-blue hover:bg-mv-blue hover:text-mv-white disabled:opacity-40"
          >
            Check
          </button>
          <button
            onClick={() => setShowHint((v) => !v)}
            className="border border-mv-border px-4 py-2 font-ui text-[11px] tracking-[0.16em] text-mv-white uppercase transition-colors hover:border-mv-white"
          >
            Hint
          </button>
          <button
            onClick={skip}
            className="border border-mv-border px-4 py-2 font-ui text-[11px] tracking-[0.16em] text-mv-white uppercase transition-colors hover:border-mv-white"
          >
            I&apos;m stuck
          </button>
          <button
            onClick={next}
            className="ml-auto border border-mv-border px-4 py-2 font-ui text-[11px] tracking-[0.16em] text-mv-white uppercase transition-colors hover:border-mv-white"
          >
            Next →
          </button>
        </div>

        {showHint && (
          <p className="mt-3 border border-mv-warning/30 bg-mv-warning/10 p-3 text-sm text-mv-warning">
            {problem.hint}
          </p>
        )}

        {showSol && (
          <pre
            className="mt-3 overflow-x-auto border border-mv-border bg-mv-black p-3 font-ui text-xs leading-relaxed whitespace-pre-wrap text-mv-text [&_.k]:font-bold [&_.k]:text-mv-white"
            dangerouslySetInnerHTML={{ __html: problem.sol }}
          />
        )}
      </div>

      <div className="border border-mv-border bg-mv-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-ui text-[11px] tracking-[0.2em] text-mv-dim uppercase">Mastery</h2>
          <button
            onClick={resetAll}
            className="font-ui text-[10px] tracking-[0.12em] text-mv-danger uppercase hover:underline"
          >
            Reset all progress
          </button>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Mastered" value={`${mastered}/${subject.topics.length}`} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Streak" value={String(state.stats.streak)} />
          <Stat label="Best streak" value={String(state.stats.best)} />
        </div>
        <div className="flex flex-col divide-y divide-mv-border">
          {subject.topics.map((t) => {
            const box = state.topics[t.id]?.box ?? 1;
            return (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate text-sm text-mv-text">{t.name}</span>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex gap-1" title={`Box ${BOX_LABELS[box]}/5`}>
                    {[1, 2, 3, 4, 5].map((k) => (
                      <span
                        key={k}
                        className={`h-2 w-2 rounded-full ${
                          k <= box
                            ? box >= 5
                              ? "bg-mv-success"
                              : "bg-mv-warning"
                            : "bg-mv-border"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => resetTopic(t.id)}
                    className="font-ui text-[10px] tracking-[0.1em] text-mv-dim uppercase hover:text-mv-danger hover:underline"
                  >
                    Reset
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {!userId && (
          <p className="mt-5 text-xs text-mv-dim">
            Progress is saved on this device only.{" "}
            <a href="/signup" className="text-mv-blue underline">
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
    <div className="bg-mv-deep px-3 py-2.5">
      <div className="font-ui text-lg font-bold text-mv-white">{value}</div>
      <div className="mt-0.5 font-ui text-[10px] tracking-[0.1em] text-mv-dim uppercase">{label}</div>
    </div>
  );
}
