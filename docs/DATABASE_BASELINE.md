# DATABASE_BASELINE 数据库基线说明

> 数据来源：`database/migrations/bs_exp_data.sql`
>
> 目标：沉淀当前数据库的全表字典、实验课程核心模型、列表页字段基准，以及数据操作铁律，作为后续开发与评审的统一依据。

---

## 目录

1. [文档定位与使用边界](#文档定位与使用边界)
2. [全表字典清单](#全表字典清单)
   1. [基础字典类](#基础字典类)
   2. [教材与学科体系](#教材与学科体系)
   3. [实验与试验内容主模型](#实验与试验内容主模型)
   4. [材料与安全体系](#材料与安全体系)
   5. [题库与答题体系](#题库与答题体系)
   6. [组织、用户与权限体系](#组织用户与权限体系)
   7. [积分、社交与日志体系](#积分社交与日志体系)
   8. [课题组/教研组体系](#课题组教研组体系)
   9. [迁移辅助表](#迁移辅助表)
3. [实验课程核心模型 exp_msg 深度分析](#实验课程核心模型-exp_msg-深度分析)
   1. [exp_msg 主表定位](#exp_msg-主表定位)
   2. [exp_msg 与步骤/材料/安全标签/习题的 1:N 关系](#exp_msg-与步骤材料安全标签习题的-1n-关系)
   3. [exp_msg 关联维表](#exp_msg-关联维表)
4. [字段呈现基准（列表页）](#字段呈现基准列表页)
   1. [物理字段](#1-物理字段)
   2. [逻辑字段（需 Join）](#2-逻辑字段需-join)
   3. [推荐 SQL Join 范式](#推荐-sql-join-范式)
5. [数据操作（DML）铁律](#数据操作dml铁律)
   1. [更新模式：子表必须全量覆盖](#1-更新模式子表必须全量覆盖)
   2. [自愈逻辑：保存时自动补齐 owner_user_id](#2-自愈逻辑保存时自动补齐-owner_user_id)
   3. [查询时自动过滤 is_deleted = 0](#3-查询时自动过滤-is_deleted--0)
   4. [排序逻辑：exp_step 必须按 sort_order 升序](#4-排序逻辑exp_step-必须按-sort_order-升序)
   5. [事务性更新范式（Transactional Pattern）](#5-事务性更新范式transactional-pattern)
6. [锁定规则确认](#锁定规则确认)
7. [文档完整大纲](#文档完整大纲)
8. [旧文档清理候选清单](#旧文档清理候选清单)

---

## 文档定位与使用边界

本文件定义的是“数据库基线”，不是临时需求说明。

- 所有表的中文定义以 SQL `COMMENT` 为准。
- 所有关系以外键和字段语义为准；凡是主表/子表/维表的职责，均以当前 SQL 结构推导。
- 所有列表页展示字段、查询 Join 字段、写入策略、排序策略，应以本文件为准。
- 后续如果 SQL 结构变化，应先更新本文件，再推动业务代码变更。

---

## 全表字典清单

> 说明：以下按业务域归类，列出每张表的中文定义与业务角色。

### 基础字典类

| 表名 | SQL COMMENT 中文定义 | 业务角色 |
|---|---|---|
| `data_coursebook` | 教材 | 教材基础字典主表，提供教材版本与学科归属。 |
| `data_coursebook_chapter` | 教材章 | 教材章节字典，用于教材章节层级展示。 |
| `data_coursebook_unit` | 教材节 | 教材节/单元字典，用于实验与题目挂接到具体节。 |
| `data_difficulty_type` | 题库难度类型 | 题库难度字典，用于题目难度分类。 |
| `data_exp_difficulty` | 试验难度 | 实验难度字典，用于实验难度分级。 |
| `data_file` | 文件资源主表 | 通用文件资源主记录，承载文件归属与元信息。 |
| `data_file_type` | 素材类别（初始化，不能修改） | 文件类型基础字典，约束素材分类。 |
| `data_material_prop` | 材料属性 | 材料属性字典，用于材料的性质分类。 |
| `data_material_security` | 材料安全性 | 材料安全标签字典，用于安全等级与风险提示。 |
| `data_material_type` | 材料分类 | 材料分类字典，用于材料主库与试验材料分类。 |
| `data_material_unit` | 材料计量单位 | 材料计量单位字典。 |
| `data_msg_type` | 消息分类 | 系统消息类型字典。 |
| `data_org_type` | 组织类型（初始化，不能修改） | 组织类型字典，决定学校/校区/学段/年级/班级/课题组等组织节点类型。完整层级：`Org_Manage` → `Org_School` → `Org_School_Campus`（校区）→ `Org_School_Level`（学段）→ `Org_School_Grade`（年级）→ `Org_School_Class`（班级）。校区与学段两类种子数据见 `database/seed/insert-org-types-campus-level.sql`。 |
| `data_pref_title` | 职称 | 用户个人职称字典。 |
| `data_question_capacity` | 题目能力侧重点 | 题目能力维度字典。 |
| `data_question_type` | 题型 | 题目类型字典。 |
| `data_rating_scale` | 评分等级（初始化，不能修改） | 评分等级字典，用于积分/评价等分级参考。 |
| `data_role` | 用户角色（初始化，不能修改） | 角色字典，承载系统 RBAC 基础角色。 |
| `data_school_level` | 学段信息 | 学段字典，表示小学/初中/高中等学段。 |
| `data_school_grade` | 年级信息 | 年级字典，归属到学段。 |
| `data_school_subject` | 学科 | 学科字典。 |

### 教材与学科体系

| 表名 | SQL COMMENT 中文定义 | 业务角色 |
|---|---|---|
| `data_school_grade_subject` | 年级与学科关联 | 年级与学科多对多关联表，用于确定某年级可选学科。 |
| `exp_grade` | 试验适用年级 | 标准试验与年级的关联关系。 |
| `exp_library` | 标准试验库 | 标准实验/试验模板主表，作为可复用课程实验库。 |
| `exp_library_grade` | 标准试验适用年级 | 标准试验与年级关联表。 |
| `exp_library_video` | 标准试验视频 | 标准试验的视频资源关联表。 |

### 实验与试验内容主模型

| 表名 | SQL COMMENT 中文定义 | 业务角色 |
|---|---|---|
| `exp_msg` | 试验（教师/学生） | 实验课程主表，承载实验基本信息、课程上下文与审批状态。 |
| `exp_step` | 试验步骤 | 实验步骤明细表，定义按顺序执行的步骤内容。 |
| `exp_pic` | 试验图片 | 实验图片资源表。 |
| `exp_video` | 试验视频 | 实验视频资源表。 |
| `exp_reference` | 试验参考引用 | 实验参考资料/引用来源明细表。 |
| `exp_reference_video` | 试验参考引用视频 | 实验参考视频资源表。 |
| `exp_result` | 试验结果 | 实验结果说明表，用于沉淀结果描述。 |
| `exp_scientist` | 试验科学家故事 | 实验科学家故事扩展内容表。 |
| `exp_security` | 试验安全性关联 | 实验安全标签关联表，表示实验风险与安全要求。 |
| `exp_arbitration` | 实验仲裁（实验小法庭） | 实验仲裁主记录。 |
| `exp_arbitration_like` | 仲裁支持记录 | 仲裁支持意见记录。 |
| `exp_arbitration_notlike` | 仲裁反对记录（仅实验小法庭中展示，不可删除） | 仲裁反对意见记录。 |
| `exp_homework` | 试验作业（教师发布） | 教师发布的实验作业任务主表。 |
| `exp_homework_student` | 学生试验作业（含快照机制） | 学生端作业快照与提交记录表。 |
| `exp_simulation_record` | 模拟试验记录 | 模拟试验过程记录。 |

### 材料与安全体系

| 表名 | SQL COMMENT 中文定义 | 业务角色 |
|---|---|---|
| `material_msg` | 试验材料主库 | 材料主库主表，存储可复用材料资源。 |
| `material_pic` | 材料图片 | 材料主库图片资源表。 |
| `material_security` | 材料安全性关联 | 材料主库与安全标签的关联表。 |
| `exp_material` | 试验材料明细 | 实验内的材料明细表，支持对主库材料的引用与自定义。 |
| `exp_material_pic` | 试验材料图片 | 实验材料图片资源表。 |
| `exp_material_security` | 试验材料安全性关联 | 实验材料与安全标签关联表。 |
| `data_material_security` | 材料安全性 | 安全标签字典表，是材料/实验安全体系的基础维表。 |

### 题库与答题体系

| 表名 | SQL COMMENT 中文定义 | 业务角色 |
|---|---|---|
| `exp_question` | 题目 | 题目主表，承载题干、题型、难度、知识点等信息。 |
| `exp_question_select` | 题目选项 | 题目选项明细表。 |
| `exp_question_answer` | 答题记录 | 用户作答主记录。 |
| `exp_question_answer_select` | 答题选项明细 | 用户答案选项明细表。 |
| `data_difficulty_type` | 题库难度类型 | 题目难度分类字典。 |

### 组织、用户与权限体系

| 表名 | SQL COMMENT 中文定义 | 业务角色 |
|---|---|---|
| `sys_org` | 组织（学校/班级/课题组等） | 组织树主表，承载学校、班级、课题组等组织节点。 |
| `sys_user` | 用户 | 用户主表。 |
| `sys_user_role` | 用户角色关联 | 用户与角色的多对多关联表。 |
| `sys_log` | 系统日志 | 系统操作审计日志。 |
| `sys_msg` | 系统消息 | 站内消息主表。 |

### 积分、社交与日志体系

| 表名 | SQL COMMENT 中文定义 | 业务角色 |
|---|---|---|
| `scale_log` | 积分流水 | 用户积分变更流水。 |
| `scale_title` | 积分称号规则 | 基于角色与积分阈值的称号规则。 |
| `social_collection` | 收藏记录 | 实验收藏关系表。 |
| `social_evaluate` | 评价记录 | 实验评价关系表。 |
| `social_like` | 点赞记录 | 实验点赞关系表。 |
| `social_notlike` | 倒赞记录 | 实验倒赞关系表。 |

### 课题组/教研组体系

| 表名 | SQL COMMENT 中文定义 | 业务角色 |
|---|---|---|
| `subject_group` | 课题组/教研组主表 | 课题组/教研组主记录。 |
| `subject_group_member` | 组成员关系表 | 组成员关联记录。 |

### 迁移辅助表

| 表名 | SQL COMMENT 中文定义 | 业务角色 |
|---|---|---|
| `migration_error_log` | — | 数据迁移错误日志表（无 COMMENT）。 |
| `migration_id_map` | — | 数据迁移 ID 映射表（无 COMMENT）。 |

---

## 实验课程核心模型 exp_msg 深度分析

### exp_msg 主表定位

`exp_msg` 是实验课程域的**主表**，承担“一个实验课程完整业务对象”的核心职责。

它不是单纯的内容表，而是一个同时承载以下信息的聚合根：

- 实验的基础身份信息：`exp_id`, `exp_name`
- 实验课程上下文：学科、学段、年级、教材、教材节、难度
- 实验内容结构：步骤、材料、安全、参考、结果、科学家故事
- 审核与发布状态：发布人、审核人、审核状态、时间戳
- 社交统计聚合：点赞、倒赞、收藏、评价等统计值
- 业务来源标识：教师/学生发布、标准实验库关联、作业/拍同款/自主试验类型
- 逻辑删除控制：`is_deleted`

因此，`exp_msg` 在业务上是“实验课程视图”的中心锚点，其他实验内容均围绕它展开。

### exp_msg 与步骤/材料/安全标签/习题的 1:N 关系

#### 1. `exp_msg` -> `exp_step`

- 主表：`exp_msg`
- 子表：`exp_step`
- 关系：**1:N**
- 外键：`exp_step.exp_id -> exp_msg.exp_id`
- 语义：一个实验可以有多个步骤；每个步骤只属于一个实验。
- 排序：步骤展示必须严格按 `exp_step.sort_order` 升序排列。

业务含义：
- 步骤是实验执行流程的线性表达。
- 子表记录的是实验的执行顺序与步骤内容，而不是独立业务对象。
- 步骤顺序不可由前端临时排序规则代替，必须以数据库 `sort_order` 为唯一排序来源。

#### 2. `exp_msg` -> `exp_material`

- 主表：`exp_msg`
- 子表：`exp_material`
- 关系：**1:N**
- 外键：`exp_material.exp_id -> exp_msg.exp_id`
- 语义：一个实验可以配置多个材料明细；每个材料明细只属于一个实验。
- 扩展：材料明细可引用材料主库 `material_msg`，也允许自定义覆盖名称。

业务含义：
- 实验材料是实验准备清单的一部分。
- 既支持引用主库材料，也支持实验级别自定义材料。
- 材料表不是“库存表”，而是“实验消耗配置表”。

#### 3. `exp_msg` -> `exp_security`

- 主表：`exp_msg`
- 子表：`exp_security`
- 关系：**1:N**
- 外键：`exp_security.exp_id -> exp_msg.exp_id`
- 语义：一个实验可以配置多个安全标签。
- 安全标签来源：`data_material_security`
- 排序：安全标签展示应按 `exp_security.sort_order` 排列。

业务含义：
- 安全标签用于实验风险提示与防护要求展示。
- 它是实验级的安全维度，不等同于材料安全标签的简单复用。
- `security_level` 代表危险等级，数值越低越危险。

#### 4. `exp_msg` -> `exp_question`

- 主表：`exp_msg`
- 子表：`exp_question`
- 关系：**1:N**
- 当前 SQL 结构中，`exp_question` 未直接以 `exp_id` 外键挂到 `exp_msg`，但业务上属于实验课程的题目扩展域，通常通过实验内容或页面聚合关系进行归属。
- 语义：一个实验可以关联多道习题，题目作为实验知识巩固/探究延伸内容存在。

业务含义：
- 题目是实验课程的延展练习模块。
- 当某个实验页面需要展示习题时，应按实验维度聚合题目，而不是让题目脱离实验上下文独立展示。
- 若后续补充显式外键，应保持 1:N 设计不变。

### exp_msg 关联维表

`exp_msg` 主要关联以下维表/字典表，用于列表展示、筛选、编辑联动和下钻详情：

| 关联字段 | 维表 | 业务用途 |
|---|---|---|
| `subject_id` | `data_school_subject` | 展示学科名，作为实验所属学科。 |
| `school_level_id` | `data_school_level` | 展示学段名，表示实验面向的学段。 |
| `grade_id` | `data_school_grade` | 展示年级名，表示实验适用年级。 |
| `coursebook_id` | `data_coursebook` | 展示教材名称，确定教材归属。 |
| `unit_id` | `data_coursebook_unit` | 展示教材节名称，落到具体章节知识点。 |
| `difficulty_id` | `data_exp_difficulty` | 展示实验难度等级。 |
| `standard_exp_id` | `exp_library` | 关联标准实验库，支持复制、复用、对标。 |
| `create_user_id` | `sys_user` | 展示发布人信息。 |
| `confirm_user_id` | `sys_user` | 展示审核人信息。 |

#### 教材章节链路说明

`exp_msg` 中与教材相关的链路并不是只停留在教材层面，而是存在完整层级：

`exp_msg.coursebook_id -> data_coursebook.coursebook_id`

`exp_msg.unit_id -> data_coursebook_unit.unit_id`

`data_coursebook_unit.chapter_id -> data_coursebook_chapter.chapter_id`

`data_coursebook_chapter.coursebook_id -> data_coursebook.coursebook_id`

因此，教材章/节名的展示应按层级 Join 得到：

- 教材名：`data_coursebook.coursebook_name`
- 章名：`data_coursebook_chapter.chapter_name`
- 节名：`data_coursebook_unit.unit_name`

---

## 字段呈现基准（列表页）

实验课程列表页应以“物理字段 + 逻辑字段”的方式呈现。

### 1. 物理字段

以下字段直接来自 `exp_msg`，属于列表页基础展示字段：

| 字段 | 含义 | 来源 |
|---|---|---|
| `exp_name` | 实验名称 | `exp_msg.exp_name` |
| `logo_url` | 封面图/主图 URL | 业务上应由实验封面图或首图归一得到；若数据源来自文件/图片表，应在查询层聚合得到。 |
| `class_hour` | 课时 | `exp_msg.class_hour` |
| `status` | 审核状态 | `exp_msg.status` |

### 2. 逻辑字段（需 Join）

以下字段不能单靠 `exp_msg` 直接展示，必须通过关联维表获取：

| 逻辑字段 | Join 来源 | 说明 |
|---|---|---|
| 学科名 | `data_school_subject.subject_name` | 由 `exp_msg.subject_id` 关联得到。 |
| 年级名 | `data_school_grade.grade_name` | 由 `exp_msg.grade_id` 关联得到。 |
| 教材章名 | `data_coursebook_chapter.chapter_name` | 通过教材链路解析得到。 |
| 教材节名 | `data_coursebook_unit.unit_name` | 由 `exp_msg.unit_id` 直接 Join 得到。 |

### 3. 推荐 SQL Join 范式

以下是 `exp_msg` 列表查询的推荐 SQL 范式，目标是在保证可读性的同时，保持 Join 关系稳定、索引友好、字段语义明确。

```sql
SELECT
  e.exp_id,
  e.exp_name,
  e.logo_url,
  e.class_hour,
  e.status,
  s.subject_name      AS subject_name,
  g.grade_name        AS grade_name,
  c.coursebook_name   AS coursebook_name,
  ch.chapter_name     AS chapter_name,
  u.unit_name         AS unit_name
FROM exp_msg e
LEFT JOIN data_school_subject s
  ON s.subject_id = e.subject_id
LEFT JOIN data_school_grade g
  ON g.grade_id = e.grade_id
LEFT JOIN data_coursebook c
  ON c.coursebook_id = e.coursebook_id
LEFT JOIN data_coursebook_unit u
  ON u.unit_id = e.unit_id
LEFT JOIN data_coursebook_chapter ch
  ON ch.chapter_id = u.chapter_id
WHERE e.is_deleted = 0
ORDER BY e.create_time DESC, e.exp_id DESC;
```

#### Join 范式说明

1. `data_school_subject`、`data_school_grade`、`data_coursebook` 应优先使用 `LEFT JOIN`，避免主表数据因维表缺失而丢失。
2. 教材章名不要通过“直接硬拼字符串”或前端推导，必须通过 `data_coursebook_unit -> data_coursebook_chapter` 链路解析。
3. 若列表页仅展示教材节，可不强制返回章名；但本基线要求同时支持“教材章/节名”的完整展示，所以推荐同时输出 `coursebook_name / chapter_name / unit_name`。
4. 对大列表场景，过滤条件应尽可能先限制 `exp_msg` 主表，再做维表 Join，避免无意义的全表联接。
5. `exp_msg` 作为主表时，`e.is_deleted = 0` 是默认前置条件，不可遗漏。

### 4. 列表页展示建议

实验课程列表页建议固定输出：

- 主标题：`exp_name`
- 副标题：学科名 + 年级名 + 教材章/节名
- 视觉封面：`logo_url`
- 进度/时长：`class_hour`
- 状态：`status`

推荐组合表达：

- `学科名 / 年级名`
- `教材名 · 章名 · 节名`
- `课时：class_hour`
- `状态：status`

---

## 数据操作（DML）铁律

### 1. 更新模式：子表必须全量覆盖

对于 `exp_msg` 的子表集合，尤其是以下类型：

- `exp_step`
- `exp_material`
- `exp_security`
- `exp_reference`
- `exp_result`
- `exp_scientist`
- `exp_pic`
- `exp_video`
- `exp_reference_video`
- `exp_material_pic`
- `exp_material_security`
- `exp_question_select` 等

统一采用**全量覆盖**策略：

> `Delete then Insert`

具体原则：

1. 先删除当前主表对应的旧子集记录。
2. 再批量插入新的完整子集记录。
3. 不允许仅根据局部差异做碎片化更新。
4. 不允许混合“部分更新 + 部分删除 + 部分新增”的不可控模式。

原因：
- 保证顺序、完整性与幂等性。
- 降低子表复杂编辑带来的脏数据风险。
- 便于保存时实现“所见即所得”的结构同步。

### 2. 自愈逻辑：保存时自动补齐 `owner_user_id`

对于存在 owner 语义的业务对象，保存流程必须具备自愈能力。

当前 SQL 中，典型体现为：
- `data_file.owner_user_id`
- `subject_group.owner_id`
- 以及与归属人强相关的资源对象

保存时应遵循：

- 若前端未显式传入 owner/归属人字段，则后端根据当前登录用户自动补齐。
- 归属人字段不得因空值而丢失业务所有权。
- 如存在“创建人即归属人”的业务场景，应明确落库规则并统一处理。

### 3. 查询时自动过滤 `is_deleted = 0`

所有带逻辑删除字段的主业务表，查询默认必须过滤：

- `is_deleted = 0`

典型表包括：
- `exp_msg`
- `exp_library`
- `exp_homework`
- `exp_question`
- `material_msg`
- `sys_org`
- `sys_user`

原则：
- 逻辑删除数据默认不参与普通列表、搜索、下拉和详情联查。
- 只有管理、审计、回收站或特定迁移场景才允许绕过该过滤。

### 4. 排序逻辑：`exp_step` 必须按 `sort_order` 升序

`exp_step` 的顺序是实验流程的一部分，必须强约束：

- 排序字段：`sort_order`
- 排序方式：升序（ASC）
- 使用场景：列表、详情、导出、打印、预览、步骤编辑回显

约束说明：
- 不允许使用主键生成顺序代替业务顺序。
- 不允许前端临时重排后未回写排序字段。
- 若 `sort_order` 为空，需在保存前补齐或在排序规则中定义兜底策略，但最终展示仍应以 `sort_order` 为准。

### 5. 事务性更新范式（Transactional Pattern）

对于 `exp_step` 和 `exp_material` 这类“父表主记录 + 子表集合”保存模型，更新时的删除-插入动作**必须处于同一个数据库事务**中。

#### 必须遵循的事务边界

- 事务开始：进入 `exp_msg` 保存/更新用例的 service 方法时开启。
- 事务内操作：
  1. 更新或插入 `exp_msg` 主表。
  2. 删除旧的 `exp_step` / `exp_material` 子集。
  3. 插入新的 `exp_step` / `exp_material` 子集。
  4. 若有联动子表（如安全标签、图片、视频）且属于同一保存动作，也应纳入同一事务。
- 事务提交：所有主表与子表操作全部成功后再提交。
- 事务回滚：任一环节失败必须整体回滚，禁止只成功一半。

#### 核心军规

- `exp_step` 的“Delete then Insert”与 `exp_material` 的“Delete then Insert”不能拆开到多个事务。
- 不能先删后插分成两个独立请求。
- 不能在删除后提前提交，再由后续接口补插。
- 不能因为某个子集插入失败而保留主表或其他子表的半成品状态。

#### 推荐实现原则

- `exp_msg` 保存服务应采用单一事务编排。
- 所有子表写入统一在一个 service method 内完成。
- 事务粒度应以“一个实验完整保存动作”为边界，而不是以单个子表为边界。

#### `exp_step` 富文本内容的转义和存储规范

`exp_step.step_comments` 是富文本字段，保存时必须遵循统一规范：

1. **存储内容以原始富文本为准**，不要把前端渲染态的临时代码混入持久化层。
2. **写入前必须做安全清洗/转义**：
   - 去除潜在危险脚本片段
   - 保留业务允许的 HTML 标签和结构
   - 防止 XSS、脚本注入、属性注入
3. **数据库中存储的应是可逆的业务富文本**，而不是二次编码后的乱码文本。
4. **读取后直接用于回显时**，前端必须按富文本展示规范渲染，不得当纯文本二次转义导致内容损坏。
5. 如果系统采用 HTML 字符串存储，则应统一一套“输入清洗 -> 入库 -> 输出渲染”链路，避免不同页面各自处理导致不一致。

#### 推荐规范表达

- 入库前：sanitize + normalize
- 数据库存储：保留业务合法 HTML / 富文本结构
- 出库时：按内容类型进入富文本渲染组件

---

## 锁定规则确认

我已确认并锁定以下规则，后续实现必须遵守：

1. `exp_msg` 是实验课程主表，是所有实验内容聚合的核心。
2. `exp_step / exp_material / exp_security / exp_question` 均应按 1:N 的实验内容扩展模型理解，其中 `exp_step` 的顺序必须严格按 `sort_order` 升序。
3. 实验列表页的基础字段必须包含：`exp_name`、`logo_url`、`class_hour`、`status`。
4. 列表页的逻辑字段必须通过 Join 获取，至少包括：学科名、年级名、教材章/节名。
5. 子表保存必须采用 `Delete then Insert` 的全量覆盖模式，禁止碎片更新。
6. 所有逻辑删除数据默认必须满足 `is_deleted = 0` 才可查询。
7. 保存时应自动补齐 owner/归属人信息，保证业务对象可追溯。
8. `exp_step` 和 `exp_material` 的更新删除-插入逻辑必须包裹在同一个数据库事务中。
9. `exp_step.step_comments` 的富文本必须经过统一清洗、转义与规范化存储。

---

## 文档完整大纲

1. 文档定位与使用边界
2. 全表字典清单
   - 基础字典类
   - 教材与学科体系
   - 实验与试验内容主模型
   - 材料与安全体系
   - 题库与答题体系
   - 组织、用户与权限体系
   - 积分、社交与日志体系
   - 课题组/教研组体系
   - 迁移辅助表
3. 实验课程核心模型 exp_msg 深度分析
   - exp_msg 主表定位
   - exp_msg 与步骤/材料/安全标签/习题的 1:N 关系
   - exp_msg 关联维表
4. 字段呈现基准（列表页）
   - 物理字段
   - 逻辑字段（需 Join）
   - 推荐 SQL Join 范式
5. 数据操作（DML）铁律
   - 子表全量覆盖
   - 保存时自动补齐 owner_user_id
   - 查询时自动过滤 is_deleted = 0
   - exp_step 排序规则
   - 事务性更新范式（Transactional Pattern）
6. 锁定规则确认
7. 旧文档清理候选清单

---

## 旧文档清理候选清单

> 以下为当前仓库中明显属于“数据库相关说明文件”的旧/过时候选项，先列出，等待你确认后再一键删除。

### 说明文档候选

1. `docs/GMS-实施计划与技术规格书.md`
2. `docs/auth/01-role-permissions-rbac.md`
3. `docs/auth/02-login-session-closed-loop.md`
4. `docs/auth/02-login-session-closed-loop.plan.md`
5. `docs/contracts/management-sidebar-ia-closed-loop-mock.md`
6. `docs/EXPERIMENTAL_MATERIAL_SPEC.md`

### 仓库中其他疑似数据库/数据说明候选

1. `database/migrations/bs_exp_data.sql`（当前基线来源文件，不建议删除）
2. 任何与 `DATABASE_BASELINE`、实验数据结构、迁移说明重复的 `.md` / `.txt` 文件

> 注：我目前只列出“明显的候选项”。你确认后，我再按你的指令执行一键删除。

---

> 结论：`DATABASE_BASELINE.md` 已升级为正式版，且新增了 SQL Join 范式、事务性更新范式、富文本存储规范三项军规。
