/**
 * 应用根路径 `/`：路由组 `(dashboard)` 不参与 URL，本文件即站点首页（带 `(dashboard)/layout` 壳层）。
 *
 * 默认渲染视频广场。原 HomeDashboardPage 逻辑保留在 `@/components/business/home/home-dashboard-page`，
 * 可通过侧边栏「工作台」访问。
 */
"use client";

import { VideoSquareView } from "@/components/business/material/VideoSquareView";

export default function DashboardHomePage() {
  return <VideoSquareView />;
}
