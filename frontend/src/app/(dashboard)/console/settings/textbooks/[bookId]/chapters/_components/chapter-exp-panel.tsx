"use client";

import * as React from "react";
import { Badge, Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "@bs-lab/ui";
import { cn } from "@/lib/utils";
import {
  bindExpToUnitApi,
  fetchAllPublishedExps,
  fetchExpsByChapter,
  type ExpMsgRow,
} from "@/lib/edu-textbooks-api";
import type { ApiActor } from "@/lib/new-core-api";
import type { TreeChapter } from "../page.hooks";

type Props = {
  actor: ApiActor;
  chapter: TreeChapter;
  coursebookId: string;
};

export function ChapterExpPanel({ actor, chapter, coursebookId }: Props) {
  const [linked, setLinked] = React.useState<ExpMsgRow[]>([]);
  const [loadingLinked, setLoadingLinked] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [allExps, setAllExps] = React.useState<ExpMsgRow[]>([]);
  const [pickerKeyword, setPickerKeyword] = React.useState("");
  const [pickerPage, setPickerPage] = React.useState(1);
  const [pickerTotal, setPickerTotal] = React.useState(0);
  const [pickerLoading, setPickerLoading] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  const loadLinked = React.useCallback(async () => {
    setLoadingLinked(true);
    try { setLinked(await fetchExpsByChapter(actor, chapter.chapterId)); }
    finally { setLoadingLinked(false); }
  }, [actor, chapter.chapterId]);

  React.useEffect(() => { void loadLinked(); }, [loadLinked]);

  const loadPicker = React.useCallback(async (keyword: string, page: number) => {
    setPickerLoading(true);
    try {
      const res = await fetchAllPublishedExps(actor, keyword, page);
      setAllExps(res.items);
      setPickerTotal(res.total);
    } finally { setPickerLoading(false); }
  }, [actor]);

  const openPicker = () => {
    setPickerKeyword(""); setPickerPage(1); setOpen(true);
    void loadPicker("", 1);
  };

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => { void loadPicker(pickerKeyword, 1); setPickerPage(1); }, 300);
    return () => clearTimeout(t);
  }, [pickerKeyword, open, loadPicker]);

  const linkedIds = React.useMemo(() => new Set(linked.map((e) => e.expId)), [linked]);

  const handleBind = async (exp: ExpMsgRow, targetUnit: TreeChapter["units"][number] | null) => {
    setBusy(exp.expId);
    try {
      const uid = targetUnit?.unitId ?? null;
      const bid = uid ? coursebookId : null;
      await bindExpToUnitApi(actor, exp.expId, uid, bid);
      await loadLinked();
    } finally { setBusy(null); }
  };

  const handleUnbind = async (exp: ExpMsgRow) => {
    if (!globalThis.confirm(`确认解除"${exp.expName}"与本章节的关联？`)) return;
    setBusy(exp.expId);
    try { await bindExpToUnitApi(actor, exp.expId, null, null); await loadLinked(); }
    finally { setBusy(null); }
  };

  const pageSize = 50;
  const totalPages = Math.ceil(pickerTotal / pageSize);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">已关联实验</span>
        <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={openPicker}>
          挂载实验
        </Button>
      </div>

      {loadingLinked ? (
        <p className="text-xs text-muted-foreground">加载中…</p>
      ) : linked.length === 0 ? (
        <p className="text-xs text-muted-foreground">暂无关联实验</p>
      ) : (
        <div className="space-y-1">
          {linked.map((exp) => (
            <div key={exp.expId} className="flex items-center justify-between gap-2 rounded bg-muted/30 px-2 py-1">
              <div className="min-w-0 flex-1">
                <span className="truncate text-xs font-medium">{exp.expName}</span>
                {exp.unitName && <span className="ml-1 text-[10px] text-muted-foreground">· {exp.unitName}</span>}
              </div>
              <Button type="button" size="sm" variant="ghost" className="h-5 px-1 text-[10px] text-destructive hover:text-destructive" disabled={busy === exp.expId} onClick={() => void handleUnbind(exp)}>
                解除
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>挂载实验到「{chapter.chapterName}」</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">勾选实验后，将其绑定到本章节的第一个小节；若章节暂无小节，请先新增小节。</p>
          <Input placeholder="搜索实验名称…" value={pickerKeyword} onChange={(e) => setPickerKeyword(e.target.value)} className="h-8 text-sm" />
          <div className="max-h-72 overflow-y-auto rounded-md border border-border">
            {pickerLoading ? (
              <p className="p-4 text-sm text-muted-foreground">加载中…</p>
            ) : allExps.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">暂无已发布实验</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">实验名称</th>
                    <th className="px-3 py-2 text-left font-medium">当前绑定</th>
                    <th className="px-3 py-2 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {allExps.map((exp) => {
                    const isLinked = linkedIds.has(exp.expId);
                    const firstUnit = chapter.units[0] ?? null;
                    return (
                      <tr key={exp.expId} className={cn("border-t border-border/50", isLinked && "bg-emerald-50/50")}>
                        <td className="px-3 py-2">
                          <span className={cn("font-medium", isLinked && "text-emerald-700")}>{exp.expName}</span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">
                          {exp.unitName ? exp.unitName : <span className="italic">未绑定</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isLinked ? (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]">已关联</Badge>
                          ) : (
                            <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs" disabled={busy === exp.expId || !firstUnit} onClick={() => void handleBind(exp, firstUnit)} title={!firstUnit ? "请先为该章新增小节" : undefined}>
                              {firstUnit ? "挂载" : "无小节"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>共 {pickerTotal} 条</span>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs" disabled={pickerPage <= 1} onClick={() => { const p = pickerPage - 1; setPickerPage(p); void loadPicker(pickerKeyword, p); }}>上一页</Button>
                <span className="px-2 py-1">{pickerPage} / {totalPages}</span>
                <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs" disabled={pickerPage >= totalPages} onClick={() => { const p = pickerPage + 1; setPickerPage(p); void loadPicker(pickerKeyword, p); }}>下一页</Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
