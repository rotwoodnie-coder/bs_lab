"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, sonnerToast } from "@bs-lab/ui";
import { ArrowLeft } from "@bs-lab/ui/icons";

import { useDemoRole } from "@/components/layout/demo-role-context";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchV2QuestionById, type V2QuestionItem } from "@/lib/v2/v2-question-api";

function stemPlain(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export default function AssessmentBasketPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, orgId, hydrated } = useDemoRole();
  const actor = React.useMemo<CoreApiActor>(
    () => ({
      role,
      orgId,
      userId: `console-${role}-questions-preview`,
      userName: `console-${role}-questions-preview`,
    }),
    [role, orgId],
  );

  const ids = React.useMemo(
    () =>
      (searchParams.get("ids") ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    [searchParams],
  );

  const [items, setItems] = React.useState<V2QuestionItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated || ids.length === 0) {
      setItems([]);
      return;
    }
    setLoading(true);
    void Promise.all(ids.map((id) => fetchV2QuestionById(actor, id)))
      .then(setItems)
      .catch((e: unknown) => {
        sonnerToast.error(e instanceof Error ? e.message : "加载题目失败");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [actor, hydrated, ids.join(",")]);

  return (
    <div className="flex w-full justify-center px-4 py-4 md:px-6 md:py-6">
      <div className="flex w-full max-w-full flex-col gap-4 lg:w-[66.666667vw] lg:max-w-[66.666667vw]">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">题目预览</h1>
            <p className="text-sm text-muted-foreground">根据 URL 中的题目主键从 V2 接口拉取题干与选项。</p>
          </div>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            返回题库
          </Button>
        </header>

        <Card className="shadow-none">
          <CardContent className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <Badge variant="secondary">题量：{items.length}</Badge>
            {loading ? <span className="text-muted-foreground">加载中…</span> : null}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <Card key={item.questionId} className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {idx + 1}. {stemPlain(item.questionContent).slice(0, 48)}
                  {item.questionContent.length > 48 ? "…" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="whitespace-pre-wrap text-foreground">{item.questionContent}</p>
                {item.selects && item.selects.length > 0 ? (
                  <ul className="list-inside list-decimal space-y-1 text-muted-foreground">
                    {item.selects.map((s) => (
                      <li key={s.selectId}>
                        {s.selectContent}
                        {s.isRight === "y" ? <Badge className="ml-2 align-middle">正确项</Badge> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">无选项或未配置选项行。</p>
                )}
              </CardContent>
            </Card>
          ))}
          {!loading && ids.length === 0 ? (
            <Card className="border-dashed bg-muted/20 shadow-none">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                未传入题目 id。请从题库页使用「预览本页题目」或自行在地址栏拼接 ids 参数。
              </CardContent>
            </Card>
          ) : null}
          {!loading && ids.length > 0 && items.length === 0 ? (
            <Card className="border-dashed bg-muted/20 shadow-none">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">未加载到任何题目，请检查 id 是否有效。</CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
