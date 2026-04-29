"use client";

import * as React from "react";
import { MediaPreview } from "./lab-ui";
import type { ShowcaseDef, ShowcasePreset } from "../lab-types";
import { LAB_SHOWCASE_PROPS } from "../living-docs";

/** 从 part-a 拆出，避免单文件超过 300 行 */
export const MEDIA_PREVIEW_SHOWCASE = {
  label: "MediaPreview",
  propsDoc: LAB_SHOWCASE_PROPS.MediaPreview,
  rowClassName: "flex flex-wrap items-start gap-6",
  presets: [
    {
      key: "image-ok",
      render: () => (
        <div className="size-28 overflow-hidden rounded-md border border-border">
          <MediaPreview
            kind="image"
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80"
            className="size-28"
            alt="示例"
          />
        </div>
      ),
    },
    {
      key: "image-on-error",
      render: () => {
        function Demo() {
          const [hint, setHint] = React.useState("故意坏地址");
          return (
            <div className="max-w-xs space-y-2 text-xs text-muted-foreground">
              <MediaPreview
                kind="image"
                src="https://invalid.invalid/broken.png"
                className="size-20 rounded border border-border"
                alt=""
                onImageError={() => setHint("已触发 onImageError")}
              />
              <p>{hint}</p>
            </div>
          );
        }
        return <Demo />;
      },
    },
    {
      key: "image-cover-override",
      render: () => (
        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          <span>缩略图铺满（className 含 object-cover）</span>
          <div className="size-28 overflow-hidden rounded-md border border-border">
            <MediaPreview
              kind="image"
              src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80"
              className="size-full object-cover"
              alt="铺满裁切"
            />
          </div>
        </div>
      ),
    },
    {
      key: "video-controls",
      render: () => (
        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          <span>视频默认带控件，object-contain</span>
          <div className="aspect-video w-56 overflow-hidden rounded-md border border-border">
            <MediaPreview
              kind="video"
              variant="default"
              src="https://www.w3schools.com/html/mov_bbb.mp4"
              className="size-full"
              alt="示例视频"
              videoProps={{ playsInline: true, preload: "metadata" }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "video-hover-play",
      render: () => (
        <div className="flex max-w-xs flex-col gap-1 text-[11px] text-muted-foreground">
          <span>显式 variant=hover-play（视频未传 variant 时与此相同）：桌面悬停静音预览；移动端仅 poster</span>
          <div className="aspect-video w-56 overflow-hidden rounded-md border border-border">
            <MediaPreview
              kind="video"
              variant="hover-play"
              src="https://www.w3schools.com/html/mov_bbb.mp4"
              posterSrc="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80"
              className="size-full object-cover"
              alt="悬停预览示意"
              previewMaxSeconds={5}
              inViewThreshold={0.1}
            />
          </div>
        </div>
      ),
    },
    {
      key: "video-defer-mount",
      render: () => (
        <div className="flex max-w-xs flex-col gap-1 text-[11px] text-muted-foreground">
          <span>variant=default + deferVideoMount：滚动进入视口后才挂载带控件 video（长列表省内存）</span>
          <div className="aspect-video w-56 overflow-hidden rounded-md border border-border">
            <MediaPreview
              kind="video"
              variant="default"
              deferVideoMount
              src="https://www.w3schools.com/html/mov_bbb.mp4"
              className="size-full"
              alt="延后挂载示意"
              videoProps={{ playsInline: true, preload: "metadata" }}
            />
          </div>
        </div>
      ),
    },
  ] satisfies readonly ShowcasePreset[],
} satisfies ShowcaseDef;
