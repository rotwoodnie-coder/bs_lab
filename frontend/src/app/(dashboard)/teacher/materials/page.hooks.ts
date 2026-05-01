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
import { postV2FileThumbnailEnsure } from "@/lib/v2/v2-file-api";

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
  const message = extractErrorMessageFromAny(error, "未知错误");
  return `[${stage}] ${message}`;
}

/** 从 Error 实例或 POJO（含 message 字段）中提取错误文案 */
function extractErrorMessageFromAny(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  if (typeof error === "string") return error;
  return fallback;
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
  const [posterUploadTarget, setPosterUploadTarget] = React.useState<TeacherMaterialItem | null>(null);
  const [newExternalCount, setNewExternalCount] = React.useState(0);
  const [isTopOfPage, setIsTopOfPage] = React.useState(true);
  const lastCheckRef = React.useRef<string>("");
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

  // 轮询检测新素材：每 60 秒检查是否有新条目
  React.useEffect(() => {
    if (!hydrated) return;
    const poll = setInterval(() => {
      void listTeacherMaterialsApi(actor, { keyword: keyword.trim() || undefined })
        .then((rows) => {
          if (rows.length === 0) return;
          const latestId = rows[0]!.materialId;
          if (!lastCheckRef.current) {
            lastCheckRef.current = latestId;
            return;
          }
          if (lastCheckRef.current !== latestId) {
            setNewExternalCount((c) => c + 1);
            lastCheckRef.current = latestId;
          }
        })
        .catch(() => {
          /* 轮询静默失败 */
        });
    }, 60_000);
    return () => clearInterval(poll);
  }, [actor, hydrated]);

  // 监听滚动位置，判断是否在页面顶部
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setIsTopOfPage(scrollTop < 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          console.error("[teacher-materials] create:failed", {
            traceId: [actor.orgId, actor.userId, actor.role].filter(Boolean).join("/"),
            fileName: file.name,
            kind: item.kind,
            ...(typeof error === "object" && error !== null ? (error as Record<string, unknown>) : { originalError: error }),
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
      const result = await deleteTeacherMaterialApi(actor, deleteTarget.materialId, deleteTarget.rowSource);
      setItems((prev) => prev.filter((row) => row.materialId !== deleteTarget.materialId));
      const childCount = result.childrenCleaned;
      if (childCount !== undefined && childCount > 0) {
        sonnerToast.success("已删除素材", {
          description: `已级联清理 ${childCount} 个附属资源`,
        });
      } else {
        sonnerToast.success("已删除素材", { description: deleteTarget.title });
      }
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

  /** 触发服务端从对象存储补跑封面（调用 /v2/file/:id/thumbnail/ensure） */
  const repairThumbnail = React.useCallback(
    async (item: TeacherMaterialItem) => {
      const fileId =
        resolvedTeacherMaterialDataFileId(item) ??
        (item.rowSource === "data_file" ? item.materialId.trim() : "");
      if (!fileId) {
        sonnerToast.error("无法确定文件 ID，无法生成封面");
        return;
      }
      try {
        await postV2FileThumbnailEnsure(actor, fileId, { force: false });
        sonnerToast.success("已触发封面生成", {
          description: "封面生成后自动显示，请稍后刷新查看。",
        });
      } catch (error) {
        sonnerToast.error(error instanceof Error ? error.message : "触发封面生成失败");
      }
    },
    [actor],
  );

  const clearNewExternalCount = React.useCallback(() => {
    setNewExternalCount(0);
    // 刷新列表以获取最新数据
    if (hydrated) {
      void listTeacherMaterialsApi(actor, {
        keyword: keyword.trim() || undefined,
        materialTypeCode: kindFilter,
      })
        .then((rows) => setItems(rows))
        .catch(() => {});
    }
  }, [actor, hydrated, keyword, kindFilter]);

  /** 批量删除素材 */
  const batchDelete = React.useCallback(
    async (ids: string[]) => {
      let successCount = 0;
      let failCount = 0;
      for (const id of ids) {
        try {
          await deleteTeacherMaterialApi(actor, id);
          successCount += 1;
        } catch {
          failCount += 1;
        }
      }
      if (successCount > 0) {
        setItems((prev) => prev.filter((row) => !ids.includes(row.materialId)));
      }
      const total = ids.length;
      if (failCount === 0) {
        sonnerToast.success(`已删除 ${successCount} 个素材`);
      } else if (successCount > 0) {
        sonnerToast.warning(`部分删除完成：成功 ${successCount}，失败 ${failCount}`);
      } else {
        sonnerToast.error(`删除失败：共 ${failCount} 个`);
      }
    },
    [actor],
  );

  /** 批量修改分类 */
  const batchUpdateCategory = React.useCallback(
    async (ids: string[], category: string) => {
      let successCount = 0;
      let failCount = 0;
      for (const id of ids) {
        try {
          await updateTeacherMaterialApi(actor, id, {
            title: items.find((i) => i.materialId === id)?.title ?? "",
            kind: category as TeacherMaterialItem["kind"],
            experimentId: null,
            linkedExperimentTitle: null,
            dataFileIdMr: null,
            dataFileIdMa: null,
            originalFilename: null,
            materialStatus: null,
            materialMainPicUrl: null,
            expPurpose: null,
            additionalComments: null,
            materialNum: null,
          });
          successCount += 1;
        } catch {
          failCount += 1;
        }
      }
      if (successCount > 0) {
        setItems((prev) =>
          prev.map((row) =>
            ids.includes(row.materialId) ? { ...row, kind: category as TeacherMaterialItem["kind"] } : row,
          ),
        );
      }
      if (failCount === 0) {
        sonnerToast.success(`已为 ${successCount} 个素材修改分类`);
      } else {
        sonnerToast.warning(`部分修改完成：成功 ${successCount}，失败 ${failCount}`);
      }
    },
    [actor, items],
  );

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
    repairThumbnail,
    posterUploadTarget,
    setPosterUploadTarget,
    newExternalCount,
    isTopOfPage,
    clearNewExternalCount,
    batchDelete,
    batchUpdateCategory,
  };
}
