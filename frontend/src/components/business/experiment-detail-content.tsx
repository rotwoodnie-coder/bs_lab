"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
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
  Label,
  MediaPreview,
  ScrollArea,
  Separator,
  Switch,
} from "@bs-lab/ui";
import { AlertTriangle } from "@bs-lab/ui/icons";

import { useEasedNumber } from "@/hooks/use-eased-number";
import { hazardFlagLabel } from "@/lib/hazard-labels";
import { cn } from "@/lib/utils";
import type { ExperimentDetail } from "@/types/experiment-detail";

export type ExperimentDetailContentProps = {
  detail: ExperimentDetail;
  /**
   * default：详情页；compact：旧版窄栏内滚动；
   * review：评审工作台单列预览；
   * review-preview / review-reference：2K 三栏工作台左/右栏（中栏为表单）。
   */
  variant?: "default" | "compact" | "review" | "review-preview" | "review-reference";
  className?: string;
};

function formatDurationDisplay(value: number): string {
  return `${Math.round(value)}`;
}

export function ExperimentDetailContent({
  detail,
  variant = "default",
  className,
}: ExperimentDetailContentProps) {
  const [homeByMaterialId, setHomeByMaterialId] = React.useState<Record<string, boolean>>({});
  const easedMin = useEasedNumber(detail.durationMin, 850);

  const sp = detail.subjectPath;
  const subjectBadges = [
    sp.gradeLabel,
    sp.phase === "primary" ? "小学" : sp.phase === "junior" ? "初中" : "高中",
    sp.discipline === "science"
      ? "科学"
      : sp.discipline === "physics"
        ? "物理"
        :     sp.discipline === "chemistry"
          ? "化学"
          : "生物",
  ];

  const reviewSegment: "full" | "preview" | "reference" | null =
    variant === "review"
      ? "full"
      : variant === "review-preview"
        ? "preview"
        : variant === "review-reference"
          ? "reference"
          : null;

  if (reviewSegment) {
    const ctx = detail.teachingContext;
    const showPreview = reviewSegment === "full" || reviewSegment === "preview";
    const showReference = reviewSegment === "full" || reviewSegment === "reference";

    return (
      <div className={cn("space-y-4", className)}>
        {showPreview ? (
          <header className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {subjectBadges.map((t) => (
                <Badge key={t} variant="secondary" className="font-normal">
                  {t}
                </Badge>
              ))}
            </div>
            {detail.summary ? (
              <p className="line-clamp-4 text-sm text-muted-foreground">{detail.summary}</p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              预计耗时{" "}
              <span className="tabular-nums font-semibold text-foreground">
                {formatDurationDisplay(easedMin)}
              </span>{" "}
              分钟
            </p>
          </header>
        ) : (
          <header className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">参考与合规</h3>
            <p className="text-xs text-muted-foreground">安全红线、课标与教材上下文（对照中部表单）</p>
          </header>
        )}

        {showReference ? (
          <>
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">安全红线</CardTitle>
                <CardDescription>实验禁忌与风险提示（评审必读）</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {detail.safetyAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无结构化安全条目。</p>
                ) : (
                  detail.safetyAlerts.map((a) => (
                    <Alert key={a.id} variant={a.severity === "critical" ? "destructive" : "default"}>
                      <AlertTriangle />
                      <AlertTitle>{a.title}</AlertTitle>
                      <AlertDescription>{a.body}</AlertDescription>
                    </Alert>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">课标要求</CardTitle>
                <CardDescription>引用与学习目标对齐情况</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {ctx.curriculumStandardRef ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-muted-foreground">课标引用</p>
                    <p className="mt-1 text-foreground">{ctx.curriculumStandardRef}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">未填写课标引用。</p>
                )}
                {ctx.learningObjectives?.length ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-muted-foreground">学习目标</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-foreground">
                      {ctx.learningObjectives.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {ctx.textbookRef || ctx.chapter ? (
              <Card className="border-border shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">教材与章节</CardTitle>
                  <CardDescription>教学实施上下文</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {ctx.textbookRef ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">教材</p>
                      <p className="text-foreground">{ctx.textbookRef}</p>
                    </div>
                  ) : null}
                  {ctx.chapter ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">章节</p>
                      <p className="text-foreground">{ctx.chapter}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}

        {showPreview ? (
          <>
            <Card className="overflow-hidden border-border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">实验视频与材料</CardTitle>
                <CardDescription>主视频在上，材料清单在下三列平铺，释放侧向空间</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-0 pb-4">
                {detail.mainVideoUrl ? (
                  <div className="aspect-video w-full bg-muted">
                    <MediaPreview
                      kind="video"
                      variant="default"
                      src={detail.mainVideoUrl}
                      className="size-full object-cover"
                      alt="实验主视频"
                      videoProps={{ controls: true, playsInline: true, preload: "metadata" }}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center border-y border-border bg-muted/30 text-sm text-muted-foreground">
                    暂无主视频
                  </div>
                )}
                <div className="px-4 sm:px-6">
                  <p className="mb-3 text-xs font-medium text-muted-foreground">材料清单</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {detail.materials.map((m) => {
                      const useHome = Boolean(homeByMaterialId[m.id]);
                      const displayName =
                        useHome && m.nameHomeSubstitute ? m.nameHomeSubstitute : m.nameLab;
                      return (
                        <div
                          key={m.id}
                          className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 shadow-xs"
                        >
                          <motion.div
                            layout
                            className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted"
                          >
                        <motion.div
                          key={`${m.id}-${useHome ? "home" : "lab"}`}
                          layout
                          initial={{ opacity: 0.72 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="relative size-full"
                        >
                          {m.imageUrl ? (
                            <Image
                              src={m.imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="200px"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                              无图
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                      <motion.p layout className="line-clamp-2 text-sm font-medium text-foreground">
                        {displayName}
                      </motion.p>
                      {m.hazardFlags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {m.hazardFlags.map((f) => (
                            <Badge key={f} variant="destructive" className="font-normal">
                              {hazardFlagLabel(f)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="secondary" className="w-fit font-normal">
                          无特别禁忌标识
                        </Badge>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2">
                        <Label
                          htmlFor={`review-mat-home-${m.id}`}
                          className="text-xs leading-none text-muted-foreground"
                        >
                          家庭替代
                        </Label>
                        <Switch
                          id={`review-mat-home-${m.id}`}
                          size="sm"
                          checked={useHome}
                          onCheckedChange={(v) =>
                            setHomeByMaterialId((prev) => ({ ...prev, [m.id]: v === true }))
                          }
                          aria-label={`${m.nameLab}：切换家庭替代描述`}
                        />
                      </div>
                      {m.notes ? <p className="text-xs text-muted-foreground">{m.notes}</p> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

            <Card className="border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-base">实验步骤</CardTitle>
                <CardDescription>含图文与视频片段</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {detail.steps
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((step) => (
                    <div key={step.id} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 shrink-0 tabular-nums">
                          {step.order}
                        </Badge>
                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="font-medium text-foreground">{step.title}</p>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          {step.media?.imageUrl ? (
                            <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md border border-border bg-muted">
                              <Image src={step.media.imageUrl} alt="" fill className="object-cover" sizes="400px" />
                            </div>
                          ) : null}
                          {step.media?.videoUrl ? (
                            <MediaPreview
                              kind="video"
                              variant="default"
                              src={step.media.videoUrl}
                              className="w-full max-w-md rounded-md border border-border bg-muted object-cover"
                              alt={step.title}
                              videoProps={{ controls: true, playsInline: true, preload: "metadata" }}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {detail.evaluation.scienceStory || detail.evaluation.rubricSummary ? (
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base">科学故事与评价</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {detail.evaluation.scienceStory ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">科学故事</p>
                      <p className="leading-relaxed text-foreground">{detail.evaluation.scienceStory}</p>
                    </div>
                  ) : null}
                  {detail.evaluation.rubricSummary ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">评价摘要</p>
                      <p className="text-foreground">{detail.evaluation.rubricSummary}</p>
                    </div>
                  ) : null}
                  {detail.evaluation.dimensions?.length ? (
                    <>
                      <Separator />
                      <p className="text-xs font-medium text-muted-foreground">维度权重</p>
                      <ul className="space-y-1">
                        {detail.evaluation.dimensions.map((d) => (
                          <li key={d.name} className="flex justify-between gap-2 text-foreground">
                            <span>{d.name}</span>
                            <span className="tabular-nums text-muted-foreground">{d.weightPct}%</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    );
  }

  const mainBlock = (
    <>
      <header className={cn("space-y-2", variant === "compact" && "px-3 pt-3")}>
        <div className="flex flex-wrap gap-1.5">
          {subjectBadges.map((t) => (
            <Badge key={t} variant="secondary" className="font-normal">
              {t}
            </Badge>
          ))}
        </div>
        <h1
          className={cn(
            "font-semibold leading-snug tracking-tight text-foreground",
            variant === "compact" ? "text-lg" : "text-xl sm:text-2xl",
          )}
        >
          {detail.title}
        </h1>
        {detail.summary ? (
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{detail.summary}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          预计耗时{" "}
          <span className="tabular-nums font-semibold text-foreground">
            {formatDurationDisplay(easedMin)}
          </span>{" "}
          分钟
        </p>
      </header>

      <div className={cn("space-y-3", variant === "compact" && "px-3")}>
        {detail.safetyAlerts.length === 0 ? null : (
          <>
            {detail.safetyAlerts.slice(0, 1).map((a) => (
              <Alert key={a.id} variant={a.severity === "critical" ? "destructive" : "default"}>
                <AlertTriangle />
                <AlertTitle>{a.title}</AlertTitle>
                <AlertDescription>{a.body}</AlertDescription>
              </Alert>
            ))}
            {detail.safetyAlerts.length > 1 ? (
              <Collapsible className="group/safety-more space-y-2">
                <CollapsibleContent className="space-y-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  {detail.safetyAlerts.slice(1).map((a) => (
                    <Alert key={a.id} variant={a.severity === "critical" ? "destructive" : "default"}>
                      <AlertTriangle />
                      <AlertTitle>{a.title}</AlertTitle>
                      <AlertDescription>{a.body}</AlertDescription>
                    </Alert>
                  ))}
                </CollapsibleContent>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-between px-2 text-xs font-normal text-muted-foreground"
                  >
                    <span>
                      展开更多
                      <span className="ml-1 tabular-nums opacity-80">
                        （{detail.safetyAlerts.length - 1} 条）
                      </span>
                    </span>
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            ) : null}
          </>
        )}
      </div>

      <div className={variant === "compact" ? "min-h-0 flex-1 px-3 pb-3" : ""}>
        <div
          className={cn(
            "grid grid-cols-1 gap-4 max-lg:landscape:grid-cols-2 lg:grid-cols-10 lg:gap-4",
            variant === "compact" && "pr-2",
          )}
        >
          <div className="flex flex-col gap-4 lg:col-span-7 max-lg:landscape:min-w-0">
            {detail.mainVideoUrl ? (
              <Card className="overflow-hidden border-border shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">实验引导视频</CardTitle>
                  <CardDescription>主视频（资源）</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="aspect-video w-full bg-muted">
                    <MediaPreview
                      kind="video"
                      variant="default"
                      src={detail.mainVideoUrl}
                      className="size-full object-cover"
                      alt="实验引导视频"
                      videoProps={{ controls: true, playsInline: true, preload: "metadata" }}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-base">实验步骤</CardTitle>
                <CardDescription>含图文与视频片段</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {detail.steps
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((step) => (
                    <div key={step.id} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 shrink-0 tabular-nums">
                          {step.order}
                        </Badge>
                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="font-medium text-foreground">{step.title}</p>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          {step.media?.imageUrl ? (
                            <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md border border-border bg-muted">
                              <Image src={step.media.imageUrl} alt="" fill className="object-cover" sizes="400px" />
                            </div>
                          ) : null}
                          {step.media?.videoUrl ? (
                            <MediaPreview
                              kind="video"
                              variant="default"
                              src={step.media.videoUrl}
                              className="w-full max-w-md rounded-md border border-border bg-muted object-cover"
                              alt={step.title}
                              videoProps={{ controls: true, playsInline: true, preload: "metadata" }}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-3 max-lg:landscape:min-w-0">
            <Card className="border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-base">材料清单</CardTitle>
                <CardDescription>每项开关在「实验室名称 / 家庭替代品」间切换；危险属性以标识展示</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.materials.map((m) => {
                  const useHome = Boolean(homeByMaterialId[m.id]);
                  const displayName =
                    useHome && m.nameHomeSubstitute ? m.nameHomeSubstitute : m.nameLab;
                  return (
                    <div
                      key={m.id}
                      className="rounded-lg border border-border bg-card px-3 py-3 shadow-xs"
                    >
                      <div className="flex gap-3">
                        {m.imageUrl ? (
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                            <Image src={m.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                          </div>
                        ) : (
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted/50 text-xs text-muted-foreground">
                            无图
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{displayName}</p>
                            <div className="flex shrink-0 items-center gap-2">
                              <Label
                                htmlFor={`mat-home-${m.id}`}
                                className="text-xs leading-none text-muted-foreground"
                              >
                                家庭
                              </Label>
                              <Switch
                                id={`mat-home-${m.id}`}
                                size="sm"
                                checked={useHome}
                                onCheckedChange={(v) =>
                                  setHomeByMaterialId((prev) => ({ ...prev, [m.id]: v === true }))
                                }
                                aria-label={`${m.nameLab}：切换家庭替代描述`}
                              />
                            </div>
                          </div>
                          {m.hazardFlags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {m.hazardFlags.map((f) => (
                                <Badge key={f} variant="destructive" className="font-normal">
                                  {hazardFlagLabel(f)}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="secondary" className="font-normal">
                              无特别禁忌标识
                            </Badge>
                          )}
                          {m.notes ? <p className="text-xs text-muted-foreground">{m.notes}</p> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-base">课标与教材</CardTitle>
                <CardDescription>教学上下文参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {detail.teachingContext.curriculumStandardRef ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">课标</p>
                    <p className="text-foreground">{detail.teachingContext.curriculumStandardRef}</p>
                  </div>
                ) : null}
                {detail.teachingContext.textbookRef ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">教材</p>
                    <p className="text-foreground">{detail.teachingContext.textbookRef}</p>
                  </div>
                ) : null}
                {detail.teachingContext.chapter ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">章节</p>
                    <p className="text-foreground">{detail.teachingContext.chapter}</p>
                  </div>
                ) : null}
                {detail.teachingContext.learningObjectives?.length ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">学习目标</p>
                    <ul className="list-disc space-y-1 pl-4 text-foreground">
                      {detail.teachingContext.learningObjectives.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {detail.evaluation.scienceStory || detail.evaluation.rubricSummary ? (
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base">科学故事与评价</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {detail.evaluation.scienceStory ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">科学故事</p>
                      <p className="leading-relaxed text-foreground">{detail.evaluation.scienceStory}</p>
                    </div>
                  ) : null}
                  {detail.evaluation.rubricSummary ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">评价摘要</p>
                      <p className="text-foreground">{detail.evaluation.rubricSummary}</p>
                    </div>
                  ) : null}
                  {detail.evaluation.dimensions?.length ? (
                    <>
                      <Separator />
                      <p className="text-xs font-medium text-muted-foreground">维度权重</p>
                      <ul className="space-y-1">
                        {detail.evaluation.dimensions.map((d) => (
                          <li key={d.name} className="flex justify-between gap-2 text-foreground">
                            <span>{d.name}</span>
                            <span className="tabular-nums text-muted-foreground">{d.weightPct}%</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex max-h-[min(70vh,560px)] min-h-0 flex-col rounded-xl border border-border bg-card/40",
          className,
        )}
      >
        <ScrollArea className="h-[min(70vh,560px)]">
          <div className="space-y-4 pb-2">{mainBlock}</div>
        </ScrollArea>
      </div>
    );
  }

  return <div className={cn("space-y-4", className)}>{mainBlock}</div>;
}
