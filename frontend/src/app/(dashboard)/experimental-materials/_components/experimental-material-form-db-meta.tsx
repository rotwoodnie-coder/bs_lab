"use client";

import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@bs-lab/ui";
import { ChevronDown } from "@bs-lab/ui/icons";

import type { ExperimentalMaterialRecord } from "@/data/experimental-materials";
import type { ExperimentalMaterialDetailStats } from "../page.types";

function MetaRow(props: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border border-border px-3 py-2">
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <div className="break-all text-sm text-foreground">{props.value}</div>
    </div>
  );
}

export function ExperimentalMaterialFormDbMeta(props: {
  record: ExperimentalMaterialRecord | null;
  detailStats: ExperimentalMaterialDetailStats | null;
}) {
  const r = props.record;
  const [open, setOpen] = React.useState(false);
  const [proxyOpen, setProxyOpen] = React.useState(false);
  if (!r) return null;

  const version = r.version != null ? String(r.version) : "—";
  const createdBy = r.displayOwnerName?.trim() ? r.displayOwnerName : r.createdByActorId || "—";
  const updatedBy = r.updatedByActorId || "—";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted/40">
        <span>系统与排障信息</span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3 rounded-md border border-border bg-muted/10 p-3">
        <p className="text-xs text-muted-foreground">
          主键、操作者与版本号等仅用于权限核对与排障，默认折叠以保持表单专注教学内容。
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <MetaRow label="材料主键 ID" value={r.id} />
          <MetaRow label="乐观锁版本" value={version} />
          <MetaRow label="封面登记 ID" value={r.coverRegistryId?.trim() ? r.coverRegistryId : "—"} />
          <MetaRow label="创建时间" value={r.createdAt ? r.createdAt.slice(0, 19).replace("T", " ") : "—"} />
          <MetaRow label="最后修改时间" value={r.updatedAt ? r.updatedAt.slice(0, 19).replace("T", " ") : "—"} />
          <MetaRow label="创建人" value={createdBy} />
          <MetaRow label="最后修改人 actor" value={updatedBy} />
        </div>
        {props.detailStats ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <MetaRow label="权限范围条数" value={String(props.detailStats.scopesCount)} />
            <MetaRow label="资源附件条数" value={String(props.detailStats.resourcesCount)} />
          </div>
        ) : null}

        <Collapsible open={proxyOpen} onOpenChange={setProxyOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
            <span>同步冗余字段（仅排障）</span>
            <ChevronDown className={`size-3 shrink-0 transition-transform ${proxyOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 grid gap-2 sm:grid-cols-2">
            <MetaRow label="分类冗余" value={r.categoryNameProxy?.trim() ? r.categoryNameProxy : "—"} />
            <MetaRow label="安全标签冗余" value={r.safetyTagsProxy?.trim() ? r.safetyTagsProxy : "—"} />
          </CollapsibleContent>
        </Collapsible>
      </CollapsibleContent>
    </Collapsible>
  );
}
