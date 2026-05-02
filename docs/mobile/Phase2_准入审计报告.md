# Phase 2 准入审计报告

审计范围：根据 `mobile-development-roadmap.md` 的 Phase 1 清单，对 Phase 2 启动前的基础设施、鉴权、Mock、硬性约束进行准入检查。

## 1. 数据库迁移文件

### 结论
通过。

### 检查结果
- `database/migrations/0060_mobile_parent_views.sql` 存在。
- 文件首行是 `DROP VIEW IF EXISTS`。
- 已定义 `v_active_parent_children`，并通过 `WHERE r.audit_status = 'Y'` 过滤有效绑定。
- 已定义 `v_user_school_stage`，链路为 `sys_user -> sys_org -> data_school_grade -> data_school_level`，学段关联完整。

### 风险备注
- 视图依赖 `sys_org.grade_id` 非空时才能完整推导学段；若某些组织节点未挂年级，查询结果会为空。

---

## 2. 移动端中间件

### 结论
通过。

### 检查结果
- `frontend/src/middleware.ts` 中存在 `/m` 路由守卫。
- 白名单包含 `/m/login` 与 `/m/bind/child`。
- 逻辑上已避免死循环：
  - 未登录访问 `/m/**` 会跳转到 `/m/login`。
  - 已登录家长且 `has_binding=false` 才会跳转到 `/m/bind/child`。
  - 白名单页本身不再触发绑定检查。

### 死循环模拟结论
- 未登录 → `/m` → `/m/login`：首次跳转成立。
- 登录后若是家长且无绑定，会进入 `/m/bind/child`。
- `/m/login` 与 `/m/bind/child` 都已白名单放行，不会再被重复踢回，因此不存在明显无限重定向回环。

---

## 3. JWT 签发字段扩展

### 结论
通过。

### 检查结果
- `backend/src/lib/auth/v2-session.ts` 的 payload 类型已包含：
  - `has_binding`
  - `school_level_id`
- `createV2SessionTokens` 已在 access / refresh payload 中写入这两个字段。
- `rotateV2RefreshTokens` 已同步补齐这两个字段。
- `backend/src/http/routes/v2-auth.ts` 登录逻辑中已通过视图读取上下文：
  - `has_binding` 来源于 `v_active_parent_children`
  - `school_level_id` 来源于 `v_user_school_stage`
- `/refresh` 与 `/switch-role` 仍复用会话签发逻辑，能返回最新 payload。

### 规则符合性
- 已遵守“只能走视图”的要求。
- 未发现直查 `sys_parent_student_rel` 或 `sys_org` 的新增逻辑用于该字段。

---

## 4. Mock Server

### 结论
通过。

### 检查结果
- `frontend/src/mocks/` 目录已存在。
- 已覆盖计划中的 6 个接口：
  - `GET /api/bindings`
  - `GET /api/user/context`
  - `POST /api/bind/apply`
  - `POST /api/auth/login`（或等效登录接口）
  - `GET /api/video/:id`
  - `POST /api/quiz/submitAnswer`
- 绑定 Mock 数据已按 `audit_status='Y'` 的约束模拟，仅返回有效绑定。

### 风险备注
- 目前 Mock 以静态样例数据为主，上线前需再对齐真实字段命名和返回结构。

---

## 5. 硬性约束遵守情况

### 结论
通过。

### 检查结果
- 全项目未发现新增的直接查询 `sys_parent_student_rel` 用于绑定查询的实现；绑定查询已切换为视图链路。
- 未发现对 `sys_user` 新增绑定或学段字段的 `ALTER TABLE` 语句。
- 移动端相关实现遵循了零侵入原则，没有新增数据库修改脚本。

### 备注
- `v2-auth.ts` 仍保留若干用户主档查询用于登录与 profile 场景，这不属于绑定真源违规。

---

## 6. 总体判定

### 结论
**Phase 2 准入通过，可以开始 UI 开发。**

### Go / No-Go
- **Go**
