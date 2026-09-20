import type { Subject } from "./types";
import { bes423 } from "./bes423";

export const SUBJECTS: Subject[] = [bes423];

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}
