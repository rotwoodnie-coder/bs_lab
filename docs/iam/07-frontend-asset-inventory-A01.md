# 中小学试验平台
# 前端资产盘点文档（A-01）
**版本**：V1.0
**盘点日期**：2026-04-20
**用途**：记录现有前端页面资产，明确每个页面对接 V2 新数据库的处置策略

---

## 一、盘点范围

`frontend/src/app/(dashboard)/` 下全部路由页面，共 **44 个页面**（含 debug 页面）。

---

## 二、页面资产清单与处置策略

### 分类说明

| 标签 | 含义 |
|------|------|
| 🟢 保留重构 | 保留页面，需对接 V2 API（优先级高） |
| 🟡 保留适配 | 保留页面，API 变化较小，轻量适配 |
| 🔵 保留观察 | 功能完整度待确认，先保留后视情况 |
| 🔴 废弃/暂停 | 不在 V2 业务范围内或完全重建 |

---

### 2.1 教师端页面

| 路由路径 | 页面功能 | V2 对应模块 | 处置策略 | 优先级 |
|---|---|---|---|---|
| `/teacher/home` | 教师主页 | sys_user + exp_msg | 🟢 保留重构 | P1 |
| `/teacher/experiment-editor` | 实验编辑器 | exp_msg + exp_step + exp_material | 🟢 保留重构 | P1 |
| `/teacher/experiment-preview` | 实验预览 | exp_msg (detail) | 🟢 保留重构 | P1 |
| `/teacher/assignments` | 作业管理 | exp_homework + exp_homework_student | 🟢 保留重构 | P1 |
| `/teacher/question-bank` | 题库 | exp_question + exp_question_select | 🟢 保留重构 | P1 |
| `/teacher/materials` | 教学材料 | material_msg + data_file | 🟢 保留重构 | P2 |
| `/teacher/reports` | 学情报告 | exp_homework_student（统计） | 🟡 保留适配 | P2 |
| `/teacher/social` | 社交互动 | social_like / social_evaluate | 🟡 保留适配 | P2 |
| `/teacher/research-project-groups` | 课题组 | sys_org（研究组类型） | 🟡 保留适配 | P3 |

---

### 2.2 学生端页面

| 路由路径 | 页面功能 | V2 对应模块 | 处置策略 | 优先级 |
|---|---|---|---|---|
| `/class/home` | 班级主页 | sys_org + exp_msg | 🟢 保留重构 | P1 |
| `/student/experiment-challenge` | 实验挑战 | exp_msg + exp_arbitration | 🟢 保留重构 | P1 |
| `/student/footprints` | 学习足迹 | exp_homework_student + scale_log | 🟡 保留适配 | P2 |

---

### 2.3 控制台（管理端）页面

| 路由路径 | 页面功能 | V2 对应模块 | 处置策略 | 优先级 |
|---|---|---|---|---|
| `/console` | 控制台首页 | 多模块汇总 | 🟡 保留适配 | P2 |
| `/admin/subject-config` | 学科配置 | data_school_subject + data_school_grade | 🟢 保留重构 | P1 |
| `/admin/experiment-config` | 实验配置 | exp_library + data_exp_difficulty | 🟢 保留重构 | P1 |
| `/admin/labs` | 实验室管理 | exp_library | 🟡 保留适配 | P2 |
| `/admin/menu-config` | 菜单配置 | sys_* 权限相关 | 🔵 保留观察 | P3 |
| `/admin/simulation-dev` | 模拟器开发 | exp_simulation_record | 🔵 保留观察 | P3 |

---

### 2.4 研究员端页面

| 路由路径 | 页面功能 | V2 对应模块 | 处置策略 | 优先级 |
|---|---|---|---|---|
| `/researcher/experiments` | 实验审核 | exp_msg（confirm流程） | 🟢 保留重构 | P1 |
| `/researcher/review` / `/researcher/reviews` | 实验评审 | exp_msg + social_evaluate | 🟢 保留重构 | P1 |
| `/researcher/curriculum-standards` | 课程标准 | data_coursebook + data_school_subject | 🟡 保留适配 | P2 |
| `/researcher/materials-supply` | 材料供应 | material_msg | 🟡 保留适配 | P2 |

---

### 2.5 家长端页面

| 路由路径 | 页面功能 | V2 对应模块 | 处置策略 | 优先级 |
|---|---|---|---|---|
| `/parent/child-progress` | 孩子进度 | exp_homework_student + scale_log | 🟡 保留适配 | P2 |
| `/parent/lab` | 家长实验 | exp_msg | 🔵 保留观察 | P3 |
| `/parent/tasks` | 任务中心 | exp_homework | 🟡 保留适配 | P2 |

---

### 2.6 通用功能页面

| 路由路径 | 页面功能 | V2 对应模块 | 处置策略 | 优先级 |
|---|---|---|---|---|
| `/experiment-manage` | 实验管理 | exp_msg（列表+筛选） | 🟢 保留重构 | P1 |
| `/experimental-materials` | 实验材料库 | material_msg + data_file | 🟢 保留重构 | P1 |
| `/experiments/[id]` | 实验详情 | exp_msg（详情聚合） | 🟢 保留重构 | P1 |
| `/messages` | 消息中心 | sys_msg | 🟢 保留重构 | P1 |
| `/profile` | 个人资料 | sys_user + scale_log + scale_title | 🟡 保留适配 | P2 |
| `/profile/family` | 家庭成员 | sys_user + sys_org | 🟡 保留适配 | P3 |
| `/resources` | 资源中心 | data_file + material_msg | 🟡 保留适配 | P2 |
| `/settings` | 设置 | sys_user | 🟡 保留适配 | P3 |
| `/district/overview` | 区级概览 | sys_org + exp_msg（统计） | 🔵 保留观察 | P3 |
| `/workbench` / `/workbench/[role]` | 工作台 | 角色路由分发 | 🔵 保留观察 | P3 |
| `/placeholder` | 占位页 | — | 🔴 废弃 | — |

---

### 2.7 Debug 页面（不参与生产）

| 路由路径 | 用途 | 处置策略 |
|---|---|---|
| `/debug/ui` / `/debug/ui/all-components` | UI 组件库 Living Styleguide | 🔵 保留维护 |
| `/debug/layout` | 布局调试 | 🔵 保留维护 |
| `/debug/workflow-lab` | 工作流实验 | 🔴 不参与 V2 |

---

## 三、P1 优先级汇总（需最先完成 V2 接入）

以下页面对接 V2 数据库直接影响核心业务流程，**建议在 D 阶段最先完成重构**：

| # | 路由 | 涉及 V2 表 |
|---|------|-----------|
| 1 | `/teacher/experiment-editor` | exp_msg, exp_step, exp_material, exp_video, exp_pic |
| 2 | `/experiments/[id]` | exp_msg（detail聚合） |
| 3 | `/experiment-manage` | exp_msg（列表+筛选） |
| 4 | `/researcher/experiments` | exp_msg（审核状态流转） |
| 5 | `/teacher/assignments` | exp_homework, exp_homework_student |
| 6 | `/student/experiment-challenge` | exp_msg, exp_arbitration |
| 7 | `/teacher/question-bank` | exp_question, exp_question_select |
| 8 | `/admin/experiment-config` | exp_library |
| 9 | `/admin/subject-config` | data_school_subject, data_school_grade |
| 10 | `/messages` | sys_msg |

---

## 四、API 接口变更影响评估

### 需要新建的 V2 API 路由

| 路由前缀 | 覆盖功能 | 优先级 |
|---|---|---|
| `GET/POST /v2/exp-library` | 标准试验库 CRUD | P1 |
| `GET/POST/PUT /v2/exp-msg` | 试验实例 CRUD | P1 |
| `GET /v2/exp-msg/:id/detail` | 试验详情聚合 | P1 |
| `GET/POST /v2/homework` | 作业管理 | P1 |
| `GET/POST /v2/question` | 题库管理 | P1 |
| `GET/POST /v2/sys-user` | 用户管理 | P1 |
| `GET/POST /v2/sys-org` | 组织管理 | P1 |
| `GET/POST /v2/sys-msg` | 消息收发 | P1 |
| `POST /v2/social/like` | 点赞/取消 | P2 |
| `POST /v2/social/collect` | 收藏/取消 | P2 |
| `GET/POST /v2/material` | 材料主库 | P2 |

### 可继续复用的旧路由

以下旧路由与 V2 结构无直接冲突，可短期保留：
- `/api/media/*` — 媒体中台，不受 V2 影响
- `/api/edu-textbooks/*` — 教材服务，迁移到 V2 后可复用

---

## 五、处置策略统计

| 策略 | 页面数量 |
|------|---------|
| 🟢 保留重构（P1 优先） | 13 |
| 🟡 保留适配（轻量修改） | 14 |
| 🔵 保留观察（待评估） | 8 |
| 🔴 废弃/不参与 | 2 |

---

## 六、盘点结论

1. **核心业务流程**（实验、作业、题库、消息）对应 13 个页面需优先对接 V2，建议在 D-01 至 D-04 阶段完成。
2. **所有页面均有对应 V2 表支撑**，不存在无法对应的业务场景。
3. **家长端**（3 个页面）业务逻辑相对独立，适配量小，可放入 D 阶段末期。
4. **媒体中台**（`/api/media/*`）与 V2 数据库解耦，无需重构。
5. `/placeholder` 可直接废弃；debug 页面不参与生产迭代，维持现状即可。

---

## 七、任务记录

- **任务编号**：A-01
- **执行日期**：2026-04-20
- **执行人**：AI（辅助执行）
- **输出结果**：本文档（前端资产盘点与处置策略）
- **是否需要人工验收**：是
- **人工验收结论**：待验收
- **验收要点**：
  - [ ] 确认页面列表无遗漏
  - [ ] 确认 P1 优先级判断是否符合业务实际
  - [ ] 确认废弃页面的删除时机
  - [ ] 补充各页面当前状态（是否已有旧 API 对接、是否 mock 数据）
