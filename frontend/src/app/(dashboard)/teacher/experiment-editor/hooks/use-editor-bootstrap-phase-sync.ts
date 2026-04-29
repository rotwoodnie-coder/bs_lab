"use client";

import * as React from "react";

import type { SubjectDiscipline } from "@/types/subject";

type Disc = { discipline: SubjectDiscipline };
type Grade = { code: string };

export function useEditorBootstrapPhaseSync(
  phaseDisciplines: Disc[],
  gradeOptions: Grade[],
  setDiscipline: React.Dispatch<React.SetStateAction<SubjectDiscipline>>,
  setSelectedGradeCodes: React.Dispatch<React.SetStateAction<string[]>>,
) {
  const sigRef = React.useRef<string>("");

  React.useEffect(() => {
    if (phaseDisciplines.length === 0) return;

    // 防御：若上游每次 render 都生成新数组引用，先用内容签名去重，避免 effect 反复触发导致循环更新。
    const nextSig = `${phaseDisciplines.map((d) => d.discipline).join("|")}__${gradeOptions.map((g) => g.code).join("|")}`;
    if (sigRef.current === nextSig) return;
    sigRef.current = nextSig;

    setDiscipline((prev) => {
      const allowed = new Set(phaseDisciplines.map((d) => d.discipline));
      return allowed.has(prev) ? prev : phaseDisciplines[0]!.discipline;
    });
    setSelectedGradeCodes((prev) => {
      if (gradeOptions.length === 0) return prev;
      const allowed = new Set(gradeOptions.map((g) => g.code));
      const kept = prev.filter((x) => allowed.has(x));
      if (kept.length === 0) return [gradeOptions[0]!.code];

      // 若过滤后内容未变化，必须返回 prev 以避免循环更新
      if (kept.length === prev.length && kept.every((v, i) => v === prev[i])) return prev;
      return kept;
    });
  }, [gradeOptions, phaseDisciplines, setDiscipline, setSelectedGradeCodes]);
}
