export type MediaStatus = "IDLE" | "HASHING" | "UPLOADING" | "PROCESSING" | "READY" | "ERROR";
export type MediaErrorType = "FATAL" | "RETRYABLE" | "RESUMABLE";

export interface MediaTaskMeta {
  fileName: string;
  size: number;
  mimeType: string;
  ownerUserId: string;
  orgId: string;
}

export interface MediaTask {
  taskId: string;
  fileHash: string;
  uploadKey: string;
  registryId?: string;
  status: MediaStatus;
  progress: number;
  errorType?: MediaErrorType;
  errorCode?: string;
  errorMessage?: string;
  remoteUrl?: string;
  thumbnailUrl?: string;
  thumbnailState?: "idle" | "checking" | "scheduled" | "ready" | "failed";
  meta: MediaTaskMeta;
  updatedAt: number;
}
