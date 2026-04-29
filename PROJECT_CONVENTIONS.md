# 项目约定（Project Conventions）

## 服务端请求本地资源的 URL 补全

所有服务端（Next.js API Route / Node.js fetch）在请求**本地资源**时，如果 URL 为相对路径（以 `/` 开头），必须使用绝对 URL 补全逻辑：

```typescript
let absoluteUrl = rawUrl;
if (rawUrl.startsWith("/")) {
  try {
    absoluteUrl = new URL(rawUrl, new URL(req.url).origin).href;
  } catch {
    const fallbackOrigin = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4200").replace(/\/+$/, "");
    absoluteUrl = new URL(rawUrl, fallbackOrigin).href;
  }
}
```

原因：Node.js 环境下的 `fetch()` 无法解析 `"/api/xxx"` 这类相对路径。

## 多媒体展示优先使用封面缩略图

- 所有多媒体场景（视频封面预览、OCR 识别、列表缩略图）**必须优先使用 `variant=thumb_sm`**。
- 禁止直接对视频流地址（`/api/media/registry-stream?registryId=xxx&action=view`）进行图像识别或作为封面渲染。
- 封面缩略图 URL 通过 `mediaRegistryStreamUrl(id, "view", actor, { variant: "thumb_sm" })` 构造。

## 首页视频广场组件复用

- 首页视频广场**强制复用** `TeacherMaterialWaterfall` 组件。
- 禁止在首页视频广场复制粘贴同构列表 UI 再单独维护。

## 实验编辑器 Tab 布局规则

- 所有 Tab（基础信息、实验材料、实验步骤、实验结果、安全提示、教学与参考）**强制不能自动收缩**。
- 必须遵从基础信息 Tab 的布局规则：内容区域自动撑满浏览器空余区域，使用 `flex-1` 和 `min-h-0` 确保高度自适应。
- 布局容器使用 `flex h-dvh flex-col overflow-hidden` 全屏骨架。

## 正式产品文案规范

- 所有 UI 文案默认使用简体中文，语气直接、清晰、以用户为中心。
- 禁止使用课堂、示例、阶段、用于、给别人、当前身份、展示技术、实验性/数据/示例数据 等降低正式感的表达。
- 技术限制说明须短、明确、放在不抢占主体信息的位置。

## 角色与会话治理

- 修改 `sys_user_role` 后必须同步调用 `auth-service` 作废该用户会话。
