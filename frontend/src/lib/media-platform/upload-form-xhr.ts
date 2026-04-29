"use client";

import type { MediaStorageMode } from "./media-upload-destination-copy";

export type MediaUploadXhrPayload = {
  ok: boolean;
  data?: {
    registryId: string;
    assetId: string;
    viewUrl: string;
    reviewStatus: string;
    reused: boolean;
    storageMode?: MediaStorageMode;
    /** V2 `data_file.file_url`，写入材料 `main_pic_url` */
    fileUrl?: string | null;
    registration?: "v1" | "v2";
  };
  error?: string;
};

export type MediaUploadProgressEvent = {
  loaded: number;
  total: number;
  percent: number;
};

const MEDIA_UPLOAD_XHR_TIMEOUT_MS = 120_000;

export function postMediaUploadForm(
  form: FormData,
  options?: { onProgress?: (e: MediaUploadProgressEvent) => void },
): Promise<MediaUploadXhrPayload> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media/upload");
    xhr.responseType = "json";
    xhr.timeout = MEDIA_UPLOAD_XHR_TIMEOUT_MS;
    xhr.upload.onprogress = (ev) => {
      if (!options?.onProgress || !ev.lengthComputable || ev.total <= 0) return;
      const percent = (ev.loaded / ev.total) * 100;
      options.onProgress({ loaded: ev.loaded, total: ev.total, percent });
    };
    xhr.onload = () => {
      let body: MediaUploadXhrPayload;
      try {
        if (typeof xhr.response === "object" && xhr.response !== null) {
          body = xhr.response as MediaUploadXhrPayload;
        } else {
          body = JSON.parse(xhr.responseText) as MediaUploadXhrPayload;
        }
      } catch {
        reject(new Error("服务返回了无效数据"));
        return;
      }
      resolve(body);
    };
    xhr.onerror = () => reject(new Error("网络异常"));
    xhr.ontimeout = () => reject(new Error("上传请求超时，请稍后重试"));
    xhr.send(form);
  });
}
