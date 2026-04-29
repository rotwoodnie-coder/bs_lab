"use client";

import { getExperimentCatalogTenantId } from "@/lib/core-api-shared";
import type { ApiActor } from "@/lib/new-core-api";
import { UserRole } from "@/types/auth";

function demoUserId(role: UserRole): string {
  switch (role) {
    case UserRole.RESEARCHER:
      return "researcher-a";
    case UserRole.TEACHER:
      return "teacher-a";
    case UserRole.DISTRICT_ADMIN:
      return "district-admin-1";
    case UserRole.SUPER_ADMIN:
      return "super-admin-1";
    case UserRole.SCHOOL_ADMIN:
      return "admin-1";
    default:
      return "teacher-a";
  }
}

/** 与目录 API 请求头一致，用于同源媒体代理播放地址 query。 */
export function experimentCatalogDemoStreamActor(role: UserRole, orgId: string): ApiActor {
  const userId = demoUserId(role);
  return {
    role,
    orgId,
    userId,
    userName: userId,
    tenantId: getExperimentCatalogTenantId(),
    appId: "console",
  };
}

export type CatalogCategory = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: number;
};

export type CatalogCore = {
  id: string;
  tenantId?: string;
  appId?: string;
  standardCode: string;
  displayName: string;
  nameFingerprint: string;
  fingerprintVersion: number;
  stageId: string;
  subjectId: string;
  gradeIds: string[];
  isMandatory: number;
  expCategoryId: string;
  officialVideoRegistryId: string | null;
  officialVideoReachable?: boolean | null;
  officialVideoProcessingStatus?: "READY" | "STALE" | "PROCESSING" | "FAILED" | "NONE" | null;
  /** 同源代理或对象存储直链的预览地址。 */
  officialVideoPosterUrl?: string | null;
  officialVideoErrorCode?: string | null;
  status: number;
  createdByActorId?: string | null;
  updatedByActorId?: string | null;
  createdByActorDisplayName?: string | null;
  updatedByActorDisplayName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  stageName?: string;
  subjectName?: string;
  minGradeName?: string;
  maxGradeName?: string;
  categoryName?: string;
  categoryCode?: string;
  officialVideoTitle?: string | null;
  pendingEdgeCount?: number;
  closureComplete?: boolean;
};

export type CatalogEdge = {
  id: string;
  kind: "chapter" | "material" | "media";
  tenantId?: string;
  appId?: string;
  standardExperimentId?: string;
  sourceType: string;
  reviewStatus: string;
  sourceActorId?: string | null;
  idempotencyKey?: string;
  evidenceCount: number;
  supportTeacherCount: number;
  weightScore: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  textbookId?: string;
  textbookTitle?: string | null;
  textbookEditionId?: string | null;
  textbookEditionName?: string | null;
  textbookEditionCode?: string | null;
  chapterId?: string;
  chapterTitle?: string | null;
  materialId?: string;
  materialDisplayName?: string | null;
  standardQty?: string;
  qtyUnit?: string;
  registryId?: string;
  mediaRegistryTitle?: string | null;
  mediaKind?: string;
  rejectReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
};

export type CatalogDimensionGapsPayload = {
  bareTableCount: number;
  linkedCatalogCount: number;
  unlinked: CatalogCore[];
};
