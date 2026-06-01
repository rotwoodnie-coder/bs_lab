# 虚拟实验管理功能 · 详细设计文档

- 版本：V2.0（架构精简 + 前端自动缩略图）
- 状态：待执行
- 最后更新：2026-05-31
- 维护人：架构组

---

## 目录

1. [项目概述](#1-项目概述)
2. [设计目标](#2-设计目标)
3. [总体架构设计](#3-总体架构设计)
4. [代码结构全量清单](#4-代码结构全量清单)
5. [数据库设计](#5-数据库设计)
6. [接口职责清单](#6-接口职责清单)
7. [前端页面与交互设计](#7-前端页面与交互设计)
8. [核心业务流程](#8-核心业务流程)
9. [关键规则与约束](#9-关键规则与约束)
10. [错误码](#10-错误码)
11. [附录](#11-附录)

---

## 0. 变更记录

| 版本 | 日期 | 变更说明 |
|---|---|---|
| V1.0 | 2026-05-31 | 初稿 |
| V1.1 | 2026-05-31 | 采纳审计建议：CSP、sandbox 常量提取、权限隔离、S3 孤儿清理 |
| V1.2 | 2026-05-31 | 补充缩略图方案：og:image 自动提取 + 手动上传封面 |
| V1.3 | 2026-05-31 | 引入审核工作流与调用统计 |
| V2.0 | 2026-05-31 | **架构精简 + 前端自动缩略图**：删除所有详细参数/请求体/DDL 类型定义；接口改为职责清单；引入前端 html2canvas 截图方案替代后端 og:image 依赖；调用统计使用直接 SQL UPDATE（移除 Redis）；保留审核状态机与 iframe 安全策略核心设计。封面存储方案：复用 data_file 体系，通过 `is_hidden_from_gallery=1, biz_type=virtual_exp_cover` 标记与媒体素材库隔离 |

---

## 1. 项目概述

### 1.1 背景

宝山实验平台当前已具备完整的实验业务数据模型，并支持教师创建常规实验教学任务。但在实际教学场景中，存在以下诉求：

- **第三方仿真实验对接**：教师希望将 PhET、Labster 等在线仿真实验站嵌入平台；
- **自制互动实验页面**：教师能够上传自制的 HTML 互动实验页面（如 Scratch 作品导出、H5 互动页）；
- **统一管理入口**：所有虚拟实验资源需要统一的列表、搜索、分类管理入口。

### 1.2 术语定义

| 术语 | 说明 |
|---|---|
| **虚拟实验** | 非实物操作的、在浏览器中通过仿真/互动页面完成的实验 |
| **URL 内嵌** | 输入外部 URL，通过 `<iframe>` 嵌入平台展示 |
| **HTML 文件上传** | 上传 HTML 文件到 MinIO 存储，通过预签名 URL 用 iframe 渲染 |

### 1.3 适用范围

- 适用角色：教师、教研员、学校管理员、区级管理员、超级管理员
- 适用库：`bs_exp_data`
- 前端路由：`/virtual-experiment/*`

---

## 2. 设计目标

### 2.1 功能目标

1. 支持两种虚拟实验来源：URL 内嵌 和 HTML 文件上传
2. 提供完整的 CRUD 管理能力（列表、新增、编辑、删除、排序）
3. 提供安全的 iframe 播放页面
4. 支持实验名称、来源类型、状态筛选
5. **审核工作流**：支持用户提交审核 → 管理员/教研员审核通过/拒绝的完整状态流转，含状态机保护
6. **调用统计**：通过 `call_count` 字段，每次调用时直接 SQL UPDATE
7. **信息冗余**：在虚拟实验记录中冗余 `create_user_name`，避免列表查询时联表
8. **前端自动缩略图**：使用 html2canvas 在播放页加载后自动截图，上传至 S3 存储 S3 Key；截图失败支持用户手动上传封面。封面统一走 `/v2/file/upload`，通过 `is_hidden_from_gallery=1, biz_type=virtual_exp_cover` 标记与媒体素材库隔离

### 2.2 非功能目标

1. **安全性**：iframe 强制 `sandbox` 属性限制，HTML 文件上传仅允许 `.html` 后缀。sandbox 配置提取为前端公共常量
2. **CSP 策略**：服务端为播放页设置 `Content-Security-Policy: frame-ancestors 'self'` 响应头，防止点击劫持
3. **权限隔离**：后端 Service 层强制注入 `currentUserId`，列表接口默认只返回当前用户创建的数据
4. **文件去重**：HTML 文件上传时按内容 SHA-256 去重
5. **审核流完整性**：状态机保护防止非法流转，审核接口仅 Admin/Researcher 角色可操作

---

## 3. 总体架构设计

### 3.1 系统分层

```
┌─────────────────────────────────────────────────────────────┐
│                  前端 (Next.js App Router)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ 列表页       │  │ 播放页       │  │ API 封装层        │  │
│  │ /virtual-exp │  │ /play/[id]   │  │ v2-virtual-exp.ts │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                  后端 (Bun HTTP Server)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ 路由层       │  │ 服务层        │  │ Repository 层     │  │
│  │ v2-virtual- │  │ VirtualExp   │  │ v2-virtual-exp-  │  │
│  │ exp.ts      │  │ Service.ts   │  │ repository.ts    │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   基础设施层                                 │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ MySQL bs_exp_data│  │ MinIO S3     │  │ 文件服务       │ │
│  │ virtual_exp     │  │ HTML 文件存储 │  │ v2-file 复用  │ │
│  └─────────────────┘  └──────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 组件协作关系

```
用户操作 → 导航菜单 → 列表页 → 新增弹窗
                                  ├─ 选择 URL 模式 → 输入 URL → POST /v2/virtual-exp
                                  └─ 选择 HTML 模式 → 上传文件 → POST /v2/virtual-exp/upload
                                    → S3 存储 → 创建 DB 记录 → 刷新列表

用户点击实验 → 播放页
  → GET /v2/virtual-exp/:id → 获取详情（含预签名 URL 或外部 URL）
  → <iframe src="..." sandbox="..."> 渲染
  → POST /v2/virtual-exp/:id/call（更新 call_count）
  → 若尚未封面，html2canvas 自动截图 → POST /v2/file/upload → PUT 更新 cover_url
```

### 3.3 路由注册方式

在 `backend/src/http/server.ts` 的 routes 数组中新增 `routeV2VirtualExp`。路由匹配优先级：SSE > V2 路由 > 其他路由。

---

## 4. 代码结构全量清单

### 4.1 后端

```
backend/src/
├── domain/
│   └── v2-virtual-experiment/
│       └── v2-virtual-experiment-types.ts       [新增] 纯类型定义
├── http/
│   ├── routes/
│   │   └── v2-virtual-experiment.ts             [新增] 路由入口
│   └── server.ts                                [修改] 注册路由
├── services/
│   └── VirtualExperimentService.ts              [新增] 业务逻辑
└── infrastructure/
    └── repositories/
        └── v2-virtual-experiment-repository.ts  [新增] 数据访问层
```

### 4.2 前端

```
frontend/src/
├── app/(dashboard)/virtual-experiment/
│   ├── list/
│   │   ├── page.tsx                             [新增] 列表页容器
│   │   ├── page.hooks.ts                       [新增] 列表页状态逻辑
│   │   └── _components/
│   │       ├── ExperimentTable.tsx              [新增] 实验表格
│   │       ├── CreateExperimentDialog.tsx       [新增] 新增弹窗（含 html2canvas 截图逻辑）
│   │       ├── EditExperimentDialog.tsx         [新增] 编辑弹窗
│   │       └── ReviewTable.tsx                  [新增] 审核专用表格
│   └── play/[id]/
│       └── page.tsx                             [新增] 播放页
├── lib/v2/
│   └── v2-virtual-experiment-api.ts             [新增] API 封装
└── config/
    ├── virtual-experiment-sandbox.ts            [新增] iframe sandbox 常量
    └── nav-config/
        └── ...各角色 nav 文件                    [修改] 增加菜单项
```

### 4.3 数据库

```
database/migrations/
└── 0013_update_virtual_experiment.sql           [新增] 建表 + 审核/统计/冗余字段
```

---

## 5. 数据库设计

### 5.1 表结构说明

**文件：** `database/migrations/0013_update_virtual_experiment.sql`

**表名：** `virtual_experiment`，归属库 `bs_exp_data`

**核心字段：**

| 字段 | 说明 |
|---|---|
| `id` | 主键，varchar(32) |
| `title` / `description` | 实验名称与描述 |
| `source_type` | 枚举 `url` / `html_file` |
| `source_url` / `file_storage_key` / `file_name` / `file_size` | URL 模式或 HTML 文件模式对应的存储信息 |
| `cover_url` | 封面图 URL（来自 html2canvas 截图上传或 og:image 提取） |
| `view_count` | 访问次数 |
| `call_count` | 被调用次数（每次播放页加载时直接 SQL UPDATE +1） |
| `status` | 枚举 `draft` / `pending` / `published` / `rejected` / `archived`，默认 `draft` |
| `reviewer_id` / `review_comment` / `review_time` | 审核元数据 |
| `sort_order` | 排序序号 |
| `create_user_id` / `create_user_name` | 创建人信息 |
| `create_time` / `update_time` / `is_deleted` | 通用审计字段 |

### 5.2 类型定义

**文件：** `backend/src/domain/v2-virtual-experiment/v2-virtual-experiment-types.ts`

核心类型：
- `VirtualExperimentSourceType = "url" | "html_file"`
- `VirtualExperimentStatus = "draft" | "pending" | "published" | "rejected" | "archived"`
- `VirtualExperimentRecord` — DB 记录映射（字段与表列 1:1 camelCase 映射）
- `CreateVirtualExperimentInput` / `UpdateVirtualExperimentInput` — 创建/更新输入
- `VirtualExperimentListQuery` — 查询参数（含 `keyword`、`sourceType`、`status`、`reviewMode`、`page`、`pageSize`）
- `VirtualExperimentListPage` — 分页结果

命名遵循 `truth-source-hierarchy.mdc` 规则：DB 列 snake_case ↔ TS 字段名 camelCase 严格 1:1 映射。

---

## 6. 接口职责清单

### 6.1 路由前缀

所有接口以 `/v2/virtual-experiment` 为前缀。

### 6.2 接口职责表

| 方法 | 路径 | 认证 | 权限 | 业务职责 |
|---|---|---|---|---|
| `GET` | `/v2/virtual-experiment` | 是 | 默认返回当前用户数据；`reviewMode=true` 时 Admin/Researcher 可查看所有 pending 实验 | 分页查询列表 |
| `POST` | `/v2/virtual-experiment` | 是 | 当前用户 | 创建 URL 内嵌类型实验 |
| `POST` | `/v2/virtual-experiment/upload` | 是 | 当前用户 | 上传 HTML 文件并创建实验记录 |
| `GET` | `/v2/virtual-experiment/:id` | 是 | 所属用户 | 获取单条详情（含预签名 URL） |
| `PUT` | `/v2/virtual-experiment/:id` | 是 | 所属用户 | 编辑实验（不可变更 source_type） |
| `DELETE` | `/v2/virtual-experiment/:id` | 是 | 所属用户 | 软删除 |
| `PUT` | `/v2/virtual-experiment/:id/sort` | 是 | 所属用户 | 更新排序序号 |
| `POST` | `/v2/virtual-experiment/:id/view` | 是 | 登录用户 | 记录访问次数 +1 |
| `POST` | `/v2/virtual-experiment/:id/submit` | 是 | 仅 Owner | [V2.0] 提交审核（draft/rejected → pending） |
| `POST` | `/v2/virtual-experiment/:id/review` | 是 | 仅 Admin/Researcher | [V2.0] 审核通过/拒绝（pending → published/rejected），含 comment |
| `POST` | `/v2/virtual-experiment/:id/call` | 是 | 登录用户 | [V2.0] 调用计数（直接 UPDATE call_count +1） |
| `POST` | `/v2/virtual-experiment/:id/archive` | 是 | 仅 Admin/Researcher | [V2.0] 归档已发布的实验（published → archived） |

### 6.3 接口职责描述

**分页列表 `GET /`**
- 支持按 `keyword`（标题模糊）、`source_type`、`status` 筛选
- `review_mode=true` 时返回所有 `pending` 实验（仅 Admin/Researcher 可用），忽略 `create_user_id` 过滤
- 返回值包含完整字段（含 `cover_url`、`status`、`call_count` 等）

**创建 URL 内嵌 `POST /`**
- 接收 `title`、`description`、`source_url`、`cover_url`（可选）
- 校验 `source_url` 以 `http://` 或 `https://` 开头
- 创建后默认 `status = "draft"`

**HTML 文件上传 `POST /upload`**
- multipart/form-data，接收 `file`（仅 `.html`）、`title`、`description`、`cover_url`
- 文件最大 10MB，存储到 MinIO，Key 格式 `v2/virtual-exp/{userId}/{uuid}.html`
- 详情接口返回时 `source_url` 填充为预签名 URL
- 封面相关上传均通过 `/v2/file/upload` 携带 `biz_type=virtual_exp_cover, is_hidden_from_gallery=1` 参数

**单条详情 `GET /:id`**
- `source_type = "html_file"` 时 `source_url` 填充为预签名 URL
- `cover_url` 字段做预签名处理

**提交审核 `POST /:id/submit`**
- 校验 Owner 身份 + `status` 为 `draft` 或 `rejected`
- 成功后更新 `status = "pending"`，清空审核元数据

**审核处理 `POST /:id/review`**
- 校验 Admin/Researcher 角色 + `status === "pending"`
- 接收 `action`（`approved` / `rejected`）和可选 `comment`
- 批准 → `status = "published"` | 拒绝 → `status = "rejected"`，写入审核元数据

**调用计数 `POST /:id/call`**
- 直接执行 `UPDATE virtual_experiment SET call_count = call_count + 1 WHERE id = ?`
- 简单可靠，无中间件依赖

**归档 `POST /:id/archive`**
- 校验 Admin/Researcher 角色 + `status === "published"`
- 成功后更新 `status = "archived"`
- `archived` 为终态，不可回退

---

## 7. 前端页面与交互设计

### 7.1 导航菜单

在教师/教研员/管理员的侧栏增加「虚拟实验管理」菜单项，放置于"实验列表"附近。导航 ID 为 `"virtual-experiment"`。

### 7.2 列表页

**路由：** `/virtual-experiment/list`

**布局：**

```
┌──────────────────────────────────────────────────────────────┐
│ 虚拟实验管理                                     [+ 新增]   │
├──────────────────────────────────────────────────────────────┤
│ [搜索框]  [全部] [URL 内嵌] [HTML 文件]                    │
│ 状态筛选: [全部] [草稿] [审核中] [已发布] [已拒绝] [已归档] │
│ [我的实验] [审核管理] ← 审核管理仅 Admin/Researcher 可见    │
├──────────────────────────────────────────────────────────────┤
│ 缩略图 │ 实验名称 │ 来源类型 │ 状态             │ 调用数│ ..│
│ ───── │ ──────── │ ─────── │ ───              │ ───  │   │
│ ┌──┐ │ 光的折射   │ URL      │ 🟢 已发布        │ 128  │   │
│ └──┘ │           │          │ 🟠 审核中        │      │   │
│      │           │          │ 🔴 已拒绝        │      │   │
│      │           │          │ ⚪ 草稿          │      │   │
├──────────────────────────────────────────────────────────────┤
│                         分页                                 │
└──────────────────────────────────────────────────────────────┘
```

**功能点：**
1. 搜索框按标题模糊搜索
2. 来源类型筛选 Tab（全部 / URL 内嵌 / HTML 文件）
3. 状态筛选（草稿 / 审核中 / 已发布 / 已拒绝 / 已归档）
4. 视图切换：「我的实验」vs「审核管理」（仅 Admin/Researcher 可见）
5. 缩略图列：显示封面图，无封面显示默认 Monitor 图标
6. 状态列色标：
   - 🟢 `published` — 绿色
   - 🟠 `pending` — 橙色
   - 🔴 `rejected` — 红色
   - ⚪ `draft` — 灰色
   - ⚫ `archived` — 黑色
7. 调用数列显示 `call_count`
8. 操作栏：编辑、提交审核（draft/rejected 状态）、上传封面、删除

### 7.3 新增弹窗

**布局：** Tab 切换"URL 内嵌"和"HTML 文件上传"两种模式。

```
┌─────────────────────────────────────────────────┐
│ 新增虚拟实验                                     │
├─────────────────────────────────────────────────┤
│ [URL 内嵌]  [HTML 文件上传]                     │
│                                                 │
│ 当选中 URL 内嵌：                               │
│   实验名称 *  [_____________________________]   │
│   描述        [_____________________________]   │
│   外部 URL *  [_____________________________]   │
│                                                 │
│ 当选中 HTML 文件上传：                          │
│   实验名称 *  [_____________________________]   │
│   描述        [_____________________________]   │
│   HTML 文件 * [选择文件] 仅支持 .html           │
│                                                 │
│ 封面图自动生成（html2canvas 截取）              │
│   或 手动上传肖像 [选择图片]                     │
│                                                 │
│                    [取消]  [确定]                │
└─────────────────────────────────────────────────┘
```

**封面图获取顺序：**
1. **html2canvas 前端自动截图**（播放页加载时触发，详见 §8.8）
2. **用户手动上传**（html2canvas 因 CORS 失败后，列表页操作栏提供「上传封面」按钮，仅 JPEG/PNG），上传时标记 `biz_type=virtual_exp_cover, is_hidden_from_gallery=1`
3. **系统默认占位图标**（Monitor 图标，无封面时显示）

### 7.4 播放页

**路由：** `/virtual-experiment/play/[id]`

**布局：**
- 顶部导航栏：返回列表 | 实验名称 | 全屏按钮 | 新窗口打开
- 内容区：全高 `<iframe>`，sandbox 与 referrerpolicy 引用自前端公共常量

**iframe 安全策略：**

sandbox 属性值提取为前端公共常量文件 `@/config/virtual-experiment-sandbox.ts`：

```typescript
// 外部 URL 与 MinIO 托管模式均使用最小权限
export const PLAY_MODE_SANDBOX = "allow-scripts allow-same-origin";
export const IFRAME_REFERRER_POLICY = "no-referrer" as const;
```

禁止 `allow-top-navigation`、`allow-popups`，防止点击劫持。

### 7.5 页面文件组织

```
frontend/src/app/(dashboard)/virtual-experiment/
├── list/
│   ├── page.tsx                          // 列表页容器（含视图切换）
│   ├── page.hooks.ts                     // 列表页状态管理
│   └── _components/
│       ├── ExperimentTable.tsx           // 表格组件（含状态色标列）
│       ├── ReviewTable.tsx               // 审核专用表格
│       ├── CreateExperimentDialog.tsx    // 新增弹窗（含 html2canvas 逻辑）
│       └── EditExperimentDialog.tsx      // 编辑弹窗
└── play/[id]/
    └── page.tsx                          // iframe 播放页
```

---

## 8. 核心业务流程

### 8.1 URL 内嵌实验创建流程

```
用户 → 列表页点击「新增」
  → 选择「URL 内嵌」Tab
  → 填写：名称、描述、外部 URL
  → 点击「确定」
  → 前端校验：名称非空、URL 格式
  → POST /v2/virtual-experiment
  → 后端：创建 DB 记录（status=draft, cover_url=null）
  → 返回新记录
  → 刷新列表
  → 封面图在用户首次播放时由 html2canvas 自动截图生成（详见 §8.8）
```

### 8.2 HTML 文件上传创建流程

```
用户 → 列表页点击「新增」
  → 选择「HTML 文件上传」Tab
  → 填写：名称、描述
  → 选择 .html 文件
  → 点击「确定」
  → 前端校验：文件后缀 .html、文件大小 ≤ 10MB
  → POST /v2/virtual-experiment/upload (multipart/form-data)
  → 后端：
    1. SHA-256 去重检查
    2. putObject 到 MinIO
    3. 创建 DB 记录
    4. 返回记录（source_url 为预签名 URL）
  → 刷新列表
  → 封面图在用户首次播放时由 html2canvas 自动截图生成（详见 §8.8）

  失败路径：Step 2 成功 + Step 3 失败 → catch 中异步 deleteObject 清理 S3
```

### 8.3 播放流程

```
用户 → 列表页点击实验名称
  → 跳转 /virtual-experiment/play/{id}
  → 调用 GET /v2/virtual-experiment/:id
  → 后端返回详情（source_url 已预签名，cover_url 自动签名）
  → 前端设置 <iframe src="source_url" sandbox="...">
  → 同时 POST /v2/virtual-experiment/:id/call（更新 call_count）
  → 若 cover_url 为 null，异步触发 html2canvas 截图（详见 §8.8）
  → 用户与虚拟实验交互
```

### 8.4 编辑流程

```
用户 → 点击操作栏「编辑」
  → 弹出编辑弹窗（回填现有数据）
  → 修改字段（注：不支持变更 source_type）
  → 点击「确定」
  → PUT /v2/virtual-experiment/:id
  → 刷新列表
```

### 8.5 S3 孤儿文件异步清理机制

**问题：** S3 上传成功但 DB 写入失败产生孤儿文件。

**三层次防护：**
| 层次 | 策略 | 触发时机 |
|---|---|---|
| **L1 即时清理** | catch 块中异步 `deleteObject` | 每次上传失败时 |
| **L2 定时扫描** | 扫描 S3 前缀 `v2/virtual-exp/`，与 DB 对比删除 | 每日一次 |
| **L3 手动触发** | 运维接口 `POST /v2/virtual-experiment/cleanup-orphans` | 按需 |

### 8.6 审核工作流

**状态机定义：**

```
                    ┌──────────────┐
                    │    draft     │ ← 新建默认
                    └──────┬───────┘
                           │ submit (Owner)
                           ▼
                    ┌──────────────┐
                    │   pending    │
                    └──────┬───────┘
                      ┌────┴────┐
                 approve│        │reject
                      ▼         ▼
              ┌──────────┐  ┌──────────┐
              │published  │  │ rejected │
              └─────┬─────┘  └─────┬────┘
                    │ archive      │ submit
                    ▼              ▼
              ┌──────────┐  ┌──────────┐
              │ archived  │  │ v (draft)│
              └──────────┘  └──────────┘
```

**流转合法性矩阵：**

| 当前状态 | submit | review: approve | review: reject | archive | 编辑 | 删除 |
|---|---|---|---|---|---|---|
| `draft` | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `pending` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `published` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `rejected` | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `archived` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**审核流程路径：**
1. 创建者完善实验 → 点击「提交审核」→ `POST /:id/submit` → `status → pending`
2. 管理员/教研员进入「审核管理」Tab → 预览实验 → 通过或拒绝 → `POST /:id/review`
3. 通过 → `published`；拒绝 → `rejected`，写入 reviewer_id/comment/time
4. 创建者收到结果：通过可见于列表，拒绝可编辑后重新提交

### 8.7 调用统计

直接 SQL UPDATE，无需 Redis 或定时任务：

```sql
-- 每次播放页加载时执行
UPDATE virtual_experiment SET call_count = call_count + 1 WHERE id = ?
```

**说明：** 调用统计作为辅助参考数据，不依赖高精度原子计数，直接 UPDATE 的简单方案足以满足需求。

### 8.8 前端自动截图流程（V2.0 新增）

**目标：** 在播放页首次加载时，通过 html2canvas 自动截取虚拟实验页面作为封面图，上传至 S3 并将 S3 Key 写入 `cover_url`。

**方案：** 引入 `html2canvas` 库。

**为什么放在播放页而非新增弹窗：**
- 新增弹窗中需要再创建一个隐藏的 `<iframe>` 加载实验页面，成本等同于跳转到播放页
- 播放页已有现成渲染好的可见 `<iframe>`，截图更可靠、用户体验无感知
- 用户进入播放页时截图，封面在后续列表刷新时自动可见

**存储方案（S3 Key + 标记隔离）：**
- `cover_url` 字段存储 S3 Key（如 `v2/u_xxx/xxx.png`），**不存储预签名 URL**
- 由 `deepPresignResponse` 机制（`presign-response.ts` 的 `MINIO_URL_FIELDS` 白名单）在响应返回前端前自动签名
- 只需在 `MINIO_URL_FIELDS` 新增 `"coverUrl"` 一行，全链路自动生效
- 封面上传走统一 `/v2/file/upload` 接口，通过参数 `biz_type=virtual_exp_cover, is_hidden_from_gallery=1` 标记：
  - `is_hidden_from_gallery=1` → 媒体库默认列表不展示（默认过滤 `IS NULL OR =0`）
  - `biz_type=virtual_exp_cover` → 可按业务来源精确查询、归类

**流程：**

```
播放页加载（/virtual-experiment/play/{id}）
  → GET /v2/virtual-experiment/:id 获取详情
  → iframe 渲染实验页面

  → 若 cover_url 为 null（尚未生成封面），触发截图：
    1. 等待 iframe load 事件 + 额外 3s 渲染稳定延迟
    2. 调用 html2canvas(iframe, { useCORS: true })
    3. 成功 → canvas.toBlob() → File对象
    4. POST /v2/file/upload（multipart/form-data，
       file=截图Blob, biz_type=virtual_exp_cover, is_hidden_from_gallery=1）
    5. 返回中的 data.fileUrl 即为 S3 Key
    6. PUT /v2/virtual-experiment/:id { cover_url: "v2/u_xxx/xxx.png" }
    7. 前端列表刷新后自动显示封面

  → 无论截图成功与否，均不阻塞用户播放体验
```

**兜底策略（用户主动手动上传）：**

```
当截图失败时：
  列表页缩略图显示默认 Monitor 占位图标

  用户可点击操作栏「上传封面」
  → 弹出文件选择器（仅 JPEG/PNG）
  → 上传至 POST /v2/file/upload（biz_type=virtual_exp_cover, is_hidden_from_gallery=1）
  → 取 fileUrl（S3 Key）
  → PUT /v2/virtual-experiment/:id { cover_url: fileUrl }
  → 列表刷新显示新封面

  这是最终的兜底保障，确保每种实验都能有封面
```

**与媒体素材库的隔离机制（复用现有 data_file 体系）：**

| 列 | 封面资源 | 媒体素材库资源 | 隔离原理 |
|---|---|---|---|
| `is_hidden_from_gallery` | `1` | `0` / null | 默认列表过滤 `=0`，隐藏的记录完全不展示 |
| `biz_type` | `virtual_exp_cover` | null | 支撑按业务来源精确查询、统计 |
| `file_type_id` | `FT_Image`（自动推导） | `FT_*` 非 null | 有类型，但不影响隐藏性 |

**设计依据：** 与现有 `biz_type='avatar'` 用户头像模式一致——同样走 `/v2/file/upload` 上传，同样通过 `is_hidden_from_gallery=1` 标记与媒体库隔离。未来类似需求（如富文本插图 `biz_type='richtext_image'`）可复用同一模式。

**html2canvas 示例（播放页）：**

```typescript
// play/[id]/page.tsx（节选）
import html2canvas from "html2canvas";
import { buildApiUrl } from "@/lib/core-api-shared";

async function autoCaptureCover(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  experimentId: string,
  experimentStatus: string,
) {
  // 仅在草稿/已拒绝状态且无封面时触发
  if (!["draft", "rejected"].includes(experimentStatus)) return;

  try {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const iframe = iframeRef.current;
    if (!iframe) throw new Error("iframe not mounted");

    // 注：html2canvas 不能直接传 iframe 元素（只能截到外框），
    // 必须读取 contentDocument.body。跨域时 contentDocument 为 null 则跳过。
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) throw new Error("cross-origin: cannot access iframe content");

    const canvas = await html2canvas(doc.body, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("toBlob failed");

    // 上传到 /v2/file/upload（必须带 credentials 以传递 Cookie 身份）
    const file = new File([blob], `cover-${experimentId}.png`, { type: "image/png" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("biz_type", "virtual_exp_cover");
    formData.append("is_hidden_from_gallery", "1");

    const uploadRes = await fetch(buildApiUrl("/v2/file/upload"), {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const { data, success: uploadOk } = await uploadRes.json();
    if (!uploadOk) throw new Error("upload failed");

    // data.fileUrl 就是 S3 Key（如 v2/u_xxx/xxx.png）
    // 写入 cover_url（S3 Key，不存预签名 URL）
    await fetch(buildApiUrl(`/v2/virtual-experiment/${experimentId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ cover_url: data.fileUrl }),
    });
  } catch (err) {
    console.warn("[autoCaptureCover] html2canvas 截图失败", err);
    // 静默失败，不阻塞用户播放体验
    // 用户可后续手动上传封面
  }
}
```

**限制说明：**
- html2canvas 不能直接传 iframe 元素（只能截到外框），必须通过 `iframe.contentDocument.body` 截取内部内容
- **跨域站点**（如 PhET 等外部 URL 内嵌）：`contentDocument` 为 null，截图静默跳过。这种情况仅支持手动上传封面
- **同源**（MinIO 托管 HTML 文件）：无跨域限制，截图成功率接近 100%
- 所有失败路径最终均支持用户手动上传封面作为兜底

**实施要求：**
1. 前端安装 `html2canvas`：`pnpm add html2canvas`
2. `presign-response.ts` 的 `MINIO_URL_FIELDS` 新增 `"coverUrl"`
3. `backend/src/http/routes/v2-file.ts` 的 `POST /v2/file/upload` 新增两个可选 form 字段 `biz_type`（string）和 `is_hidden_from_gallery`（string），透传到 `createFileRecord`

---

## 9. 关键规则与约束

### 9.1 安全约束

| 约束项 | 说明 |
|---|---|
| **iframe sandbox** | 必须设置 `sandbox="allow-scripts allow-same-origin"`，禁止 `allow-top-navigation`、`allow-popups`。值引用自 `@/config/virtual-experiment-sandbox.ts` |
| **CSP frame-ancestors** | 播放页响应设置 `Content-Security-Policy: frame-ancestors 'self'` |
| **referrer** | 设置 `referrerpolicy="no-referrer"` |
| **HTML 文件限制** | 仅允许 `.html` 后缀，最大 10MB |
| **权限隔离** | 所有接口按 `create_user_id` 过滤数据 |

### 9.2 审核状态机约束

| 约束项 | 说明 |
|---|---|
| **状态机保护** | 仅 `draft` / `rejected` 可提交审核；仅 `pending` 可被审核 |
| **Owner 校验** | submit 接口校验 `currentUserId === createUserId` |
| **角色守卫** | review 接口校验 Admin/Researcher 角色 |
| **不可逆归档** | `archived` 为终态，不允许任何迁移 |

### 9.3 调用统计约束

| 约束项 | 说明 |
|---|---|
| **直接 SQL** | `POST /:id/call` 直接执行 `UPDATE call_count = call_count + 1` |
| **无需 Redis** | 统计作为辅助参考数据，不要求精确原子性，无需单独引入 Redis 中间件 |

### 9.4 封面文件标记隔离约束

| 约束项 | 说明 |
|---|---|
| **统一上传入口** | 虚拟实验封面（含 html2canvas 自动截图和手动上传）统一走 `/v2/file/upload`，不新增专用上传端点 |
| **标记隔离** | 上传时必须携带 `biz_type=virtual_exp_cover, is_hidden_from_gallery=1`，与媒体素材库隔离 |
| **存储去重** | `data_file` 的 SHA-256 去重机制覆盖封面文件，同一张图引用多次只存一份 |
| **`MINIO_URL_FIELDS`** | `presign-response.ts` 的 `MINIO_URL_FIELDS` 白名单新增 `"coverUrl"`，全链路自动签名 |

### 9.5 命名映射

后端 Domain 层 camelCase 字段 `coverUrl` 对应 DB 列 `cover_url`；`bizType` 对应 `biz_type`。遵循 `truth-source-hierarchy.mdc` 的严格 1:1 映射规则。

---

## 10. 错误码

| HTTP 状态码 | 错误码 | 说明 |
|---|---|---|
| 400 | 4000 | 参数校验失败 |
| 400 | 4005 | 状态流转不合法（非 Owner 提交/非 pending 审核） |
| 403 | 4030 | 无权操作（非所属用户） |
| 403 | 4031 | 角色不足（非 Admin/Researcher 调用 review） |
| 404 | 4040 | 未找到指定实验 |
| 500 | 5000 | 服务内部错误 |

---

## 11. 附录

### 11.1 涉及文件清单汇总

| 操作 | 文件路径 |
|---|---|
| 新增 | `database/migrations/0013_update_virtual_experiment.sql` |
| 新增 | `backend/src/domain/v2-virtual-experiment/v2-virtual-experiment-types.ts` |
| 新增 | `backend/src/http/routes/v2-virtual-experiment.ts` |
| 修改 | `backend/src/http/server.ts` |
| 新增 | `backend/src/services/VirtualExperimentService.ts` |
| 新增 | `backend/src/infrastructure/repositories/v2-virtual-experiment-repository.ts` |
| 新增 | `backend/src/ops/virtual-experiment-cleanup.ts` |
| 新增 | `frontend/src/app/(dashboard)/virtual-experiment/list/page.tsx` |
| 新增 | `frontend/src/app/(dashboard)/virtual-experiment/list/page.hooks.ts` |
| 新增 | `frontend/src/app/(dashboard)/virtual-experiment/list/_components/ExperimentTable.tsx` |
| 新增 | `frontend/src/app/(dashboard)/virtual-experiment/list/_components/ReviewTable.tsx` |
| 新增 | `frontend/src/app/(dashboard)/virtual-experiment/list/_components/CreateExperimentDialog.tsx` |
| 新增 | `frontend/src/app/(dashboard)/virtual-experiment/list/_components/EditExperimentDialog.tsx` |
| 新增 | `frontend/src/app/(dashboard)/virtual-experiment/play/[id]/page.tsx` |
| 新增 | `frontend/src/lib/v2/v2-virtual-experiment-api.ts` |
| 新增 | `frontend/src/config/virtual-experiment-sandbox.ts` |
| 修改 | `frontend/src/config/nav-config/teacher-nav.ts` |
| 修改 | `frontend/src/config/nav-config/researcher-nav.ts` |
| 修改 | `frontend/src/config/nav-config/admin-nav.ts` |
| 修改 | `frontend/src/config/nav-config/dashboard-nav.ts` |
| 修改 | `frontend/src/config/nav-config/nav-labels.ts` |
| 修改 | `backend/src/lib/presign-response.ts` |

### 11.2 参考文档

- [V2 实验业务详细设计文档](../core/v2-exp-detailed-design.md)
- [AI 智能体概要设计文档](../ai-agent/ai-agent-overview-design.md)
- [数据库设计文档](../core/bs_exp_data-database-design.md)
- [详细设计文档模板](../templates/design-doc-template.md)
