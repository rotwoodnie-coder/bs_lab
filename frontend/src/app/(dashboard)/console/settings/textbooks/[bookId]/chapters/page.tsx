"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@bs-lab/ui";

import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

import { useTextbookChaptersPage } from "./page.hooks";
import { ChapterExpPanel } from "./_components/chapter-exp-panel";

type Params = { bookId: string };

export default function TextbookChaptersPage({ params }: { params: Promise<Params> }) {
  const router = useRouter();
  const { bookId: rawBookId } = React.use(params);
  const bookId = decodeURIComponent(rawBookId);
  const s = useTextbookChaptersPage(bookId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span>章节管理{s.book ? <span className="ml-2 text-base font-normal text-muted-foreground">· {s.book.title}</span> : null}</span>}
        description="维护教材章节与小节结构，并为每个章节挂载关联实验。"
      />

      <Card className="border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">章节树</CardTitle>
            <CardDescription>当前教材：{s.book?.title ?? bookId}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push("/console/settings/textbooks")}>返回列表</Button>
            <Button type="button" size="sm" onClick={s.openAddChapter}>新增章节</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {s.loading ? (
            <p className="text-sm text-muted-foreground">加载中…</p>
          ) : s.tree.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无章节，请先新增章节。</p>
          ) : (
            s.tree.map((chapter) => (
              <div key={chapter.chapterId} className={cn("rounded-md border border-border p-3", s.selectedChapterId === chapter.chapterId && "bg-muted/20")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button type="button" className="text-left" onClick={() => s.setSelectedChapterId(chapter.chapterId)}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-normal">章</Badge>
                      <span className="font-medium">{chapter.chapterName}</span>
                    </div>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => s.openEditChapter(chapter)} disabled={s.busyId === chapter.chapterId}>编辑</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => s.openAddUnit(chapter.chapterId)}>新增小节</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => void s.removeChapter(chapter.chapterId)} disabled={s.busyId === chapter.chapterId}>删除</Button>
                  </div>
                </div>

                <div className="mt-3 space-y-2 border-l border-dashed border-border pl-3">
                  {chapter.units.length === 0 ? (
                    <p className="text-sm text-muted-foreground">暂无小节。</p>
                  ) : (
                    chapter.units.map((unit) => (
                      <div key={unit.unitId} className="flex items-center justify-between gap-2 rounded bg-background px-3 py-2">
                        <span className="text-sm"><span className="text-muted-foreground">• </span>{unit.unitName}</span>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => s.openEditUnit(chapter.chapterId, unit)} disabled={s.busyId === unit.unitId}>编辑</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => void s.removeUnit(unit.unitId)} disabled={s.busyId === unit.unitId}>删除</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <ChapterExpPanel actor={s.actor} chapter={chapter} coursebookId={bookId} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 新增 / 编辑章节弹窗 */}
      <Dialog open={s.chapterOpen} onOpenChange={s.setChapterOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{s.editingChapter ? "编辑章节" : "新增章节"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1"><Label>章节名称</Label><Input value={s.chapterForm.chapterName} onChange={(e) => s.setChapterForm((d) => ({ ...d, chapterName: e.target.value }))} /></div>
            <div className="grid gap-1"><Label>排序</Label><Input value={s.chapterForm.sortOrder} onChange={(e) => s.setChapterForm((d) => ({ ...d, sortOrder: e.target.value }))} /></div>
            <div className="grid gap-1"><Label>备注</Label><Input value={s.chapterForm.comments} onChange={(e) => s.setChapterForm((d) => ({ ...d, comments: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => s.setChapterOpen(false)}>取消</Button>
            <Button type="button" onClick={() => void s.submitChapter()} disabled={s.busyId != null}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增 / 编辑小节弹窗 */}
      <Dialog open={s.unitOpen} onOpenChange={s.setUnitOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{s.editingUnit ? "编辑小节" : "新增小节"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1"><Label>小节名称</Label><Input value={s.unitForm.unitName} onChange={(e) => s.setUnitForm((d) => ({ ...d, unitName: e.target.value }))} /></div>
            <div className="grid gap-1"><Label>排序</Label><Input value={s.unitForm.sortOrder} onChange={(e) => s.setUnitForm((d) => ({ ...d, sortOrder: e.target.value }))} /></div>
            <div className="grid gap-1"><Label>备注</Label><Input value={s.unitForm.comments} onChange={(e) => s.setUnitForm((d) => ({ ...d, comments: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => s.setUnitOpen(false)}>取消</Button>
            <Button type="button" onClick={() => void s.submitUnit()} disabled={s.busyId != null}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
