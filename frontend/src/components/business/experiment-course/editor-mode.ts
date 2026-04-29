import { UserRole } from "@/types/auth";

export type ExperimentCourseRole = "teacher" | "researcher" | "admin";
export type ExperimentCourseMode = "view" | "edit" | "review";

export function resolveExperimentCourseRole(role: UserRole): ExperimentCourseRole {
  if (role === UserRole.TEACHER) return "teacher";
  if (role === UserRole.RESEARCHER) return "researcher";
  return "admin";
}

export function resolveExperimentCourseMode(role: ExperimentCourseRole, readonly: boolean): ExperimentCourseMode {
  if (readonly) return "view";
  if (role === "researcher") return "review";
  return "edit";
}

export function isEditMode(mode: ExperimentCourseMode): boolean {
  return mode === "edit";
}
