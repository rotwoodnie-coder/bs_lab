/**
 * 与后端 `backend/src/domain/v2-file/v2-file-extension-groups.json` 内容保持一致（修改时请同步两份 JSON）。
 */
import type { TeacherMaterialKind } from "@/lib/teacher-materials-api";

import groups from "./v2-file-extension-groups.json";

type ExtGroups = Record<string, readonly string[]>;

const G = groups as ExtGroups;

function buildExtensionToKind(): ReadonlyMap<string, TeacherMaterialKind> {
  const m = new Map<string, TeacherMaterialKind>();
  for (const [kind, exts] of Object.entries(G)) {
    for (const e of exts) {
      m.set(e.toLowerCase(), kind as TeacherMaterialKind);
    }
  }
  return m;
}

const EXTENSION_TO_KIND = buildExtensionToKind();

/** 由扩展名（不含点）推断教师素材 kind；未知返回 null */
export function inferTeacherMaterialKindFromExtension(extRaw: string): TeacherMaterialKind | null {
  const x = extRaw.toLowerCase().replace(/^\./, "").trim();
  if (!x) return null;
  return EXTENSION_TO_KIND.get(x) ?? null;
}

/** 流预览 / 播放器侧「视频」白名单 */
export const VIDEO_FILE_EXTENSIONS = new Set(G.video.map((e) => e.toLowerCase()));

/** 流预览 / 播放器侧「图片」白名单 */
export const IMAGE_FILE_EXTENSIONS = new Set(G.image.map((e) => e.toLowerCase()));
