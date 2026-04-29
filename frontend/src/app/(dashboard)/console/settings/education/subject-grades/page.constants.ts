import type { SchoolDimensionSnapshot } from "./page.types";

export const EMPTY_SCHOOL_DIMENSION_SNAPSHOT: SchoolDimensionSnapshot = {
  levels: [],
  subjects: [],
  grades: [],
  levelSubjects: [],
  levelGrades: [],
  gradeSubjectMatrix: [],
};

export const DEFAULT_ICON_BASE = "assets/edu-icons/subjects";

export function buildSubjectIconPath(code: string): string {
  return `${DEFAULT_ICON_BASE}/${code.toLowerCase()}.svg`;
}
