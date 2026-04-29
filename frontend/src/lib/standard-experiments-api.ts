"use client";

import type { CoreApiActor } from "@/lib/core-api-shared";
import type { V2ExpLibraryItem } from "@/lib/v2/v2-exp-api";
import { fetchV2ExpLibraryList } from "@/lib/v2/v2-exp-api";
import { UserRole } from "@/types/auth";

export type StandardExperimentStatus = "draft" | "reviewing" | "approved" | "archived";

export type StandardExperiment = {
  id: string;
  title: string;
  summary: string;
  subjectCode: string;
  gradeBand: string;
  status: StandardExperimentStatus;
  tags: string[];
  details: {
    objectives: string;
    materials: string;
    steps: string;
    materialItems?: Array<{
      id: string;
      name: string;
      spec?: string;
      quantity?: number;
      unit?: string;
      note?: string;
    }>;
    stepItems?: Array<{
      id: string;
      title: string;
      description: string;
      safetyTip?: string;
      expectedOutcome?: string;
      media?: Array<{
        type: "image" | "video";
        url: string;
      }>;
    }>;
  };
  sourceType: "standard";
  createdBy: string;
  createdByName: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName?: string;
  coveragePoints?: string[];
  requiredCoveragePoints?: number;
  coverage?: {
    covered: number;
    required: number;
    ratio: number;
  };
  version?: number;
  bindingCount?: number;
};

export type StandardBinding = {
  id: string;
  standardId: string;
  experimentId: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
};

export type StandardExperimentOwner = {
  userId: string;
  userName: string;
  count: number;
};

export type StandardExperimentAudit = {
  id: string;
  experimentId: string;
  action: "create" | "update" | "delete" | "rollback";
  actorId: string;
  actorName: string;
  changedFields: string[];
  createdAt: string;
  reason?: string;
};

export type StandardTreeMetric = {
  key: string;
  count: number;
  reviewingCount: number;
};

type ListActor = {
  role: UserRole;
  userId: string;
  userName?: string;
  orgId: string;
};

function toCore(actor: ListActor): CoreApiActor {
  return {
    role: actor.role,
    userId: actor.userId,
    userName: (actor.userName ?? actor.userId).trim() || actor.userId,
    orgId: actor.orgId,
  };
}

function v2StatusToStandardStatus(s: string | null | undefined): StandardExperimentStatus {
  const v = (s ?? "y").toLowerCase();
  if (v === "n") return "archived";
  if (v === "t") return "draft";
  return "approved";
}

function v2LibraryToStandard(row: V2ExpLibraryItem, orgId: string): StandardExperiment {
  return {
    id: row.libExpId,
    title: row.libExpName,
    summary: row.comments ?? "",
    subjectCode: row.subjectId ?? "",
    gradeBand: (row.grades ?? []).map((g) => g.gradeId).filter(Boolean).join(","),
    status: v2StatusToStandardStatus(row.status),
    tags: [],
    details: { objectives: "", materials: "", steps: "" },
    sourceType: "standard",
    createdBy: row.createUserId ?? "",
    createdByName: "",
    orgId,
    createdAt: row.createTime ?? "",
    updatedAt: row.updateTime ?? row.createTime ?? "",
    updatedBy: "",
  };
}

function notSupported(): never {
  throw new Error("该能力在 V2 标准试验库阶段未开放，请使用「实验列表配置」维护标准试验。");
}

export async function listStandardExperiments(
  actor: ListActor,
  query: {
    ownerId?: string;
    subject?: string;
    status?: StandardExperimentStatus | "all";
    keyword?: string;
    page?: number;
    pageSize?: number;
    phase?: string;
    grade?: string;
  },
) {
  void query.ownerId;
  void query.phase;
  void query.grade;
  const core = toCore(actor);
  const v2Status =
    query.status === "archived" ? "n" : query.status === "draft" ? "t" : query.status === "approved" ? "y" : undefined;
  const data = await fetchV2ExpLibraryList(core, {
    keyword: query.keyword?.trim() || undefined,
    subjectId: query.subject?.trim() || undefined,
    status: v2Status,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 50,
  });
  const items = data.items.map((r) => v2LibraryToStandard(r, actor.orgId));
  return {
    items,
    total: data.total,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 50,
  };
}

export async function getBindings(_actor: ListActor, _standardId: string): Promise<StandardBinding[]> {
  notSupported();
}

export async function batchBindExperiments(
  _actor: ListActor,
  _standardId: string,
  _expIds: string[],
): Promise<StandardBinding[]> {
  notSupported();
}

export async function createStandardExperiment(_actor: ListActor, _body: Record<string, unknown>): Promise<StandardExperiment> {
  notSupported();
}

export async function updateStandardExperiment(
  _actor: ListActor,
  _id: string,
  _body: Record<string, unknown>,
): Promise<StandardExperiment> {
  notSupported();
}

export async function deleteStandardExperiment(_actor: ListActor, _id: string): Promise<{ id: string }> {
  notSupported();
}

export async function listStandardExperimentOwners(_actor: ListActor): Promise<StandardExperimentOwner[]> {
  notSupported();
}

export async function listStandardExperimentAudits(_actor: ListActor, _limit = 30): Promise<StandardExperimentAudit[]> {
  notSupported();
}

export async function listStandardExperimentVersions(
  _actor: ListActor,
  _id: string,
): Promise<
  Array<{
    id: string;
    version: number;
    editorName: string;
    editedAt: string;
    snapshot?: {
      objectives: string;
      materials: string;
      steps: string;
    };
  }>
> {
  notSupported();
}

export async function compareStandardExperimentVersions(
  _actor: ListActor,
  _id: string,
  _from: number,
  _to: number,
): Promise<{
  from: number;
  to: number;
  fieldDiffs: Array<{ field: string; from: string; to: string }>;
}> {
  notSupported();
}

export async function rollbackStandardExperimentVersion(
  _actor: ListActor,
  _id: string,
  _version: number,
): Promise<StandardExperiment> {
  notSupported();
}

export async function batchUpdateStandardExperimentStatus(
  _actor: ListActor,
  _ids: string[],
  _status: StandardExperimentStatus,
): Promise<{ updatedIds: string[]; skippedIds: string[] }> {
  notSupported();
}

export async function listStandardExperimentTreeMetrics(_actor: ListActor): Promise<StandardTreeMetric[]> {
  notSupported();
}

export async function aiOptimizeStandardExperimentField(
  _actor: ListActor,
  _field: "objectives" | "steps",
  _draft: string,
): Promise<{ field: "objectives" | "steps"; draft: string; optimized: string }> {
  notSupported();
}
