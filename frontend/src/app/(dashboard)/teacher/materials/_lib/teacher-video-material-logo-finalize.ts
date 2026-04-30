import type { ApiActor } from "@/lib/new-core-api";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { uploadMediaFileToPlatform } from "@/lib/media-platform/upload-client";
import { pickBestPosterJpegBlobFromVideoFile } from "@/components/business/video/video-local-poster-samples";
import {
  fetchV2FileById,
  patchV2FileRecord,
  postV2FileThumbnailEnsure,
} from "@/lib/v2/v2-file-api";

function traceIdFromActor(actor: ApiActor): string {
  return [actor.orgId, actor.userId, actor.role].filter(Boolean).join("/");
}

function logVideoPosterError(
  stage: string,
  actor: ApiActor,
  videoFileId: string,
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  const traceId = traceIdFromActor(actor);
  console.error(`[teacher-materials] ${stage}`, {
    traceId,
    videoFileId,
    ...context,
    error,
  });
}

const POLL_INTERVAL_MS = 450;
const POLL_BUDGET_MS = 22_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function hasRenderableLogo(raw: string | null | undefined): boolean {
  const t = (raw ?? "").trim();
  if (!t) return false;
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}

async function waitForLogoUrl(actor: CoreApiActor, fileId: string): Promise<string | null> {
  const deadline = Date.now() + POLL_BUDGET_MS;
  while (Date.now() < deadline) {
    try {
      const row = await fetchV2FileById(actor, fileId);
      if (hasRenderableLogo(row.logoUrl)) return row.logoUrl!.trim();
    } catch (error) {
      logVideoPosterError("teacher-materials:create:thumbnail:poll", actor as ApiActor, fileId, error, {
        stage: "fetchV2FileById",
      });
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return null;
}

/**
 * 视频素材上传后：等待服务端 FFmpeg 封面落库；超时则本地抽帧上传 JPEG 并 PATCH `logo_url`。
 * 不抛错，避免「文件已上传但创建流程失败」。
 */
export async function finalizeTeacherVideoMaterialLogo(actor: ApiActor, videoFileId: string, source: File): Promise<void> {
  const core = actor as CoreApiActor;
  try {
    await postV2FileThumbnailEnsure(core, videoFileId, {});
  } catch (error) {
    logVideoPosterError("teacher-materials:create:thumbnail:start", actor, videoFileId, error, {
      stage: "postV2FileThumbnailEnsure",
    });
  }
  const ok = await waitForLogoUrl(core, videoFileId);
  if (ok) return;
  const jpeg = await pickBestPosterJpegBlobFromVideoFile(source);
  if (!jpeg || jpeg.size < 32) return;
  const posterFile = new File([jpeg], "video-poster.jpg", { type: "image/jpeg" });
  let fileUrl: string | undefined;
  try {
    const up = await uploadMediaFileToPlatform(actor, posterFile, { kind: "image", title: "视频封面" }, { ui: "silent" });
    fileUrl = up.fileUrl?.trim() || undefined;
    console.info("[teacher-materials] create:thumbnail:upload:ok", {
      traceId: traceIdFromActor(actor),
      videoFileId,
      fileUrl,
    });
  } catch (error) {
    logVideoPosterError("teacher-materials:create:thumbnail:upload", actor, videoFileId, error, {
      stage: "uploadMediaFileToPlatform",
    });
    return;
  }
  if (!fileUrl) return;
  try {
    await patchV2FileRecord(core, videoFileId, { logoUrl: fileUrl });
    console.info("[teacher-materials] create:thumbnail:done", {
      traceId: traceIdFromActor(actor),
      videoFileId,
      fileUrl,
    });
  } catch (error) {
    logVideoPosterError("teacher-materials:create:thumbnail:patch", actor, videoFileId, error, {
      stage: "patchV2FileRecord",
      fileUrl,
    });
  }
}
