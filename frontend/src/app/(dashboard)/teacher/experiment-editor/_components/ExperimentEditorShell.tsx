"use client";

import * as React from "react";

import Link from "next/link";

import { Button, Progress } from "@bs-lab/ui";
import { ArrowLeft, Check, FlaskConical } from "@bs-lab/ui/icons";

import { EditorCanvasSections } from "./EditorCanvasSections";
import { EditorOutlinePanel } from "./EditorOutlinePanel";
import { EditorThreePaneLayout } from "./EditorThreePaneLayout";
import { EditorToolbar } from "./EditorToolbar";

import type { useEditorActions } from "../hooks/use-editor-actions";
import type { useEditorBootstrap } from "../hooks/use-editor-bootstrap";

type Vm = ReturnType<typeof useEditorBootstrap>;
type Actions = ReturnType<typeof useEditorActions>;

type AutosaveVm = {
  status: "idle" | "saving" | "saved" | "error";
  statusText: string;
};

const STEPS = [
  { id: "topic", label: "选题" },
  { id: "video", label: "视频/OCR" },
  { id: "template", label: "选模板" },
  { id: "arrange", label: "步骤编排" },
  { id: "publish", label: "安全与提交" },
] as const;

/** 将当前 activeAnchorId 映射到 5 步步骤索引 */
function stepIndexFromTab(tabKey: string): number {
  // "basic" → 步骤 0 (选题), 步骤 1 (视频/OCR) 共用 basic tab
  // 但我们需要区分步骤进度: 如果 basic 卡片的视频部分已填, 则 step1 完成
  // 简化: 只要在 basic tab 就高亮 step 0, materials 和 teachingContext → step 2, steps/result → step 3, safety → step 4
  switch (tabKey) {
    case "basic":
      return 0; // 选题 & 视频共享, 由外层通过 completedSteps 细化
    case "materials":
    case "teachingContext":
      return 2;
    case "steps":
    case "result":
      return 3;
    case "safety":
      return 4;
    default:
      return 0;
  }
}

export function ExperimentEditorShell({
  vm,
  actions,
  autosave,
}: {
  vm: Vm;
  actions: Actions;
  autosave: AutosaveVm;
}) {
  const { step, canvas } = vm;
  const [selectedStepId, setSelectedStepId] = React.useState<string | null>(step.steps[0]?.id ?? null);

  React.useEffect(() => {
    if (!step.steps.length) {
      setSelectedStepId(null);
      return;
    }
    if (!selectedStepId || !step.steps.some((item) => item.id === selectedStepId)) {
      setSelectedStepId(step.steps[0].id);
    }
  }, [selectedStepId, step.steps]);

  const isEditMode = Boolean(vm.expId?.trim());

  // 计算各步骤的完成状态
  // 基于 sectionStatusMap 的实际完成度来判定
  const stepCompletedMap = React.useMemo(() => {
    const s = vm.anchorsWithStatus;
    // 步骤 0 (选题): basic 中的"基础信息"部分 (名称、学科、年级、类型)
    // 步骤 1 (视频/OCR): basic 中的视频及OCR部分 — 以 principleEmbeds 的视频为标记
    // 步骤 2 (选模板): materials 和 teachingContext 两者任一完成即可
    // 步骤 3 (步骤编排): steps 和 result 都完成
    // 步骤 4 (安全与提交): safety 完成
    const basicAnchor = s.find((a) => a.id === "basic");
    const materialsAnchor = s.find((a) => a.id === "materials");
    const teachingAnchor = s.find((a) => a.id === "teachingContext");
    const stepsAnchor = s.find((a) => a.id === "steps");
    const resultAnchor = s.find((a) => a.id === "result");
    const safetyAnchor = s.find((a) => a.id === "safety");

    const hasNameSubject = basicAnchor?.completed ?? false;
    // 步骤 2 "选模板" — materials 或 teachingContext 有填充
    const hasTemplate = (materialsAnchor?.completed ?? false) || (teachingAnchor?.completed ?? false);
    // 步骤 3 "步骤编排" — steps 和 result 都需完成
    const hasArrange = (stepsAnchor?.completed ?? false) && (resultAnchor?.completed ?? false);
    // 步骤 4 "安全与提交"
    const hasSafety = safetyAnchor?.completed ?? false;
    // 步骤 1 视频: 只要 basic 完成即视为视频部分也完成（细化程度在第一步）
    const hasVideo = hasNameSubject;

    return {
      topic: hasNameSubject,
      video: hasVideo,
      template: hasTemplate,
      arrange: hasArrange,
      publish: hasSafety,
    };
  }, [vm.anchorsWithStatus]);

  const completedSteps = React.useMemo(() => {
    return Object.values(stepCompletedMap).filter(Boolean).length;
  }, [stepCompletedMap]);

  const currentStepIdx = stepIndexFromTab(canvas.activeAnchorId);

  if (vm.expDetailLoadError === "not_found") {
    return (
      <div className="space-y-6 pb-6">
        <header className="flex items-center gap-3 border-b border-border pb-4">
          <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0 rounded-full" asChild>
            <Link href="/experiment-manage" aria-label="返回实验课程管理">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">实验不存在</h1>
            <p className="text-sm text-muted-foreground">
              当前链接中的实验 ID 在服务端未找到（404）。
            </p>
          </div>
        </header>
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-border bg-card py-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="text-sm leading-relaxed text-muted-foreground">
            请从「实验课程管理」重新打开草稿，或确认链接中的 <span className="font-mono text-foreground">{vm.expId}</span>{" "}
            是否正确。
          </p>
          <Button type="button" variant="secondary" className="gap-1.5" asChild>
            <Link href="/experiment-manage">
              <ArrowLeft className="size-3.5" />
              返回实验课程管理
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* 固定头部：包含步骤指示器 */}
      <header className="shrink-0 border-b border-border bg-white px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 size-9 shrink-0 rounded-full"
            asChild
          >
            <Link href="/experiment-manage" aria-label="返回实验课程管理">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          {/* 左侧标题 */}
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              <FlaskConical className="size-5 shrink-0 text-muted-foreground" />
              {isEditMode ? "编辑实验课程" : "新建实验课程"}
            </h1>
          </div>

          {/* 自动保存状态 */}
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <span className="text-xs text-muted-foreground tabular-nums">
              {autosave.statusText}
            </span>
          </div>
        </div>

        {/* 五步步骤指示器 */}
        <nav className="flex items-center gap-0 pb-4">
          {STEPS.map((stepDef, idx) => {
            const isActive = currentStepIdx >= idx;
            const isCurrent = currentStepIdx === idx;
            const isComplete = stepCompletedMap[stepDef.id as keyof typeof stepCompletedMap];
            return (
              <React.Fragment key={stepDef.id}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={[
                      "inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold leading-none transition-all duration-300",
                      isCurrent
                        ? "bg-[#008080] text-white shadow-md"
                        : isComplete
                          ? "bg-[#008080] text-white"
                          : "border-2 border-muted-foreground/30 bg-white text-muted-foreground",
                    ].join(" ")}
                  >
                    {isComplete ? (
                      <Check className="size-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={[
                      "whitespace-nowrap text-[11px] font-medium transition-colors duration-300",
                      isCurrent
                        ? "text-[#008080]"
                        : isComplete
                          ? "text-foreground"
                          : "text-muted-foreground/50",
                    ].join(" ")}
                  >
                    {stepDef.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 ? (
                  <div
                    className={[
                      "mx-2 mt-[-20px] h-[2px] flex-1 self-center transition-colors duration-300",
                      isComplete ? "bg-[#008080]" : "bg-muted-foreground/20",
                    ].join(" ")}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </nav>
      </header>

      <div className="shrink-0 px-4 sm:px-6 lg:px-8">
        <EditorToolbar
          expId={vm.expId ?? null}
          intervention={vm.intervention}
          creatorName={vm.creatorName}
          fallbackCreatorName={vm.user.userName}
          showInterventionPanel={Boolean(vm.intervention && vm.expId)}
          rtSafety={vm.rtSafety}
          setRtSafety={vm.setRtSafety}
          rtMaterial={vm.rtMaterial}
          setRtMaterial={vm.setRtMaterial}
          onSaveRuntimeConfig={vm.saveRuntimeConfig}
          showResearcherReviewBar={vm.showResearcherReviewBar}
          showResearcherTakedown={vm.showResearcherTakedown}
          showResearcherNoopHint={vm.showResearcherNoopHint}
          rowTitle={vm.row?.title}
          workflowStatus={vm.row?.workflowStatus}
          onApprove={actions.approveExperiment}
          onArchivePublished={actions.archivePublished}
          rejectOpen={vm.rejectOpen}
          setRejectOpen={vm.setRejectOpen}
          rejectDraft={vm.rejectDraft}
          setRejectDraft={vm.setRejectDraft}
          onConfirmReject={() => {
            actions.confirmReject(vm.rejectDraft, () => {
              vm.setRejectOpen(false);
              vm.setRejectDraft("");
            });
          }}
          anchorsWithStatus={vm.anchorsWithStatus}
          activeAnchorId={canvas.activeAnchorId}
          onNavigateAnchor={canvas.onNavigateAnchor}
          mobileNavOpen={canvas.mobileNavOpen}
          setMobileNavOpen={canvas.setMobileNavOpen}
        />
      </div>

      {/* 剩余空间：三栏布局 */}
      <div className="min-h-0 flex-1 px-4 sm:px-6 lg:px-8">
        <EditorThreePaneLayout
          left={
            <>
              <div className="rounded-[28px] bg-slate-900 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-400">实验完成度</p>
                    <p className="text-xs font-semibold tabular-nums text-white">{Math.round(vm.completionPct)}%</p>
                  </div>
                  <Progress
                    className="mt-2 h-1.5 [&>div]:bg-[#008080]"
                    value={Math.round(vm.completionPct)}
                  />
                </div>
              </div>
              <EditorOutlinePanel
                anchors={vm.anchorsWithStatus}
                activeAnchorId={canvas.activeAnchorId}
                onNavigateAnchor={canvas.onNavigateAnchor}
                steps={step.steps}
                selectedStepId={selectedStepId}
                onSelectStep={(id) => {
                  setSelectedStepId(id);
                  canvas.onNavigateAnchor("steps");
                }}
                onMoveStep={step.reorderStep}
                canPublish={actions.canShowNavSubmit}
                onPublish={() => actions.publish()}
              />
            </>
          }
          center={<EditorCanvasSections vm={vm} actions={actions} />}
          right={null}
        />
      </div>
    </div>
  );
}
