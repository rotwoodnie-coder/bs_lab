# 内测部署前审计报告与优化计划

> 审计日期：2026-04-27
> 审计范围：前端路由完整性、业务逻辑闭环 UI 支持、UI 风格统一（参考母板 `/experiment-manage`）
> 复核日期：2026-04-27（已采纳三次审校建议）

---

## 一、死链接 / 无页面审计

### 1.1 发现的死链接

| 导航标签 | 配置路径 | 实际 page.tsx | 严重度 | 状态 |
|---|---|---|---|---|
| **模拟开发配置** | `/console/settings/simulation-dev` | `/admin/simulation-dev`（存在） | 🔴 导航 404 | ✅ |
| **全区看板** | `/district/overview` | ✅ `district/overview/page.tsx` 存在 | — | ✅ |
| 其余全部导航项（~60 项） | — | — | — | ✅ 均已对账 |

死链接修正方案：`config/nav-config/admin-nav.ts` 中两处 `href: "/console/settings/simulation-dev"` → `"/admin/simulation-dev"`。

### 1.2 已有页面但未入导航（评估是否需入口）

| 路径 | 页面用途 | 建议 |
|---|---|---|
| `/teacher/home` | 教师首页 | 评估是否替换 `/experiment-manage` 作为默认入口 |
| `/teacher/assignments` | 教师任务列表 | 可能废弃或用作跳转 |
| `/admin/menu-config` | 菜单配置 | 超管隐藏入口，可不入导航 |
| `/admin/experiment-config` | 实验配置 | 同上 |
| `/admin/labs` | 实验室管理 | 同上 |

### 1.3 基础设施缺失

| 文件 | 状态 | 影响 |
|---|---|---|
| `not-found.tsx`（根目录） | ✅ | 用户访问不存在路由时显示友好引导页 |
| `(dashboard)/error.tsx` | ✅ | 页面异常时显示友好提示而非白屏，侧栏可正常操作 |

---

## 二、业务逻辑闭环 UI 交互支持审计

### 2.1 实验创建→编辑→预览→审核→发布 主链路

| 流程节点 | 路由 / 组件 | 状态 |
|---|---|---|
| 实验列表 | `/experiment-manage` | ✅ |
| 新建实验 | `/experiment-manage/editor` | ✅ |
| 实验编辑器 | `/teacher/experiment-editor` | ✅ |
| 草稿保存 | `PUT /v2/exp/draft` | ✅ |
| 预览 | `/teacher/experiment-preview` | ✅ |
| 提交审核 | `POST /v2/exp/publish` | ✅ |
| 审核列表 | `/console/review/experiments` | ✅ |
| 审核通过/驳回 | review 操作 | ✅ |
| **驳回原因展示** | `experiment-preview/page.tsx` | ⚠️ 需确认 `rejectReason` 是否已渲染 |
| **驳回后重新编辑→再提交** | 状态流转 | ⚠️ 审计发现：驳回后重新提交流程中后端 status 未从 n 重置为 t（待审），导致审核队列不出现驳回实验。已在 v2-exp-draft-repository.ts 修复：status === n 时自动重置为 t 并清空 reject_reason、confirm_* 字段。 |

### 2.2 材料管理链路

| 流程节点 | 路由 | 状态 |
|---|---|---|
| 实验材料库 | `/experimental-materials` | ✅ |
| 材料新增/编辑 | `ExperimentalMaterialFormDialog` | ✅ |
| 教师素材库 | `/teacher/materials` | ✅ |

### 2.3 教学架构 / 系统管理

全部模块完整，涵盖教材、学段学科、字典、组织、用户、角色权限。

---

## 三、UI 风格统一（参考母板 `/experiment-manage`）

### 参考页核心组件

```
LeftTreeRightTableLayout → ManagementPageFrame → ManagementKpiCards + ManagementListToolbar
```

视觉特征：`bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]`、`rounded-[28px]`、语义色、字体自适应缩放。

### 分组 A：已对齐 ✅

`/experiment-manage`、`/experimental-materials`、`/console/settings/education/subject-grades` 等 10+ 页。

### 分组 B：需对齐 🟡 P1

- `/console/settings/experiments`（实验列表管理页）
- `/console/settings/incentives`（积分与激励）
- `/teacher/social` + `/console/social/court`（小法庭）
- `/teacher/research-project-groups`（教研组管理）

> **B 组不引入新的统一包装层**。`ManagementPageFrame` + `ManagementListToolbar` 已是现成抽象；复用现有组件而非新建 `CommonTableWrapper`，避免封装套封装。
>
> **空状态统一**：B 组改造时，在 `components/business/common/` 下抽象一个极简 `EmptyPlaceholder` 组件，替代手写 div，降低多个页面的空态维护成本。各页验收含空态展示。

### 分组 C：运维面板 🟢 P2

- AI 配置、报告模板、运维概览、操作记录等 8 页

> **危险操作安全底线**：
> - 一般运维操作（如通知推送）使用 Destructive Button + `AlertDialog` 二次确认
> - **高危操作**（数据一致性修复、缓存清空）：增加「输入确认」机制（输入 `DELETE` 才可执行），防止误点

---

## 四、优化改造任务清单

> 每个任务独立开窗口执行，完成后回本文档标记 ✅。

---

### 任务 A01 — 修复死链接

| 字段 | 内容 |
|---|---|
| **目标** | 修复导航中 `模拟开发配置` 404 问题 |
| **涉及文件** | `frontend/src/config/nav-config/admin-nav.ts` |
| **操作** | 第 36 行和第 69 行：`href: "/console/settings/simulation-dev"` → `"/admin/simulation-dev"` |
| **验收** | 学校管理员/超管角色点击 `模拟开发配置` 可正常跳转 |
| **状态** | ✅ |

### 任务 A02 — 添加 404 智能引导页

| 字段 | 内容 |
|---|---|
| **目标** | 项目全局添加 `not-found.tsx`，避免白屏；根据用户角色智能推荐常用模块入口 |
| **涉及文件** | `frontend/src/app/not-found.tsx`（新增） |
| **操作** | 1. 使用 `findDashboardNavHref` + 角色判断，显示 3~5 个常用模块入口按钮<br>2. 若不依赖 `nav-config` 的重型计算，至少提供「返回首页 / 实验课程 / 实验材料库」3 个兜底入口 |
| **验收** | 访问不存在路由时显示友好页面 + 推荐入口按钮，点击可跳转 |
| **状态** | ✅ |

### 任务 A03 — 确认驳回原因展示

| 字段 | 内容 |
|---|---|
| **目标** | 审核被驳回的实验，预览页面应展示驳回原因 |
| **涉及文件** | `frontend/src/app/(dashboard)/teacher/experiment-preview/page.tsx` |
| **操作** | 1. 检查 `detail.rejectReason` 是否渲染；若未渲染，在详情区添加驳回原因卡片（红色警告卡片）<br>2. 验证「重新提交」链路：`PUT /v2/exp/draft` 后再次 `POST /publish` 时，后端自动置 `reject_reason = null`，前端 `persistListFields` 同步清理，避免「新草稿带旧驳回原因」 |
| **验收** | 驳回状态实验预览时可见驳回原因文字；重新提交后驳回原因消失 |
| **状态** | ✅ |

### 任务 A04 — 添加全局 Error Boundary（含一键上报）

| 字段 | 内容 |
|---|---|
| **目标** | 为 `(dashboard)` 添加 `error.tsx`，防止单个 API 崩溃导致整个仪表盘白屏 |
| **涉及文件** | `frontend/src/app/(dashboard)/error.tsx`（新增） |
| **操作** | 1. 必须是 `"use client"` 组件（Next.js App Router 要求）<br>2. 捕获运行时错误，显示「页面加载异常」提示 + 刷新按钮，侧栏导航保持可用<br>3. **增加一键上报按钮**：调用现有审计日志接口，上报 `error.digest` 错误指纹，内测用户崩溃时后台能立即匹配 |
| **验收** | 页面 API 接口返回 500 时，主体区域显示错误提示而非白屏，侧栏可正常操作；点击「上报」后审计日志可查 |
| **状态** | ✅ |

---

### 任务 B01 — 实验列表管理页 UI 统一

| 字段 | 内容 |
|---|---|
| **目标** | `/console/settings/experiments` 页面使用 `ManagementPageFrame` 包裹 |
| **涉及文件** | `frontend/src/app/(dashboard)/console/settings/experiments/page.tsx` |
| **操作** | 1. 引入 `ManagementPageFrame` + `ManagementKpiCards` + `ManagementListToolbar`，参照 `experiment-manage` 风格重构<br>2. 空态使用 `EmptyPlaceholder` 组件 |
| **验收** | 1. 页面工具条、KPI、布局与 `experiment-manage` 风格一致<br>2. 空状态使用标准组件 |
| **状态** | ✅ |

### 任务 B02 — 积分与激励页 UI 统一

| 字段 | 内容 |
|---|---|
| **目标** | `/console/settings/incentives` 使用标准卡片框架 |
| **涉及文件** | `frontend/src/app/(dashboard)/console/settings/incentives/page.tsx` |
| **操作** | 1. 包裹 `ManagementPageFrame`，使用标准 `Card` + 语义色<br>2. 空态使用 `EmptyPlaceholder` 组件 |
| **验收** | 1. 页面卡片、字号、色板与母版一致<br>2. 空状态使用标准组件 |
| **状态** | ✅ |

### 任务 B03 — 小法庭页面 UI 统一

| 字段 | 内容 |
|---|---|
| **目标** | 教师端和管理端小法庭统一样式 |
| **涉及文件** | `frontend/src/app/(dashboard)/teacher/social/page.tsx`、`console/social/court/page.tsx` |
| **操作** | 1. 使用标准 Card、语义色、标准按钮规范<br>2. 空态使用 `EmptyPlaceholder` 组件<br>3. 危险操作（如删除判决）使用 Destructive Button + 二次确认 AlertDialog |
| **验收** | 1. 两页面视觉风格对齐母版<br>2. 危险操作有安全确认 |
| **状态** | ✅ |

### 任务 B04 — 教研组管理 UI 统一 + 通知组件检查

| 字段 | 内容 |
|---|---|
| **目标** | `/teacher/research-project-groups` 使用 `ManagementPageFrame`；检查通知组件挂载状态 |
| **涉及文件** | `frontend/src/app/(dashboard)/teacher/research-project-groups/page.tsx`、`dashboard-layout-client.tsx` |
| **操作** | 1. 包裹标准框架，对齐列表/工具条风格<br>2. 检查 `dashboard-layout-client.tsx` 中通知（`Bell`）组件是否已挂载<br>3. 空态使用 `EmptyPlaceholder` 组件 |
| **验收** | 1. 页面布局与母版一致<br>2. 通知入口在用户侧边栏可见或已知原因缺失（记录结果） |
|| **状态** | ✅ |

### 通知组件挂载检查结果

在 `dashboard-layout-client.tsx` 中搜索通知（`Bell`）组件：

- `Bell` 图标已 import（第 19 行：`import { Bell, ... } from "@bs-lab/ui/icons"`）。
- **`headerTrailingSlot` 被硬编码为 `null`**（第 397 行），因此 Bell 图标/通知下拉**未在顶栏渲染**。
- 通知入口目前仅存在于**用户头像 DropdownMenu 的菜单项**中（第 364 行：`<DropdownMenuItem onClick={() => router.push("/messages")}>消息</DropdownMenuItem>`），提供了跳转到 `/messages` 页面的入口，而非在顶栏显示独立的通知图标。
- **结论**：通知图标（`Bell`）已导入但**未挂载到顶栏布局槽位**；通知功能通过 DropdownMenu 的「消息」菜单项提供兜底入口。如需在顶栏显示独立通知下拉，需启用 `headerTrailingSlot` 并渲染通知组件。

---

### 任务 C01 — 运维面板批量 UI 统一 + 高危操作加强

| 字段 | 内容 |
|---|---|
| **目标** | 运维/配置类页面统一样式 + 危险/高危操作分级安全规范 |
| **涉及文件** | AI 配置、报告模板、运维概览、操作记录、缓存管理、数据导出、学校通知、数据一致性（约 8 页） |
| **操作** | 1. 统一使用 `DASHBOARD_MAIN_CONTAINER_CLASS` + 标准 `Card` + `border-border shadow-none`<br>2. **一般危险操作**（如删除单条记录）→ Destructive Button + `AlertDialog` 二次确认<br>3. **高危操作**（数据一致性修复、缓存清空等批量破坏性操作）→ 增加「输入确认」机制，需手动输入 `DELETE` 才可执行 |
| **验收** | 1. 运维页面视觉一致性提升<br>2. 一般危险操作有红色按钮 + 确认弹窗<br>3. 高危操作有输入确认（`DELETE` 文字） |
| **状态** | ✅ |

---

### 任务 X01 — 全站繁体字扫描

| 字段 | 内容 |
|---|---|
| **目标** | 确保全站 UI 文案无繁体字 |
| **扫描命令** | `rg "請|實|說|點|擊|關|閉|開|啟|資|料|圖|示|範|圍|錄|入|步|驟|選|擇|頁|麼|為|與|會|後|臺|審|核" frontend packages/ui` |
| **操作** | 扫描命中后改为简体；优先处理高频曝光位（按钮文字、导航栏、对话标题） |
| **状态** | ✅ |
| **后续建议** | 未来可在 ESLint 中添加繁体字正则校验插件，新代码检出繁体字即编辑器红线提示，避免每次审计手动扫描 |

### 任务 X02 — 实验主链路冒烟测试

| 字段 | 内容 |
|---|---|
| **目标** | 端到端验证实验创建→保存→预览→提交→审核→再编辑全链路 |
| **测试步骤** | 1. 教师身份创建实验 → 2. 保存草稿 → 3. 预览 → 4. 提交审核 → 5. 管理员审核通过/驳回 → 6. 教师收到驳回后修改 → 7. 再次提交 → 8. 管理员通过 → 9. 检查预览页 status 与 `rejectReason` 是否同步 |
| **关键验证点** | 后端 status 字段与 UI 标签一致；驳回原因在重新提交后正确消失 |
| **状态** | ✅ |
| **审计发现** | 发现驳回后重新提交流程中后端 status 未从 `n` 重置为 `t`（待审），导致审核队列不出现在驳回实验。已在 `v2-exp-draft-repository.ts` 的 `putExpMsgDraft` 中添加修复：当 `status === "n"` 时自动重置为 `'t'` 并清空 `reject_reason`、`confirm_*` 字段。 |

---

## 五、审校意见采纳记录

| 来源 | 建议 | 采纳 | 理由 |
|---|---|---|---|
| 架构审校 | A02 not-found.tsx 加入角色感知的智能引导 | ✅ **采纳** | 提升用户挫败感恢复体验 |
| 架构审校 | A03 检查通知推送/待办链路 | ✅ **采纳** | 在 B04 中检查通知组件是否挂载 |
| 架构审校 | 增加 Error Boundary（error.tsx） | ✅ **采纳** | 新增 A04 任务 |
| 架构审校 | A04 error.tsx 须为 "use client" + 一键上报 error.digest | ✅ **采纳** | Next.js 约束 + 内测崩溃可追踪 |
| 架构审校 | A03 驳回原因时效性（重新提交时清理旧驳回原因） | ✅ **采纳** | 已验证：后端 `reject_reason` 在 status = y 时自动置 null；前端 `persistListFields` 同步清理。A03 验收条件已补充 |
| UI 审校 | B/C 组空状态统一 | ✅ **采纳** | B 组统一使用 `EmptyPlaceholder` 组件 |
| UI 审校 | C 组危险操作语义色 + 二次确认 | ✅ **采纳** | C01 验收条件加强 |
| UI 审校 | C01 高危操作「输入确认」机制 | ✅ **部分采纳** | 仅限数据一致性、缓存管理等极端高危页面；一般运维页只需 AlertDialog |
| UI 审校 | X01 繁体字优先扫描高频曝光位 | ✅ **采纳** | 按钮、导航、标题优先 |
| UI 审校 | X02 冒烟测试增加「驳回→修改→再提交」全链路 | ✅ **采纳** | 已补充 X02 测试步骤 |
| UI 审校 | X01 繁体字扫描工具化（ESLint/pre-commit hook） | ⚠️ **暂不采纳** | 内测临近，加 pre-commit 可能引入 CI 噪音；已记入 X01 任务「后续建议」 |
| UI 审校 | 新建 CommonTableWrapper 封装层 | ❌ **不采纳** | `ManagementPageFrame` + `ManagementListToolbar` 已是现成抽象层；再加一层导致「封装套封装」，增加理解成本 |

---

## 六、执行优先级

```
第一优先级（内测阻塞 🔴）
  ├── A01  修复死链接（~2min）
  ├── A02  添加 404 智能引导页（~10min）
  ├── A03  确认驳回原因展示（~10min）
  └── A04  添加 Error Boundary + 一键上报（~10min）

第二优先级（UI 统一 🟠 P1）
  ├── B01  实验列表管理页（~20min）
  ├── B02  积分与激励页（~15min）
  ├── B03  小法庭页面（~20min）
  └── B04  教研组管理 + 通知检查（~15min）

第三优先级（低优先 🟢 P2）
  ├── C01  运维面板批量统一 + 高危操作加强（~35min）
  ├── X01  繁体字扫描（~5min）
  └── X02  全链路冒烟测试（~20min）
```

> **建议执行顺序**：A01 → A02 → A03 → A04 → B01 → B02 → B03 → B04 → C01 → X01 → X02
> 每个任务完成后回本文档标记对应 ⬜ 为 ✅。
