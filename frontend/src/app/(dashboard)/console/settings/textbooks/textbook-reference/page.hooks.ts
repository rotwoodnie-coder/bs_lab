"use client";

import * as React from "react";

import type { SchoolDimensionSnapshot, SchoolLevelTreeNode } from "@/app/(dashboard)/console/settings/education/subject-grades/page.types";
import { ynToLineActive } from "@/app/(dashboard)/console/settings/education/subject-grades/page.types";
import { eduDimensionsApi, normalizeSchoolDimensionSnapshot } from "@/app/(dashboard)/console/settings/education/subject-grades/page.api";
import { buildStageTreeByGrade, buildStageTreeBySubject } from "@/lib/edu-dimension-stage-tree";

import type { TextbookRefBook, TextbookRefChapter } from "./page.types";
import * as api from "./page.api";

const EMPTY: SchoolDimensionSnapshot = {
  levels: [],
  subjects: [],
  grades: [],
  levelSubjects: [],
  levelGrades: [],
  gradeSubjectMatrix: [],
};

function orderedChapters(flat: TextbookRefChapter[]): TextbookRefChapter[] {
  const roots = flat
    .filter((c) => c.level === 1)
    .sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id));
  const out: TextbookRefChapter[] = [];
  for (const r of roots) {
    out.push(r);
    const kids = flat
      .filter((c) => c.parentId === r.id)
      .sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id));
    out.push(...kids);
  }
  return out;
}

function firstSubjectInSubjectTree(tree: SchoolLevelTreeNode[]): { levelId: string; subjectId: string } | null {
  for (const level of tree) {
    const children = (level.children as SchoolLevelTreeNode[] | undefined) ?? [];
    for (const ch of children) {
      if (ch.nodeType === "subject" && ch.subjectId) {
        return { levelId: ch.levelId, subjectId: ch.subjectId };
      }
    }
  }
  return null;
}

export function useTextbookReferenceConfigScreen() {
  const [snapshot, setSnapshot] = React.useState<SchoolDimensionSnapshot>(EMPTY);
  const [selectedLevelId, setSelectedLevelId] = React.useState("");
  const [selectedSubjectId, setSelectedSubjectId] = React.useState("");
  /** 空字符串表示仅按学科筛选；有值表示树中选中了「年级」节点，列表按年级收窄 */
  const [selectedGradeId, setSelectedGradeId] = React.useState("");
  const [books, setBooks] = React.useState<TextbookRefBook[]>([]);
  const [bookQuery, setBookQuery] = React.useState("");
  const [selectedBookId, setSelectedBookId] = React.useState<string>("");
  const [chapters, setChapters] = React.useState<TextbookRefChapter[]>([]);
  const [loadingDimensions, setLoadingDimensions] = React.useState(true);
  const [loadingBooks, setLoadingBooks] = React.useState(false);
  const [loadingChapters, setLoadingChapters] = React.useState(false);

  const stageTreeByGrade = React.useMemo(() => buildStageTreeByGrade(snapshot), [snapshot]);
  const stageTreeBySubject = React.useMemo(() => buildStageTreeBySubject(snapshot), [snapshot]);

  const gradesSafe = Array.isArray(snapshot.grades) ? snapshot.grades : [];

  const gradeOptions = React.useMemo(
    () =>
      [...gradesSafe]
        .filter((g) => ynToLineActive(g.status) === 1)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((g) => ({ id: g.gradeId, name: g.gradeName })),
    [gradesSafe],
  );

  const gradeNameById = React.useMemo(
    () => Object.fromEntries(gradesSafe.map((g) => [g.gradeId, g.gradeName])),
    [gradesSafe],
  );

  const loadDimensions = React.useCallback(async () => {
    setLoadingDimensions(true);
    try {
      const data = await eduDimensionsApi.fetchSnapshot();
      const normalized = normalizeSchoolDimensionSnapshot(data);
      setSnapshot(normalized);
      const first = firstSubjectInSubjectTree(buildStageTreeBySubject(normalized));
      setSelectedLevelId((prev) => {
        if (prev && normalized.levels.some((s) => s.levelId === prev)) return prev;
        return first?.levelId ?? normalized.levels[0]?.levelId ?? "";
      });
      setSelectedSubjectId((prev) => {
        if (prev && normalized.subjects.some((s) => s.subjectId === prev)) return prev;
        return first?.subjectId ?? "";
      });
      setSelectedGradeId("");
    } finally {
      setLoadingDimensions(false);
    }
  }, []);

  const setSubjectContext = React.useCallback(
    (ctx: { levelId: string; subjectId: string; gradeId?: string } | null) => {
      if (ctx) {
        setSelectedLevelId(ctx.levelId);
        setSelectedSubjectId(ctx.subjectId);
        setSelectedGradeId(ctx.gradeId ?? "");
      } else {
        setSelectedSubjectId("");
        setSelectedGradeId("");
      }
    },
    [],
  );

  const loadBooks = React.useCallback(async (subjectId: string, gradeId: string) => {
    if (!subjectId) {
      setBooks([]);
      setSelectedBookId("");
      return;
    }
    setLoadingBooks(true);
    try {
      const rows = await api.fetchBooks(subjectId, gradeId || undefined);
      setBooks(rows);
      setSelectedBookId((prev) => {
        if (prev && rows.some((b) => b.id === prev)) return prev;
        return rows[0]?.id ?? "";
      });
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  const loadChapters = React.useCallback(async (bookId: string) => {
    if (!bookId) {
      setChapters([]);
      return;
    }
    setLoadingChapters(true);
    try {
      const rows = await api.fetchChapters(bookId);
      setChapters(orderedChapters(rows));
    } finally {
      setLoadingChapters(false);
    }
  }, []);

  React.useEffect(() => {
    void loadDimensions();
  }, [loadDimensions]);

  React.useEffect(() => {
    void loadBooks(selectedSubjectId, selectedGradeId);
  }, [selectedSubjectId, selectedGradeId, loadBooks]);

  React.useEffect(() => {
    void loadChapters(selectedBookId);
  }, [selectedBookId, loadChapters]);

  const filteredBooks = React.useMemo(() => {
    const q = bookQuery.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => {
      const inTitle = b.title.toLowerCase().includes(q);
      const ver = (b.coursebookVersion ?? "").toLowerCase();
      return inTitle || (ver.length > 0 && ver.includes(q));
    });
  }, [books, bookQuery]);

  const chapterRoots = React.useMemo(() => chapters.filter((c) => c.level === 1), [chapters]);

  const levelName = snapshot.levels.find((s) => s.levelId === selectedLevelId)?.levelName ?? "";
  const subjectName = snapshot.subjects.find((s) => s.subjectId === selectedSubjectId)?.subjectName ?? "";
  const gradeName = selectedGradeId ? snapshot.grades.find((g) => g.gradeId === selectedGradeId)?.gradeName ?? "" : "";

  const subjectLabel = [levelName, subjectName, gradeName].filter(Boolean).join(" · ") || "未选择";

  return {
    snapshot,
    stageTreeByGrade,
    stageTreeBySubject,
    selectedLevelId,
    setSelectedLevelId,
    selectedSubjectId,
    selectedGradeId,
    setSubjectContext,
    gradeOptions,
    gradeNameById,
    bookQuery,
    setBookQuery,
    books: filteredBooks,
    allBooks: books,
    selectedBookId,
    setSelectedBookId,
    chapters,
    chapterRoots,
    loadingDimensions,
    loadingBooks,
    loadingChapters,
    levelName,
    subjectName,
    subjectLabel,
    refreshDimensions: loadDimensions,
    async refreshBooks() {
      await loadBooks(selectedSubjectId, selectedGradeId);
    },
    async refreshChapters() {
      await loadChapters(selectedBookId);
    },
    createBook: api.createBook,
    patchBook: api.patchBook,
    createChapter: api.createChapter,
    patchChapter: api.patchChapter,
    deleteChapter: api.deleteChapter,
  };
}
