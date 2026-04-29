/**
 * V2 字典数据 HTTP 路由
 * 前缀：/v2/dict/*
 */
import {
  getSchoolLevels,
  getSchoolGrades,
  getSchoolSubjects,
  getGradeSubjects,
  getMaterialTypes,
  getMaterialProps,
  getMaterialUnits,
  getMaterialSecurities,
  getFileTypes,
  getOrgTypes,
  getRoles,
  getPrefTitles,
  getRatingScales,
  getExpDifficulties,
  getDifficultyTypes,
  getQuestionTypes,
  getQuestionCapacities,
  getMsgTypes,
} from "../../infrastructure/repositories/v2-dict-repository.ts";
import { assertAnyPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const DICT_ROUTES: Record<string, () => Promise<unknown>> = {
  "/v2/dict/school-levels":       getSchoolLevels,
  "/v2/dict/school-grades":       getSchoolGrades,
  "/v2/dict/school-subjects":     getSchoolSubjects,
  "/v2/dict/grade-subjects":      getGradeSubjects,
  "/v2/dict/material-types":      getMaterialTypes,
  "/v2/dict/material-props":      getMaterialProps,
  "/v2/dict/material-units":      getMaterialUnits,
  "/v2/dict/material-securities": getMaterialSecurities,
  "/v2/dict/org-types":           getOrgTypes,
  "/v2/dict/roles":               getRoles,
  "/v2/dict/pref-titles":         getPrefTitles,
  "/v2/dict/rating-scales":       getRatingScales,
  "/v2/dict/difficulties":        getExpDifficulties,
  "/v2/dict/difficulty-types":    getDifficultyTypes,
  "/v2/dict/question-types":      getQuestionTypes,
  "/v2/dict/question-capacities": getQuestionCapacities,
  "/v2/dict/msg-types":           getMsgTypes,
};

export async function routeV2Dict(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

    if (req.method !== "GET") return new Response(null, { status: 404 });
    if (!path.startsWith("/v2/dict/")) return new Response(null, { status: 404 });

    if (path === "/v2/dict/file-types") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.EXP_VIEW, PERMISSIONS.EXP_CREATE, PERMISSIONS.EXP_EDIT, PERMISSIONS.USER_MANAGE]);
      const includeInactive = url.searchParams.get("includeInactive") === "1";
      return ok(await getFileTypes({ includeInactive }));
    }

    const handler = DICT_ROUTES[path];
    if (!handler) return fail("未找到该字典", 404);

    assertAnyPermission(actorRoleId, [PERMISSIONS.EXP_VIEW, PERMISSIONS.USER_MANAGE, PERMISSIONS.ORG_MANAGE, PERMISSIONS.SYSTEM_DICT_WRITE]);
    const data = await handler();
    return ok(data);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("权限不足")) return fail(err.message, 403);
    console.error("[v2-dict]", err);
    return fail("服务内部错误", 500);
  }
}
