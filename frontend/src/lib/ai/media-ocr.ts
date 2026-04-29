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

type ApiErrorResponse = { error?: string };

export async function recognizeMediaCoverText(input: {
  imageUrl: string;
  context?: Record<string, unknown>;
}): Promise<MediaCoverOcrResult> {
  const res = await fetch("/api/ai/media-cover-ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = (await res.json().catch(() => ({}))) as MediaCoverOcrResult & ApiErrorResponse;

  if (!res.ok) {
    // 优先提取服务端返回的具体错误信息
    const serverMessage = body?.error;
    if (serverMessage) {
      throw new Error(serverMessage);
    }
    throw new Error(`OCR 识别请求失败（${res.status}），请稍后重试。`);
  }

  return body as MediaCoverOcrResult;
}
