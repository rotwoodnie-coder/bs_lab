"use client";

import * as React from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  Kbd,
  KbdGroup,
  MediaEmptyFrame,
  Spinner,
  StatusPulse,
  VideoPreviewCard,
} from "./lab-ui";
import type { ShowcaseDef, ShowcasePreset } from "../lab-types";
import { LAB_SHOWCASE_PROPS } from "../living-docs";
import {
  BADGE_LABELS,
  BADGE_VARIANTS,
  BUTTON_VARIANT_LABELS,
  BUTTON_VARIANTS,
} from "./lab-constants";
import { MEDIA_PREVIEW_SHOWCASE } from "./showcases-media-preview";

export const SHOWCASES_PART_A = {
  Button: {
    label: "Button",
    propsDoc: LAB_SHOWCASE_PROPS.Button,
    rowClassName: "flex flex-wrap items-center gap-2",
    presets: [
      ...BUTTON_VARIANTS.map((variant) => ({
        key: `variant-${variant}`,
        render: () => (
          <Button type="button" variant={variant}>
            {BUTTON_VARIANT_LABELS[variant]}
          </Button>
        ),
      })),
      {
        key: "size-sm",
        render: () => (
          <Button type="button" size="sm">
            Small
          </Button>
        ),
      },
      {
        key: "size-lg",
        render: () => (
          <Button type="button" size="lg">
            Large
          </Button>
        ),
      },
      {
        key: "size-icon",
        render: () => (
          <Button type="button" size="icon" aria-label="icon">
            +
          </Button>
        ),
      },
      {
        key: "disabled",
        render: () => (
          <Button type="button" disabled>
            Disabled
          </Button>
        ),
      },
    ],
  },

  ButtonGroup: {
    label: "ButtonGroup",
    propsDoc: LAB_SHOWCASE_PROPS.ButtonGroup,
    rowClassName: "space-y-3",
    presets: [
      {
        key: "segmented",
        render: () => (
          <ButtonGroup>
            <Button type="button" variant="outline" size="sm">
              左
            </Button>
            <Button type="button" variant="outline" size="sm">
              中
            </Button>
            <ButtonGroupSeparator orientation="vertical" className="hidden sm:block" />
            <Button type="button" variant="outline" size="sm">
              右
            </Button>
          </ButtonGroup>
        ),
      },
      {
        key: "with-text",
        render: () => (
          <ButtonGroup>
            <ButtonGroupText>对齐</ButtonGroupText>
            <Button type="button" size="sm" variant="outline">
              保存
            </Button>
          </ButtonGroup>
        ),
      },
    ],
  },

  Kbd: {
    label: "Kbd / KbdGroup",
    propsDoc: LAB_SHOWCASE_PROPS.Kbd,
    rowClassName: "flex flex-wrap items-center gap-3 text-sm",
    presets: [
      {
        key: "combo",
        render: () => (
          <div className="inline-flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <span className="text-muted-foreground">+</span>
            <Kbd>K</Kbd>
          </div>
        ),
      },
      {
        key: "group",
        render: () => (
          <KbdGroup className="gap-1 text-muted-foreground">
            <span>⌘</span>
            <span>⇧</span>
            <span className="text-foreground">P</span>
          </KbdGroup>
        ),
      },
      {
        key: "esc",
        render: () => <Kbd>Esc</Kbd>,
      },
    ],
  },

  Badge: {
    label: "Badge",
    propsDoc: LAB_SHOWCASE_PROPS.Badge,
    rowClassName: "flex flex-wrap gap-2",
    presets: BADGE_VARIANTS.map((variant) => ({
      key: variant,
      render: () => <Badge variant={variant}>{BADGE_LABELS[variant]}</Badge>,
    })),
  },

  Spinner: {
    label: "Spinner",
    propsDoc: LAB_SHOWCASE_PROPS.Spinner,
    rowClassName: "flex items-center gap-3 text-sm text-muted-foreground",
    presets: [
      {
        key: "default",
        render: () => (
          <>
            <Spinner className="size-5" />
            <span>加载中</span>
          </>
        ),
      },
    ],
  },

  StatusPulse: {
    label: "StatusPulse",
    propsDoc: LAB_SHOWCASE_PROPS.StatusPulse,
    rowClassName: "flex flex-wrap items-center gap-6",
    presets: [
      ...(
        [
          { variant: "success" as const, caption: "success" },
          { variant: "warning" as const, caption: "warning" },
          { variant: "error" as const, caption: "error" },
        ] as const
      ).map(({ variant, caption }) => ({
        key: variant,
        render: () => (
          <div className="flex items-center gap-2">
            <StatusPulse variant={variant} />
            <span className="text-xs text-muted-foreground">{caption}</span>
          </div>
        ),
      })),
      {
        key: "large",
        render: () => (
          <div className="flex items-center gap-2">
            <StatusPulse variant="success" sizePx={14} />
            <span className="text-xs text-muted-foreground">sizePx=14</span>
          </div>
        ),
      },
    ] satisfies readonly ShowcasePreset[],
  },

  MediaEmptyFrame: {
    label: "MediaEmptyFrame",
    propsDoc: LAB_SHOWCASE_PROPS.MediaEmptyFrame,
    rowClassName: "grid max-w-md gap-4 sm:grid-cols-2",
    presets: [
      {
        key: "video",
        render: () => <MediaEmptyFrame kind="video" hint="暂无视频" />,
      },
      {
        key: "image",
        render: () => <MediaEmptyFrame kind="image" hint="暂无图片" />,
      },
    ] satisfies readonly ShowcasePreset[],
  },

  MediaPreview: MEDIA_PREVIEW_SHOWCASE,

  VideoPreviewCard: {
    label: "VideoPreviewCard",
    propsDoc: LAB_SHOWCASE_PROPS.VideoPreviewCard,
    rowClassName: "space-y-4 max-w-xl",
    presets: [
      {
        key: "with-src",
        render: () => (
          <VideoPreviewCard
            title="示例官方视频"
            caption="与实验目录详情中的预览卡片一致"
            streamSrc="https://www.w3schools.com/html/mov_bbb.mp4"
          />
        ),
      },
      {
        key: "empty",
        render: () => <VideoPreviewCard title={null} streamSrc={null} />,
      },
      {
        key: "unreachable",
        render: () => <VideoPreviewCard title="历史登记" streamSrc={null} unreachable />,
      },
    ] satisfies readonly ShowcasePreset[],
  },
} satisfies Record<string, ShowcaseDef>;
