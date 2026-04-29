# 登录闭环执行计划与状态记录（V2）

> 目的：用一份可持续更新的本地文件，记录“做什么、做到哪、下一步是什么、阻塞点是什么”，保证随时可从暂停处继续开发。
>
> 配套设计文档：`docs/auth/02-login-session-closed-loop.md`

## 0. 当前状态（手工维护）

- **状态**：已可登录并进入页面，继续推进 A5/A7
- **最后更新**：2026-04-23
- **当前分支**：未记录
- **阻塞点**：无
- **备注**：
  - 已在后端实现 Cookie Session（access/refresh）与 `refresh/logout/profile`，下一步请先按“验证清单”进行人工验证，通过后再继续做 A4/A5（Actor 注入与前端 401 自动刷新）。
  - 若数据库未配置 `sys_user_role`，内置 `admin` 账号会在登录时临时兜底赋予 `system_admin` 角色（仅用于开发期快速联调）。

### 本次已完成内容（自动记录）

- ✅ A1：新增 token/cookie 工具（`backend/src/lib/auth/v2-session.ts`）
- ✅ A2：新增 `POST /v2/auth/refresh`、`POST /v2/auth/logout`
- ✅ A3：`POST /v2/auth/login` 写入 cookie，并选择 org/role 上下文；`GET /v2/auth/profile` 改为从 cookie 识别登录态

### 待你验证的清单（通过后再继续）

- **登录写 cookie**：调用 `POST /v2/auth/login` 后，响应头包含两个 `Set-Cookie`（`v2_access_token`、`v2_refresh_token`）
- **profile 仅认 cookie**：不带 cookie 的 `GET /v2/auth/profile` 返回 401；带 cookie 返回 200（已通过 ✅）
- **refresh 可续期**：调用 `POST /v2/auth/refresh` 返回 200 且再次下发 `Set-Cookie`（你已验证接口返回 `{ message: "ok" }` ✅）
- **logout 失效**：调用 `POST /v2/auth/logout` 后，`GET /v2/auth/profile` 返回 401

---

## 1. 阶段 A：打通“安全登录闭环”（最小可运行）

### A1. 后端：新增 token/cookie 工具（access + refresh）

- **状态**：已完成
- **产出**：
  - `access_token`（15 分钟）与 `refresh_token`（7–30 天）签发/验证
  - cookie 写入/清除策略（HttpOnly/SameSite/Secure）
- **验收**：
  - 本地能签发 token，能验证 exp

### A2. 后端：实现 `POST /v2/auth/refresh` 与 `POST /v2/auth/logout`

- **状态**：已完成
- **产出**：
  - `POST /v2/auth/refresh`：refresh → 新 access（可选新 refresh）
  - `POST /v2/auth/logout`：清 cookie（如实现 refresh 存储则同时撤销）
- **验收**：
  - refresh 成功后能继续访问 profile
  - logout 后 profile 401

### A3. 后端：改造 `POST /v2/auth/login`（写 cookie + 角色组织上下文）

- **状态**：已完成
- **要点**：
  - `sys_user.status` 按 `Y/N` 校验（兼容 `UPPER(status)`）
  - 从 `sys_user_role` + `data_role` 选默认上下文（`current_org_id/current_role_id`）
  - 返回 `available_contexts` 与 `permissions`
- **验收**：
  - 登录后浏览器持有 cookie
  - profile 不需要 `x-user-id` 也能成功

### A4. 后端入口：Actor 注入（不再信任客户端 `x-user-id`）

- **状态**：已实现（建议补安全验证）
- **产出**：
  - 在 `backend/src/http/server.ts` 解析 cookie → 验证 access → 注入 `x-user-id/x-org-id/x-role/...`
  - 增加开发开关：允许在开发环境临时透传 `x-user-id`（默认关闭）
- **验收**：
  - 不带 cookie，仅带 `x-user-id` 请求 profile → 401（开关关闭时）

### A5. 前端：统一请求层（401 refresh + retry）

- **状态**：已实现（Cookie include），401 refresh/retry 待增强
- **产出**：
  - 已在全部 `frontend/src/lib/v2/*` 请求中默认 `credentials: "include"`，确保 Cookie Session 生效
  - 401 → refresh → 重试一次 → 失败则触发全局登出
- **验收**：
  - 人为让 access 过期后，页面能自动恢复

### A6. 前端：useAuth 真源切换为 `GET /v2/auth/profile`

- **状态**：已实现（待验证）
- **要点**：
  - 不再依赖 `localStorage userId` 作为鉴权真源
  - 登录页成功后仅做 UI 跳转，用户信息以 profile 为准
- **验收**：
  - 刷新页面仍处于登录态

### A7. 前端：跨 Tab 同步退出

- **状态**：待开始
- **产出**：
  - `BroadcastChannel("auth")`（或 storage event）广播 `logout`
- **验收**：
  - A Tab 退出，B Tab 立即回登录页

---

## 2. 阶段 B：体验与运维增强（可选）

### B1. refresh 轮换与撤销存储（单机 → Redis）

- **状态**：待开始
- **验收**：
  - refresh 重放攻击可被抑制（旧 refresh 失效）
  - 多实例部署可用（Redis）

### B2. 切换上下文（组织/角色）

- **状态**：待开始
- **产出**：
  - `POST /v2/auth/switch-context`
  - 前端提供“切换组织/角色”入口
- **验收**：
  - 切换后权限即时生效

### B3. 权限变更生效策略

- **状态**：待开始
- **验收**：
  - 管理端改权限后，用户在合理时间内刷新/重登后生效（或主动 revalidate）

---

## 3. 断点续做指南（每次恢复开发先做这些）

- **检查后端接口**：`/v2/auth/login`、`/v2/auth/profile`、`/v2/auth/refresh`、`/v2/auth/logout`
- **检查 cookie 行为**：浏览器 Application → Cookies 是否写入、是否 HttpOnly、SameSite 是否符合预期
- **检查 401 流程**：任意 API 401 是否会触发 refresh 与重试
- **检查安全回归**：关闭开发开关时，header 伪造不得通过

