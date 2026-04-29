"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  sonnerToast,
  DataTable,
  DataTablePagination,
} from "@bs-lab/ui";
import {
  MessageSquarePlus,
  RefreshCw,
  Search,
  Bug,
  Sparkles,
  Paintbrush,
  HelpCircle,
} from "@bs-lab/ui/icons";
import { useReactTable, getCoreRowModel, getPaginationRowModel, type ColumnDef, type PaginationState } from "@bs-lab/ui/react-table";
import { ManagementKpiCards, type ManagementKpiCardItem } from "@/components/business/common/ManagementKpiCards";
import { ManagementPageFrame } from "@/components/business/common/ManagementPageFrame";
import { useSessionActor } from "@/hooks/use-session-actor";
import { fetchV2FeedbackGovernanceStats, fetchV2FeedbackList } from "@/lib/v2/v2-feedback-api";
import {
  type FeedbackItem,
  type FeedbackType,
  type FeedbackStatus,
  type FeedbackListResult,
  FEEDBACK_TYPE_LABEL,
  FEEDBACK_TYPE_BADGE_VARIANT,
  FEEDBACK_STATUS_LABEL,
  FEEDBACK_STATUS_BADGE_VARIANT,
} from "@/types/feedback";
import { FeedbackDetailSheet } from "@/components/business/feedback/feedback-detail-sheet";

const TYPE_ICON: Record<FeedbackType, React.ReactNode> = {
  BUG: <Bug className="size-4" />,
  FEATURE: <Sparkles className="size-4" />,
  OPTIMIZE: <Paintbrush className="size-4" />,
  INQUIRY: <HelpCircle className="size-4" />,
};

function formatTime(t: string | null | undefined): string {
  if (!t) return "-";
  try {
    const d = new Date(t);
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return t;
  }
}

export function FeedbackManageScreen() {
  const { actor } = useSessionActor();

  const [data, setData] = React.useState<FeedbackItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [governance, setGovernance] = React.useState<{ totalNew: number; totalAutoTriaged: number; topFingerprints: Array<{ issueFingerprint: string; count: number }> }>({
    totalNew: 0,
    totalAutoTriaged: 0,
    topFingerprints: [],
  });

  // 筛选
  const [filterType, setFilterType] = React.useState<FeedbackType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = React.useState<FeedbackStatus | "ALL">("ALL");
  const [keyword, setKeyword] = React.useState("");

  // 分页
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // 详情弹窗
  const [detailFeedbackId, setDetailFeedbackId] = React.useState<string | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  // KPI 统计
  const bugCount = React.useMemo(() => data.filter((d) => d.type === "BUG").length, [data]);
  const todoCount = React.useMemo(() => data.filter((d) => d.status === "TODO").length, [data]);
  const doneCount = React.useMemo(() => data.filter((d) => d.status === "DONE").length, [data]);
  const recentTriagedIds = React.useMemo(
    () => data.filter((d) => d.status === "AUTO_TRIAGED").slice(0, 3).map((d) => d.feedbackId),
    [data],
  );
  const hotFingerprintText = React.useMemo(() => {
    const top = governance.topFingerprints.slice(0, 5);
    if (top.length === 0) return "[无活跃指纹]";
    return top.map((item) => `${item.issueFingerprint} × ${item.count}`).join("; ");
  }, [governance.topFingerprints]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [result, stats] = await Promise.all([
        fetchV2FeedbackList(actor, {
          type: filterType !== "ALL" ? filterType : undefined,
          status: filterStatus !== "ALL" ? filterStatus : undefined,
          keyword: keyword || undefined,
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
        }),
        fetchV2FeedbackGovernanceStats(actor),
      ]);
      setData(result.items);
      setTotal(result.total);
      setGovernance(stats);
    } catch (e) {
      sonnerToast.error("加载反馈列表失败", {
        description: e instanceof Error ? e.message : "未知错误",
      });
    } finally {
      setLoading(false);
    }
  }, [actor, filterType, filterStatus, keyword, pagination.pageIndex, pagination.pageSize]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRowClick = React.useCallback((row: FeedbackItem) => {
    setDetailFeedbackId(row.feedbackId);
    setDetailOpen(true);
  }, []);

  const columns = React.useMemo<ColumnDef<FeedbackItem>[]>(
    () => [
      {
        id: "type",
        header: "类型",
        accessorKey: "type",
        cell: ({ row }) => (
          <Badge variant={FEEDBACK_TYPE_BADGE_VARIANT[row.original.type]}>
            {TYPE_ICON[row.original.type]}
            <span className="ml-1">{FEEDBACK_TYPE_LABEL[row.original.type]}</span>
          </Badge>
        ),
        size: 100,
      },
      {
        id: "title",
        header: "标题",
        accessorKey: "title",
        cell: ({ row }) => (
          <span className="max-w-[300px] truncate font-medium">{row.original.title}</span>
        ),
        size: 300,
      },
      {
        id: "reporter",
        header: "提报人",
        accessorFn: (row) => row.reporter?.name ?? "-",
        cell: ({ row }) => (
          <div className="max-w-[140px] truncate text-muted-foreground">
            {row.original.reporter?.name ?? "-"}
            {row.original.reporter?.orgName ? (
              <span className="block text-xs opacity-60">{row.original.reporter.orgName}</span>
            ) : null}
          </div>
        ),
        size: 140,
      },
      {
        id: "status",
        header: "状态",
        accessorKey: "status",
        cell: ({ row }) => (
          <Badge variant={FEEDBACK_STATUS_BADGE_VARIANT[row.original.status]}>
            {FEEDBACK_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
        size: 100,
      },
      {
        id: "createTime",
        header: "时间",
        accessorKey: "createTime",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTime(row.original.createTime)}
          </span>
        ),
        size: 120,
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
  });

  const kpiItems = React.useMemo<ManagementKpiCardItem[]>(
    () => [
      { key: "total", label: "总反馈数", value: total },
      {
        key: "bug",
        label: "故障",
        value: bugCount,
        tone: bugCount > 0 ? "danger" : "default",
      },
      {
        key: "todo",
        label: "待处理",
        value: todoCount,
        tone: todoCount > 0 ? "warning" : "default",
      },
      {
        key: "done",
        label: "已完成",
        value: doneCount,
        tone: "success",
      },
      {
        key: "triaged",
        label: "AI 分诊中",
        value: governance.totalAutoTriaged,
        tone: governance.totalAutoTriaged > 0 ? "default" : "default",
      },
    ],
    [total, bugCount, todoCount, doneCount, governance.totalAutoTriaged],
  );

  return (
    <>
      <ManagementPageFrame
        title={
          <>
            <MessageSquarePlus className="size-6 shrink-0 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground">用户反馈</h1>
          </>
        }
        description="查看并处理来自教师的反馈与建议，支持状态流转、自动分诊与修复记录。"
        kpis={<ManagementKpiCards items={kpiItems} />}
        cardTitle="反馈列表"
        cardToolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filterType}
              onValueChange={(v) => {
                setFilterType(v as FeedbackType | "ALL");
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[110px]" size="sm">
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部类型</SelectItem>
                {(Object.keys(FEEDBACK_TYPE_LABEL) as FeedbackType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {FEEDBACK_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v as FeedbackStatus | "ALL");
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[110px]" size="sm">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                {(Object.keys(FEEDBACK_STATUS_LABEL) as FeedbackStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {FEEDBACK_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索标题…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    fetchData();
                  }
                }}
                className="h-8 w-[180px] pl-8 text-sm"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                fetchData();
              }}
              disabled={loading}
            >
              <RefreshCw className={`mr-1 size-3.5 ${loading ? "animate-spin" : ""}`} />
              查询
            </Button>
          </div>
        }
      >
        <DataTable
          table={table}
          onRowClick={handleRowClick}
          emptyText="暂无反馈数据"
          showRowNumber
          rowNumberMode="global"
        />
        <DataTablePagination table={table} />
        <div className="grid gap-3 pt-2 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 text-sm font-medium text-foreground">最近分诊反馈</div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {recentTriagedIds.length > 0 ? recentTriagedIds.map((id) => (
                <span key={id} className="rounded-full border border-purple-300 bg-purple-50 px-2.5 py-1 text-purple-700">
                  {id}
                </span>
              )) : <span>[无最近分诊反馈]</span>}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 text-sm font-medium text-foreground">热点指纹</div>
            <div className="text-xs text-muted-foreground">{hotFingerprintText}</div>
          </div>
        </div>
      </ManagementPageFrame>

      <FeedbackDetailSheet
        feedbackId={detailFeedbackId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={fetchData}
      />
    </>
  );
}
