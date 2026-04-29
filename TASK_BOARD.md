# 内测优化任务跟踪板

> 详细说明见 `docs/deploy-audit-and-plan.md`
> 每完成一项，在本文件 `状态` 列标记 ✅，并在详细文档同步标记

---

## 🔴 第一优先级 — 内测阻塞

| ID | 任务 | 文件/范围 | 预计 | 审校特殊说明 | 状态 |
|---|---|---|---|---|---|
| A01 | 修复死链接（simulation-dev 404） | `admin-nav.ts` 两处 href | 2min | — | ✅ |
| A02 | 添加 404 智能引导页 | `frontend/src/app/not-found.tsx`（新增） | 10min | 按角色推荐入口按钮 | ✅ |
| A03 | 确认驳回原因展示 + 时效性验证 | `teacher/experiment-preview/page.tsx` | 10min | 验证重新提交后旧驳回原因消失 | ✅ |
| A04 | 添加 Error Boundary + 一键上报 | `frontend/src/app/(dashboard)/error.tsx`（新增） | 10min | 必须 `"use client"`；上报 `error.digest` | ✅ |

## 🟠 第二优先级 — UI 统一

| ID | 任务 | 文件/范围 | 预计 | 审校特殊说明 | 状态 |
|---|---|---|---|---|---|
| B_pre | 抽象 EmptyPlaceholder 组件 | `components/business/common/EmptyPlaceholder.tsx`（新增） | 5min | B 组依赖，建议先执行 | ✅ |
| B01 | 实验列表管理页统一 | `console/settings/experiments/page.tsx` | 20min | 验收空状态使用 EmptyPlaceholder | ✅ |
| B02 | 积分与激励页统一 | `console/settings/incentives/page.tsx` | 15min | 验收空状态使用 EmptyPlaceholder | ✅ |
| B03 | 小法庭页面统一 | `teacher/social` + `console/social/court` | 20min | 验收危险操作 Destructive Button | ✅ |
| B04 | 教研组管理 + 通知检查 | `teacher/research-project-groups/page.tsx` + 通知组件 | 15min | 验收通知入口是否挂载 | ✅ |

## 🟢 第三优先级 — 低优先 & 检查

| ID | 任务 | 文件/范围 | 预计 | 审校特殊说明 | 状态 |
|---|---|---|---|---|---|
| C01 | 运维面板批量 + 高危操作加强 | ~8 个运维/配置页面 | 35min | 高危操作（清缓存/一致性）需输入 DELETE 确认 | ✅ |
| X01 | 全站繁体字扫描 | `frontend` + `packages/ui` | 5min | 优先扫按钮/导航/标题 | ✅ |
| X02 | 全链路冒烟测试 | 代码审计 + 后端驳回重置修复 | 20min | 重点测「驳回→修改→再提交→通过」 | ✅ |

---

## 审校意见采纳速览

| 建议 | 采纳 | 对应变更 |
|---|---|---|
| A02 按角色智能引导 | ✅ | not-found.tsx 需动态推荐常用模块 |
| A03 通知链路检查 | ✅ | B04 增加通知组件挂载检查 |
| A03 驳回原因时效性 | ✅ | 已验证后端+前端自动清理，A03 验收补充 |
| Error Boundary + "use client" + 一键上报 | ✅ | 新增 A04 任务 |
| B 组空状态统一 + EmptyPlaceholder 抽象 | ✅ | 新增 B_pre 前置任务 |
| C01 高危操作「输入确认」 | ✅ | 仅限缓存清空/数据一致性等极端高危页 |
| X01 优先扫高频曝光位 | ✅ | X01 操作说明补充 |
| X02 全链路「驳回→修改→再提交→通过」 | ✅ | X02 测试步骤补充 |
| X01 ESLint 插件 | ⚠️ | 记入后续建议，暂不阻塞 |
| CommonTableWrapper | ❌ | 复用现有抽象层，不新增包装层 |

## 建议执行顺序

```
A01 → A02 → A03 → A04 → B_pre → B01 → B02 → B03 → B04 → C01 → X01 → X02
```

每个任务打开一个新 Agent 窗口执行，执行完后回 `docs/deploy-audit-and-plan.md` 和本文件标记 ✅。
