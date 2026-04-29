"use client";

import * as React from "react";
import { resolveMediaDisplaySrc } from "@bs-lab/ui";

export type StorageImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
};

/**
 * 裸 `<img>` 的统一封装：展示前经 `setDefaultMediaDisplaySrcResolver`（在 `AppProviders` 中已注入为 `materialStorageBrowserHref`）。
 * 业务里非 `MediaPreview` 的图片优先用本组件，避免私有 MinIO 直链裂图。
 */
export const StorageImg = React.forwardRef<HTMLImageElement, StorageImgProps>(function StorageImg(
  { src, ...rest },
  ref,
) {
  if (src == null || String(src).trim() === "") return null;
  const href = resolveMediaDisplaySrc(String(src).trim());
  if (!href) return null;
  // eslint-disable-next-line @next/next/no-img-element -- 通用封装，由调用方决定是否换 Next/Image
  return <img ref={ref} src={href} {...rest} />;
});
