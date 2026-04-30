# 当前工作存档（阶段性保存）

- 存档日期：2026-05-01
- 存档用途：用于后续继续推进权限治理、审核页面与菜单联动开发

---

## 一、已完成的核心成果

### 1. 权限治理最终方案已定稿
已形成并存档以下文档：

- `docs/auth/03-permission-console-first-version-design.md`
- `docs/auth/04-role-menu-governance-plan.md`
- `docs/auth/05-system-role-menu-governance-final.md`

最终版已经明确：

- 7 大角色分层
- 3 层治理 + 2 层业务 + 2 层使用
- 菜单数量不代表权限高低，最终以授权数据为准
- 审核闭环：
  - 教师实验 → 教研员审核
  - 学生作品 → 校级管理员审核
  - 教研课题组 → 教研员审核
- PRD 能力对齐：资源中心、实验广场、实验报告、家庭实验室、我的课题组

### 2. 初始化 SQL 已拆分并可执行
已生成并保存以下迁移脚本：

- `database/migrations/0054_system_role_menu_governance_final.sql`
- `database/migrations/0055_sys_menu_seed.sql`
- `database/migrations/0056_sys_role_menu_perm_seed.sql`

说明：

- `0055` 负责菜单目录初始化
- `0056` 负责角色默认授权初始化
- `0054` 作为总集成参考版保留

### 3. 前端权限页已对齐最终版菜单
已更新：

- `frontend/src/lib/permissions/page-permissions.ts`
- `frontend/src/app/(dashboard)/console/settings/system/roles/page.tsx`
- `frontend/src/app/(dashboard)/console/settings/system/roles/page.hooks.ts`

当前权限页能力：

- 系统级全量目录展示
- 按分组查看
- 搜索过滤
- READ / WRITE 切换
- 默认预设恢复
- 保存权限

### 4. 审核页面 UI 已开始落地
已新增可用于 UI 验证的审核页面：

- `frontend/src/app/(dashboard)/console/review/student-works/page.tsx`
- `frontend/src/app/(dashboard)/console/review/research-groups/page.tsx`

当前页面具备：

- 列表展示
- 批量通过
- 批量驳回
- 驳回抽屉
- 理由输入

---

## 二、当前工作状态

### 已完成
- 方案定稿
- 菜单与权限初始化 SQL 落地
- 权限页 UI 基础完成
- 两个审核页 UI 已补齐

### 正在推进
- 继续补齐“实验审核”页 UI
- 将审核页接入菜单与权限守卫
- 后续做完整 UI 验证

### 后续待做
- 菜单入口联动
- 前端路由守卫统一接入
- 后端审核接口与权限校验联调
- 作业流、作品流、课题组流的业务校验联动

---

## 三、当前阶段的使用说明

如果后续继续推进，请优先从以下文件开始：

1. `docs/auth/05-system-role-menu-governance-final.md`
2. `frontend/src/lib/permissions/page-permissions.ts`
3. `frontend/src/app/(dashboard)/console/settings/system/roles/page.tsx`
4. `frontend/src/app/(dashboard)/console/review/student-works/page.tsx`
5. `frontend/src/app/(dashboard)/console/review/research-groups/page.tsx`

---

## 四、建议的下一步继续方向

1. 补齐 `实验审核` 页面 UI
2. 将三个审核页挂到统一菜单与权限守卫
3. 继续完善权限配置页交互细节
4. 开始做前后端审核流程联调

---

## 五、结论

当前工作已完成阶段性存档，可以在此基础上继续迭代，不需要重新整理前面已完成的权限治理方案、SQL 初始化和前端权限目录。
