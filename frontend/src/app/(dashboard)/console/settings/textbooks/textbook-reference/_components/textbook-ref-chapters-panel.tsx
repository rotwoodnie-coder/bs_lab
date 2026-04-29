"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Spinner,
} from "@bs-lab/ui";

import type { TextbookRefChapter } from "../page.types";
import {
  ChapterDescField,
  ChapterImageField,
  ChapterSortField,
  ChapterTitleField,
} from "./textbook-ref-chapter-form-fields";
import { TextbookRefChapterRows } from "./textbook-ref-chapter-rows";

export function TextbookRefChaptersPanel(props: {
  bookTitle: string;
  bookId: string;
  chapters: TextbookRefChapter[];
  chapterRoots: TextbookRefChapter[];
  loading: boolean;
  onCreate: (body: {
    textbookId: string;
    level: 1 | 2;
    parentId?: string | null;
    title: string;
    sortOrder?: number;
    description?: string | null;
    imageRegistryId?: string | null;
  }) => Promise<void>;
  onPatch: (
    id: string,
    body: {
      level: 1 | 2;
      title?: string;
      description?: string | null;
      imageRegistryId?: string | null;
      sortOrder?: number;
    },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [dlg, setDlg] = React.useState<"add-ch" | "add-sec" | "edit" | "del" | null>(null);
  const [editTarget, setEditTarget] = React.useState<TextbookRefChapter | null>(null);
  const [delTarget, setDelTarget] = React.useState<TextbookRefChapter | null>(null);
  const [title, setTitle] = React.useState("");
  const [sort, setSort] = React.useState("0");
  const [desc, setDesc] = React.useState("");
  const [img, setImg] = React.useState("");
  const [parentId, setParentId] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setTitle("");
    setSort("0");
    setDesc("");
    setImg("");
    setParentId(props.chapterRoots[0]?.id ?? "");
  }, [props.chapterRoots]);

  const openAddChapter = () => {
    resetForm();
    setDlg("add-ch");
  };

  const openAddSection = () => {
    resetForm();
    setDlg("add-sec");
  };

  const openEdit = (c: TextbookRefChapter) => {
    setEditTarget(c);
    setTitle(c.title);
    setSort(String(c.sortOrder));
    setDesc(c.description ?? "");
    setImg(c.imageRegistryId ?? "");
    setDlg("edit");
  };

  const openDel = (c: TextbookRefChapter) => {
    setDelTarget(c);
    setDlg("del");
  };

  const submitAddChapter = async () => {
    if (!props.bookId || !title.trim()) return;
    setBusy(true);
    try {
      await props.onCreate({
        textbookId: props.bookId,
        level: 1,
        title: title.trim(),
        sortOrder: Number(sort) || 0,
        description: desc.trim() || null,
        imageRegistryId: img.trim() || null,
      });
      setDlg(null);
    } finally {
      setBusy(false);
    }
  };

  const submitAddSection = async () => {
    if (!props.bookId || !title.trim() || !parentId) return;
    setBusy(true);
    try {
      await props.onCreate({
        textbookId: props.bookId,
        level: 2,
        parentId,
        title: title.trim(),
        sortOrder: Number(sort) || 0,
        description: desc.trim() || null,
        imageRegistryId: img.trim() || null,
      });
      setDlg(null);
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    if (!editTarget || !title.trim()) return;
    setBusy(true);
    try {
      await props.onPatch(editTarget.id, {
        level: editTarget.level,
        title: title.trim(),
        description: desc.trim() || null,
        imageRegistryId: img.trim() || null,
        sortOrder: Number(sort) || 0,
      });
      setDlg(null);
      setEditTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const submitDel = async () => {
    if (!delTarget) return;
    setBusy(true);
    try {
      await props.onDelete(delTarget.id);
      setDlg(null);
      setDelTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const formBlock = (
    <>
      <ChapterTitleField value={title} onChange={setTitle} />
      <ChapterSortField value={sort} onChange={setSort} />
      <ChapterDescField value={desc} onChange={setDesc} />
      <ChapterImageField value={img} onChange={setImg} placeholder="可选" />
    </>
  );

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base">章与节</CardTitle>
        <CardDescription>
          当前教材：{props.bookTitle || "未选择"}。章下可新增节；删除章将同时删除其下所有节。
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" size="sm" variant="outline" disabled={!props.bookId || busy} onClick={openAddChapter}>
            新增章
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!props.bookId || props.chapterRoots.length === 0 || busy}
            onClick={openAddSection}
          >
            新增节
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!props.bookId ? (
          <p className="text-sm text-muted-foreground">请先在上方表格中选择教材并点击「章节目录」。</p>
        ) : props.loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : (
          <TextbookRefChapterRows chapters={props.chapters} onEdit={openEdit} onDelete={openDel} />
        )}
      </CardContent>

      <Dialog open={dlg === "add-ch"} onOpenChange={(o) => !o && !busy && setDlg(null)}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>新增章</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">{formBlock}</div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDlg(null)} disabled={busy}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitAddChapter()} disabled={busy}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "add-sec"} onOpenChange={(o) => !o && !busy && setDlg(null)}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>新增节</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label>所属章</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                {props.chapterRoots.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
            {formBlock}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDlg(null)} disabled={busy}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitAddSection()} disabled={busy}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "edit"} onOpenChange={(o) => !o && !busy && setDlg(null)}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{editTarget?.level === 2 ? "编辑节" : "编辑章"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <ChapterTitleField value={title} onChange={setTitle} />
            <ChapterSortField value={sort} onChange={setSort} />
            <ChapterDescField value={desc} onChange={setDesc} />
            <ChapterImageField value={img} onChange={setImg} placeholder="留空表示清除" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDlg(null)} disabled={busy}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitEdit()} disabled={busy}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "del"} onOpenChange={(o) => !o && !busy && setDlg(null)}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            将删除「{delTarget?.title ?? ""}」{delTarget?.level === 1 ? "及其下所有节" : ""}，且不可恢复。是否继续？
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDlg(null)} disabled={busy}>
              取消
            </Button>
            <Button type="button" variant="destructive" onClick={() => void submitDel()} disabled={busy}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
