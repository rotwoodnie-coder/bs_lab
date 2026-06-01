# Cursor 项目规则（Rules）维护指南

## 规则状态概览

| 层次 | 数量 | 说明 |
|------|------|------|
| 元规则（alwaysApply） | 8 | 跨所有任务始终生效（对话语言、工作流、代码质量、命名对齐、繁体扫描） |
| 前端规则（globs） | 8 | 仅对 `frontend/src/**/*.{ts,tsx}` 生效 |
| 后端规则（globs） | 3 | 仅对 `backend/src/**/*.{ts,tsx}` 生效 |
| 全栈规则（globs） | 1 | `media-gms-mandatory-usage.mdc`（已有 globs） |
| **总计** | **20** | 自优化重构后（2026-04-30） |

## 规则生命周期管理

### 最后审计日期

| 审计日期 | 说明 |
|----------|------|
| **2026-04-30** | 三阶重构：真源合并、规则瘦身、后端补缺（原始 22 → 20 条） |
| - | _（下一次审计请填入日期）_ |

### 审计清单（每月或每季度执行）

- [ ] 是否有规则描述与实际代码不一致？
- [ ] 是否有"临时加来防某个 Bug"的规则，现在已不需要？
- [ ] 是否有规则 frontmatter（`alwaysApply` / `globs`）与实际适用范围不匹配？
- [ ] 是否有两条规则出现重叠或冲突？
- [ ] `no-mock-after-db-established.mdc` 的例外汇总是否仍成立？
- [ ] pre-commit 钩子是否仍在运行且无误报？

### 规则保留/废弃标准

- **保留条件**：该规则在过去 3 个月内至少被触发过一次有用警告，或它守护的是不可逆的安全/数据底线。
- **废弃条件**：业务变化导致该规则对应的约束不再存在；或者该约束已通过自动化工具（ESLint、pre-commit）强制执行，不再需要 AI 规则提醒。
- **废弃流程**：在 `rules/` 中找到对应 `.mdc` 文件 → 添加 `deprecated: true` 到 frontmatter → 在 README 中标注"已废弃（YYYY-MM-DD）" → 一个月后物理删除。

## 规则文件说明

```
.cursor/rules/
├── assistant-chat-chinese-only.mdc     # 元规则：AI 对话语言
├── pre-coding-audit-required.mdc        # 元规则：动手前审计
├── powershell-git-commits.mdc           # 元规则：git commit 格式
├── phase-gate.mdc                       # 元规则：开发阶段门禁
├── single-file-300-lines-max.mdc        # 元规则：代码结构治理
├── truth-source-hierarchy.mdc           # 元规则：字段真源权威链
├── no-mock-after-db-established.mdc     # 元规则：禁止 Mock
│
├── scan-traditional-chinese.mdc         # 全栈：繁体字扫描（被引用）
├── media-gms-mandatory-usage.mdc        # 全栈：GMS 媒体组件
│
├── backend-logic-consistency.mdc        # 后端：事务/错误码/审计
├── db-infrastructure-protection.mdc     # 后端：表冻结/禁旧库
├── metadata-immutability.mdc            # 后端：data_* 不可篡改
│
├── dialog-chinese-output.mdc            # 前端：对话框中文
├── datatable-conventions.mdc            # 前端：DataTable 约定
├── management-pages-ui.mdc              # 前端：管理页母版
├── visual-identity-1-0.mdc              # 前端：视觉宪法
├── ui-source-of-truth.mdc               # 前端：组件库真源
├── reuse-first-ui-and-pages.mdc         # 前端：复用优先
├── official-product-copy-tone.mdc       # 前端：文案语气
├── bsv0-reference-only.mdc              # 前端：参考目录
```
## 协作规范与架构协议 (Collaboration Protocol)

为保持开发的心流与架构的一致性，所有 Agent 在执行任务时必须遵循以下协议：

1. **沟通模式**：
   - **架构先行**：涉及业务逻辑变更、状态流转或接口设计的任务，必须先在 Chat 中向人类开发者简述架构设计或伪代码方案，经确认后再行开发。
   - **多文件变更**：涉及多个模块协作时，请优先使用 Composer (Ctrl+I) 模式以保证逻辑的原子性。
   - **规则响应**：在执行前，Agent 必须读取 `.cursor/rules/` 下的相关 `.mdc` 文件，并将其约束纳入推理上下文。

2. **审计要求**：
   - 遵循 `pre-coding-audit-required.mdc` 的门禁，先分析后动手。
   - 开发过程中若产生 `Lint/TypeScript` 错误，严禁盲目尝试修复，请将终端输出反馈给人类开发者或进行上下文分析。

3. **异常处理**：
   - 若在开发过程中出现“Taking longer than expected”，请立即停止当前任务，主动询问是否需要拆分任务或简化任务边界，不要进入死循环。