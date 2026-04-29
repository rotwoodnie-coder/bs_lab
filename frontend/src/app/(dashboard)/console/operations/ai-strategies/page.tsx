"use client";

import * as React from "react";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@bs-lab/ui";

import {
  readStoredTutorPersona,
  TUTOR_PERSONA_OPTIONS,
  TUTOR_PERSONA_STORAGE_KEY,
  type TutorPersonaId,
} from "@/config/ai-config";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { EXPERIMENT_COMMUNITY_DOMAIN_VERSION } from "@/lib/console/experiment-community-domain";
import { cn } from "@/lib/utils";

const SCAFFOLD_PLACEHOLDER = {
  low: {
    idea: "先问问孩子：你观察到了什么有趣的现象？最想弄清楚哪一个问题？（生活化、短句、多鼓励）",
    method: "引导孩子说说：打算用什么材料、先做什么再做什么？要不要请大人帮忙？",
    practice: "提醒拍摄时对准关键步骤，口播一句「我现在在做的是……」，注意安全用语。",
  },
  high: {
    idea: "明确探究问题与变量关系，要求用科学用语概括假设或观察焦点。",
    method: "强调对照实验设计、测量工具与记录表结构，可引用课标相关表述。",
    practice: "规范操作顺序与安全要点，要求数据可追溯（时间、次数、单位）。",
  },
} as const;

export default function ConsoleAiStrategiesPage() {
  const [buddyOn, setBuddyOn] = React.useState(true);
  const [proOn, setProOn] = React.useState(true);
  const [persona, setPersona] = React.useState<TutorPersonaId>("neutral");

  React.useEffect(() => {
    setPersona(readStoredTutorPersona());
  }, []);

  const persistPersona = React.useCallback((id: TutorPersonaId) => {
    setPersona(id);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(TUTOR_PERSONA_STORAGE_KEY, id);
        window.dispatchEvent(new Event("bs-lab-ai-persona-changed"));
      } catch {
        /* ignore */
      }
    }
  }, []);

  return (
    <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "flex flex-col gap-6")}>
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">AI 实验引导</CardTitle>
              <CardDescription>
                老师带学生做实验时，AI 怎么开口：低年级多说生活化短句，高年级多强调步骤与安全。当前为骨架，保存接口待接{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/v1/agent/config</code>
                。约定版本 {EXPERIMENT_COMMUNITY_DOMAIN_VERSION}。
              </CardDescription>
            </div>
            <Badge variant="secondary">骨架</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/25 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Label htmlFor="tutor-persona" className="text-sm font-medium text-foreground">
                  实验导师人格（社交化语调）
                </Label>
                <p className="text-xs text-muted-foreground">
                  与社区场景一致：同一套阶梯 Prompt 上叠加人格语气；写入{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{TUTOR_PERSONA_STORAGE_KEY}</code>。
                </p>
              </div>
              <Select value={persona} onValueChange={(v) => persistPersona(v as TutorPersonaId)}>
                <SelectTrigger id="tutor-persona" className="w-full sm:w-[220px]" aria-label="选择实验导师人格">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TUTOR_PERSONA_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              当前：{TUTOR_PERSONA_OPTIONS.find((o) => o.id === persona)?.hint}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="prompt-buddy" className="text-sm font-medium text-foreground">
                  低年级 · 伙伴化 Prompt
                </Label>
                <p className="text-xs text-muted-foreground">语气温暖、生活化类比，突出安全与兴趣。</p>
              </div>
              <Switch id="prompt-buddy" checked={buddyOn} onCheckedChange={setBuddyOn} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="prompt-pro" className="text-sm font-medium text-foreground">
                  高年级 · 专业化 Prompt
                </Label>
                <p className="text-xs text-muted-foreground">术语准确、变量与证据链，对接课标表述。</p>
              </div>
              <Switch id="prompt-pro" checked={proOn} onCheckedChange={setProOn} />
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">阶梯式引导（hint_scaffolding）</p>
            <p className="mb-3 text-xs text-muted-foreground">
              三阶与 AI 对话脚本绑定：先激活想法，再结构化方法，最后落实可操作做法。
            </p>
            <Tabs defaultValue="low" className="w-full">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1 sm:w-auto">
                <TabsTrigger value="low" className="flex-1 sm:flex-none">
                  低年级配置预览
                </TabsTrigger>
                <TabsTrigger value="high" className="flex-1 sm:flex-none">
                  高年级配置预览
                </TabsTrigger>
              </TabsList>
              <TabsContent value="low" className="mt-4 space-y-3">
                <ScaffoldFields
                  disabled={!buddyOn}
                  values={SCAFFOLD_PLACEHOLDER.low}
                  labels={["想法（Level 1）", "方法（Level 2）", "做法（Level 3）"]}
                />
              </TabsContent>
              <TabsContent value="high" className="mt-4 space-y-3">
                <ScaffoldFields
                  disabled={!proOn}
                  values={SCAFFOLD_PLACEHOLDER.high}
                  labels={["想法（Level 1）", "方法（Level 2）", "做法（Level 3）"]}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScaffoldFields({
  disabled,
  values,
  labels,
}: {
  disabled: boolean;
  values: { idea: string; method: string; practice: string };
  labels: [string, string, string];
}) {
  const fields: { key: keyof typeof values; label: string }[] = [
    { key: "idea", label: labels[0]! },
    { key: "method", label: labels[1]! },
    { key: "practice", label: labels[2]! },
  ];
  return (
    <div className="grid gap-3">
      {fields.map(({ key, label }) => (
        <div key={key} className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
          <Textarea
            readOnly
            disabled={disabled}
            rows={3}
            className="resize-y text-sm"
            value={values[key]}
          />
        </div>
      ))}
      {disabled ? (
        <p className="text-xs text-muted-foreground">已关闭该套 Prompt，上线后保存时将跳过对应阶梯。</p>
      ) : null}
    </div>
  );
}
