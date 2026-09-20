"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSubject } from "@/lib/subjects";
import type { Problem } from "@/lib/subjects/types";
import {
  fetchRemoteProgress,
  gradeAnswer,
  initSubjectState,
  loadLocalProgress,
  mergeRemoteIntoLocal,
  pickTopic,
  saveLocalProgress,
  upsertTopicProgress,
  type SubjectState,
} from "@/lib/drill/progress";
import { createClient } from "@/lib/supabase/client";

const BOX_LABELS = ["", "1", "2", "3", "4", "5"];

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

  const supabaseRef = useRef(createClient());

  // Init state + pull remote progress on mount.
  useEffect(() => {
    if (!subject) return;
    const local = loadLocalProgress(subject);
    // localStorage isn't available during SSR, so this has to be read and
    // synced into state on mount rather than via a useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(local);

    const topic = subject.topics.find(
      (t) => t.id === pickTopic(topicIds, local.topics, local.last),
    );
    if (topic) setProblem(topic.generate());

    (async () => {
      const supabase = supabaseRef.current;
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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.id]);

  if (!subject || !state || !problem) {
    return <div className="p-8 text-center text-zinc-500">Loading drill…</div>;
  }

  const nextProblem = (state2: SubjectState) => {
    const topic = subject.topics.find(
      (t) => t.id === pickTopic(topicIds, state2.topics, state2.last),
    );
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
      upsertTopicProgress(supabaseRef.current, userId, subject.id, problem.id, next.topics[problem.id]);
    }
  };

  const skip = () => {
    // "I'm stuck" — reveal the solution without grading as wrong yet; user can hit Next after.
    setShowSol(true);
    setShowHint(true);
  };

  const next = () => nextProblem(state);

  const mastered = Object.values(state.topics).filter((t) => t.box >= 5).length;
  const accuracy = state.stats.done > 0 ? Math.round((state.stats.correct / state.stats.done) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {subject.topics.find((t) => t.id === problem.id)?.name ?? problem.id}
          </span>
          <span className="text-xs text-zinc-400">
            Box {state.topics[problem.id]?.box ?? 1}/5
          </span>
        </div>

        <p
          className="mb-4 text-lg leading-relaxed text-zinc-900 dark:text-zinc-100 [&_b]:font-semibold"
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
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          {problem.unit === "percent" && <span className="text-zinc-500">%</span>}
        </div>

        {feedback && (
          <p
            className={`mt-3 text-sm font-medium ${
              feedback === "correct" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {feedback === "correct" ? "Correct!" : `Not quite. Answer: ${problem.ans}`}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={check}
            disabled={!!feedback}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Check
          </button>
          <button
            onClick={() => setShowHint((v) => !v)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Hint
          </button>
          <button
            onClick={skip}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            I&apos;m stuck
          </button>
          <button
            onClick={next}
            className="ml-auto rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Next →
          </button>
        </div>

        {showHint && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            {problem.hint}
          </p>
        )}

        {showSol && (
          <pre
            className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-700 [&_.k]:font-semibold [&_.k]:text-zinc-900 dark:bg-zinc-950 dark:text-zinc-300 dark:[&_.k]:text-zinc-100"
            dangerouslySetInnerHTML={{ __html: problem.sol }}
          />
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Mastery</h2>
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Mastered" value={`${mastered}/${subject.topics.length}`} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Streak" value={String(state.stats.streak)} />
          <Stat label="Best streak" value={String(state.stats.best)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {subject.topics.map((t) => {
            const box = state.topics[t.id]?.box ?? 1;
            return (
              <div
                key={t.id}
                title={`${t.name} — box ${BOX_LABELS[box]}`}
                className={`h-2.5 w-2.5 rounded-full ${
                  box >= 5
                    ? "bg-emerald-500"
                    : box >= 3
                      ? "bg-amber-400"
                      : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              />
            );
          })}
        </div>
        {!userId && (
          <p className="mt-4 text-xs text-zinc-400">
            Progress is saved on this device only.{" "}
            <a href="/signup" className="underline">
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
    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-950">
      <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
