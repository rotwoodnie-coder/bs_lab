"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Switch,
} from "@bs-lab/ui";
import { MediaRegistryImageField } from "@/components/business/media/MediaRegistryImageField";
import type { ApiActor } from "@/lib/new-core-api";
import type {
  ExperimentalMaterialFormState,
  ExperimentalMaterialFormDialogMode,
  ExperimentalMaterialDetailStats,
  ExperimentalMaterialFormDimensionsLists,
  ExperimentalMaterialRelatedExperiment,
} from "../page.types";
import type { ExperimentalMaterialRecord } from "@/data/experimental-materials";
import type { MaterialCoverThumbInfo } from "@/lib/experimental-materials-api";
import { ExperimentalMaterialCoverThumbStatus } from "./experimental-material-cover-thumb-status";
import { ExperimentalMaterialFormBody } from "./experimental-material-form-body";
import { ExperimentalMaterialFormDbMeta } from "./experimental-material-form-db-meta";
import { ExperimentalMaterialRelatedExperimentsSheet } from "./experimental-material-related-experiments-sheet";

export function ExperimentalMaterialFormDialog(props: {
  open: boolean;
  mode: ExperimentalMaterialFormDialogMode;
  canMaintain: boolean;
  mediaActor: ApiActor;
  form: ExperimentalMaterialFormState;
  dialogRecord: ExperimentalMaterialRecord | null;
  detailStats: ExperimentalMaterialDetailStats | null;
  relatedExperiments: ExperimentalMaterialRelatedExperiment[];
  /** 详情接口 `coverThumb`：视频衍生缩略图状态 */
  coverThumb?: MaterialCoverThumbInfo | null;
  materialFormDimensions?: ExperimentalMaterialFormDimensionsLists | null;
  onOpenChange: (open: boolean) => void;
  onFormChange: (next: ExperimentalMaterialFormState) => void;
  onSubmit: () => void;
  onRequestEditFromView: () => void;
  onRequestCloneFromTemplate: () => void;
  /** 在表单体下方插入的扩展内容（例如材料多图、附加字段） */
  children?: React.ReactNode;
}) {
  const [relatedOpen, setRelatedOpen] = React.useState(false);
  const [versionOpen, setVersionOpen] = React.useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState({
    name: false,
    materialType: false,
    materialPropId: false,
    usage: false,
    numValue: false,
    unitId: false,
  });
  const basicInfoSectionRef = React.useRef<HTMLElement | null>(null);
  const teachingUsageSectionRef = React.useRef<HTMLElement | null>(null);
  const safetySectionRef = React.useRef<HTMLElement | null>(null);
  const relatedSectionRef = React.useRef<HTMLElement | null>(null);

  const isView = props.mode === "view";
  const canWrite = props.canMaintain && !isView;

  React.useEffect(() => {
    if (!props.open) return;
    setFieldErrors({ name: false, materialType: false, materialPropId: false, usage: false, numValue: false, unitId: false });
  }, [props.open]);

  React.useEffect(() => {
    if (!props.open) setMoreActionsOpen(false);
  }, [props.open]);

  const handleSaveClick = React.useCallback(() => {
    if (isView) return;
    const nameOk = Boolean(props.form.name.trim());
    const materialTypeOk = Boolean(props.form.materialType.trim());
    const categoriesOk = Boolean(props.form.materialPropId.trim());
    const usageOk = Boolean(props.form.usage.trim());
    const numValueOk = Boolean(props.form.numValue.trim());
    const unitIdOk = Boolean(props.form.unitId.trim());

    const nextErrors = {
      name: !nameOk,
      materialType: !materialTypeOk,
      materialPropId: !categoriesOk,
      usage: !usageOk,
      numValue: !numValueOk,
      unitId: !unitIdOk,
    };
    setFieldErrors(nextErrors);

    const valid = nameOk && materialTypeOk && categoriesOk && usageOk && numValueOk && unitIdOk;
    if (valid) {
      props.onSubmit();
      return;
    }

    if (!nameOk || !materialTypeOk || !categoriesOk) {
      basicInfoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    teachingUsageSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [isView, props.form, props.onSubmit]);

  const updateField = React.useCallback(
    <K extends keyof ExperimentalMaterialFormState>(key: K, value: ExperimentalMaterialFormState[K]) => {
      props.onFormChange({ ...props.form, [key]: value });
    },
    [props],
  );

  const title = props.mode === "view" ? "查看实验材料" : props.mode === "edit" ? "编辑实验材料" : props.mode === "copy" ? "新增实验材料（自副本）" : "新增实验材料";
  const description = props.mode === "copy" ? "已带入副本字段，请保存后生成新的主档。" : props.mode === "view" ? "只读查看；与新增/编辑使用同一套表单布局。" : undefined;

  const statusActive = props.form.status === "ACTIVE";
  const versionLabel = props.dialogRecord?.version != null ? String(props.dialogRecord.version) : "—";
  const showExtendedActions = (props.mode === "view" || props.mode === "edit") && props.dialogRecord && props.canMaintain;

  const actionButtons = (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={props.onRequestCloneFromTemplate}>
        以此为模板克隆
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setVersionOpen(true)}>
        版本说明
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setRelatedOpen(true)}>
        相关实验{props.relatedExperiments.length ? `（${props.relatedExperiments.length}）` : ""}
      </Button>
    </>
  );

  return (
    <>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-[100vw] flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[92vh] sm:w-auto sm:max-w-6xl sm:rounded-lg">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 sm:px-6 sm:pt-6 xl:px-8 xl:pt-7">
            <DialogHeader className="space-y-3 text-left">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <DialogDescription className="text-xs text-muted-foreground sm:hidden">实验材料</DialogDescription>
                    <DialogTitle>{title}</DialogTitle>
                    {description ? <DialogDescription className="hidden sm:block">{description}</DialogDescription> : null}
                  </div>
                  {isView ? (
                    <Badge variant={statusActive ? "default" : "secondary"}>{statusActive ? "启用" : "已停用"}</Badge>
                  ) : canWrite ? (
                    <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
                      <span className="text-xs text-muted-foreground">启用状态</span>
                      <Switch
                        checked={statusActive}
                        onCheckedChange={(checked) => updateField("status", checked ? "ACTIVE" : "ARCHIVED")}
                        disabled={!props.canMaintain}
                        aria-label="启用或停用材料"
                      />
                    </div>
                  ) : null}
                </div>
                {showExtendedActions ? (
                  <div className="grid gap-2">
                    <div className="hidden flex-wrap justify-end gap-2 sm:flex">{actionButtons}</div>
                    <div className="sm:hidden">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setMoreActionsOpen((prev) => !prev)}
                        className="h-11 w-full justify-between px-3"
                      >
                        更多操作
                        <span className="text-xs text-muted-foreground">{moreActionsOpen ? "收起" : "展开"}</span>
                      </Button>
                      {moreActionsOpen ? <div className="mt-2 grid gap-2 [&>button]:h-10">{actionButtons}</div> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </DialogHeader>
            {(props.mode === "view" || props.mode === "edit") && (props.dialogRecord || props.detailStats) ? (
              <div className="mt-4">
                <ExperimentalMaterialFormDbMeta record={props.dialogRecord} detailStats={props.detailStats} />
              </div>
            ) : null}
            <div className="mt-5 flex pb-5">
              <ExperimentalMaterialFormBody
                form={props.form}
                fieldErrors={fieldErrors}
                canWrite={canWrite}
                dialogRecord={props.dialogRecord}
                basicInfoSectionRef={basicInfoSectionRef}
                teachingUsageSectionRef={teachingUsageSectionRef}
                safetySectionRef={safetySectionRef}
                relatedSectionRef={relatedSectionRef}
                relatedExperimentsCount={props.relatedExperiments.length}
                onOpenRelatedSheet={() => setRelatedOpen(true)}
                updateField={updateField}
                materialDimensions={props.materialFormDimensions ?? null}
                photoBlock={
                  <div className="grid gap-2">
                    <MediaRegistryImageField
                      actor={props.mediaActor}
                      value={props.form.photoUrl}
                      onChange={(nextUrl) => updateField("photoUrl", nextUrl)}
                      disabled={!canWrite}
                      resolveUploadTitle={(file) => props.form.name.trim() || file.name}
                    />
                    <ExperimentalMaterialCoverThumbStatus coverThumb={props.coverThumb ?? null} actor={props.mediaActor} />
                  </div>
                }
              />
            </div>
            {props.children ? <div className="px-4 sm:px-6 xl:px-8 pb-5">{props.children}</div> : null}
          </div>
          <DialogFooter className="border-t border-border bg-background px-4 py-3 sm:px-6 sm:py-4 xl:px-8">
            {isView ? (
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-3">
                <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)} className="h-11 sm:h-10 sm:min-w-24">
                  关闭
                </Button>
                {props.canMaintain ? (
                  <Button type="button" onClick={props.onRequestEditFromView} className="h-11 sm:h-10 sm:min-w-24">
                    编辑
                  </Button>
                ) : (
                  <div />
                )}
              </div>
            ) : (
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-3">
                <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)} className="h-11 sm:h-10 sm:min-w-24">
                  取消
                </Button>
                <Button type="button" onClick={handleSaveClick} disabled={!props.canMaintain} className="h-11 sm:h-10 sm:min-w-24">
                  保存
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ExperimentalMaterialRelatedExperimentsSheet open={relatedOpen} onOpenChange={setRelatedOpen} items={props.relatedExperiments} />
      <AlertDialog open={versionOpen} onOpenChange={setVersionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>版本说明</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              <span>
                当前主档乐观锁版本号为 <span className="font-mono text-foreground">{versionLabel}</span>
                。每次保存成功后版本号会自动递增，用于并发写入保护。
              </span>
              <span className="block text-muted-foreground">
                若需查看完整字段级变更历史，请后续在工作流审计或操作日志中检索该材料主键。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction type="button">知道了</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
