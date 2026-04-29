"use client";

import * as React from "react";
import type { ApiActor } from "@/lib/new-core-api";
import { reconcileBinaryMediaKindFromFilename } from "@/lib/media/infer-media-kind-from-filename";
import type { MediaKind } from "@/lib/media-platform/types";

import { useMediaStore } from "./use-media-store";
import type { MediaTask } from "./types";

export type MediaUploadState = "idle" | "hashing" | "uploading" | "processing" | "ready" | "error";

export type MediaUploadOptions = {
  onProgress?: (event: { percent: number }) => void;
  /** 透传到 /api/media/upload：image / video */
  mediaKind?: "image" | "video";
  /** 可选：素材类别（data_file_type.type_id） */
  fileTypeId?: string;
};

function createUploadKey(file: File, actor: ApiActor) {
  return [actor.orgId, actor.userId, file.name, file.size, file.lastModified, file.type].join("|");
}

function setTaskStatus(setStatus: (fileHash: string, status: MediaTask["status"]) => void, fileHash: string, status: MediaTask["status"]) {
  setStatus(fileHash, status);
}

async function quickHash(file: File): Promise<string> {
  const head = await file.slice(0, Math.min(file.size, 1024 * 1024)).arrayBuffer();
  const tailStart = Math.max(0, file.size - 1024 * 1024);
  const tail = await file.slice(tailStart).arrayBuffer();
  const meta = new TextEncoder().encode(`${file.name}|${file.size}|${file.type}`);
  const bytes = new Uint8Array(head.byteLength + tail.byteLength + meta.byteLength);
  bytes.set(new Uint8Array(head), 0);
  bytes.set(new Uint8Array(tail), head.byteLength);
  bytes.set(meta, head.byteLength + tail.byteLength);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((n) => n.toString(16).padStart(2, "0")).join("");
}

export function useMediaUpload(actor: ApiActor) {
  const registerTask = useMediaStore((s) => s.registerTask);
  const updateTask = useMediaStore((s) => s.updateTask);
  const setStatus = useMediaStore((s) => s.setStatus);
  const removeTask = useMediaStore((s) => s.removeTask);

  const upload = React.useCallback(
    async (file: File, options?: MediaUploadOptions) => {
      const uploadKey = createUploadKey(file, actor);
      const fileHash = await quickHash(file);
      setTaskStatus(setStatus, fileHash, "HASHING");
      const taskId = `${fileHash}:${uploadKey}`;
      const task: MediaTask = {
        taskId,
        fileHash,
        uploadKey,
        status: "HASHING",
        progress: 0,
        meta: {
          fileName: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          ownerUserId: actor.userId,
          orgId: actor.orgId,
        },
        updatedAt: Date.now(),
      };
      registerTask(task);
      try {
        updateTask(fileHash, { status: "UPLOADING", progress: 0 });
        options?.onProgress?.({ percent: 0 });
        const fd = new FormData();
        fd.append("file", file, file.name);
        fd.append("title", file.name);
        fd.append("role", String(actor.role));
        fd.append("userId", actor.userId);
        fd.append("userName", actor.userName);
        if (actor.orgId) fd.append("orgId", actor.orgId);
        if (options?.mediaKind) {
          fd.append(
            "mediaKind",
            reconcileBinaryMediaKindFromFilename(options.mediaKind as MediaKind, file.name),
          );
        }
        if (options?.fileTypeId) fd.append("fileTypeId", options.fileTypeId);
        const res = await fetch("/api/media/upload", { method: "POST", body: fd });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          data?: { registryId?: string; assetId?: string; viewUrl?: string; fileUrl?: string };
        };
        if (!res.ok || !json.ok || !json.data?.registryId || !json.data?.viewUrl) {
          throw new Error(json.error ?? "上传失败");
        }
        options?.onProgress?.({ percent: 100 });
        const result = { objectKey: json.data.viewUrl, fileId: json.data.registryId, fileUrl: json.data.fileUrl ?? json.data.viewUrl };
        updateTask(fileHash, {
          status: "PROCESSING",
          progress: 100,
          remoteUrl: result.objectKey,
        });
        return { fileHash, uploadKey, result };
      } catch (error) {
        updateTask(fileHash, {
          status: "ERROR",
          errorType: "RESUMABLE",
          errorCode: "ERR_UPLOAD_FAILED",
          errorMessage: error instanceof Error ? error.message : "上传失败",
        });
        throw error;
      } finally {
        setTimeout(() => removeTask(fileHash), 1500);
      }
    },
    [actor, registerTask, removeTask, setStatus, updateTask],
  );

  return { upload };
}
