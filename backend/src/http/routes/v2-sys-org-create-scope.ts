/**
 * POST /v2/sys-org 创建范围：教研员仅能创建教研类节点且父级须在其所属组织子树内。
 */
import type { CreateSysOrgInput } from "../../domain/v2-sys/v2-sys-types.ts";
import { V2_ORG_TYPE_IDS } from "../../domain/v2-sys/v2-org-type-constants.ts";
import { getSysOrgById } from "../../infrastructure/repositories/v2-sys-user-repository.ts";

const TEACHING_RESEARCH_ORG_TYPES = new Set(["research_group", "department"]);
const STANDARD_HIERARCHY_TYPE_IDS = new Set<string>([
  V2_ORG_TYPE_IDS.manage,
  V2_ORG_TYPE_IDS.school,
  V2_ORG_TYPE_IDS.grade,
  V2_ORG_TYPE_IDS.class,
]);

function normalizePathPrefix(orgPath: string | null | undefined, orgId: string): string {
  const p = (orgPath ?? "").trim().replace(/\/+$/, "");
  if (p.length > 0) return p;
  return `/${orgId}`;
}

function isParentUnderActorSubtree(
  parentOrgPath: string | null | undefined,
  parentOrgId: string,
  actorOrgId: string,
  actorPathPrefix: string,
): boolean {
  if (parentOrgId === actorOrgId) return true;
  const pp = (parentOrgPath ?? "").trim().replace(/\/+$/, "");
  return pp.startsWith(`${actorPathPrefix}/`);
}

function isStandardHierarchyType(typeId: string | null | undefined): boolean {
  return typeId != null && STANDARD_HIERARCHY_TYPE_IDS.has(typeId);
}

export async function assertSysOrgCreateScope(args: {
  roleHeader: string;
  actorOrgId: string;
  input: CreateSysOrgInput;
}): Promise<void> {
  const role = args.roleHeader.trim().toLowerCase();
  if (role !== "researcher") return;

  const actorOrgId = args.actorOrgId.trim();
  if (!actorOrgId) throw new Error("未绑定组织上下文，无法创建（缺少 x-org-id）");

  const input = args.input;
  const parentId = input.parentOrgId?.trim();
  if (!parentId) throw new Error("教研员创建组织时必须选择上级组织");

  const typeId = input.orgTypeId?.trim();
  if (!typeId || !TEACHING_RESEARCH_ORG_TYPES.has(typeId)) {
    throw new Error("教研员仅可创建「教研组 / 教研室」类节点（类型 research_group 或 department）");
  }
  if (isStandardHierarchyType(typeId)) {
    throw new Error("教研员不可创建学校层级组织类型");
  }
  if ((input.schoolGradeIds?.length ?? 0) > 0) {
    throw new Error("教研员创建此类组织时不可携带学校开设年级字段");
  }

  const [actor, parent] = await Promise.all([getSysOrgById(actorOrgId), getSysOrgById(parentId)]);
  if (!actor) throw new Error("未找到当前账号所属组织");
  if (!parent) throw new Error("上级组织不存在");

  const prefix = normalizePathPrefix(actor.orgPath, actor.orgId);
  if (!isParentUnderActorSubtree(parent.orgPath, parent.orgId, actor.orgId, prefix)) {
    throw new Error("所选上级组织不在您的管辖范围内");
  }
}
