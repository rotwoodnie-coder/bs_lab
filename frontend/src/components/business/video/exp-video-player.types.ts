import type { ApiActor } from "@/lib/new-core-api";

export type RasterPosterCaptureMode = "eager" | "visible" | "never";

export type PlayerVisualStatus = "poster" | "preview" | "active";

/** Canvas 截帧成功后回传 `data_file.logo_url`（需后端已登记 `fileId`） */
export type PosterPersistConfig = {
  fileId: string;
  actor: ApiActor;
  onPersisted?: (fileId: string, displayHref: string) => void;
};

export type StandardVideoExpPlayerProps = {
  src: string;
  poster?: string | null;
  /** 宽/高，默认 16:9 */
  ratio?: number;
  className?: string;
  /** 无障碍名称 */
  title?: string;
  /**
   * 无后端 poster 时，从网络视频流客户端抽帧的时机（需 CORS；可能产生 ranged media 请求）。
   * - eager：挂载即抽
   * - visible：进入视口后再抽（素材库列表首屏更接近「仅图片」）
   * - never：不抽帧
   */
  rasterPosterCapture?: RasterPosterCaptureMode;
  /** 无后端 poster 且客户端截帧成功时，将 JPEG/PNG 上传并写库 */
  posterPersist?: PosterPersistConfig | null;
  /**
   * 正片起点（秒）。用于跳过片头黑场/色条等；需上游用 FFmpeg（如 `blackdetect`）或人工标注后写入元数据再下发。
   * 当前播放器不做客户端像素级黑场检测：302 到 MinIO 时 `<video>` 跨域，canvas 读帧会污染画布且无法稳定判黑。
   */
  contentStartSeconds?: number | null;
  /** 可选：点击播放时替代 inline 播放（例如打开弹窗）。设置后播放按钮和预览点击不触发 goActive */
  onPlayRequest?: () => void;
};
