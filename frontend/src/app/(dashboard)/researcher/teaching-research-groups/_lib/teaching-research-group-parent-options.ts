import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";
import { UserRole } from "@/types/auth";

export type TeachingResearchParentOption = { orgId: string; label: string };

export function flattenOrgTree(nodes: V2SysOrgItem[]): V2SysOrgItem[] {
  const out: V2SysOrgItem[] = [];
  const walk = (n: V2SysOrgItem) => {
    out.push(n);
    for (const c of n.children ?? []) walk(c);
  };
  for (const r of nodes) walk(r);
  return out;
}

function normalizePathPrefix(orgPath: string | null | undefined, orgId: string): string {
  const p = (orgPath ?? "").trim().replace(/\/+$/, "");
  if (p.length > 0) return p;
  return `/${orgId}`;
}

/** 超级管理员可选任意节点为父级；教研员仅可选本人所属组织及其下级。 */
export function teachingResearchParentCandidates(
  flat: V2SysOrgItem[],
  role: UserRole,
  actorOrgId: string,
): V2SysOrgItem[] {
  if (role === UserRole.SUPER_ADMIN) {
    return [...flat].sort((a, b) => (a.orgPath ?? "").localeCompare(b.orgPath ?? "", "zh-Hans-CN"));
  }
  const actor = flat.find((o) => o.orgId === actorOrgId);
  if (!actor) return [];
  const base = normalizePathPrefix(actor.orgPath, actor.orgId);
  const filtered = flat.filter((o) => {
    if (o.orgId === actorOrgId) return true;
    const pp = (o.orgPath ?? "").trim().replace(/\/+$/, "");
    return pp.startsWith(`${base}/`);
  });
  return filtered.sort((a, b) => (a.orgPath ?? "").localeCompare(b.orgPath ?? "", "zh-Hans-CN"));
}

export function toTeachingResearchParentLabels(rows: V2SysOrgItem[]): TeachingResearchParentOption[] {
  return rows.map((o) => ({
    orgId: o.orgId,
    label: `${o.orgName} · ${o.orgPath ?? o.orgId}`,
  }));
}
