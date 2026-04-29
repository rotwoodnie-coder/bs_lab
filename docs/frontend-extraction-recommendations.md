# lab_cloud 前端可抽取元素建议

本文基于旧项目 `d:\dev_program\lab_cloud` 的页面与组件结构，给出在 `bs_lab` 中的可抽取方向与优先级。

## P0（优先先做）

### 1) 页面壳层分层（Shell 模式）
- 旧项目首页采用 `Page + DesktopLayout + MobileLayout + Dialogs`，职责清晰，适合迁移。
- 建议在新项目保留四层结构：
  - `page`：数据装配与顶层状态
  - `layout`：桌面/移动端布局切换
  - `main`：业务主体列表与筛选
  - `dialogs`：编辑、审核、确认、流程反馈弹窗

### 2) 通用业务卡片（统一卡片协议）
- `UniversalExperimentCard` 已覆盖：状态、作者、指标、动作区、锁定态、移动端紧凑布局。
- 建议抽为 `CardBase + BusinessPreset`：
  - `CardBase` 只关心视觉槽位（cover/header/meta/actions/footer）
  - `ExperimentCard/WorkCard/AuditCard` 负责业务字段映射

## P1（第二阶段）

### 3) 交互状态 hooks 化
- 可抽取的典型状态：
  - feed 分页与 cursor
  - 加载/降级/重试
  - deep-link（`experimentId/workId/profileTab`）
  - role 能力差异（teacher/student/admin）
- 建议拆为：
  - `useFeedQueryState`
  - `useDeepLinkDialogs`
  - `useRoleCapabilities`

### 4) 动作处理器与面板解耦
- 旧页面里“创建/审核/发布/点赞/收藏/挑战”等动作逻辑较集中。
- 建议按“动作处理器 + 纯展示面板”拆分，便于测试：
  - `actions/*.ts`：纯业务动作
  - `panels/*.tsx`：只负责 UI 和回调绑定

## P2（第三阶段）

### 5) 跨端状态统一
- 统一 mobile/desktop 的状态来源，减少双端分支重复。
- 仅保留展示差异，不复制业务逻辑。

### 6) 事件与埋点归一
- 将页面内分散事件（如 quick-filter、feed refresh）统一到事件总线或 telemetry adapter，降低耦合。

## 推荐落地顺序（两周）

1. 第 1-2 天：抽壳层与通用卡片协议（P0）
2. 第 3-5 天：抽分页、深链、角色 hooks（P1）
3. 第 6-8 天：动作处理器与面板拆分（P1）
4. 第 9-10 天：跨端统一与埋点归一（P2）

## 参考源文件

- `d:\dev_program\lab_cloud\components\page\ScienceLab\ScienceLabPage.tsx`
- `d:\dev_program\lab_cloud\components\page\ScienceLab\DesktopLayout.tsx`
- `d:\dev_program\lab_cloud\components\shared\UniversalExperimentCard.tsx`
