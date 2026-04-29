"use client";

import type { ReactNode } from "react";

import { VideoPreviewCard } from "@bs-lab/ui";

import { useDevInspector } from "@/contexts/dev-inspector-context";
import { cn } from "@/lib/utils";
import type { CatalogCore } from "@/lib/experiment-catalog-api";

import type { SchoolDimensionSnapshot } from "../../education/subject-grades/page.types";
import { formatCatalogGradeRange } from "../catalog-grade-range-display";
import { showCoreGutField } from "../experiment-catalog-display-policy";
import { ExperimentCatalogCopyId } from "./experiment-catalog-copy-id";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(6.5rem,8.5rem)_1fr] gap-x-3 gap-y-1 border-b border-border/50 py-2 text-sm last:border-0 sm:grid-cols-[10rem_1fr]">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  );
}

function dash(v: string | null | undefined): string {
  if (v == null || v === "") return "—";
  return v;
}

function humanDim(name: string | null | undefined, pendingHint: string): string {
  const t = name?.trim();
  return t ? t : pendingHint;
}

const MANDATORY: Record<number, string> = { 0: "选做", 1: "必做" };
const CORE_STATUS: Record<number, string> = { 0: "停用", 1: "启用" };

function idSuffix(technical: boolean, id: string): ReactNode {
  if (!technical) return null;
  return (
    <span className="text-xs text-muted-foreground">
      （id: {id}）
      <ExperimentCatalogCopyId value={id} label=" id" />
    </span>
  );
}

function actorLine(c: CatalogCore, which: "created" | "updated", dev: boolean): string {
  const id = which === "created" ? c.createdByActorId : c.updatedByActorId;
  const label =
    which === "created"
      ? ((c as { createdByActorDisplayName?: string | null }).createdByActorDisplayName ?? null)
      : ((c as { updatedByActorDisplayName?: string | null }).updatedByActorDisplayName ?? null);
  if (label?.trim()) {
    const base = label.trim();
    return dev && id?.trim() ? `${base}（操作者 id：${id.trim()}）` : base;
  }
  if (id?.trim()) return dev ? id.trim() : "已记录";
  return "—";
}

function categoryHumanLine(c: CatalogCore, devMode: boolean): ReactNode {
  const name = c.categoryName?.trim();
  const code = c.categoryCode?.trim();
  if (name && code && devMode) {
    return (
      <>
        {name}
        <span className="text-xs text-muted-foreground"> · 类型编码 {code}</span>
      </>
    );
  }
  if (name) return name;
  if (code && devMode) return <span className="text-muted-foreground">类型编码 {code}</span>;
  return <span className="text-muted-foreground">实验类型名称待同步</span>;
}

function coreReadonlyColumns(props: {
  core: CatalogCore;
  eduSnapshot: SchoolDimensionSnapshot | null;
  officialVideoStreamSrc: string | null;
  devMode: boolean;
}): { primary: ReactNode; secondary: ReactNode } {
  const c = props.core;
  const gradeRange = formatCatalogGradeRange(c, props.eduSnapshot);
  const rid = c.officialVideoRegistryId?.trim() ?? "";
  const unreachable = c.officialVideoReachable === false && Boolean(rid);
  const videoTitle = c.officialVideoTitle?.trim() || null;
  const { devMode } = props;

  const primary = (
    <>
      <Field label="展示名称">{c.displayName}</Field>
      {showCoreGutField("standardCode", devMode) ? (
        <Field label="官方实验编号">
          <span className="font-mono text-xs sm:text-sm">{c.standardCode}</span>
          <ExperimentCatalogCopyId value={c.standardCode} label="编号" />
        </Field>
      ) : null}
      {showCoreGutField("nameFingerprint", devMode) ? (
        <Field label="规范名指纹">
          <span className="break-all font-mono text-xs">{c.nameFingerprint}</span>
        </Field>
      ) : null}
      {showCoreGutField("fingerprintVersion", devMode) ? (
        <Field label="指纹算法版本">{c.fingerprintVersion}</Field>
      ) : null}
      <Field label="学段">
        {humanDim(c.stageName, "学段名称待同步")} {idSuffix(devMode, c.stageId)}
      </Field>
      <Field label="学科">
        {humanDim(c.subjectName, "学科名称待同步")} {idSuffix(devMode, c.subjectId)}
      </Field>
      <Field label="适用年级">
        {gradeRange || "年级范围待同步"}{" "}
        {devMode ? (
          <span className="text-xs text-muted-foreground">
            （年级 id：{(c.gradeIds ?? []).join("、")}）
            <ExperimentCatalogCopyId value={(c.gradeIds ?? []).join(",")} label="年级 id" />
          </span>
        ) : null}
      </Field>
      <Field label="必做">{MANDATORY[c.isMandatory] ?? String(c.isMandatory)}</Field>
      <Field label="实验类型">
        {categoryHumanLine(c, devMode)} {idSuffix(devMode, c.expCategoryId)}
      </Field>
      <Field label="官方视频">
        <div className="space-y-2">
          <VideoPreviewCard
            title={videoTitle}
            caption={
              rid && !unreachable
                ? videoTitle
                  ? "官方视频（同源代理预览）"
                  : "媒体库已绑定，标题待返回"
                : rid
                  ? "已绑定媒体登记"
                  : undefined
            }
            streamSrc={rid && !unreachable ? props.officialVideoStreamSrc : null}
            unreachable={unreachable}
          />
          {devMode && rid ? (
            <span className="text-xs text-muted-foreground">
              登记 id：{rid}
              <ExperimentCatalogCopyId value={rid} />
            </span>
          ) : null}
        </div>
      </Field>
    </>
  );

  const secondary = (
    <>
      <Field label="记录状态">{CORE_STATUS[c.status] ?? String(c.status)}</Field>
      {showCoreGutField("tenantApp", devMode) ? (
        <Field label="租户 / 应用">
          {dash(c.tenantId)} · {dash(c.appId)}
        </Field>
      ) : null}
      {showCoreGutField("primaryKey", devMode) ? (
        <Field label="主键 id">
          <span className="font-mono text-xs">{c.id}</span>
          <ExperimentCatalogCopyId value={c.id} />
        </Field>
      ) : null}
      <Field label="创建人">{actorLine(c, "created", devMode)}</Field>
      <Field label="最后修改人">{actorLine(c, "updated", devMode)}</Field>
      <Field label="创建时间">{dash(c.createdAt)}</Field>
      <Field label="更新时间">{dash(c.updatedAt)}</Field>
      {c.deletedAt || devMode ? <Field label="软删时间">{dash(c.deletedAt)}</Field> : null}
    </>
  );

  return { primary, secondary };
}

/** 可编辑视图下：技术字段 + 审计信息（与表单主区去重） */
export function ExperimentDetailCoreAuditSection(props: {
  core: CatalogCore;
  /** 紧凑弱化样式，用于详情左栏辅助信息 */
  compact?: boolean;
  className?: string;
}) {
  const c = props.core;
  const { enabled: devMode } = useDevInspector();

  return (
    <dl
      className={cn(
        "min-w-0",
        props.compact &&
          "[&>div]:border-border/40 [&>div]:py-1.5 [&_dd]:text-[11px] [&_dd]:text-muted-foreground [&_dt]:text-[11px]",
        props.className,
      )}
    >
      {showCoreGutField("standardCode", devMode) ? (
        <Field label="官方实验编号">
          <span className="font-mono text-xs sm:text-sm">{c.standardCode}</span>
          <ExperimentCatalogCopyId value={c.standardCode} label="编号" />
        </Field>
      ) : null}
      {showCoreGutField("nameFingerprint", devMode) ? (
        <Field label="规范名指纹">
          <span className="break-all font-mono text-xs">{c.nameFingerprint}</span>
        </Field>
      ) : null}
      {showCoreGutField("fingerprintVersion", devMode) ? (
        <Field label="指纹算法版本">{c.fingerprintVersion}</Field>
      ) : null}
      {showCoreGutField("tenantApp", devMode) ? (
        <Field label="租户 / 应用">
          {dash(c.tenantId)} · {dash(c.appId)}
        </Field>
      ) : null}
      {showCoreGutField("primaryKey", devMode) ? (
        <Field label="主键 id">
          <span className="font-mono text-xs">{c.id}</span>
          <ExperimentCatalogCopyId value={c.id} />
        </Field>
      ) : null}
      <Field label="创建人">{actorLine(c, "created", devMode)}</Field>
      <Field label="最后修改人">{actorLine(c, "updated", devMode)}</Field>
      <Field label="创建时间">{dash(c.createdAt)}</Field>
      <Field label="更新时间">{dash(c.updatedAt)}</Field>
      {c.deletedAt || devMode ? <Field label="软删时间">{dash(c.deletedAt)}</Field> : null}
    </dl>
  );
}

type CoreFieldsProps = {
  core: CatalogCore;
  eduSnapshot?: SchoolDimensionSnapshot | null;
  officialVideoStreamSrc: string | null;
  /** 由外层统一标题与边框时传 true，仅渲染 dl */
  embedded?: boolean;
};

/** 标准实验 Core：无管理权限时的完整只读视图；embedded 时由外层提供标题与容器 */
export function ExperimentDetailCoreFields(props: CoreFieldsProps) {
  const { enabled: devMode } = useDevInspector();
  const snap = props.eduSnapshot ?? null;
  const cols = coreReadonlyColumns({
    core: props.core,
    eduSnapshot: snap,
    officialVideoStreamSrc: props.officialVideoStreamSrc,
    devMode,
  });
  const body = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-x-6">
      <dl className="min-w-0">{cols.primary}</dl>
      <dl className="min-w-0">{cols.secondary}</dl>
    </div>
  );

  if (props.embedded) {
    return body;
  }

  const c = props.core;
  return (
    <section className="rounded-md border border-border bg-muted/10 px-3 py-2 sm:px-4">
      <h3 className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
               {devMode ? (
          <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
            排障
            <ExperimentCatalogCopyId value={c.id} label="主键" />
          </span>
        ) : null}
      </h3>
      {body}
    </section>
  );
}
