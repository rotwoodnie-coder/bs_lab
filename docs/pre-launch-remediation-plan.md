# BS Lab 内测上线前审计修复建议方案

> 基于 2026-04-27 审计报告编制 | 最近更新：2026-04-28 01:00  
> 目标：让四条角色主线流程闭环可上线

---

## 目录

1. [修复执行状态](#一修复执行状态)
2. [Phase 1 — 安全风险阻断 ✅ 已完成](#phase-1--安全风险阻断-已完成)
3. [Phase 2 — 权限加固 ✅ 已完成](#phase-2--权限加固-已完成)
4. [Phase 2 — 数据完整性 ✅ 已完成](#phase-2--数据完整性-已完成)
5. [Phase 2 — Mock 替换 ✅ 已完成（部分暂缓）](#phase-2--mock-替换-已完成部分暂缓)
6. [Phase 2 — 前端修复 ✅ 已完成](#phase-2--前端修复-已完成)
7. [待继续修复项](#七待继续修复项下一窗口)
8. [已同意暂缓项](#八已同意暂缓项)
9. [回归验证 checklist](#九回归验证-checklist)
10. [风险与依赖](#十风险与依赖)

---

## 一、修复执行状态

| Phase | 完成 | 总计 | 状态 |
|-------|------|------|------|
| Phase 1: 安全阻断 | 6 | 6 | ✅ 已完成 |
| Phase 2: 权限加固 | 6 | 6 | ✅ 已完成 |
| Phase 2: 数据完整性 | 4 | 4 | ✅ 已完成 |
| Phase 2: Mock 替换 | 5 | 10 | ✅ 部分完成（5 项暂缓） |
| Phase 2: 前端修复 | 5 | 5 | ✅ 已完成 |
| **Phase 2 剩余** | **0** | **~10** | ⬜ 待新窗口继续 |
| **Phase 4 全体** | **0** | **~15** | ⬜ 待新窗口继续 |

---

## 二、Phase 1 — 安全风险阻断 ✅ 已完成

### 完成项

| ID | 问题 | 修复内容 | 文件 |
|----|------|---------|------|
| A1 | SHA-256 → bcrypt 密码哈希 | `hashPwd()` 改用 bcrypt，登录/改密校验兼容旧 SHA-256，登录成功自动迁移 | `v2-auth.ts`, `v2-sys-user-repository.ts` |
| A2 | Refresh Token 内存存储 → MySQL | 创建 `sys_auth_refresh_token` 表 + 写入 MySQL + 内存快速路径 + 自动建表 | `v2-session.ts`, `0040_*.sql` |
| A3 | admin 后门 | NODE_ENV !== "production" 守卫 | `v2-auth.ts:433,440` |
| A4 | Session Secret 硬编码 | 生产环境缺少密钥直接抛错 | `v2-session.ts:24-26` |
| A5 | Researcher 重定向 | 增加 `"/console/settings/experiments"` 映射 | `login/page.tsx:21` |
| S6 | 默认角色越权 | `DEFAULT_AUTH_USER.role` 和 fallback 改为 `Role_Student` | `use-auth.ts:116,171` |

### 额外修复
| 问题 | 修复内容 | 文件 |
|------|---------|------|
| 教师登录 404 | `/dashboard` fallback 改为 `/` | `login/page.tsx:11-25` |
| 密码迁移 | 渐进式迁移兼容逻辑：自动识别 SHA-256→bcrypt | `v2-auth.ts:370-382` |

---

## 三、Phase 2 — 权限加固 ✅ 已完成

### 完成项

| ID | 问题 | 修复内容 | 文件 |
|----|------|---------|------|
| T1 | review-queue 全校数据 | 默认只返回当前教师布置的作业 | `v2-homework.ts:66-74` |
| T2 | grade-submission 无归属 | 查询作业归属 + 教师-班级关系校验 | `v2-homework.ts:144-157` |
| T3 | markHomeworkStudent 无角色 | 增加 `assertPermission(TASK_GRADE)` | `v2-homework.ts:138` |
| S4 | createHomework 无权限 | 增加 `assertAnyPermission(EXP_PUBLISH, TASK_GRADE)` | `v2-homework.ts:86` |
| R5 | coursebook 无权限 | 9 个写操作路由全部增加守卫 | `v2-coursebook.ts` |
| R6 | scale/incentive 无权限 | 5 个操作全部增加守卫 | `v2-scale-admin-routes.ts` |

### 新增权限常量
- `COURSEBOOK_MANAGE`: Teacher, Researcher, School_Admin, District_Admin
- `SCALE_MANAGE`: Researcher, School_Admin, District_Admin

---

## 四、Phase 2 — 数据完整性 ✅ 已完成

| ID | 问题 | 修复内容 | 文件 |
|----|------|---------|------|
| S5 | createHomework 无事务 | `beginTransaction/commit/rollback` | `v2-homework-repository.ts` |
| S3 | 提交无所有权校验 | 提交前查询 seqId 归属 + 乐观锁 | `v2-student.ts:107-117` |
| S9 | footprint 无 in_progress | `computeStatus` 增加 in_progress 分支 | `v2-student-footprints-repository.ts` |
| S11 | 无分页 | `LIMIT ? OFFSET ?` + `page/pageSize` | `v2-student-task-repository.ts` + footprints |

---

## 五、Phase 2 — Mock 替换 ✅ 已完成（部分暂缓）

| ID | 问题 | 状态 | 详情 |
|----|------|------|------|
| S1 | 学生提交 Mock | ✅ 已修复 | 替换为 submitStudentTask 真实 API |
| S7 | 拍同款 Mock | ✅ 已修复 | 移除 Mock 按钮 |
| P1 | 家长绑定页面缺失 | ✅ 已存在 | 代码库中已完整实现 |
| P2 | 安全清单 API | ⬜ 文件未找到 | 对应文件不在代码库 |
| P3-P6 | Placeholder 面板 | ✅ 无需操作 | 导航已无入口 |
| R1 | 学校通知空壳 | ⏸ 暂缓 | 已同意暂缓 |
| R2 | AI 配置空壳 | ⏸ 暂缓 | 已同意暂缓 |
| R3 | 教研组删除 shell | ⏸ 暂缓 | 已同意暂缓 |
| R4 | 审计日志 sessionStorage | ⏸ 暂缓 | 已同意暂缓 |

---

## 六、Phase 2 — 前端修复 ✅ 已完成

| ID | 问题 | 修复内容 | 文件 |
|----|------|---------|------|
| S10/P9 | 缺 ErrorBoundary | 新建 ErrorBoundary 组件，包裹 9 个页面 | `error-boundary.tsx` + 9 pages |
| A6 | 401 无拦截器 | API 返回 401 自动跳转登录页 | `apiService.ts:104-107` |
| T4 | 静默吞错误 | teacher-class 增加错误 toast | `teacher-class/page.hooks.ts` |
| T5 | 素材中心静默吞错误 | 增加错误 toast | `teacher/materials/page.hooks.ts` + assignments |

---

## 七、待继续修复项（下一窗口）

### P1 级优先

| ID | 问题 | 估算 | 文件位置 |
|----|------|------|---------|
| S2 | useDemoRole → useAuth 替换 | 1.5 天 | `experiment-hub-view.tsx:347`（1556 行大组件） |
| T6 | 实验编辑器静默降级 | 0.5 天 | `home-service.ts:1927-1962` |
| T7 | 班级趋势 N x 4 查询优化 | 0.5 天 | `teacher-dashboard-service.ts:220-245` |
| T8 | 硬编码模板 ID | 0.3 天 | `task-radar/page.tsx:126` |
| R7 | 题库 demo identity | 0.5 天 | `assessment/questions/` |
| R8 | 实验分类空加载器 | 0.3 天 | `experiment-catalog/` |
| A7 | 前端 middleware.ts | 0.5 天 | 新建 `middleware.ts` |
| B1 | 登录验证码/频率限制 | 0.5 天 | `login/page.tsx` |
| B2 | 注册验证码/速率限制 | 0.3 天 | `register/parent/page.tsx` |
| B5 | 权限映射表同步 | 0.5 天 | `role-permissions.ts`（前后端） |

### P2 级改进

| ID | 问题 | 估算 | 文件位置 |
|----|------|------|---------|
| S8 | 成长足迹报告空数据 | 0.3 天 | `footprints/page.tsx:15` |
| S12 | 导航标签调整 | 0.1 天 | `matrix.ts:67` |
| S13 | statusLabelZh 未知状态 | 0.1 天 | `footprints/page.hooks.ts:44-50` |
| S14 | 年级 Tab 动态加载 | 0.3 天 | `experiment-gallery-tab.tsx:25-30` |
| T9 | 错误状态可见 | 0.2 天 | `TeacherCourseContentPanel.tsx:421` |
| T10 | 学号截断 + tooltip | 0.1 天 | `TeacherReviewSubmissionsPanel.tsx:256` |
| T11 | 批改面板搜索/分页 | 0.5 天 | `TeacherReviewSubmissionsPanel.tsx:231-284` |
| P8 | 家长面板 loading 状态 | 0.3 天 | child-\* 系列组件 |
| P10 | i18n 支持 | 0.5 天 | `child-score-panel.tsx` |
| R9 | 导航重复标签 | 0.1 天 | `researcher-nav.ts` |
| B3 | 密码可见性切换 | 0.1 天 | `login/page.tsx` |
| B4 | 多角色登录选择 | 0.5 天 | `login/page.tsx:37-48` |

---

## 八、已同意暂缓项

| ID | 问题 | 原因 | 计划 |
|----|------|------|------|
| R1 | 学校通知空壳 | AI 相关 | 下次迭代 |
| R2 | AI 配置空壳 | 用户明确同意暂缓 | 下次迭代 |
| R3 | 教研组删除 shell | 用户明确同意暂缓 | 下次迭代 |
| R4 | 审计日志 sessionStorage | 用户明确同意暂缓 | 下次迭代 |

---

## 九、回归验证 Checklist

### Phase 1 已验证

- [x] 密码 bcrypt 正常工作（渐进式迁移兼容 SHA-256 旧密码）
- [x] 重启后端服务 Refresh Token MySQL 持久化不丢失
- [x] admin 账号不被提升为 Sys_Admin
- [ ] 生产环境未设置 SESSION_SECRET 服务拒绝启动（需部署验证）
- [x] Researcher 角色登录跳转 `/console/settings/experiments`
- [x] 默认未登录角色为 Student

### Phase 2 已验证

- [x] 学生提交从 Mock 改为真实 API
- [x] 提交有所有权校验 + 乐观锁
- [x] createHomework 有事务包裹
- [x] 老师批改有权限守卫 + 归属校验
- [x] coursebook/scale 路由有权限守卫
- [x] 学生足迹查询有分页
- [x] Footprint 状态覆盖 in_progress
- [x] 家长绑定页面存在
- [x] ErrorBoundary 覆盖 9 个页面
- [x] 401 API 自动跳转登录
- [x] Teacher class/materials 错误 toast

### 待新窗口回归验证

- [ ] 老师登录后直接进入"实验课程管理"页面
- [ ] 学生完整链路：查看实验 → 提交 → 查看成长足迹
- [ ] 家长绑定孩子 → 查看任务中心
- [ ] 教研员登录后跳转实验评审页
- [ ] useDemoRole → useAuth 替换后角色判断正确

---

## 十、风险与依赖

### 当前风险

| 风险 | 影响 | 状态 |
|------|------|------|
| SHA-256 → bcrypt 存量用户无法登录 | 所有已有用户 | ✅ 已通过渐进式迁移逻辑解决 |
| useDemoRole 替换涉及 1556 行大组件 | 实验详情页角色判断 | ⬜ 待处理（下一窗口） |
| Mock 功能多于已发现 | 额外工作量 | ⏸ R1-R4 已同意暂缓 |
| 权限守卫漏补 | 残留权限漏洞 | ✅ Phase 2 权限加固已完成 |

### 外部依赖

| 依赖 | 用途 | 状态 |
|------|------|------|
| bcryptjs npm 包 | 密码哈希 | ✅ 已安装 |
| MySQL `sys_auth_refresh_token` 表 | Refresh Token 持久化 | ✅ 自动建表就绪 |
| 通知/审计日志后端 API | 教研员功能 | ⏸ 暂缓 |

### 已修改的依赖

```json
// backend/package.json
"bcryptjs": "^3.0.3",
"@types/bcryptjs": "^2.4.6",
```
