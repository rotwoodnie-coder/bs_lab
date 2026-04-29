# 实验工作台上下文存档

> 用途：方便下次继续开发，或在新窗口重新接手时快速恢复背景。

## 当前目标

围绕实验编辑/工作台页面进行视觉与交互优化，重点是：

- 保留视频播放、加载、媒体库选择、本地上传、OCR 识别等功能
- 视觉上尽量回到最初更干净、更专业的工作台风格
- OCR 结果以简洁文本呈现，不再增加复杂引用卡片
- 不改动已接通的 `vm` 状态流和 `actions` 接口

## 已确认的业务方向

### OCR 功能

已整理出一份独立说明文档：

- `docs/ocr-usage-spec.md`

核心约定：

- 选择媒体库视频后自动触发 OCR
- 上传本地视频后自动触发 OCR
- 支持手动点击“识别视频文字”再次触发
- OCR 结果在视频下方以 text 形式展示
- 尽量回填实验名称、年级等字段
- 不要破坏视频主视觉

### 文档对齐目标

后续开发应与以下文档保持一致：

- `docs/ocr-usage-spec.md`

## 当前代码状态

### 1. 旧工作台页

旧的实验编辑工作台仍在仓库中，主要组件链路是：

- `frontend/src/app/(dashboard)/teacher/experiment-editor/page.tsx`
- `frontend/src/app/(dashboard)/teacher/experiment-editor/page.container.tsx`
- `frontend/src/app/(dashboard)/teacher/experiment-editor/_components/ExperimentEditorShell.tsx`
- `frontend/src/app/(dashboard)/teacher/experiment-editor/_components/EditorCanvasSections.tsx`
- `frontend/src/app/(dashboard)/teacher/experiment-editor/_components/sections/EditorBasicSection.tsx`

这些文件里承载了原有的工作台/编辑器状态流。

### 2. 独立工作台页

当前尝试建立一个独立页面：

- `frontend/src/app/experiment-workbench/page.tsx`

这个页面主要用途是：

- 作为新的独立工作台入口
- 用更接近参考图的方式重新组织视觉
- 未来再逐步接入视频/OCR等真实功能

### 3. 关于布局调整的结论

在多次尝试后，结论是：

- 需要“减法”
- 不要再把 OCR、引用信息、右侧功能块堆得太重
- 视频区域应该继续作为视觉核心
- OCR 区域应该尽量简洁，放在视频下方
- 其它区域要控制密度，避免页面显乱

## 近期尝试过但需要谨慎的点

### 1. 不要继续大范围改旧工作台

之前对旧工作台页面做了较大范围的视觉/结构调整，容易导致：

- 页面变乱
- 入口混淆
- 编译路由冲突
- 用户感知“不如原来好看”

建议：

- 旧工作台尽量少动
- 如果要做新视觉，就在独立路由里做

### 2. 路由冲突问题

曾尝试新增：

- `/experiment-manage/editor`
- `/experiment-manage`

但 Next.js 并行路由解析会冲突。

当前原则：

- 不要再新增会和现有路由冲突的页面
- 如需新入口，使用独立且不冲突的路径

### 3. 视觉恢复方向

用户最终认可的方向是：

- 参考最初上传的那版视觉
- 采用“减法”
- 顶部状态卡、主视频区、OCR 区、右侧辅助区要有秩序
- 避免花哨背景和过度卡片化

## 当前建议的继续开发方式

### 推荐策略

1. **保持旧工作台稳定**
   - 不继续大改旧页面

2. **以独立工作台为试验场**
   - 在 `frontend/src/app/experiment-workbench/page.tsx` 中逐步搭建
   - 先保证视觉基准，再接功能

3. **先做视觉减法，再接真实逻辑**
   - 先固定结构：左侧导航 / 中轴视频区 / 右侧辅助区
   - 再接视频播放、上传、OCR

4. **OCR 严格遵循说明文档**
   - 结果文本化
   - 不做复杂引用信息卡
   - 视频下方显示即可

## 后续如果继续开发，建议先做的事

- 确认当前要继续的是“旧工作台”还是“独立工作台”
- 以 `docs/ocr-usage-spec.md` 为准对齐 OCR 交互
- 如继续做视觉，优先恢复到参考图风格
- 保持改动最小化，避免再次把页面越改越乱

## 快速恢复提示

如果下次从新窗口接手，建议先看这几个文件：

- `docs/experiment-workbench-context-archive.md`
- `docs/ocr-usage-spec.md`
- `frontend/src/app/experiment-workbench/page.tsx`
- `frontend/src/app/(dashboard)/teacher/experiment-editor/_components/EditorBasicSection.tsx`
- `frontend/src/app/(dashboard)/teacher/experiment-editor/_components/ExperimentEditorShell.tsx`

## 最后结论

当前最佳状态是：

- 功能：OCR 方向已明确并有说明文档
- 视觉：不要继续在旧工作台上大改
- 开发：优先在独立工作台上做“减法重构”
- 维护：以后先看这个存档，再继续
