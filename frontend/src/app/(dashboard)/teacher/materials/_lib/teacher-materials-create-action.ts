import { sonnerToast } from "@bs-lab/ui";
import type { ApiActor } from "@/lib/new-core-api";
import { createMediaReference } from "@/lib/media-platform/media-api";
import { mediaUploadSuccessDescription } from "@/lib/media-platform/media-upload-destination-copy";
import { uploadTeacherMaterialFileToPlatform, type UploadToMediaPlatformResult } from "@/lib/media-platform/upload-client";
import { teacherMaterialFromDataFileRecord, type TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { reconcileTeacherMaterialKindFromFilename } from "@/lib/media/infer-media-kind-from-filename";
import { fetchV2FileById } from "@/lib/v2/v2-file-api";
import type { MediaUploadProgressEvent } from "@/lib/media-platform/upload-form-xhr";
import { inferKindFromFile } from "./teacher-material-file-kind";
import { finalizeTeacherVideoMaterialLogo } from "./teacher-video-material-logo-finalize";

function traceIdFromActor(actor: ApiActor): string {
  return [actor.orgId, actor.userId, actor.role].filter(Boolean).join("/");
}

type StructuredMaterialFlowError = {
  code: string;
  message: string;
  source: string;
  retryable: boolean;
  context: Record<string, unknown>;
  traceId: string;
};

function buildStructuredMaterialFlowError(
  code: string,
  message: string,
  source: string,
  retryable: boolean,
  context: Record<string, unknown>,
  traceId: string,
): StructuredMaterialFlowError {
  return { code, message, source, retryable, context, traceId };
}

function logMaterialFlowError(err: StructuredMaterialFlowError, originalError?: unknown): void {
  console.error(`[teacher-materials] ${err.source}`, {
    ...err,
    originalError,
  });
}

type ExecuteTeacherMaterialCreateOptions = {
  silent?: boolean;
  onProgress?: (event: MediaUploadProgressEvent) => void;
};

const CREATE_MATERIAL_TIMEOUT_MS = 30_000;
const CREATE_REFERENCE_TIMEOUT_MS = 15_000;
function stableUploadKey(file: File, item: Omit<TeacherMaterialItem, "materialId" | "updatedAt">): string {
  return [file.name, file.size, file.lastModified, item.kind, item.experimentId ?? "", item.title.trim()].join("|");
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function uploadAndReadTeacherMaterialRow(
  actor: ApiActor,
  effectiveItem: Omit<TeacherMaterialItem, "materialId" | "updatedAt">,
  file: File,
  options?: ExecuteTeacherMaterialCreateOptions,
): Promise<{ up: UploadToMediaPlatformResult; created: TeacherMaterialItem }> {
  const traceId = traceIdFromActor(actor);
  console.info("[teacher-materials] create:start", {
    traceId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    kind: effectiveItem.kind,
    experimentId: effectiveItem.experimentId ?? null,
  });

  let up: UploadToMediaPlatformResult;
  try {
    up = await uploadTeacherMaterialFileToPlatform(
      actor,
      file,
      {
        materialKind: effectiveItem.kind,
        title: effectiveItem.title,
      },
      {
        ui: options?.silent ? "silent" : "toast",
        toastOutcome: "loading-only",
        onProgress: options?.onProgress,
        uploadKey: stableUploadKey(file, effectiveItem),
      },
    );
    console.info("[teacher-materials] create:upload:ok", {
      traceId,
      assetId: up.assetId,
      registryId: up.registryId,
      storageMode: up.storageMode,
      reused: up.reused,
      fileUrl: up.fileUrl ?? null,
    });
  } catch (error) {
    const originalMsg = error instanceof Error ? error.message : String(error);
    const structured = buildStructuredMaterialFlowError(
      "UPLOAD_MATERIAL_FAILED",
      originalMsg,
      "teacher-materials:create:upload",
      true,
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        kind: effectiveItem.kind,
        experimentId: effectiveItem.experimentId ?? null,
      },
      traceId,
    );
    logMaterialFlowError(structured, error);
    throw structured;
  }

  try {
    const fileRow = await withTimeout(
      fetchV2FileById(actor, up.assetId),
      CREATE_MATERIAL_TIMEOUT_MS,
      "读取素材记录超时，请稍后重试",
    );
    console.info("[teacher-materials] create:fetch:ok", {
      traceId,
      fileId: fileRow.fileId,
      fileName: fileRow.fileName,
      logoUrl: fileRow.logoUrl,
      fileUrl: fileRow.fileUrl,
    });
    return { up, created: teacherMaterialFromDataFileRecord(fileRow) };
  } catch (error) {
    const fetchMsg = error instanceof Error ? error.message : String(error);
    const structured = buildStructuredMaterialFlowError(
      "READ_MATERIAL_ROW_FAILED",
      fetchMsg,
      "teacher-materials:create:fetch",
      true,
      {
        assetId: up.assetId,
        registryId: up.registryId,
      },
      traceId,
    );
    logMaterialFlowError(structured, error);
    throw structured;
  }
}

async function maybeRehydrateVideoAfterLogo(
  actor: ApiActor,
  effectiveKind: TeacherMaterialItem["kind"],
  file: File,
  up: UploadToMediaPlatformResult,
  created: TeacherMaterialItem,
): Promise<TeacherMaterialItem> {
  if (effectiveKind !== "video") return created;
  const traceId = traceIdFromActor(actor);
  console.info("[teacher-materials] create:thumbnail:start", {
    traceId,
    assetId: up.assetId,
    fileName: file.name,
  });
  try {
    await finalizeTeacherVideoMaterialLogo(actor, up.assetId, file);
  } catch (error) {
    const structured = buildStructuredMaterialFlowError(
      "VIDEO_THUMBNAIL_FINALIZE_FAILED",
      "视频封面生成失败",
      "teacher-materials:create:thumbnail",
      true,
      { assetId: up.assetId, fileName: file.name },
      traceId,
    );
    logMaterialFlowError(structured, error);
  }
  try {
    const refreshed = await withTimeout(
      fetchV2FileById(actor, up.assetId),
      CREATE_MATERIAL_TIMEOUT_MS,
      "刷新视频封面字段超时",
    );
    console.info("[teacher-materials] create:thumbnail:done", {
      traceId,
      assetId: up.assetId,
      logoUrl: refreshed.logoUrl,
    });
    return teacherMaterialFromDataFileRecord(refreshed);
  } catch (error) {
    const structured = buildStructuredMaterialFlowError(
      "REFRESH_THUMBNAIL_ROW_FAILED",
      "刷新视频封面字段失败",
      "teacher-materials:create:thumbnail:fetch",
      true,
      { assetId: up.assetId },
      traceId,
    );
    logMaterialFlowError(structured, error);
    return created;
  }
}

export async function executeTeacherMaterialCreate(
  actor: ApiActor,
  item: Omit<TeacherMaterialItem, "materialId" | "updatedAt">,
  file: File,
  options?: ExecuteTeacherMaterialCreateOptions,
): Promise<TeacherMaterialItem> {
  // 三重兜底：先用 inferKindFromFile（MIME+常见扩展名），再用 reconcile（扩展名 JSON 表强制校正）
  const inferred = inferKindFromFile(file);
  const reconciled = inferred ? inferred : reconcileTeacherMaterialKindFromFilename(item.kind, file.name);
  const effectiveKind = reconciled;
  const effectiveItem = { ...item, kind: effectiveKind };
  const { up, created: initialRow } = await uploadAndReadTeacherMaterialRow(actor, effectiveItem, file, options);
  let created = await maybeRehydrateVideoAfterLogo(actor, effectiveKind, file, up, initialRow);
  // 仅在选择了关联实验时才执行引用登记。
  // 未选择实验时不触发该流程，避免出现无关告警干扰用户。
  if (effectiveItem.experimentId?.trim() && up.registryId?.trim()) {
    const traceId = traceIdFromActor(actor);
    console.info("[teacher-materials] create:reference:start", {
      traceId,
      assetId: up.assetId,
      registryId: up.registryId,
    });
    try {
      await withTimeout(
        createMediaReference(actor, {
          targetKind: "REGISTRY",
          targetId: up.registryId.trim(),
          refType: "teacher_asset",
          refId: up.assetId,
          sortOrder: 0,
        }),
        CREATE_REFERENCE_TIMEOUT_MS,
        "引用登记超时，请稍后重试",
      );
      console.info("[teacher-materials] create:reference:done", {
        traceId,
        assetId: up.assetId,
        registryId: up.registryId,
      });
    } catch (error) {
      const structured = buildStructuredMaterialFlowError(
        "CREATE_REFERENCE_FAILED",
        "素材引用登记失败",
        "teacher-materials:create:reference",
        true,
        {
          assetId: up.assetId,
          registryId: up.registryId,
        },
        traceId,
      );
      logMaterialFlowError(structured, error);
      sonnerToast.warning("素材已创建，但引用登记失败", {
        description: "引用登记失败，请稍后重试",
      });
    }
  }
  if (!options?.silent) {
    sonnerToast.success("素材已创建", { description: mediaUploadSuccessDescription(up.storageMode, up.reused) });
  }
  return created;
}
