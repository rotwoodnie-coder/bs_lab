import { NextRequest } from "next/server";

import { runExec, runQuery, withErrorHandling } from "../../_lib";
import { effectiveSchoolLevelIdSqlForAlias, schoolDictStatusEnabledSql } from "../../edu-dimension-v2-shared";

const STAGE_GRADE_CODES_543: Record<StageCode, string[]> = {
  STAGE_PRIMARY: ["GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5"],
  STAGE_JUNIOR: ["GRADE_6", "GRADE_7", "GRADE_8", "GRADE_9"],
  STAGE_SENIOR: ["GRADE_10", "GRADE_11", "GRADE_12"],
};

const STAGE_GRADE_CODES_633: Record<StageCode, string[]> = {
  STAGE_PRIMARY: ["GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5", "GRADE_6"],
  STAGE_JUNIOR: ["GRADE_7", "GRADE_8", "GRADE_9"],
  STAGE_SENIOR: ["GRADE_10", "GRADE_11", "GRADE_12"],
};

type StageCode = "STAGE_PRIMARY" | "STAGE_JUNIOR" | "STAGE_SENIOR";
type Scheme = "543" | "633" | "custom";
type Body = {
  scheme?: Scheme;
  stage_grade_codes?: Partial<Record<StageCode, string[]>>;
};

type CurrentRow = {
  stage_code: StageCode;
  stage_name: string;
  grade_code: string;
};

const STAGE_CODES: StageCode[] = ["STAGE_PRIMARY", "STAGE_JUNIOR", "STAGE_SENIOR"];

function normalizeCodes(input?: string[]): string[] {
  const set = new Set(
    (input ?? [])
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean),
  );
  return [...set];
}

function resolveStageGradeCodes(body: Body): Record<StageCode, string[]> {
  if (body.scheme === "543") return STAGE_GRADE_CODES_543;
  if (body.scheme === "633") return STAGE_GRADE_CODES_633;
  if (body.scheme !== "custom") throw new Error("不支持的学制方案");
  const custom = body.stage_grade_codes ?? {};
  const result = {
    STAGE_PRIMARY: normalizeCodes(custom.STAGE_PRIMARY),
    STAGE_JUNIOR: normalizeCodes(custom.STAGE_JUNIOR),
    STAGE_SENIOR: normalizeCodes(custom.STAGE_SENIOR),
  };
  if (!result.STAGE_PRIMARY.length || !result.STAGE_JUNIOR.length || !result.STAGE_SENIOR.length) {
    throw new Error("自定义学制需为三个学段都设置至少一个年级");
  }
  return result;
}

async function buildPreview(targetMap: Record<StageCode, string[]>, scheme: Scheme) {
  const eff = effectiveSchoolLevelIdSqlForAlias("g");
  const rows = await runQuery<CurrentRow>(
    `SELECT lv.level_id AS stage_code, lv.level_name AS stage_name, g.grade_id AS grade_code
     FROM data_school_grade g
     INNER JOIN data_school_level lv ON lv.level_id = (${eff})
     WHERE (${eff}) IS NOT NULL
       AND ${schoolDictStatusEnabledSql("lv")}
       AND ${schoolDictStatusEnabledSql("g")}`,
  );
  const currentMap = new Map<StageCode, Set<string>>();
  const stageNameMap = new Map<StageCode, string>();
  for (let i = 0; i < STAGE_CODES.length; i++) currentMap.set(STAGE_CODES[i], new Set());
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !currentMap.has(row.stage_code)) continue;
    currentMap.get(row.stage_code)?.add(row.grade_code);
    stageNameMap.set(row.stage_code, row.stage_name);
  }

  let enableCount = 0;
  let disableCount = 0;
  let unchangedCount = 0;
  const stages = STAGE_CODES.map((stageCode) => {
    const current = currentMap.get(stageCode) ?? new Set<string>();
    const target = new Set(targetMap[stageCode] ?? []);
    const willEnable = [...target].filter((code) => !current.has(code));
    const willDisable = [...current].filter((code) => !target.has(code));
    const unchanged = [...target].filter((code) => current.has(code));
    enableCount += willEnable.length;
    disableCount += willDisable.length;
    unchangedCount += unchanged.length;
    return {
      stageCode,
      stageName: stageNameMap.get(stageCode) ?? stageCode,
      willEnable,
      willDisable,
      unchanged,
    };
  });
  return {
    scheme,
    summary: { enableCount, disableCount, unchangedCount },
    stages,
  };
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json()) as Body;
    const targetMap = resolveStageGradeCodes(body);
    return buildPreview(targetMap, body.scheme ?? "543");
  });
}

export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json()) as Body;
    const scheme = body.scheme ?? "543";
    const targetMap = resolveStageGradeCodes({ ...body, scheme });

    const union = new Set<string>();
    for (let i = 0; i < STAGE_CODES.length; i++) {
      const codes = targetMap[STAGE_CODES[i]] ?? [];
      for (let j = 0; j < codes.length; j++) union.add(codes[j] ?? "");
    }
    union.delete("");

    for (let i = 0; i < STAGE_CODES.length; i++) {
      const stageCode = STAGE_CODES[i];
      const gradeCodes = targetMap[stageCode];
      if (!gradeCodes?.length) continue;
      for (let j = 0; j < gradeCodes.length; j++) {
        const gradeCode = gradeCodes[j];
        if (!gradeCode) continue;
        await runExec(
          `UPDATE data_school_grade
           SET school_level_id = ?, status = 'y', sort_order = ?
           WHERE grade_id = ?`,
          [stageCode, (j + 1) * 10, gradeCode],
        );
      }
    }

    if (union.size > 0) {
      const placeholders = [...union].map(() => "?").join(",");
      await runExec(
        `UPDATE data_school_grade SET status = 'n' WHERE grade_id NOT IN (${placeholders})`,
        [...union],
      );
    } else {
      await runExec(`UPDATE data_school_grade SET status = 'n'`);
    }

    return { ok: true, scheme };
  });
}
