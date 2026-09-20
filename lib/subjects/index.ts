import type { Subject } from "./types";
import { bes423 } from "./bes423";
import { eceTe2 } from "./eceTe2";

export const SUBJECTS: Subject[] = [bes423, eceTe2];

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}
