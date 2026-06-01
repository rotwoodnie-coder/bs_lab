"use client";

import * as React from "react";

import { sonnerToast, Button, MediaPreview } from "@bs-lab/ui";
import { Trash2, Upload } from "@bs-lab/ui/icons";

import { ExperimentalMaterialFormDialog as LibraryMaterialFormDialog } from "../../../experimental-materials/_components/ExperimentalMaterialFormDialog";
import {
  getExperimentalMaterialRiskLabel,
  getExperimentalMaterialSafetyLabels,
  getExperimentalMaterialTypeLabel,
  type ExperimentalMaterialType,
} from "@/data/experimental-materials";
import { parseCoverRegistryIdFromPhotoUrl } from "@/lib/material-cover-registry-id";
import { createExperimentalMaterialApi, fetchExperimentalMaterialDimensions } from "@/lib/experimental-materials-api";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";

import { MediaAssetPickerDialog } from "@/components/business/media/MediaAssetPickerDialog";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";

import type {
  ExperimentalMaterialFormState,
  ExperimentalMaterialFormDimensionsLists,
} from "../../../experimental-materials/page.types";
import { createEmptyMaterialForm, MATERIAL_SAFETY_TAG_OPTIONS, MATERIAL_TYPE_OPTIONS } from "../../../experimental-materials/page.constants";

import type { ExperimentMaterialDraft } from "../types";
import { useDemoRole } from "@/components/layout/demo-role-context";

function materialTypeIdFromLabel(label: string | undefined): ExperimentalMaterialType {
  const hit = MATERIAL_TYPE_OPTIONS.find((x) => x.label === label);
  return (hit?.id ?? "general") as ExperimentalMaterialType;
}

function safetyTagIdsFromHazardLabels(hazardFlags: string[]): ExperimentalMaterialFormState["safetyTags"] {
  const hits = hazardFlags
    .map((label) => MATERIAL_SAFETY_TAG_OPTIONS.find((x) => x.label === label)?.id)
    .filter((id): id is ExperimentalMaterialFormState["safetyTags"][number] => Boolean(id));
  return [...new Set(hits)];
}

function mapDraftToForm(draft: ExperimentMaterialDraft | null): ExperimentalMaterialFormState {
  const base = createEmptyMaterialForm();

  if (!draft) {
    return {
      ...base,
      materialType: "general",
      suggestedAmount: "",
    };
  }

  const numValue = (draft.numValue ?? "").trim();
  const unitId = (draft.unitId ?? "").trim();
  const suggestedAmount = unitId && numValue ? `${numValue} ${unitId}` : (draft.quantity ?? "1").trim();

  let safetyTags: ExperimentalMaterialFormState["safetyTags"] = [];
  if (draft.materialSecurityList && draft.materialSecurityList.length > 0) {
    safetyTags = draft.materialSecurityList
      .map((s) => s.securityId)
      .filter((id): id is ExperimentalMaterialFormState["safetyTags"][number] => Boolean(id));
  } else {
    safetyTags = safetyTagIdsFromHazardLabels(draft.hazardFlags ?? []);
  }

  return {
    ...base,
    name: draft.nameLab ?? "",
    photoUrl: draft.thumbnailUrl || draft.imageUrl || "",
    materialType: materialTypeIdFromLabel(draft.materialType),
    materialPropId: draft.materialPropId ?? "",
    usage: draft.expPurpose?.trim() || (draft.notes ?? "").trim() || (draft.safetyReminder ?? "").trim(),
    numValue,
    unitId,
    suggestedAmount,
    homeAlternative: draft.nameHomeSubstitute ?? "",
    safetyTags,
    comments: (draft.safetyReminder ?? "").trim(),
  };
}

function mapFormToDraft(form: ExperimentalMaterialFormState): Omit<ExperimentMaterialDraft, "id"> {
  const hazardFlags = getExperimentalMaterialSafetyLabels(form.safetyTags);
  const safetyReminder = form.comments?.trim() || hazardFlags.join("、");

  return {
    thumbnailUrl: form.photoUrl,
    nameLab: form.name.trim(),
    quantity: (form.suggestedAmount.trim() || "1") as string,
    materialTypeId: form.materialType,
    materialType: getExperimentalMaterialTypeLabel(form.materialType),
    nameHomeSubstitute: form.homeAlternative.trim(),
    hazardFlags,
    safetyReminder,
    notes: form.comments?.trim(),
    numValue: form.numValue.trim(),
    unitId: form.unitId.trim(),
    expPurpose: form.usage.trim(),
    materialPropId: form.materialPropId.trim() || undefined,
    materialSecurityList: form.safetyTags.map((sid) => ({ securityId: sid, securityLevel: null })),
  };
}

export function StepExperimentalMaterialFormDialog(props: {
  open: boolean;
  mode: "create" | "edit";
  initialDraft: ExperimentMaterialDraft | null;
  disabled: boolean;
  syncToLibrary: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: Omit<ExperimentMaterialDraft, "id">) => void;
}) {
  const { role, orgId } = useDemoRole();
  const canMaintain = !props.disabled;
  const actor = React.useMemo(() => buildMaterialsApiActor(role, orgId, "editor-material-form"), [orgId, role]);

  const [form, setForm] = React.useState<ExperimentalMaterialFormState>(() => mapDraftToForm(props.initialDraft));
  const [materialDimensions, setMaterialDimensions] = React.useState<ExperimentalMaterialFormDimensionsLists | null>(null);

  // 材料多图本地状态：存储图片 URL
  const [materialPicUrls, setMaterialPicUrls] = React.useState<string[]>(() =>
    (props.initialDraft?.materialPics ?? []).map((p) => p.materialUrl ?? "").filter(Boolean),
  );
  const [picPickerOpen, setPicPickerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!props.open) return;
    setForm(mapDraftToForm(props.initialDraft));
    setMaterialPicUrls(
      (props.initialDraft?.materialPics ?? []).map((p) => p.materialUrl ?? "").filter(Boolean),
    );
  }, [props.open, props.initialDraft, props.syncToLibrary]);

  // 加载维表数据
  React.useEffect(() => {
    if (!props.open) return;
    void fetchExperimentalMaterialDimensions(actor)
      .then((dims) => {
        setMaterialDimensions({
          typeSelect: dims.types.map((t) => ({
            id: t.code,
            label: (t.displayName?.trim() || t.name || t.code).trim(),
          })),
          categoryChecks: dims.categories.map((c) => ({
            id: c.code,
            label: (c.displayName?.trim() || c.name || c.code).trim(),
          })),
          unitOptions: dims.units.map((u) => ({
            id: u.code,
            label: (u.displayName?.trim() || u.name || u.code).trim(),
          })),
          safetyChecks: dims.safetyTags.map((s) => ({
            id: s.code,
            label: `${s.name}（${getExperimentalMaterialRiskLabel(s.riskLevel)}）`,
          })),
          safetyRiskLookup: dims.safetyTags.map((s) => ({
            code: s.code,
            name: s.name,
            riskLevel: s.riskLevel,
          })),
        });
      })
      .catch((err) => {
        console.warn("[StepExperimentalMaterialFormDialog] 维表 API 请求失败，将使用本地兜底数据。错误：", err);
        setMaterialDimensions(null);
      });
  }, [actor, props.open]);

  const pickImage = React.useCallback(
    async (registryId: string) => {
      const url = mediaRegistryStreamUrl(registryId, "view", actor);
      setMaterialPicUrls((prev) => [...prev, url]);
      setPicPickerOpen(false);
    },
    [actor],
  );

  const removePic = React.useCallback((index: number) => {
    setMaterialPicUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    const nextDraft = mapFormToDraft(form);

    // 将 materialPicUrls 转为 materialPics 格式，并保留空数组以支持删除回写
    const materialPics: ExperimentMaterialDraft["materialPics"] = materialPicUrls.map((url, idx) => ({
      seqId: `pic-${Date.now()}-${idx}`,
      materialUrl: url,
      sortOrder: idx,
    }));

    let libraryMaterialId: string | undefined;
    if (props.syncToLibrary) {
      const created = await createExperimentalMaterialApi(actor, {
        name: form.name.trim(),
        materialType: form.materialType,
        usage: form.usage.trim(),
        suggestedAmount: form.suggestedAmount.trim(),
        homeAlternative: form.homeAlternative.trim(),
        categories: form.materialPropId ? [form.materialPropId] : [],
        safetyTags: form.safetyTags,
        coverRegistryId: parseCoverRegistryIdFromPhotoUrl(form.photoUrl) ?? undefined,
        status: form.status,
      });
      libraryMaterialId = created.id;
      sonnerToast.success("已同步加入实验材料库");
    }

    props.onSave({ ...nextDraft, libraryMaterialId, materialPics });
    props.onOpenChange(false);
  }, [actor, form, materialPicUrls, props]);

  return (
    <LibraryMaterialFormDialog
      open={props.open}
      mode={props.mode === "edit" ? "edit" : "create"}
      canMaintain={canMaintain}
      mediaActor={actor}
      form={form}
      dialogRecord={null}
      detailStats={null}
      relatedExperiments={[]}
      materialFormDimensions={materialDimensions}
      onOpenChange={(open) => props.onOpenChange(open)}
      onFormChange={setForm}
      onSubmit={() => {
        if (!canMaintain) return;
        void handleSubmit();
      }}
      onRequestEditFromView={() => undefined}
      onRequestCloneFromTemplate={() => undefined}
    >
      {/* 材料多图区域 */}
      <div className="grid gap-3 border-t border-border pt-4 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-foreground">材料多图</h4>
            <p className="text-xs text-muted-foreground">上传或从媒体库选择材料的多角度照片（可选）。</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canMaintain}
            onClick={() => setPicPickerOpen(true)}
          >
            <Upload className="mr-1 h-3.5 w-3.5" />
            添加图片
          </Button>
        </div>
        {materialPicUrls.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {materialPicUrls.map((url, idx) => (
              <div key={`${url}-${idx}`} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/20">
                <MediaPreview
                  kind="image"
                  src={url}
                  alt={`材料图片 ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                {canMaintain ? (
                  <button
                    type="button"
                    onClick={() => removePic(idx)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`删除图片 ${idx + 1}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">暂未添加材料图片。</p>
        )}
        <MediaAssetPickerDialog
          open={picPickerOpen}
          onOpenChange={setPicPickerOpen}
          kind="image"
          actor={actor}
          title="选择材料图片"
          description="从媒体中台已登记素材中选择材料的多角度照片。"
          onPick={pickImage}
        />
      </div>
    </LibraryMaterialFormDialog>
  );
}
