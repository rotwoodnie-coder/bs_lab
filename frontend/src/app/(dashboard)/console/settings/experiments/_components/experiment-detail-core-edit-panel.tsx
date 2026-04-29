"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@bs-lab/ui";

import type { CatalogCategory, CatalogCore } from "@/lib/experiment-catalog-api";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import type { V2ExpStatus } from "@/lib/v2/v2-exp-api";
import { UserRole } from "@/types/auth";
import type { SchoolDimensionSnapshot } from "../../education/subject-grades/page.types";
import { useExperimentDetailCoreEdit } from "../use-experiment-detail-core-edit";
import { CatalogGradeScopeField } from "./catalog-grade-scope-field";
import { ExperimentDetailCoreAuditSection } from "./experiment-detail-core-fields";
import { VideoManagerCatalogOfficialField } from "./video-manager-catalog-official-field";

export function ExperimentDetailCoreEditPanel(props: {
  core: CatalogCore;
  role: UserRole;
  orgId: string;
  snapshot: SchoolDimensionSnapshot | null;
  categories: CatalogCategory[];
  onAfterSave: () => Promise<void>;
  focusOfficialVideo?: boolean;
  onFocusOfficialVideoConsumed?: () => void;
  /** 为 true 时不包外层 section，由父级「标准实验主体」统一容器 */
  embedded?: boolean;
  /** V2 标准试验库：不展示官方视频绑定区 */
  hideOfficialVideo?: boolean;
}) {
  const e = useExperimentDetailCoreEdit({
    core: props.core,
    role: props.role,
    orgId: props.orgId,
    snapshot: props.snapshot,
    categories: props.categories,
    onAfterSave: props.onAfterSave,
    v2ExpLibraryEdit: Boolean(props.hideOfficialVideo),
  });
  const videoFieldRef = e.videoFieldRef;

  React.useEffect(() => {
    if (props.hideOfficialVideo || !props.focusOfficialVideo) return;
    const t = window.setTimeout(() => {
      videoFieldRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      props.onFocusOfficialVideoConsumed?.();
    }, 420);
    return () => window.clearTimeout(t);
  }, [props.focusOfficialVideo, props.hideOfficialVideo, props.onFocusOfficialVideoConsumed, videoFieldRef]);

  const s = e.snapshot;
  const streamActor = React.useMemo(
    () => buildMaterialsApiActor(props.role, props.orgId, "catalog-experiment-detail"),
    [props.role, props.orgId],
  );

  const fieldsSansVideo = (
    <>
      <div className="space-y-1">
        <Label>实验名称</Label>
        <Input value={e.name} onChange={(ev) => e.setName(ev.target.value)} />
      </div>
      {props.hideOfficialVideo ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="detail-lib-status">发布状态</Label>
            <Select value={e.libraryStatus} onValueChange={(v) => e.setLibraryStatus(v as V2ExpStatus)}>
              <SelectTrigger id="detail-lib-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="t">草稿</SelectItem>
                <SelectItem value="y">已发布</SelectItem>
                <SelectItem value="n">已停用</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">停用后前台检索默认不展示该实验。</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="detail-lib-comments">备注</Label>
            <Textarea
              id="detail-lib-comments"
              rows={3}
              className="min-h-[4.5rem] resize-y font-mono text-xs"
              placeholder="可填写 standard_code: 原编码 等迁移备注"
              value={e.comments}
              onChange={(ev) => e.setComments(ev.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
          <div className="space-y-0.5">
            <Label htmlFor="detail-core-status">记录状态</Label>
            <p className="text-xs text-muted-foreground">停用后前台检索默认不展示该实验。</p>
          </div>
          <Switch
            id="detail-core-status"
            checked={e.status === "1"}
            onCheckedChange={(on) => e.setStatus(on ? "1" : "0")}
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>学段</Label>
          <Select value={e.stage} onValueChange={e.setStage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(s?.levels ?? [])
                .filter((x) => String(x.status ?? "y").trim().toLowerCase() !== "n")
                .map((x) => (
                  <SelectItem key={x.levelId} value={x.levelId}>
                    {x.levelName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>学科</Label>
          <Select value={e.subject} onValueChange={e.setSubject}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(s?.subjects ?? [])
                .filter((x) => String(x.status ?? "y").trim().toLowerCase() !== "n")
                .map((x) => (
                  <SelectItem key={x.subjectId} value={x.subjectId}>
                    {x.subjectName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <CatalogGradeScopeField
        snapshot={s}
        stageId={e.stage}
        subjectId={e.subject}
        value={e.gradeIds}
        onChange={e.setGradeIds}
      />
      <div className="space-y-2">
        <Label>必做</Label>
        <RadioGroup value={e.mandatory} onValueChange={e.setMandatory} className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <RadioGroupItem value="1" id="detail-mand-1" />
            必做
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <RadioGroupItem value="0" id="detail-mand-0" />
            选做
          </label>
        </RadioGroup>
      </div>
      <div className="space-y-1">
        <Label>实验类型</Label>
        <Select value={e.cat} onValueChange={e.setCat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.categories.map((c: CatalogCategory) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const saveRow = (
    <div className="flex justify-end pt-1">
      <Button type="button" onClick={() => void e.save()}>
        保存修改
      </Button>
    </div>
  );

  const videoField = (
    <VideoManagerCatalogOfficialField
      hideFieldTitle={Boolean(props.embedded)}
      videoFieldRef={e.videoFieldRef}
      registryId={e.video}
      onRegistryIdChange={e.setVideo}
      actor={streamActor}
      officialVideoReachable={props.core.officialVideoReachable}
    />
  );

  const formInnerStacked = (
    <div className="space-y-3">
      {fieldsSansVideo}
      {props.hideOfficialVideo ? null : videoField}
      {saveRow}
    </div>
  );

  const formInnerEmbedded = props.hideOfficialVideo ? (
    <div className="flex flex-col gap-4">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="rounded-md border border-dashed border-border/50 bg-muted/5 px-2.5 py-2">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">系统记录</p>
          <ExperimentDetailCoreAuditSection core={props.core} compact />
        </div>
        <div className="space-y-3">{fieldsSansVideo}</div>
        {saveRow}
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="rounded-md border border-dashed border-border/50 bg-muted/5 px-2.5 py-2">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">系统记录</p>
          <ExperimentDetailCoreAuditSection core={props.core} compact />
        </div>
        <div className="space-y-3">{fieldsSansVideo}</div>
        {saveRow}
      </div>
      <div className="min-w-0 border-t border-border pt-4 lg:w-[min(100%,400px)] lg:shrink-0 lg:border-border lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <div className="space-y-2 lg:sticky lg:top-2 lg:self-start">
          <div>
            <p className="text-sm font-semibold text-foreground">实验视频</p>
            <p className="mt-0.5 text-xs text-muted-foreground">绑定、预览与替换官方视频。</p>
          </div>
          {videoField}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {props.embedded ? (
        formInnerEmbedded
      ) : (
        <section className="rounded-md border border-border bg-muted/5 px-3 py-3 sm:px-4">{formInnerStacked}</section>
      )}

      <AlertDialog open={e.guardOpen} onOpenChange={(o) => !o && e.cancelGuard()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认更改学段或学科？</AlertDialogTitle>
            <AlertDialogDescription>
              更改学段或学科将导致当前已选的年级范围与现有关联章节映射可能不再匹配，后续需重新核对映射关系。是否继续保存？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={e.cancelGuard}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={e.confirmGuard}>仍要保存</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
