"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  sonnerToast,
} from "@bs-lab/ui";
import { UploadCloud } from "@bs-lab/ui/icons";
import type { TeacherMaterialItem, TeacherMaterialKind } from "@/lib/teacher-materials-api";

import {
  TEACHER_MATERIALS_DEFAULT_CREATE_KIND,
  TEACHER_MATERIALS_KIND_FORM_OPTIONS,
} from "../_lib/teacher-materials-ui.config";
import { fileStableKey, inferKindFromFile, inferUniformKind } from "../_lib/teacher-material-file-kind";
import { TeacherMaterialsCreateFilePicker } from "./teacher-materials-create-file-picker";
import { TeacherMaterialCreateMetaPanel } from "./TeacherMaterialCreateMetaPanel";

import {
  clearUploadSnapshot,
  readUploadSnapshot,
  writeUploadSnapshot,
  type RecoveredUploadEntry,
  type UploadState,
} from "../_lib/teacher-material-create-dialog-snapshot";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    item: Omit<TeacherMaterialItem, "materialId" | "updatedAt">,
    files: File[],
    hooks?: {
      onFileStart?: (file: File) => void;
      onFileProgress?: (file: File, percent: number) => void;
      onFileSuccess?: (file: File) => void;
      onFileError?: (file: File, message: string) => void;
    },
  ) => Promise<{ successCount: number; failureCount: number }>;
  initialKind?: TeacherMaterialKind;
  kindOptions?: { id: string; label: string }[];
  experimentOptions?: { value: string; label: string }[];
  experimentOptionsLoading?: boolean;
};

export function TeacherMaterialCreateDialog(props: Props) {
  const MAX_FILES_PER_BATCH = 200;
  const UPLOAD_SNAPSHOT_KEY = "bs-lab:teacher-materials:create-upload-snapshot:v2";
  const fileKey = React.useCallback((file: File) => fileStableKey(file), []);
  const kindFormOptions = React.useMemo(() => {
    const raw = props.kindOptions?.filter((item) => item.id !== "all") ?? [];
    if (raw.length === 0) return TEACHER_MATERIALS_KIND_FORM_OPTIONS;
    return raw.map((item) => ({ value: item.id as TeacherMaterialKind, label: item.label }));
  }, [props.kindOptions]);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = React.useState("");
  const [kind, setKind] = React.useState<TeacherMaterialKind>(TEACHER_MATERIALS_DEFAULT_CREATE_KIND);
  const [experimentId, setExperimentId] = React.useState<string | null>(null);
  const [linkedExperimentTitle, setLinkedExperimentTitle] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [recoveredEntries, setRecoveredEntries] = React.useState<RecoveredUploadEntry[]>([]);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [uploadStates, setUploadStates] = React.useState<Record<string, UploadState>>({});

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  React.useEffect(() => {
    if (selectedFiles.length !== 1) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      return;
    }
    const file = selectedFiles[0]!;
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    } else {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    }
  }, [selectedFiles]);

  const wasOpenRef = React.useRef(false);
  React.useEffect(() => {
    const justOpened = props.open && !wasOpenRef.current;
    wasOpenRef.current = props.open;
    if (!justOpened) return;

    const snapshot = readUploadSnapshot(UPLOAD_SNAPSHOT_KEY);
    if (snapshot && snapshot.entries.length > 0) {
      const normalizedEntries = snapshot.entries.map((entry) => ({
        ...entry,
        state:
          entry.state.status === "uploading"
            ? {
                status: "failed" as const,
                progress: entry.state.progress || 0,
                message: entry.state.message || "上传已中断，请重新选择文件后重试",
              }
            : entry.state,
      }));
      const hasLostFiles = normalizedEntries.some((entry) => entry.state.status === "failed" && entry.size <= 0);
      const lostFileKeys = new Set(normalizedEntries.filter((entry) => entry.state.status === "failed" && entry.size <= 0).map((entry) => entry.key));
      const actionableRecoveredEntries = normalizedEntries.filter((entry) => !lostFileKeys.has(entry.key));
      setTitle(snapshot.title);
      setKind(snapshot.kind);
      setExperimentId(snapshot.experimentId ?? null);
      setLinkedExperimentTitle(snapshot.linkedExperimentTitle ?? null);
      setDragging(false);
      setSelectedFiles([]);
      setRecoveredEntries(actionableRecoveredEntries);
      setSubmitting(false);
      setUploadStates(Object.fromEntries(actionableRecoveredEntries.map((entry) => [entry.key, entry.state])));
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      sonnerToast.message("已恢复上次上传记录", {
        description: hasLostFiles
          ? `检测到 ${normalizedEntries.length} 条队列记录，其中部分文件已丢失，请重新上传。`
          : `检测到 ${normalizedEntries.length} 条队列记录，可逐条移除，或重新选择失败文件继续上传`,
      });
      if (hasLostFiles) {
        setSelectedFiles([]);
        setUploadStates({});
      }
      return;
    }

    setTitle("");
    setKind(props.initialKind ?? kindFormOptions[0]?.value ?? TEACHER_MATERIALS_DEFAULT_CREATE_KIND);
    setExperimentId(null);
    setLinkedExperimentTitle(null);
    setDragging(false);
    setSelectedFiles([]);
    setRecoveredEntries([]);
    setSubmitting(false);
    setUploadStates({});
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  }, [UPLOAD_SNAPSHOT_KEY, kindFormOptions, props.open, props.initialKind]);

  const onPickFiles = React.useCallback((files: File[]) => {
    if (files.length === 0) return;
    setSelectedFiles((prev) => {
      const existing = new Set(prev.map(fileKey));
      const seenInBatch = new Set<string>();
      const duplicatesInBatch: string[] = [];
      const duplicatesAcrossRounds: string[] = [];
      const added: File[] = [];
      for (const file of files) {
        const key = fileKey(file);
        if (seenInBatch.has(key)) {
          duplicatesInBatch.push(file.name);
          continue;
        }
        seenInBatch.add(key);
        if (existing.has(key)) {
          duplicatesAcrossRounds.push(file.name);
          continue;
        }
        added.push(file);
      }
      const ignored = duplicatesInBatch.length + duplicatesAcrossRounds.length;
      if (ignored > 0) {
        sonnerToast.warning("检测到重复文件，已自动忽略", {
          description: `忽略 ${ignored} 个重复文件（含跨轮次重复）`,
        });
      }
      if (added.length === 0) return prev;

      const available = Math.max(0, MAX_FILES_PER_BATCH - prev.length);
      const accepted = available > 0 ? added.slice(0, available) : [];
      const overflow = added.length - accepted.length;
      if (overflow > 0) {
        sonnerToast.warning("本次选择文件过多", {
          description: `最多保留 ${MAX_FILES_PER_BATCH} 个文件，已忽略 ${overflow} 个`,
        });
      }
      if (accepted.length === 0) return prev;

      setUploadStates((state) => ({
        ...state,
        ...Object.fromEntries(accepted.map((file) => [fileKey(file), { status: "pending" as const, progress: 0 }])),
      }));
      if (prev.length === 0 && accepted.length === 1) {
        setTitle("");
      }
      const detectedKind = inferUniformKind(accepted);
      if (detectedKind && detectedKind !== kind) {
        setKind(detectedKind);
        const kindLabel =
          kindFormOptions.find((item) => item.value === detectedKind)?.label ?? detectedKind;
        sonnerToast.message("已自动匹配素材类型", { description: `根据文件自动切换为「${kindLabel}」` });
      }
      return [...prev, ...accepted];
    });
  }, [MAX_FILES_PER_BATCH, fileKey, kind, kindFormOptions]);

  const removeRecoveredEntry = React.useCallback((key: string) => {
    setRecoveredEntries((prev) => prev.filter((e) => e.key !== key));
    setSelectedFiles((prev) => prev.filter((file) => fileKey(file) !== key));
    setUploadStates((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [fileKey]);

  const removeAt = React.useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const target = prev[index];
      const next = prev.filter((_, i) => i !== index);
      if (target) {
        const key = fileKey(target);
        setUploadStates((states) => {
          const copy = { ...states };
          delete copy[key];
          return copy;
        });
        setRecoveredEntries((entries) => entries.filter((entry) => entry.key !== key));
      }
      return next;
    });
  }, [fileKey]);

  const failedFiles = React.useMemo(
    () => selectedFiles.filter((file) => uploadStates[fileKey(file)]?.status === "failed"),
    [fileKey, selectedFiles, uploadStates],
  );
  const hasUnrecognizedFiles = React.useMemo(
    () => selectedFiles.some((file) => inferKindFromFile(file) == null),
    [selectedFiles],
  );
  const recoverFailedCount = React.useMemo(
    () => recoveredEntries.filter((e) => e.state.status === "failed").length,
    [recoveredEntries],
  );
  const totalFailedCount = failedFiles.length + recoverFailedCount;
  const hasOrphanedFailed = recoverFailedCount > 0 && failedFiles.length === 0;

  React.useEffect(() => {
    if (!props.open) return;
    const selectedKeys = new Set(selectedFiles.map((file) => fileKey(file)));
    const mergedRecovered = recoveredEntries.filter((entry) => !selectedKeys.has(entry.key));
    const selectedEntries: RecoveredUploadEntry[] = selectedFiles.map((file) => ({
      key: fileKey(file),
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      state: uploadStates[fileKey(file)] ?? { status: "pending", progress: 0 },
    }));
    const entries = [...selectedEntries, ...mergedRecovered];
    if (entries.length === 0) {
      clearUploadSnapshot(UPLOAD_SNAPSHOT_KEY);
      return;
    }
    writeUploadSnapshot(UPLOAD_SNAPSHOT_KEY, {
      version: 2,
      title,
      kind,
      experimentId,
      linkedExperimentTitle,
      entries,
      updatedAt: Date.now(),
    });
  }, [UPLOAD_SNAPSHOT_KEY, experimentId, fileKey, kind, linkedExperimentTitle, props.open, recoveredEntries, selectedFiles, title, uploadStates]);

  const clearAllFailed = React.useCallback(() => {
    const failedKeys = new Set<string>();
    for (const f of selectedFiles) {
      if (uploadStates[fileKey(f)]?.status === "failed") failedKeys.add(fileKey(f));
    }
    for (const e of recoveredEntries) {
      if (e.state.status === "failed") failedKeys.add(e.key);
    }
    setSelectedFiles((prev) => prev.filter((f) => !failedKeys.has(fileKey(f))));
    setRecoveredEntries((prev) => prev.filter((e) => !failedKeys.has(e.key)));
    setUploadStates((prev) => {
      const n = { ...prev };
      for (const k of failedKeys) delete n[k];
      return n;
    });
    sonnerToast.success("已清除所有失败项");
  }, [fileKey, selectedFiles, uploadStates, recoveredEntries]);

  const submit = React.useCallback(async (targetFiles?: File[]) => {
    const filesToUpload = targetFiles ?? selectedFiles;
    if (filesToUpload.length === 0) {
      const recoveredFailed = recoveredEntries.filter((entry) => entry.state.status === "failed");
      if (recoveredFailed.length > 0) {
        sonnerToast.error("文件已丢失，请重新上传");
      } else {
        sonnerToast.error("请先选择要上传的文件");
      }
      return;
    }
    setSubmitting(true);
    try {
      const payload: Omit<TeacherMaterialItem, "materialId" | "updatedAt"> = {
        title: title.trim(),
        kind,
        experimentId,
        linkedExperimentTitle,
        dataFileIdMr: null,
        dataFileIdMa: null,
        originalFilename: null,
        materialStatus: "y",
        materialMainPicUrl: null,
        expPurpose: null,
        additionalComments: null,
        materialNum: null,
      };
      const result = await props.onCreate(payload, filesToUpload, {
        onFileStart: (file) => {
          const key = fileKey(file);
          setUploadStates((prev) => ({ ...prev, [key]: { status: "uploading", progress: 0 } }));
        },
        onFileProgress: (file, percent) => {
          const key = fileKey(file);
          setUploadStates((prev) => ({ ...prev, [key]: { status: "uploading", progress: percent } }));
        },
        onFileSuccess: (file) => {
          const key = fileKey(file);
          setUploadStates((prev) => ({ ...prev, [key]: { status: "success", progress: 100 } }));
        },
        onFileError: (file, message) => {
          const key = fileKey(file);
          setUploadStates((prev) => ({ ...prev, [key]: { status: "failed", progress: 100, message } }));
          setRecoveredEntries((prev) => prev.map((entry) => (entry.key === key ? { ...entry, message } : entry)));
        },
      });
      // 全成功 → 关闭弹窗
      if (result.failureCount === 0 && filesToUpload.length === selectedFiles.length) {
        clearUploadSnapshot(UPLOAD_SNAPSHOT_KEY);
        setRecoveredEntries([]);
        props.onOpenChange(false);
      } else if (result.successCount > 0 && result.failureCount > 0) {
        // 部分成功 → 保留失败项在列表中，弹窗保持打开
        setSelectedFiles((prev) => prev.filter((f) => {
          const k = fileKey(f);
          const s = uploadStates[k]?.status;
          return s === "failed" || s === "pending" || s === undefined;
        }));
      }
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "创建素材失败");
    } finally {
      setSubmitting(false);
    }
  }, [experimentId, fileKey, kind, linkedExperimentTitle, props, selectedFiles, title, uploadStates]);

  const handleRetryFailures = React.useCallback(() => {
    if (failedFiles.length > 0) return void submit(failedFiles);
    // 仅有恢复队列中的失败项（File 已丢失），引导用户重新选择
    const names = recoveredEntries.filter((e) => e.state.status === "failed");
    if (names.length === 0) return;
    sonnerToast.warning("请重新选择以下失败文件", {
      description: names.slice(0, 15).map((e) => e.name).join("、") + (names.length > 15 ? ` 等${names.length}个` : ""),
      duration: 8000,
    });
    const keys = new Set(names.map((e) => e.key));
    setRecoveredEntries((prev) => prev.filter((e) => !keys.has(e.key)));
    setUploadStates((prev) => {
      const n = { ...prev };
      for (const k of keys) delete n[k];
      return n;
    });
    setTimeout(() => inputRef.current?.click(), 100);
  }, [failedFiles, recoveredEntries, submit, inputRef]);

  const previewTitle = title.trim() || selectedFiles[0]?.name || "素材预览";

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] border-border p-0 lg:w-[960px] lg:max-w-[960px]">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="size-5 text-primary" />
            新建课件素材
          </DialogTitle>
          <DialogDescription>
            左侧上传并预览，右侧填写素材信息。文件写入 V2 文件库；支持一次选择多个同类型文件。
            上传失败不自动关闭，失败项可一键清除或重新选择原文件重试。
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <TeacherMaterialsCreateFilePicker
            kind={kind}
            kindOptions={kindFormOptions}
            selectedFiles={selectedFiles}
            onPickFiles={onPickFiles}
            onRemoveAt={removeAt}
            previewUrl={previewUrl}
            previewTitle={previewTitle}
            dragging={dragging}
            onDraggingChange={setDragging}
            inputRef={inputRef}
            getFileKey={fileKey}
            uploadStates={uploadStates}
            recoveredEntries={recoveredEntries}
            onRemoveRecovered={removeRecoveredEntry}
          />

          <TeacherMaterialCreateMetaPanel
            title={title}
            onTitleChange={setTitle}
            kind={kind}
            kindOptions={kindFormOptions}
            kindDisabled={selectedFiles.length > 0}
            onKindChange={(value) => {
              setKind(value);
              setSelectedFiles([]);
              setRecoveredEntries([]);
              setUploadStates({});
            }}
            selectedFilesCount={selectedFiles.length}
            experimentId={experimentId}
            linkedExperimentTitle={linkedExperimentTitle}
            experimentOptions={props.experimentOptions}
            experimentOptionsLoading={props.experimentOptionsLoading}
            submitting={submitting}
            onExperimentChange={(next) => {
              setExperimentId(next.experimentId);
              setLinkedExperimentTitle(next.linkedExperimentTitle);
            }}
          />
        </div>

        <DialogFooter className="border-t border-border px-6 py-3">
          {hasUnrecognizedFiles ? (
            <div className="mr-auto text-xs text-destructive">
              检测到未识别文件类型，请先移除异常文件后再提交。
            </div>
          ) : totalFailedCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mr-auto text-destructive hover:text-destructive"
              onClick={clearAllFailed}
            >
              清除失败项（{totalFailedCount}）
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={handleRetryFailures}
            disabled={submitting || totalFailedCount === 0 || hasUnrecognizedFiles}
          >
            {hasOrphanedFailed ? "补选失败文件" : `重试失败项（${totalFailedCount}）`}
          </Button>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={submitting || hasUnrecognizedFiles}>
            {submitting ? "创建中…" : selectedFiles.length > 1 ? `上传 ${selectedFiles.length} 个素材` : "创建素材"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
