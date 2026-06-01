# 虚拟实验管理功能 · 实施任务清单

基于 `virtual-experiment-design-v1.0.md` V2.0，分步实施清单。

## 依赖顺序

```
Step1 (Migration SQL)
  ↓
Step2 (Domain Types) ←→ Step3 (Repository)
  ↓
Step4 (Service)
  ↓
Step5 (Routes) → Step6 (Register)
  ↓
Step7 (File upload biz_type 标记 → 已预备)
  ↓
Step8 (Frontend nav + sandbox)
  ↓
Step9 (Frontend API layer)
  ↓
Step10 (List page: container + hooks + table)
  ↓
Step11 (Review table)
  ↓
Step12 (Create/Edit dialogs)
  ↓
Step13 (Play page + html2canvas)
  ↓
Step14 (Type check + verify)
```

## 执行计划

| Step | 描述 | 文件 | 改动类型 |
|---|---|---|---|
| 1 | 数据库迁移 SQL | `database/migrations/0013_update_virtual_experiment.sql` | 新增 |
| 2 | 后端类型定义 | `backend/src/domain/v2-virtual-experiment/v2-virtual-experiment-types.ts` | 新增 |
| 3 | 后端 Repository 层 | `backend/src/infrastructure/repositories/v2-virtual-experiment-repository.ts` | 新增 |
| 4 | 后端 Service 层 | `backend/src/services/VirtualExperimentService.ts` | 新增 |
| 5 | 后端路由层 | `backend/src/http/routes/v2-virtual-experiment.ts` | 新增 |
| 6 | 注册路由到 server.ts | `backend/src/http/server.ts` | 修改 |
| 7 | 文件标记隔离（已预备） | `backend/src/lib/presign-response.ts` + `backend/src/http/routes/v2-file.ts` | 已改 |
| 8 | 前端 sandbox 常量 + 导航配置 | `frontend/src/config/virtual-experiment-sandbox.ts` + 各 nav 文件 | 新增/修改 |
| 9 | 前端 API 封装层 | `frontend/src/lib/v2/v2-virtual-experiment-api.ts` | 新增 |
| 10 | 前端列表页 | `list/page.tsx` + `list/page.hooks.ts` + `_components/ExperimentTable.tsx` | 新增 |
| 11 | 前端审核表格 | `_components/ReviewTable.tsx` | 新增 |
| 12 | 前端增/改弹窗 | `_components/CreateExperimentDialog.tsx` + `EditExperimentDialog.tsx` | 新增 |
| 13 | 前端播放页 | `play/[id]/page.tsx`（含 html2canvas 自动截图） | 新增 |
| 14 | 类型检查 + 验证 | 全量 `pnpm run typecheck` | 验证 |
