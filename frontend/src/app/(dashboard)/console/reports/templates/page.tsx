"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@bs-lab/ui";

import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { EXPERIMENT_COMMUNITY_DOMAIN_VERSION } from "@/lib/console/experiment-community-domain";
import { cn } from "@/lib/utils";

/** 四阶联动占位：实验表现 → AI 规范评价 → 社区互动 → 全区排名（报告区块映射）。 */
const PREVIEW_BINDING_KEYS = [
  { key: "experiment.performance_summary", label: "实验表现", sample: "完成度 92%，步骤记录齐全" },
  { key: "ai.normative_score", label: "AI 规范评分", sample: "88 / 100（安全与操作规范）" },
  { key: "social.like_count", label: "互动点赞数", sample: "126" },
  {
    key: "inventory.material_badges",
    label: "实验耗材勋章",
    sample: "已点亮「香料初级」· 含柠檬酸类实验 3/5 · 下一阶：香料专家",
  },
  { key: "challenge.district_rank", label: "全区排名", sample: "第 42 名 · 本年级" },
] as const;

export default function ConsoleReportTemplatesPage() {
  return (
    <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "flex flex-col gap-6")}>
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">亲子报告模板</CardTitle>
              <CardDescription>
                对家长交付物：模板绑定数据点后，由{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /api/v1/report/generate</code>{" "}
                聚合；输出格式可扩展 web / 图片 / PDF。约定版本 {EXPERIMENT_COMMUNITY_DOMAIN_VERSION}。
              </CardDescription>
            </div>
            <Badge variant="secondary">骨架</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">报告生成预览（占位）</p>
            <p className="mb-4 text-xs text-muted-foreground">
              下列键名与规格文档 `docs/contracts/science-community-console-mock-spec.md` 中数据点字典一致，便于前后端联调。
            </p>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-center text-sm font-medium text-foreground">亲子实验周报 · 预览</p>
              <p className="mt-1 text-center text-xs text-muted-foreground">学生：张×× · 年级：四年级 · work_id：work_demo</p>
              <Separator className="my-4" />
              <ul className="space-y-3">
                {PREVIEW_BINDING_KEYS.map((row) => (
                  <li
                    key={row.key}
                    className="flex flex-col gap-1 rounded-md border border-border bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{row.label}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{row.key}</p>
                    </div>
                    <p className="text-sm text-muted-foreground sm:text-right">{row.sample}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">四阶联动（业务叙事）</p>
            <ol className="mt-2 list-inside list-decimal space-y-1">
              <li>实验表现：作品与任务完成情况（想法—方法—做法记录）。</li>
              <li>AI 评价：规范与安全维度评分，与「AI 实验引导」里的策略一致。</li>
              <li>社区互动：点赞与同伴反馈，体现「社会即学校」参与感。</li>
              <li>
                实验耗材勋章：聚合 B 域「实验材料」与完成实验所用耗材标签，在亲子报告中以成就形式呈现，反向激励线下动手（与{" "}
                <code className="rounded bg-background px-1 py-0.5 text-[11px]">experimental-materials</code>{" "}
                叙事闭环）。
              </li>
              <li>全区排名：挑战赛/积分维度，激励共进（展示层可脱敏）。</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}