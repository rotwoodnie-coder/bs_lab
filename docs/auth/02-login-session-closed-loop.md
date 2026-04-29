# 登录闭环（可落地）设计文档（V2）

## 1. 背景与问题

当前 V2 登录链路（`POST /v2/auth/login` + `GET /v2/auth/profile`）存在以下结构性缺口：

- **缺少服务端可验证会话**：前端仅在 `localStorage` 保存 `userId`，请求通过 `x-user-id` 透传；后端多数路由直接信任该头。
- **无法形成登出/过期/续期闭环**：没有 access/refresh、没有会话撤销，无法做到“登出立即失效”“过期后自动续期或强制重新登录”。
- **存在可伪造身份风险**：只要知道 `userId` 即可伪造 `x-user-id` 获取 `profile`（以及潜在的其他资源）。
- **角色/组织模型不清**：`sys_user.user_role_id` 与 `sys_user_role (user_id, role_id, org_id)` 并存，若要支持多角色/跨组织，需要明确“会话上下文”的来源与切换策略。

本设计目标是在**不修改数据库 schema** 的前提下，补齐“登录 → 会话维持 → 鉴权 → 退出 → 过期/刷新 → 前后端状态一致”的闭环，并尽量**最小化对既有业务路由的影响**。

---

## 2. 目标与验收标准

### 2.1 目标

- **可验证会话**：后端可验证请求方身份，前端不能仅靠 `x-user-id` 伪造身份。
- **闭环一致性**：
  - 登录成功后刷新页面仍保持登录态（直到过期/退出）。
  - access 过期后自动刷新一次并重试原请求。
  - 刷新失败则统一回到未登录并跳转登录页。
  - 退出后所有 Tab 立即变为未登录，且服务端凭据失效。
- **上下文明确**：登录后明确“当前组织/当前角色（以及权限集）”，并支持后续切换上下文（可选能力）。

### 2.2 验收用例（最小集）

- **登录**：正确账号密码 → 返回用户信息；随后 `GET /v2/auth/profile` 成功。
- **刷新保持**：刷新浏览器页面 → 仍能拿到 profile（无需 `localStorage userId`）。
- **过期刷新**：access 过期 → 任意 API 首次 401 → 自动 refresh → 原请求成功。
- **退出失效**：点击退出 → cookie 被清除，随后的 `GET /v2/auth/profile` 返回 401；其他 Tab 同步退出。
- **伪造头失败**：不带 cookie，仅带 `x-user-id` 请求 profile → 401（开发模式开关除外）。

---

## 3. 角色/组织与权限模型（对齐三张表）

### 3.1 基础表

- `data_role`：系统角色基础数据（初始化，不可修改），关键字段：
  - `role_id`（主键）、`role_name`、`status`（Y/N）、`sort_order`
- `sys_user`：人员信息与登录凭据，关键字段：
  - `user_id`、`login_name`、`login_pwd`、`status`（Y/N）、`expire_date`、`user_org_id`、`user_role_id`
- `sys_user_role`：人员-角色-组织关系（多对多）：
  - `user_id`、`role_id`、`org_id`

### 3.2 会话“上下文”（推荐以 `sys_user_role` 为真源）

一个已登录会话必须包含：

- `user_id`
- `current_org_id`
- `current_role_id`
- `permissions`（由 `current_role_id` 解析）

选择策略：

- 登录成功后：
  - 若前端提供 `org_id + role_id`（用户在登录页选择）→ 服务端校验该组合属于该用户 → 作为默认上下文
  - 否则从 `sys_user_role` 中选择：
    - 优先与 `sys_user.user_org_id` 相同的 `org_id`
    - 再按 `data_role.sort_order` 升序取第一条启用角色

> 说明：`sys_user.user_org_id/user_role_id` 可视为“默认值/单一旧模型兼容字段”；运行态以 `sys_user_role` 为准，避免后续扩展时再次推倒重来。

---

## 4. 会话方案（推荐：Cookie + Access/Refresh）

### 4.1 Token 类型

- **Access Token（短期）**：用于每次请求鉴权，建议 15 分钟。
- **Refresh Token（长期）**：用于 access 过期续期，建议 7–30 天，建议启用“轮换刷新”（refresh 成功即签发新 refresh，旧 refresh 失效）。

### 4.2 Cookie 策略

两者均存入 Cookie：

- `HttpOnly`：前端 JS 不可读，降低 XSS 直接窃取风险
- `Secure`：生产必须开启
- `SameSite`：根据部署形态选择：
  - 同站点（同域或同站点子域）优先 `Lax`
  - 跨站点（前后端不同站点）使用 `None; Secure`，并配置 CORS `allow-credentials`
- `Path=/`，并根据需要设置 `Domain`

前端 fetch 统一带 `credentials: "include"`。

---

## 5. 后端接口设计（V2）

统一响应 Envelope（沿用现有 `{ success, data, error }`）。

### 5.1 登录

`POST /v2/auth/login`

- **请求**：
  - `login_name`（前端 camelCase：`loginName`）
  - `login_pwd`（前端 camelCase：`loginPwd`）
  - 可选：`org_id`、`role_id`（用于选择默认上下文）
- **处理**：
  1. 校验 `sys_user`：
     - `login_name` 命中且 `is_deleted=0`
     - `UPPER(status)='Y'`
     - `expire_date` 未过期
     - `login_pwd` 校验
  2. 加载可用上下文：查询 `sys_user_role`，关联 `data_role` 过滤启用角色
  3. 选择默认上下文（见 3.2）
  4. 计算权限集：`permissions = resolvePermissionCodes(current_role_id)`
  5. `Set-Cookie` 写入 `access_token`、`refresh_token`
  6. 更新 `last_login_time`
- **响应 data（建议）**：
  - `user_id/user_name/login_name/user_logo/per_score`
  - `current_org_id/current_role_id`
  - `org_name/role_name`（可选）
  - `permissions: string[]`
  - `available_contexts: { org_id; role_id; org_name?; role_name? }[]`

### 5.2 取当前会话用户信息

`GET /v2/auth/profile`

- **认证**：必须基于 access token（Cookie），后端从 token 解出 `user_id/current_org_id/current_role_id`。
- **响应**：返回安全字段（与现有 `V2AuthProfile` 保持一致），附加：
  - `permissions`
  - `current_org_id/current_role_id`
  - `available_contexts`

### 5.3 刷新

`POST /v2/auth/refresh`

- **认证**：refresh token（Cookie）
- **行为**：签发新 access（与可选的新 refresh），写回 cookie
- **失败**：401（前端收到即视为未登录）

### 5.4 退出

`POST /v2/auth/logout`

- **行为**：
  - 使 refresh 失效（若实现 refresh 存储/轮换）
  - 清除 cookie（`Set-Cookie` 过期）

### 5.5（可选）切换上下文

`POST /v2/auth/switch-context`

- **请求**：`org_id`、`role_id`
- **校验**：该组合必须存在于 `sys_user_role`（且 `data_role.status='Y'`）
- **行为**：更新会话上下文并重签发 access（与可选 refresh 轮换）

---

## 6. 后端实现落点（最小侵入改造策略）

### 6.1 “不再信任客户端 x-user-id”的迁移策略

为避免一次性改动所有业务路由，推荐在 `backend/src/http/server.ts` 入口做一层 **Actor 注入**：

- 对所有非公开路由：
  - 从 Cookie 验证 access token，解析出 `user_id/current_org_id/current_role_id`
  - 将解析出的值写入转发 Request 的 headers（例如 `x-user-id/x-org-id/x-role/...`）
  - 业务路由继续读 `x-user-id`，但该头由服务端注入，不再由客户端可信输入
- 仅在开发联调允许的情况下（通过显式环境变量开关）才允许客户端指定 `x-user-id`

### 6.2 Token 实现建议（不新增依赖）

使用 Node 内置 `crypto` 进行 HMAC-SHA256 签名，token payload 建议最小化：

- `sub`：`user_id`
- `org_id`、`role_id`
- `iat`、`exp`
- `sid`（会话 id，用于 refresh 轮换/撤销）

Refresh 存储建议：

- 阶段 1：单机内存 Map（满足闭环与本地开发）
- 阶段 2：Redis（多实例部署必需）

---

## 7. 前端实现落点（闭环关键）

### 7.1 useAuth 启动策略

将登录态真源从 `localStorage.userId` 切换为：

- 启动即请求 `GET /v2/auth/profile`（`credentials: include`）
- 成功 → 进入 authenticated
- 失败（401）→ 进入 unauthenticated（跳转登录页）

### 7.2 统一请求层（401 自动刷新 + 重试）

实现一个 `coreFetch`/`v2Fetch`：

- 默认 `credentials: "include"`
- 若响应 401：
  - 调一次 `POST /v2/auth/refresh`
  - refresh 成功 → 重放原请求一次
  - 仍失败 → 触发全局登出（清 UI 状态 + 跳 `/login`）

### 7.3 跨 Tab 同步登出

- 使用 `BroadcastChannel("auth")`（或 `storage` 事件）广播 `logout`
- 其他 Tab 收到后立即刷新 auth 状态并跳转登录页

---

## 8. 边界场景清单（必须覆盖）

- **账号停用/过期**：刷新时 profile 返回 401 或特定错误码 → 强制登出
- **角色被停用**：`data_role.status='N'` 时不应出现在可选上下文中；若当前会话角色被停用，下一次 profile/refresh 应拒绝并要求重新选择上下文或重新登录
- **权限变更**：建议 profile 缓存短 TTL，或关键操作前 revalidate
- **CORS + Cookie**：若前后端跨站点，必须：
  - 后端 `access-control-allow-origin` 不能是 `*`，需回显具体 origin
  - `access-control-allow-credentials: true`
  - 前端 `credentials: include`

---

## 9. 迁移计划（与执行状态记录配套）

执行计划与当前进度请见：

- `docs/auth/02-login-session-closed-loop.plan.md`

