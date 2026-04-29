"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

import { sonnerToast } from "@bs-lab/ui";

import { useSessionActor } from "@/hooks/use-session-actor";
import {
  fetchParentSessionDetail,
  patchParentSession,
  postCreateParentReport,
  adaptReportForCard,
  type ParentSessionDetail,
  type ParentReportRecord,
} from "@/lib/v2/v2-parent-session-api";

export function useSessionDetailPage() {
  const { hydrated, actor } = useSessionActor();
  const params = useParams();
  const router = useRouter();
  const sessionId = typeof params.id === "string" ? params.id : "";
  const [, bump] = React.useReducer((n) => n + 1, 0);

  const [session, setSession] = React.useState<ParentSessionDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [report, setReport] = React.useState<ParentReportRecord | null>(null);

  const loadData = React.useCallback(async () => {
    if (!hydrated || !sessionId) return;
    setLoading(true);
    try {
      const s = await fetchParentSessionDetail(actor, sessionId);
      setSession(s);
      setReport(s.report);
    } catch (err) {
      console.error("[session-detail] loadData error", err);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [hydrated, actor, sessionId]);

  React.useEffect(() => {
    loadData();
  }, [loadData, bump]);

  const onGuideStyleChange = React.useCallback(
    async (style: string) => {
      if (!session) return;
      try {
        await patchParentSession(actor, session.sessionId, { guideStyle: style });
        sonnerToast.message("引导风格已更新", { description: "后续交互将按新风格响应。" });
        bump();
      } catch (err) {
        sonnerToast.error("更新失败", { description: err instanceof Error ? err.message : "请求失败" });
      }
    },
    [session, actor],
  );

  const onAttestChange = React.useCallback(
    async (attested: boolean) => {
      if (!session || session.parentAttestedAt) return;
      try {
        const now = new Date().toISOString();
        await patchParentSession(actor, session.sessionId, { parentAttestedAt: now });
        sonnerToast.success("已记录家长陪同确认", { description: "教师批改页将显示「已背书」。" });
        bump();
      } catch (err) {
        sonnerToast.error("操作失败", { description: err instanceof Error ? err.message : "请求失败" });
      }
    },
    [session, actor],
  );

  const onMaterialShortageChange = React.useCallback(
    async (reported: boolean) => {
      if (!session) return;
      try {
        await patchParentSession(actor, session.sessionId, { materialShortageReported: reported ? 1 : 0 });
        sonnerToast.message(reported ? "已反馈材料难凑齐" : "已取消材料反馈");
        bump();
      } catch (err) {
        sonnerToast.error("操作失败", { description: err instanceof Error ? err.message : "请求失败" });
      }
    },
    [session, actor],
  );

  const onErrorIncrement = React.useCallback(
    async () => {
      if (!session) return;
      try {
        await patchParentSession(actor, session.sessionId, { errorCount: session.errorCount + 1 });
        sonnerToast.message("已模拟一次错误预警", { description: "用于触发 AI 预审「关注」状态。" });
        bump();
      } catch (err) {
        sonnerToast.error("操作失败", { description: err instanceof Error ? err.message : "请求失败" });
      }
    },
    [session, actor],
  );

  const onGenerateReport = React.useCallback(
    async () => {
      if (!session) return;
      try {
        const newReport = await postCreateParentReport(actor, {
          sessionId: session.sessionId,
          summary: "本次亲子实验完成度良好，孩子能按步骤观察并记录现象。",
          strengths: ["操作规范", "观察细致", "愿意复述步骤"],
          improvements: ["可补充一句自己的猜想", "注意护目镜佩戴时长"],
          nextRecommendations: ["尝试变量对照版本", "把记录整理成一张成就卡"],
          shareCopy: "今天和孩子一起完成了家庭科学小实验！",
        });
        setReport(newReport);
        sonnerToast.success("已生成亲子报告", { description: "可前往成就卡页查看详情。" });
        bump();
      } catch (err) {
        sonnerToast.error("生成失败", { description: err instanceof Error ? err.message : "请求失败" });
      }
    },
    [session, actor],
  );

  return {
    hydrated,
    loading,
    session,
    report,
    sessionId,
    router,
    onGuideStyleChange,
    onAttestChange,
    onMaterialShortageChange,
    onErrorIncrement,
    onGenerateReport,
  };
}
