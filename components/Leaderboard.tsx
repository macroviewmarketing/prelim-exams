"use client";

import { useMemo, useState } from "react";

export type LeaderboardRow = {
  user_id: string;
  display_name: string;
  has_username: boolean;
  subject_id: string;
  mastered: number;
  topics_seen: number;
  attempts: number;
  correct: number;
};

export type SubjectSummary = { id: string; title: string; topicCount: number };

export default function Leaderboard({
  rows,
  subjects,
}: {
  rows: LeaderboardRow[];
  subjects: SubjectSummary[];
}) {
  const [tab, setTab] = useState<"overall" | string>("overall");

  const ranked = useMemo(() => {
    if (tab === "overall") {
      const byUser = new Map<string, { display_name: string; mastered: number; attempts: number; correct: number }>();
      for (const r of rows) {
        const prev = byUser.get(r.user_id) ?? { display_name: r.display_name, mastered: 0, attempts: 0, correct: 0 };
        prev.mastered += r.mastered;
        prev.attempts += r.attempts;
        prev.correct += r.correct;
        byUser.set(r.user_id, prev);
      }
      return [...byUser.entries()]
        .map(([user_id, v]) => ({ user_id, ...v }))
        .sort((a, b) => b.mastered - a.mastered || b.correct - a.correct);
    }
    return rows
      .filter((r) => r.subject_id === tab)
      .map((r) => ({ user_id: r.user_id, display_name: r.display_name, mastered: r.mastered, attempts: r.attempts, correct: r.correct }))
      .sort((a, b) => b.mastered - a.mastered || b.correct - a.correct);
  }, [rows, tab]);

  const totalTopics =
    tab === "overall" ? subjects.reduce((a, s) => a + s.topicCount, 0) : subjects.find((s) => s.id === tab)?.topicCount ?? 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="font-display text-4xl text-pf-text">Leaderboard</h1>
      <p className="mt-2 text-sm text-pf-icon">Ranked by topics mastered. Sign in and start drilling to appear here.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setTab("overall")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "overall" ? "bg-pf-primary text-white" : "border border-pf-border text-pf-text hover:border-pf-primary"
          }`}
        >
          Overall
        </button>
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setTab(s.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === s.id ? "bg-pf-primary text-white" : "border border-pf-border text-pf-text hover:border-pf-primary"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-pf-border bg-pf-surface shadow-sm">
        {ranked.length === 0 ? (
          <p className="p-6 text-center text-sm text-pf-icon">No progress logged for this yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-pf-border">
            {ranked.map((r, i) => {
              const accuracy = r.attempts > 0 ? Math.round((r.correct / r.attempts) * 100) : 0;
              return (
                <div key={r.user_id} className="flex items-center gap-4 px-5 py-3.5">
                  <span
                    className={`w-7 text-center font-display text-lg ${
                      i === 0 ? "text-pf-primary" : i === 1 ? "text-pf-secondary" : "text-pf-icon"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-pf-text">{r.display_name}</span>
                  <span className="text-xs text-pf-icon">{accuracy}% acc</span>
                  <span className="rounded-full bg-pf-secondary-soft px-3 py-1 text-xs font-medium text-pf-secondary">
                    {r.mastered}/{totalTopics} mastered
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
