"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  MediaPreview,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  sonnerToast,
  Textarea,
} from "@bs-lab/ui";
import type { TeacherMaterialItem, TeacherMaterialKind } from "@/lib/teacher-materials-api";
import { normalizeTeacherMaterialKind } from "@/lib/teacher-materials-api";

import {
  TEACHER_MATERIALS_KIND_FORM_OPTIONS,
  TEACHER_MATERIAL_MSG_STATUS_FORM_OPTIONS,
} from "../_lib/teacher-materials-ui.config";
import { TeacherMaterialExperimentField } from "./TeacherMaterialExperimentField";

const ALLOWED_MSG_STATUS = new Set(TEACHER_MATERIAL_MSG_STATUS_FORM_OPTIONS.map((o) => o.value));

export type TeacherMaterialEditSubmitInput = {
  title: string;
  kind: TeacherMaterialKind;
  experimentId: string | null;
  linkedExperimentTitle: string | null;
  materialStatus: string | null;
  materialMainPicUrl: string | null;
  expPurpose: string | null;
  additionalComments: string | null;
  materialNum: number | null;
  /** 仅创建者在全库列表中可见 */
  visibilitySelfOnly: boolean;
};

type Props = {
  open: boolean;
  target: TeacherMaterialItem | null;
  kindOptions?: { value: string; label: string }[];
  experimentOptions?: { value: string; label: string }[];
  experimentOptionsLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: TeacherMaterialEditSubmitInput) => void | Promise<void>;
};

export function TeacherMaterialEditDialog(props: Props) {
  const isDataFileRow = props.target?.rowSource === "data_file";

  const kindFormOptions = React.useMemo(() => {
    const base = props.kindOptions?.length ? props.kindOptions : TEACHER_MATERIALS_KIND_FORM_OPTIONS;
    const raw = props.target?.kind?.trim();
    if (!raw) return base;
    const k = normalizeTeacherMaterialKind(raw);
    if (base.some((o) => o.value === k)) return base;
    return [...base, { value: k, label: `${raw}（已映射为 ${k}）` }];
  }, [props.kindOptions, props.target?.materialId, props.target?.kind]);

  const [title, setTitle] = React.useState("");
  const [kind, setKind] = React.useState<TeacherMaterialKind>("word");
  const [experimentId, setExperimentId] = React.useState<string | null>(null);
  const [linkedExperimentTitle, setLinkedExperimentTitle] = React.useState<string | null>(null);
  const [materialStatus, setMaterialStatus] = React.useState("y");
  const [materialMainPicUrl, setMaterialMainPicUrl] = React.useState("");
  const [expPurpose, setExpPurpose] = React.useState("");
  const [additionalComments, setAdditionalComments] = React.useState("");
  const [materialNumStr, setMaterialNumStr] = React.useState("");
  const [visibilitySelfOnly, setVisibilitySelfOnly] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!props.open || !props.target) return;
    setTitle(props.target.title);
    setKind(normalizeTeacherMaterialKind(props.target.kind));
    setExperimentId(props.target.experimentId ?? null);
    setLinkedExperimentTitle(props.target.linkedExperimentTitle ?? null);
    const st = props.target.materialStatus?.trim() || "y";
    setMaterialStatus(ALLOWED_MSG_STATUS.has(st) ? st : "y");
    setMaterialMainPicUrl(props.target.materialMainPicUrl?.trim() ?? "");
    setExpPurpose(props.target.expPurpose?.trim() ?? "");
    setAdditionalComments(props.target.additionalComments?.trim() ?? "");
    setMaterialNumStr(
      props.target.materialNum != null && Number.isFinite(props.target.materialNum)
        ? String(props.target.materialNum)
        : "",
    );
    setVisibilitySelfOnly(props.target.visibilitySelfOnly === true);
    setSubmitting(false);
  }, [props.open, props.target]);

  const submit = React.useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      sonnerToast.error("请填写素材名称");
      return;
    }
    const nRaw = materialNumStr.trim();
    let materialNum: number | null = null;
    if (nRaw) {
      const n = Number.parseInt(nRaw, 10);
      if (!Number.isFinite(n)) {
        sonnerToast.error("建议用量须为整数");
        return;
      }
      materialNum = n;
    }
    setSubmitting(true);
    try {
      await Promise.resolve(
        props.onSubmit({
          title: trimmed,
          kind,
          experimentId,
          linkedExperimentTitle,
          materialStatus: materialStatus.trim() || null,
          materialMainPicUrl: materialMainPicUrl.trim() || null,
          expPurpose: expPurpose.trim() || null,
          additionalComments: additionalComments.trim() || null,
          materialNum,
          visibilitySelfOnly,
        }),
      );
      props.onOpenChange(false);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "更新素材失败");
    } finally {
      setSubmitting(false);
    }
  }, [
    additionalComments,
    experimentId,
    expPurpose,
    kind,
    linkedExperimentTitle,
    materialMainPicUrl,
    materialNumStr,
    materialStatus,
    props,
    title,
    visibilitySelfOnly,
  ]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>编辑素材属性</DialogTitle>
          <DialogDescription>
            {isDataFileRow ? (
              <>
                与库表 <span className="font-mono">data_file</span> 对齐：可修改文件名与启用状态；侧栏展示类型仍由扩展名推断。
              </>
            ) : (
              <>
                与库表 <span className="font-mono">material_msg</span> 对齐：名称、类型、关联实验及状态、主图 URL、用途与补充说明。
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="material-edit-title">{isDataFileRow ? "文件名" : "素材名称"}</Label>
            <Input
              id="material-edit-title"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              placeholder="请输入素材名称"
            />
          </div>
          {!isDataFileRow ? (
            <div className="space-y-1">
              <Label>素材类型（写入 comments.k）</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as TeacherMaterialKind)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {kindFormOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {!isDataFileRow ? (
            <TeacherMaterialExperimentField
              value={experimentId}
              linkedExperimentTitle={linkedExperimentTitle}
              options={props.experimentOptions ?? []}
              loading={props.experimentOptionsLoading}
              disabled={submitting}
              onChange={(next) => {
                setExperimentId(next.experimentId);
                setLinkedExperimentTitle(next.linkedExperimentTitle);
              }}
            />
          ) : null}
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/15 p-3">
            <Checkbox
              id="material-edit-self-only"
              checked={visibilitySelfOnly}
              onCheckedChange={(v) => setVisibilitySelfOnly(v === true)}
              disabled={submitting}
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <Label htmlFor="material-edit-self-only" className="cursor-pointer font-medium leading-none">
                仅自己可见
              </Label>
              <p className="text-xs text-muted-foreground">
                {isDataFileRow
                  ? "勾选后其他用户不会在实验素材库列表中看到此文件；仍可通过直链等已分享方式访问存储对象（与列表可见性不同）。"
                  : "勾选后其他用户不会在素材库列表中看到此条；创建者本人仍可见。"}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="material-edit-status">
              {isDataFileRow ? "状态（data_file.status）" : "状态（material_msg.status）"}
            </Label>
            <Select value={materialStatus} onValueChange={setMaterialStatus}>
              <SelectTrigger id="material-edit-status">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {TEACHER_MATERIAL_MSG_STATUS_FORM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isDataFileRow ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="material-edit-main-pic">主图 URL（main_pic_url）</Label>
                <Input
                  id="material-edit-main-pic"
                  value={materialMainPicUrl}
                  onChange={(e) => setMaterialMainPicUrl(e.currentTarget.value)}
                  placeholder="https://… 或库内可访问直链；留空则清空该列"
                />
                {materialMainPicUrl.trim() ? (
                  <div className="mt-1 h-24 w-40 overflow-hidden rounded-md border border-border bg-muted/30">
                    <MediaPreview kind="image" src={materialMainPicUrl} className="size-full object-contain" />
                  </div>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor="material-edit-num">建议用量（material_num）</Label>
                <Input
                  id="material-edit-num"
                  type="number"
                  inputMode="numeric"
                  value={materialNumStr}
                  onChange={(e) => setMaterialNumStr(e.currentTarget.value)}
                  placeholder="留空表示不填"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="material-edit-purpose">试验用途（exp_purpose）</Label>
                <Textarea
                  id="material-edit-purpose"
                  rows={2}
                  maxLength={200}
                  value={expPurpose}
                  onChange={(e) => setExpPurpose(e.currentTarget.value)}
                  placeholder="最多 200 字"
                  className="min-h-[64px] resize-y"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="material-edit-additional">补充说明（additional_comments）</Label>
                <Textarea
                  id="material-edit-additional"
                  rows={2}
                  maxLength={200}
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.currentTarget.value)}
                  placeholder="最多 200 字"
                  className="min-h-[64px] resize-y"
                />
              </div>
            </>
          ) : null}
          <div className="rounded-md border border-border bg-muted/20 p-2 text-xs text-muted-foreground">
            <div className="mb-1 font-medium text-foreground">将更新</div>
            <div className="flex flex-wrap gap-1">
              {!isDataFileRow ? (
                <Badge variant="secondary">{kindFormOptions.find((option) => option.value === kind)?.label ?? kind}</Badge>
              ) : null}
              <Badge variant="outline">{TEACHER_MATERIAL_MSG_STATUS_FORM_OPTIONS.find((o) => o.value === materialStatus)?.label}</Badge>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "保存中…" : "保存修改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
