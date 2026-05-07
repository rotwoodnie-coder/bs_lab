"use client";

import * as React from "react";
import Link from "next/link";
import { Badge, sonnerToast } from "@bs-lab/ui";
import { CheckCircle2, FileEdit, Pencil, Plus, ThumbsUp, Trash2, XCircle } from "@bs-lab/ui/icons";
import { cn } from "@/lib/utils";
import { formatZhDateTime } from "@/lib/datetime/format-zh";
import type { ExperimentManageRow } from "../page.hooks";
import { RowActionsMenu } from "@/components/business/common/RowActionsMenu";
import {
  expStatusLabel,
  chooseTypeLabel,
  taskTypeLabel as taskTypeLabelShared,
} from "@/lib/v2/exp-display-mapping";

// ─── 工具 ─────────────────────────────────────────────────
/** 与 `exp_msg.status`：`t` 草稿，`y` 通过，`n` 不通过。文本来自 exp-display-mapping */
function statusLabel(status: string | null): { text: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  switch (status) {
    case "y": return { text: expStatusLabel(status), variant: "default" };
    case "t": return { text: expStatusLabel(status), variant: "secondary" };
    case "n": return { text: expStatusLabel(status), variant: "destructive" };
    default:  return { text: "—", variant: "outline" };
  }
}

function statusBadge(status: string | null) {
  // 对齐参考页：published / draft / rejected 的视觉
  if (status === "y") {
    return (
      <Badge variant="default" className="px-2.5 font-medium bg-green-500 hover:bg-green-600">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {expStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "t") {
    return (
      <Badge variant="outline" className="px-2.5 font-medium bg-white border-slate-200 text-slate-700">
        <FileEdit className="h-3 w-3 mr-1" />
        {expStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "n") {
    return (
      <Badge variant="destructive" className="px-2.5 font-medium">
        <XCircle className="h-3 w-3 mr-1" />
        {expStatusLabel(status)}
      </Badge>
    );
  }
  return <Badge variant="outline">未知</Badge>;
}

function chooseLabel(v: string | null) {
  return chooseTypeLabel(v);
}

function taskTypeLabel(v: string | null) {
  return taskTypeLabelShared(v);
}

// ─── Props ────────────────────────────────────────────────
interface Props {
  items: ExperimentManageRow[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  draftTotal?: number;
  fullScreen?: boolean;
  onPageChange: (n: number) => void;
  subjectNameById: Record<string, string>;
  gradeNameById: Record<string, string>;
  difficultyNameById: Record<string, string>;
  onAssign: (row: ExperimentManageRow) => void;
  onEdit: (row: ExperimentManageRow) => void;
  onDelete: (row: ExperimentManageRow) => void | Promise<void>;
  deletePending?: boolean;
}

// ─── 组件 ─────────────────────────────────────────────────
function truncate(s: string | null | undefined, max: number): string {
  if (!s) return "—";
  const t = s.trim();
  if (!t) return "—";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function isImageUrl(url: string): boolean {
  const u = url.trim();
  if (!u) return false;
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(u) || u.startsWith("data:image");
}

function subjectBadgeClassName(subjectLabel: string): string {
  const s = subjectLabel.trim();
  if (s.includes("物理")) return "bg-blue-100 text-blue-800";
  if (s.includes("化学")) return "bg-purple-100 text-purple-800";
  if (s.includes("生物")) return "bg-green-100 text-green-800";
  return "bg-muted text-muted-foreground";
}

function metricText(n: number | null | undefined): string {
  if (n == null) return "-";
  if (!Number.isFinite(n) || n <= 0) return "-";
  return Math.round(n).toLocaleString("zh-CN");
}

function metricActive(n: number | null | undefined): boolean {
  if (n == null) return false;
  if (!Number.isFinite(n)) return false;
  return n > 0;
}

export const ExperimentManageV2TableView = React.memo(function ExperimentManageV2TableView({
  items, loading, page, pageSize, total, onPageChange,
  draftTotal,
  fullScreen = false,
  subjectNameById, gradeNameById, difficultyNameById, onAssign, onEdit, onDelete, deletePending,
}: Props) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  /** 首屏无数据时弹性撑满，避免占位块与「有表 + 遮罩」之间高度切换抖动 */
  if (loading && items.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        加载中…
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        暂无数据
      </div>
    );
  }

  const showLoadingOverlay = loading && items.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-auto rounded-md border border-border",
          "[scrollbar-gutter:stable]",
        )}
      >
        {showLoadingOverlay ? (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-background/55 text-sm text-muted-foreground backdrop-blur-[1px]"
            aria-busy
            aria-live="polite"
          >
            加载中…
          </div>
        ) : null}
        <div className="min-w-[1060px]">
        <table className={cn("w-full min-w-0 table-fixed text-[13px] leading-6 min-[2000px]:text-sm min-[2000px]:leading-7", showLoadingOverlay && "pointer-events-none opacity-50")}>
          <colgroup>
            <col style={{ width: 48 }} /> {/* 序号 */}
            <col style={{ width: 80 }} /> {/* 实验图片 */}
            <col style={{ width: 200 }} /> {/* 实验名称 */}
            <col style={{ width: 80 }} /> {/* 学科 */}
            <col style={{ width: 80 }} /> {/* 年级 */}
            <col style={{ width: 80 }} /> {/* 难度 */}
            <col style={{ width: 80 }} /> {/* 状态 */}
            <col style={{ width: 120 }} /> {/* 发布教师 */}
            <col style={{ width: 80 }} /> {/* 热度 */}
            <col style={{ width: 160 }} /> {/* 修改时间 */}
            <col style={{ width: 100 }} /> {/* 操作 */}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <tr className="border-b border-border text-left">
              <th className="whitespace-nowrap px-2 py-4 text-center text-sm font-semibold text-black min-[2000px]:px-3">序号</th>
              <th className="px-2 py-4 text-sm font-semibold text-black min-[2000px]:px-3">实验图片</th>
              <th className="px-2 py-4 text-sm font-semibold text-black min-[2000px]:px-3">实验名称</th>
              <th className="px-2 py-4 text-sm font-semibold text-black min-[2000px]:px-3">学科</th>
              <th className="px-2 py-4 text-sm font-semibold text-black min-[2000px]:px-3">年级</th>
              <th className="px-2 py-4 text-sm font-semibold text-black min-[2000px]:px-3">难度</th>
              <th className="px-2 py-4 text-sm font-semibold text-black min-[2000px]:px-3">状态</th>
              <th className="px-2 py-4 text-sm font-semibold text-black min-[2000px]:px-3">发布教师</th>
              <th className="px-2 py-4 text-sm font-semibold text-black min-[2000px]:px-3">热度</th>
              <th className="px-2 py-4 text-sm font-semibold text-black min-[2000px]:px-3">修改时间</th>
              <th className="px-2 py-4 text-right text-sm font-semibold text-black min-[2000px]:px-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const rowNo = (page - 1) * pageSize + idx + 1;
              const subj =
                item.subjectId ? subjectNameById[item.subjectId] ?? item.subjectId : "—";
              const gr =
                item.gradeId ? gradeNameById[item.gradeId] ?? item.gradeId : "—";
              const difficulty =
                item.difficultyId ? difficultyNameById[item.difficultyId] ?? item.difficultyId : "—";
              // 对齐参考页：草稿行浅黄底
              const rowBg = item.status === "t" ? "bg-yellow-50" : "";
              // 封面优先级：exp_pic.pic_url（实验图片）> exp_video.video_url（实验视频，仅图片格式）
              const coverSrc = item.coverPicUrl?.trim() || item.coverVideoUrl?.trim() || "";
              const showCover = coverSrc && isImageUrl(coverSrc);
              return (
                <tr key={item.expId} className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${rowBg}`}>
                  <td className="px-2 py-4 text-sm text-center tabular-nums text-muted-foreground whitespace-nowrap min-[2000px]:px-3">{rowNo}</td>
                  <td className="px-2 py-4 text-sm min-[2000px]:px-3">
                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted/20">
                      {showCover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverSrc}
                          alt={item.expName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">—</div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm min-[2000px]:px-3">
                    <div className="min-w-0 max-w-[200px]">
                      <Link href={`/experiments/${encodeURIComponent(item.expId)}`} className="font-semibold block hover:underline text-foreground break-words">
                        {item.expName}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.classHour ? `约 ${Math.max(5, Math.round(Number(item.classHour) * 45))} 分钟` : "时长 —"}
                      </p>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm min-[2000px]:px-3">
                    <Badge className={subjectBadgeClassName(subj)}>{subj}</Badge>
                  </td>
                  <td className="px-2 py-4 text-sm min-[2000px]:px-3">
                    <span className="text-sm text-foreground">{gr}</span>
                  </td>
                  <td className="px-2 py-4 text-sm min-[2000px]:px-3">
                    <Badge variant="outline">{difficulty}</Badge>
                  </td>
                  <td className="px-2 py-4 text-sm min-[2000px]:px-3">
                    {statusBadge(item.status)}
                  </td>
                  <td className="min-w-[10rem] px-2 py-4 text-sm min-[2000px]:px-3">
                    <div className="text-sm leading-snug">
                      <p>{item.displayOwnerName ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">{item.createUserId ?? ""}</p>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm min-[2000px]:px-3">
                    <div className="flex items-center gap-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                        <ThumbsUp
                          className={cn("size-4 shrink-0 text-slate-400", !metricActive(item.likeNum) && "opacity-40")}
                          aria-hidden
                        />
                        {metricText(item.likeNum)}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-muted-foreground tabular-nums exp-mgmt-table-time min-[2000px]:px-3">
                    {formatZhDateTime(item.updateTime)}
                  </td>
                  <td className="px-2 py-4 text-right text-sm min-[2000px]:px-3">
                    <div className="flex justify-end">
                      <RowActionsMenu
                        size="md"
                        items={[
                          {
                            key: "edit",
                            label: "编辑",
                            icon: <Pencil className="size-4 text-muted-foreground" aria-hidden />,
                            onSelect: () => {
                              onEdit(item);
                            },
                          },
                          {
                            key: "assign",
                            label: item.publishInfo.publishStatus === "published" ? "再次布置" : "布置作业",
                            icon: <Plus className="size-4 text-muted-foreground" aria-hidden />,
                            onSelect: () => onAssign(item),
                          },
                          { key: "sep-1", separator: true, label: "sep-1" },
                          {
                            key: "delete",
                            label: "删除",
                            destructive: true,
                            disabled: Boolean(deletePending),
                            icon: <Trash2 className="size-4 text-muted-foreground" aria-hidden />,
                            confirm: {
                              title: "确认删除实验课程",
                              description: `将删除「${item.expName}」，此操作无法撤销。`,
                              confirmText: "确认删除",
                            },
                            onSelect: () => {
                              onDelete(item);
                            },
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
        <span className="inline-flex flex-wrap items-center gap-2">
          <span>共 {total} 条</span>
          {draftTotal ? <span>· 草稿 {draftTotal} 条</span> : null}
        </span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums">{page} / {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-border bg-background px-2 text-sm text-foreground disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              上一页
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-border bg-background px-2 text-sm text-foreground disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
