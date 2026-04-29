# IAM 去 Mock 执行清单（V1）

> 目标：以“数据库真源 + 后端 API + 前端接入 + 关闭运行时 mock 回退”为主线，分阶段完成上线替换。

---

## 总览状态

| 任务 ID | 阶段 | 目标 | 当前状态 | 备注 |
|---|---|---|---|---|
| T0 | 基线冻结 | IAM 库结构与验收脚本冻结 | 已完成 | 0021/0022/0023 + PASS 校验已通过 |
| T1 | 上下文接入 | 真实用户/组织/任职上下文联通 | 进行中 | 后端 IAM 上下文接口已落地，前端 useAuth 已接入 `/v1/iam/me` |
| T2 | 组织与用户去 Mock | `users/organizations` 改真实 API | 进行中 | T2-1（users）后端+前端接口替换已完成，待联调验收 |
| T3 | 学科任教与学籍 | `subject_posts + enrollments + 升班事务` 接口联调 | 未开始 | 依赖 T2 |
| T4 | 实验管理主链去 Mock | `experiment-mgmt` / 评审 / 编辑器 bootstrap | 未开始 | 依赖 T3 |
| T5 | 收口上线 | 删除运行时 mock + 回归 + 监控 | 未开始 | 最终门禁 |

---

## T1 详细拆解（真实 IAM 上下文最小闭环）

### T1-1 后端接口（已完成）

- [x] 新增 `GET /v1/iam/me`：返回当前用户、主任职与任职列表。
- [x] 新增 `GET /v1/iam/my-posts`：返回当前用户有效任职。
- [x] 新增 `GET /v1/iam/org-tree`：返回当前用户可见组织树（基于闭包 + 任职）。
- [x] 服务注册：`backend/src/http/server.ts` 挂载 `routeIam()`。
- [x] 权限策略补齐：`iam:read`。

### T1-2 前端接入（已完成）

- [x] `frontend/src/hooks/use-auth.ts` 从固定 mock 用户切换为请求 `/v1/iam/me`。
- [x] 支持通过 `NEXT_PUBLIC_IAM_BOOTSTRAP_*` 头信息作为联调主体。

### T1-3 待你本地联调验证（进行中）

- [ ] 使用 `admin`（seed）验证 `/v1/iam/me` 返回正常。
- [ ] 切换至少一个非 admin 身份验证组织树差异。
- [ ] 前端进入实验管理页，确认 `useAuth` 不再依赖本地常量 mock。

---

## 下一阶段（T2）预告

1. `console/system/users`：替换 `mock-service` 到真实 API。  
   - [x] 后端接口：`GET /v1/iam/users`、`GET /v1/iam/users/:id`、`POST /v1/iam/users`、`PATCH /v1/iam/users/:id`、`PATCH /v1/iam/users:batch-status`  
   - [x] 前端服务：`frontend/src/lib/console/users/mock-service.ts` 已切换到真实 IAM API 调用  
   - [ ] 联调验收：新增/编辑/批量冻结三条链路回读通过  
2. `console/system/organizations`：替换组织树和节点操作到真实 API。  
3. 移除对应页面运行时 mock 回退分支。

---

## 变更记录

| 日期 | 变更 |
|---|---|
| 2026-04-20 | 初始化任务清单；启动 T1；记录 IAM 上下文接口与 useAuth 首轮接入完成。 |
| 2026-04-20 | 启动 T2-1：users 去 mock，完成后端用户管理 API 与前端数据源替换，进入联调验收。 |

