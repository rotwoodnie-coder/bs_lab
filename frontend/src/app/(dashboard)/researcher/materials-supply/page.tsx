"use client";

import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bs-lab/ui";
import { Package } from "@bs-lab/ui/icons";

export default function ResearcherMaterialsSupplyPage() {
  const shortage: Array<{ experimentId: string; shortageCount: number }> = [];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Package className="size-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            材料供需看板
          </h1>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          聚合家长端「材料难凑」反馈，用于教研员协调跨校资源。明细维护见{" "}
          <Link href="/experimental-materials" className="font-medium text-primary underline-offset-4 hover:underline">
            实验材料库
          </Link>
          。
        </p>
      </header>

      <Card className="border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">缺料预警（按实验聚合）</CardTitle>
          <CardDescription>数据源待接入。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>实验</TableHead>
                  <TableHead className="text-right">反馈次数</TableHead>
                  <TableHead className="text-right">干预</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shortage.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-muted-foreground">
                      暂无预警。
                    </TableCell>
                  </TableRow>
                ) : (
                  shortage.map((row) => (
                    <TableRow key={row.experimentId}>
                      <TableCell className="font-medium">{row.experimentId}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.shortageCount}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/teacher/experiment-editor?id=${encodeURIComponent(row.experimentId)}&intervention=1`}
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          打开方案编辑器
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
