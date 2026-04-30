import type { ApiActor } from "@/lib/new-core-api";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { pickBestPosterJpegBlobFromVideoFile } from "@/components/business/video/video-local-poster-samples";
import {
  fetchV2FileById,
  postV2FileThumbnailEnsure,
  postV2FilePosterUpload,
} from "@/lib/v2/v2-file-api";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";

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

function hasRenderableCover(coverFileId: string | null | undefined): boolean {
  const t = (coverFileId ?? "").trim();
  return t.length > 0;
}

async function waitForCoverUrl(actor: CoreApiActor, fileId: string): Promise<string | null> {
  const deadline = Date.now() + POLL_BUDGET_MS;
  while (Date.now() < deadline) {
    try {
      const row = await fetchV2FileById(actor, fileId);
      const coverId = row.coverFileId?.trim();
      if (coverId && hasRenderableCover(coverId)) return mediaRegistryStreamUrl(coverId, "view", actor);
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
 * 使用 V2 poster 上传，不经过 V1 媒体中台，避免封面被当作独立素材存储。
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
  const ok = await waitForCoverUrl(core, videoFileId);
  if (ok) return;
  const jpeg = await pickBestPosterJpegBlobFromVideoFile(source);
  if (!jpeg || jpeg.size < 32) return;
  try {
    const result = await postV2FilePosterUpload(core, videoFileId, jpeg);
    console.info("[teacher-materials] create:thumbnail:done", {
      traceId: traceIdFromActor(actor),
      videoFileId,
      coverFileId: result.coverFileId,
      coverFileUrl: result.coverFileUrl,
    });
  } catch (error) {
    logVideoPosterError("teacher-materials:create:thumbnail:poster", actor, videoFileId, error, {
      stage: "postV2FilePosterUpload",
    });
  }
}
