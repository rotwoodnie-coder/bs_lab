import * as React from "react";

import { Button, Label, Textarea } from "@bs-lab/ui";

import { EXPERIMENT_EDITOR_MULTILINE_ROWS } from "../page.constants";

type Props = {
  disabled: boolean;
  /** 与综合录入合并参与识别的上下文（实验名称、摘要、课标摘录等） */
  mergeSourceText: string;
  /** 当前对照教材富文本纯文本，一并参与识别 */
  teachingRichPlainText: string;
};

export function TeachingContextBulkInput(props: Props) {
  const [text, setText] = React.useState("");

  const handleParse = React.useCallback(() => {
    // 结构化字段已移除，综合录入仅作为快速记录区
    setText("");
  }, [props.mergeSourceText, props.teachingRichPlainText]);

  return (
    <div className="grid gap-2 rounded-md border border-dashed border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="grid gap-1">
          <Label htmlFor="teaching-context-bulk">综合录入</Label>
          <p className="text-xs text-muted-foreground">
            可粘贴整段教材与课时说明。识别结果将写入下方「对照教材说明」富文本区域；学段、学科、年级与「实验基本信息」保持一致。
          </p>
        </div>
        <Button type="button" size="sm" disabled={props.disabled || !text.trim()} onClick={handleParse}>
          清空
        </Button>
      </div>
      <Textarea
        id="teaching-context-bulk"
        rows={EXPERIMENT_EDITOR_MULTILINE_ROWS}
        value={text}
        disabled={props.disabled}
        onChange={(e) => setText(e.target.value)}
        placeholder="例如：人教版高中物理必修第三册，第九章第2节，本课2课时……"
        className="min-h-[120px] resize-y"
      />
    </div>
  );
}
