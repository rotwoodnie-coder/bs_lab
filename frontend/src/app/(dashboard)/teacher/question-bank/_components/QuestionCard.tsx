"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bs-lab/ui";
import type { V2QuestionItem } from "@/lib/v2/v2-question-api";

type CardMode = "pending" | "approved" | "rejected";

interface Props {
  question: V2QuestionItem;
  mode: CardMode;
  onApprove: (id: string) => void;
  onOpenReject: (id: string) => void;
  onRetract: (id: string) => void;
}

const borderAccentMap: Record<CardMode, string> = {
  pending: "border-l-primary",
  approved: "border-l-muted-foreground/35",
  rejected: "border-l-destructive/80",
};

export function QuestionCard({ question, mode, onApprove, onOpenReject, onRetract }: Props) {
  const correctSelects = (question.selects ?? []).filter((s) => s.isRight === "y");

  return (
    <Card className={`overflow-hidden border-l-4 ${borderAccentMap[mode]}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{question.questionContent}</CardTitle>
          <div className="flex flex-wrap gap-1">
            {mode === "pending" && (
              <Badge variant="default" className="font-normal">待处理</Badge>
            )}
            {mode === "approved" && (
              <Badge variant="outline" className="border-primary/35 bg-primary/5 font-normal text-primary">
                已入库
              </Badge>
            )}
            {mode === "rejected" && (
              <Badge variant="destructive" className="font-normal">已驳回</Badge>
            )}
            {question.chooseType && (
              <Badge variant="outline" className="font-normal">
                {question.chooseType === "S" ? "单选" : question.chooseType === "M" ? "多选" : question.chooseType}
              </Badge>
            )}
          </div>
        </div>
        {question.knowledgeContent && (
          <CardDescription>{question.knowledgeContent}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {(question.selects ?? []).length > 0 && (
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {question.selects!.map((s) => (
              <li
                key={s.selectId}
                className={s.isRight === "y" ? "font-medium text-foreground" : ""}
              >
                {s.selectContent}
                {s.isRight === "y" && (
                  <span className="ml-2 text-xs text-primary">（参考答案）</span>
                )}
              </li>
            ))}
          </ol>
        )}
        {correctSelects.length === 0 && (question.selects ?? []).length === 0 && (
          <p className="text-xs text-muted-foreground">暂无选项数据</p>
        )}

        {mode === "pending" && (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
            <Button type="button" size="sm" onClick={() => onApprove(question.questionId)}>
              通过入库
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onOpenReject(question.questionId)}>
              驳回
            </Button>
          </div>
        )}
        {mode === "approved" && (
          <div className="border-t border-border/60 pt-3">
            <Button type="button" size="sm" variant="outline" onClick={() => onRetract(question.questionId)}>
              撤回至待处理
            </Button>
          </div>
        )}
        {mode === "rejected" && (
          <div className="space-y-2 border-t border-border/60 pt-3">
            {question.rejectReason && (
              <p className="text-xs text-destructive">
                驳回说明：{question.rejectReason}
              </p>
            )}
            <Button type="button" size="sm" variant="secondary" onClick={() => onRetract(question.questionId)}>
              重新送审
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
