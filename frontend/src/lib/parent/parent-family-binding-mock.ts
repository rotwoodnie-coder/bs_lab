"use client";

/** Demo 家庭绑定（localStorage），驱动家长任务按 studentUserId 过滤。 */

let inMemoryBinding: ParentFamilyBinding | null = null;

export type ParentFamilyBinding = {
  studentUserId: string;
  displayName: string;
  gradeLabel: string;
};

export const DEMO_BINDABLE_STUDENT: ParentFamilyBinding = {
  studentUserId: "S20261234",
  displayName: "李小明",
  gradeLabel: "四年级 · 科学",
};

export function readParentFamilyBinding(): ParentFamilyBinding | null {
  return inMemoryBinding;
}

function pingBindingChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("bs-lab-parent-family-binding"));
}

export function writeParentFamilyBinding(binding: ParentFamilyBinding): void {
  inMemoryBinding = binding;
  pingBindingChange();
}

export function clearParentFamilyBinding(): void {
  inMemoryBinding = null;
  pingBindingChange();
}
