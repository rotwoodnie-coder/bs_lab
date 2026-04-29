"use client";

import * as React from "react";
import Link from "next/link";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  sonnerToast,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@bs-lab/ui";
import { Download, Eye, Loader2, Search } from "@bs-lab/ui/icons";

import { ResourcePreview } from "@/components/business/resource-preview";
import { useResourceCenterPolicy } from "@/components/layout/resource-center-policy-context";
import {
  RESOURCE_CENTER_ADMIN_ROLES,
  RESOURCE_CENTER_FEATURE_LABELS,
  type ResourceCenterFeatures,
} from "@/config/resource-center-policy";
import { UserRole, userRoleLabelZh } from "@/types/auth";
import { cn } from "@/lib/utils";
import type { ResourceItem } from "@/types/resource";
import { useSessionActor } from "@/hooks/use-session-actor";
import { useResourceList } from "./page.hooks";

const RESOURCE_STAGES = ["全部", "小学", "初中", "高中"] as const;
const RESOURCE_SUBJECTS = ["全部", "物理", "化学", "生物", "科学"] as const;
const RESOURCE_TYPES = ["全部", "视频", "课件", "压缩包"] as const;

function matchesTypeFilter(item: ResourceItem, typeLabel: string): boolean {
  if (typeLabel === "全部") return true;
  if (typeLabel === "视频") return item.kind === "video";
  if (typeLabel === "课件") return item.kind === "pdf";
  if (typeLabel === "压缩包") return item.kind === "package";
  return true;
}

export default function ResourcesCenterPage() {
  const { role } = useSessionActor();
  const { getEffectiveForRole, patchRole, resetAllToDefaults } = useResourceCenterPolicy();
  const effective = getEffectiveForRole(role);

  const showTeacherTrinityCard =
    role === UserRole.TEACHER ||
    role === UserRole.RESEARCHER ||
    role === UserRole.DISTRICT_ADMIN ||
    role === UserRole.SCHOOL_ADMIN ||
    role === UserRole.SUPER_ADMIN;

  const [q, setQ] = React.useState("");
  const [stage, setStage] = React.useState<string>("全部");
  const [subject, setSubject] = React.useState<string>("全部");
  const [resType, setResType] = React.useState<string>("全部");
  const [preview, setPreview] = React.useState<ResourceItem | null>(null);
  const { items, loading } = useResourceList();

  const [allocRole, setAllocRole] = React.useState<UserRole>(UserRole.TEACHER);
  const allocEffective = getEffectiveForRole(allocRole);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((item) => {
      if (stage !== "全部" && item.stage !== stage) return false;
      if (subject !== "全部" && item.subject !== subject) return false;
      if (!matchesTypeFilter(item, resType)) return false;
      if (needle && !item.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [q, stage, subject, resType]);

  const searchLocked = !effective.searchAndFilter;

  const renderResourceCard = (item: ResourceItem) => {
    const canPreview = effective.preview;
    const inner = (
      <Card
        className={cn(
          "h-full overflow-hidden border-border shadow-xs",
          canPreview && "transition-shadow hover:shadow-md",
        )}
      >
        <div
          className={cn(
            "relative h-36 bg-gradient-to-br sm:h-40",
            item.coverClassName,
          )}
        >
          <Badge className="absolute top-3 right-3" variant="secondary">
            {item.fileBadge}
          </Badge>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-2 text-base leading-snug">{item.title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-xs text-muted-foreground">
            {item.stage} · {item.subject}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 tabular-nums">
            <Download className="size-3.5 shrink-0" aria-hidden />
            {(item.downloads ?? 0).toLocaleString()}
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <Eye className="size-3.5 shrink-0" aria-hidden />
            {(item.views ?? 0).toLocaleString()}
          </span>
        </CardFooter>
      </Card>
    );

    if (!canPreview) {
      return (
        <div key={item.id} className="rounded-xl opacity-90">
          {inner}
        </div>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        className="block w-full rounded-xl text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setPreview(item)}
      >
        {inner}
      </button>
    );
  };

  if (!effective.moduleEnabled) {
    return (
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            实验工坊
          </h1>
        </header>
        <Alert className="border-border bg-muted/40">
          <AlertTitle>未开通实验工坊</AlertTitle>
          <AlertDescription>
            当前身份未被分配「实验工坊」模块权限。请联系超级管理员调整分配策略，或切换为已开通的管理类身份（教师 / 教研员 / 校管理员 / 区管理员 / 超级管理员）。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            实验工坊
          </h1>
          <p className="text-sm text-muted-foreground">
            教师维护实验素材，学生与教研员按权限浏览示范资源：支持 Word / PPT / PDF / 图片 / 视频 / Excel 等形态的筛选与预览。能力范围由超级管理员按角色分配。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {effective.exportCatalog ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                sonnerToast.success("已生成导出任务", {
                  description: `当前列表共 ${filtered.length} 条。`,
                })
              }
            >
              导出目录
            </Button>
          ) : null}
          {effective.submitResourceCta ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                sonnerToast.message("提交校本资源", { description: "将跳转上传向导（暂未接入）。" })
              }
            >
              提交资源
            </Button>
          ) : null}
          {effective.reviewShortcut && role === UserRole.RESEARCHER ? (
            <Button type="button" size="sm" asChild>
              <Link href="/console/review/experiments">前往实验评审</Link>
            </Button>
          ) : null}
        </div>
      </header>

      {showTeacherTrinityCard ? (
        <Card className="border-primary/20 bg-muted/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">三位一体 · 教师成长路径（PRD）</CardTitle>
            <CardDescription>
              「学习」区本示范案例 → 「使用」AI 与课堂下发 → 「建设」原创实验入库；与宝山区「科学小实验社区」叙事一致。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="learn" className="w-full">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
                <TabsTrigger value="learn" className="flex-1 sm:flex-none">
                  学习 · 区本示范
                </TabsTrigger>
                <TabsTrigger value="use" className="flex-1 sm:flex-none">
                  使用 · AI 与课堂
                </TabsTrigger>
                <TabsTrigger value="build" className="flex-1 sm:flex-none">
                  建设 · 原创实验
                </TabsTrigger>
              </TabsList>
              <TabsContent value="learn" className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>
                  下方列表为资源，对标 PRD「宝山 100」式<strong className="text-foreground">示范视频与步骤</strong>
                  ；筛选「视频」可快速浏览典型案例，用于兼职教师先学后用。
                </p>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href="#resource-grid-anchor">跳到资源列表</Link>
                </Button>
              </TabsContent>
              <TabsContent value="use" className="mt-3 flex flex-wrap gap-2 text-sm">
                <Button type="button" variant="secondary" size="sm" asChild>
                  <Link href="/teacher/assignments">作业任务 · 下发到班级</Link>
                </Button>
                <Button type="button" variant="secondary" size="sm" asChild>
                  <Link href="/teacher/experiment-editor">实验课程编辑</Link>
                </Button>
              </TabsContent>
              <TabsContent value="build" className="mt-3 flex flex-wrap gap-2 text-sm">
                <Button type="button" variant="secondary" size="sm" asChild>
                  <Link href="/experiment-manage">实验课程管理 · 台账与评审</Link>
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href="/console/review/experiments">实验评审</Link>
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : null}

      <div
        id="resource-grid-anchor"
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="resource-search" className="text-muted-foreground">
            搜索
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="resource-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="按资源名称关键词…"
              className="pl-9"
              disabled={searchLocked}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-muted-foreground">学段</Label>
            <Select value={stage} onValueChange={setStage} disabled={searchLocked}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="学段" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">学科</Label>
            <Select value={subject} onValueChange={setSubject} disabled={searchLocked}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="学科" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">资源类型</Label>
            <Select value={resType} onValueChange={setResType} disabled={searchLocked}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          加载中…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">没有符合筛选条件的资源。</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(renderResourceCard)}
        </div>
      )}

      {preview && effective.preview ? (
        <ResourcePreview
          resource={preview}
          open={!!preview}
          onOpenChange={(open) => {
            if (!open) setPreview(null);
          }}
        />
      ) : null}

      {role === UserRole.SUPER_ADMIN ? (
        <>
          <Separator />
          <Card className="border-primary/20 bg-primary/5 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">实验工坊 · 按角色分配（）</CardTitle>
              <CardDescription>
                以下为会话级策略（sessionStorage），模拟超级管理员为各角色开通能力；关闭「模块与导航」后对应身份侧栏将隐藏入口且无法使用本页功能。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="space-y-2 sm:min-w-[200px]">
                  <Label htmlFor="alloc-role">选择角色</Label>
                  <Select
                    value={allocRole}
                    onValueChange={(v) => setAllocRole(v as UserRole)}
                  >
                    <SelectTrigger id="alloc-role" className="w-full sm:w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_CENTER_ADMIN_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {userRoleLabelZh(r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => resetAllToDefaults()}>
                  恢复全局默认
                </Button>
              </div>

              <ul className="space-y-4">
                {RESOURCE_CENTER_FEATURE_LABELS.map(({ key, label, description }) => (
                  <li
                    key={key}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-background/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      checked={allocEffective[key]}
                      onCheckedChange={(checked) =>
                        patchRole(allocRole, { [key]: Boolean(checked) } as Partial<ResourceCenterFeatures>)
                      }
                      aria-label={`${userRoleLabelZh(allocRole)} · ${label}`}
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
