"use client";

import * as React from "react";

import { Button } from "@bs-lab/ui";

import { getOcrCache, setOcrCache, removeOcrCache } from "@/lib/ai/ocr-cache";
import { recognizeMediaCoverText } from "@/lib/ai/media-ocr";
import type { MediaCoverOcrResult } from "@/lib/ai/media-ocr";
import type { V2DictGradeItem } from "@/lib/v2/v2-exp-api";

export type EditorOcrSectionHandle = {
  /** 外部触发 OCR（视频上传 / 从媒体库选择后调用） */
  triggerOcr: (imageUrl: string) => void;
};

type Props = {
  previewVideoSrc: string;
  fieldDisabled: boolean;
  gradeDictOptions?: V2DictGradeItem[];
  expId: string | null;
  userId: string;
  onExpNameOcr: (title: string) => void;
  onGradeOcr: (gradeId: string, schoolLevelId: string) => void;
};

export const EditorOcrSection = React.forwardRef<EditorOcrSectionHandle, Props>(
  function EditorOcrSection(props, ref) {
    const { previewVideoSrc, fieldDisabled, gradeDictOptions, expId, userId, onExpNameOcr, onGradeOcr } = props;

    const [ocrLoading, setOcrLoading] = React.useState(false);
    const [ocrSuggestion, setOcrSuggestion] = React.useState<MediaCoverOcrResult | null>(null);
    const [ocrError, setOcrError] = React.useState<string | null>(null);
    const [flashExpName, setFlashExpName] = React.useState(false);
    const [flashGrade, setFlashGrade] = React.useState(false);

    const applyOcrResult = React.useCallback(
      (result: MediaCoverOcrResult) => {
        setOcrSuggestion(result);
        setOcrError(null);
        if (result?.title) {
          onExpNameOcr(result.title);
          setFlashExpName(true);
          window.setTimeout(() => setFlashExpName(false), 1200);
        }
        const gradeText = String(result?.grade ?? "").trim();
        if (gradeText && gradeDictOptions?.length) {
          const matched = gradeDictOptions.find(
            (g) => g.name.includes(gradeText) || gradeText.includes(g.name),
          );
          if (matched) {
            onGradeOcr(matched.id, matched.levelId?.trim() ? matched.levelId.trim() : null!);
            setFlashGrade(true);
            window.setTimeout(() => setFlashGrade(false), 1200);
          }
        }
      },
      [gradeDictOptions, onExpNameOcr, onGradeOcr],
    );

    // 预检查缩略图是否是有效图片
    const validateCoverImage = React.useCallback(async (imageUrl: string): Promise<boolean> => {
      // 先尝试 HEAD 请求检测 Content-Type
      try {
        const probe = await fetch(imageUrl, { method: "HEAD", signal: AbortSignal.timeout(8000) });
        const ct = (probe.headers.get("content-type") ?? "").toLowerCase();
        if (ct && !ct.startsWith("image/")) {
          return false;
        }
      } catch {
        // HEAD 失败（如 CORS 限制），回退到 Image 加载检测
      }

      // 通过 Image 对象实际加载验证
      return new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = imageUrl;
      });
    }, []);

    const runOcr = React.useCallback(
      async (imageUrl: string) => {
        if (!imageUrl) return;

        setOcrError(null);
        setOcrSuggestion(null);

        // 优先读取缓存
        const cached = getOcrCache(imageUrl);
        if (cached) {
          applyOcrResult(cached);
          return;
        }

        // 执行 OCR 前先检查封面图是否有效
        const isValid = await validateCoverImage(imageUrl);
        if (!isValid) {
          setOcrError("无封面图，无法进行 OCR 识别");
          return;
        }

        setOcrLoading(true);
        try {
          const result = await recognizeMediaCoverText({
            imageUrl,
            context: { expId, userId },
          });
          // 写缓存
          setOcrCache(imageUrl, result);
          applyOcrResult(result);
        } catch (err) {
          setOcrSuggestion(null);
          setOcrError(err instanceof Error ? err.message : "图片文字识别失败，请检查视频封面或稍后重试。");
        } finally {
          setOcrLoading(false);
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [expId, userId, applyOcrResult, validateCoverImage],
    );

    React.useImperativeHandle(
      ref,
      () => ({
        triggerOcr: (imageUrl: string) => {
          // 重新选择视频时清除旧缓存，强制重新识别
          if (imageUrl && ocrSuggestion) {
            removeOcrCache(imageUrl);
          }
          runOcr(imageUrl);
        },
      }),
      [ocrSuggestion, runOcr],
    );

    // 缓存命中或首次加载时自动对当前视频执行 OCR
    const initialRunRef = React.useRef<string | null>(null);
    React.useEffect(() => {
      if (!previewVideoSrc) return;
      if (initialRunRef.current === previewVideoSrc) return;
      initialRunRef.current = previewVideoSrc;
      runOcr(previewVideoSrc);
    }, [previewVideoSrc, runOcr]);

    if (ocrLoading) {
      return (
        <div className="flex items-center gap-2 text-xs leading-5 text-muted-foreground">
          <span className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          正在识别视频文字…
        </div>
      );
    }

    return (
      <div>
        {ocrError ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs leading-5 text-destructive">{ocrError}</span>
              {previewVideoSrc && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-auto gap-1 px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                  disabled={ocrLoading}
                  onClick={() => runOcr(previewVideoSrc)}
                >
                  重新识别
                </Button>
              )}
            </div>
          </div>
        ) : ocrSuggestion ? (
          <div className="space-y-1 text-xs leading-5 text-foreground">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-0.5">
                {ocrSuggestion.title ? <p>实验名称：{ocrSuggestion.title}</p> : null}
                {ocrSuggestion.subject ? <p>学科：{ocrSuggestion.subject}</p> : null}
                {ocrSuggestion.grade ? <p>年级：{ocrSuggestion.grade}</p> : null}
                {ocrSuggestion.school ? <p>学校：{ocrSuggestion.school}</p> : null}
                {ocrSuggestion.speaker ? <p>主讲人：{ocrSuggestion.speaker}</p> : null}
                {ocrSuggestion.series ? <p>系列：{ocrSuggestion.series}</p> : null}
              </div>
              {previewVideoSrc && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-auto shrink-0 gap-1 px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                  disabled={ocrLoading}
                  onClick={() => runOcr(previewVideoSrc)}
                >
                  识别视频文字
                </Button>
              )}
            </div>
            {ocrSuggestion.rawText ? (
              <details className="group">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  查看原始识别文本
                </summary>
                <p className="mt-1 whitespace-pre-wrap rounded border border-border bg-muted/20 p-2 text-muted-foreground">
                  {ocrSuggestion.rawText}
                </p>
              </details>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs leading-5 text-muted-foreground">选择视频后，系统会从封面提取文字。</span>
            {previewVideoSrc && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-auto gap-1 px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                disabled={ocrLoading}
                onClick={() => runOcr(previewVideoSrc)}
              >
                识别视频文字
              </Button>
            )}
          </div>
        )}
      </div>
    );
  },
);
