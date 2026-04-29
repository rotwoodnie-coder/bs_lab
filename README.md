# BS Lab（new-core）

本仓库为 Big Bang 重写基线：保留 UI 风格语言、重建前端壳层与后端领域/API/权限模型，并准备一次性迁移与回滚预案。

**代码托管：GitHub**（请向管理员索取本仓库地址并加入协作。）

## 致开发伙伴（可复制转发）

> 各位好，本项目在 **GitHub** 上多人协作开发，请先完成环境配置再开分支写代码。
>
> 1. **包管理器**：统一使用 **pnpm**，不要用 npm / yarn 安装依赖（避免 lock 冲突）。  
> 2. **Node**：建议使用 **20 LTS 或更高**，与团队对齐版本。  
> 3. **克隆后**：在仓库根目录执行 `pnpm install`；环境变量从 **`.env.example`** 复制为本地文件（勿提交密钥）。  
> 4. **协作**：从 `main`（或约定主干）拉 **feature 分支**，通过 **Pull Request** 合并；PR 需至少 **1 人 Review**。  
> 5. **详细约定**见本仓库根目录 **[CONTRIBUTING.md](./CONTRIBUTING.md)**。

---

## 仓库结构

| 路径 | 说明 |
|------|------|
| `docs/` | MVP 契约与运维类文档 |
| `database/` | 库表与迁移草案 |
| `backend/` | 工作流与权限相关 API（`new-core-backend`） |
| `frontend/` | 新 UI 壳层（`new-core-frontend`） |
| `packages/ui/` | 共享 UI 包 `@bs-lab/ui` |

## 环境要求

- **Node.js**：建议 **≥ 20**（与 CI/生产对齐，可在团队内再收紧小版本）。
- **pnpm**：**≥ 9**（推荐启用 [Corepack](https://nodejs.org/api/corepack.html)：`corepack enable`，按仓库锁定的 pnpm 版本安装依赖）。

请勿混用 `npm install` / `yarn install`，以免产生与 `pnpm-lock.yaml` 不一致的依赖树。

## 快速开始

在**仓库根目录**执行：

```bash
pnpm install
```

根目录脚本（示例）：

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 并行启动前端 + 后端开发服务 |
| `pnpm dev:fresh` | 释放 `4100` / `4200` 占用进程后，再执行 `pnpm dev`（强制重启） |
| `pnpm dev:frontend` | 启动前端开发服务 |
| `pnpm dev:backend` | 启动后端开发服务 |
| `pnpm typecheck` | 前后端 TypeScript 检查 |
| `pnpm build` | 构建前端 |

各子包内另有 `dev` / `build` / `typecheck` 等脚本，可用 `pnpm --filter <包名> run <脚本>` 单独执行。

## 环境变量

1. 参考根目录 **`.env.example`**，在本地创建 **`.env.local`**（或团队约定文件名）。  
2. **切勿**将真实密钥、Token、生产连接串提交到 Git。  
3. 前端示例变量：`NEXT_PUBLIC_NEW_CORE_API_BASE`；后端见 `.env.example` 中数据库、Redis、COS、AI 等配置项。

## GitHub 协作（摘要）

- **基线**：本仓库已从 Demo 原型阶段切换到正式团队开发阶段；当前 `main` 为团队开发主线与正式基线。  
- **历史快照**：Demo 阶段仅保留为 tag（例如 `demo-v1`），不再作为后续功能开发起点。  
- **分支**：所有新功能从 `main` 拉取 `feature/*`；修复使用 `fix/*`；如需发版再使用 `release/*`。  
- **合并**：一律通过 **Pull Request**；建议 PR 小而频，便于 Review。  
- **Review**：至少一名成员 Approve 后再合并（具体规则以团队为准）。  
- **Issue**：任务与缺陷尽量关联 Issue / Project，便于追溯。  

完整流程、PR 自检清单与提交说明见 **[CONTRIBUTING.md](./CONTRIBUTING.md)**。

## 数据联调规则（强制）

- 当业务模块数据库表已建立并可访问（例如教学维度主库 `data_school_level` / `data_school_grade` / `data_school_subject` / `data_school_grade_subject`，迁移见 `database/migrations/0024_*.sql`）后，前端页面必须使用真实 API 数据源。
- 禁止在生产页面保留 `mock -> api` 运行时分支、localStorage seed、内存 mock store 作为主数据源。
- 接口失败时仅允许展示错误态与重试，不允许自动回退到 mock 数据。
- 测试数据仅允许出现在测试代码或 fixtures 中，不得进入业务页面运行态。
- **正式开发阶段禁止将「原有 / 旧版 / 迁移前」数据库作为正式运行数据源**（默认连接、日常联调、功能交付均不得依赖原库）；对原库仅允许 **只读排查**（对照数据、迁移差异、事故调查等），排查结束后不得固化为常态化路径。
- 本规则与 `.cursor/rules/no-mock-after-db-established.mdc`、`.cursor/rules/no-legacy-db-for-formal-dev.mdc` 保持一致，提交前需自检。

## 相关文档

- `docs/` 目录内设计与契约文档  
- `frontend/README.md`、`backend/README.md`（若存在子项目说明）

## 媒体中台本地验收（无用户 / 联调）

| 检查项 | 说明 |
|--------|------|
| 数据库 | 已执行 `database/migrations/0004_media_platform_init.sql`（及按需 `0006`）；`MEDIA_USE_MYSQL=1` 且配置 `DB_*` |
| 本地文件与拉流 | `MEDIA_LOCAL_UPLOAD_ROOT` 指向目录中存在与 `storage_key` 一致的文件；`GET /v1/media/stream/{registryId}` 可返回二进制 |
| 引用计数 | `MEDIA_USE_MYSQL=1` 时创建/删除引用后 `sys_media_assets.ref_count` 与预期一致（同事务更新） |
| 主体键 | 请求头 `x-subject-key`（前端 `NEXT_PUBLIC_MEDIA_SUBJECT_KEY`）与 `sys_media_scopes.subject_key` 可匹配 |
| 异步缩略图 | `MEDIA_USE_MYSQL=1` 且开启 `MEDIA_BACKGROUND_LOOP_MS` 或等待定时任务，`sys_media_jobs`/`sys_media_derivatives` 出现 SUCCESS |
| 治理清理 | `POST /v1/media/governance/cleanup`（需 MYSQL）对 7 天前零引用资源标为 `PENDING_DELETE` |

---

## Structure (EN)

- `docs/`: frozen MVP contracts and operational docs.  
- `database/`: schema and migration drafts.  
- `backend/`: core workflow and permission-centric API skeleton.  
- `frontend/`: new UI shell wired to new API contract.

### 前端：门户 / 管理台双模与导航

- **视图模式**：`portal`（统一学习入口）与 `management`（按角色工作台）。状态由 `frontend/src/context/app-mode-context.tsx` 管理，持久化键为 **`bs_lab_view_mode`**（并兼容迁移旧键 `bs-lab-app-view-mode`）。学生/家长默认门户，教师、教研员与管理员默认管理台（与身份模拟器 `sessionStorage` 对齐）。  
- **导航矩阵**：`frontend/src/config/nav-config.ts` 中的 **`NAV_CONFIG[角色][模式]`** 定义侧栏主导航；仪表盘布局在 `frontend/src/components/layout/dashboard-layout-client.tsx` 中按当前模式与角色渲染。
