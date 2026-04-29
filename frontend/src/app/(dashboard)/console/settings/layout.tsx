import type { ReactNode } from "react";

/**
 * 配置管理（settings）域规范（与 docs/platform/baseline-and-console-config-inventory.md 第 8 节一致）：
 *
 * - 上传材料 / 业务图片：须先写入 data_file（及对象存储），取得 file_id 后，再在 material_pic 等子表引用；
 *   禁止将临时 URL 作为主关联写入业务表。
 * - 前端上传组件应对齐返回 file_id；业务表单提交传 file_id，由后端校验与落库。
 * - 本目录页面禁止直连 axios 调未评审接口；请使用 lib/v2/* 或既有 core-api 封装。
 */
export default function ConsoleSettingsLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1">{children}</div>;
}
