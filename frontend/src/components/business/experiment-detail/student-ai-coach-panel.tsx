"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  ScrollArea,
  sonnerToast,
} from "@bs-lab/ui";
import { Bot, Send } from "@bs-lab/ui/icons";

import {
  buildMentorPromptSuffix,
  inferGradeBandFromLabel,
  readStoredTutorPersona,
  TUTOR_PERSONA_STORAGE_KEY,
  type TutorPersonaId,
} from "@/config/ai-config";

type Msg = { id: string; role: "user" | "assistant"; text: string };

function coachReply(userText: string, gradeLabel: string, persona: TutorPersonaId): string {
  const band = inferGradeBandFromLabel(gradeLabel);
  const suffix = buildMentorPromptSuffix(persona, band);
  return `（Mock 回复，未接大模型）已按当前「导师人格」与年级后缀生成建议：${suffix.slice(0, 60)}…\n\n针对你说的「${userText.slice(0, 40)}${userText.length > 40 ? "…" : ""}」：先观察现象 → 写下你的猜想 → 再设计一步能验证的操作。`;
}

export type StudentAiCoachPanelProps = {
  gradeLabel: string;
  experimentTitle: string;
};

/** PRD：AI 作为智慧支点；学生端可见对话框（Mock），与 Console 策略人格同源。 */
export function StudentAiCoachPanel({ gradeLabel, experimentTitle }: StudentAiCoachPanelProps) {
  const [persona, setPersona] = React.useState<TutorPersonaId>("neutral");
  const [input, setInput] = React.useState("");
  const [msgs, setMsgs] = React.useState<Msg[]>(() => [
    {
      id: "m0",
      role: "assistant",
      text: `你好！我是实验小助手（）。当前实验：${experimentTitle}。可以说说你想探究什么现象？`,
    },
  ]);

  React.useEffect(() => {
    const sync = () => setPersona(readStoredTutorPersona());
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === TUTOR_PERSONA_STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("bs-lab-ai-persona-changed", sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bs-lab-ai-persona-changed", sync);
    };
  }, []);

  const send = React.useCallback(() => {
    const t = input.trim();
    if (!t) {
      sonnerToast.message("先写一句你的想法或疑问");
      return;
    }
    const uid = `u-${Date.now()}`;
    const aid = `a-${Date.now()}`;
    setMsgs((prev) => [
      ...prev,
      { id: uid, role: "user", text: t },
      { id: aid, role: "assistant", text: coachReply(t, gradeLabel, persona) },
    ]);
    setInput("");
  }, [input, gradeLabel, persona]);

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Bot className="size-4 text-primary" aria-hidden />
          AI 实验引导（）
        </CardTitle>
        <CardDescription className="text-xs">
          人格与运营中心「AI 实验引导」同源（localStorage）。年级：{gradeLabel} →{" "}
          {buildMentorPromptSuffix(persona, inferGradeBandFromLabel(gradeLabel)).slice(0, 42)}…
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <ScrollArea className="h-[min(220px,40vh)] rounded-md border border-border bg-muted/20 p-2">
          <ul className="space-y-2 text-xs">
            {msgs.map((m) => (
              <li
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-4 rounded-lg bg-primary/10 px-2 py-1.5 text-foreground"
                    : "mr-4 rounded-lg border border-border bg-background px-2 py-1.5 text-muted-foreground"
                }
              >
                {m.text}
              </li>
            ))}
          </ul>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="说说你的想法或遇到的问题…"
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button type="button" size="sm" className="shrink-0 gap-1" onClick={send}>
            <Send className="size-3.5" />
            发送
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
