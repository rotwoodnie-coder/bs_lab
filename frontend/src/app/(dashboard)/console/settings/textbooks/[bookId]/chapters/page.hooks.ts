"use client";

import * as React from "react";
import { useDemoRole } from "@/components/layout/demo-role-context";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import {
  createEduTextbookChapterApi,
  createEduTextbookUnitApi,
  deleteEduTextbookChapterApi,
  deleteEduTextbookUnitApi,
  fetchEduTextbooks,
  fetchEduTextbookTree,
  updateEduTextbookChapterApi,
  updateEduTextbookUnitApi,
  type EduTextbookListItem,
} from "@/lib/edu-textbooks-api";

export type TreeChapter = Awaited<ReturnType<typeof fetchEduTextbookTree>>[number];
export type ChapterForm = { chapterName: string; comments: string; sortOrder: string; status: "y" | "n" };
export type UnitForm = { unitName: string; comments: string; sortOrder: string; status: "y" | "n" };
export const EMPTY_CHAPTER: ChapterForm = { chapterName: "", comments: "", sortOrder: "0", status: "y" };
export const EMPTY_UNIT: UnitForm = { unitName: "", comments: "", sortOrder: "0", status: "y" };

export function useTextbookChaptersPage(bookId: string) {
  const { role, orgId } = useDemoRole();
  const actor = React.useMemo(() => buildMaterialsApiActor(role, orgId, "edu-textbooks"), [role, orgId]);

  const [book, setBook] = React.useState<EduTextbookListItem | null>(null);
  const [tree, setTree] = React.useState<TreeChapter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = React.useState<string | null>(null);

  const [chapterOpen, setChapterOpen] = React.useState(false);
  const [unitOpen, setUnitOpen] = React.useState(false);
  const [editingChapter, setEditingChapter] = React.useState<TreeChapter | null>(null);
  const [editingUnit, setEditingUnit] = React.useState<{ unitId: string; chapterId: string } | null>(null);
  const [chapterForm, setChapterForm] = React.useState<ChapterForm>(EMPTY_CHAPTER);
  const [unitForm, setUnitForm] = React.useState<UnitForm>(EMPTY_UNIT);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [all, books] = await Promise.all([fetchEduTextbookTree(actor, bookId), fetchEduTextbooks(actor)]);
      setTree(all);
      const found = books.find((b) => b.id === bookId) ?? null;
      setBook(found);
      setSelectedChapterId((prev) => prev ?? all[0]?.chapterId ?? null);
    } finally {
      setLoading(false);
    }
  }, [actor, bookId]);

  React.useEffect(() => { void load(); }, [load]);

  const openAddChapter = React.useCallback(() => {
    setEditingChapter(null); setChapterForm(EMPTY_CHAPTER); setChapterOpen(true);
  }, []);

  const openEditChapter = React.useCallback((chapter: TreeChapter) => {
    setEditingChapter(chapter);
    setChapterForm({ chapterName: chapter.chapterName, comments: chapter.comments ?? "", sortOrder: String(chapter.sortOrder ?? 0), status: (chapter.status as "y" | "n") ?? "y" });
    setChapterOpen(true);
  }, []);

  const openAddUnit = React.useCallback((chapterId?: string) => {
    const cid = chapterId ?? selectedChapterId;
    if (!cid) return;
    setSelectedChapterId(cid); setEditingUnit(null); setUnitForm(EMPTY_UNIT); setUnitOpen(true);
  }, [selectedChapterId]);

  const openEditUnit = React.useCallback((chapterId: string, unit: TreeChapter["units"][number]) => {
    setSelectedChapterId(chapterId);
    setEditingUnit({ unitId: unit.unitId, chapterId });
    setUnitForm({ unitName: unit.unitName, comments: unit.comments ?? "", sortOrder: String(unit.sortOrder ?? 0), status: (unit.status as "y" | "n") ?? "y" });
    setUnitOpen(true);
  }, []);

  const submitChapter = async () => {
    if (!chapterForm.chapterName.trim()) return;
    const key = editingChapter?.chapterId ?? "new-chapter";
    setBusyId(key);
    try {
      if (editingChapter) {
        await updateEduTextbookChapterApi(actor, editingChapter.chapterId, { chapter_name: chapterForm.chapterName.trim(), comments: chapterForm.comments.trim() || null, sort_order: Number(chapterForm.sortOrder || 0), status: chapterForm.status });
      } else {
        await createEduTextbookChapterApi(actor, { coursebook_id: bookId, chapter_name: chapterForm.chapterName.trim(), comments: chapterForm.comments.trim() || undefined, sort_order: Number(chapterForm.sortOrder || 0) });
      }
      setChapterOpen(false); setEditingChapter(null); await load();
    } finally { setBusyId(null); }
  };

  const submitUnit = async () => {
    if (!unitForm.unitName.trim() || !selectedChapterId) return;
    const key = editingUnit?.unitId ?? "new-unit";
    setBusyId(key);
    try {
      if (editingUnit) {
        await updateEduTextbookUnitApi(actor, editingUnit.unitId, { unit_name: unitForm.unitName.trim(), comments: unitForm.comments.trim() || null, sort_order: Number(unitForm.sortOrder || 0), status: unitForm.status });
      } else {
        await createEduTextbookUnitApi(actor, { chapter_id: selectedChapterId, unit_name: unitForm.unitName.trim(), comments: unitForm.comments.trim() || undefined, sort_order: Number(unitForm.sortOrder || 0) });
      }
      setUnitOpen(false); setEditingUnit(null); await load();
    } finally { setBusyId(null); }
  };

  const removeChapter = async (chapterId: string) => {
    if (!globalThis.confirm("确认删除该章节吗？")) return;
    setBusyId(chapterId);
    try { await deleteEduTextbookChapterApi(actor, chapterId); await load(); } finally { setBusyId(null); }
  };

  const removeUnit = async (unitId: string) => {
    if (!globalThis.confirm("确认删除该小节吗？")) return;
    setBusyId(unitId);
    try { await deleteEduTextbookUnitApi(actor, unitId); await load(); } finally { setBusyId(null); }
  };

  return {
    actor, book, tree, loading, busyId, selectedChapterId, setSelectedChapterId,
    chapterOpen, setChapterOpen, unitOpen, setUnitOpen,
    editingChapter, chapterForm, setChapterForm,
    editingUnit, unitForm, setUnitForm,
    openAddChapter, openEditChapter, openAddUnit, openEditUnit,
    submitChapter, submitUnit, removeChapter, removeUnit,
  };
}
