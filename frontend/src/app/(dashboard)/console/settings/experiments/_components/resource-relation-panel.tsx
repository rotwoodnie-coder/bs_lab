"use client";

import type { ReactNode } from "react";

import { Badge, Button } from "@bs-lab/ui";

import { useDevInspector } from "@/contexts/dev-inspector-context";
import type { CatalogEdge } from "@/lib/experiment-catalog-api";
import type { UserRole } from "@/types/auth";

import { showEdgeGutField } from "../experiment-catalog-display-policy";
import { ExperimentCatalogCopyId } from "./experiment-catalog-copy-id";
import { useResourceEdgeDisplayNames } from "./use-resource-edge-display-names";

function kindLabel(k: CatalogEdge["kind"]): string {
  if (k === "chapter") return "章节映射";
  if (k === "material") return "材料清单";
  return "推荐媒体";
}

function reviewBadge(status: string) {
  if (status === "APPROVED") {
    return (
      <Badge variant="default" className="font-normal">
        已通过
      </Badge>
    );
  }
  if (status === "PENDING") {
    return (
      <Badge variant="outline" className="border-primary/40 font-normal text-foreground">
        待审核
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge variant="destructive" className="font-normal">
        已驳回
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-normal">
      {status}
    </Badge>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 border-b border-border/40 py-1.5 text-xs last:border-0 sm:text-sm">
      <span className="min-w-[7rem] shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words text-foreground">{value}</span>
    </div>
  );
}

function dash(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  return String(v);
}

function chapterCopyPayload(e: CatalogEdge): string {
  return `textbook=${e.textbookId ?? ""};chapter=${e.chapterId ?? ""};edition=${e.textbookEditionId ?? ""}`;
}

/** 标准实验映射边：关系治理台（状态色标 + 审核 + 可选硬删 + 技术字段） */
export function ResourceRelationPanel(props: {
  edges: CatalogEdge[];
  /** 用于按登记 id / 材料 id 拉取可读名称 */
  role: UserRole;
  orgId: string;
  canReview: boolean;
  canEdgePurge: boolean;
  onApproveEdge: (e: CatalogEdge) => void;
  onOpenReject: (e: CatalogEdge) => void;
  onDeleteEdge: (e: CatalogEdge) => void;
}) {
  const { enabled: t } = useDevInspector();
  const { resolveMaterialName, resolveMediaTitle, namesLoading } = useResourceEdgeDisplayNames(
    props.edges,
    props.role,
    props.orgId,
  );

  if (props.edges.length === 0) {
    return <p className="text-sm text-muted-foreground">当前筛选下暂无映射边记录。</p>;
  }

  return (
    <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-1">
      {props.edges.map((e) => (
        <div key={`${e.kind}-${e.id}`} className="rounded-md border border-border bg-card p-3 shadow-none">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{kindLabel(e.kind)}</span>
            {reviewBadge(e.reviewStatus)}
            {t ? (
              <Badge variant="outline" className="font-mono text-[11px]">
                id {e.id}
              </Badge>
            ) : null}
          </div>
          {e.reviewStatus === "REJECTED" && e.rejectReason ? (
            <p className="mb-2 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-xs text-foreground">
              驳回说明：{e.rejectReason}
            </p>
          ) : null}
          {e.reviewStatus === "PENDING" ? (
            <p className="mb-2 text-xs text-muted-foreground">该资源正在审核流程中。</p>
          ) : null}
          <div className="rounded-md bg-muted/20 px-2 py-1">
            {showEdgeGutField("tenantApp", t) ? (
              <Row label="租户 / 应用" value={`${dash(e.tenantId)} / ${dash(e.appId)}`} />
            ) : null}
            {showEdgeGutField("standardExperimentId", t) ? (
              <Row label="标准实验 id" value={dash(e.standardExperimentId)} />
            ) : null}
            {showEdgeGutField("sourceType", t) ? <Row label="来源类型" value={e.sourceType} /> : null}
            {showEdgeGutField("idempotencyKey", t) ? (
              <Row label="幂等键" value={<span className="break-all font-mono text-[11px]">{dash(e.idempotencyKey)}</span>} />
            ) : null}
            {showEdgeGutField("evidenceCount", t) ? <Row label="证据次数" value={e.evidenceCount} /> : null}
            {showEdgeGutField("supportTeacherCount", t) ? <Row label="支持教师数" value={e.supportTeacherCount} /> : null}
            {showEdgeGutField("weightScore", t) ? <Row label="权重分" value={e.weightScore} /> : null}
            {showEdgeGutField("sortOrder", t) ? <Row label="排序" value={e.sortOrder} /> : null}
            {showEdgeGutField("edgeCreatedAt", t) ? <Row label="创建时间" value={dash(e.createdAt)} /> : null}
            {showEdgeGutField("edgeUpdatedAt", t) ? <Row label="更新时间" value={dash(e.updatedAt)} /> : null}
            {showEdgeGutField("sourceActorId", t) ? (
              <Row label="贡献者标识" value={dash(e.sourceActorId)} />
            ) : (
              <Row label="贡献者" value={e.sourceActorId?.trim() ? "已记录" : "—"} />
            )}
            {e.kind === "chapter" ? (
              <>
                {t ? (
                  <>
                    <Row label="教材 id" value={dash(e.textbookId)} />
                    <Row label="教材版本 id" value={dash(e.textbookEditionId)} />
                    <Row label="章节 id" value={dash(e.chapterId)} />
                    <Row
                      label="版本名称"
                      value={
                        <>
                          {dash(e.textbookEditionName)}
                          {e.textbookEditionCode ? (
                            <span className="text-muted-foreground"> · {e.textbookEditionCode}</span>
                          ) : null}
                        </>
                      }
                    />
                  </>
                ) : (
                  <>
                    <Row
                      label="教材"
                      value={
                        e.textbookTitle?.trim() ? (
                          e.textbookTitle
                        ) : (
                          <span className="text-muted-foreground">教材名称待解析</span>
                        )
                      }
                    />
                    <Row
                      label="章节"
                      value={
                        e.chapterTitle?.trim() ? (
                          e.chapterTitle
                        ) : (
                          <span className="text-muted-foreground">章节名称待解析</span>
                        )
                      }
                    />
                    <Row
                      label="教材版本"
                      value={
                        <>
                          {dash(e.textbookEditionName)}
                          {e.textbookEditionCode ? (
                            <span className="text-xs text-muted-foreground"> · {e.textbookEditionCode}</span>
                          ) : null}
                        </>
                      }
                    />
                    <Row
                      label="章节映射"
                      value={
                        <span className="text-muted-foreground">
                          可读名称缺失时可通过引用键排查映射。
                          <ExperimentCatalogCopyId value={chapterCopyPayload(e)} label="复制引用键" />
                        </span>
                      }
                    />
                  </>
                )}
              </>
            ) : null}
            {e.kind === "material" ? (
              <>
                <Row
                  label="材料"
                  value={
                    (() => {
                      const name = resolveMaterialName(e)?.trim() || e.materialDisplayName?.trim();
                      if (name) return <>{name}</>;
                      if (namesLoading) return <>材料名称加载中…</>;
                      return <>材料（名称暂不可读）</>;
                    })()
                  }
                />
                <Row label="建议用量" value={`${dash(e.standardQty)} ${dash(e.qtyUnit)}`} />
                {t ? <Row label="材料 id" value={dash(e.materialId)} /> : null}
              </>
            ) : null}
            {e.kind === "media" ? (
              <>
                <Row
                  label="媒体标题"
                  value={
                    (() => {
                      const title = resolveMediaTitle(e)?.trim() || e.mediaRegistryTitle?.trim();
                      if (title) return <>{title}</>;
                      if (namesLoading) return <>媒体标题加载中…</>;
                      return <>媒体（标题暂不可读）</>;
                    })()
                  }
                />
                <Row label="媒体类型" value={dash(e.mediaKind)} />
                {t ? <Row label="登记 id" value={dash(e.registryId)} /> : null}
              </>
            ) : null}
            {showEdgeGutField("reviewedBy", t) ? <Row label="审核人" value={dash(e.reviewedBy)} /> : null}
            {showEdgeGutField("reviewedAt", t) ? <Row label="审核时间" value={dash(e.reviewedAt)} /> : null}
          </div>
          <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-border pt-2">
            {props.canReview && e.reviewStatus === "PENDING" ? (
              <>
                <Button type="button" size="sm" variant="secondary" onClick={() => props.onApproveEdge(e)}>
                  通过
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => props.onOpenReject(e)}>
                  驳回
                </Button>
              </>
            ) : null}
            {props.canEdgePurge ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="font-normal"
                onClick={() => props.onDeleteEdge(e)}
              >
                硬删
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
