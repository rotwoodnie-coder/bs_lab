# Phase 3A 执行指令：后端学生 API + 实验库列表页

> 前置条件：Phase 1（审核工作流修复）和 Phase 2（教师侧增强）已完成。
> 分支：`feature/db-loading-and-media-storage`，已领先 `origin` 2 个 commits。
> 最新提交：`bb550c0 feat: Phase 2 - teacher enhancement`

---

## 背景：学生端现状

### 数据库已就绪的表

| 表 | 用途 |
|---|------|
| `exp_homework` | 教师发布的作业任务（work_id, exp_id, teacher_user_id, class_id, require_date） |
| `exp_homework_student` | 每个学生的作业副本快照（seq_id, work_id, exp_id, student_user_id, submit_date, mark_result, mark_comments） |

### 后端已有资产

| 资产 | 路径 |
|------|------|
| 作业 CRUD 路由 | `backend/src/http/routes/v2-homework.ts`（已注册到 server.ts） |
| 作业 repository | `backend/src/infrastructure/repositories/v2-homework-repository.ts` |
| 作业类型定义 | `backend/src/domain/v2-homework/v2-homework-types.ts` |
| 学生管理路由 | `backend/src/http/routes/v2-student.ts`（仅 POST/GET 单个学生） |
| 实验详情 API | `GET /v2/exp/:id` → `fetchV2ExpDetail` |
| 实验列表 API | `GET /v2/exp` → `fetchV2ExpList` |

### 前端已有资产

| 资产 | 路径 |
|------|------|
| 实验详情组件（~1505 行） | `frontend/src/components/business/experiment-detail/experiment-hub-view.tsx` |
| 实验详情页路由 | `frontend/src/app/(dashboard)/experiments/[id]/page.tsx`（复用 hub-view） |
| 资源中心（实验工坊雏形） | `frontend/src/app/(dashboard)/resources/page.tsx` |
| 实验闯关占位页 | `frontend/src/app/(dashboard)/student/experiment-challenge/page.tsx` |
| 成长足迹 Mock 页 | `frontend/src/app/(dashboard)/student/footprints/page.tsx` |
| v2-student-api.ts | `frontend/src/lib/v2/v2-student-api.ts`（全是管理员 CRUD） |
| v2-exp-api.ts | `frontend/src/lib/v2/v2-exp-api.ts`（详情/列表/均可用） |
| 导航配置 | `frontend/src/config/nav-config/matrix.ts` 中 `PORTAL_NAV_ITEMS` 和 `STUDENT_MANAGEMENT_NAV` 已配置 |

---

## Step 1：后端 API — 学生任务列表 `GET /v2/student/tasks`

### 说明

新增 API，接收当前学生用户 ID（从 `x-user-id` header），查出该学生的所有作业任务（含实验名称、状态、提交日期等）。

### 涉及文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **新增** | `backend/src/domain/v2-student/v2-student-task-types.ts` | 返回值类型定义 |
| **新增** | `backend/src/infrastructure/repositories/v2-student-task-repository.ts` | 查询 `exp_homework_student` JOIN `exp_homework` JOIN `exp_msg` |
| **新增** | `backend/src/services/StudentTaskService.ts` | 可选薄 service 层 |
| **修改** | `backend/src/http/routes/v2-student.ts` | 新增 `GET /v2/student/tasks` 路由分支 |

### 返回结构

```typescript
type StudentTaskItem = {
  seqId: string;          // exp_homework_student.seq_id
  workId: string;         // exp_homework.work_id
  expId: string;          // 学生实验副本 exp_id
  teacherExpId: string;   // 教师原始实验 ID
  expName: string;        // exp_msg.exp_name（JOIN）
  teacherUserId: string;
  teacherName: string;    // sys_user.user_name（可选 JOIN）
  classId: string;
  requireDate: string | null;
  submitDate: string | null;  // 已提交时间（null=未提交）
  markResult: string | null;  // 批改结果
  markComments: string | null;
  status: "pending" | "submitted" | "marked";  // 计算列
};
```

### SQL 参考

```sql
SELECT s.*, h.exp_id AS teacher_exp_id, h.teacher_user_id, h.class_id,
       e.exp_name,
       u.user_name AS teacher_name
FROM exp_homework_student s
JOIN exp_homework h ON h.work_id = s.work_id
LEFT JOIN exp_msg e ON e.exp_id = h.exp_id
LEFT JOIN sys_user u ON u.user_id = h.teacher_user_id
WHERE s.student_user_id = ?
ORDER BY s.submit_date ASC, h.create_time DESC
```

### 权限策略

不需要特殊权限，仅校验 `x-user-id` 存在且与查询的 `studentUserId` 一致（学生只能查自己）。

---

## Step 2：后端 API — 学生提交作业 `POST /v2/student/tasks/:seqId/submit`

### 说明

学生完成实验后，调用此 API 标记 `exp_homework_student.submit_date = NOW()`。

### 涉及文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **修改** | `backend/src/infrastructure/repositories/v2-homework-repository.ts` | 新增 `submitHomeworkStudent(seqId)` 函数 |
| **修改** | `backend/src/http/routes/v2-student.ts` | 新增 `POST /v2/student/tasks/:seqId/submit` |

### 实现

```typescript
export async function submitHomeworkStudent(seqId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute<ResultSetHeader>(
    "UPDATE exp_homework_student SET submit_date = NOW() WHERE seq_id = ?",
    [seqId],
  );
}
```

---

## Step 3：前端 API 封装

### 涉及文件

| 操作 | 文件 |
|------|------|
| **新增** | `frontend/src/lib/v2/v2-student-task-api.ts` |

### 函数签名

```typescript
import type { CoreApiActor } from "@/lib/core-api-shared";

export type StudentTaskStatus = "pending" | "submitted" | "marked";

export type StudentTaskItem = {
  seqId: string;
  workId: string;
  expId: string;
  teacherExpId: string;
  expName: string;
  teacherUserId: string;
  teacherName: string;
  classId: string;
  requireDate: string | null;
  submitDate: string | null;
  markResult: string | null;
  markComments: string | null;
  status: StudentTaskStatus;
};

export function fetchStudentTasks(actor: CoreApiActor): Promise<StudentTaskItem[]>;
export function submitStudentTask(actor: CoreApiActor, seqId: string): Promise<void>;
```

遵循 `frontend/src/lib/v2/v2-group-api.ts` 的 `buildApiUrl` + `buildCoreApiReadHeaders` 模式。

---

## Step 4：前端实验库列表页 `/experiments`

### 说明

当前 `/experiments/[id]/page.tsx` 只做详情页，缺少列表页。`/experiments`（无 id）访问时 404。

新建列表页，展示当前学生所有作业任务（从 `GET /v2/student/tasks`），点击进入详情（复用 `ExperimentHubView`）。

### 涉及文件

| 操作 | 文件 |
|------|------|
| **新增** | `frontend/src/app/(dashboard)/experiments/page.tsx` |
| **可选新增** | `frontend/src/app/(dashboard)/experiments/page.hooks.ts` |

### 页面结构

```
标题栏："实验库"
筛选区：状态筛选（全部 / 待完成 / 已提交 / 已批改）
列表区：Card 网格布局
  - 显示 expName, teacherName, 状态 badge, requireDate
  - 点击进入 /experiments/[expId]
  - 已提交显示 submitDate、批改结果
空态：引导文字
```

### 状态 Badge 映射

| status | 显示 | Badge 变体 |
|--------|------|-----------|
| `pending` | 待完成 | `outline` |
| `submitted` | 已提交 | `secondary` |
| `marked` | 已批改 | `default` |

---

## 文件清单汇总

| # | 操作 | 文件 | 说明 |
|---|------|------|------|
| S1 | 新增 | `backend/src/domain/v2-student/v2-student-task-types.ts` | 类型定义 |
| S2 | 新增 | `backend/src/infrastructure/repositories/v2-student-task-repository.ts` | SQL 查询 |
| S3 | 修改 | `backend/src/http/routes/v2-student.ts` | 新增任务列表 + 提交路由 |
| S4 | 修改 | `backend/src/infrastructure/repositories/v2-homework-repository.ts` | 新增 submit function |
| S5 | 新增 | `frontend/src/lib/v2/v2-student-task-api.ts` | 前端 API 封装 |
| S6 | 新增 | `frontend/src/app/(dashboard)/experiments/page.tsx` | 实验库列表页 |
| S7 | 新增 | (可选) `frontend/src/app/(dashboard)/experiments/page.hooks.ts` | 列表 hooks |

---

## 参考代码模式

### 后端路由模式（参考 `v2-homework.ts`）

`backend/src/http/routes/v2-homework.ts` 使用以下模式：
- `z` zod 校验
- `ok()` / `fail()` 响应函数
- 请求体 `await req.json()` + `safeParse`
- 路由分支通过 `url.pathname` + `method` 匹配

### 前端 API 模式（参考 `v2-group-api.ts`）

```typescript
async function v2Get(path, actor) {
  const res = await fetch(buildApiUrl(path), { headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}
```

### 前端列表页模式（参考 `teacher/research-project-groups/page.tsx`）

- 使用 `useAuth()` 获取 actor
- 使用 `React.useEffect` 加载数据
- 使用 `@bs-lab/ui` 的 `Card`, `Badge`, `Button`, `sonnerToast`

---

## 验收标准

1. `GET /v2/student/tasks` 返回当前学生作业列表（含实验名称、教师姓名、提交状态）
2. `POST /v2/student/tasks/:seqId/submit` 标记作业已提交（`submit_date` 写入）
3. `/experiments` 列表页展示学生作业任务，点击进入详情页
4. 状态 Badge 正确映射：待完成/已提交/已批改
5. 空列表显示友好提示
6. 无跨表权限泄漏
