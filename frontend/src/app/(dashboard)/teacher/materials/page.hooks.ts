"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { defaultMaterialTitleFromFileName } from "@/lib/default-material-title";
import type { ApiActor } from "@/lib/new-core-api";
import { fetchV2ExpLibraryAll } from "@/lib/v2/v2-exp-api";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  isRoleVisibleForMaterialType,
  listTeacherMaterialTypeConfigApi,
} from "@/lib/teacher-material-type-config-store";
import type { TeacherMaterialKind } from "@/lib/teacher-materials-api";
import {
  deleteTeacherMaterialApi,
  listTeacherMaterialsApi,
  resolvedTeacherMaterialDataFileId,
  updateTeacherMaterialApi,
  type TeacherMaterialItem,
} from "@/lib/teacher-materials-api";

import { filterTeacherMaterials, type KindFilterId } from "./_lib/material-filters";
import { TEACHER_MATERIALS_KIND_FILTER, isKnownKindFilterId } from "./_lib/teacher-materials-ui.config";
import { executeTeacherMaterialCreate } from "./_lib/teacher-materials-create-action";
import type { TeacherMaterialEditSubmitInput } from "./_components/TeacherMaterialEditDialog";

const SIDEBAR_FILTERS_STORAGE_KEY = "bs-lab:teacher-materials:sidebar-filters";

function readStoredSidebarFilters(): { kindFilter: KindFilterId } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SIDEBAR_FILTERS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { kindFilter?: unknown };
    return {
      kindFilter: isKnownKindFilterId(parsed.kindFilter) ? parsed.kindFilter : "all",
    };
  } catch {
    return null;
  }
}

function writeStoredSidebarFilters(kindFilter: KindFilterId) {
  try {
    localStorage.setItem(SIDEBAR_FILTERS_STORAGE_KEY, JSON.stringify({ kindFilter }));
  } catch {
    /* 存储已满或禁用 */
  }
}

function toStageMessage(stage: string, error: unknown): string {
  const message = error instanceof Error ? error.message : "未知错误";
  return `[${stage}] ${message}`;
}

export function useTeacherMaterialsPage() {
  const session = useSessionActor();
  const { role, orgId, hydrated } = session;
  const [mode, setMode] = React.useState<"waterfall" | "grid" | "list">("waterfall");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [keyword, setKeyword] = React.useState("");
  const [kindFilter, setKindFilter] = React.useState<KindFilterId>("all");
  const [kindOptions, setKindOptions] = React.useState<{ id: string; label: string }[]>(
    TEACHER_MATERIALS_KIND_FILTER.map((item) => ({ id: item.id, label: item.label })),
  );
  const [experimentOptions, setExperimentOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [experimentOptionsLoading, setExperimentOptionsLoading] = React.useState(false);
  const [items, setItems] = React.useState<TeacherMaterialItem[]>([]);
  const [deleteTarget, setDeleteTarget] = React.useState<TeacherMaterialItem | null>(null);
  const [editTarget, setEditTarget] = React.useState<TeacherMaterialItem | null>(null);
  const sidebarPersistPass = React.useRef(0);

  const actor = React.useMemo<ApiActor>(
    () => ({
      role,
      orgId,
      userId: session.actor.userId,
      userName: session.actor.userName,
    }),
    [orgId, role, session.actor.userId, session.actor.userName],
  );

  React.useEffect(() => {
    const stored = readStoredSidebarFilters();
    if (stored) {
      setKindFilter(stored.kindFilter);
    }
  }, []);

  React.useEffect(() => {
    sidebarPersistPass.current += 1;
    if (sidebarPersistPass.current === 1) return;
    writeStoredSidebarFilters(kindFilter);
  }, [kindFilter]);

  React.useEffect(() => {
    if (!hydrated) return;
    void listTeacherMaterialsApi(actor, {
      keyword: keyword.trim() || undefined,
      materialTypeCode: kindFilter,
    })
      .then((rows) => setItems(rows))
      .catch((error) => {
        sonnerToast.error(error instanceof Error ? error.message : "加载素材失败");
      });
  }, [actor, hydrated, kindFilter, keyword]);

  React.useEffect(() => {
    if (!hydrated) return;
    const fallbackKindOptions = TEACHER_MATERIALS_KIND_FILTER.map((item) => ({ id: item.id, label: item.label }));
    void listTeacherMaterialTypeConfigApi(actor)
      .then((types) => {
        if (!types.length) {
          setKindOptions(fallbackKindOptions);
          return;
        }
        const sorted = [...types]
          .filter((type) => isRoleVisibleForMaterialType(type, role))
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (!sorted.length) {
          setKindOptions(fallbackKindOptions);
          return;
        }
        setKindOptions([
          { id: "all", label: "全部" },
          ...sorted.map((item) => ({ id: item.code, label: item.label || item.code })),
        ]);
      })
      .catch(() => {
        setKindOptions(fallbackKindOptions);
      });
  }, [actor, hydrated, role]);

  React.useEffect(() => {
    if (!hydrated) return;
    setExperimentOptionsLoading(true);
    const v2Actor = {
      role: actor.role,
      userId: actor.userId,
      userName: actor.userName,
      orgId: actor.orgId,
    };
    void fetchV2ExpLibraryAll(v2Actor, { status: "y" })
      .then((rows) => {
        setExperimentOptions(
          rows.map((r) => ({
            value: r.libExpId,
            label: r.libExpName?.trim() || `未命名试验（${r.libExpId}）`,
          })),
        );
      })
      .catch(() => {
        sonnerToast.error("加载实验列表失败");
        setExperimentOptions([]);
      })
      .finally(() => {
        setExperimentOptionsLoading(false);
      });
  }, [actor, hydrated]);

  React.useEffect(() => {
    if (kindFilter === "all") return;
    if (!kindOptions.some((item) => item.id === kindFilter)) {
      setKindFilter("all");
    }
  }, [kindFilter, kindOptions]);

  const filtered = React.useMemo(
    () => filterTeacherMaterials(items, kindFilter, keyword),
    [items, kindFilter, keyword],
  );

  const createMaterial = React.useCallback(
    async (
      item: Omit<TeacherMaterialItem, "materialId" | "updatedAt">,
      files: File[],
      hooks?: {
        onFileStart?: (file: File) => void;
        onFileProgress?: (file: File, percent: number) => void;
        onFileSuccess?: (file: File) => void;
        onFileError?: (file: File, message: string) => void;
      },
    ) => {
      if (files.length === 0) {
        sonnerToast.error("请先选择要上传的文件");
        throw new Error("缺少文件");
      }
      console.info("[teacher-materials] create:start", {
        traceId: [actor.orgId, actor.userId, actor.role].filter(Boolean).join("/"),
        fileCount: files.length,
        kind: item.kind,
        experimentId: item.experimentId,
      });
      const createdRows: TeacherMaterialItem[] = [];
      let failureCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const title =
          files.length === 1
            ? item.title.trim() || defaultMaterialTitleFromFileName(file.name)
            : defaultMaterialTitleFromFileName(file.name);
        if (!title.trim()) {
          sonnerToast.error("素材名称无效");
          throw new Error("名称无效");
        }
        hooks?.onFileStart?.(file);
        try {
          const row = await executeTeacherMaterialCreate(
            actor,
            { ...item, title: title.trim() },
            file,
            {
              silent: true,
              onProgress: (event) => hooks?.onFileProgress?.(file, event.percent),
            },
          );
          createdRows.push(row);
          console.info("[teacher-materials] create:upload:ok", {
            traceId: [actor.orgId, actor.userId, actor.role].filter(Boolean).join("/"),
            fileName: file.name,
            kind: item.kind,
          });
          hooks?.onFileSuccess?.(file);
        } catch (error) {
          failureCount += 1;
          const message = error instanceof Error ? error.message : "上传失败";
          console.error("[teacher-materials] create:failed", {
            traceId: [actor.orgId, actor.userId, actor.role].filter(Boolean).join("/"),
            fileName: file.name,
            kind: item.kind,
            error,
          });
          hooks?.onFileError?.(file, toStageMessage("create", error));
        }
      }
      setItems((list) => [...createdRows, ...list]);
      if (failureCount === 0) {
        sonnerToast.success(
          files.length > 1 ? `已上传 ${createdRows.length} 个素材` : "素材已创建",
        );
      } else if (createdRows.length > 0) {
        sonnerToast.warning(`部分上传完成：成功 ${createdRows.length}，失败 ${failureCount}`);
      } else {
        sonnerToast.error(`上传失败：共 ${failureCount} 个文件失败`);
      }
      console.info("[teacher-materials] create:done", {
        traceId: [actor.orgId, actor.userId, actor.role].filter(Boolean).join("/"),
        successCount: createdRows.length,
        failureCount,
      });
      return { successCount: createdRows.length, failureCount };
    },
    [actor],
  );

  const confirmDelete = React.useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteTeacherMaterialApi(actor, deleteTarget.materialId, deleteTarget.rowSource);
      setItems((prev) => prev.filter((row) => row.materialId !== deleteTarget.materialId));
      sonnerToast.success("已删除素材", { description: deleteTarget.title });
      setDeleteTarget(null);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "删除失败");
    }
  }, [actor, deleteTarget]);

  const confirmEdit = React.useCallback(
    async (input: TeacherMaterialEditSubmitInput) => {
      if (!editTarget) return;
      const updated = await updateTeacherMaterialApi(
        actor,
        editTarget.materialId,
        {
          ...input,
          dataFileIdMr: editTarget.dataFileIdMr,
          dataFileIdMa: editTarget.dataFileIdMa,
          originalFilename: editTarget.originalFilename,
          logoUrlRaw: editTarget.logoUrlRaw ?? null,
        },
        editTarget.rowSource,
      );
      setItems((prev) => prev.map((row) => (row.materialId === updated.materialId ? updated : row)));
      if (!kindOptions.some((item) => item.id === updated.kind)) {
        setKindOptions((prev) => [...prev, { id: updated.kind, label: updated.kind }]);
      }
      setEditTarget(null);
      sonnerToast.success("素材属性已更新", { description: updated.title });
    },
    [actor, editTarget, kindOptions],
  );

  const createDialogInitialKind = React.useMemo((): TeacherMaterialKind | undefined => {
    return kindFilter === "all" ? undefined : (kindFilter as TeacherMaterialKind);
  }, [kindFilter]);

  const onVideoPosterPersisted = React.useCallback((fileId: string, displayHref: string) => {
    setItems((prev) =>
      prev.map((row) => {
        const fid =
          resolvedTeacherMaterialDataFileId(row) ??
          (row.rowSource === "data_file" ? row.materialId.trim() : "");
        if (!fid || fid !== fileId) return row;
        return { ...row, materialMainPicUrl: displayHref };
      }),
    );
  }, []);

  return {
    actor,
    hydrated,
    mode,
    setMode,
    createOpen,
    setCreateOpen,
    keyword,
    setKeyword,
    kindFilter,
    setKindFilter,
    filtered,
    createMaterial,
    createDialogInitialKind,
    kindOptions,
    experimentOptions,
    experimentOptionsLoading,
    editTarget,
    setEditTarget,
    confirmEdit,
    deleteTarget,
    setDeleteTarget,
    confirmDelete,
    onVideoPosterPersisted,
  };
}
