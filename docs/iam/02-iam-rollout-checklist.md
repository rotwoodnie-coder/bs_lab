# IAM 组织结构上线检查与回滚清单

本文档用于指导 IAM 组织结构相关 DDL 的生产级落地，覆盖执行顺序、验收要点、风险闸门与回滚策略。**表结构真源**以 `database/baseline/` 快照与已执行的 `database/migrations/` 为准（原 `docs/iam/01-iam-schema*.sql` 已废弃删除）。

---

## 1. 上线目标

- 建立 IAM 组织结构域 6+1+1 核心模型（租户、组织、用户、角色、任职、学科任教、学籍归属）。
- 强化多租户物理隔离：关键子表统一使用联合外键 `(tenant_id, id)`。
- 固化“节点重生制”：每学年新建班级节点，历史节点封存。
- 统一业务读取口径：全部读接口走 `v_active_*` 视图。

---

## 2. 执行前检查（Preflight）

### 2.1 环境检查

- [ ] 数据库版本为 MySQL 8.0+
- [ ] 默认存储引擎为 InnoDB
- [ ] 字符集/排序规则支持 `utf8mb4`
- [ ] 具备建表、建视图、建索引、外键权限
- [ ] 当前环境已完成数据库备份（全量或快照）

### 2.2 变更窗口检查

- [ ] 已申请维护窗口（建议低峰执行）
- [ ] 已通知业务方“读写抖动风险窗口”
- [ ] 已预备回滚负责人和执行人

### 2.3 兼容性检查

- [ ] 现网无同名旧表（若存在需先评估迁移路径）
- [ ] 应用层配置允许切换到新 schema
- [ ] 依赖方明确读取视图而非直接读原表

---

## 3. 分步执行清单（Runbook）

## Step 1：执行 Schema SQL

- [ ] 按环境从 `database/migrations/` 执行至目标版本，并对照 `database/baseline/` 验收（勿再执行已删除的 `docs/iam/01-iam-schema.sql`）
- [ ] 确认 8 张表创建成功
- [ ] 确认 3 个视图创建成功

> 建议按事务外分段执行（DDL 在 MySQL 中多数不可回滚），每段执行后立即验收。

## Step 2：结构验收

- [ ] `SHOW CREATE TABLE iam_users`，确认存在 `UNIQUE(tenant_id, id)`
- [ ] `SHOW CREATE TABLE iam_org_nodes`，确认存在 `UNIQUE(tenant_id, id)`
- [ ] `SHOW CREATE TABLE iam_student_enrollments`，确认联合外键已生效
- [ ] `SHOW INDEX FROM iam_org_closure`，确认存在反向索引 `idx_closure_desc`

## Step 3：角色种子验收

- [ ] `iam_roles` 至少存在以下编码：`student/parent/teacher/researcher/school_admin/district_admin/system_admin`
- [ ] 重复执行不会产生脏重复（幂等）

## Step 4：读口径验收（视图）

- [ ] `v_active_user_org_posts` 可正确过滤失效任职
- [ ] `v_active_user_org_subject_posts` 可正确过滤失效任教
- [ ] `v_active_student_enrollments` 仅返回有效在读学籍

## Step 5：权限隔离验收（核心）

- [ ] 构造跨租户关联写入，预期外键失败
- [ ] 同租户合法写入，预期成功
- [ ] 应用读路径改为视图后结果与预期一致

---

## 4. 功能验收清单（业务场景）

## 4.1 组织与层级

- [ ] 可创建租户根节点（`district`）
- [ ] 可创建学校/年级/班级层级
- [ ] `iam_org_closure` 能返回祖先链与子树

## 4.2 任职关系

- [ ] 同一用户可在多个组织节点任职（`iam_user_org_posts`）
- [ ] 同一用户可在同一班级配置多学科任教（`iam_user_org_subject_posts`）
- [ ] 有效口径符合：
  - `status = 1`
  - `start_at <= NOW()`
  - `end_at >= NOW()`（闭区间）

## 4.3 学籍与升班

- [ ] 可写入学生当前学籍记录（`enrolled`）
- [ ] 可结转为 `promoted` 并设置 `end_at`
- [ ] 可插入新学年 `enrolled` 记录并回填 `from_enrollment_id`
- [ ] 历史学籍链路可追溯

---

## 5. 升班执行规约（必须遵守）

- [ ] **节点重生制**：创建新学年班级节点，不修改历史班级节点层级
- [ ] 旧学籍结转：`enrolled -> promoted`，写入 `end_at`
- [ ] 新学籍插入：新学年 + 新班级 + `from_enrollment_id`
- [ ] 业务事实表（报告/作业/作品）必须冗余 `enrollment_id`，保证历史精准回放

---

## 6. 风险点与防护

## 6.1 风险点

- 跨租户脏关联（tenant_id 丢失）
- 旧接口绕过视图直接查原表，导致口径漂移
- 批量升班时误将多班映射为同一新班
- 同学生同一时刻出现多条 `enrolled`

## 6.2 防护措施

- 联合外键 + 联合唯一索引（数据库铁闸门）
- 强制代码审查：读接口统一改查 `v_active_*`
- 升班任务先生成“旧班->新班映射表”再批处理
- 应用层事务/锁控制“单学生单时刻单在读”

---

## 7. 回滚策略

> DDL 回滚建议按“新对象清理”进行。若已写入业务数据，优先数据库快照恢复。

## 7.1 轻量回滚（仅结构）

按依赖逆序执行：

1. 删除视图
   - [ ] `DROP VIEW IF EXISTS v_active_student_enrollments;`
   - [ ] `DROP VIEW IF EXISTS v_active_user_org_subject_posts;`
   - [ ] `DROP VIEW IF EXISTS v_active_user_org_posts;`
2. 删除子表
   - [ ] `iam_student_enrollments`
   - [ ] `iam_user_org_subject_posts`
   - [ ] `iam_user_org_posts`
   - [ ] `iam_org_closure`
3. 删除父表
   - [ ] `iam_users`
   - [ ] `iam_org_nodes`
   - [ ] `iam_roles`
   - [ ] `iam_tenants`

## 7.2 数据回滚（推荐）

- [ ] 回滚到执行前数据库快照
- [ ] 校验关键业务表行数与索引状态
- [ ] 应用切回旧读路径（如存在）

---

## 8. 上线后观察项（48小时）

- [ ] 慢查询：`iam_org_closure` 相关子树查询是否命中索引
- [ ] 错误日志：是否出现联合外键冲突（反查漏传租户参数的调用链）
- [ ] 业务口径：新旧接口结果对比（组织可见范围、任职有效性、在读名单）
- [ ] 升班演练：抽样验证 `from_enrollment_id` 回溯链完整性

---

## 9. 验收通过标准（Go-Live Gate）

- [ ] 全部建表/视图/索引创建成功
- [ ] 外键隔离与视图口径验收通过
- [ ] 升班演练用例通过
- [ ] 回滚演练至少完成一次并可执行
- [ ] 业务方签字确认“组织域读写口径冻结”

