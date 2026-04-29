import * as React from "react";

import { Button, Label, Textarea } from "@bs-lab/ui";

import { EXPERIMENT_EDITOR_MULTILINE_ROWS } from "../page.constants";
import type { ExperimentMaterialDraft } from "../types";
import { parseMaterialsFromFreeText } from "../utils/parse-materials-from-text";

type Props = {
  disabled: boolean;
  onAppendMaterials: (drafts: Omit<ExperimentMaterialDraft, "id">[]) => void;
};

export function StepMaterialsBulkInput(props: Props) {
  const [text, setText] = React.useState("");

  const handleParse = React.useCallback(() => {
    const drafts = parseMaterialsFromFreeText(text);
    if (drafts.length === 0) return;
    props.onAppendMaterials(drafts);
    setText("");
  }, [props.onAppendMaterials, text]);

  return (
    <div className="grid gap-2 rounded-md border border-dashed border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="grid gap-1">
          <Label htmlFor="materials-bulk-input">综合录入</Label>
          <p className="text-xs text-muted-foreground">
            可一次粘贴整段材料说明。系统按顿号、逗号、分号或换行拆分条目；括号内说明会写入备注，并尝试识别数量描述。
          </p>
        </div>
        <Button type="button" size="sm" disabled={props.disabled || !text.trim()} onClick={handleParse}>
          识别并添加到列表
        </Button>
      </div>
      <Textarea
        id="materials-bulk-input"
        rows={EXPERIMENT_EDITOR_MULTILINE_ROWS}
        value={text}
        disabled={props.disabled}
        onChange={(e) => setText(e.target.value)}
        placeholder="例如：长势一致的幼苗（每组6-8株）、一次性透明花盆（底部扎孔排水）、肥沃土壤、浇水壶……"
        className="min-h-[120px] resize-y"
      />
    </div>
  );
}
