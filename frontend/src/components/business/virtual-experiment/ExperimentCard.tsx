"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bs-lab/ui";
import {
  Check,
  Eye,
  Monitor,
  PenSquare,
  Trash2,
  SendHorizontal,
  ImageUp,
  X,
} from "@bs-lab/ui/icons";
import { formatZhDateTime } from "@/lib/datetime/format-zh";
import type { VirtualExperimentRecord } from "@/lib/v2/v2-virtual-experiment-api";

// ─── 状态颜色映射 ──────────────────────────────────────

const STATUS_STYLE: Record<
  string,
  { label: string; dot: string; bg: string }
> = {
  draft: {
    label: "草稿",
    dot: "bg-gray-400",
    bg: "bg-gray-50 border-gray-200 text-gray-600",
  },
  pending: {
    label: "审核中",
    dot: "bg-orange-400",
    bg: "bg-orange-50 border-orange-200 text-orange-600",
  },
  published: {
    label: "已发布",
    dot: "bg-green-400",
    bg: "bg-green-50 border-green-200 text-green-600",
  },
  rejected: {
    label: "已拒绝",
    dot: "bg-red-400",
    bg: "bg-red-50 border-red-200 text-red-600",
  },
  archived: {
    label: "已归档",
    dot: "bg-gray-400",
    bg: "bg-gray-50 border-gray-200 text-gray-500",
  },
};

// ─── Props ─────────────────────────────────────────────

export interface ExperimentCardProps {
  item: VirtualExperimentRecord;
  onEdit: (item: VirtualExperimentRecord) => void;
  onDelete: (id: string) => void;
  onSubmitReview: (id: string) => void;
  onUploadCover?: (item: VirtualExperimentRecord) => void;
  /** 审核通过回调（review 模式） */
  onApprove?: (id: string) => void;
  /** 审核拒绝回调（review 模式） */
  onReject?: (id: string) => void;
}

// ─── 状态徽章 ──────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_STYLE[status] ?? {
    label: status,
    dot: "bg-gray-400",
    bg: "bg-gray-50 border-gray-200 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.bg}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── 封面区域 ──────────────────────────────────────────

function CoverArea({ coverUrl, title }: { coverUrl: string | null; title: string }) {
  if (coverUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
        <img
          src={coverUrl}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted/40">
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-1">
          <Monitor className="h-8 w-8 opacity-40" />
          <span className="text-xs">无封面</span>
        </div>
      </div>
    </div>
  );
}

// ─── 来源标签 ──────────────────────────────────────────

function SourceBadge({ sourceType }: { sourceType: string }) {
  return (
    <span className="text-[11px] text-muted-foreground">
      {sourceType === "html_file" ? "HTML 文件" : "URL 内嵌"}
    </span>
  );
}

// ─── 主组件 ────────────────────────────────────────────

export function ExperimentCard({
  item,
  onEdit,
  onDelete,
  onSubmitReview,
  onUploadCover,
  onApprove,
  onReject,
}: ExperimentCardProps) {
  const router = useRouter();
  const canSubmit =
    item.status === "draft" || item.status === "rejected";
  const isPending = item.status === "pending";

  return (
    <Card className="group flex flex-col overflow-hidden border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      {/* 封面 */}
      <CoverArea coverUrl={item.coverUrl} title={item.title} />

      {/* 内容区 */}
      <CardHeader className="space-y-1.5 p-3 pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-sm font-semibold leading-snug">
            <button
              className="text-left text-primary hover:underline"
              onClick={() =>
                router.push(`/virtual-experiment/play/${item.id}`)
              }
            >
              {item.title}
            </button>
          </CardTitle>
          <StatusBadge status={item.status} />
        </div>

        {item.description && (
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
            {item.description}
          </p>
        )}
      </CardHeader>

      {/* 元信息 */}
      <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs text-muted-foreground">
        <SourceBadge sourceType={item.sourceType} />
        {item.callCount != null && (
          <span>调用 {item.callCount} 次</span>
        )}
        {item.createTime && (
          <span>{formatZhDateTime(item.createTime)}</span>
        )}
      </CardContent>

      {/* 操作按钮 */}
      <CardFooter className="mt-auto flex items-center gap-1 border-t border-border/50 p-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="预览"
          onClick={() =>
            router.push(`/virtual-experiment/play/${item.id}`)
          }
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>

        {/* 审核操作（pending 状态且在 review 模式） */}
        {isPending && onApprove && onReject ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-600"
              title="通过"
              onClick={() => onApprove(item.id)}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600"
              title="拒绝"
              onClick={() => onReject(item.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="编辑"
              onClick={() => onEdit(item)}
            >
              <PenSquare className="h-3.5 w-3.5" />
            </Button>
            {canSubmit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="提交审核"
                onClick={() => onSubmitReview(item.id)}
              >
                <SendHorizontal className="h-3.5 w-3.5" />
              </Button>
            )}
          </>
        )}

        {onUploadCover && !isPending && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="上传封面"
            onClick={() => onUploadCover(item)}
          >
            <ImageUp className="h-3.5 w-3.5" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7 text-destructive"
          title="删除"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
