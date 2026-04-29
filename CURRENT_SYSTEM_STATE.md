# CURRENT_SYSTEM_STATE

<!-- AUTO_HEAL_DASHBOARD_START -->
> [!CAUTION] **数字医生巡检看板**
> - **最新报告**: [[AUTO_HEAL_AUDIT.md]] (生成时间: 2026-04-29 18:20)
> - **系统体征**: 发现 [0] 个高频阻断，[0] 个待自愈项。
> - **治理视图**: 待处理人工反馈: [0]，已关联自愈项: [0] 条。
> - **治理看板**:
>   - [💜] 已分诊反馈: 0 条 (无)
>   - [🔍] 活跃指纹: [无活跃指纹]
> - **即时指令**: 运行 `npm run heal:doctor` 获取修复建议。
<!-- AUTO_HEAL_DASHBOARD_END -->

> 目的：作为后续所有开发任务的顶层上下文，记录当前系统已经完成的安全加固、关键补丁位置，以及明确暂缓的技术债。
>
> 适用范围：内测上线前的最终代码状态，以 `frontend/` 与 `backend/` 真实代码为准。

## 1. 当前安全架构总览

### 1.1 认证链路

当前登录态由后端 Cookie Session 真源控制，核心流程如下：

1. 登录后签发 `v2_access_token` 与 `v2_refresh_token`
2. `access token` 负责短期访问，`refresh token` 负责续期
3. `/v2/auth/profile` 在 access 失效但 refresh 仍有效时，允许自动续期一次并回写新 Cookie
4. 前端 `useAuth()` 以 `/v2/auth/profile` 为唯一鉴权入口，失败时回落到未登录态

关键实现点：

- `backend/src/lib/auth/v2-session.ts`
  - `verifyV2AccessToken()` / `verifyV2RefreshToken()` 负责同步验签
  - refresh token 采用 **内存 Map 快速路径 + MySQL 持久化备份**
  - 启动时会尝试自动建表 `sys_auth_refresh_token`
- `backend/src/http/routes/v2-auth.ts`
  - `/v2/auth/profile` 在 access 过期时会尝试用 refresh 自动续期
  - `/v2/auth/refresh` 提供显式刷新接口
- `frontend/src/hooks/use-auth.ts`
  - 所有页面的当前用户上下文都从 `fetchV2Profile()` 获取
  - 默认用户已收敛为 `Role_Student`，避免高权限兜底

### 1.2 授权链路

当前授权采用\u201c路由级权限 + 服务层业务校验 + 数据库约束\u201d三层防线：

1. **路由级权限**
   - 通过 `assertAnyPermission(...)` 在路由入口阻断明显越权
2. **服务层校验**
   - 业务写入前校验目标组织、角色、学科、用户是否真实存在
3. **数据库层约束**
   - 通过事务、`SELECT ... FOR UPDATE`、`DELETE ... JOIN` 等方式降低竞态风险

核心授权组件：

- `backend/src/lib/auth/permission-guard.ts`
- `backend/src/lib/auth/role-permissions.ts`
- `backend/src/http/routes/v2-sys-org.ts`
- `backend/src/services/TeacherClassService.ts`

### 1.3 数据锁定与一致性机制

组织结构变更与教师授课绑定目前都采用\u201c先校验、再事务、再写入\u201d的模式，尽量把安全边界放在后端：

- 组织结构侧：
  - 前端仅做差异计算与交互提示
  - 真正的阻断必须落在后端事务内重新校验
- 教师授课侧：
  - `sys_user_role` 的绑定写入前会校验班级、学科、角色是否有效
  - 同步关系时以事务包裹整包替换，避免部分成功

> 重要原则：前端 diff 和提示只能作为 UX 预警，不能作为安全边界。

---

## 2. 关键补丁索引

### 2.1 `frontend/src/lib/v2/apiService.ts`

当前定位：**认证容灾与请求重试的统一入口**。

最新变动逻辑应保持如下原则：

- 当请求返回 `401` 时，不应立即把用户踢出系统
- 应先尝试一次静默 refresh
- refresh 成功后，重放原请求
- refresh 失败后，再走统一的未登录/登出处理
- 必须避免多请求并发触发 refresh 风暴，因此需要做 **refresh 去重**

关注点：

- 这是登录稳定性的第一道缓冲
- 若实现不当，会直接表现为\u201c掉线\u201d或\u201c白屏\u201d

### 2.2 `backend/src/infrastructure/repositories/v2-sys-org-repository.ts`

当前定位：**组织结构变更的后端落库与删除控制点**。

在上线前审计中，这里应承担以下职责：

- 组织删除必须走事务
- 删除前必须对目标节点及其子树执行数据库级锁定
- 删除前必须重新检查学生数据是否存在
- 不能只依赖前端 diff 结果

建议保持的核心语义：

- `SELECT ... FOR UPDATE` 锁住目标组织及其子树
- 在同一事务内重新验证学生计数
- 若存在学生，必须整体阻断删除
- 删除必须是\u201c校验和执行原子化\u201d的

### 2.3 `backend/src/services/TeacherClassService.ts`

当前定位：**教师授课关系的归属权校验与事务写入**。

关键业务语义：

- `bindTeacherClassRole(...)`
  - 单条绑定时，必须校验用户、班级、学科、角色均有效
- `syncTeacherRelations(...)`
  - 整包替换教师的班级授课关系
  - 使用事务删除旧绑定并插入新绑定
  - 对每条 `classOrgId` 必须再次做后端校验

必须保持的安全约束：

- 不允许仅依赖前端传入的 `classId/classOrgId`
- 不允许教师跨校/跨组织绑定不可见班级
- 任何 `roleId` 与 `subjectId` 的映射都必须遵循后端规则或环境映射

---

## 3. 当前已确认的核心风险与对应状态

### 3.1 已重点审计并加固的高风险域

1. **组织架构同步安全性**
   - 风险来源：前端 diff 与后端删除之间存在竞态窗口
   - 结论：前端只能提示，后端事务锁定才是最终阻断点

2. **教师批改/授课越权**
   - 风险来源：前端请求中的 `classId` 可被手工篡改
   - 结论：必须在后端通过 SQL 级别校验二次归属权

3. **登录与 Token 持久化**
   - 风险来源：高并发下 refresh 持久化延迟、Cookie 续期失败
   - 结论：需要静默 refresh + 原请求重放 + 并发去重

### 3.2 当前的安全边界共识

- 前端：负责体验、提示、交互确认
- 后端：负责最终阻断、事务、归属权判定
- 数据库：负责一致性与原子性

---

## 4. 待处理技术债（已标记为 Should Fix / 内测后优化）

以下项为我们已识别但为了内测上线暂缓的技术债，不应在当前窗口扩大改造面：

### 4.1 认证与会话体验

- `frontend/src/lib/v2/apiService.ts`
  - 需要完善 refresh 去重、指数退避、失败降级策略
  - 当前优先级：Should Fix

### 4.2 组织同步与删除流程

- `backend/src/infrastructure/repositories/v2-sys-org-repository.ts`
  - 需要进一步收敛删除路径，统一封装到单一服务入口
  - 需要更完整的审计日志
  - 当前优先级：Should Fix

### 4.3 教师授课关系管理

- `backend/src/services/TeacherClassService.ts`
  - 可进一步补充跨校/跨组织审计日志
  - 可增加更清晰的错误码与前端提示分层
  - 当前优先级：Should Fix

### 4.4 其他已知但暂缓的系统级技术债

这些项在前序审计中已被识别，但未纳入当前上线阻断范围：

- 前端部分页面仍存在可继续统一的 UI 风格差异
- 角色权限页与真实 `sys_role_perm` 模型的进一步对齐
- 登录页的验证码、频控、防刷能力增强
- 更全面的前端路由级守卫（例如 middleware 层）
- 更完整的操作审计日志与告警闭环

### 4.5 OCR 识别与图片校验

- `frontend/src/app/api/ai/media-cover-ocr/route.ts`
  - 新增相对 URL 补全逻辑（服务端 fetch 无法解析 `/api/...` 路径）
  - 新增图片可访问性 HEAD 校验：不通 -> 返回 422 + 具体错误文案
  - 移除硬编码 mock 数据，改为 503 "OCR 服务未就绪"
  - fallback: `NEXT_PUBLIC_APP_URL || http://localhost:4200`
  - 当前优先级：Done

### 4.6 视频封面缩略图统一

- `frontend/src/app/(dashboard)/teacher/experiment-editor/_components/sections/EditorMainVideoSection.tsx`
  - 所有 OCR 触发入口（上传/媒体库/初始加载）统一使用 `variant=thumb_sm`
  - 视频流 URL（`action=view`）不再被用作 OCR 识别的图源
  - 当前优先级：Done

### 4.7 v2-file 本地存储兜底移除

- `backend/src/http/routes/v2-file.ts`
  - 修复 `tryMinioStorageKeyFromFileUrl` typo -> `tryStorageKeyFromFileUrl`（两处）
  - thumbnail/ensure：移除文件 URL 不在 S3 时的静默跳过，返回明确 400
  - presigned-url：移除 `isHttpUrl` 兜底返回原 URL 的行为，非 S3 直链报 400
  - 当前优先级：Done

> 说明：上述项均属于\u201c内测后优化\u201d或\u201c下一阶段重构\u201d，当前不应阻塞宝山区内测上线。

---

## 5. 当前开发约束

1. **数据资产不可丢**
   - 任何删除类改动必须先过后端事务校验

2. **业务主链路必须闭合**
   - 登录、组织同步、教师授课、实验主流程不得依赖前端模拟态作为唯一来源

3. **角色权限严防越权**
   - 所有 `classId/orgId/roleId` 相关输入都不能信任前端

4. **上线窗口内优先稳定，不做大重构**
   - 只修阻断级问题，不扩散到非阻断技术债

---

## 6. 使用方式

后续每个开发任务开始前，默认先对照本文件确认：

- 认证态是否仍然以 Cookie Session 为真源
- 授权判断是否仍然在后端完成最终阻断
- 删除/同步类写操作是否仍然有事务与归属权校验
- 新增改动是否会破坏当前已确认的上线边界

## 7. 结论

当前系统已经进入\u201c可内测、需严控边界\u201d的阶段。

如果后续任务会触碰以下任一主题，必须先重新做代码级审计：

- `auth`
- `session`
- `refresh token`
- `org delete`
- `teacher class sync`
- `permission guard`
