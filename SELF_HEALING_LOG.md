# SELF_HEALING_LOG

> 目的：记录由 `SystemLogService` 产生的告警（特征码：`[SENTINEL_ISSUE]`），并基于 `CURRENT_SYSTEM_STATE.md` 进行归因分析。
>
> 使用方式：每次在 `sys_log` / 控制台 / 哨兵反馈中发现新的 `[SENTINEL_ISSUE]` 告警时，补充一条记录。

---

## 归因规则

根据 `CURRENT_SYSTEM_STATE.md` 的系统边界，将每条告警优先归类为以下三种之一：

1. **环境配置问题**
   - 典型特征：缺少环境变量、数据库连接失败、对象存储地址错误、CORS/COOKIE 域不匹配、Secret 配置缺失。
   - 参考架构定义：
     - `backend/src/lib/auth/v2-session.ts`
     - `backend/src/http/server.ts`
     - `backend/src/infrastructure/storage/s3-storage.ts`

2. **权限越权问题**
   - 典型特征：`classId` / `orgId` / `roleId` 被篡改、跨组织绑定、删除非授权子树、教师/管理员越权访问。
   - 参考架构定义：
     - `backend/src/services/TeacherClassService.ts`
     - `backend/src/infrastructure/repositories/v2-sys-org-repository.ts`
     - `backend/src/lib/auth/permission-guard.ts`

3. **逻辑 Bug**
   - 典型特征：状态机断裂、事务回滚遗漏、空指针、重复提交、幂等性错误、前后端状态不一致。
   - 参考架构定义：
     - `CURRENT_SYSTEM_STATE.md` 中的“数据锁定与一致性机制”“授权链路”“认证链路”章节

---

## 记录格式

每条新告警请按以下格式追加：

### [时间戳] [SENTINEL_ISSUE] <简要标题>

- **来源**：`sys_log` / 控制台 / 前端哨兵 / 后端哨兵
- **特征码**：`[SENTINEL_ISSUE]`
- **错误堆栈**：
  ```text
  <stack trace>
  ```
- **上下文**：
  - 当前页面 / API / 操作：
  - 当前用户角色：
  - 目标对象：
  - 触发条件：
- **归因分析**：
  - 分类：环境配置问题 / 权限越权问题 / 逻辑 Bug
  - 依据：对照 `CURRENT_SYSTEM_STATE.md` 的哪一项架构定义
  - 结论：
- **处理建议**：
  - 是否阻断上线：是 / 否
  - 是否需要回滚：是 / 否
  - 建议修复路径：

---

## 当前记录

> 暂无记录。

