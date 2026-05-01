"use client";

import Tesseract from "tesseract.js";

export type MediaCoverOcrResult = {
  title?: string;
  subject?: string;
  grade?: string;
  school?: string;
  speaker?: string;
  series?: string;
  confidence?: number;
  rawText?: string;
};

/**
 * OCR 区域定义：固定位置映射到固定字段。
 * rect 为 [left%, top%, width%, height%]（占图像宽高的百分比）。
 */
export type OcrZone = {
  /** 映射到的字段名 */
  field: keyof MediaCoverOcrResult;
  /** 区域矩形 [left%, top%, width%, height%] */
  rect: [number, number, number, number];
  label: string;
};

/**
 * 默认 OCR 模板。
 * 适用于教育类视频封面常见的布局：
 * - 顶部居中：实验名称
 * - 中部：年级/学科
 * - 下部：学校 / 主讲人 / 系列
 */
const DEFAULT_OCR_TEMPLATE: OcrZone[] = [
  { field: "title",    rect: [5, 0, 90, 22],  label: "实验名称" },
  { field: "grade",    rect: [5, 22, 50, 20], label: "年级/学科" },
  { field: "school",   rect: [5, 45, 60, 15], label: "学校" },
  { field: "speaker",  rect: [5, 62, 45, 12], label: "主讲人" },
  { field: "series",   rect: [5, 76, 50, 12], label: "系列" },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`无法加载图片: ${src}`));
    img.src = src;
  });
}

function cleanText(text: string): string {
  return text
    .replace(/[\n\r]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * 在浏览器端使用 Tesseract.js 直接识别视频封面，然后按位置模板映射字段。
 *
 * @param imageUrl - 封面图片 URL（需支持跨域）
 * @param template - 可选的自定义区域模板，默认使用 DEFAULT_OCR_TEMPLATE
 */
export async function recognizeMediaCoverTextFromImage(
  imageUrl: string,
  template?: OcrZone[],
): Promise<MediaCoverOcrResult> {
  const zones = template ?? DEFAULT_OCR_TEMPLATE;

  // 1. 加载图片获取实际尺寸
  const img = await loadImage(imageUrl);
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  if (!width || !height) {
    throw new Error("无法获取图片尺寸");
  }

  // 2. 运行 Tesseract OCR
  const worker = await Tesseract.createWorker("chi_sim+eng", 1, {
    logger: () => { /* 静默 */ },
  });

  const { data } = await worker.recognize(imageUrl);
  await worker.terminate();

  // 3. 从 blocks → paragraphs → lines 展平所有行，按位置归类到区域
  const zoneMap = new Map<string, string[]>();
  for (const zone of zones) {
    zoneMap.set(zone.field, []);
  }

  const allLines: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }> = [];
  if (data.blocks) {
    for (const block of data.blocks) {
      if (block.paragraphs) {
        for (const para of block.paragraphs) {
          if (para.lines) {
            for (const line of para.lines) {
              if (line.text?.trim()) {
                allLines.push(line);
              }
            }
          }
        }
      }
    }
  }

  for (const line of allLines) {
    const text = cleanText(line.text);
    if (!text) continue;

    const cx = (((line.bbox.x0 + line.bbox.x1) / 2) / width) * 100;
    const cy = (((line.bbox.y0 + line.bbox.y1) / 2) / height) * 100;

    for (const zone of zones) {
      const [zx, zy, zw, zh] = zone.rect;
      if (cx >= zx && cx <= zx + zw && cy >= zy && cy <= zy + zh) {
        const arr = zoneMap.get(zone.field);
        if (arr) arr.push(text);
        break;
      }
    }
  }

  // 4. 组装结果
  const result: MediaCoverOcrResult = {
    rawText: data.text,
  };

  for (const [field, texts] of zoneMap.entries()) {
    const joined = texts
      .filter((t) => t.length > 1)        // 过滤单字符噪声
      .filter((t) => !/^[0-9]+%?$/.test(t)) // 过滤纯数字/进度
      .join(" ")
      .trim();
    if (joined) {
      (result as Record<string, unknown>)[field] = joined;
    }
  }

  return result;
}

/**
 * 旧版 API 调用方式保留给外部兼容，实际走客户端 Tesseract。
 */
export async function recognizeMediaCoverText(input: {
  imageUrl: string;
  context?: Record<string, unknown>;
}): Promise<MediaCoverOcrResult> {
  return recognizeMediaCoverTextFromImage(input.imageUrl);
}
