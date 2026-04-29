# 协作指南（GitHub）

本文约定本仓库在 **GitHub** 上多人开发时的流程与自检项。若与团队内部规范冲突，以团队最新约定为准。

## 1. 环境与安装

1. 安装 **Node.js**（建议 20+），并启用 **Corepack**：  
   `corepack enable`
2. 在仓库**根目录**仅使用 **pnpm** 安装依赖：  
   `pnpm install`  
   - 使用 **`pnpm-lock.yaml`** 保证依赖一致；提交 PR 时若变更依赖，请一并更新 lockfile。  
   - CI 建议使用：`pnpm install --frozen-lockfile`
3. 复制 **`.env.example`** 为本地环境文件（命名以团队为准，如 `.env.local`），**不要**把密钥推送到远程。

## 2. 分支与提交

- **主干**：默认以 `main` 为正式开发主线与团队基线。  
- **功能分支**：`feature/功能简述`（或 `feat/功能简述`）、`fix/issue-编号-简述` 等，避免直接在主干上长期开发。  
- **历史阶段**：Demo 原型阶段以 tag 保留（例如 `demo-v1`），不再作为后续开发起点。  
- **提交信息**：建议清晰说明「做了什么」；可选 [Conventional Commits](https://www.conventionalcommits.org/)（如 `feat:`, `fix:`），便于生成变更日志。

## 3. Pull Request（PR）

1. **开 PR 前**  
   - 本地执行：`pnpm typecheck`（以及子包 `lint` / `test`，若已配置）。  
   - 解决合并冲突，保持与目标分支同步。  
2. **PR 描述**建议包含：  
   - 背景 / 关联 Issue 编号  
   - 改动摘要与风险点  
   - 截图或录屏（UI 变更时）  
3. **Review**  
   - 至少 **1 名**成员 Code Review 通过后再合并。  
   - 对架构或安全敏感改动，可提高 Review 人数要求。  
4. **合并策略**  
   - 由维护者选择 merge / squash merge；保持主干历史可读。

## 4. 依赖与 monorepo

- 本仓库为 **pnpm workspace**，子包见 `pnpm-workspace.yaml`。  
- 新增共享代码优先放入 `packages/*`（如 `@bs-lab/ui`），避免在 `frontend` / `backend` 间复制粘贴。  
- 为某子包添加依赖时，在该子包目录下使用：  
  `pnpm add <pkg>` （或在根目录使用 `pnpm --filter <包名> add <pkg>`）

## 5. 安全与密钥

- **禁止**将 `.env`、密钥、证书、生产数据库 URL 提交到仓库。  
- 若误提交敏感信息，须立即轮换密钥，并按 GitHub 指引处理历史记录。

## 5.1 原库与正式开发（强制）

- **正式开发阶段**不得将「原有 / 旧版 / 迁移前」数据库作为日常开发、联调或功能交付的默认数据源。  
- 连接原库 **仅允许**用于排查（只读对照、迁移差异、事故调查等），且不得把该路径固化为团队默认流程。  
- 细则与自检项见仓库根目录 `README.md`「数据联调规则」及 `.cursor/rules/no-legacy-db-for-formal-dev.mdc`。

## 5.2 数据库结构真源（SQL 基线）

- **谁说了算**：以 `database/baseline/README.md` 中 **「当前快照」** 表为准。当前 **`bs_exp_data`** 全库 DDL 基线为 **`database/migrations/bs_exp_data.sql`**（与新人空库建表共用）；增量变更仍用 **`0024_*.sql` / `00NN_*.sql`** 等编号迁移，**不要把 `bs_exp_data.sql` 配进「每次部署自动执行全目录 SQL」**（内含 `DROP TABLE`）。  
- **怎么做**：更新基线时重新导出替换 `bs_exp_data.sql`，并 **同一 PR** 更新受影响的 repository / API / 前端类型；若另有 Navicat 目录快照，同步更新 README 与 `database/schema.sql` 索引——详见 **`database/baseline/README.md`**。  
- **AI/本地规则**：`.cursor/rules/db-schema-drives-ui.mdc` 与上述 README 一致。

## 6. Issue与讨论

- 需求、缺陷、技术讨论尽量使用 **GitHub Issues**（或 Discussions），便于新人检索与追溯。  
- 大改动可先开 Issue 或设计文档，再动代码，减少返工。

## 7. 后续建议（可选）

团队可按需补充：

- `.github/workflows/`：PR 上自动 `typecheck` / `lint` / `test`  
- `pull_request_template.md`：统一 PR 模板  
- `CODEOWNERS`：指定目录默认 Reviewer  

---

如有疑问，请在仓库 Issues 中 @ 维护者或在团队频道沟通。
