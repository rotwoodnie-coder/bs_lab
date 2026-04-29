import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const rawUrl = String(body?.imageUrl ?? "").trim();

  if (!rawUrl) {
    return NextResponse.json(
      { error: "imageUrl 为空，请先上传或选择视频后再执行识别。" },
      { status: 400 },
    );
  }

  // 将相对 URL 补全为绝对 URL（服务端 fetch 无法解析 "/api/..." 这类路径）
  let absoluteUrl = rawUrl;
  if (rawUrl.startsWith("/")) {
    try {
      absoluteUrl = new URL(rawUrl, new URL(req.url).origin).href;
    } catch {
      const fallbackOrigin = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4200").replace(/\/+$/, "");
      absoluteUrl = new URL(rawUrl, fallbackOrigin).href;
    }
  }

  // 尝试访问封面图片，验证链接是否有效
  try {
    const probe = await fetch(absoluteUrl, { method: "HEAD", signal: AbortSignal.timeout(10_000) });
    if (!probe.ok) {
      return NextResponse.json(
        { error: `无法访问视频封面图片（${probe.status}），请检查视频文件是否有效。` },
        { status: 422 },
      );
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : "未知网络错误";
    return NextResponse.json(
      { error: `视频封面图片请求失败：${reason}。请确认网络连接或尝试重新上传。` },
      { status: 422 },
    );
  }

  // 封面图片校验通过，但 OCR 识别服务尚未接入
  // TODO: 替换为真实 OCR / 多模态模型服务（预期返回 MediaCoverOcrResult）
  return NextResponse.json(
    {
      error: "OCR 文字识别服务未就绪，暂无法从视频封面提取文字信息。",
    },
    { status: 503 },
  );
}
