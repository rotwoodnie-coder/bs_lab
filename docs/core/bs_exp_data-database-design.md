# bs_exp_data 数据库设计文档

- 版本：1.1
- 最后更新：2026-05-06
- 维护人：架构组
- 数据库文件：`database/migrations/bs_exp_data.sql`
- 文档范围：仅描述数据库表结构、字段含义、主外键关系、索引设计与视图用途，不包含前端页面与 API 设计。
- 适用范围：`bs_lab` 的实验业务与通用基础数据。

> **提示**
> 本文为当前正式版本，历史版本已归档至 `docs/archive/`。

---

## 1. 数据库概述

`bs_exp_data` 是项目的核心业务数据库，主要承载以下几类数据：

### 1.1 数据分层

1. **基础字典数据**：学科、学段、年级、组织、角色、题型、难度、材料分类等。
2. **实验业务数据**：标准实验库、实验主表、实验子表、审核流转、作业分发。
3. **社交与协同数据**：点赞、收藏、评价、仲裁、家长陪同会话与报告。
4. **系统与通用能力数据**：用户、菜单、权限、日志、消息、反馈、积分等。
5. **迁移辅助数据**：迁移 ID 映射与错误日志。

数据库整体以 `varchar(32)` 作为业务主键风格，少量系统表使用自增整型主键。大部分业务表采用“主表 + 关联表”的拆分方式，便于扩展、审核与聚合查询。

> **提示**
> 下文中的表名、字段名与约束说明均按当前迁移脚本整理，如后续迁移变更，正文应同步更新。

---

## 2. 数据库设计原则

### 2.1 主键策略

- 业务主键多数采用 `varchar(32)`。
- 系统表少量采用 `int auto_increment`，例如 `sys_menu.menu_id`。
- 关联表多使用独立主键，避免复合主键在业务代码中的操作复杂度。

### 2.2 字段命名风格

- 主键统一后缀 `_id`。
- 名称字段统一后缀 `_name`。
- 说明字段统一为 `comments`。
- 状态字段统一为 `status`，但具体取值由业务定义。
- 排序字段统一为 `sort_order`。
- 审计字段通常包含：`create_time`、`update_time`、`create_user_id`、`update_user_id`。

### 2.3 软删除策略

部分核心业务表带有 `is_deleted` 字段，例如：

- `exp_msg`
- `exp_library`
- `material_msg`
- `sys_user`
- `sys_org`

逻辑删除有助于保留历史数据与引用完整性。

### 2.4 索引策略

- 所有外键字段基本都会建立索引。
- 唯一性约束多用于业务唯一键，例如用户登录名、收藏记录唯一约束、角色菜单权限唯一约束。
- 高查询频率字段通常建立组合索引，如时间、状态、所属组织等。
- 核心业务表建议至少保留 3 类高频组合索引：
  - `exp_msg(status, create_time)`：审核列表、发布时间线
  - `exp_msg(subject_id, grade_id, status)`：学科年级筛选
  - `exp_homework(class_id, create_time)`：班级任务列表
  - `social_collection(exp_id, user_id)`：收藏唯一性与查询
  - `social_like(exp_id, user_id)`：点赞唯一性与查询

### 2.5 外键约束策略

数据库大量使用外键，主要用于：

- 保证实验与教材、学科、年级、组织之间的引用完整性
- 保证子表与主表之间的级联关系正确
- 防止非法删除导致的悬挂数据

---

## 3. 基础字典

### 3.1 教材与课程体系

#### 3.1.1 `data_coursebook`

教材主表。

业务用途：教材主数据入口，供实验与章节绑定使用。

| 字段 | 说明 |
| --- | --- |
| `coursebook_id` | 主键 |
| `coursebook_name` | 教材名称 |
| `coursebook_version` | 教材版本 |
| `subject_id` | 学科 ID |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |

#### 3.1.2 `data_coursebook_chapter`

教材章表，外键指向 `data_coursebook`。

| 字段 | 说明 |
| --- | --- |
| `chapter_id` | 主键 |
| `chapter_name` | 章名称 |
| `coursebook_id` | 教材 ID |
| `comments` | 说明 |
| `status` | 状态 |
| `sort_order` | 排序 |

#### 3.1.3 `data_coursebook_unit`

教材节表，外键指向 `data_coursebook_chapter`。

| 字段 | 说明 |
| --- | --- |
| `unit_id` | 主键 |
| `unit_name` | 节名称 |
| `chapter_id` | 章 ID |
| `comments` | 说明 |
| `status` | 状态 |
| `sort_order` | 排序 |

### 3.2 学科学段年级体系

业务用途：用于约束实验可用范围、教材挂载范围与教学内容筛选。

#### 3.2.1 `data_school_subject`

学科表。

#### 3.2.2 `data_school_level`

学段表。

#### 3.2.3 `data_school_grade`

年级表，外键指向 `data_school_level`。

#### 3.2.4 `data_school_grade_subject`

年级与学科关联表，用于表达某年级可关联哪些学科。

### 3.3 难度与题型体系

- `data_difficulty_type`：题库难度类型
- `data_exp_difficulty`：试验难度
- `data_question_type`：题型
- `data_question_capacity`：能力侧重点
- `data_rating_scale`：评分等级
- `data_pref_title`：职称
- `data_role`：角色
- `data_msg_type`：消息类型
- `data_org_type`：组织类型

### 3.4 材料体系

- `data_material_type`：材料分类
- `data_material_prop`：材料属性
- `data_material_security`：材料安全性
- `data_material_unit`：材料计量单位

---

## 4. 实验业务

### 4.1 标准实验库

#### 4.1.1 `exp_library`

标准实验库主表，用于沉淀标准实验模板。

| 字段 | 说明 |
| --- | --- |
| `lib_exp_id` | 主键 |
| `lib_exp_name` | 标准试验名称 |
| `choose_type` | 必做/选做：`y` 必做，`n` 选做 |
| `subject_id` | 学科 ID |
| `school_level_id` | 学段 ID |
| `comments` | 备注 |
| `status` | 状态：`t` 草稿，`y` 发布，`n` 停用 |
| `create_user_id` | 创建人 |
| `create_time` | 创建时间 |
| `update_user_id` | 最后更新人 |
| `update_time` | 最后更新时间 |
| `is_deleted` | 逻辑删除 |

#### 4.1.2 `exp_library_grade`

标准实验适用年级关联表。

#### 4.1.3 `exp_library_video`

标准实验视频表。

### 4.2 实验主表

#### 4.2.1 `exp_msg`

实验主表，是教师/学生实验内容的核心实体。

| 字段 | 说明 |
| --- | --- |
| `exp_id` | 主键 |
| `exp_name` | 实验名称 |
| `choose_type` | 必做/选做 |
| `subject_id` | 学科 ID |
| `school_level_id` | 学段 ID |
| `grade_id` | 年级 ID |
| `difficulty_id` | 难度 ID |
| `exp_principle` | 实验原理（富文本） |
| `exp_caution` | 注意事项 |
| `exp_danger` | 危险提示 |
| `class_hour` | 课时 |
| `coursebook_id` | 教材 ID |
| `unit_id` | 教材节 ID |
| `create_user_type` | 发布人类型：Teacher / Student |
| `create_user_id` | 发布人 ID |
| `create_time` | 发布时间 |
| `confirm_user_id` | 审核人 ID |
| `confirm_time` | 审核时间 |
| `confirm_comments` | 审批意见 |
| `status` | 审核状态：`t` 草稿，`y` 通过，`n` 不通过 |
| `standard_exp_id` | 关联标准实验库 ID |
| `link_exp_id` | 关联实验 ID |
| `exp_task_type` | 作业类型：`hw` / `tk` / `self` |
| `like_num` | 点赞数 |
| `notlike_num` | 倒赞数 |
| `collection_num` | 收藏数 |
| `evaluate_num` | 评价数 |
| `simulator_url` | 模拟器地址 |
| `update_user_id` | 最后更新人 |
| `update_time` | 最后更新时间 |
| `is_deleted` | 逻辑删除 |

### 4.3 实验子表

#### 4.3.1 `exp_grade`

实验适用年级关联表。

#### 4.3.2 `exp_video`

实验视频表。

#### 4.3.3 `exp_pic`

实验图片表。

#### 4.3.4 `exp_material`

实验材料明细表。

#### 4.3.5 `exp_material_pic`

实验材料图片表。

#### 4.3.6 `exp_material_security`

实验材料安全性关联表。

#### 4.3.7 `exp_step`

实验步骤表。

#### 4.3.8 `exp_result`

实验结果表。

#### 4.3.9 `exp_security`

实验安全性关联表。

#### 4.3.10 `exp_reference`

实验参考引用表。

#### 4.3.11 `exp_reference_video`

实验参考视频表。

#### 4.3.12 `exp_scientist`

实验科学家故事表。

#### 4.3.13 `exp_simulation_record`

模拟试验记录表。

### 4.4 审核与作业

#### 4.4.1 `exp_homework`

教师发布作业表。

#### 4.4.2 `exp_homework_student`

学生试验作业表，包含作业快照机制。

#### 4.4.3 `exp_arbitration`

实验仲裁表。

#### 4.4.4 `exp_arbitration_like`

仲裁支持记录表。

#### 4.4.5 `exp_arbitration_notlike`

仲裁反对记录表。

---

## 5. 通用业务

### 5.1 用户、组织与权限

#### 5.1.1 `sys_user`

用户表。

主要字段：

- `user_id`
- `user_name`
- `user_org_id`
- `user_role_id`
- `login_name`
- `login_pwd`
- `status`
- `is_deleted`

#### 5.1.2 `sys_org`

组织表，支持树形层级。

#### 5.1.3 `sys_user_role`

用户角色关联表。

#### 5.1.4 `sys_role_menu_perm`

角色菜单权限表。

#### 5.1.5 `sys_menu`

系统菜单表。

#### 5.1.6 `sys_auth_refresh_token`

刷新令牌表。

### 5.2 系统消息、日志与反馈

- `sys_msg`：系统消息
- `sys_log`：系统日志
- `sys_feedback`：用户反馈

### 5.3 积分与称号

- `scale_log`：积分流水
- `scale_title`：积分称号规则

### 5.4 亲子协同

- `parent_session`：家长辅导会话
- `parent_report`：亲子实验报告
- `sys_parent_student_rel`：家长-学生绑定审核表
- `v_active_parent_children`：通过审核的家长学生关系视图

### 5.5 社交互动

- `social_like`：点赞记录
- `social_notlike`：倒赞记录
- `social_collection`：收藏记录
- `social_evaluate`：评价记录

### 5.6 组织扩展

- `subject_group`：课题组/教研组主表
- `subject_group_member`：组成员关系表
- `teacher_class`：教师授课班级关系

### 5.7 迁移辅助表

- `migration_id_map`：迁移 ID 映射
- `migration_error_log`：迁移错误日志

---

## 6. 表关系

### 6.1 实验主表关联关系

`exp_msg` 与以下实体存在外键关联：

- `data_school_subject`
- `data_school_level`
- `data_school_grade`
- `data_exp_difficulty`
- `data_coursebook`
- `data_coursebook_unit`
- `exp_library`
- `sys_user`

这意味着一个实验必须遵循学科、学段、年级、教材体系约束。

### 6.2 材料主库与实验材料关系

`material_msg` 是材料主库，`exp_material` 是实验使用明细。

并通过以下表进一步扩展：

- `material_pic`
- `material_security`
- `exp_material_pic`
- `exp_material_security`

### 6.3 教材体系与实验关系

实验可绑定教材章节体系：

- `exp_msg.coursebook_id` → `data_coursebook.coursebook_id`
- `exp_msg.unit_id` → `data_coursebook_unit.unit_id`

用于实现“按教材/章节/小节过滤实验”的能力。

### 6.4 班级与教师关系

- `sys_org` 承载班级组织
- `teacher_class` 表达教师授课班级关系
- `exp_homework` 通过 `class_id` 绑定班级

---

## 7. 索引约束

### 7.1 唯一索引

典型唯一约束包括：

- `sys_user.uk_sys_user_login`：登录名唯一
- `social_like.uk_social_like_exp_user`：同一用户对同一实验只能点赞一次
- `social_collection.uk_social_collection_exp_user`：同一用户对同一实验只能收藏一次
- `sys_role_menu_perm.uq_sys_role_menu_perm`：角色菜单权限唯一
- `sys_parent_student_rel.uk_parent_student`：家长学生绑定唯一
- `subject_group_member.uk_group_user`：组成员关系唯一
- `teacher_class.uk_teacher_class_subject`：教师-班级-学科唯一

### 7.2 组合索引

常见组合索引用于列表过滤和统计：

- 时间 + 类型
- 状态 + 时间
- 外键字段 + 状态
- 组织 + 审核状态

### 7.3 外键约束

外键策略统一以 `RESTRICT` 为主，表达：

- 上游主数据不能随意删除
- 需要先处理子表，再处理主表
- 保证审计、实验、消息、组织等链路完整

---

## 8. 视图设计

数据库包含若干视图，主要用于权限与活跃关系查询：

### 8.1 `v_active_parent_children`

- 业务用途：返回当前有效的家长-学生绑定关系。
- 典型场景：家长端展示可见学生、亲子实验报告、关联账户切换。

### 8.2 `v_active_student_enrollments`

- 业务用途：返回当前有效的学生组织/班级归属。
- 典型场景：学生任务分发、班级访问控制、统计归属。

### 8.3 `v_active_user_org_posts`

- 业务用途：返回有效的用户组织岗位信息。
- 典型场景：组织权限判断、组织树展示、人员任职管理。

### 8.4 `v_active_user_org_subject_posts`

- 业务用途：返回有效的用户-组织-学科岗位信息。
- 典型场景：教研组、课题组、学科授权、教师教学范围校验。

### 8.5 `v_user_school_stage`

- 业务用途：返回用户所属学段信息。
- 典型场景：实验筛选、学段导航、教研范围展示。

这些视图将底层关联关系和时间有效性规则封装起来，便于上层查询。若后续需要可在迁移脚本中补充对应 SQL 定义。

---

## 9. 业务场景

### 9.1 教师创建实验

数据写入：

- `exp_msg`
- `exp_material`
- `exp_step`
- `exp_result`
- `exp_reference`
- `exp_scientist`
- `exp_video`
- `exp_pic`

### 9.2 标准实验复用

数据来源：

- `exp_library`
- `exp_library_grade`
- `exp_library_video`

可用于生成实验草稿或初始化实验内容。

### 9.3 教学任务分发

数据写入：

- `exp_homework`
- `exp_homework_student`

### 9.4 社交反馈与统计

数据写入：

- `social_like`
- `social_notlike`
- `social_collection`
- `social_evaluate`

同时更新 `exp_msg` 聚合统计字段。

### 9.5 家校协同

数据写入：

- `parent_session`
- `parent_report`
- `sys_parent_student_rel`

---

## 10. 数据库设计结论

`bs_exp_data` 采用了较完整的业务分层：

- 目前迁移脚本未体现物理分区表或分区键定义，因此“核心业务分区”在本文中仅作为业务分层概念描述，不作为 MySQL 物理分区实现。
- 若后续引入分区，将在迁移脚本与本文中同步补充分区键、分区表达式与冷热数据策略。


- 基础字典层提供通用维表能力
- 实验主数据层承载核心业务内容
- 子表拆分用于富文本与多媒体扩展
- 通用系统表支撑权限、日志、消息、用户与组织
- 关联表和视图支撑复杂业务流转与查询

整体结构适合实验业务这类“内容多、关系多、状态多、扩展多”的场景，且与当前代码中的 `v2-exp` 模块保持了较高一致性。
