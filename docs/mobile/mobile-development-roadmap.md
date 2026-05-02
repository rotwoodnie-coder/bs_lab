# 科学小实验社区移动端开发规划与实施计划

> 适用范围：移动端 `/m` 体系、家长绑定、学段分流、视频播放、作业闭环、题库统计、上传与中间件守卫。
>
> 规划基线：
> - 复用 `sys_parent_student_rel` 作为家长-孩子绑定真源
> - 仅使用视图做零侵入分流：`v_active_parent_children`、`v_user_school_stage`
> - `submitAnswer` 采用本地数据库事务，答案存盘与统计冗余表同事务原子更新
> - 严禁在 `sys_user` 物理表增加孩子信息、学段信息或 JSON 绑定字段

---

## 一、MDC 规则与质量红线

### 必须遵循的规则
- `truth-source-hierarchy.mdc`
  - 绑定真源只能使用 `sys_parent_student_rel`
  - 禁止在 `sys_user` 中新增孩子、绑定、学段等真源字段
- `backend-logic-consistency.mdc`
  - 所有统计类写入必须走写时事务
  - 禁止“先查再改”造成竞态
- `db-infrastructure-protection.mdc`
  - 只允许零侵入修改
  - 不新建重复真源，不改现有表结构
- `single-file-300-lines-max.mdc`
  - 规划中的实现需按职责拆分文件，避免单文件超 300 行

### 额外质量红线
- 不允许把学段、孩子绑定、绑定状态写入 `sys_user`
- 不允许绕开 `sys_parent_student_rel` 另起绑定真源
- 不允许统计冗余表写入与答案存盘分离提交
- 不允许 `/m/login`、`/m/bind/child` 进入绑定死循环

---

## 二、总体交付目标

在不破坏现有 PC 端稳定性的前提下，完成“科学小实验社区”移动端一期骨架：

1. 移动端入口 `/m` 完成鉴权、绑定拦截、学段分流
2. 家长绑定孩子闭环上线，支持多孩子切换
3. 小学 / 中学双风格 UI 分流
4. 视频播放、步骤联动、安全播报、不可跳过状态锁
5. 作业与答题闭环，保证事务一致性与统计秒开
6. 上传支持断点续传，服务入口明确

---

## 三、四阶段任务拆解

## Phase 1 基础设施插桩（Day 1-2）

### Day 1
#### 任务 1：落地数据库视图
- [x] 创建 `v_active_parent_children`
  - [x] 过滤 `sys_parent_student_rel.audit_status = 'Y'`
  - [x] 作为后续绑定查询唯一读入口
- [x] 创建 `v_user_school_stage`
  - [x] 通过 `sys_user -> sys_org -> data_school_grade -> data_school_level` 推导学段
  - [x] 前端统一按 `school_level_id` 做 UI 分流

**遵循规则**
- `truth-source-hierarchy.mdc`
- `db-infrastructure-protection.mdc`

**回滚方案**
- 删除迁移文件对应视图即可
- 或执行 `DROP VIEW IF EXISTS v_active_parent_children; DROP VIEW IF EXISTS v_user_school_stage;`

**风险预警**
- 视图中若 `sys_org.grade_id` 为空，学段推导结果会为空
- 需用测试样本覆盖“班级节点缺 grade”场景

**交付物**
- New: `database/migrations/0060_mobile_parent_views.sql`

#### 任务 2：重构移动端中间件
- [x] 修改 `frontend/src/middleware.ts`
- [x] 新增 `/m` 路由守卫
- [x] 实现逻辑：
  - [x] 未登录 → `/m/login`
  - [x] 家长且无绑定 → `/m/bind/child`
  - [x] 学生/教师或家长已绑定 → 放行
- [x] 白名单路径：`/m/login`、`/m/bind/child`
- [x] 增加死循环防护

**遵循规则**
- `truth-source-hierarchy.mdc`
- `backend-logic-consistency.mdc`
- `single-file-300-lines-max.mdc`

**回滚方案**
- 恢复旧版 middleware 路由守卫
- 删除 `/m` 专用判定分支

**风险预警**
- 必测“登录页→回跳→绑定页→成功→回首页”链路
- 必测“未绑定家长访问任意 `/m/**` 页面”不会形成重定向死循环

**交付物**
- Modified: `frontend/src/middleware.ts`

#### 任务 3：明确 JWT 字段扩展点
- [x] 标注后端签发 JWT 时需携带：
  - [x] `has_binding`
  - [x] `school_level_id`
- [x] 需确认具体待修改文件：
  - [x] JWT 签发服务
  - [x] 登录接口响应组装处
  - [x] refresh token 或 session payload 构造处

**遵循规则**
- `truth-source-hierarchy.mdc`
- `backend-logic-consistency.mdc`

**回滚方案**
- 若字段尚未启用，可继续兼容旧 payload
- 前端仍可降级使用绑定视图与默认首页

**交付物**
- Modified: 待确认 JWT 签发入口文件

### Day 2
#### 任务 4：绑定查询链路接入视图
- [x] 所有绑定查询统一改为读 `v_active_parent_children`
- [x] 绑定列表、孩子切换、家长首页默认孩子读取均从视图读取

**遵循规则**
- `truth-source-hierarchy.mdc`
- `db-infrastructure-protection.mdc`

**回滚方案**
- 查询层退回直读 `sys_parent_student_rel`

**交付物**
- Modified: 绑定服务层 / 仓储层

#### 任务 5：新增中小学分流策略接口约定
- [x] 后端返回用户上下文时补充：
  - [x] `school_level_id`
  - [x] `grade_id`
  - [x] `has_binding`
- [x] 前端首页布局仅根据 `school_level_id` 分流

**遵循规则**
- `truth-source-hierarchy.mdc`
- `single-file-300-lines-max.mdc`

**回滚方案**
- 前端回退为单一移动端布局，不做学段差异化

**交付物**
- Modified: 用户上下文 / 首页初始化逻辑

---
### Phase 1 补充：Mock Server 与数据准备（Day 2 下午）

**任务：搭建移动端专用 Mock 环境**
- [x] 技术选型：MSW (Mock Service Worker) 或 json-server（根据项目习惯）
- [x] 需 Mock 的接口清单：
  1. `GET /api/bindings` — 返回 `v_active_parent_children` 的绑定列表（含审核状态）
  2. `GET /api/user/context` — 返回 `has_binding`、`school_level_id`、`role`
  3. `POST /api/bind/apply` — 模拟绑定申请，返回成功状态
  4. `POST /api/login` — 返回含 `has_binding` 和 `school_level_id` 的 JWT（可通过硬编码或简单逻辑）
  5. `GET /api/video/:id` — 视频与步骤元数据
  6. `POST /api/quiz/submitAnswer` — 模拟答案提交与统计更新（用于事务测试的 Mock 返回）

**遵循规则**
- `db-infrastructure-protection.mdc`（Mock 数据不得绕过视图逻辑，即 mock 的绑定数据必须符合 `audit_status='Y'` 的过滤结果）
- `single-file-300-lines-max.mdc`（Mock 处理器拆分为独立文件）

**回滚方案**
- 删除 mock 目录或关闭 MSW 初始化开关

**风险预警**
- Mock 数据必须与真实数据库字段保持一致，需定期与最新 schema 同步

**交付物**
- New: `frontend/src/mocks/handlers/` 下的 handler 文件
- New: `frontend/src/mocks/browser.ts` 或初始化入口

## Phase 2 UI 引擎与分流路由（Day 3-5）

### Day 3
#### 任务 1：建立移动端目录边界
- [x] 所有移动端页面必须放在 `frontend/src/app/m/`
- [x] 严禁污染 `admin` 目录或复用后台页面组件
- [x] 建立 `/m/layout.tsx`、`/m/page.tsx`、`/m/profile/page.tsx` 等基础页面骨架

**遵循规则**
- `db-infrastructure-protection.mdc`
- `single-file-300-lines-max.mdc`

**回滚方案**
- 删除新增 `m` 路由树，恢复仅后台页面

**风险预警**
- 不允许与 `admin` 共用同一页面壳导致样式冲突

**交付物**
- New: `frontend/src/app/m/layout.tsx`
- New: `frontend/src/app/m/page.tsx`
- New: `frontend/src/app/m/profile/page.tsx`

#### 任务 2：布局动态分发
- [x] 小学：圆润大图标、高饱和、低信息密度
- [x] 中学：扁平化、信息密度适中
- [x] `Layout` 根据 `school_level_id` 动态切换

**遵循规则**
- `truth-source-hierarchy.mdc`
- `single-file-300-lines-max.mdc`

**回滚方案**
- 统一使用中性基础布局，不按学段分发

**交付物**
- Modified: `frontend/src/app/m/layout.tsx`
- New: `frontend/src/components/mobile/` 下分流组件

### Day 4
#### 任务 3：完成 `/m/bind/child` 页面闭环
- [x] 页面展示家长绑定状态
- [x] 调用绑定申请/确认接口
- [x] 绑定成功后更新 JWT 中 `has_binding = true`
- [x] 完成后跳转到 `/m`

**需串联接口**
- 查询：`v_active_parent_children`
- 提交：绑定申请接口
- 审核：后端审核接口
- 完成：重新签发 JWT

**遵循规则**
- `truth-source-hierarchy.mdc`
- `backend-logic-consistency.mdc`

**回滚方案**
- 关闭绑定申请入口，仅保留提示页

**风险预警**
- 绑定成功后的 token 刷新必须立即生效，否则会被中间件再次踢回

**交付物**
- New: `frontend/src/app/m/bind/child/page.tsx`
- Modified: 绑定接口调用层

### Day 5
#### 任务 4：家长多孩子切换 UI
- [x] 首页顶部显示孩子头像列表
- [x] 切换孩子时自动更新全局 child 上下文
- [x] 仅展示当前孩子相关数据

**遵循规则**
- `truth-source-hierarchy.mdc`
- `backend-logic-consistency.mdc`

**回滚方案**
- 退回单孩子默认展示

**交付物**
- Modified: `frontend/src/app/m/*`
- New: `frontend/src/components/mobile/child-switcher.tsx`

---

## Phase 3 核心视频与安全锁（Day 6-9）

### Day 6
#### 任务 1：视频播放器基础壳
- [x] 开发视频播放页 `/m/video/:id`
- [x] 播放器与步骤列表联动
- [x] 支持时间轴定位步骤

**遵循规则**
- `single-file-300-lines-max.mdc`
- `truth-source-hierarchy.mdc`

**回滚方案**
- 退回纯视频播放，不做步骤联动

**交付物**
- New: `frontend/src/app/m/video/[id]/page.tsx`
- New: `frontend/src/components/mobile/video-player.tsx`

### Day 7
#### 任务 2：Web Speech API 安全播报
- [x] 当前步骤安全提示朗读期间禁用“下一步”
- [x] 播报期间加半透明蒙层与倒计时
- [x] 朗读结束自动解锁

**遵循规则**
- `single-file-300-lines-max.mdc`
- 视觉与可用性规则

**回滚方案**
- 降级为纯文本安全提示，不启用语音

**风险预警**
- Safari / 部分 Android WebView 可能不支持完整语音能力，需要保底点击确认

**交付物**
- Modified: 播放器组件
- New: `frontend/src/hooks/useVideoSecurity.ts`

### Day 8
#### 任务 3：步骤不可跳过状态机
- [x] 设计播放步骤状态机：
  - [x] `idle`
  - [x] `playing`
  - [x] `speeching`
  - [x] `locked`
  - [x] `completed`
- [x] 前进按钮仅在安全播报完成后开启
- [x] 不允许直接跳步越权

**遵循规则**
- `backend-logic-consistency.mdc` 的一致性思想
- `single-file-300-lines-max.mdc`

**回滚方案**
- 临时关闭“强锁”机制，恢复普通步骤浏览

**风险预警**
- 必测“快速点击下一步”“切后台再回来”“音频未加载完成”等边界情况

**交付物**
- Modified: 步骤状态管理文件
- New: `frontend/src/state/video-step-machine.ts`

### Day 9
#### 任务 4：播放器与推荐列表联动
- [x] 播放页右侧/下方相关视频列表
- [x] 根据学段、角色、当前视频上下文推荐下一条

**遵循规则**
- `truth-source-hierarchy.mdc`
- `single-file-300-lines-max.mdc`

**回滚方案**
- 推荐列表降级为固定静态列表

**交付物**
- Modified: 播放页推荐区域
- Modified: 视频推荐接口封装

---

## Phase 4 业务闭环与性能优化（Day 10-14）

### Day 10
#### 任务 1：分片上传与断点续传
- [ ] 实现带断点续传的分片上传
- [ ] 标注上传服务入口
- [ ] 上传任务需持久化 `uploadId`

**服务入口建议**
- 前端：`frontend/src/lib/upload/*`
- 后端：现有上传 API 路由或独立上传服务入口

**遵循规则**
- `single-file-300-lines-max.mdc`
- `db-infrastructure-protection.mdc`

**回滚方案**
- 关闭分片模式，退回单文件上传

**风险预警**
- 需验证弱网、断网、切后台恢复

**交付物**
- New: `frontend/src/hooks/useChunkUpload.ts`
- Modified: 上传入口调用层

### Day 11
#### 任务 2：任务作业闭环
- [ ] 作业发布、接收、上传、批阅、通知链路打通
- [ ] 家长可代交，但归属学生

**遵循规则**
- `backend-logic-consistency.mdc`
- `truth-source-hierarchy.mdc`

**回滚方案**
- 禁用代交，先上线学生自交流程

**交付物**
- Modified: 作业相关接口与页面

### Day 12
#### 任务 3：实现 `submitAnswer` 事务逻辑
- [ ] 使用本地数据库事务
- [ ] 主表：`quiz_answers`
- [ ] 统计表：`class_quiz_stats`
- [ ] 先插入答案，再判题，再 UPSERT 统计
- [ ] 统计采用 `INSERT ... ON DUPLICATE KEY UPDATE`
- [ ] 严禁先查再改

**规则要求**
- `backend-logic-consistency.mdc`
- `truth-source-hierarchy.mdc`

**回滚方案**
- 回退事务逻辑前，先暂停题库统计入口
- 必要时用补偿脚本重算统计表

**风险预警**
- 必测并发提交同一题目、同一班级统计是否重复累加
- 必测事务失败后是否出现“答案已存而统计未更新”

**交付物**
- Modified: `submitAnswer` 所在服务文件
- Modified: `class_quiz_stats` 写入逻辑

### Day 13
#### 任务 4：统计秒开
- [ ] 老师端查询班级答题统计直接读 `class_quiz_stats`
- [ ] 不回查原始答案表
- [ ] 确保统计接口秒级响应

**遵循规则**
- `backend-logic-consistency.mdc`

**回滚方案**
- 查询层临时降级为聚合原始答案表，但只作为短期应急

**交付物**
- Modified: 统计查询接口

### Day 14
#### 任务 5：收尾验证与性能优化
- [ ] 端到端回归：登录、绑定、切换孩子、播放、上传、答题、统计
- [ ] 完成弱网、死循环、事务失败、回滚验证
- [ ] 输出上线检查清单

**遵循规则**
- `backend-logic-consistency.mdc`
- `db-infrastructure-protection.mdc`
- `single-file-300-lines-max.mdc`

**回滚方案**
- 按模块回滚：中间件、视图、上传、统计、播放器

**交付物**
- Modified: 若干修复文件
- New: 上线验收清单

---

## 四、状态转换与防死循环设计

### 中间件状态流
1. 未登录访问 `/m/**`
   - 进入 `/m/login`
2. 登录成功后
   - 若是家长且 `has_binding = false`，进入 `/m/bind/child`
   - 若是学生/教师，直接进入 `/m`
   - 若是家长且 `has_binding = true`，直接进入 `/m`
3. `/m/login` 与 `/m/bind/child` 为白名单
   - 不再触发绑定检查
4. 绑定成功后重新签发 JWT
   - 必须写入 `has_binding = true`
   - `school_level_id` 一并写入，避免后续重复推导

### 风险预警：重定向死循环测试
必须覆盖以下用例：
- [x] 未登录访问 `/m` → `/m/login`
- [x] 未绑定家长访问 `/m` → `/m/bind/child`
- [x] 在 `/m/bind/child` 完成绑定后回跳 `/m`，不得再次跳回绑定页
- [x] `/m/login` 页面本身不得触发绑定检查
- [x] `/m/bind/child` 页面本身不得触发绑定检查

---

## 五、阶段级交付物总表

### Phase 1
**New**
- `database/migrations/0060_mobile_parent_views.sql`

**Modified**
- `frontend/src/middleware.ts`
- JWT 签发处待确认文件



### Phase 2
**New**
- `frontend/src/app/m/layout.tsx`
- `frontend/src/app/m/page.tsx`
- `frontend/src/app/m/profile/page.tsx`
- `frontend/src/app/m/bind/child/page.tsx`
- `frontend/src/components/mobile/child-switcher.tsx`

**Modified**
- `frontend/src/app/m/layout.tsx`
- `frontend/src/app/m/*` 相关页面
- 绑定接口调用层

### Phase 3
**New**
- [x] `frontend/src/app/m/video/[id]/page.tsx`
- [x] `frontend/src/components/mobile/video-player.tsx`
- [x] `frontend/src/hooks/useVideoSecurity.ts`
- [x] `frontend/src/state/video-step-machine.ts`

**Modified**
- [x] 播放器相关组件
- [x] 步骤联动逻辑

### Phase 4
**New**
- `frontend/src/hooks/useChunkUpload.ts`

**Modified**
- `submitAnswer` 服务文件
- `class_quiz_stats` 统计写入逻辑
- 上传服务入口
- 统计查询接口

---

## 六、验收标准

1. 不改 `sys_user` 物理表结构
2. 绑定查询全走 `v_active_parent_children`
3. 学段分流全走 `v_user_school_stage`
4. `/m` 不与后台 `admin` 目录混用
5. `/m/login` 与 `/m/bind/child` 无死循环
6. `submitAnswer` 与统计表更新同事务提交
7. 统计查询依赖冗余表实现秒开
8. 所有新增实现遵守单文件不超过 300 行的约束

---

## 七、实施备注

- 若后续需要补齐 JWT 字段，优先修改登录签发与刷新签发处，而不是在中间件里“猜字段”
- 若上传服务入口尚未统一，建议先做前端 Hook 封装，再接后端现有接口
- 若 `submitAnswer` 当前仓库路径未定位，可先新增最小服务层实现，再逐步接入路由
