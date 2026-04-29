import { sonnerToast } from "@bs-lab/ui";
import type { ApiActor } from "@/lib/new-core-api";
import { createMediaReference } from "@/lib/media-platform/media-api";
import { mediaUploadSuccessDescription } from "@/lib/media-platform/media-upload-destination-copy";
import { uploadTeacherMaterialFileToPlatform, type UploadToMediaPlatformResult } from "@/lib/media-platform/upload-client";
import { teacherMaterialFromDataFileRecord, type TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { fetchV2FileById } from "@/lib/v2/v2-file-api";
import type { MediaUploadProgressEvent } from "@/lib/media-platform/upload-form-xhr";
import { inferKindFromFile } from "./teacher-material-file-kind";
import { finalizeTeacherVideoMaterialLogo } from "./teacher-video-material-logo-finalize";

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
  } catch (error) {
    throw new Error(
      `[上传并登记媒体] ${error instanceof Error ? error.message : "上传失败"}`,
    );
  }
  try {
    const fileRow = await withTimeout(
      fetchV2FileById(actor, up.assetId),
      CREATE_MATERIAL_TIMEOUT_MS,
      "读取素材记录超时，请稍后重试",
    );
    return { up, created: teacherMaterialFromDataFileRecord(fileRow) };
  } catch (error) {
    throw new Error(
      `[读取 data_file] ${error instanceof Error ? error.message : "读取素材失败"}`,
    );
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
  await finalizeTeacherVideoMaterialLogo(actor, up.assetId, file);
  try {
    const refreshed = await withTimeout(
      fetchV2FileById(actor, up.assetId),
      CREATE_MATERIAL_TIMEOUT_MS,
      "刷新视频封面字段超时",
    );
    return teacherMaterialFromDataFileRecord(refreshed);
  } catch {
    return created;
  }
}

export async function executeTeacherMaterialCreate(
  actor: ApiActor,
  item: Omit<TeacherMaterialItem, "materialId" | "updatedAt">,
  file: File,
  options?: ExecuteTeacherMaterialCreateOptions,
): Promise<TeacherMaterialItem> {
  // 支持混合上传：按每个文件自身类型自动匹配素材类型，无法识别时回退为当前表单类型。
  const effectiveKind = inferKindFromFile(file) ?? item.kind;
  const effectiveItem = { ...item, kind: effectiveKind };
  const { up, created: initialRow } = await uploadAndReadTeacherMaterialRow(actor, effectiveItem, file, options);
  let created = await maybeRehydrateVideoAfterLogo(actor, effectiveKind, file, up, initialRow);
  // 仅在选择了关联实验时才执行引用登记。
  // 未选择实验时不触发该流程，避免出现无关告警干扰用户。
  if (effectiveItem.experimentId?.trim() && up.registryId?.trim()) {
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
    } catch (error) {
      sonnerToast.warning("素材已创建，但引用登记失败", {
        description: error instanceof Error ? error.message : "引用登记失败",
      });
    }
  }
  if (!options?.silent) {
    sonnerToast.success("素材已创建", { description: mediaUploadSuccessDescription(up.storageMode, up.reused) });
  }
  return created;
}
