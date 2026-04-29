# 联邦教研组审核闭环（最终评审稿）

本文档用于固化“跨校教研组（Federated Research Group）”在业务库与应用层的最终落地方案，目标是实现可审计、可回放、可分步骤执行的审核闭环。

---

## 1. 目标与范围

- 目标闭环：教师提交 -> 组内审核 -> 产生结论 -> 自动分发。
- 适用组织：`iam_org_nodes.org_type in ('research_group', 'subject_team')`。
- 适用租户：单租户内闭环（`tenant_id` 强约束），不跨租户传递权限。
- 审核主责：教研组任职成员中具备审核权限者，不按学校行政链路判定。

---

## 2. 核心设计铁律

1. 谁的孩子谁抱走  
   审核权严格限制在 `iam_user_org_posts` 中绑定该教研组且 `can_review_resource=1` 的有效任职。
2. 撤回权有明确丧失点  
   仅当 `opened_at IS NULL` 时允许提交教师撤回；一旦开审（`opened_at` 写入），撤回立即失效。
3. 通过即分发  
   审核通过时，系统必须在同事务内激活绑定（`research_group_resource_bindings.binding_status='active'`）。
4. 督导是隐形侧轨  
   督导动作（`rate/comment`）不得修改 `research_group_review_tasks.current_status`。
5. 身份快照终身有效  
   审核动作写入时必须同步落库岗位快照（`snapshot_*`），历史记录不受后续调岗影响。

---

## 3. 状态机与动作边界

### 3.1 状态定义

- `pending`：已提交待开审
- `in_review`：审核人已开审
- `returned`：已退回（可修改后重提）
- `approved`：已通过（终态）
- `rejected`：已拒绝（终态）
- `withdrawn`：已撤回（终态）

### 3.2 合法动作

| 当前状态 | 动作 | 权限主体 | 状态变化 | 结果 |
|---|---|---|---|---|
| `pending` | `withdraw` | 提交教师 | `withdrawn` | 流程终结 |
| `pending` | `open` | 组内审核人 | `in_review` | 写入 `opened_at` |
| `in_review` | `return` | 组内审核人 | `returned` | 回草稿并可重投 |
| `in_review` | `pass` | 组内审核人 | `approved` | 激活绑定并分发 |
| `in_review` | `reject` | 组内审核人 | `rejected` | 死档，需新建任务 |

### 3.3 撤回规则

- 允许条件：`current_status='pending' AND opened_at IS NULL AND submitter_user_id=actor_id`。
- 拒绝条件：`opened_at IS NOT NULL` 时，一律拒绝撤回。
- 后续路径：开审后如需返工，只能由审核人执行 `return`。

---

## 4. 督导侧轨（与审核主轨隔离）

### 4.1 侧轨动作

- `rate`：评分
- `comment`：点评
- `highlight`：标记优秀样例

### 4.2 隔离规则

- 侧轨动作可写入动作日志，但不得变更任务主状态。
- 督导权限可通过 `iam_user_org_posts.review_scope='district_wide'` 授予“全区同学科只读与评价权”。
- 督导轨仅产生评价信息，不覆盖审核结论位。

### 4.3 前端对齐要求

- 督导内容以“侧栏/气泡”呈现。
- 审核结论区仅展示 `approved/rejected/returned` 主轨结果。

---

## 5. 数据库补丁（DDL）

以下为最小可执行补丁，字段命名与当前方案保持一致。

### 5.1 `research_group_review_tasks`

```sql
ALTER TABLE research_group_review_tasks
ADD COLUMN opened_at DATETIME NULL COMMENT '审核人首次打开时间，用于锁定撤回权',
ADD COLUMN finisher_user_id BIGINT NULL COMMENT '最终结论审核人ID',
ADD COLUMN final_comment TEXT NULL COMMENT '最终审核意见汇总';
```

建议同步检查：

- `current_status` 是否包含：`pending,in_review,returned,approved,rejected,withdrawn`。
- 索引建议：
  - `(tenant_id, group_org_id, current_status)`
  - `(tenant_id, submitter_user_id, current_status)`
  - `(tenant_id, finisher_user_id)`

### 5.2 `research_group_review_actions`

```sql
ALTER TABLE research_group_review_actions
ADD COLUMN snapshot_post_id BIGINT NOT NULL COMMENT '执行动作时的任职ID',
ADD COLUMN snapshot_role_code VARCHAR(50) NOT NULL COMMENT '执行动作时的角色编码',
ADD COLUMN snapshot_subject_code VARCHAR(20) NOT NULL COMMENT '执行动作时的学科编码';
```

建议同步检查：

- `action` 枚举至少包含：`submit,open,withdraw,return,pass,reject,rate,comment`。
- 索引建议：
  - `(tenant_id, review_task_id, action_at)`
  - `(tenant_id, snapshot_post_id)`

### 5.3 `iam_user_org_posts`（权限扩展建议）

为支持督导侧轨与审核主轨分离，建议具备以下字段：

- `can_review_resource`：是否可执行审核主轨动作
- `review_scope`：`group_only/group_subject/district_wide`
- `can_manage_sub`：是否可建组与拉人
- `audit_status`：跨校入组审批态（`pending/approved/rejected`）

---

## 6. 应用层判定顺序（后端实现口径）

每次审核动作进入服务后，按以下顺序判定：

1. 校验 `tenant_id` 一致性；
2. 锁定任务行（防并发竞态）；
3. 校验动作与当前状态是否合法（状态白名单）；
4. 校验主体权限：
   - 主轨动作：必须组内有效任职且 `can_review_resource=1`；
   - 侧轨动作：允许 `review_scope='district_wide'` 的督导权限；
5. 写 `review_actions`，并同步写 `snapshot_*`；
6. 若为主轨终结动作，再更新 `review_tasks.current_status`；
7. 若为 `pass`，同事务更新绑定状态为 `active`；
8. 提交事务并发送分发事件。

---

## 7. 事务一致性要求（强制）

- `open` 动作与 `opened_at` 更新时间必须同事务。
- `pass/reject/return/withdraw` 动作日志与任务状态更新必须同事务。
- `pass` 时，`review_tasks` 状态更新与 `resource_bindings` 激活必须同事务。
- `snapshot_*` 必须由数据库实时查询写入，不接受前端透传覆盖。

---

## 8. 分步骤执行计划（Runbook）

## Step 1：DDL 补丁入库

- 执行 `research_group_review_tasks` 字段补丁。
- 执行 `research_group_review_actions` 快照补丁。
- 补齐或校验必要索引。
- 验收：`SHOW CREATE TABLE` 与 `SHOW INDEX` 通过。

## Step 2：状态机守卫落地

- 落地动作-状态白名单校验。
- 落地 `opened_at` 锁撤回逻辑。
- 验收：`pending+未开审` 可撤回；`opened_at!=NULL` 不可撤回。

## Step 3：权限守卫落地

- 主轨：组内任职 + `can_review_resource=1`。
- 侧轨：`district_wide` 仅可 `rate/comment`。
- 验收：非组内人员无法 `pass/reject`；督导仅能评价不改状态。

## Step 4：通过即分发落地

- `pass` 同事务激活绑定。
- 仅 `binding_status='active'` 资源可进入教学入口查询。
- 验收：通过前不可见，通过后可见。

## Step 5：审计回放验收

- 检查 `snapshot_post_id/snapshot_role_code/snapshot_subject_code` 完整性。
- 模拟用户调岗后回看历史动作，身份描述仍准确。
- 验收：历史动作可明确“何时、以何身份、对何资源做了何动作”。

---

## 9. 文稿对齐清单（评审会核对项）

- [ ] 状态机是否包含 `withdrawn`，并定义终态不可逆。
- [ ] 是否明确“开审即失去撤回权”（`opened_at` 规则）。
- [ ] 督导是否与审核主轨隔离，且不改 `current_status`。
- [ ] 身份快照是否事务内落库，且来源为数据库任职查询。
- [ ] 是否实现“通过即分发”并写入绑定激活。
- [ ] 是否对外统一采用本稿中的动作命名与状态命名。

---

## 10. 结论

该方案在“权限边界、流程严肃性、审计追溯、上线执行性”四个维度形成闭环，可作为联邦教研组审核流的最终实现基线。
