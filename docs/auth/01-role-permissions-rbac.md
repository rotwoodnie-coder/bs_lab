# 角色权限管理规范（基于现有数据库结构）

## 1. 目标

本规范用于统一项目中的认证与授权实现，确保：

- 不新增、不修改现有数据库结构
- 不在业务代码中直接判断角色名
- 不在 SQL 中拼接权限校验逻辑
- 所有权限判断统一走 `can(user, permission)`
- 角色与权限的映射只允许在配置文件中调整，业务逻辑不随角色变化而变化
- 管理员撤销权限后能够实时生效

本规范适用于后端 API 校验、前端 UI 渲染、路由访问控制和审计记录。

---

## 2. 数据库基线与可用能力

权限体系必须完全基于当前数据库结构实现，不能新增表或改表字段。当前可用的关键表如下：

### 2.1 用户与认证

- `sys_user`
  - `login_name`：登录名
  - `login_pwd`：登录密码哈希
  - `status`：账号状态
  - `expire_date`：账号有效期
  - `is_deleted`：逻辑删除标记
  - `last_login_time`：最后登录时间
  - `user_org_id`：所属组织
  - `user_role_id`：主角色

### 2.2 角色与授权

- `data_role`
  - 角色基础字典
- `sys_user_role`
  - 用户-角色关联关系

### 2.3 组织与数据范围

- `sys_org`
  - 组织树、父子层级、组织路径、组织类型

### 2.4 审计与消息

- `sys_log`
  - 操作日志
- `sys_msg`
  - 系统通知

---

## 3. 总体设计原则

### 3.1 会话方案

统一使用 **Session** 作为登录会话方案。

原因：

- 不新增黑名单表时，纯 JWT 无法可靠实现“后台强制下线某个老师”
- 教育系统中管理员撤销权限必须实时生效
- Session 便于立刻失效、登出、踢下线和权限变更同步

### 3.2 授权方案

统一使用 **权限点驱动**，而不是角色名驱动。

正确方式：

```ts
if (!can(session.user, PERMISSIONS.TASK_GRADE)) {
  throw new Error("权限不足，无法批改");
}
```

错误方式：

```ts
if (user.role === 'TEACHER') {
  // ...
}
```

### 3.3 单一事实源

权限定义只允许存在一个核心文件：

- `frontend/src/lib/auth/role-permissions.ts`

该文件负责：

1. 定义权限常量 `PERMISSIONS`
2. 定义角色与权限映射 `ROLE_PERMISSIONS_MAP`
3. 定义统一判定函数 `can()`

后续如果补权限表，只修改该文件的 Loader 逻辑，业务代码无需改动。

---

## 4. 权限建模方式

### 4.1 权限点定义原则

权限点应以“动作”或“业务能力”为单位，而不是页面名。

推荐命名：

- `EXP_VIEW`：查看实验
- `EXP_CREATE`：新建实验
- `EXP_EDIT`：编辑实验
- `EXP_DELETE`：删除实验
- `EXP_PUBLISH`：发布实验
- `TASK_GRADE`：批改作业
- `QUESTION_CREATE`：新建题目
- `QUESTION_AUDIT`：审核题目
- `USER_MANAGE`：用户管理
- `ROLE_MANAGE`：角色管理
- `ORG_MANAGE`：组织管理
- `SYSTEM_DICT_WRITE`：系统字典维护

### 4.2 角色到权限映射

角色只负责“拥有哪组权限”，不负责业务分支判断。

示例策略：

- `STUDENT`：只读、个人学习相关权限
- `PARENT`：只读、陪伴相关权限
- `TEACHER`：实验创建、编辑、批改等教学权限
- `RESEARCHER`：审核、发布、资源治理等权限
- `SCHOOL_ADMIN`：校级管理权限
- `DISTRICT_ADMIN`：区级管理权限
- `SUPER_ADMIN`：全量权限

### 4.3 兼容现有系统用户角色

当前仓库中已有 `UserRole` 枚举与 RBAC 辅助函数。落地时应保持兼容：

- 旧的角色判断函数逐步迁移为权限判断
- 新业务只允许依赖 `can()`
- 旧代码中的角色判断要逐步清理，不得新增

---

## 5. 标准使用方式

### 5.1 后端 API 校验

后端所有敏感操作必须先做权限校验。

```ts
if (!can(session.user, PERMISSIONS.TASK_GRADE)) {
  throw new Error("权限不足，无法批改");
}
```

### 5.2 前端 UI 渲染校验

前端按钮、菜单、入口要基于权限显示。

```tsx
{can(user, PERMISSIONS.EXP_CREATE) && (
  <Button>新建实验</Button>
)}
```

### 5.3 路由进入校验

受保护页面在进入前检查权限：

- 无会话：跳转登录页
- 无权限：跳转无权限页或业务首页

### 5.4 批量操作校验

批量操作必须在接口层二次校验，不能只依赖前端隐藏按钮。

---

## 6. 强制禁止项

### 6.1 禁止直接判断角色名

以下写法一律禁止：

```ts
if (user.role === 'TEACHER') {
  ...
}
```

```ts
if (currentRole === 'SCHOOL_ADMIN') {
  ...
}
```

### 6.2 禁止在 SQL 中拼接权限逻辑

以下写法一律禁止：

- 在 SQL 字符串里按角色名拼条件
- 在 SQL 里做“谁能看什么”的业务判断
- 用数据库拼接语句代替应用层授权判断

### 6.3 禁止分散定义权限字符串

以下写法一律禁止：

- 页面文件里临时写一个权限名字符串
- 各模块各自定义不同的权限命名方式
- 同一个权限点在多个位置重复定义

### 6.4 禁止业务逻辑依赖角色枚举分支

业务逻辑里不得出现：

- `if (user.role === ...)`
- `switch (user.role) { ... }`
- 通过角色名决定具体功能路径

业务逻辑只能依赖：

- `can(user, PERMISSIONS.xxx)`

---

## 7. 核心文件规范

### 7.1 文件位置

统一创建：

- `frontend/src/lib/auth/role-permissions.ts`

### 7.2 文件职责

该文件只做权限中枢，不承载业务逻辑。

建议导出内容：

- `PERMISSIONS`
- `ROLE_PERMISSIONS_MAP`
- `can(user, permission)`
- `hasAnyPermission(user, permissions)`
- `hasAllPermissions(user, permissions)`

### 7.3 示例结构

```ts
export const PERMISSIONS = {
  EXP_VIEW: "exp_view",
  EXP_CREATE: "exp_create",
  EXP_EDIT: "exp_edit",
  EXP_DELETE: "exp_delete",
  EXP_PUBLISH: "exp_publish",
  TASK_GRADE: "task_grade",
} as const;

export const ROLE_PERMISSIONS_MAP = {
  TEACHER: [
    PERMISSIONS.EXP_VIEW,
    PERMISSIONS.EXP_CREATE,
    PERMISSIONS.EXP_EDIT,
    PERMISSIONS.TASK_GRADE,
  ],
} as const;

export function can(user: AuthUser | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return resolvePermissions(user).includes(permission);
}
```

说明：

- 这里的结构只是约定示例
- 最终实现要与项目类型定义保持一致
- 后续如接入数据库权限表，仅替换 `resolvePermissions()` 的数据来源

---

## 8. 权限变更流程

新增功能时，必须遵循以下流程，禁止修改业务分支逻辑。

### 8.1 新增“AI 出题”权限示例

1. 在 `PERMISSIONS` 中增加：

```ts
AI_GEN_QUESTION: "ai_gen_question"
```

2. 在 `ROLE_PERMISSIONS_MAP` 中给教师角色分配：

```ts
TEACHER: [
  ...,
  PERMISSIONS.AI_GEN_QUESTION,
]
```

3. 页面或接口里直接使用：

```ts
if (can(user, PERMISSIONS.AI_GEN_QUESTION)) {
  // show / allow
}
```

4. 不修改任何业务判断逻辑。

### 8.2 变更要求

- 角色变化只改配置文件
- 权限增加只改常量文件
- 页面/接口逻辑只调用 `can()`
- 不允许在页面内新增新的角色分支判断

---

## 9. 后端落地建议

### 9.1 登录接口

登录流程建议：

1. 按 `login_name` 查 `sys_user`
2. 校验 `status`
3. 校验 `is_deleted`
4. 校验 `expire_date`
5. 校验密码哈希
6. 更新 `last_login_time`
7. 初始化 Session
8. 返回当前用户基础信息、角色信息、组织信息、权限列表

### 9.2 权限校验入口

后端建议提供统一的授权中间件或服务方法：

- 从 Session 取当前用户
- 读取权限集合
- 判断是否包含指定 `PERMISSIONS`

### 9.3 审计建议

- 登录成功、失败记录日志
- 高权限操作记录 `sys_log`
- 权限撤销、强制下线等管理动作建议补充审计记录

---

## 10. 前端落地建议

### 10.1 页面控制

前端统一使用 `can()` 控制：

- 按钮显隐
- 菜单显隐
- 路由入口
- 批量操作入口

### 10.2 用户态来源

前端不得自己推断权限，应从后端返回的用户态中读取：

- `userId`
- `roleIds`
- `permissions`
- `orgId`
- `orgPath`

### 10.3 体验原则

- 隐藏无权限入口，但不要依赖隐藏来保证安全
- 服务端必须再次校验

---

## 11. 数据范围与组织控制

由于当前数据库已经存在 `sys_org` 和 `sys_user.user_org_id`，组织范围控制应作为授权的一部分。

推荐规则：

- 学生：只能访问本人相关数据
- 教师：访问本人和所在组织域内的数据
- 学校管理员：访问本校及下级组织数据
- 区级管理员：访问全区数据
- 超级管理员：访问全局数据

组织范围判断应基于 `sys_org.org_path` 或组织树关系完成，不能在前端拼接范围。

---

## 12. 任务执行表

### 12.1 文档落地任务

| 序号 | 任务 | 产出物 | 验收标准 |
|---|---|---|---|
| 1 | 定义权限常量 | `role-permissions.ts` 设计草案 | 权限命名统一、可扩展 |
| 2 | 定义角色映射 | `ROLE_PERMISSIONS_MAP` | 角色和权限关系清晰 |
| 3 | 定义统一判定函数 | `can()` / `hasAnyPermission()` / `hasAllPermissions()` | 业务代码只依赖统一入口 |
| 4 | 约束前后端调用方式 | 文档规范 | 所有新增功能按规范接入 |
| 5 | 禁止项收口 | 代码评审规则 | 不再出现角色直判 |

### 12.2 开发落地任务

| 序号 | 任务 | 负责人 | 说明 |
|---|---|---|---|
| 1 | 新建权限核心文件 | 前端 | 统一权限定义与判定 |
| 2 | 统一用户类型 | 前端 | 用户态包含权限集合 |
| 3 | 接入 Session 鉴权 | 后端 | 权限撤销实时生效 |
| 4 | 替换角色判断 | 前后端 | 清理直判逻辑 |
| 5 | 后端接口补权限校验 | 后端 | 防止绕过前端 |
| 6 | 添加审计日志 | 后端 | 登录、授权、关键操作可追踪 |

---

## 13. 验收标准

### 13.1 代码验收

- 业务代码中不再新增 `user.role === 'xxx'`
- 所有受控按钮、接口、路由都通过 `can()` 判断
- `PERMISSIONS` 集中定义，不分散在各处
- `ROLE_PERMISSIONS_MAP` 是角色权限变更唯一入口

### 13.2 安全验收

- 退出登录后 Session 立即失效
- 管理员撤销权限后用户不能继续访问受控功能
- 前端隐藏按钮后，接口仍然会做二次校验
- SQL 中不存在权限拼接式判断

### 13.3 可维护性验收

- 新增功能时仅修改权限常量和映射
- 业务逻辑不用因角色变化而修改
- 后续若接入权限表，仅替换 Loader 逻辑即可

---

## 14. 与现有代码的关系

当前仓库里已有认证与角色相关代码，但需要逐步收口：

- `backend/src/http/routes/v2-auth.ts`
  - 可继续承担登录、改密、当前用户查询
  - 需要接入 Session 化会话输出
- `frontend/src/types/auth.ts`
  - 保留角色枚举，但不直接参与业务授权判断
- `frontend/src/lib/rbac/management-access.ts`
  - 其中的角色直判逻辑应逐步迁移到权限层

原则：

- 保留现有兼容能力
- 新功能全部走权限层
- 老代码逐步替换，不再新增直判逻辑

---

## 15. 结论

本项目的权限管理必须采用“**Session + 权限点 + 统一判定函数**”模式，才能满足教育系统的实时撤权、可审计、可扩展要求。

最终项目规范应统一为：

> 业务层只关心 `can(user, permission)`，不关心角色名；角色变更只改配置映射，不改业务代码。
