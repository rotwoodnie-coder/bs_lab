# 10 分钟开发机自动修复测试步骤

> 目标：在开发机上快速验证“反馈上报 → 自动审计 → 自动分诊 → 状态回写 → 管理页可见”的闭环是否可用。

## 0. 前置条件

- 已配置数据库连接环境：`DATABASE_URL` 或 `DB_HOST / DB_USER / DB_PASS(or DB_PASSWORD) / DB_NAME`
- 已完成代码拉取
- 当前工作区无未提交改动时，优先使用最新提交运行测试

## 1. 启动方式

推荐使用一键启动流程：

```bash
pnpm dev:fresh
```

它会先执行一次 `audit:heal`，再启动前后端开发服务。

如果你只想启动服务、不跑巡检：

```bash
SKIP_AUDIT_HEAL=1 pnpm dev:fresh
```

## 2. 10 分钟测试流程

### 第 1 分钟：确认服务已启动

检查：
- 后端可访问
- 前端可打开
- 登录页可正常使用

### 第 2 分钟：登录验证

分别用以下角色登录：
- Student
- Teacher
- Console

检查：
- 登录态正常
- 顶部导航正常
- 无白屏或 500

### 第 3 分钟：提交一条人工反馈

在反馈入口提交一条 `BUG`：
- 标题：任意
- 内容：尽量写明页面路径或复现说明

检查数据库：
- `sys_feedback` 已入库
- `status = NEW`
- `issue_fingerprint` 已生成
- `env` 中包含路径 / 堆栈摘要

### 第 4 分钟：触发一条系统告警

让后端走一次 `SystemLogService.reportIssue()` 路径。

检查数据库：
- `sys_log` 有告警记录
- 告警类型符合阻断 / 越权 / 401 重试失败等约定

### 第 5 分钟：跑一次自动审计

手动执行：

```bash
pnpm audit:heal
```

预期：
- 生成 `AUTO_HEAL_AUDIT.md`
- 更新 `CURRENT_SYSTEM_STATE.md` 顶部看板
- 若命中反馈，会尝试回写为 `AUTO_TRIAGED`

### 第 6 分钟：检查回写结果

检查反馈数据：
- `status` 是否变成 `AUTO_TRIAGED`
- `reply` 或备注中是否出现：
  - `[AI 分诊] 关联审计报告 ID: ...`
  - `[System] 机器审计已介入，指纹: ...`

### 第 7 分钟：检查管理页

打开反馈管理页，确认：
- `AI 分诊中` 标签可见
- 底部能看到最近分诊反馈 ID
- 能看到热点指纹摘要

### 第 8 分钟：检查顶层看板

打开 `CURRENT_SYSTEM_STATE.md`，确认：
- 顶部巡检看板存在
- 最新报告时间正确
- 治理视图显示正常
- 没有重复堆叠多个看板块

### 第 9 分钟：幂等性回归

把一条反馈手动改为：
- `FIXED`
- 或 `WONT_FIX`

再次运行：

```bash
pnpm audit:heal
```

确认：
- 不会被重新改回 `AUTO_TRIAGED`
- 不会覆盖已有备注
- 报告仍能正常生成

### 第 10 分钟：收尾确认

确认：
- 审计脚本能跑完
- 管理页能看到治理信息
- 看板可刷新
- 闭环没有中断

## 3. 验收标准

以下都满足即可认为“自动修复测试”基本通过：

- 反馈能提交
- 系统告警能记录
- 审计报告能生成
- 反馈能自动分诊
- 管理页能看见状态变化
- 顶层看板能刷新
- 幂等性正常
- `FIXED / WONT_FIX` 不会被覆盖

## 4. 备注

如果测试过程中 `audit:heal` 失败，优先检查：
- 数据库连接
- `CURRENT_SYSTEM_STATE.md` 占位符是否存在
- `backend/src/infrastructure/repositories/v2-sys-feedback-repository.ts` 的导入路径
- `sys_log` / `sys_feedback` 表结构是否和当前代码一致
