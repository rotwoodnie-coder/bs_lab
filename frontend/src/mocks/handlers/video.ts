import { http, HttpResponse } from "msw";

const relatedVideos = [
  { id: "video_demo_1", title: "相关实验 1", duration: 360, coverUrl: "https://example.com/related-1.jpg" },
  { id: "video_demo_2", title: "相关实验 2", duration: 280, coverUrl: "https://example.com/related-2.jpg" },
];

const videoDb: Record<string, object> = {
  video_demo: {
    id: "video_demo",
    title: "安全实验：自制简易风向标",
    videoUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    coverUrl: "https://example.com/video-cover.jpg",
    duration: 420,
    steps: [
      { id: "step_1", title: "准备材料", duration: 60, safetyNote: "准备前先检查桌面是否整洁", startAt: 0 },
      { id: "step_2", title: "组装风向标", duration: 180, safetyNote: "剪刀使用需在家长陪同下进行", startAt: 60 },
      { id: "step_3", title: "测试与观察", duration: 180, safetyNote: "不得靠近旋转部件", startAt: 240 },
    ],
  },
  video_demo_1: {
    id: "video_demo_1",
    title: "相关实验 1",
    videoUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    coverUrl: "https://example.com/related-1.jpg",
    duration: 360,
    steps: [
      { id: "step_1", title: "观察现象", duration: 120, safetyNote: "保持安全距离", startAt: 0 },
      { id: "step_2", title: "记录数据", duration: 240, safetyNote: "使用工具时注意安全", startAt: 120 },
    ],
  },
};

export const videoHandlers = [
  http.get("/api/video/:id", ({ params }) => {
    const id = String(params.id ?? "video_demo");
    const data = id in videoDb ? videoDb[id] : videoDb.video_demo;
    return HttpResponse.json({ success: true, data, error: null });
  }),
  http.get("/api/video/list", ({ request }) => {
    const url = new URL(request.url);
    const relatedTo = url.searchParams.get("relatedTo");
    return HttpResponse.json({
      success: true,
      data: { items: relatedVideos.map((item) => ({ ...item, relatedTo })) },
      error: null,
    });
  }),
];
