"use client";

import { useState } from "react";
import Drill from "./Drill";
import TermQuiz from "./TermQuiz";

export default function SubjectView({
  subjectId,
  hasTerms,
  hasDrillTopics,
}: {
  subjectId: string;
  hasTerms: boolean;
  hasDrillTopics: boolean;
}) {
  const [tab, setTab] = useState<"terms" | "drill">(hasTerms ? "terms" : "drill");

  if (hasTerms && hasDrillTopics) {
    return (
      <div>
        <div className="mx-auto flex w-full max-w-2xl gap-2 px-6 pt-6">
          <button
            onClick={() => setTab("terms")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "terms" ? "bg-pf-primary text-white" : "border border-pf-border text-pf-text hover:border-pf-primary"
            }`}
          >
            Term Flashcards
          </button>
          <button
            onClick={() => setTab("drill")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "drill" ? "bg-pf-primary text-white" : "border border-pf-border text-pf-text hover:border-pf-primary"
            }`}
          >
            Practice Drill
          </button>
        </div>
        {tab === "terms" ? <TermQuiz subjectId={subjectId} /> : <Drill subjectId={subjectId} />}
      </div>
    );
  }

  if (hasTerms) return <TermQuiz subjectId={subjectId} />;
  return <Drill subjectId={subjectId} />;
}
