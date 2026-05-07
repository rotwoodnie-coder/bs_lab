"use client";

import * as React from "react";

import type { SubjectDiscipline } from "@/types/subject";

type Disc = { discipline: SubjectDiscipline };
type Grade = { id: string };

export function useEditorBootstrapPhaseSync(
  phaseDisciplines: Disc[],
  gradeOptions: Grade[],
  setDiscipline: React.Dispatch<React.SetStateAction<SubjectDiscipline>>,
  setSelectedGradeCodes: React.Dispatch<React.SetStateAction<string[]>>,
) {
  const sigRef = React.useRef<string>("");
  const setDisciplineRef = React.useRef(setDiscipline);
  const setSelectedGradeCodesRef = React.useRef(setSelectedGradeCodes);

  React.useEffect(() => {
    setDisciplineRef.current = setDiscipline;
    setSelectedGradeCodesRef.current = setSelectedGradeCodes;
  }, [setDiscipline, setSelectedGradeCodes]);

  React.useEffect(() => {
    if (phaseDisciplines.length === 0) return;

    const nextSig = `${phaseDisciplines.map((d) => d.discipline).join("|")}__${gradeOptions.map((g) => g.id).join("|")}`;
    if (sigRef.current === nextSig) return;
    sigRef.current = nextSig;

    setDisciplineRef.current((prev) => {
      const allowed = new Set(phaseDisciplines.map((d) => d.discipline));
      return allowed.has(prev) ? prev : phaseDisciplines[0]!.discipline;
    });
    setSelectedGradeCodesRef.current((prev) => {
      if (gradeOptions.length === 0) return prev;
      const allowed = new Set(gradeOptions.map((g) => g.id));
      const kept = prev.filter((x) => allowed.has(x));
      if (kept.length === 0) return prev;
      if (kept.length === prev.length && kept.every((v, i) => v === prev[i])) return prev;
      return kept;
    });
  }, [gradeOptions, phaseDisciplines]);
}
