# 实验材料平台文档导航

本目录用于沉淀实验材料平台的架构、数据库、权限共享、接口约定与 AI 审查规则。

**关联**：标准实验（实验名称库 / Core +边表）见 [`../experimental-standard-library/00-overview.md`](../experimental-standard-library/00-overview.md)。

---

## 文档清单

- `00-overview.md`：项目目标、范围边界、关键术语。
- `01-domain-model.md`：主表/子表/维表关系与共享模型。
- `02-database-dictionary.md`：数据库字段字典与索引说明。
- `03-migrations-and-seed.md`：迁移执行顺序、种子策略、回滚建议。
- `04-api-contract-outline.md`：接口分层契约与关键入参约束。
- `05-permissions-and-scopes.md`：按学校/班级/课题组共享的权限模型。
- `06-ai-review-checklist.md`：AI 与人工联合审查清单。
- `07-integration-handoff.md`：联调验收用例（创建 → 范围 → 列表可见）与请求头说明。

---

## 推荐阅读顺序

1. `00-overview.md`：统一目标与非目标。
2. `01-domain-model.md`：确认模型和业务关系。
3. `02-database-dictionary.md`：核对字段语义与索引。
4. `05-permissions-and-scopes.md`：冻结共享与授权策略。
5. `03-migrations-and-seed.md`：进入建表与初始化执行。
6. `04-api-contract-outline.md`：后端接口与前端联调对齐。
7. `07-integration-handoff.md`：按 curl 与页面路径做一轮验收。
8. `06-ai-review-checklist.md`：PR 合并前审查打勾。

---

## 执行约定

- 数据库变更必须同步更新 `02-database-dictionary.md` 与 `06-ai-review-checklist.md`。
- 权限策略变更必须同步更新 `05-permissions-and-scopes.md`。
- 新增筛选条件必须补充索引说明与对应 SQL 验证方案。
