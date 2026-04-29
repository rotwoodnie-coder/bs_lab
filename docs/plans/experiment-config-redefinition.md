# 实验配置：产品重定义与落地计划（迭代版）

> 迭代说明：项目组确认 **不需要** 当前「香料 / 14 路 IoT / 网关备注」类场域硬件配置；**「实验配置」应理解为师生共同设计实验的舞台**（探究流程、步骤、材料与任务编排等教学侧能力），而非区级设备台账。

---

## 1. 结论：当前 `/admin/experiment-config` 与目标不符

- 现状见 [`frontend/src/app/(dashboard)/admin/experiment-config/page.tsx`](frontend/src/app/(dashboard)/admin/experiment-config/page.tsx) + [`frontend/src/lib/experiment-hardware-config-store.ts`](frontend/src/lib/experiment-hardware-config-store.ts)。
- **决策**：从产品中 **移除该页承载的内容与心智**（或整页下线），不在此继续投资 IoT/香料映射。

---

## 2. 「实验配置」目标定义（与用户对齐）

| 维度 | 含义 |
|------|------|
| **主体** | 教师发起/引导，学生参与设计与实施 |
| **对象** | 一次探究任务：问题—假设—步骤—记录—结论（可与现有「想法—方法—做法」叙事一致） |
| **形态** | 「舞台」= 可编辑的实验方案与课堂流程（步骤、材料清单、安全提示、分工、提交物等），而非设备 ID 绑定 |

与仓库中更接近该心智的入口：

- **教师侧（已有）**：[`/teacher/experiment-editor`](frontend/src/app/(dashboard)/teacher/experiment-editor/page.tsx) — 实验发布与方案编辑。
- **学生侧（待建）**：独立路由承载 **小组方案 / 协作编辑**（路径与数据模型执行阶段再定），与实验库 [`/experiments`](frontend/src/app/(dashboard)/experiments) 形成「领取任务 → 在舞台共研」的闭环。

**已确认（2026-04-12）**：采用 **师生分路** —— 不将「实验配置」单点指向仅教师或仅学生；**待学生协作页落地后**，再统一考虑侧栏是否用一项聚合、或分「教师实验设计」「小组探究方案」两项。

---

## 3. 建议实施方案（执行阶段再动代码）

### 3.1 导航与路由

- **立即**：从 [`frontend/src/config/nav-config.ts`](frontend/src/config/nav-config.ts) **移除** 指向硬件页的 `admin-experiment-config`（`/admin/experiment-config`），避免错误心智。
- **教师**：在教师工作台导航中确保 **实验编辑/发布** 入口清晰（现有 `experiment-editor` 或等价文案），不依赖「实验配置」四字。
- **学生协作路由落地后**：新增页面（例如 `/student/...` 或 `/class/...` 下的小组方案页），再在 `nav-config` 为 **学生/组长** 角色注册入口；可选与教师项并列或归入「实验」分组。
- **旧链接**：若需兼容书签，可将 `/admin/experiment-config` **重定向** 到教师 `experiment-editor`（仅教师可见时对学生应 403 或回首页），直至学生路由就绪后再评估是否改为多角色分流页。

### 3.2 代码清理（与移除范围一致）

- 删除或空置 [`experiment-config/page.tsx`](frontend/src/app/(dashboard)/admin/experiment-config/page.tsx) 的硬件 UI（若整页删除，同步删路由文件）。
- 评估是否删除 [`experiment-hardware-config-store.ts`](frontend/src/lib/experiment-hardware-config-store.ts) 及仅被其引用的审计 payload。
- [`IoTConfigPanel`](frontend/src/components/business/experiment-detail/iot-config-panel.tsx)：若产品完全不做传感，可改为 **弱化/折叠** 或改为与「探究记录」相关的占位，避免仍出现「监控设备 ID」强叙事。
- [`mock-experiment-management.ts`](frontend/src/data/mock-experiment-management.ts) 中 `spiceId` / `monitorChannels`：若仅服务已删页面，可 **删除字段** 并调整 [`teacher/experiment-editor`](frontend/src/app/(dashboard)/teacher/experiment-editor/page.tsx) 中对应表单区块。

### 3.3 文档

- 在 [`docs/contracts/science-community-console-mock-spec.md`](docs/contracts/science-community-console-mock-spec.md) 或产品 README 中加一句：**「实验配置」指探究方案设计，不包含 IoT 设备台账**（避免后续需求回潮）。

---

## 4. 与前一版方案的差异

| 前一版 | 现版 |
|--------|------|
| 保留页并改名、打通 IoT | **不保留**该硬件配置能力 |
| 「场域与设备」为辅助域 | **项目不需要**该子域 |
| 方案 B 接 localStorage 到面板 | **取消**；改为师生「设计舞台」由教师编辑器 + 实验库承接 |

---

## 5. 信息架构（已拍板）

- **策略**：师生 **分路** —— 教师用 `experiment-editor`；学生用 **待建的协作编辑/小组方案** 路由后再挂菜单。  
- **不再使用** `/admin/experiment-config` 承载「实验配置」四字，直至产品与视觉统一新导航文案。

---

## 6. 执行清单（摘要）

1. **Nav**：删除硬件向「实验配置」项；教师侧强化既有实验编辑入口。  
2. **下线**：移除 `/admin/experiment-config` 硬件 UI、`experiment-hardware-config-store` 及耦合字段（含 mock / 教师表单中的 spice/监控字段，按范围）。  
3. **详情**：弱化或改写 `IoTConfigPanel`，去除与项目无关的传感强叙事。  
4. **规格**：补一句「实验配置 = 探究方案设计，非 IoT」。  
5. **后续**：实现 **学生小组方案/协作编辑** 页与权限，再注册学生导航项。

---

## 7. 实现状态（已完成，2026-04-12）

- Mock：`experiment-mgmt` 行类型已去掉 `spiceId` / `monitorChannels`。
- 教师实验编辑器：已去掉硬件侧栏与相关 state；`canEditMaterialsAndStepContent` 替代旧名；文案改为材料/探究方案表述。
- `/admin/experiment-config`：已添加 **重定向** 至 `/teacher/experiment-editor`。
- 规格：`science-community-console-mock-spec.md` §1.1 已在此前迭代中更新。
- 审计与评审占位文案：已弱化 IoT/香料专用话术。

**未做（仓库中本不存在独立 IoT 面板文件时跳过）**：若曾计划改写 `IoTConfigPanel`，当前 `frontend` 下无对应组件则无需处理。

**仍待产品**：学生侧「小组方案/协作编辑」路由与导航（见 §6 第 5 条）。
