"use client";

import * as React from "react";
import { Checkbox, Label, Textarea } from "@bs-lab/ui";
import { ShieldCheck } from "@bs-lab/ui/icons";

import {
  getExperimentalMaterialRiskLabel,
  getExperimentalMaterialRiskLevel,
  getExperimentalMaterialRiskSummary,
  getExperimentalMaterialSafetyLabels,
  type ExperimentalMaterialRecord,
  type ExperimentalMaterialRiskLevel,
  type ExperimentalMaterialSafetyTag,
} from "@/data/experimental-materials";

import { toggleStringSelection } from "../page.constants";
import type { ExperimentalMaterialFormState } from "../page.types";

function buildPreviewRecord(form: ExperimentalMaterialFormState, base: ExperimentalMaterialRecord | null): ExperimentalMaterialRecord {
  const now = new Date().toISOString();
  const shell: ExperimentalMaterialRecord =
    base ??
    ({
      id: "",
      name: "",
      photoUrl: "",
      materialType: form.materialType,
      categories: [],
      usage: "",
      suggestedAmount: "",
      homeAlternative: "",
      safetyTags: [],
      safetyNote: "",
      remark: "",
      createdByActorId: "preview",
      createdAt: now,
      updatedByActorId: "preview",
      updatedAt: now,
    } satisfies ExperimentalMaterialRecord);
  return {
    ...shell,
    name: form.name,
    materialType: form.materialType,
    safetyTags: [...form.safetyTags],
    safetyNote: form.comments,
    remark: form.comments,
    usage: form.usage,
  };
}

export function ExperimentalMaterialFormSafetySection(props: {
  form: ExperimentalMaterialFormState;
  dialogRecord: ExperimentalMaterialRecord | null;
  canWrite: boolean;
  sectionRef: React.RefObject<HTMLElement | null>;
  updateField: <K extends keyof ExperimentalMaterialFormState>(key: K, value: ExperimentalMaterialFormState[K]) => void;
  safetyTagOptions: readonly { id: string; label: string }[];
  /** 与维表 `risk_level` 对齐，用于表单内实时聚合风险（不写死标签推断） */
  dimensionSafetyTagsForRisk?: readonly { code: string; name: string; riskLevel: ExperimentalMaterialRiskLevel }[];
}) {
  const preview = React.useMemo(
    () => buildPreviewRecord(props.form, props.dialogRecord),
    [props.dialogRecord, props.form],
  );
  const level = getExperimentalMaterialRiskLevel(preview, props.dimensionSafetyTagsForRisk);
  const summary = getExperimentalMaterialRiskSummary(preview, props.dimensionSafetyTagsForRisk);
  const tagLabels = getExperimentalMaterialSafetyLabels(props.form.safetyTags, props.dimensionSafetyTagsForRisk);

  const panelTone =
    level === "high"
      ? "border-destructive/60 bg-destructive/10"
      : level === "medium"
        ? "border-primary/25 bg-primary/5"
        : level === "low"
          ? "border-border bg-muted/30"
          : "border-border bg-muted/20";

  return (
    <section ref={props.sectionRef} id="material-section-safety" className="grid gap-4 scroll-mt-24 border-t border-border pt-6">
      <div>
        <h3 className="text-sm font-medium text-foreground">安全风险与操作提示</h3>
        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          <span>根据已选标签与补充说明自动归纳风险等级，便于课前快速自检。</span>
        </p>
      </div>

      <div className={`rounded-lg border p-4 ${panelTone}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-medium text-foreground">风险概览</div>
          <div className="text-xs font-medium text-foreground">{getExperimentalMaterialRiskLabel(level)}</div>
        </div>
        <p className={`mt-2 text-sm ${level === "high" ? "text-destructive font-medium" : "text-foreground"}`}>{summary}</p>
        {tagLabels.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">已选要点：{tagLabels.join("、")}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label>安全要点</Label>
        <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2" role="group" aria-label="安全要点">
          {props.safetyTagOptions.map((item) => {
            const checked = props.form.safetyTags.some((t) => t === item.id);
            return (
              <label
                key={item.id}
                htmlFor={`em-safety-tag-${item.id}`}
                className="flex cursor-pointer items-start gap-2 text-sm text-foreground"
              >
                <Checkbox
                  id={`em-safety-tag-${item.id}`}
                  className="mt-0.5"
                  checked={checked}
                  disabled={!props.canWrite}
                  onCheckedChange={(v) =>
                    props.updateField(
                      "safetyTags",
                      toggleStringSelection(
                        props.form.safetyTags,
                        item.id as ExperimentalMaterialSafetyTag,
                        v === true,
                      ),
                    )
                  }
                />
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="material-comments">备注 / 安全说明</Label>
        <Textarea
          id="material-comments"
          rows={3}
          value={props.form.comments}
          onChange={(event) => props.updateField("comments", event.target.value)}
          placeholder="例如：稀释浓硫酸时应将酸缓慢注入水中并搅拌，佩戴耐酸手套与护目镜"
          disabled={!props.canWrite}
        />
      </div>
    </section>
  );
}
