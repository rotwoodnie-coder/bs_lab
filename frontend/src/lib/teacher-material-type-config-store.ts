"use client";

/**
 * 教师端实验素材「类型键」与可见角色 — 对接 `/v2/teacher-material-types`。
 * 库表：`edu_teacher_material_types` / `edu_teacher_material_type_visible_roles`（迁移 0019），
 * 或环境 `BS_LAB_TEACHER_MATERIAL_TYPE_SCHEMA=v2` 时的 `teacher_material_type`（迁移 0033）。
 * 类型编码 `code` 与 `material_msg.comments` JSON 的 `k`、侧栏 kind 一致（word / ppt / …）。
 *
 * 控制台「实验材料分类」页的只读素材类别已改为 `data_file_type`（见 `/v2/dict/file-types`），
 * 与本 store 解耦；教师素材列表页仍使用本模块拉取 teacher-material-types。
 */
import { callNewCoreApi, type ApiActor } from "@/lib/new-core-api";
import { USER_ROLE_ORDER, type UserRole } from "@/types/auth";

export type TeacherMaterialTypeConfigRow = {
  code: string;
  label: string;
  sortOrder: number;
  /** 空数组表示全部角色可见（与后端约定一致） */
  visibleRoles: UserRole[];
};

const ROLE_SET = new Set<string>(USER_ROLE_ORDER);

function parseVisibleRoles(raw: unknown): UserRole[] {
  if (!Array.isArray(raw)) return [];
  const out: UserRole[] = [];
  for (const x of raw) {
    if (typeof x === "string" && ROLE_SET.has(x)) out.push(x as UserRole);
  }
  return out;
}

/** 将单条 `/v2/teacher-material-types` 写操作的 JSON 规范为前端行 */
export function normalizeTeacherMaterialTypeRowPayload(raw: unknown): TeacherMaterialTypeConfigRow | null {
  const list = normalizeTeacherMaterialTypeListPayload(raw == null ? [] : [raw]);
  return list[0] ?? null;
}

/** 将 GET `/v2/teacher-material-types` 的 JSON 规范为前端行（兼容字段缺失，拒绝无效行） */
export function normalizeTeacherMaterialTypeListPayload(raw: unknown): TeacherMaterialTypeConfigRow[] {
  if (!Array.isArray(raw)) return [];
  const out: TeacherMaterialTypeConfigRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const code = typeof o.code === "string" ? o.code.trim() : "";
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const soRaw = o.sortOrder;
    const sortOrder =
      typeof soRaw === "number" && Number.isFinite(soRaw)
        ? soRaw
        : typeof soRaw === "string"
          ? Number(soRaw)
          : NaN;
    if (!code || !label || !Number.isFinite(sortOrder)) continue;
    out.push({
      code,
      label,
      sortOrder,
      visibleRoles: parseVisibleRoles(o.visibleRoles),
    });
  }
  return out;
}

/**
 * 仅在网络错误等无法请求 API 时作占位，与 migrations/0033 种子及教师素材 kind 一致；
 * 不代表库内真实数据，不得与成功拉取的列表混用。
 */
export function defaultTeacherMaterialTypeRows(): TeacherMaterialTypeConfigRow[] {
  return [
    { code: "word", label: "Word", sortOrder: 10, visibleRoles: [] },
    { code: "ppt", label: "PPT", sortOrder: 20, visibleRoles: [] },
    { code: "pdf", label: "PDF", sortOrder: 30, visibleRoles: [] },
    { code: "image", label: "图片", sortOrder: 40, visibleRoles: [] },
    { code: "video", label: "视频", sortOrder: 50, visibleRoles: [] },
    { code: "audio", label: "音频", sortOrder: 60, visibleRoles: [] },
    { code: "spreadsheet", label: "Excel", sortOrder: 70, visibleRoles: [] },
  ];
}

export async function listTeacherMaterialTypeConfigApi(actor: ApiActor): Promise<TeacherMaterialTypeConfigRow[]> {
  const raw = await callNewCoreApi<unknown>(actor, "/v2/teacher-material-types", "GET");
  return normalizeTeacherMaterialTypeListPayload(raw);
}

export async function createTeacherMaterialTypeConfigApi(actor: ApiActor, row: TeacherMaterialTypeConfigRow) {
  const raw = await callNewCoreApi<unknown>(actor, "/v2/teacher-material-types", "POST", row as Record<string, unknown>);
  return normalizeTeacherMaterialTypeRowPayload(raw) ?? row;
}

export async function updateTeacherMaterialTypeConfigApi(
  actor: ApiActor,
  code: string,
  row: Omit<TeacherMaterialTypeConfigRow, "code">,
) {
  const raw = await callNewCoreApi<unknown>(
    actor,
    `/v2/teacher-material-types/${encodeURIComponent(code)}`,
    "PATCH",
    row as Record<string, unknown>,
  );
  return normalizeTeacherMaterialTypeRowPayload(raw) ?? { code, ...row };
}

export async function deleteTeacherMaterialTypeConfigApi(actor: ApiActor, code: string) {
  return callNewCoreApi<{ code: string }>(actor, `/v2/teacher-material-types/${encodeURIComponent(code)}`, "DELETE");
}

export function isRoleVisibleForMaterialType(row: TeacherMaterialTypeConfigRow, role: UserRole): boolean {
  if (!row.visibleRoles?.length) return true;
  return row.visibleRoles.includes(role);
}
