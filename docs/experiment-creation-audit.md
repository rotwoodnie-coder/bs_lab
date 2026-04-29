# 实验创建全链路审计报告

> 审计时间：2026-04-26 17:40
> 审计范围：老师创建实验课程的 UI → API → 后端路由 → 数据库落库

---

## 一、数据流总览

```
[前端编辑器]                     [API]                    [后端]                    [MySQL]
                                                                                
用户填写表单                                                                     
  ↓                                                                             
buildV2ExpDraftPutBody()                                                       
  ┌──────────────────────────┐                                                 
  │ 17 个字段 + 6 个子表数组  │                                                 
  └──────────────────────────┘                                                 
  ↓                                                                             
createV2Exp() / putV2ExpDraft()                                                
  ┌────────────────────┐     ┌─────────────────┐     ┌──────────────────────┐  
  │ POST /v2/exp (创建) │────→│ saveExp()        │────→│ exp_msg (主表 INSERT) │  
  │ PUT /v2/exp/:id/   │     │ putExpMsgDraft() │     │ exp_step (子表批量)   │  
  │   draft (整包保存)  │     │                  │     │ exp_material          │  
  └────────────────────┘     └─────────────────┘     │ exp_result            │  
                                                      │ exp_reference         │  
                                                      │ exp_scientist         │  
                                                      │ exp_video             │  
                                                      └──────────────────────┘  
  ↓                                                                             
[提交审核 - 前端乐观操作，无实际后端状态变更]                                      
```

---

## 二、各链路审计发现

### 🔴 严重问题（Critical）

#### 1. "提交审核"流程未调用后端 API 变更状态

**原因**：`useEditorActions.publish()`（`use-editor-actions.ts:298`）执行以下操作：

1. 调用 `saveDraft({ silent: true })` — 仅保存草稿，**不涉及状态变更**
2. 调用 `pushExperimentMaterialLinks()` — 同步材料关联
3. 调用 `persistListFields()` — 仅触发前端列表刷新
4. 调用 `appendExperimentWorkflowEvent()` — 仅记录本地事件到 localStorage

**效果**：用户点击"提交审核"后，`exp_msg.status` 始终为 `'t'`（草稿），从未被后端修改为 `'y'` 或任何"待审核"状态。刷新页面后实验仍然显示为草稿状态。

**对比**：后端确实有 `patchExpMsgForReview()`（`v2-exp-repository.ts:620`）和 `PATCH /v2/exp/:id` 路由，前端 `EditorToolbar` 中的"通过审核"/"驳回"按钮通过 `actions.approveExperiment()` / `actions.confirmReject()` 连接。但这些审核操作同样**只做本地 Toast + 事件记录，不调后端 API**。

**影响**：实验的状态流转（草稿 → 已提交 → 已通过/已驳回）全部是**前端模拟**，实际只存在于 localStorage 本地的 workflow event 日志中。多用户场景下，教研员审批页看不到待审核实验。

---

### 🟠 中等问题

#### 2. `POST /v2/exp` 与 `PUT /v2/exp/:id/draft` 的字段命名风格不一致

| API | 字段风格 | 示例 |
|-----|---------|------|
| `POST /v2/exp` | **camelCase** | `expName`, `subjectId` |
| `PUT /v2/exp/:id/draft` | **snake_case** | `exp_name`, `subject_id` |

- 后端 `saveExp()` 通过 `(input as any).chooseType ?? (input as any).choose_type ?? null` 兼容两者，这是隐式且脆弱的。
- `createV2Exp()` 只发送 5 个必要字段；`putV2ExpDraft()` 发送包含所有子表的完整 body。
- **风险**：前后端 API 约定没有明确的规范文档，新人维护时容易混淆。

#### 3. `exp_caution` / `exp_danger` 数据库截断（200 字符）

- DB 列：`varchar(200)`，前端富文本编辑器允许输入远超 200 字符的内容。
- 后端 `putExpMsgDraft()` 通过 `trimOrNull(input.exp_caution, 200)` 截断，**无提示**。
- `buildV2ExpDraftPutBody()` 中做 `.slice(0, 200)`，但同时又有完整内容写入到 `exp_principle` 字段（通过 `composeExpPrincipleForDb()` 使用 `<!--bs_editor_safety-->` / `<!--bs_editor_danger-->` 围栏），存在**数据冗余**：`exp_principle` 有完整内容，`exp_caution`/`exp_danger` 只有前 200 字符。

#### 4. `exp_principle` 多段编码的紧耦合

8+ 个独立分段（原理、摘要、教学过程、课标、安全、危险、参考资料、科学家故事）被合并到单一的 `exp_principle` TEXT 列中，使用 `<!--bs_editor_*-->` HTML 注释作为分隔标记。

- `composeExpPrincipleForDb()` ↔ `splitPrincipleStored()` 是这个编码的正反向函数。
- 如果未来需要独立查询"教学背景"或"安全提示"，必须始终解析此格式。
- **读取时**：`GET /v2/exp/:id` 回来的 `exp_principle` 需要前端重新解析回各个独立 UI 字段，过程复杂且无 schema 约束。

#### 5. 自动保存无页面离开强制保存

`useEditorAutosave` 防抖 1200ms，但当页面关闭、导航离开或组件卸载时，**没有强制执行最后一次保存**。

- 唯一的保护是 `beforeunload` 事件（提醒用户），但不阻止离开。
- 用户在 1200ms 防抖期内切换页面，最后一个编辑操作会丢失。
- `page.tsx` 中没有实现 `useEffect(() => () => forceSave(), [])` 或 `Router.events.on('routeChangeStart', ...)`。

#### 6. 发布时 `pushExperimentMaterialLinks` 重复调用

在 `publish()` 中（`use-editor-actions.ts:329`）：
```
saveDraft({ silent: true })   ← 内部已调用 pushExperimentMaterialLinks()
// ...
pushExperimentMaterialLinks(targetExpId, true)  ← 再次调用同一 API
```
同一时间内对同一 API 的两次调用，第二次是冗余的。

---

### 🟡 轻微问题或建议

#### 7. 创建草稿的两步 API 往返

新实验创建总是：
1. `POST /v2/exp` → 返回 `{ expId }`
2. `PUT /v2/exp/:expId/draft` → 写入完整 body
3. 前端 `router.replace()` 更新 URL

首次保存时，用户会有 2 次 API 调用的延迟。次优但可接受。

#### 8. `exp_principle` 中的安全提示与独立列不一致

`buildV2ExpDraftPutBody` 中：
- `exp_principle` 通过 `composeExpPrincipleForDb()` 包含**完整**的 safety/danger 富文本
- `exp_caution` 和 `exp_danger` 只存 `safetyNotes`/`dangerNotes` 的 `.slice(0, 200)` 截断版本

读取时：`splitPrincipleStored()` 从 `exp_principle` 中提取完整内容用于编辑器展示；`exp_caution`/`exp_danger` 仅用于列表页快速摘要。写入时存在数据一致性风险（两者来源相同，但处理方式不同）。

#### 9. `reject_reason` 列已存在但前端未读取/回显

- DB `exp_msg` 表有 `reject_reason` 列（`varchar` 无限制），`rowToExpMsg()` 已读取为 `rejectReason`。
- 但实验编辑器关闭驳回弹窗后，**不读取或展示 `rejectReason`**，用户重新打开实验时看不到之前被驳回的原因。
- 虽然通过 `splitPrincipleStored()` 可以在 `exp_principle` 中找到相关信息，但独立列的价值未被利用。

#### 10. 子表 REPLACE 操作的原子性风险

`putExpMsgDraft` 对每个子表执行 **DELETE ALL → INSERT ALL** 模式，在事务内运行。
- 如果在 `replaceMaterials` 执行完成后、`replaceSteps` 执行前发生部分故障，理论上会回滚（有 `try/catch` + `rollback`）。
- 但如果连接池层面或网络层面故障导致 `rollback` 未执行，子表出现空数据。
- 当前缺少 `AFTER UPDATE` 钩子或完整性校验。

---

## 三、与 DB Schema 对齐检查

### 3.1 前端字段 → DB 列映射检查

| 前端字段 | DB 列 | 对齐 | 说明 |
|---------|-------|------|------|
| `expName` | `exp_name` | ✅ | 对齐，长度限制 100 |
| `chooseType` | `choose_type` | ✅ | `"y"` / `"n"` |
| `subjectId` | `subject_id` | ✅ | 32 位 varchar FK |
| `schoolLevelId` | `school_level_id` | ✅ | 32 位 varchar FK |
| `gradeId` | `grade_id` | ✅ | 32 位 varchar FK |
| `difficultyId` | `difficulty_id` | ✅ | 32 位 varchar FK |
| `exp_principle` (合并后) | `exp_principle` | ✅ | TEXT |
| `safetyNotes` | `exp_caution` | ⚠️ | 截断至 200 字符 |
| `dangerNotes` | `exp_danger` | ⚠️ | 截断至 200 字符 |
| `durationMin` → `class_hour` | `class_hour` | ✅ | 分钟转课时（/45） |
| `coursebookId` | `coursebook_id` | ✅ | |
| `unitId` | `unit_id` | ✅ | |
| `simulatorUrl` | `simulator_url` | ✅ | |
| `materials[]` | `exp_material` 子表 | ✅ | DELETE + INSERT |
| `steps[]` | `exp_step` 子表 | ✅ | DELETE + INSERT |
| `resultEntries[]` | `exp_result` 子表 | ✅ | DELETE + INSERT |
| `referenceCitations[]` | `exp_reference` 子表 | ✅ | DELETE + INSERT |
| `scientistStories[]` | `exp_scientist` 子表 | ✅ | DELETE + INSERT |
| `mainVideoUrl` | `exp_video` 子表 | ✅ | DELETE + INSERT |

### 3.2 数据库有但前端未使用的列

| 列 | 说明 |
|----|------|
| `exp_msg.like_num` / `notlike_num` / `collection_num` / `evaluate_num` | 聚合统计列，无前台展示 |
| `exp_msg.link_exp_id` | 关联实验，前端已有 `ExperimentPickerDialog` 但写入逻辑不完整 |
| `exp_msg.standard_exp_id` | 标准实验库引用，前端"选模板"步骤可能使用 |
| `exp_pic` 表 | 实验图片子表，编辑器未写入（图片以富文本 embed 形式内嵌到 `exp_principle`） |

---

## 四、工作流断点分析

### 4.1 状态机 vs 实现

```
期望工作流                   当前实际
                         
草稿 (status='t')       草稿 (status='t')       
  │                        │
  │  用户点击"提交审核"     │  仅前端模拟
  ▼                        ▼
待审核 (无DB状态)         仍是 status='t'
  │
  │  教研员"审核通过"      仅前端模拟
  ▼
已通过 (status='y')       仍是 status='t'
```

**结论**：整个实验的审核工作流是**前端模拟的、未接入后端**。虽然后端 `PATCH /v2/exp/:id` 路由和 `patchExpMsgForReview()` 已经写好，但前端从未调用它。

### 4.2 缺失的端到端状态探测

缺少一个关键端点：**教师端查询自己提交的实验当前审核状态的 API**。当前的 `GET /v2/exp` 只能过滤 `status`，但教师提交后 `status` 不变，教师无法看到"待审核"或"已通过"状态。

### 4.3 列表页状态列体验

`experiment-manage` 页面中的实验列表展示"状态"列（草稿/已提交/已通过/已驳回），但这些状态完全从本地 workflow events 推导，不是从后端 `exp_msg.status` 读取的。换设备或清除 localStorage 后状态丢失。

---

## 五、汇总与修复建议

| 优先级 | 问题 | 影响 | 修复方式 |
|--------|------|------|---------|
| 🔴**P0** | 提交审核不调后端 API | 审核工作流不生效 | `publish()` 中增加 `PATCH /v2/exp/:id { status: "t" → 待审核 }` 或复用现有 `PATCH` 路由（需新增"pending"状态） |
| 🔴**P0** | 审核通过/驳回不调后端 API | 审核操作无持久化 | `approveExperiment()`/`confirmReject()` 改为调用 `PATCH /v2/exp/:id` |
| 🟠**P1** | `exp_msg.status` 缺少"待审核"枚举值 | 当前只有 t/y/n，缺 pending | 与产品确认后在 DB 增加 `pending` 状态值；同时新增一个 `workflow_status` 列存储细粒度状态（submitted/in_review/changes_requested/approved/archived） |
| 🟠**P1** | 自动保存无离开前强制保存 | 用户切换/关闭页面前最后一次编辑丢失 | ✅ 已在 Phase 1 S5A 修复 |
| 🟠**P2** | `exp_caution`/`exp_danger` 200 字符截断无提示 | 用户输入被静默截断 | ✅ 已在 Phase 1 S5B 修复；UI 增加字符计数提示 |
| 🟡**P3** | `exp_principle` 多段编码耦合 | 维护复杂度高，难以独立查询分段 | 后续重构可考虑将各分段拆分到独立列（如 `exp_teaching_context` TEXT、`exp_reference_rich` TEXT），当前在适配器中先保持 |
| 🟡**P3** | 发布时材料关联重复调用 | 轻微性能浪费 | ✅ 已在 Phase 2 2.4 修复 |

---

## 六、代码路径索引

| 层次 | 关键文件 | 行数 | 行数状态 |
|------|---------|------|---------|
| 前端 - 编辑器主页 | `experiment-editor/page.tsx` → `page.container.tsx` | - | |
| 前端 - 壳层 | `ExperimentEditorShell.tsx` | 313 | ⚠️ 超 300 行 |
| 前端 - 状态 | `use-editor-bootstrap.ts` | 26,085 | ⚠️ 重大超限 |
| 前端 - 操作 | `use-editor-actions.ts` | 14,959 | ⚠️ 超限 |
| 前端 - 自动保存 | `use-editor-autosave.ts` | 114 | ✅ |
| 前端 - 构建 body | `build-v2-exp-draft-put-body.ts` | 154 | ✅ |
| 前端 - checklist | `use-editor-bootstrap-checklist.ts` | 205 | ✅ |
| 前端 - API 封装 | `v2-exp-api.ts` (putV2ExpDraft / createV2Exp) | ~500 | ⚠️ |
| 后端 - 路由 | `v2-exp.ts` | 131 | ✅ |
| 后端 - 服务 | `ExpService.ts` | 246 | ✅ |
| 后端 - 草稿 REPO | `v2-exp-draft-repository.ts` | 375 | ⚠️ 超限 |
| 后端 - CRUD REPO | `v2-exp-repository.ts` | ~670 | ⚠️ 重大超限 |
| 数据库 | `bs_exp_data.sql` exp_msg 表 (L576-625) | | |

---

**审计结论**：从 UI 到落库的表结构映射基本正确，字段名称和类型对齐良好。但**审核工作流存在严重断裂**（前端模拟、后端不生效），需要优先修复。自动保存和字段截断问题次优先。
