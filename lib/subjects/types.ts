export type ProblemUnit = "peso" | "percent" | "years" | "count" | "text";

export type Problem = {
  id: string;
  name: string;
  prompt: string;
  ans: number | string;
  unit: ProblemUnit;
  hint: string;
  sol: string;
};

/**
 * "input" (default): user types an answer, checked against Problem.ans.
 * "reveal": no checkable answer (e.g. free-form term recall) — user
 * reveals Problem.ans/sol and self-reports whether they got it right.
 */
export type TopicMode = "input" | "reveal";

export type Topic = {
  id: string;
  name: string;
  mode?: TopicMode;
  generate: () => Problem;
};

/** One flashcard/term entry, used by the Quizlet-style TermQuiz component. */
export type TermEntry = {
  id: string;
  term: string;
  def: string;
  week?: number;
};

export type Subject = {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
  formulaSheetHtml?: string;
  /** Present when this subject has a term-recall deck driven by TermQuiz instead of Drill. */
  terms?: TermEntry[];
};
