"use client";

import * as React from "react";

import { sonnerToast } from "@bs-lab/ui";

import { ExperimentalMaterialFormDialog as LibraryMaterialFormDialog } from "../../../experimental-materials/_components/ExperimentalMaterialFormDialog";
import {
  getExperimentalMaterialSafetyLabels,
  getExperimentalMaterialTypeLabel,
  type ExperimentalMaterialType,
} from "@/data/experimental-materials";
import { parseCoverRegistryIdFromPhotoUrl } from "@/lib/material-cover-registry-id";
import { createExperimentalMaterialApi } from "@/lib/experimental-materials-api";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";

import type { ExperimentalMaterialFormState } from "../../../experimental-materials/page.types";
import { createEmptyMaterialForm, MATERIAL_SAFETY_TAG_OPTIONS, MATERIAL_TYPE_OPTIONS } from "../../../experimental-materials/page.constants";

import type { ExperimentMaterialDraft } from "../types";
import { useDemoRole } from "@/components/layout/demo-role-context";

function materialTypeIdFromLabel(label: string | undefined): ExperimentalMaterialType {
  const hit = MATERIAL_TYPE_OPTIONS.find((x) => x.label === label);
  return (hit?.id ?? "general") as ExperimentalMaterialType;
}

function safetyTagIdsFromHazardLabels(hazardFlags: string[]): ExperimentalMaterialFormState["safetyTags"] {
  // 安全标签来自 hazardFlags 的 label 匹配
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

  return {
    ...base,
    name: draft.nameLab ?? "",
    photoUrl: draft.thumbnailUrl || draft.imageUrl || "",
    materialType: materialTypeIdFromLabel(draft.materialType),
    usage: (draft.notes ?? "").trim() || (draft.safetyReminder ?? "").trim(),
    suggestedAmount: (draft.quantity ?? "1").trim(),
    homeAlternative: draft.nameHomeSubstitute ?? "",
    safetyTags: safetyTagIdsFromHazardLabels(draft.hazardFlags ?? []),
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
    materialType: getExperimentalMaterialTypeLabel(form.materialType),
    nameHomeSubstitute: form.homeAlternative.trim(),
    hazardFlags,
    safetyReminder,
    notes: form.comments?.trim(),
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

  React.useEffect(() => {
    if (!props.open) return;
    setForm(mapDraftToForm(props.initialDraft));
  }, [props.open, props.initialDraft, props.syncToLibrary]);

  const handleSubmit = React.useCallback(async () => {
    const nextDraft = mapFormToDraft(form);

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

    props.onSave({ ...nextDraft, libraryMaterialId });
    props.onOpenChange(false);
  }, [actor, form, props]);

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
      onOpenChange={(open) => props.onOpenChange(open)}
      onFormChange={setForm}
      onSubmit={() => {
        if (!canMaintain) return;
        void handleSubmit();
      }}
      onRequestEditFromView={() => undefined}
      onRequestCloneFromTemplate={() => undefined}
    />
  );
}

