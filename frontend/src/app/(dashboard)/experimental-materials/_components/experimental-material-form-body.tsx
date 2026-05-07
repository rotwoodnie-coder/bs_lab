"use client";

import * as React from "react";
import {
  Button,
  Combobox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@bs-lab/ui";
import { CircleHelp, Link2 } from "@bs-lab/ui/icons";

import type { ExperimentalMaterialCategory, ExperimentalMaterialRecord } from "@/data/experimental-materials";
import {
  MATERIAL_CATEGORY_OPTIONS,
  MATERIAL_SAFETY_TAG_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  MATERIAL_UNIT_OPTIONS,
} from "../page.constants";
import type { ExperimentalMaterialFormDimensionsLists, ExperimentalMaterialFormState } from "../page.types";
import { ExperimentalMaterialFormSafetySection } from "./experimental-material-form-safety-section";

function checkboxGroupClass(invalid: boolean) {
  return `grid gap-2 rounded-md border p-3 sm:grid-cols-2 xl:grid-cols-3 ${invalid ? "border-destructive bg-destructive/5" : "border-border"}`;
}

export function ExperimentalMaterialFormBody(props: {
  form: ExperimentalMaterialFormState;
  fieldErrors: { name: boolean; materialType: boolean; materialPropId: boolean; usage: boolean; numValue: boolean; unitId: boolean };
  canWrite: boolean;
  dialogRecord: ExperimentalMaterialRecord | null;
  basicInfoSectionRef: React.RefObject<HTMLElement | null>;
  teachingUsageSectionRef: React.RefObject<HTMLElement | null>;
  safetySectionRef: React.RefObject<HTMLElement | null>;
  relatedSectionRef: React.RefObject<HTMLElement | null>;
  relatedExperimentsCount: number;
  onOpenRelatedSheet: () => void;
  updateField: <K extends keyof ExperimentalMaterialFormState>(key: K, value: ExperimentalMaterialFormState[K]) => void;
  photoBlock: React.ReactNode;
  /** 维表驱动选项；缺省时使用本地兜底常量 */
  materialDimensions?: ExperimentalMaterialFormDimensionsLists | null;
}) {
  const typeOpts = props.materialDimensions?.typeSelect?.length ? props.materialDimensions.typeSelect : MATERIAL_TYPE_OPTIONS;
  const catOpts = props.materialDimensions?.categoryChecks?.length ? props.materialDimensions.categoryChecks : MATERIAL_CATEGORY_OPTIONS;
  const unitOpts = props.materialDimensions?.unitOptions?.length ? props.materialDimensions.unitOptions : MATERIAL_UNIT_OPTIONS;
  const safetyOpts = props.materialDimensions?.safetyChecks?.length ? props.materialDimensions.safetyChecks : MATERIAL_SAFETY_TAG_OPTIONS;

  // 开发环境：维表数据缺位时发出警告
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const missing: string[] = [];
    if (!props.materialDimensions?.typeSelect?.length) missing.push("材料类型");
    if (!props.materialDimensions?.categoryChecks?.length) missing.push("材料分类");
    if (!props.materialDimensions?.unitOptions?.length) missing.push("计量单位");
    if (!props.materialDimensions?.safetyChecks?.length) missing.push("安全标签");
    if (missing.length > 0) {
      console.warn(
        `[ExperimentalMaterialForm] 维表数据为空，${missing.join("、")}已使用本地兜底。请检查后端维表 API 路径及字典表数据。`,
      );
    }
  }, [props.materialDimensions]);

  // 单位选项（含自定义单位）：维表选项 + 当前表单中已有的自定义值
  const unitOptions = React.useMemo(() => {
    const opts = unitOpts.map((u: { id: string; label: string }) => ({ value: u.id, label: u.label }));
    const cur = props.form.unitId.trim();
    if (cur && !opts.some((o) => o.value === cur)) {
      opts.push({ value: cur, label: cur });
    }
    return opts;
  }, [unitOpts, props.form.unitId]);

  return (
    <div className="w-full max-w-[920px] space-y-0 2xl:max-w-[980px]">
      <section
        ref={props.basicInfoSectionRef}
        id="material-section-basic"
        className="space-y-4 scroll-mt-24 border-y border-border py-6"
      >
        <div>
          <h3 className="text-sm font-medium text-foreground">基础信息</h3>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
            <CircleHelp className="mt-0.5 size-3.5 shrink-0" />
            <span>先通过照片与名称建立直观印象，再补充分类与适用学段。</span>
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,320px)_1fr] xl:items-start">
          <div className="grid gap-2 xl:sticky xl:top-2">
            <Label>材料照片</Label>
            {props.photoBlock}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:gap-5">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="material-name">
                材料名称
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="material-name"
                value={props.form.name}
                onChange={(event) => props.updateField("name", event.target.value)}
                placeholder="例如：酚酞指示剂溶液"
                disabled={!props.canWrite}
                aria-invalid={props.fieldErrors.name || undefined}
              />
              {props.fieldErrors.name ? <p className="text-xs text-destructive">材料名称为必填项</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="material-type-select">
                材料类型<span className="text-destructive">*</span>
              </Label>
              <Select
                value={props.form.materialType || undefined}
                onValueChange={(value) =>
                  props.updateField("materialType", value ?? "")
                }
                disabled={!props.canWrite}
              >
                <SelectTrigger id="material-type-select" aria-invalid={props.fieldErrors.materialType || undefined}>
                  <SelectValue placeholder="选择材料类型" />
                </SelectTrigger>
                <SelectContent>
                  {typeOpts.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {props.fieldErrors.materialType ? <p className="text-xs text-destructive">请选择材料类型</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="material-prop-select">
                材料属性<span className="text-destructive">*</span>
              </Label>
              <Select
                value={props.form.materialPropId || undefined}
                onValueChange={(value) =>
                  props.updateField("materialPropId", value ?? "")
                }
                disabled={!props.canWrite}
              >
                <SelectTrigger id="material-prop-select" aria-invalid={props.fieldErrors.materialPropId || undefined}>
                  <SelectValue placeholder="选择材料属性" />
                </SelectTrigger>
                <SelectContent>
                  {catOpts.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {props.fieldErrors.materialPropId ? <p className="text-xs text-destructive">请选择材料属性</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="material-num-value">
                建议用量数值<span className="text-destructive">*</span>
              </Label>
              <Input
                id="material-num-value"
                value={props.form.numValue}
                onChange={(event) => props.updateField("numValue", event.target.value)}
                placeholder="例如：500"
                disabled={!props.canWrite}
                aria-invalid={props.fieldErrors.numValue || undefined}
              />
              {props.fieldErrors.numValue ? <p className="text-xs text-destructive">请输入建议用量数值</p> : null}
            </div>

            <div className="grid gap-2">
              <Label>
                单位<span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={unitOptions}
                value={props.form.unitId || undefined}
                onValueChange={(value) => props.updateField("unitId", value)}
                placeholder="选择或输入单位"
                searchPlaceholder="搜索或输入单位…"
                emptyText="无匹配"
                allowCustomValue
                customValuePrefix="自定义："
                disabled={!props.canWrite}
                triggerClassName={props.fieldErrors.unitId ? "border-destructive" : undefined}
              />
              {props.fieldErrors.unitId ? <p className="text-xs text-destructive">请输入或选择单位</p> : null}
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="material-usage">
                实验用途
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="material-usage"
                rows={4}
                value={props.form.usage}
                onChange={(event) => props.updateField("usage", event.target.value)}
                placeholder="说明这件材料在实验里做什么"
                disabled={!props.canWrite}
                aria-invalid={props.fieldErrors.usage || undefined}
              />
              {props.fieldErrors.usage ? <p className="text-xs text-destructive">实验用途为必填项</p> : null}
            </div>
          </div>
        </div>
      </section>


      <ExperimentalMaterialFormSafetySection
        form={props.form}
        dialogRecord={props.dialogRecord}
        canWrite={props.canWrite}
        sectionRef={props.safetySectionRef}
        updateField={props.updateField}
        safetyTagOptions={safetyOpts}
        dimensionSafetyTagsForRisk={props.materialDimensions?.safetyRiskLookup}
      />

      <section
        ref={props.relatedSectionRef}
        id="material-section-related"
        className="grid gap-3 scroll-mt-24 border-t border-border pt-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-foreground">关联实验</h3>
            <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Link2 className="mt-0.5 size-3.5 shrink-0" />
              <span>了解引用关系，避免改名或删除影响实验配套说明。</span>
            </p>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={props.onOpenRelatedSheet}>
            查看列表{props.relatedExperimentsCount > 0 ? `（${props.relatedExperimentsCount}）` : ""}
          </Button>
        </div>
      </section>
    </div>
  );
}
