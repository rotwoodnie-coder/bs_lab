"use client";

import { Badge } from "@bs-lab/ui";

import type { V2ExpMsgDetail } from "@/lib/v2/v2-exp-api";

export function ExperimentReviewDecisionsMetaPanel({
  rawDetail,
  workflowLabel,
  lifecycleLabel,
}: {
  rawDetail: V2ExpMsgDetail | null;
  workflowLabel: string;
  lifecycleLabel: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">审核状态</span>
        <Badge variant="secondary">{workflowLabel}</Badge>
        <span className="text-muted-foreground">生命周期</span>
        <Badge variant="outline">{lifecycleLabel}</Badge>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">创建人 id</p>
          <p className="break-all text-foreground">{rawDetail?.createUserId ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">创建时间</p>
          <p className="tabular-nums text-foreground">{rawDetail?.createTime ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">学科 / 年级</p>
          <p className="text-foreground">
            {(rawDetail?.subjectId ?? "—") + " / " + (rawDetail?.gradeId ?? "—")}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">标准试验</p>
          <p className="break-all text-foreground">{rawDetail?.standardExpId ?? "—"}</p>
        </div>
      </div>
    </>
  );
}
