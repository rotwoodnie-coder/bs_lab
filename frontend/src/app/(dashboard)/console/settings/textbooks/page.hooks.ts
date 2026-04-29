"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import {
  createEduTextbookApi,
  createEduTextbookChapterApi,
  createEduTextbookUnitApi,
  deleteEduTextbookApi,
  deleteEduTextbookChapterApi,
  deleteEduTextbookUnitApi,
  duplicateEduTextbookApi,
  fetchEduTextbookTree,
  fetchCoursebooksEnriched,
  updateEduTextbookApi,
  updateEduTextbookChapterApi,
  updateEduTextbookUnitApi,
  type EduTextbookListItem,
} from "@/lib/edu-textbooks-api";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { useSessionActor } from "@/hooks/use-session-actor";

type TextbookForm = { coursebookName: string; coursebookVersion: string; comments: string; status: "y" | "n" };
type ChapterForm = { chapterName: string; comments: string; sortOrder: string };
type UnitForm = { unitName: string; comments: string; sortOrder: string };
const EMPTY_FORM: TextbookForm = { coursebookName: "", coursebookVersion: "", comments: "", status: "y" };
const EMPTY_CHAPTER_FORM: ChapterForm = { chapterName: "", comments: "", sortOrder: "0" };
const EMPTY_UNIT_FORM: UnitForm = { unitName: "", comments: "", sortOrder: "0" };

export function useConsoleTextbooksPage() {
  const { role, orgId, hydrated } = useSessionActor();
  const actor = React.useMemo(() => buildMaterialsApiActor(role, orgId, "edu-textbooks"), [role, orgId]);
  const [items, setItems] = React.useState<EduTextbookListItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [chapterOpen, setChapterOpen] = React.useState(false);
  const [unitOpen, setUnitOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = React.useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = React.useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<TextbookForm>(EMPTY_FORM);
  const [chapterForm, setChapterForm] = React.useState<ChapterForm>(EMPTY_CHAPTER_FORM);
  const [unitForm, setUnitForm] = React.useState<UnitForm>(EMPTY_UNIT_FORM);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [treeLoading, setTreeLoading] = React.useState(false);
  const [tree, setTree] = React.useState<Awaited<ReturnType<typeof fetchEduTextbookTree>>>([] as never[]);

  const refresh = React.useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);
    try {
      const rows = await fetchCoursebooksEnriched(actor);
      const mapped: EduTextbookListItem[] = rows.map((r) => ({
        id: r.coursebookId,
        title: r.coursebookName,
        subjectId: r.subjectId ?? "",
        subjectName: r.subjectName ?? null,
        coursebookVersion: r.coursebookVersion,
        status: r.status === "n" ? 0 : 1,
      }));
      setItems(mapped);
      if (!selectedId && mapped[0]?.id) setSelectedId(mapped[0].id);
    } finally { setLoading(false); }
  }, [actor, hydrated, selectedId]);
  const reloadTree = React.useCallback(async (textbookId: string) => { setTreeLoading(true); try { setTree(await fetchEduTextbookTree(actor, textbookId)); } catch (e) { sonnerToast.error(e instanceof Error ? e.message : "章节树加载失败"); setTree([] as never[]); } finally { setTreeLoading(false); } }, [actor]);
  React.useEffect(() => { void refresh(); }, [refresh]);
  React.useEffect(() => { if (!selectedId) return; void reloadTree(selectedId); }, [selectedId, reloadTree]);

  const duplicate = React.useCallback(async (id: string) => { setBusyId(id); try { const out = await duplicateEduTextbookApi(actor, id); sonnerToast.success(`已复制为「${out.title}」`); await refresh(); } catch (e) { sonnerToast.error(e instanceof Error ? e.message : "复制失败"); } finally { setBusyId(null); } }, [actor, refresh]);
  const openCreate = React.useCallback(() => { setEditingId(null); setForm(EMPTY_FORM); setCreateOpen(true); }, []);
  const openEdit = React.useCallback((item: EduTextbookListItem) => { setEditingId(item.id); setForm({ coursebookName: item.title, coursebookVersion: item.coursebookVersion ?? "", comments: "", status: item.status ? "y" : "n" }); setEditOpen(true); }, []);
  const openChapterCreate = React.useCallback(() => { setEditingChapterId(null); setChapterForm(EMPTY_CHAPTER_FORM); setChapterOpen(true); }, []);
  const openChapterEdit = React.useCallback((chapter: { chapterId: string; chapterName: string; comments: string | null; sortOrder: number | null }) => { setEditingChapterId(chapter.chapterId); setChapterForm({ chapterName: chapter.chapterName, comments: chapter.comments ?? "", sortOrder: String(chapter.sortOrder ?? 0) }); setChapterOpen(true); }, []);
  const openUnitCreate = React.useCallback((chapterId: string) => { setSelectedChapterId(chapterId); setEditingUnitId(null); setUnitForm(EMPTY_UNIT_FORM); setUnitOpen(true); }, []);
  const openUnitEdit = React.useCallback((unit: { unitId: string; unitName: string; comments: string | null; sortOrder: number | null; chapterId?: string | null }) => { setEditingUnitId(unit.unitId); setSelectedChapterId(unit.chapterId ?? selectedChapterId); setUnitForm({ unitName: unit.unitName, comments: unit.comments ?? "", sortOrder: String(unit.sortOrder ?? 0) }); setUnitOpen(true); }, [selectedChapterId]);

  const submitCreate = React.useCallback(async () => { if (!form.coursebookName.trim()) return void sonnerToast.error("教材名称不能为空"); setLoading(true); try { await createEduTextbookApi(actor, { coursebook_name: form.coursebookName.trim(), coursebook_version: form.coursebookVersion.trim() || undefined, comments: form.comments.trim() || undefined, status: form.status }); sonnerToast.success("教材已创建"); setCreateOpen(false); setForm(EMPTY_FORM); await refresh(); } catch (e) { sonnerToast.error(e instanceof Error ? e.message : "创建失败"); } finally { setLoading(false); } }, [actor, form, refresh]);
  const submitEdit = React.useCallback(async () => { if (!editingId) return; if (!form.coursebookName.trim()) return void sonnerToast.error("教材名称不能为空"); setBusyId(editingId); try { await updateEduTextbookApi(actor, editingId, { coursebook_name: form.coursebookName.trim(), coursebook_version: form.coursebookVersion.trim() || null, comments: form.comments.trim() || null, status: form.status }); sonnerToast.success("教材已更新"); setEditOpen(false); setEditingId(null); await refresh(); if (selectedId === editingId) await reloadTree(editingId); } catch (e) { sonnerToast.error(e instanceof Error ? e.message : "更新失败"); } finally { setBusyId(null); } }, [actor, editingId, form, refresh, reloadTree, selectedId]);
  const submitChapter = React.useCallback(async () => { if (!selectedId) return; if (!chapterForm.chapterName.trim()) return void sonnerToast.error("章节名称不能为空"); setLoading(true); try { if (editingChapterId) { await updateEduTextbookChapterApi(actor, editingChapterId, { chapter_name: chapterForm.chapterName.trim(), comments: chapterForm.comments.trim() || null, sort_order: Number(chapterForm.sortOrder || 0) }); sonnerToast.success("章节已更新"); } else { await createEduTextbookChapterApi(actor, { coursebook_id: selectedId, chapter_name: chapterForm.chapterName.trim(), comments: chapterForm.comments.trim() || undefined, sort_order: Number(chapterForm.sortOrder || 0) }); sonnerToast.success("章节已创建"); } setChapterOpen(false); setChapterForm(EMPTY_CHAPTER_FORM); setEditingChapterId(null); await reloadTree(selectedId); } catch (e) { sonnerToast.error(e instanceof Error ? e.message : "章节保存失败"); } finally { setLoading(false); } }, [actor, chapterForm, editingChapterId, reloadTree, selectedId]);
  const submitUnit = React.useCallback(async () => { if (!selectedChapterId) return; if (!unitForm.unitName.trim()) return void sonnerToast.error("小节名称不能为空"); setLoading(true); try { if (editingUnitId) { await updateEduTextbookUnitApi(actor, editingUnitId, { unit_name: unitForm.unitName.trim(), comments: unitForm.comments.trim() || null, sort_order: Number(unitForm.sortOrder || 0) }); sonnerToast.success("小节已更新"); } else { await createEduTextbookUnitApi(actor, { chapter_id: selectedChapterId, unit_name: unitForm.unitName.trim(), comments: unitForm.comments.trim() || undefined, sort_order: Number(unitForm.sortOrder || 0) }); sonnerToast.success("小节已创建"); } setUnitOpen(false); setUnitForm(EMPTY_UNIT_FORM); setEditingUnitId(null); await reloadTree(selectedId ?? ""); } catch (e) { sonnerToast.error(e instanceof Error ? e.message : "小节保存失败"); } finally { setLoading(false); } }, [actor, editingUnitId, reloadTree, selectedChapterId, selectedId, unitForm]);
  const remove = React.useCallback(async (id: string) => { if (!globalThis.confirm("确认停用该教材吗？")) return; setBusyId(id); try { await deleteEduTextbookApi(actor, id); sonnerToast.success("教材已停用"); await refresh(); if (selectedId === id) { setSelectedId(null); setTree([] as never[]); } } catch (e) { sonnerToast.error(e instanceof Error ? e.message : "停用失败"); } finally { setBusyId(null); } }, [actor, refresh, selectedId]);
  const removeChapter = React.useCallback(async (id: string) => { if (!globalThis.confirm("确认删除该章节吗？")) return; setBusyId(id); try { await deleteEduTextbookChapterApi(actor, id); sonnerToast.success("章节已删除"); await reloadTree(selectedId ?? ""); } catch (e) { sonnerToast.error(e instanceof Error ? e.message : "删除章节失败"); } finally { setBusyId(null); } }, [actor, reloadTree, selectedId]);
  const removeUnit = React.useCallback(async (id: string) => { if (!globalThis.confirm("确认删除该小节吗？")) return; setBusyId(id); try { await deleteEduTextbookUnitApi(actor, id); sonnerToast.success("小节已删除"); await reloadTree(selectedId ?? ""); } catch (e) { sonnerToast.error(e instanceof Error ? e.message : "删除小节失败"); } finally { setBusyId(null); } }, [actor, reloadTree, selectedId]);

  return { hydrated, loading, items, refresh, duplicate, create: submitCreate, update: submitEdit, remove, busyId, actor, createOpen, setCreateOpen, editOpen, setEditOpen, openCreate, openEdit, submitCreate, submitEdit, form, setForm, editingId, selectedId, setSelectedId, tree, treeLoading, reloadTree, chapterOpen, setChapterOpen, openChapterCreate, openChapterEdit, submitChapter, chapterForm, setChapterForm, unitOpen, setUnitOpen, openUnitCreate, openUnitEdit, submitUnit, unitForm, setUnitForm, selectedChapterId, setSelectedChapterId, removeChapter, removeUnit };
}
