/**
 * 应用根路径 `/`：路由组 `(dashboard)` 不参与 URL，本文件即站点首页（带 `(dashboard)/layout` 壳层）。
 * 请勿同时添加 `src/app/page.tsx` 的 default export，否则会与 Next.js 根路由冲突。
 */
import { HomeDashboardPage } from "@/components/business/home/home-dashboard-page";

export default function DashboardHomePage() {
  return <HomeDashboardPage />;
}
