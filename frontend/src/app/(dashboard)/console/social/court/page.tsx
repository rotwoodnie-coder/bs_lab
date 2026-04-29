"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  sonnerToast,
} from "@bs-lab/ui";
import { Scale } from "@bs-lab/ui/icons";

import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { EmptyPlaceholder } from "@/components/business/common/EmptyPlaceholder";
import { EXPERIMENT_COMMUNITY_DOMAIN_VERSION } from "@/lib/console/experiment-community-domain";

type CourtPhase = "pending" | "jury" | "closed";

type CourtRowMock = {
  work_id: string;
  title: string;
  audit_court_status: string;
  votes: string;
  is_appealed: boolean;
  phase: CourtPhase;
};

const MOCK_CASES: CourtRowMock[] = [
  {
    work_id: "work_8f2a",
    title: "水的表面张力（课内）",
    audit_court_status: "pending",
    votes: "—",
    is_appealed: false,
    phase: "pending",
  },
  {
    work_id: "work_3c91",
    title: "创意：家庭电路小实验",
    audit_court_status: "in_progress",
    votes: "12 / 20",
    is_appealed: false,
    phase: "jury",
  },
  {
    work_id: "work_1d04",
    title: "植物向光性记录",
    audit_court_status: "resolved",
    votes: "14✓ / 6✗",
    is_appealed: true,
    phase: "closed",
  },
  {
    work_id: "work_9aa0",
    title: "小苏打与醋",
    audit_court_status: "resolved",
    votes: "教师终裁",
    is_appealed: false,
    phase: "closed",
  },
];

/**
 * 社区与法庭：任课教师仲裁 + 平台案件队列（原「社交仲裁」与「法庭案件管理」汇总页）。
 */
export default function CommunityCourtPage() {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [verdict, setVerdict] = React.useState<"keep" | "hide" | "flag">("keep");
  const [tab, setTab] = React.useState<CourtPhase>("pending");
  const [appealedOnly, setAppealedOnly] = React.useState(false);

  const openItem = React.useMemo(() => {
    return MOCK_CASES.find((row) => row.work_id === openId) ?? null;
  }, [openId]);

  const submitArbitration = () => {
    if (!openItem) return;
    const label =
      verdict === "keep" ? "维持展示" : verdict === "hide" ? "下架作品" : "标记不当内容";
    sonnerToast.success("仲裁已记录", { description: label });
    setOpenId(null);
  };

  const filtered = React.useMemo(() => {
    return MOCK_CASES.filter((row) => {
      if (row.phase !== tab) return false;
      if (appealedOnly && !row.is_appealed) return false;
      return true;
    });
  }, [tab, appealedOnly]);

  const isDestructiveVerdict = verdict === "hide" || verdict === "flag";

  return (
    <div className={`${DASHBOARD_MAIN_CONTAINER_CLASS} flex flex-col gap-6`}>
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="size-5 text-muted-foreground" />
            社区与法庭
          </CardTitle>
          <CardDescription>
            汇总「任课教师仲裁」与「小法庭 / 案件队列」：老师处置班级作品争议，平台侧跟踪众裁、申辩与后置发布。
          </CardDescription>
        </CardHeader>
      </Card>

      <section aria-labelledby="teacher-arbitration-heading" className="space-y-4">
        <h2 id="teacher-arbitration-heading" className="sr-only">任课教师仲裁</h2>
        <EmptyPlaceholder icon={<Scale className="size-6" />} title="暂无待处理的争议" description="数据等待真实接入。" />
      </section>

      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">法庭案件与平台队列</CardTitle>
              <CardDescription>
                众裁体现「小先生制」与民主参与；对外标识统一使用{" "}
                <strong className="font-medium text-foreground">work_id</strong>（作品），提交流水用{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">submission_id</code>{" "}
                仅存于技术层。发布采用<strong className="font-medium text-foreground">后置发布</strong>
                ：Resolved（通过）后自动进入 Feed。约定版本 {EXPERIMENT_COMMUNITY_DOMAIN_VERSION}。
              </CardDescription>
            </div>
            <Badge variant="secondary">骨架</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={tab} onValueChange={(v) => setTab(v as CourtPhase)} className="w-full sm:w-auto">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1 sm:w-auto">
                <TabsTrigger value="pending" className="flex-1 sm:flex-none">
                  待审
                </TabsTrigger>
                <TabsTrigger value="jury" className="flex-1 sm:flex-none">
                  众裁中
                </TabsTrigger>
                <TabsTrigger value="closed" className="flex-1 sm:flex-none">
                  已结案
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="appealed-only"
                  checked={appealedOnly}
                  onCheckedChange={(c) => setAppealedOnly(c === true)}
                />
                <Label htmlFor="appealed-only" className="cursor-pointer text-sm font-normal">
                  仅看申辩中（is_appealed）
                </Label>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/console/settings/system/users?focus=jury">法官资格 · 用户管理</Link>
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            学生端：作品被下架时出现红点，可进申辩页说明；老师与管理员在此按「是否申辩」筛队列处理。
          </p>

          <div className="rounded-md border border-border">
            {filtered.length === 0 ? (
              <div className="px-4 py-6">
                <EmptyPlaceholder
                  title="当前分类下无案件"
                  description="当前分类下无案件。"
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">work_id</TableHead>
                    <TableHead>作品摘要</TableHead>
                    <TableHead className="w-[130px]">audit_court_status</TableHead>
                    <TableHead className="w-[120px]">票数 / 状态</TableHead>
                    <TableHead className="w-[100px]">申辩</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.work_id}>
                      <TableCell className="font-mono text-xs">{row.work_id}</TableCell>
                      <TableCell className="text-sm">{row.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {row.audit_court_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.votes}</TableCell>
                      <TableCell>
                        {row.is_appealed ? (
                          <Badge variant="secondary">申辩中</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(openId)} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>仲裁裁定</DialogTitle>
            <DialogDescription>
              {openItem ? `${(openItem as any).title || (openItem as any).workTitle || "未命名任务"}（${openItem.studentName || "匿名学生"}）` : ""}
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={verdict}
            onValueChange={(v) => setVerdict(v as typeof verdict)}
            className="grid gap-3 py-2"
          >
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <RadioGroupItem value="keep" id="v-keep" />
              <Label htmlFor="v-keep" className="font-normal">
                维持展示
              </Label>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <RadioGroupItem value="hide" id="v-hide" />
              <Label htmlFor="v-hide" className="font-normal">
                下架作品
              </Label>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <RadioGroupItem value="flag" id="v-flag" />
              <Label htmlFor="v-flag" className="font-normal">
                标记不当内容
              </Label>
            </label>
          </RadioGroup>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setOpenId(null)}>
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 rounded-lg"
              variant={isDestructiveVerdict ? "destructive" : "default"}
              onClick={submitArbitration}
            >
              确认裁定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
