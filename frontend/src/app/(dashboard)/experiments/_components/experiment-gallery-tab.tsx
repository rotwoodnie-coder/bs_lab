"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { sonnerToast, TabSwitcher } from "@bs-lab/ui";
import { GraduationCap } from "@bs-lab/ui/icons";

import { ExperimentCard } from "@/components/business/experiment-card";
import type { ExperimentCardAction } from "@/components/business/experiment-card";
import { experimentCardVariantForGallery } from "@/lib/experiment-card-variant";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchV2ExpList,
  fetchV2SchoolGrades,
  fetchV2SchoolSubjects,
  type V2DictGradeItem,
  type V2DictItem,
  type V2ExpMsgItem,
} from "@/lib/v2/v2-exp-api";
import { V2ApiServiceError } from "@/lib/v2/apiService";
import { v2ExpMsgItemToExperimentCard } from "@/lib/v2/v2-exp-to-experiment";

const GRADE_TAB_ITEMS = [
  { id: "all", label: "全部", icon: <GraduationCap /> },
  { id: "高一", label: "高一", icon: <GraduationCap /> },
  { id: "高二", label: "高二", icon: <GraduationCap /> },
  { id: "高三", label: "高三", icon: <GraduationCap /> },
] as const;

export function ExperimentGalleryTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [gradeTab, setGradeTab] = React.useState<string>("all");

  const actor = React.useMemo(
    () => ({
      role: user.role,
      orgId: user.orgId,
      userId: user.userId,
      userName: user.userName,
      tenantId: user.tenantId,
      appId: user.appId,
    }),
    [user.appId, user.orgId, user.role, user.tenantId, user.userId, user.userName],
  );

  const [subjects, setSubjects] = React.useState<V2DictItem[]>([]);
  const [grades, setGrades] = React.useState<V2DictGradeItem[]>([]);
  const [items, setItems] = React.useState<V2ExpMsgItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    void fetchV2SchoolSubjects(actor).then(setSubjects).catch(() => {});
    void fetchV2SchoolGrades(actor).then(setGrades).catch(() => {});
  }, [actor]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchV2ExpList(actor, { status: "y", page: 1, pageSize: 200 })
      .then((page) => {
        if (cancelled) return;
        setItems(page.items ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        sonnerToast.error("实验库加载失败", {
          description: V2ApiServiceError.getBusinessMessage(err),
        });
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actor]);

  const cards = React.useMemo(
    () => items.map((i) => v2ExpMsgItemToExperimentCard(i, { grades, subjects })),
    [grades, items, subjects],
  );
  const filteredExperiments = React.useMemo(() => {
    if (gradeTab === "all") return cards;
    return cards.filter((e) => e.gradeLabel === gradeTab);
  }, [cards, gradeTab]);

  const handleCardAction = React.useCallback(
    (action: ExperimentCardAction) => {
      switch (action.type) {
        case "view":
          router.push(`/experiments/${action.experimentId}`);
          break;
        case "favorite":
          sonnerToast.success("已加入收藏", { description: action.experimentId });
          break;
        case "share":
          sonnerToast.message("分享", { description: `生成分享链接：${action.experimentId}` });
          break;
        default:
          break;
      }
    },
    [router],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 <span className="font-medium text-foreground">{filteredExperiments.length}</span> 个实验
        </p>
        <TabSwitcher
          variant="pill"
          layoutIdPrefix="exp-gallery-grade"
          activeId={gradeTab}
          onChange={setGradeTab}
          items={[...GRADE_TAB_ITEMS]}
          className="w-full justify-start sm:w-auto max-2xl:gap-0.5 max-2xl:p-0.5 max-2xl:[&_button]:px-2.5 max-2xl:[&_button]:py-1.5 max-2xl:[&_button]:text-[11px] max-2xl:[&_svg]:size-3.5"
        />
      </header>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          加载中…
        </div>
      ) : filteredExperiments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center text-sm text-muted-foreground">
          该年级暂无实验条目，请切换标签。
        </div>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1920px]:grid-cols-5">
          {filteredExperiments.map((exp) => (
            <li key={exp.id}>
              <ExperimentCard
                data={exp}
                onAction={handleCardAction}
                variant={experimentCardVariantForGallery(exp)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
