export type ProblemUnit = "peso" | "percent" | "years";

export type Problem = {
  id: string;
  name: string;
  prompt: string;
  ans: number;
  unit: ProblemUnit;
  hint: string;
  sol: string;
};

export type Topic = {
  id: string;
  name: string;
  generate: () => Problem;
};

export type Subject = {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
};
