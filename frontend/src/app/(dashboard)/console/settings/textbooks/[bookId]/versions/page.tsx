"use client";

import { useRouter } from "next/navigation";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";

import { PageHeader } from "@/components/layout/page-header";

export default function TextbookVersionsPage({ params }: { params: { bookId: string } }) {
  const router = useRouter();
  const bookId = decodeURIComponent(params.bookId);

  return (
    <div className="space-y-6">
      <PageHeader title="版本对照" description="当前版本对照功能尚未接入独立版本关联表，因此仅保留入口。" />

      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-base">版本对照</CardTitle>
          <CardDescription>教材ID：{bookId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">数据库当前仅明确支持教材版本字段 `coursebook_version`。若后续需要版本映射表，再补完整版本对照闭环。</p>
          <Button type="button" variant="outline" onClick={() => router.push("/console/settings/textbooks")}>返回列表</Button>
        </CardContent>
      </Card>
    </div>
  );
}
