"use client";

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ps-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function newWorkId(): string {
  return `umw-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function newTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newLabGroupId(): string {
  return `lg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

