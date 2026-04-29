"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  MediaPreview,
  SafetyGuard,
  ScrollArea,
  ScrollAreaWithTopEdge,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  sonnerToast,
  Switch,
  TabSwitcher,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@bs-lab/ui";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  Info,
  Layers,
  Library,
  MonitorPlay,
  Pencil,
  Play,
  ShieldAlert,
  Share2,
  Sparkles,
  XCircle,
} from "@bs-lab/ui/icons";

import { AuditControlBar } from "@/components/business/experiment-detail/audit-control-bar";
import { SubmissionBar } from "@/components/business/experiment-detail/submission-bar";
import { ExperimentCardPulseGraph } from "@/components/business/experiment-card-pulse-graph";
import { ManagementAnimatedNumber } from "@/components/business/management-animated-number";
import { SimulationPlayer } from "@/components/business/simulation-player";
import { OrgPicker } from "@/components/business/org-picker";
import { useDemoRole } from "@/components/layout/demo-role-context";
import { useAppMode } from "@/context/app-mode-context";
import { findOrgPathInRoots } from "@/lib/org-tree";
import { useAuth } from "@/hooks/use-auth";
import { useCountUp } from "@/hooks/use-count-up";
import { useExperimentViewPermissions } from "@/hooks/use-experiment-view-permissions";
import { useExperimentHubBreakpoints } from "@/hooks/use-media-query";
import { useIsPortrait } from "@/hooks/use-portrait";
import { isOnlineSimulationReady } from "@/lib/experiment-simulation";
import {
  hasTeacherSubmittedSimulationDemand,
  submitTeacherSimulationDemand,
} from "@/lib/simulation-demand-store";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { cn } from "@/lib/utils";
import { isSuperUserRole } from "@/lib/rbac/management-access";
import { fetchV2SysOrgTree } from "@/lib/v2/v2-sys-api";
import { V2_ORG_TYPE_IDS } from "@/lib/v2/v2-org-type-constants";
import { UserRole } from "@/types/auth";
import type { OrgNode } from "@/types/org";
import type {
  EquipmentHazardLevel,
  ExperimentDetail,
  ExperimentScienceDiscipline,
  ExperimentStep,
} from "@/types/experiment";

function v2OrgTreeToPickerRoots(items: any[]): OrgNode[] {
  const schoolTypeSet = new Set<string>([V2_ORG_TYPE_IDS.school, V2_ORG_TYPE_IDS.campus]);
  const mapNode = (n: any): OrgNode[] => {
    const typeId: string | null | undefined = n?.orgTypeId ?? null;
    const children: any[] = Array.isArray(n?.children) ? n.children : [];

    if (typeId === V2_ORG_TYPE_IDS.grade || typeId === V2_ORG_TYPE_IDS.level) {
      return children.flatMap(mapNode);
    }

    const mappedChildren = children.flatMap(mapNode);
    if (typeId === V2_ORG_TYPE_IDS.class) {
      return [
        {
          id: String(n.orgId ?? ""),
          level: "class",
          name: String(n.orgName ?? "—"),
          children: undefined,
        },
      ];
    }
    if (schoolTypeSet.has(typeId ?? "")) {
      return [
        {
          id: String(n.orgId ?? ""),
          level: "school",
          name: String(n.orgName ?? "—"),
          children: mappedChildren.filter((c) => c.level === "class"),
        },
      ];
    }
    if (typeId === V2_ORG_TYPE_IDS.manage) {
      return [
        {
          id: String(n.orgId ?? ""),
          level: "district",
          name: String(n.orgName ?? "—"),
          children: mappedChildren.filter((c) => c.level === "school"),
        },
      ];
    }

    return mappedChildren;
  };

  const roots = (Array.isArray(items) ? items : []).flatMap(mapNode);
  const districts = roots.filter((r) => r.level === "district");
  if (districts.length) return districts;

  const schools = roots.filter((r) => r.level === "school");
  if (schools.length) {
    return [
      {
        id: "org-root",
        level: "district",
        name: "当前组织",
        children: schools,
      },
    ];
  }
  return [];
}

/** 教研员：右侧「评审表单」卡片；底部条留给校级 / 区级 / 超管 */
function showBottomApprovalStrip(role: UserRole): boolean {
  return (
    role === UserRole.SCHOOL_ADMIN ||
    role === UserRole.DISTRICT_ADMIN ||
    role === UserRole.SUPER_ADMIN
  );
}

function formatSuggestedDuration(sec: number | undefined): string {
  if (sec == null || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (s === 0) return `${m} 分钟`;
  return `${m} 分 ${s} 秒`;
}

function HazardIcon({ level }: { level: EquipmentHazardLevel }) {
  if (level === "danger") {
    return <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />;
  }
  if (level === "warning" || level === "caution") {
    return <AlertTriangle className="size-4 shrink-0 text-chart-1" aria-hidden />;
  }
  return null;
}

/** 器材名称旁：红色极度危险 / 橙色注意安全 */
function MaterialHazardBadge({ level }: { level: EquipmentHazardLevel }) {
  if (level === "danger") {
    return (
      <Badge variant="destructive" className="font-normal">
        极度危险
      </Badge>
    );
  }
  if (level === "warning" || level === "caution") {
    return (
      <Badge
        variant="outline"
        className="border-chart-1/50 bg-chart-1/10 font-normal text-chart-1 hover:bg-chart-1/15"
      >
        注意安全
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-normal">
      常规
    </Badge>
  );
}

function participationLabel(p: ExperimentDetail["teaching"]["participation"]): string {
  return p === "required" ? "必做" : "选做";
}

/** 详情页视觉档位：B 磨砂玻璃岛 / C 数据脉冲 / D 全息非对称；default 为纵向压缩基线 */
export type ExperimentDetailLayoutVariant = "default" | "B" | "C" | "D";

function detailDiscipline(d: ExperimentDetail): ExperimentScienceDiscipline | undefined {
  if (d.scienceDiscipline) return d.scienceDiscipline;
  const s = d.teaching.subject;
  if (s.includes("化学")) return "chemistry";
  if (s.includes("生物")) return "biology";
  if (s.includes("物理")) return "physics";
  return undefined;
}

function subjectAccentBorderClass(detail: ExperimentDetail): string {
  const disc = detailDiscipline(detail);
  if (disc === "chemistry") return "border-l-[3px] border-l-status-error/75";
  if (disc === "biology") return "border-l-[3px] border-l-status-success/75";
  return "border-l-[3px] border-l-primary/55";
}

function authorInitialsForDetail(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.length <= 2 ? t : t.slice(0, 2);
}

function AuthorDigitalBadge({ detail }: { detail: ExperimentDetail }) {
  const name = detail.authorDisplayName?.trim() || "发布者";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-muted/25 px-2.5 py-2">
      <Avatar className="size-10 shrink-0 rounded-md border border-primary/35">
        {detail.authorAvatarUrl ? <AvatarImage src={detail.authorAvatarUrl} alt="" /> : null}
        <AvatarFallback className="rounded-md font-mono text-xs">{authorInitialsForDetail(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 font-mono">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Publisher</p>
        <p className="truncate text-xs text-foreground">{name}</p>
      </div>
    </div>
  );
}

function TeacherSimulationDemandCard({ detail }: { detail: ExperimentDetail }) {
  const [submitted, setSubmitted] = React.useState(false);
  React.useEffect(() => {
    setSubmitted(hasTeacherSubmittedSimulationDemand(detail.id));
  }, [detail.id]);

  const handleApply = React.useCallback(() => {
    const { newlyCounted } = submitTeacherSimulationDemand(detail.id);
    setSubmitted(true);
    if (newlyCounted) {
      sonnerToast.success("需求已收录！", {
        description: "管理员将收到您的开发建议",
      });
    } else {
      sonnerToast.message("需求已登记", {
        description: "该实验的需求此前已登记，管理员仍可在任务中心查看累计申请。",
      });
    }
  }, [detail.id]);

  return (
    <Card className="border-dashed border-primary/40 bg-primary/5 shadow-xs">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MonitorPlay className="size-4 text-primary" />
          申请开发
        </CardTitle>
        <CardDescription>
          当前实验暂无在线模拟资源。提交后需求将进入区级「模拟开发管理」任务池（本地：每个实验仅计票一次）。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={submitted}
          onClick={handleApply}
        >
          {submitted ? "已申请在线模拟" : "申请在线模拟"}
        </Button>
      </CardContent>
    </Card>
  );
}

function approvalBadgeVariant(
  s: ExperimentDetail["management"]["approvalStatus"],
): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "approved":
      return "default";
    case "pending":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

function approvalLabel(s: ExperimentDetail["management"]["approvalStatus"]): string {
  const map = {
    draft: "草稿",
    pending: "待审批",
    approved: "已通过",
    rejected: "已驳回",
  } as const;
  return map[s];
}

export type ExperimentHubViewProps = {
  detail: ExperimentDetail;
  /** 响应式与视觉封版：B 磨砂玻璃 + 学科色边；C 标题下脉冲线；D 左封面右数据列（桌面） */
  variant?: ExperimentDetailLayoutVariant;
};

export function ExperimentHubView({ detail, variant = "default" }: ExperimentHubViewProps) {
  const { role } = useDemoRole();
  const { user } = useAuth();
  const { viewMode } = useAppMode();
  const { isMobile, isTablet, isDesktop, isTabletLandscape } = useExperimentHubBreakpoints();
  const portrait = useIsPortrait();
  const superUser = isSuperUserRole(role);
  const isStudent = role === UserRole.STUDENT;
  const isLearnerSide = role === UserRole.STUDENT || role === UserRole.PARENT;
  const isTeacher = role === UserRole.TEACHER || superUser;
  const isResearcher = role === UserRole.RESEARCHER || superUser;
  const showBottomApproval = showBottomApprovalStrip(role);
  const { loading: viewPermsLoading, capabilities: viewCaps } = useExperimentViewPermissions(detail.id);
  const gateAuditControl = isResearcher && viewCaps?.showAuditBar === true;
  const gateStudentSubmission = isStudent && viewCaps?.showSubmissionBar === true;
  const [publishOpen, setPublishOpen] = React.useState(false);
  const [publishClassId, setPublishClassId] = React.useState<string | null>(null);

  const v2Actor = React.useMemo(
    () => ({ role: user.role, orgId: user.orgId, userId: user.userId, userName: user.userName, tenantId: user.tenantId, appId: user.appId }),
    [user.appId, user.orgId, user.role, user.tenantId, user.userId, user.userName],
  );
  const [orgRoots, setOrgRoots] = React.useState<OrgNode[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    void fetchV2SysOrgTree(v2Actor)
      .then((rows) => {
        if (cancelled) return;
        setOrgRoots(v2OrgTreeToPickerRoots(rows as any[]));
      })
      .catch(() => {
        if (cancelled) return;
        setOrgRoots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [v2Actor]);

  React.useEffect(() => {
    if (publishClassId) return;
    const firstDistrict = orgRoots[0];
    const firstSchool = firstDistrict?.children?.find((x) => x.level === "school");
    const firstClass = firstSchool?.children?.find((x) => x.level === "class");
    if (firstClass?.id) setPublishClassId(firstClass.id);
  }, [orgRoots, publishClassId]);

  const durationTarget =
    detail.durationMin ??
    (detail.core.timer.suggestedDurationSec
      ? Math.max(1, Math.round(detail.core.timer.suggestedDurationSec / 60))
      : 0);
  const equipCountTarget = detail.core.equipment.length;
  const stepCountTarget = detail.core.steps.length;
  const completionTarget = detail.management.classCompletionRatePct ?? 0;
  const submissionTarget = detail.management.practiceSubmissionCount ?? 0;
  const averageScoreTarget = detail.management.classAverageScore ?? 0;

  const statAnim = !isStudent && viewMode === "management";
  const statMs = statAnim ? 900 : 0;
  const statMs2 = statAnim ? 1000 : 0;
  const statMs3 = statAnim ? 1100 : 0;

  const animDuration = useCountUp(durationTarget, { durationMs: statMs });
  const animEquip = useCountUp(equipCountTarget, { durationMs: statMs2 });
  const animSteps = useCountUp(stepCountTarget, { durationMs: statMs3 });

  const sortedSteps = React.useMemo(
    () => [...detail.core.steps].sort((a, b) => a.order - b.order),
    [detail.core.steps],
  );

  const [activeStepIndex, setActiveStepIndex] = React.useState(0);
  const activeStep: ExperimentStep | undefined = sortedSteps[activeStepIndex];

  const [homeByEqId, setHomeByEqId] = React.useState<Record<string, boolean>>({});
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [experimentStarted, setExperimentStarted] = React.useState(false);

  const [safetyDialogOpen, setSafetyDialogOpen] = React.useState(false);
  const [safetyReadAck, setSafetyReadAck] = React.useState(false);
  const [tabletSideDocked, setTabletSideDocked] = React.useState(false);
  const [adminReviewComment, setAdminReviewComment] = React.useState("");
  const [adminReviewOpinionExpanded, setAdminReviewOpinionExpanded] = React.useState(false);
  const [heroMediaTab, setHeroMediaTab] = React.useState<"demo-video" | "sim-lab">("demo-video");
  const [favorited, setFavorited] = React.useState(false);
  const showAdminReviewOpinionField = adminReviewOpinionExpanded || Boolean(adminReviewComment.trim());

  const needsSafetyGuard = isMobile || isTablet;

  React.useEffect(() => {
    if (!safetyDialogOpen) return;
    setSafetyReadAck(false);
  }, [safetyDialogOpen]);

  React.useEffect(() => {
    if (!needsSafetyGuard) {
      setSafetyDialogOpen(false);
      return;
    }
    setSafetyDialogOpen(true);
  }, [detail.id, needsSafetyGuard]);

  React.useEffect(() => {
    setAdminReviewOpinionExpanded(false);
  }, [detail.id]);

  const goPrevStep = React.useCallback(() => {
    setActiveStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNextStep = React.useCallback(() => {
    setActiveStepIndex((i) => Math.min(sortedSteps.length - 1, i + 1));
  }, [sortedSteps.length]);

  const requestStartExperiment = React.useCallback(() => {
    if (needsSafetyGuard) {
      setSafetyDialogOpen(true);
      return;
    }
    setExperimentStarted(true);
    sonnerToast.success("已开始实验", { description: "可按步骤顺序操作并记录数据。" });
  }, [needsSafetyGuard]);

  const confirmStartAfterSafety = React.useCallback(() => {
    if (!safetyReadAck) return;
    setSafetyDialogOpen(false);
    setExperimentStarted(true);
    sonnerToast.success("已确认安全须知，祝实验顺利");
  }, [safetyReadAck]);

  const handleAdminApprove = React.useCallback(() => {
    sonnerToast.success("已通过", { description: adminReviewComment || "无附加意见" });
  }, [adminReviewComment]);

  const handleAdminReject = React.useCallback(() => {
    sonnerToast.message("已驳回", { description: adminReviewComment || "请补充材料后重新提交" });
  }, [adminReviewComment]);

  const handlePublishConfirm = React.useCallback(() => {
    if (!publishClassId) return;
    const path = findOrgPathInRoots(orgRoots, publishClassId);
    const label = path?.map((n) => n.name).join(" › ") ?? publishClassId;
    sonnerToast.success("实验已推送到班级", { description: label });
    setPublishOpen(false);
  }, [orgRoots, publishClassId]);

  const topAuditSlot = gateAuditControl ? <AuditControlBar detail={detail} /> : null;

  const safetyPreviewCount = 2;
  const safetyAlerts = detail.core.safetyAlerts;
  const hasMoreSafetyLines = safetyAlerts.length > safetyPreviewCount;

  const safetyBlock = (
    <Alert
      variant="destructive"
      className={cn(
        "border-destructive/80 bg-destructive/10 px-3 py-2.5 shadow-sm [&>svg]:text-destructive",
        isStudent && "ring-2 ring-primary/35 ring-offset-2 ring-offset-background",
      )}
    >
      <ShieldAlert className="size-4 shrink-0" />
      <AlertDescription className="space-y-2 text-destructive">
        <p className="text-sm font-semibold leading-snug">安全红线（必读）</p>
        <ul className="list-inside list-disc space-y-0.5 text-xs leading-snug sm:text-sm">
          {safetyAlerts.slice(0, safetyPreviewCount).map((line, i) => (
            <li key={`safety-preview-${i}-${line.slice(0, 24)}`}>{line}</li>
          ))}
        </ul>
        {hasMoreSafetyLines ? (
          <Collapsible className="group/safety-collapsible w-full">
            <CollapsibleContent className="space-y-0.5 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
              <ul className="list-inside list-disc space-y-0.5 text-xs leading-snug sm:text-sm">
                {safetyAlerts.slice(safetyPreviewCount).map((line, i) => (
                  <li key={`safety-more-${i}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ul>
            </CollapsibleContent>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-full justify-between gap-2 px-2 text-xs font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <span className="text-left">
                  展开更多
                  <span className="ml-1 tabular-nums opacity-80">
                    （{safetyAlerts.length - safetyPreviewCount} 条）
                  </span>
                </span>
                <ChevronDown className="size-3.5 shrink-0 opacity-70 transition-transform duration-200 group-data-[state=open]/safety-collapsible:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        ) : null}
      </AlertDescription>
    </Alert>
  );

  const equipmentSwitchListEl = (
    <LayoutGroup id={`eq-materials-${detail.id}`}>
      <ul className="space-y-3">
        {detail.core.equipment.map((item) => {
          const useHome = Boolean(homeByEqId[item.id]);
          const displayName = useHome && item.homeSubstitute ? item.homeSubstitute : item.name;
          const displayImage =
            useHome && item.homeSubstituteImageUrl ? item.homeSubstituteImageUrl : item.imageUrl;
          return (
            <motion.li
              key={item.id}
              layout
              transition={{ layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
              className="flex gap-3 rounded-md border border-border/60 bg-muted/20 p-3"
            >
              <motion.div
                layout
                className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted"
              >
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={`${item.id}-${useHome ? "home" : "lab"}`}
                    layout
                    initial={{ opacity: 0, x: useHome ? -8 : 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: useHome ? 8 : -8 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    {displayImage ? (
                      <Image src={displayImage} alt="" fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <FlaskConical className="size-6 opacity-40" />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <AnimatePresence initial={false} mode="wait">
                      <motion.p
                        key={`${item.id}-name-${useHome ? "h" : "l"}`}
                        layout
                        initial={{ opacity: 0, x: useHome ? -6 : 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: useHome ? 6 : -6 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="font-medium text-foreground"
                      >
                        {displayName}
                      </motion.p>
                    </AnimatePresence>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <MaterialHazardBadge level={item.hazard} />
                      <HazardIcon level={item.hazard} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Label
                      htmlFor={`eq-home-${item.id}`}
                      className="text-xs leading-none text-muted-foreground"
                    >
                      家庭替代
                    </Label>
                    <Switch
                      id={`eq-home-${item.id}`}
                      size="sm"
                      checked={useHome}
                      onCheckedChange={(v) => setHomeByEqId((prev) => ({ ...prev, [item.id]: v === true }))}
                      aria-label={`${item.name}：在实验室与家庭替代间切换`}
                    />
                  </div>
                </div>
                {item.measureNote ? (
                  <p className="text-xs text-muted-foreground">量取：{item.measureNote}</p>
                ) : null}
                {item.homeSubstitute && !useHome ? (
                  <p className="text-xs text-muted-foreground">打开「家庭替代」开关可查看替代名称与配图</p>
                ) : null}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </LayoutGroup>
  );

  const materialsCard = (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4 text-primary" />
            材料清单
          </CardTitle>
          <CardDescription>每项可切换「实验室标准名 / 家庭替代品」；危险属性见徽章</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">{equipmentSwitchListEl}</CardContent>
    </Card>
  );

  const standardsBody = (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground">课标主题</p>
        <p className="text-foreground">{detail.teaching.curriculum.level1Theme}</p>
        <p className="text-muted-foreground">{detail.teaching.curriculum.level2Theme}</p>
        <Separator className="my-2" />
        <p className="text-xs font-medium text-muted-foreground">核心素养</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {detail.teaching.curriculum.coreCompetencies.map((c) => (
            <Badge key={c} variant="outline" className="font-normal">
              {c}
            </Badge>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border/60 p-3">
        <p className="text-xs text-muted-foreground">教材</p>
        <p className="font-medium text-foreground">{detail.teaching.textbook.version}</p>
        <p className="text-sm text-muted-foreground">
          {detail.teaching.textbook.unit} · {detail.teaching.textbook.section}
        </p>
      </div>
    </div>
  );

  const standardsCard = (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4 text-primary" />
          课标 / 教材对照
        </CardTitle>
        <CardDescription>脑图：对照课标、教材锚点；材料危险与家庭替代见侧栏清单；步骤见主栏</CardDescription>
      </CardHeader>
      <CardContent>{standardsBody}</CardContent>
    </Card>
  );

  const learnerCurriculumCollapsible = isLearnerSide ? (
    <Collapsible defaultOpen={false} className="rounded-xl border border-border/80 bg-card shadow-sm ring-1 ring-primary/20">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/40"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            对照课标
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border/60 px-4 pb-4 pt-2">{standardsBody}</div>
      </CollapsibleContent>
    </Collapsible>
  ) : null;

  const researcherCurriculumBoard = isResearcher ? (
    <Collapsible defaultOpen className="rounded-xl border border-border/80 shadow-sm">
      <Card className="border-0 shadow-none">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-auto min-h-0 flex-1 justify-start gap-2 px-1 py-1 text-left has-[>svg]:px-1"
              >
                <BookOpen className="size-4 shrink-0 text-primary" />
                <span className="text-base font-semibold leading-tight">对照课标</span>
                <ChevronDown className="size-4 shrink-0 opacity-60" />
              </Button>
            </CollapsibleTrigger>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() =>
                sonnerToast.message("编辑 / 批注", { description: "课标对照批注入口（，未接后端）。" })
              }
            >
              <Pencil className="size-3.5" />
              编辑 / 批注
            </Button>
          </div>
          <CardDescription>教研视角：默认展开；批注可同步至校本资源（）。</CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="border-t border-border/60 pt-4">{standardsBody}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  ) : null;

  const teachingAccordion = (
    <Accordion type="multiple" className="rounded-xl border border-border/80 bg-card px-2">
      <AccordionItem value="bg">
        <AccordionTrigger className="text-sm">教学背景</AccordionTrigger>
        <AccordionContent className="space-y-2 pb-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{detail.teaching.subject}</Badge>
            <Badge variant="outline">{detail.teaching.stage}</Badge>
            <Badge variant="outline">{detail.teaching.gradeLabel}</Badge>
            <Badge variant={detail.teaching.participation === "required" ? "default" : "secondary"}>
              {participationLabel(detail.teaching.participation)}
            </Badge>
          </div>
        </AccordionContent>
      </AccordionItem>
      {!isLearnerSide ? (
        <AccordionItem value="std">
          <AccordionTrigger className="text-sm">课标与教材（折叠）</AccordionTrigger>
          <AccordionContent className="pb-4">
            {isResearcher ? researcherCurriculumBoard : standardsCard}
          </AccordionContent>
        </AccordionItem>
      ) : null}
    </Accordion>
  );

  const stepsPanel = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={experimentStarted ? "default" : "secondary"}>
            {experimentStarted ? "进行中" : "未开始"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            建议时长 {formatSuggestedDuration(detail.core.timer.suggestedDurationSec)}
          </span>
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="icon-sm" onClick={goPrevStep} disabled={activeStepIndex <= 0}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={goNextStep}
            disabled={activeStepIndex >= sortedSteps.length - 1}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,220px)_1fr]">
        <ScrollAreaWithTopEdge className="h-[min(420px,50vh)] lg:h-[420px]">
          <div className="rounded-md border border-border/60">
          <ol className="space-y-1 p-2">
            {sortedSteps.map((step, idx) => {
              const isActive = idx === activeStepIndex;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 font-medium text-foreground ring-1 ring-primary/30"
                        : "text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {step.order}
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          </div>
        </ScrollAreaWithTopEdge>

        <div className="min-h-[280px] space-y-3 rounded-md border border-border/60 bg-card/50 p-4">
          {activeStep ? (
            <>
              <h3 className="text-base font-semibold text-foreground">{activeStep.title}</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{activeStep.content}</p>
              {activeStep.media?.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeStep.media.map((m, i) =>
                    m.type === "image" ? (
                      <div key={i} className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                        <Image src={m.url} alt={m.alt ?? ""} fill className="object-contain" sizes="(max-width:768px) 100vw, 400px" />
                      </div>
                    ) : (
                      <div
                        key={i}
                        className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground"
                      >
                        <Play className="size-10 opacity-50" />
                        <span>视频占位</span>
                        <span className="max-w-full truncate px-2 text-xs">{m.url}</span>
                      </div>
                    ),
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">暂无步骤</p>
          )}
        </div>
      </div>
    </div>
  );

  const principlePanel = (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{detail.core.principle}</p>
  );

  const teacherPublishDialog = isTeacher ? (
    <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>推送到班级</DialogTitle>
          <DialogDescription>在组织架构中选择目标班级。</DialogDescription>
        </DialogHeader>
        <OrgPicker roots={orgRoots} value={publishClassId} onChange={setPublishClassId} />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setPublishOpen(false)}>
            取消
          </Button>
          <Button type="button" onClick={handlePublishConfirm}>
            确认推送
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  const tabletDesktopActions = !isMobile ? (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={requestStartExperiment} className="gap-2">
        <Play className="size-4" />
        开始实验
      </Button>
      {isTeacher ? (
        <Button type="button" variant="outline" className="gap-2" onClick={() => setPublishOpen(true)}>
          <Share2 className="size-4" />
          实验发布
        </Button>
      ) : null}
      {showBottomApproval ? (
        <Button type="button" variant="outline" asChild>
          <a href="#approval-strip">跳转到审批</a>
        </Button>
      ) : null}
      {gateAuditControl ? (
        <Button type="button" variant="outline" asChild>
          <a href="#audit-control-bar">教研审批</a>
        </Button>
      ) : null}
      {gateStudentSubmission ? (
        <Button type="button" variant="outline" asChild>
          <a href="#student-submission-bar">学习反馈</a>
        </Button>
      ) : null}
    </div>
  ) : null;

  const extensionPanel = (
    <div className="space-y-4">
      {detail.extension.scientistStory ? (
        <Card className="border-border/80 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              科学家故事
            </CardTitle>
            <CardDescription>
              {detail.extension.scientistStory.name}
              {detail.extension.scientistStory.period ? ` · ${detail.extension.scientistStory.period}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            {detail.extension.scientistStory.summary}
          </CardContent>
        </Card>
      ) : null}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">拓展实验</h4>
        {detail.extension.extensionExperiments.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无拓展条目。</p>
        ) : (
          <ul className="space-y-2">
            {detail.extension.extensionExperiments.map((ex) => (
              <li key={ex.id} className="rounded-lg border border-border/60 bg-muted/15 p-3">
                <p className="font-medium text-foreground">{ex.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{ex.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const simulationEmbedSrc = detail.simulationConfig?.embedSrc?.trim() ?? "";

  const heroVideoPanel = (
    <div className="relative aspect-[21/9] max-h-[min(220px,24svh)] min-h-[120px] w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
      {detail.bannerVideoUrl ? (
        <MediaPreview
          kind="video"
          variant="default"
          src={detail.bannerVideoUrl}
          className="size-full object-cover"
          alt=""
          videoProps={{ controls: true, playsInline: true, preload: "metadata" }}
        />
      ) : (
        <>
          {detail.coverImageUrl ? (
            <Image
              src={detail.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 70vw"
            />
          ) : (
            <div className="flex size-full items-center justify-center gap-2 text-muted-foreground">
              <FlaskConical className="size-12 opacity-30" />
              <span className="text-sm">Banner 大图占位</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
            <Button type="button" size="lg" variant="secondary" className="pointer-events-none gap-2 shadow-lg">
              <Play className="size-5" />
              实操视频（占位）
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const labSimulationBlock = isOnlineSimulationReady(detail) ? (
    <SimulationPlayer experimentId={detail.id} title={detail.title} embedSrc={simulationEmbedSrc} />
  ) : isTeacher ? (
    <TeacherSimulationDemandCard detail={detail} />
  ) : (
    <Card className="border-border/80 bg-muted/20 shadow-xs">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MonitorPlay className="size-4 text-muted-foreground" />
          在线模拟实验室
        </CardTitle>
        <CardDescription>该实验的交互模拟尚在开发中，可在「实操视频」中查看引导资源。</CardDescription>
      </CardHeader>
    </Card>
  );

  const heroLabPanel = (
    <div className="space-y-4">
      {labSimulationBlock}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">实验材料</CardTitle>
          <CardDescription>每条材料独立开关，名称与配图在「实验室」与「家庭替代」间即时切换</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">{equipmentSwitchListEl}</CardContent>
      </Card>
    </div>
  );

  const heroMediaTabs = (
    <div className="w-full space-y-3 sm:space-y-4">
      <TabSwitcher
        variant="segmented"
        layoutIdPrefix="hero-media"
        className="w-full"
        activeId={heroMediaTab}
        onChange={(id) => setHeroMediaTab(id as "demo-video" | "sim-lab")}
        items={[
          { id: "demo-video", label: "实操视频", icon: <Play className="size-3.5" /> },
          { id: "sim-lab", label: "在线模拟实验室", icon: <MonitorPlay className="size-3.5" /> },
        ]}
      />
      <div className="relative min-h-[min(140px,28vh)] w-full overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={heroMediaTab}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {heroMediaTab === "demo-video" ? heroVideoPanel : heroLabPanel}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  const mainTabs = (
    <Tabs defaultValue="steps" className="w-full">
      <TabsList className="mb-4 min-h-12 h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
        <TabsTrigger value="steps" className="gap-1.5">
          <ClipboardList className="size-3.5" />
          实验步骤
        </TabsTrigger>
        <TabsTrigger value="principle" className="gap-1.5">
          <Library className="size-3.5" />
          实验原理
        </TabsTrigger>
        <TabsTrigger value="extend" className="gap-1.5">
          <Sparkles className="size-3.5" />
          科学拓展
        </TabsTrigger>
      </TabsList>
      <TabsContent value="steps" className="mt-0">
        {stepsPanel}
      </TabsContent>
      <TabsContent value="principle" className="mt-0">
        {principlePanel}
      </TabsContent>
      <TabsContent value="extend" className="mt-0">
        {extensionPanel}
      </TabsContent>
    </Tabs>
  );

  const favoriteShareRow = (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2.5 text-xs"
        onClick={() => {
          setFavorited((f) => {
            const next = !f;
            sonnerToast.success(next ? "已加入收藏" : "已取消收藏");
            return next;
          });
        }}
      >
        <Bookmark className={cn("size-3.5", favorited && "fill-current")} aria-hidden />
        收藏
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2.5 text-xs"
        onClick={() =>
          sonnerToast.message("分享", { description: `生成分享链接：${detail.id}` })
        }
      >
        <Share2 className="size-3.5" aria-hidden />
        分享
      </Button>
    </div>
  );

  const titleBlockShellClass = cn(
    "space-y-2",
    variant === "B" &&
      cn(
        "rounded-2xl border border-border/40 bg-background/55 p-3 shadow-lg backdrop-blur-xl ring-1 ring-inset ring-foreground/5 dark:bg-background/40 dark:ring-foreground/10",
        subjectAccentBorderClass(detail),
        "pl-3.5",
      ),
  );

  const titleBlock = (
    <div className={titleBlockShellClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline">{detail.teaching.subject}</Badge>
          <Badge variant="secondary">{detail.gradeLabel}</Badge>
          {detail.categoryLabel ? <Badge variant="outline">{detail.categoryLabel}</Badge> : null}
          {!isStudent ? (
            <Badge variant={approvalBadgeVariant(detail.management.approvalStatus)}>
              {approvalLabel(detail.management.approvalStatus)}
            </Badge>
          ) : null}
        </div>
        {favoriteShareRow}
      </div>
      <h1
        className={cn(
          "text-balance font-semibold leading-snug tracking-tight text-foreground",
          "text-xl sm:text-2xl",
          variant === "B" && "line-clamp-2",
          variant === "D" && "font-mono uppercase tracking-wide",
        )}
      >
        {detail.title}
      </h1>
      {variant === "C" ? <ExperimentCardPulseGraph className="mt-1 max-w-xl text-chart-2" /> : null}
      {detail.summary ? (
        <p
          className={cn(
            "max-w-3xl text-sm leading-snug text-muted-foreground line-clamp-2",
            variant === "D" && "font-mono text-xs",
          )}
        >
          {detail.summary}
        </p>
      ) : null}
      <div
        className={cn(
          "flex flex-wrap gap-x-4 gap-y-1 text-sm leading-snug",
          variant === "D" && "font-mono text-xs",
        )}
      >
        <div>
          <span className="text-muted-foreground">实验耗时 </span>
          {isMobile && portrait === true ? (
            <span className="font-semibold text-foreground">
              约{" "}
              <ManagementAnimatedNumber value={durationTarget} durationMs={950} className="text-foreground" /> 分钟
            </span>
          ) : (
            <span className="font-semibold tabular-nums text-foreground">约 {animDuration} 分钟</span>
          )}
        </div>
        <div>
          <span className="text-muted-foreground">器材 </span>
          <span className="font-semibold tabular-nums text-foreground">{animEquip} 件</span>
        </div>
        <div>
          <span className="text-muted-foreground">步骤 </span>
          <span className="font-semibold tabular-nums text-foreground">{animSteps} 步</span>
        </div>
        {!isStudent && viewMode === "management" ? (
          <>
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-muted-foreground">本班完成率 </span>
              <span className="font-semibold text-foreground">
                <ManagementAnimatedNumber value={completionTarget} durationMs={820} suffix="%" />
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-muted-foreground">平均得分 </span>
              <span className="font-semibold text-foreground">
                <ManagementAnimatedNumber value={averageScoreTarget} durationMs={980} decimals={1} /> 分
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-muted-foreground">已提交份数 </span>
              <span className="font-semibold text-foreground">
                <ManagementAnimatedNumber value={submissionTarget} durationMs={1100} suffix=" 份" />
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );

  const railStackBelowTabs = (
    <>
      {safetyBlock}
      {isLearnerSide ? learnerCurriculumCollapsible : null}
      {materialsCard}
      {!isLearnerSide && isResearcher ? researcherCurriculumBoard : null}
      {!isLearnerSide && !isResearcher && !isMobile ? standardsCard : null}
    </>
  );

  const rightRail = <div className="flex flex-col gap-4">{railStackBelowTabs}</div>;

  const approvalBarClass = cn(
    "border-t border-primary/30 bg-primary/10 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md dark:shadow-[0_-12px_40px_rgba(0,0,0,0.45)]",
  );

  const approvalInner = showBottomApproval ? (
    <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "space-y-1.5 py-1.5")}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-primary px-2 py-0.5 text-xs text-primary-foreground">审批</Badge>
        <span className="text-xs font-medium text-foreground sm:text-sm">教研员 / 管理员通道</span>
      </div>
      {detail.management.reviewerComment ? (
        <Alert className="border-border bg-muted/30">
          <Info className="size-4" />
          <AlertDescription className="text-sm">
            <span className="font-medium text-foreground">上次意见：</span>
            {detail.management.reviewerComment}
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="review-note">审批意见</Label>
          {showAdminReviewOpinionField && !adminReviewComment.trim() ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => setAdminReviewOpinionExpanded(false)}
            >
              收起
            </Button>
          ) : null}
        </div>
        {showAdminReviewOpinionField ? (
          <Textarea
            id="review-note"
            placeholder="填写通过说明或驳回原因…"
            value={adminReviewComment}
            onChange={(e) => setAdminReviewComment(e.target.value)}
            className="min-h-[52px] resize-y sm:min-h-[56px]"
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full justify-start font-normal text-muted-foreground"
            onClick={() => setAdminReviewOpinionExpanded(true)}
          >
            添加审批意见…
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" className="h-8 gap-1.5 px-3" onClick={handleAdminApprove}>
          <CheckCircle2 className="size-3.5" />
          通过
        </Button>
        <Button type="button" size="sm" variant="destructive" className="h-8 gap-1.5 px-3" onClick={handleAdminReject}>
          <XCircle className="size-3.5" />
          驳回
        </Button>
      </div>
    </div>
  ) : null;

  const mobileBottomDock =
    isMobile ? (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-safe-bottom shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md dark:shadow-[0_-4px_24px_rgba(0,0,0,0.25)]">
        {gateStudentSubmission ? (
          <div className="max-h-[min(36vh,300px)] overflow-y-auto overscroll-y-contain border-b border-border/60">
            <SubmissionBar detail={detail} />
          </div>
        ) : null}
        {approvalInner ? (
          <div
            id="approval-strip"
            className={cn(
              approvalBarClass,
              "max-h-[min(40vh,340px)] overflow-y-auto overscroll-y-contain border-b border-border/60",
            )}
          >
            {approvalInner}
          </div>
        ) : null}
        <div className="flex gap-2 p-3">
          <Button type="button" className="min-h-11 flex-1 gap-2" onClick={requestStartExperiment}>
            <Play className="size-4" />
            开始实验
          </Button>
        </div>
      </div>
    ) : null;

  const desktopTabletApprovalBar =
    !isMobile && approvalInner ? (
      <div
        id="approval-strip"
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 max-h-16 overflow-y-auto overscroll-y-contain pb-safe-bottom",
          approvalBarClass,
        )}
      >
        {approvalInner}
      </div>
    ) : null;

  const desktopTabletStudentSubmissionBar =
    !isMobile && gateStudentSubmission ? (
      <div className="fixed inset-x-0 bottom-0 z-[29] max-h-[min(40vh,220px)] overflow-y-auto overscroll-y-contain pb-safe-bottom">
        <SubmissionBar detail={detail} />
      </div>
    ) : null;

  const pageBottomPadding = cn(
    isMobile && showBottomApproval && gateStudentSubmission && "pb-[28rem]",
    isMobile && showBottomApproval && !gateStudentSubmission && "pb-80",
    isMobile && !showBottomApproval && gateStudentSubmission && "pb-52",
    isMobile && !showBottomApproval && !gateStudentSubmission && "pb-28",
    !isMobile && showBottomApproval && gateStudentSubmission && "pb-52",
    !isMobile && showBottomApproval && !gateStudentSubmission && "pb-24",
    !isMobile && !showBottomApproval && gateStudentSubmission && "pb-40",
    !isMobile && !showBottomApproval && !gateStudentSubmission && "pb-12",
  );

  const safetyFullScreenDialog = needsSafetyGuard ? (
    <SafetyGuard
      open={safetyDialogOpen}
      onOpenChange={setSafetyDialogOpen}
      title="安全确认（全屏）"
      description="请在教师或监护人指导下操作。请完整阅读下列安全红线后再进入实验。"
      acknowledgeId="safety-ack-hub"
      acknowledgeLabel="我已知晓实验风险，并在教师或监护人指导下操作"
      acknowledgeChecked={safetyReadAck}
      onAcknowledgeChange={setSafetyReadAck}
      onConfirm={confirmStartAfterSafety}
      cancelLabel="暂不进入"
      confirmLabel="进入实验"
    >
      <div className="space-y-3 text-sm">
        <p className="font-semibold text-foreground">安全红线（必读）</p>
        <ul className="list-inside list-disc space-y-2 text-foreground">
          {detail.core.safetyAlerts.map((line, i) => (
            <li key={`${i}-${line.slice(0, 24)}`} className="marker:text-muted-foreground">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </SafetyGuard>
  ) : null;

  if (isMobile) {
    return (
      <div className={cn("min-w-0 space-y-4", pageBottomPadding)}>
        <Button type="button" variant="ghost" size="sm" className="gap-1 px-0" asChild>
          <Link href="/experiments">
            <ArrowLeft className="size-4" />
            返回实验库
          </Link>
        </Button>

        {topAuditSlot}
        {heroMediaTabs}
        {variant === "D" ? <AuthorDigitalBadge detail={detail} /> : null}
        {titleBlock}
        <div className="space-y-3">{safetyBlock}</div>
        {isLearnerSide ? learnerCurriculumCollapsible : null}
        {teachingAccordion}
        <Card className="border-border/80 p-4 shadow-sm">{mainTabs}</Card>

        {safetyFullScreenDialog}

        {isTeacher ? (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => setPublishOpen(true)}
          >
            <Share2 className="size-4" />
            实验发布
          </Button>
        ) : null}
        {teacherPublishDialog}
        {mobileBottomDock}
      </div>
    );
  }

  /** 平板：主栏 + 右侧 Sheet（材料 / 安全 / 课标） */
  if (isTablet) {
    return (
      <div className={cn("min-w-0 space-y-4", pageBottomPadding)}>
        <Button type="button" variant="ghost" size="sm" className="gap-1 px-0" asChild>
          <Link href="/experiments">
            <ArrowLeft className="size-4" />
            返回实验库
          </Link>
        </Button>

        {topAuditSlot}
        <div
          className={cn(
            "grid min-w-0 gap-4",
            isTabletLandscape && tabletSideDocked && "md:grid-cols-[minmax(0,1fr)_minmax(260px,34%)]",
            (!isTabletLandscape || !tabletSideDocked) && "grid-cols-1",
          )}
        >
          <div className="min-w-0 space-y-4">
            {heroMediaTabs}
            {variant === "D" ? <AuthorDigitalBadge detail={detail} /> : null}
            {titleBlock}
            {tabletDesktopActions}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {isTabletLandscape ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setTabletSideDocked((d) => !d)}
                >
                  {tabletSideDocked ? "收起固定侧栏" : "固定侧栏（双栏）"}
                </Button>
              ) : null}
              {!(isTabletLandscape && tabletSideDocked) ? (
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" className="gap-2">
                      <Layers className="size-4" />
                      材料与安全 · 课标
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[min(100%,420px)] gap-0 overflow-y-auto p-4">
                    <SheetHeader className="pb-4 text-left">
                      <SheetTitle>侧边资料</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4">{rightRail}</div>
                  </SheetContent>
                </Sheet>
              ) : null}
            </div>
            <Card className="border-border/80 p-4 shadow-sm">{mainTabs}</Card>
          </div>
          {isTabletLandscape && tabletSideDocked ? (
            <aside className="hidden min-h-0 md:block">
              <div className="sticky top-24 flex max-h-[calc(100dvh-7rem)] flex-col gap-4 overflow-y-auto pb-6">
                {rightRail}
              </div>
            </aside>
          ) : null}
        </div>

        {safetyFullScreenDialog}
        {teacherPublishDialog}
        {desktopTabletStudentSubmissionBar}
        {desktopTabletApprovalBar}
      </div>
    );
  }

  /** 桌面：D 全息 — 左封面右数据主列（材料与安全并入主列） */
  if (variant === "D") {
    return (
      <div className={cn("min-w-0 space-y-4", pageBottomPadding)}>
        <Button type="button" variant="ghost" size="sm" className="gap-1 px-0" asChild>
          <Link href="/experiments">
            <ArrowLeft className="size-4" />
            返回实验库
          </Link>
        </Button>

        {topAuditSlot}
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,40%)_minmax(0,1fr)] lg:items-start lg:gap-5">
          <div className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-6rem)] lg:overflow-x-hidden lg:overflow-y-auto">
            {heroMediaTabs}
          </div>
          <div className="min-w-0 space-y-4">
            <AuthorDigitalBadge detail={detail} />
            {titleBlock}
            {tabletDesktopActions}
            <Card className="border-border/80 p-4 shadow-sm lg:p-6">{mainTabs}</Card>
            <div className="space-y-4">{railStackBelowTabs}</div>
          </div>
        </div>

        {safetyFullScreenDialog}
        {teacherPublishDialog}
        {desktopTabletStudentSubmissionBar}
        {desktopTabletApprovalBar}
      </div>
    );
  }

  /** 桌面：约 70 / 30 Bento */
  return (
    <div className={cn("min-w-0 space-y-4", pageBottomPadding)}>
      <Button type="button" variant="ghost" size="sm" className="gap-1 px-0" asChild>
        <Link href="/experiments">
          <ArrowLeft className="size-4" />
          返回实验库
        </Link>
      </Button>

      {topAuditSlot}
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-[7] space-y-4 lg:space-y-5">
          {heroMediaTabs}
          {titleBlock}
          {tabletDesktopActions}
          <Card className="border-border/80 p-4 shadow-sm lg:p-6">{mainTabs}</Card>
        </div>
        <aside className="flex w-full min-w-0 shrink-0 flex-col gap-4 lg:sticky lg:top-24 lg:w-[30%] lg:max-w-md">
          {rightRail}
        </aside>
      </div>

      {safetyFullScreenDialog}
      {teacherPublishDialog}
      {desktopTabletStudentSubmissionBar}
      {desktopTabletApprovalBar}
    </div>
  );
}
