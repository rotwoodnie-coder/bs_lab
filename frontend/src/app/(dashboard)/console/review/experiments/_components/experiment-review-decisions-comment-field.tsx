"use client";

import * as React from "react";
import { Button, Label, Textarea } from "@bs-lab/ui";

const QUICK_PHRASES = [
  "课标对齐",
  "安全项缺失",
  "步骤建议优化",
  "材料表述待补充",
  "视频与步骤一致",
  "模拟逻辑严密",
  "交互引导清晰",
  "关键变量可探究",
  "建议增加误操作提示",
] as const;

function QuickPhraseBar({ onPick }: { onPick: (p: string) => void }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">快捷短语（点击追加）</p>
      <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto">
        {QUICK_PHRASES.map((p) => (
          <Button
            key={p}
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 rounded-sm px-2 text-[11px] font-normal"
            onClick={() => onPick(p)}
          >
            {p}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function ExperimentReviewDecisionsCommentField({
  comment,
  onCommentChange,
  showOpinionEditor,
  onOpinionEditorOpen,
  onOpinionEditorClose,
}: {
  comment: string;
  onCommentChange: (v: string) => void;
  showOpinionEditor: boolean;
  onOpinionEditorOpen: () => void;
  onOpinionEditorClose: () => void;
}) {
  const appendPhrase = React.useCallback(
    (phrase: string) => {
      onCommentChange(
        (() => {
          const t = comment.trim();
          if (!t) return phrase;
          if (t.includes(phrase)) return t;
          return `${t}；${phrase}`;
        })(),
      );
    },
    [comment, onCommentChange],
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="review-comment" className="text-muted-foreground">
          教研意见（写入 confirm_comments，最长 200 字）
        </Label>
        {showOpinionEditor && !comment.trim() ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={onOpinionEditorClose}
          >
            收起
          </Button>
        ) : null}
      </div>
      {showOpinionEditor ? (
        <>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value.slice(0, 200))}
            placeholder="通过或驳回时均可作为审批摘要（最多 200 字）。"
            rows={3}
            className="min-h-11 max-h-60 resize-y transition-[min-height] duration-200 ease-out focus:min-h-[7.5rem]"
          />
          <QuickPhraseBar onPick={appendPhrase} />
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-start font-normal text-muted-foreground"
          onClick={onOpinionEditorOpen}
        >
          添加教研意见…
        </Button>
      )}
    </div>
  );
}
