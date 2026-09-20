import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProblemUnit, Subject } from "@/lib/subjects/types";

export type TopicProgress = {
  box: number;
  seen: number;
  ok: number;
  streak: number;
};

export type SubjectStats = {
  done: number;
  correct: number;
  streak: number;
  best: number;
};

export type SubjectState = {
  topics: Record<string, TopicProgress>;
  stats: SubjectStats;
  last: string | null;
};

function freshTopicProgress(): TopicProgress {
  return { box: 1, seen: 0, ok: 0, streak: 0 };
}

export function initSubjectState(subject: Subject): SubjectState {
  const topics: Record<string, TopicProgress> = {};
  for (const t of subject.topics) topics[t.id] = freshTopicProgress();
  return {
    topics,
    stats: { done: 0, correct: 0, streak: 0, best: 0 },
    last: null,
  };
}

/** Weighted random pick favoring lower-box (less mastered) topics, avoiding immediate repeats. */
export function pickTopic(
  topicIds: string[],
  topicsState: Record<string, TopicProgress>,
  lastId: string | null,
): string {
  let pool = topicIds.filter((id) => id !== lastId);
  if (!pool.length) pool = topicIds.slice();
  const weights = pool.map((id) => Math.max(1, 6 - topicsState[id].box));
  const total = weights.reduce((a, b) => a + b, 0);
  let x = Math.random() * total;
  for (let k = 0; k < pool.length; k++) {
    x -= weights[k];
    if (x <= 0) return pool[k];
  }
  return pool[pool.length - 1];
}

export function isCorrect(user: number, ans: number, unit: ProblemUnit): boolean {
  if (Number.isNaN(user)) return false;
  if (unit === "percent") return Math.abs(user - ans) <= 0.15;
  if (unit === "years") return Math.abs(user - ans) <= 0.1;
  if (unit === "count") return Math.abs(user - ans) <= 0.5;
  return Math.abs(user - ans) <= Math.max(1, Math.abs(ans) * 0.006);
}

const normalizeText = (s: string) =>
  s.trim().toLowerCase().replace(/[^\p{L}\p{N}.]+/gu, " ").replace(/\s+/g, " ").trim();

/** Lenient text match: normalizes case/punctuation/whitespace, exact match after that. */
export function isCorrectText(user: string, ans: string): boolean {
  const u = normalizeText(user);
  if (!u) return false;
  return u === normalizeText(ans);
}

/** Shared box/stats update — grading a numeric/text answer and self-grading both funnel through this. */
function applyGrade(
  state: SubjectState,
  topicId: string,
  correct: boolean,
): { state: SubjectState; correct: boolean } {
  const prevTopic = state.topics[topicId] ?? freshTopicProgress();

  const nextTopic: TopicProgress = { ...prevTopic, seen: prevTopic.seen + 1 };
  if (correct) {
    nextTopic.ok = prevTopic.ok + 1;
    nextTopic.streak = prevTopic.streak + 1;
    nextTopic.box = Math.min(5, prevTopic.box + 1);
  } else {
    nextTopic.streak = 0;
    nextTopic.box = 1;
  }

  const nextStats: SubjectStats = {
    done: state.stats.done + 1,
    correct: state.stats.correct + (correct ? 1 : 0),
    streak: correct ? state.stats.streak + 1 : 0,
    best: Math.max(state.stats.best, correct ? state.stats.streak + 1 : 0),
  };

  const nextState: SubjectState = {
    topics: { ...state.topics, [topicId]: nextTopic },
    stats: nextStats,
    last: topicId,
  };

  return { state: nextState, correct };
}

/** Grades one typed answer (numeric or text unit), mutating a fresh copy of state. */
export function gradeAnswer(
  state: SubjectState,
  topicId: string,
  user: string,
  ans: number | string,
  unit: ProblemUnit,
): { state: SubjectState; correct: boolean } {
  const correct =
    unit === "text" ? isCorrectText(user, String(ans)) : isCorrect(parseFloat(user), Number(ans), unit);
  return applyGrade(state, topicId, correct);
}

/** Grades a "reveal" topic where the user self-reports whether they got it right. */
export function gradeSelf(
  state: SubjectState,
  topicId: string,
  correct: boolean,
): { state: SubjectState; correct: boolean } {
  return applyGrade(state, topicId, correct);
}

/** Reset a single topic back to box 1 / zeroed counters, keeping other topics untouched. */
export function resetTopicProgress(state: SubjectState, topicId: string): SubjectState {
  return {
    ...state,
    topics: { ...state.topics, [topicId]: freshTopicProgress() },
    last: state.last === topicId ? null : state.last,
  };
}

/** Reset every topic in a subject back to a fresh state (keeps lifetime stats reset too). */
export function resetAllProgress(subject: Subject): SubjectState {
  return initSubjectState(subject);
}

// ---- localStorage persistence ----

function storageKey(subjectId: string) {
  return `prelim_progress_${subjectId}`;
}

export function loadLocalProgress(subject: Subject): SubjectState {
  const fallback = initSubjectState(subject);
  try {
    const raw = localStorage.getItem(storageKey(subject.id));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SubjectState>;
    const topics: Record<string, TopicProgress> = {};
    for (const t of subject.topics) {
      topics[t.id] = { ...freshTopicProgress(), ...(parsed.topics?.[t.id] ?? {}) };
    }
    return {
      topics,
      stats: { ...fallback.stats, ...(parsed.stats ?? {}) },
      last: parsed.last ?? null,
    };
  } catch {
    return fallback;
  }
}

export function saveLocalProgress(subjectId: string, state: SubjectState): void {
  try {
    localStorage.setItem(storageKey(subjectId), JSON.stringify(state));
  } catch {
    // ignore (private browsing, quota, etc.)
  }
}

// ---- Supabase sync ----

type TopicProgressRow = {
  topic_id: string;
  box: number;
  seen: number;
  correct: number;
  streak: number;
};

export async function fetchRemoteProgress(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
): Promise<Record<string, TopicProgress> | null> {
  try {
    const { data, error } = await supabase
      .from("topic_progress")
      .select("topic_id, box, seen, correct, streak")
      .eq("user_id", userId)
      .eq("subject_id", subjectId);

    if (error || !data) return null;

    const topics: Record<string, TopicProgress> = {};
    for (const row of data as TopicProgressRow[]) {
      topics[row.topic_id] = {
        box: row.box,
        seen: row.seen,
        ok: row.correct,
        streak: row.streak,
      };
    }
    return topics;
  } catch {
    return null;
  }
}

export function upsertTopicProgress(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
  topicId: string,
  topicState: TopicProgress,
): void {
  // Fire-and-forget: don't block the UI on network latency.
  void supabase
    .from("topic_progress")
    .upsert(
      {
        user_id: userId,
        subject_id: subjectId,
        topic_id: topicId,
        box: topicState.box,
        seen: topicState.seen,
        correct: topicState.ok,
        streak: topicState.streak,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,subject_id,topic_id" },
    )
    .then(() => {
      /* no-op */
    });
}

export function resetRemoteTopicProgress(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
  topicId: string,
): void {
  upsertTopicProgress(supabase, userId, subjectId, topicId, freshTopicProgress());
}

export function resetRemoteSubjectProgress(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
): void {
  // Fire-and-forget: don't block the UI on network latency.
  void supabase
    .from("topic_progress")
    .delete()
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .then(() => {
      /* no-op */
    });
}

/** Merge remote topic progress into local state. Server wins on conflict. */
export function mergeRemoteIntoLocal(
  local: SubjectState,
  remoteTopics: Record<string, TopicProgress>,
): SubjectState {
  const topics: Record<string, TopicProgress> = { ...local.topics };
  for (const [id, remote] of Object.entries(remoteTopics)) {
    topics[id] = remote;
  }
  const done = Object.values(topics).reduce((a, t) => a + t.seen, 0);
  const correct = Object.values(topics).reduce((a, t) => a + t.ok, 0);
  return {
    topics,
    stats: { ...local.stats, done, correct },
    last: local.last,
  };
}
