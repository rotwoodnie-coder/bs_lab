"use client";

import { INITIAL_MOCK_ACADEMIC_YEAR } from "@/lib/academic-context";
import { readUnifiedStore } from "../unified-mock-store.core";
import { ensureUnifiedStoreSeeded } from "../unified-mock-store.seed";

/** 当前学年（统一仓 academicMeta） */
export function getCurrentAcademicYear(): string {
  if (typeof window === "undefined") return INITIAL_MOCK_ACADEMIC_YEAR;
  ensureUnifiedStoreSeeded();
  return readUnifiedStore().academicMeta?.currentAcademicYear ?? INITIAL_MOCK_ACADEMIC_YEAR;
}

