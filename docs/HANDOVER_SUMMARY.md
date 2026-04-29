# 项目交接摘要 (Handover Summary)

> 生成日期：2026-04-26 14:30
> 分支：`feature/db-loading-and-media-storage`
> 后端端口：4100 | 前端端口：4200

---

## 一、当前开发进度

### 已完成的 5 个后端/管理优化任务

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 1 | **家长绑定引导入口** | `parent-binding-guide.tsx`、`management-home-view.tsx` | 家长登录首页时，根据绑定状态自动切换：未绑定 → 引导卡（步骤说明 + "前往绑定"按钮）；待审核 → 申请列表；已绑定 → 正常 Dashboard |
| 2 | **运维入口框架** | `admin-nav.ts` 超管导航末尾 + 5 个页面目录 | 超管导航新增"运维中心"分组：运维概览 (`/console/operations/dashboard`)、业务字典同步 (`/dict-sync`)、数据导出 (`/data-export`)、缓存管理 (`/cache-mgmt`)、数据一致性检查 (`/consistency`) |
| 3 | **字典变更审计日志** | `v2-dict-audit-log.ts`、`v2-admin-dict.ts`、`v2-business-dict.ts` | 利用已有 `sys_log` 表，在字典 POST/PATCH/DELETE 操作后异步写入审计日志（`dict_create`/`dict_update`/`dict_delete`），含操作人、表名、主键 |
| 4 | **后端权限表确认** | `v2-sys-role.ts`、`v2-sys-role-repository.ts` | `sys_role` + `sys_role_perm` 表已存在，`GET/PUT /v2/sys-role/:roleId/permissions` 完整支持权限矩阵读写。`DictionarySettingsShell` 已使用该 API 控制字典可见性 |
| 5 | **数据一致性检查** | `v2-ops-consistency.ts`、`server.ts`、`consistency/page.tsx` | 后端 4 项只读扫描：组织类型完整性、用户角色一致性、材料分类/安全性参照完整性；前端调用真实 API 展示结果 |

### 前端 dvh+flex 布局状态

实验编辑器页面已改造为 `h-dvh` + `flex-col overflow-hidden` 固定尺寸布局，自适应浏览器窗口：

```tsx
// ExperimentEditorShell.tsx — 根容器
<div className="flex h-dvh flex-col overflow-hidden">
  <header className="shrink-0">...</header>         // 固定头部（步骤指示器）
  <div className="shrink-0">...</div>                // 固定工具条
  <div className="min-h-0 flex-1 px-4 sm:px-6 lg:px-8">  // 剩余空间（三栏布局）
    <EditorThreePaneLayout
      left="左侧面板（220px）"
      center="中间内容区（flex-1）"
      right="右侧面板（300px，当前为 null）"
    />
  </div>
</div>
```

- 列宽：`grid-cols-[220px_minmax(0,1fr)_300px]`
- 三栏均 `overflow-y-auto`，中间 `overflow-hidden`
- 支持 1920×1080 至 2K+ 自适应

---

## 二、核心架构快照

### Org_School 组织体系（六层）

```text
Org_Manage（管理/教育局）
└── Org_School（顶层学校）
     └── Org_School_Campus（校区/分校）    ← 新增 via seed
          └── Org_School_Level（学段）      ← 新增 via seed
               ├── Org_School_Grade（年级）
               │    └── Org_School_Class（班级）
               └── ...
```

**前端常量**：`frontend/src/lib/v2/v2-org-type-constants.ts`
**后端常量**：`backend/src/domain/v2-sys/v2-org-type-constants.ts`
**Seed SQL**：`database/seed/insert-org-types-campus-level.sql`（幂等 INSERT）

```typescript
export const V2_ORG_TYPE_IDS = {
  manage: "Org_Manage",
  school: "Org_School",
  campus: "Org_School_Campus",   // 新增
  level: "Org_School_Level",     // 新增
  grade: "Org_School_Grade",
  class: "Org_School_Class",
} as const;
```

**`data_org_type` 初始化状态**：初始化后不可变更。前端 `admin-dict-tables.ts` 中 `SYSTEM_DICT_OPTIONS` 组已将 `data_org_type`、`data_role`、`data_msg_type`、`data_rating_scale` 标记为 `allowMutation: false`（只读）。

### 教师教课关系树解析

**关键文件**（教师授课管理弹窗的选班逻辑）：

| 文件 | 职责 |
|------|------|
| `teacher-config-tree-helpers.ts` | `gradesUnderSchool()` 递归搜索年级、`listSchools()` 过滤顶层学校（跳过学部级 Org_School） |
| `teacher-class-org-resolve.ts` | `resolveTopSchoolNode()` 递归向上查找最高层学校 |
| `ClassPickerDialog.tsx` | 弹窗内年级/班级下拉使用 `walkTree()` 递归搜索 |
| `page.hooks.ts` | `configDefaultSchoolOrgId` 优先从选中教师的 `userOrgId` 推导 |

### 数据库

- **目标库**：`bs_exp_data`（唯一真源，不可执行 DDL）
- **基线**：`database/migrations/bs_exp_data.sql`（Navicat 导出，全库 DDL）
- **增量迁移**：`database/migrations/00NN_*.sql`
- **Seed 脚本**：`database/seed/insert-org-types-campus-level.sql`

---

## 三、关键技术细节

### 颜色体系

| 用途 | 色值 | 位置 |
|------|------|------|
| 步骤指示器活跃/已完 | `#008080`（深青） | `ExperimentEditorShell.tsx` step indicator |
| 进度条活跃 | `#008080` | `ExperimentEditorShell.tsx` Progress |
| 左侧面板背景 | `bg-slate-900` | 左侧大纲面板 |
| 卡片容器 | `rounded-[28px]` + `shadow-[0_8px_30px_rgb(0,0,0,0.04)]` | 编辑区所有 Section |
| 关联实验弹窗 | `rounded-[32px]` + `backdrop-blur-sm bg-slate-900/20` | `ExperimentPickerDialog.tsx` |
| 操作按钮 | `bg-foreground text-background hover:bg-foreground/90` | 所有管理页面 |

### 组件库约定

- **原子组件**：`@bs-lab/ui`（`packages/ui/`），禁止直接引用 `@/components/ui/*` 或第三方 UI
- **图标**：`@bs-lab/ui/icons`（Lucide + 自定义包装）
- **UI 框架**：Tailwind CSS v4（语义化 token：`text-foreground`、`bg-background`、`border-border`）
- **对话框**：全中文文案，禁止英文 UI 文案
- **管理表格**：优先使用 `@bs-lab/ui` 的 `DataTable`，表头吸顶，首列序号

### OCR 与编辑器

- **文档**：`docs/ocr-usage-spec.md`
- **API**：`POST /api/ai/media-cover-ocr`（`frontend/src/app/api/ai/media-cover-ocr/route.ts`）
- **OCR 不存数据库**，仅用于 UI 字段回填（实验名称、年级、学科）
- **材料安全等级**在实验编辑页不写，在"新增实验材料"页面维护

---

## 四、待办清单 (Backlog)

### UI 细节优化

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P1 | **Teacher 导航中 `exp-question-bank` 路由修正** | 当前指向 `/experiments` 而非 `/console/assessment/questions`（需要确认意图） |
| P1 | **字典** `data_rating_scale` | 后端 `isReadonlyDictTable` 已加，但前端允许查看时全字段显示可能需要优化 |
| P2 | **角色权限管理页** | 当前 `roles/page.tsx` 使用硬编码 mock 矩阵（`ModuleId = "content"\|"user"\|"audit"\|"system"`），应升级为调用后端 `v2-sys-role/:roleId/permissions` 的 `sys_role_perm` 真实数据 |
| P2 | **家长条件导航** | 家长导航栏目前全部显示；应改为未绑定时只显示"绑定孩子"入口 |

### OCR 联动逻辑

| 任务 | 说明 |
|------|------|
| OCR 结果未持久化到草稿 | 当前 OCR 仅做 UI 字段回填，选择视频后如果用户未点击保存，OCR 结果会丢失。考虑自动保存时携带 OCR 识别字段 |
| 多个视频场景 OCR | 当前仅支持单主视频的 OCR 识别，实验步骤中附加视频尚未触发 OCR |
| OCR 失败时的 fallback | 容错机制：显示原始文本，不阻塞操作 |

### 其他

| 任务 | 说明 |
|------|------|
| 运维页鉴权 | 运维页面当前仅通过导航隐藏，未在页面级别校验角色 |
| 一致性检查 API 鉴权 | `v2-ops-consistency.ts` 当前无权限校验，需增加超管限制 |

---

## 五、待查风险

### 1. 角色权限页（`roles/page.tsx`）与真实后端的脱节

当前 `roles/page.tsx` 使用硬编码的 `ModuleId = "content" | "user" | "audit" | "system"` 和 `RoleId = "student" | "parent" | ...`，但后端 `sys_role_perm` 表中的 `moduleId` 是导航级 id（如 `"system_dict"`、`"experiment"`）。两个系统之间存在**语义鸿沟**——前端的权限设置保存到 `sys_role_perm` 表后，前端字典页 `DictionarySettingsShell` 通过 `fetchSysRolePermMatrix` 读取的是完全不同的 moduleId，会导致权限配置不生效。

**结论**：权限管理页需要重构为基于真实 `sys_role_perm` 表的模块列表（从 `sys_role` 读取角色，从导航配置读取模块），当前仅部分生效。

### 2. 家长绑定流程中的 header actor 问题

`ParentBindingGuard` 使用 `buildMaterialsApiActor(role, orgId, "admin-dict")` 构造 actor 进行 API 调用。在**生产环境**（`ALLOW_HEADER_ACTOR !== "true"`）下，服务端会验签 session token 中的身份，忽略 header 中的 `x-user-id`/`x-role`。如果家长用户未登录或 session 中角色不匹配，绑定 API 调用会失败。

**结论**：开发环境（header actor 模式）下功能正常；生产环境部署时需确保家长用户已正确登录并持有有效 session。

### 3. `exp-question-bank` 路由歧义

教师导航中 `exp-question-bank` id 的 href 为 `/experiments`，而超管/区管导航中同一 id 的 href 为 `/console/assessment/questions`。当 `to-app-shell-nav.ts` 通过 id 去重时，只会保留一条，可能导致部分角色看到错误的路由。当前因两个路由意义不同（教师的"实验课程库" vs 管理侧的"题库管理"），实际上应是**两个不同的功能**，不应该用同一个 id。

### 4. 导航分组 `console-cfg-textbook-ref` vs `console-res-textbooks`

两个不同的 id 指向同一个 href `/console/settings/textbooks`，均标记为"教材管理"。这是超管导航中的残留，虽已通过显式列表只保留一个，但其他角色配置中两者仍共存。

### 5. 运维页无权限拦截

新增的运维页面（`/console/operations/*`）目前仅在超管导航中可见，但页面本身没有后端权限校验。如果需要防止用户直接输入 URL 访问，需要在后端路由或前端布局层增加拦截。

---

## 六、附：关键文件索引

### 导航与菜单

| 文件 | 用途 |
|------|------|
| `frontend/src/config/nav-config/matrix.ts` | 三维导航矩阵：角色 × 模式 × 菜单项 |
| `frontend/src/config/nav-config/admin-nav.ts` | 校管 + 超管导航定义 |
| `frontend/src/config/nav-config/researcher-nav.ts` | 区管/教研员导航（共享 `buildDistrictResearcherManagementNav`） |
| `frontend/src/config/nav-config/teacher-nav.ts` | 教师导航 |
| `frontend/src/config/nav-config/nav-labels.ts` | 导航标签统一字典 |
| `frontend/src/config/nav-config/to-app-shell-nav.ts` | 导航项分组编排（系统管理/系统配置/教学管理/实验管理） |

### 字典与配置

| 文件 | 用途 |
|------|------|
| `frontend/src/app/(dashboard)/console/settings/dictionaries/admin-dict-tables.ts` | 字典表五组分类定义 |
| `frontend/src/app/(dashboard)/console/settings/dictionaries/_components/dictionary-settings-shell.tsx` | 字典设置左栏分组壳层 |
| `frontend/src/app/(dashboard)/console/settings/dictionaries/_components/GenericDictionaryPage.tsx` | 通用字典 CRUD 页面组件 |
| `backend/src/http/routes/v2-admin-dict.ts` | 字典后端路由（含审计日志） |
| `backend/src/http/routes/v2-business-dict.ts` | 业务字典后端路由（含审计日志） |
| `backend/src/infrastructure/repositories/v2-dict-audit-log.ts` | 字典审计日志写入 |

### 组织树与教师教课

| 文件 | 用途 |
|------|------|
| `frontend/src/lib/v2/v2-org-type-constants.ts` | 组织类型常量（6 层） |
| `frontend/src/app/(dashboard)/system-manage/teacher-class/_lib/teacher-config-tree-helpers.ts` | 组织树遍历辅助函数 |
| `frontend/src/app/(dashboard)/system-manage/teacher-class/_lib/teacher-class-org-resolve.ts` | 学校名称/ID 解析 |
| `frontend/src/app/(dashboard)/system-manage/teacher-class/_components/ClassPickerDialog.tsx` | 班级选择弹窗 |
| `frontend/src/app/(dashboard)/system-manage/teacher-class/page.hooks.ts` | 教师教课管理主 hook |
| `database/seed/insert-org-types-campus-level.sql` | 校区+学段类型 seed |

### 实验编辑器

| 文件 | 用途 |
|------|------|
| `frontend/src/app/(dashboard)/teacher/experiment-editor/_components/ExperimentEditorShell.tsx` | 编辑器壳层（h-dvh 固定布局 + 5 步指示器） |
| `frontend/src/app/(dashboard)/teacher/experiment-editor/_components/EditorThreePaneLayout.tsx` | 三栏布局容器 |
| `frontend/src/app/(dashboard)/teacher/experiment-editor/_components/sections/EditorBasicSection.tsx` | 基础信息/视频/OCR Section |
| `frontend/src/app/(dashboard)/teacher/experiment-editor/_components/ExperimentPickerDialog.tsx` | 关联实验弹窗 |
| `frontend/src/app/(dashboard)/teacher/experiment-editor/hooks/use-editor-store.ts` | 编辑器状态 store |

### 后端入口

| 文件 | 用途 |
|------|------|
| `backend/src/http/server.ts` | HTTP 服务入口，注册所有路由 |
| `backend/src/http/routes/v2-ops-consistency.ts` | 数据一致性检查 API |

### 文档

| 文件 | 用途 |
|------|------|
| `docs/ocr-usage-spec.md` | OCR 使用规范 |
| `docs/platform/baseline-and-console-config-inventory.md` | 基线数据与配置清单 |
| `docs/platform/sys-org-tree-teacher-class.md` | 组织树与教师教课说明 |
| `docs/DATABASE_BASELINE.md` | 数据库基线说明 |
