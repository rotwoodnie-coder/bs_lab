# bs_exp_data 数据库设计文档

- 版本：1.2
- 最后更新：2026-05-07
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
- 唯一性约束多用于业务唯一键，例如用户登录名、收藏记录唯一约束、角色菜单权限唯一约束、作业学生唯一约束。
- 高查询频率字段通常建立组合索引，如时间、状态、所属组织等。
- 核心业务表已创建以下高频组合索引：
  - `exp_msg(status, create_time)`：审核列表、发布时间线
  - `exp_msg(subject_id, grade_id, status)`：学科年级筛选
  - `exp_homework(class_id, create_time)`：班级任务列表
- 点赞与收藏记录通过唯一约束（`uk_social_*_exp_user`）同时达到索引效果。

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

| 字段 | 说明 |
| --- | --- |
| `subject_id` | 主键 |
| `subject_name` | 学科名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### 3.2.2 `data_school_level`

学段表。

| 字段 | 说明 |
| --- | --- |
| `level_id` | 主键 |
| `level_name` | 学段名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### 3.2.3 `data_school_grade`

年级表，外键指向 `data_school_level`。

| 字段 | 说明 |
| --- | --- |
| `grade_id` | 主键 |
| `grade_name` | 年级名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |
| `school_level_id` | 所属学段 ID，外键 → `data_school_level.level_id` |

#### 3.2.4 `data_school_grade_subject`

年级与学科关联表，用于表达某年级可关联哪些学科。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `subject_id` | 学科 ID，外键 → `data_school_subject.subject_id` |
| `grade_id` | 年级 ID，外键 → `data_school_grade.grade_id` |

### 3.3 难度与题型体系

#### `data_difficulty_type`

题库难度类型字典表。

| 字段 | 说明 |
| --- | --- |
| `type_id` | 主键 |
| `type_name` | 题库难度类型名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### `data_exp_difficulty`

实验难度字典表。

| 字段 | 说明 |
| --- | --- |
| `difficulty_id` | 主键 |
| `difficulty_name` | 实验难度名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### `data_question_type`

题型字典表。

| 字段 | 说明 |
| --- | --- |
| `type_id` | 主键 |
| `type_name` | 题型名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### `data_question_capacity`

能力侧重点字典表。

| 字段 | 说明 |
| --- | --- |
| `capacity_id` | 主键 |
| `capacity_name` | 能力侧重点名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### `data_rating_scale`

评分等级字典表（初始化后不可修改）。

| 字段 | 说明 |
| --- | --- |
| `scale_id` | 主键 |
| `scale_name` | 评分名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### `data_pref_title`

职称字典表。

| 字段 | 说明 |
| --- | --- |
| `title_id` | 主键 |
| `title_name` | 职称名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### `data_role`

角色字典表（初始化后不可修改）。

| 字段 | 说明 |
| --- | --- |
| `role_id` | 主键 |
| `role_name` | 角色名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### `data_msg_type`

消息类型字典表。

| 字段 | 说明 |
| --- | --- |
| `type_id` | 主键 |
| `type_name` | 消息类型名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### `data_org_type`

组织类型字典表（初始化后不可修改）。

| 字段 | 说明 |
| --- | --- |
| `type_id` | 主键 |
| `type_name` | 组织类型名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

### 3.4 材料体系

#### `data_material_type`

材料分类字典表。

| 字段 | 说明 |
| --- | --- |
| `type_id` | 主键 |
| `type_name` | 分类名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### `data_material_prop`

材料属性字典表。

| 字段 | 说明 |
| --- | --- |
| `prop_id` | 主键 |
| `prop_name` | 属性名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

#### `data_material_unit`

材料计量单位字典表。

| 字段 | 说明 |
| --- | --- |
| `unit_id` | 主键 |
| `unit_name` | 计量单位名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |

### 3.5 文件资源体系

#### `data_file_type`

素材类别字典表（初始化后不可修改）。

| 字段 | 说明 |
| --- | --- |
| `type_id` | 主键 |
| `type_name` | 类型名称 |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |
| `logo_class` | 图标样式标识 |

#### `data_file`

文件资源主表，承载文件元数据与素材管理。

| 字段 | 说明 |
| --- | --- |
| `file_id` | 主键 |
| `file_name` | 文件名称 |
| `file_url` | 文件 URL |
| `file_type_id` | 文件类型 ID，外键 → `data_file_type.type_id` |
| `status` | 状态：`y` 启用，`n` 停用 |
| `owner_user_id` | 归属人 ID |
| `logo_url` | 封面图 URL |
| `file_size` | 文件大小（字节） |
| `file_ext` | 文件后缀 |
| `content_sha256` | 内容 SHA-256(hex) |
| `is_hidden_from_gallery` | 是否在媒体库列表中隐藏：`1` 隐藏，`0` 展示 |
| `biz_type` | 业务类型：`avatar`（头像）、`media`（媒体素材）、`document`（文档），空表示未归类（业务表可通过 `file_id` 关联扩展） |
| `create_time` | 创建时间 |
| `update_time` | 最后更新时间 |
| `parent_file_id` | 父文件 ID（自引用），表达从属关系，外键 → `data_file.file_id`（ON DELETE SET NULL） |
| `relation_type` | 关系类型：`logo`（封面）、`transcoded`（转码）等 |
| `cover_file_id` | 封面文件 ID（冗余加速） |

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

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `lib_exp_id` | 标准实验 ID，外键 → `exp_library.lib_exp_id` |
| `grade_id` | 年级 ID，外键 → `data_school_grade.grade_id` |
| `sort_order` | 排序 |

#### 4.1.3 `exp_library_video`

标准实验视频表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `video_url` | 视频 URL |
| `lib_exp_id` | 标准实验 ID，外键 → `exp_library.lib_exp_id` |
| `sort_order` | 排序 |

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

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `grade_id` | 年级 ID，外键 → `data_school_grade.grade_id` |
| `sort_order` | 排序 |

#### 4.3.2 `exp_video`

实验视频表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `video_url` | 视频 URL |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `sort_order` | 排序 |
| `file_id` | 素材 ID，可选关联 `data_file.file_id` |

#### 4.3.3 `exp_pic`

实验图片表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `pic_url` | 图片 URL |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `sort_order` | 排序 |
| `file_id` | 素材 ID，可选关联 `data_file.file_id` |

#### 4.3.4 `exp_material`

实验材料明细表。

| 字段 | 说明 |
| --- | --- |
| `exp_material_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `material_id` | 材料主库 ID，外键 → `material_msg.material_id`（可为 NULL，表示非库来源） |
| `material_name` | 材料名称（允许自定义覆盖） |
| `is_self` | 是否自定义：`y` 自定义，`n` 来自材料库 |
| `material_num` | 实验用量（整型数量） |
| `material_unit` | 计量单位 |
| `material_prop_id` | 材料属性 ID，外键 → `data_material_prop.prop_id` |
| `material_type_id` | 材料分类 ID，外键 → `data_material_type.type_id` |
| `main_pic_url` | 主图片 URL |
| `exp_purpose` | 实验用途 |
| `additional_comments` | 补充说明 |
| `comments` | 备注 |
| `sort_order` | 排序 |
| `create_time` | 创建时间 |

#### 4.3.5 `exp_material_pic`

实验材料图片表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_material_id` | 实验材料 ID，外键 → `exp_material.exp_material_id` |
| `material_id` | 材料主库 ID（冗余，可选） |
| `material_url` | 图片 URL |
| `sort_order` | 排序 |
| `create_time` | 创建时间 |

#### 4.3.6 `exp_material_security`

实验材料安全性关联表。（详细字段见 §4.5.5）

#### 4.3.7 `exp_step`

实验步骤表。

| 字段 | 说明 |
| --- | --- |
| `step_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `step_name` | 步骤名称 |
| `step_comments` | 步骤内容（富文本） |
| `sort_order` | 排序 |

#### 4.3.8 `exp_result`

实验结果表。

| 字段 | 说明 |
| --- | --- |
| `result_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `result_name` | 结果名称 |
| `result_comments` | 结果内容（富文本） |
| `sort_order` | 排序 |

#### 4.3.9 `exp_security`

实验安全性关联表。（详细字段见 §4.5.4）

#### 4.3.10 `exp_reference`

实验参考引用表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `reference_name` | 引用名称 |
| `reference_source` | 引用出处/URL |
| `reference_comments` | 引用说明 |
| `sort_order` | 排序 |

#### 4.3.11 `exp_reference_video`

实验参考引用视频表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `video_url` | 视频 URL |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `sort_order` | 排序 |
| `file_id` | 素材 ID，可选关联 `data_file.file_id` |

#### 4.3.12 `exp_scientist`

实验科学家故事表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `scientist_name` | 科学家名称 |
| `story_name` | 故事名称 |
| `story_comments` | 故事内容 |
| `sort_order` | 排序 |

#### 4.3.13 `exp_simulation_record`

模拟实验记录表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `user_id` | 发起人 ID，外键 → `sys_user.user_id` |
| `begin_time` | 模拟开始时间 |
| `end_time` | 模拟结束时间 |
| `score` | 评分 |

### 4.4 审核与作业

#### 4.4.1 `exp_homework`

教师发布作业表。

| 字段 | 说明 |
| --- | --- |
| `work_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `teacher_user_id` | 教师 ID，外键 → `sys_user.user_id` |
| `class_id` | 班级 ID，外键 → `sys_org.org_id` |
| `require_date` | 要求完成日期 |
| `create_user_id` | 创建人 ID |
| `create_time` | 创建时间 |
| `update_user_id` | 最后更新人 ID |
| `update_time` | 最后更新时间 |
| `is_deleted` | 逻辑删除：`0` 正常，`1` 已删除 |

#### 4.4.2 `exp_homework_student`

学生实验作业表，包含作业快照机制。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `work_id` | 作业任务 ID，外键 → `exp_homework.work_id` |
| `exp_id` | 学生实验副本 ID（作业快照） |
| `teacher_user_id` | 教师 ID，外键 → `sys_user.user_id` |
| `teacher_exp_id` | 教师标准版实验 ID（快照冻结） |
| `student_user_id` | 学生 ID，外键 → `sys_user.user_id` |
| `require_date` | 要求完成日期 |
| `submit_date` | 提交日期 |
| `mark_user_id` | 批改人 ID |
| `mark_time` | 批改时间 |
| `mark_result` | 批改结果评分 |
| `mark_comments` | 批改意见 |

#### 4.4.3 `exp_arbitration`

实验仲裁表（实验小法庭）。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `initiator_id` | 发起人 ID，外键 → `sys_user.user_id` |
| `initiator_time` | 发起时间 |
| `like_num` | 支持数（冗余统计） |
| `notlike_num` | 反对数（冗余统计） |
| `judge_user_id` | 评判教师 ID |
| `judge_time` | 评判时间 |
| `initiator_status` | 仲裁状态：`t` 仲裁中，`y` 通过，`n` 不通过 |

#### 4.4.4 `exp_arbitration_like`

仲裁支持记录表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `user_id` | 用户 ID，外键 → `sys_user.user_id` |
| `comments` | 支持理由 |
| `create_time` | 记录时间 |

#### 4.4.5 `exp_arbitration_notlike`

仲裁反对记录表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `user_id` | 用户 ID，外键 → `sys_user.user_id` |
| `comments` | 反对理由 |
| `create_time` | 记录时间 |

### 4.5 安全性模型

安全性模型由四张表组成，覆盖"字典定义 → 材料固有标签 → 实验整体标签 → 实验材料实例标签"四个层级，支持标签继承与等级覆盖。

#### 4.5.1 层级关系

```
data_material_security (字典表)
   ↑ M:N                    ↑ M:N
material_security        exp_security
(材料固有安全性标签)      (实验整体安全性标签)
   ↑
exp_material_security
(实验材料实例安全性标签，可覆盖等级)
```

各层职责：
- **`data_material_security`**：安全性标签字典，定义可用标签与默认危险等级。
- **`material_security`**：材料固有安全性，记录"某材料天然具有哪些安全性标签"。
- **`exp_security`**：实验整体安全性，教师手动为整个实验选择的安全性标签，可覆盖字典默认等级。
- **`exp_material_security`**：实验材料实例安全性，关联实验中的具体材料与安全性标签，允许在实验场景下覆盖材料固有/字典默认的危险等级。

#### 4.5.2 `data_material_security`

材料安全性标签字典表。

业务用途：定义所有可用的安全性标签（如"易燃"、"腐蚀性"、"有毒气体"）及其默认危险等级。

| 字段 | 说明 |
| --- | --- |
| `security_id` | 主键 |
| `security_name` | 安全性名称，如"易燃"、"腐蚀性"、"有毒气体" |
| `comments` | 说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |
| `security_level` | 默认危险等级（数值越低越危险，0最危险） |

#### 4.5.3 `material_security`

材料安全性关联表，表达材料与安全性标签之间的多对多关系。

业务用途：记录某材料固有带有哪些安全性标签。例如："盐酸"天然具有"腐蚀性"和"有毒气体"标签。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `material_id` | 材料 ID，外键 → `material_msg.material_id` |
| `security_id` | 安全性标签 ID，外键 → `data_material_security.security_id` |
| `sort_order` | 排序 |
| `create_time` | 创建时间 |

注：`material_security` 不直接存储危险等级，材料的默认等级由关联的 `data_material_security.security_level` 提供。

#### 4.5.4 `exp_security`

实验安全性关联表，表达实验整体与安全性标签之间的多对多关系。

业务用途：教师手动为整个实验选择安全性标签，可独立于材料安全性。例如："浓硫酸稀释实验"整体标记为"强腐蚀性"。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `security_id` | 安全性标签 ID，外键 → `data_material_security.security_id` |
| `sort_order` | 排序 |
| `security_level` | 实验整体危险等级，覆盖字典默认值（数值越低越危险） |

#### 4.5.5 `exp_material_security`

实验材料安全性关联表，表达实验中的具体材料与安全性标签之间的多对多关系。

业务用途：记录实验中使用某个材料时，该材料在实验场景下具有哪些安全性标签及相应危险等级。例如："盐酸"在"锌粒与盐酸反应"实验中标记为"腐蚀性（等级 1）"，但在"稀释盐酸"实验中标记为"腐蚀性（等级 3）"。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_material_id` | 实验材料表 ID，外键 → `exp_material.exp_material_id` |
| `material_id` | 材料主库 ID，冗余字段，用于加速查询（不设外键约束，由应用层保证一致性；应与 `exp_material` 表中对应记录的 `material_id` 值保持一致） |
| `security_id` | 安全性标签 ID，外键 → `data_material_security.security_id` |
| `sort_order` | 排序 |
| `security_level` | 实验场景下该材料该标签的危险等级，覆盖字典默认值（数值越低越危险） |
| `create_time` | 创建时间 |

> **说明**
> `material_id` 字段为冗余加速设计，查询时可直接关联 `material_msg` 获取材料名称，无需经过 `exp_material` 二次跳转。数据一致性由应用层保证。

#### 4.5.6 业务规则

##### 危险等级继承链

`material_security` 表本身不存储危险等级，仅表达材料与安全性标签的多对多关联；等级统一从 `data_material_security.security_level`（字典默认值）获取，或被 `exp_material_security.security_level` 覆盖。

查询某材料在某个实验场景下的具体危险等级时，按以下优先级：

```
exp_material_security.security_level（实验场景指定）  ← 最高优先级
    ↓ 未设置则回退
data_material_security.security_level（字典默认等级）  ← 兜底
```

即：如果 `exp_material_security.security_level` 不为 NULL，使用它；否则使用 `data_material_security.security_level`（字典默认值）。

##### 实验整体安全标签（exp_security）

- 实验整体的安全性标签由教师手动选择，**不依赖材料**。
- 即使实验中没有添加任何材料，也可单独设置 `exp_security` 记录。
- `exp_security.security_level` 若不为 NULL，覆盖字典默认等级。

##### 实验材料安全标签（exp_material_security）

- 实验中使用的某个材料会在 `exp_material` 表中记录一行。
- 该材料在实验场景下的安全性标签通过 `exp_material_security` 记录。
- 可以为同一材料的不同安全性标签分别设置不同的 `security_level`。
- 若保留 `security_level = NULL`，则继承字典默认等级。

##### 实验整体风险评级

查询一个实验的**最终安全风险评级**时，需合并两类数据：

1. `exp_security`：实验整体安全性标签及其等级
2. `exp_material_security`：实验材料的安全性标签及其等级

取所有记录中**最低的 `security_level`**（最危险）作为实验整体风险评级。

##### 查询示例

```sql
-- 查询某个实验的所有安全性标签及最终危险等级
-- 合并 exp_security（实验整体）与 exp_material_security（实验材料）
-- 使用 MIN() 聚合是因为同一安全性标签可能从实验整体和实验材料两条路径同时出现，
-- 取最低（最危险）等级作为该标签的最终评级
-- COALESCE(final_level, 999) 确保 NULL 等级排在最后，而非排在最前
SELECT
    sec.security_id,
    sec.security_name,
    MIN(COALESCE(src.effective_level, sec.security_level)) AS final_level
FROM (
    -- 实验整体安全性标签
    SELECT
        es.exp_id,
        es.security_id,
        COALESCE(es.security_level, sec_inner.security_level) AS effective_level
    FROM exp_security es
    LEFT JOIN data_material_security sec_inner
        ON es.security_id = sec_inner.security_id

    UNION

    -- 实验材料安全性标签
    SELECT
        em.exp_id,
        ems.security_id,
        COALESCE(ems.security_level, sec_inner.security_level) AS effective_level
    FROM exp_material_security ems
    JOIN exp_material em ON ems.exp_material_id = em.exp_material_id
    LEFT JOIN data_material_security sec_inner
        ON ems.security_id = sec_inner.security_id
) src
JOIN exp_msg e ON src.exp_id = e.exp_id
JOIN data_material_security sec ON src.security_id = sec.security_id
WHERE e.exp_id = ?
GROUP BY sec.security_id, sec.security_name
ORDER BY COALESCE(final_level, 999) ASC;
```

#### 4.5.7 与其他实体关联

| 实体 | 关联方式 |
| --- | --- |
| `material_msg`（材料主库） | 通过 `material_security.material_id` 关联材料固有安全性标签；通过 `exp_material_security.material_id` 关联实验场景下的材料安全性 |
| `exp_msg`（实验主表） | 通过 `exp_security.exp_id` 直接关联实验整体安全性标签；通过 `exp_material.exp_id` 关联到实验使用的材料，再通过 `exp_material_security.exp_material_id` 关联材料实例的安全性标签 |
| `exp_material`（实验材料明细） | 通过 `exp_material_security.exp_material_id` 关联实验材料的安全性标签与等级 |

### 4.6 题库系统

题库系统由五张表组成，支持题目管理、选项配置与答题记录。

#### 4.6.1 关系概述

```
exp_msg（实验主表）
  ║
  ╚══ exp_question（题目）
         ║
         ╠══ exp_question_select（选项）
         ║
         ╚══ exp_question_answer（答题记录）
                  ║
                  ╚══ exp_question_answer_select（答题选项明细）
```

题目（`exp_question`）通过 `teacher_user_id` 关联教师，通过 `class_id` 和 `unit_id` 约束教材与班级范围，与 `exp_msg` 之间无直接外键，而是通过 API 层面的"实验关联题目"实现逻辑关联。

#### 4.6.2 `exp_question`

题目表。

| 字段 | 说明 |
| --- | --- |
| `question_id` | 主键 |
| `question_content` | 题干内容（富文本） |
| `teacher_user_id` | 出题人/所属教师 ID，外键 → `sys_user.user_id` |
| `class_id` | 班级/年级关联 ID，外键 → `sys_org.org_id` |
| `difficulty_type_id` | 难度类型 ID，外键 → `data_difficulty_type.type_id` |
| `question_type_id` | 题型 ID，外键 → `data_question_type.type_id` |
| `question_capacity_id` | 能力侧重点 ID，外键 → `data_question_capacity.capacity_id` |
| `unit_id` | 教材节 ID，外键 → `data_coursebook_unit.unit_id` |
| `knowledge_id` | 知识点 ID |
| `knowledge_content` | 知识点内容 |
| `choose_type` | 选择类型：单选/多选 |
| `status` | 状态：`y` 启用，`n` 停用，`t` 草稿 |
| `create_user_id` | 创建人 ID |
| `create_time` | 创建时间 |
| `update_user_id` | 最后更新人 ID |
| `update_time` | 最后更新时间 |
| `is_deleted` | 逻辑删除：`0` 正常，`1` 已删除 |

#### 4.6.3 `exp_question_select`

题目选项表。

| 字段 | 说明 |
| --- | --- |
| `select_id` | 主键 |
| `question_id` | 题目 ID，外键 → `exp_question.question_id` |
| `select_content` | 选项内容 |
| `sort_order` | 排序 |
| `is_right` | 是否正确答案：`y` 正确，`n` 错误 |

#### 4.6.4 `exp_question_answer`

答题记录表。

| 字段 | 说明 |
| --- | --- |
| `answer_id` | 主键 |
| `question_id` | 题目 ID，外键 → `exp_question.question_id` |
| `user_id` | 答题人 ID，外键 → `sys_user.user_id` |
| `create_time` | 答题时间 |
| `question_result` | 答题结果：`y` 正确，`n` 错误 |

#### 4.6.5 `exp_question_answer_select`

答题选项明细表，记录每道答题选择了哪些选项。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `answer_id` | 答题记录 ID，外键 → `exp_question_answer.answer_id` |
| `question_id` | 题目 ID，外键 → `exp_question.question_id` |
| `select_id` | 选项 ID，外键 → `exp_question_select.select_id` |

### 4.7 材料主库

材料主库表（`material_msg`）与材料图片表（`material_pic`），支撑实验材料的统一管理与复用。

#### 4.7.1 `material_msg`

材料主库表。

| 字段 | 说明 |
| --- | --- |
| `material_id` | 主键 |
| `material_name` | 材料名称 |
| `material_prop_id` | 材料属性 ID，外键 → `data_material_prop.prop_id` |
| `material_type_id` | 材料分类 ID，外键 → `data_material_type.type_id` |
| `material_num` | 建议用量（含单位，如"500 毫升"） |
| `main_pic_url` | 主图片 URL |
| `exp_purpose` | 实验用途 |
| `additional_comments` | 补充说明 |
| `comments` | 备注/安全说明 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `create_user_id` | 创建人 ID |
| `create_time` | 创建时间 |
| `update_user_id` | 最后更新人 ID |
| `update_time` | 最后更新时间 |
| `is_deleted` | 逻辑删除：`0` 正常，`1` 已删除 |

#### 4.7.2 `material_pic`

材料图片表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `material_id` | 材料 ID，外键 → `material_msg.material_id` |
| `material_url` | 图片 URL |
| `sort_order` | 排序 |
| `create_time` | 创建时间 |

---

## 5. 通用业务

### 5.1 用户、组织与权限

#### 5.1.1 `sys_user`

用户表。

| 字段 | 说明 |
| --- | --- |
| `user_id` | 主键 |
| `user_name` | 姓名 |
| `user_org_id` | 所属组织 ID，外键 → `sys_org.org_id` |
| `user_role_id` | 主角色 ID，外键 → `data_role.role_id` |
| `user_logo` | 头像 URL |
| `user_nick_name` | 昵称 |
| `login_name` | 登录名（唯一约束） |
| `login_pwd` | 登录密码（哈希存储） |
| `user_phone` | 手机号 |
| `user_email` | 邮箱 |
| `expire_date` | 账号有效期 |
| `comments` | 备注 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `last_login_time` | 最后登录时间 |
| `pref_title_id` | 个人职称 ID，外键 → `data_pref_title.title_id` |
| `per_resume` | 个人简介 |
| `per_score` | 个人积分（由点赞、收藏等行为触发计算，可通过定时任务或触发器同步） |
| `create_user_id` | 创建人 ID |
| `create_time` | 创建时间 |
| `update_user_id` | 最后更新人 ID |
| `update_time` | 最后更新时间 |
| `is_deleted` | 逻辑删除：`0` 正常，`1` 已删除 |

#### 5.1.2 `sys_org`

组织表，支持树形层级。

| 字段 | 说明 |
| --- | --- |
| `org_id` | 主键 |
| `org_name` | 组织名称 |
| `org_type_id` | 组织类型 ID，外键 → `data_org_type.type_id` |
| `grade_id` | 年级 ID（班级节点使用），外键 → `data_school_grade.grade_id` |
| `parent_org_id` | 父组织 ID，外键自引用 → `sys_org.org_id` |
| `org_path` | 物化路径，如 `/root/school1/class1` |
| `status` | 状态：`y` 启用，`n` 停用 |
| `sort_order` | 排序 |
| `create_user_id` | 创建人 ID |
| `create_time` | 创建时间 |
| `update_user_id` | 最后更新人 ID |
| `update_time` | 最后更新时间 |
| `is_deleted` | 逻辑删除：`0` 正常，`1` 已删除 |

#### 5.1.3 `sys_user_role`

用户角色关联表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `user_id` | 用户 ID，外键 → `sys_user.user_id` |
| `role_id` | 角色 ID，外键 → `data_role.role_id` |
| `org_id` | 所属组织 ID，外键 → `sys_org.org_id` |
| `create_time` | 关联时间 |

#### 5.1.4 `sys_role_menu_perm`

角色菜单权限表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `role_id` | 角色 ID，外键 → `data_role.role_id` |
| `menu_id` | 菜单 ID，外键 → `sys_menu.menu_id` |
| `can_read` | 是否可读/可见/可进入：`0` 否，`1` 是 |
| `can_write` | 是否可写/可编辑/可保存：`0` 否，`1` 是 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `create_user_id` | 创建人 ID |
| `create_time` | 创建时间 |
| `update_user_id` | 更新人 ID |
| `update_time` | 更新时间 |

#### 5.1.5 `sys_menu`

系统菜单表。

| 字段 | 说明 |
| --- | --- |
| `menu_id` | 菜单主键，自增 ID |
| `parent_id` | 父级菜单 ID，自引用 `sys_menu.menu_id` |
| `menu_name` | 菜单/页面名称 |
| `menu_code` | 稳定业务编码，用于权限锚点（唯一约束） |
| `menu_type` | 类型：`menu`/`page`/`button` |
| `path` | 路由路径 |
| `component` | 前端组件或页面标识 |
| `sort_order` | 排序 |
| `status` | 状态：`y` 启用，`n` 停用 |
| `comments` | 备注 |
| `create_user_id` | 创建人 ID |
| `create_time` | 创建时间 |
| `update_user_id` | 更新人 ID |
| `update_time` | 更新时间 |

#### 5.1.6 `sys_auth_refresh_token`

刷新令牌表。

| 字段 | 说明 |
| --- | --- |
| `sid` | 主键，会话 ID |
| `token_hash` | 令牌哈希 |
| `user_id` | 用户 ID |
| `role_code` | 角色编码 |
| `org_id` | 组织 ID |
| `expires_at` | 过期时间 |
| `created_at` | 创建时间 |

### 5.2 系统消息、日志与反馈

#### `sys_msg`

系统消息表。

| 字段 | 说明 |
| --- | --- |
| `msg_id` | 主键 |
| `receiver_user_id` | 接收人 ID，外键 → `sys_user.user_id` |
| `sender_user_id` | 发送人 ID，外键 → `sys_user.user_id` |
| `msg_type_id` | 消息类型 ID，外键 → `data_msg_type.type_id` |
| `msg_content` | 消息内容 |
| `read_tag` | 阅读状态：`0` 未读，`1` 已读 |
| `send_time` | 发送时间 |
| `read_time` | 阅读时间 |

#### `sys_log`

系统日志表。

| 字段 | 说明 |
| --- | --- |
| `log_id` | 主键 |
| `user_id` | 操作人 ID，外键 → `sys_user.user_id` |
| `log_type` | 日志类型 |
| `log_time` | 记录时间 |
| `log_data_type` | 操作数据类型 |
| `log_data_id` | 操作数据 ID |
| `log_data_content` | 操作数据内容（JSON 格式的详细上下文） |

#### `sys_feedback`

用户反馈表。

| 字段 | 说明 |
| --- | --- |
| `feedback_id` | 主键 |
| `type` | 反馈类型：`BUG`/`FEATURE`/`OPTIMIZE`/`INQUIRY` |
| `title` | 简述标题 |
| `content` | 富文本 HTML 内容 |
| `status` | 处理状态：`TODO`/`DOING`/`DONE`/`REJECT` |
| `reporter` | 提报人信息（JSON） |
| `env` | 环境信息（JSON） |
| `issue_fingerprint` | 问题指纹 |
| `reply` | 修复说明 HTML |
| `replier_id` | 运维回复人 user_id |
| `reply_time` | 回复时间 |
| `create_user_id` | 创建人 ID |
| `create_time` | 创建时间 |
| `update_user_id` | 更新人 ID |
| `update_time` | 更新时间 |
| `is_deleted` | 逻辑删除 |

### 5.3 积分与称号

#### `scale_log`

积分流水表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `user_id` | 用户 ID，外键 → `sys_user.user_id` |
| `scale_source` | 积分来源 |
| `scale_num` | 积分变化量（正数增加，负数减少） |
| `create_time` | 记录时间 |

#### `scale_title`

积分称号规则表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `role_id` | 角色 ID，外键 → `data_role.role_id` |
| `title_name` | 称号名称 |
| `icon` | 称号图标 URL |
| `score_num` | 达标积分下限 |

### 5.4 亲子协同

#### `parent_session`

家长辅导会话表。

| 字段 | 说明 |
| --- | --- |
| `session_id` | 主键，会话 ID |
| `parent_user_id` | 家长用户 ID，外键 → `sys_user.user_id` |
| `student_user_id` | 学生用户 ID，外键 → `sys_user.user_id` |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `work_id` | 关联作业 ID（来自教师分发） |
| `task_id` | 关联学生任务 seq_id（`exp_homework_student.seq_id`） |
| `guide_style` | AI 引导风格：`gentle`/`rigorous`/`playful` |
| `parent_attested_at` | 家长陪同背书时间 |
| `error_count` | 操作错误预警次数 |
| `material_shortage_reported` | 是否已反馈材料难凑齐 |
| `evaluation_status` | 教师评价状态：`none`/`evaluated` |
| `teacher_comment` | 教师评语 |
| `teacher_star_rating` | 教师星级评分（1-5） |
| `completion_status` | 完成状态：`in_progress`/`completed` |
| `create_time` | 创建时间 |
| `update_time` | 最后更新时间 |

#### `parent_report`

亲子实验报告表。

| 字段 | 说明 |
| --- | --- |
| `report_id` | 报告 ID |
| `session_id` | 关联会话 ID，外键 → `parent_session.session_id` |
| `summary` | 摘要 |
| `strengths` | 亮点列表（JSON 数组） |
| `improvements` | 待改进列表（JSON 数组） |
| `next_recommendations` | 后续建议列表（JSON 数组） |
| `share_copy` | 分享文案 |
| `teacher_comment` | 教师评语（成就卡用） |
| `create_time` | 创建时间 |

#### `sys_parent_student_rel`

家长-学生绑定审核表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `parent_user_id` | 家长 ID，外键 → `sys_user.user_id` |
| `student_user_id` | 学生 ID，外键 → `sys_user.user_id` |
| `school_org_id` | 学校 ID，外键 → `sys_org.org_id` |
| `create_time` | 申请时间 |
| `audit_status` | 审核状态：`T` 待审，`Y` 通过，`N` 不通过 |
| `audit_user_id` | 审核人 ID |
| `audit_comments` | 审核意见 |
| `audit_time` | 审核时间 |

### 5.5 社交互动

#### `social_like`

点赞记录表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id`（与 `user_id` 唯一约束） |
| `user_id` | 用户 ID，外键 → `sys_user.user_id` |
| `create_time` | 点赞时间 |

#### `social_notlike`

倒赞记录表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id`（与 `user_id` 唯一约束） |
| `user_id` | 用户 ID，外键 → `sys_user.user_id` |
| `create_time` | 倒赞时间 |

#### `social_collection`

收藏记录表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id`（与 `user_id` 唯一约束） |
| `user_id` | 用户 ID，外键 → `sys_user.user_id` |
| `create_time` | 收藏时间 |

#### `social_evaluate`

评价记录表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `exp_id` | 实验 ID，外键 → `exp_msg.exp_id` |
| `user_id` | 用户 ID，外键 → `sys_user.user_id` |
| `evaluate_content` | 评价内容 |
| `evaluate_url` | 评价附件 URL |
| `create_time` | 评价时间 |

### 5.6 组织扩展

#### `subject_group`

课题组/教研组主表。

| 字段 | 说明 |
| --- | --- |
| `group_id` | 组唯一 ID |
| `group_name` | 组名称 |
| `comments` | 说明/备注 |
| `status` | 状态：`NORMAL` 正常，`DISABLED` 禁用 |
| `review_status` | 审核状态：`t` 待审核，`y` 通过，`n` 驳回 |
| `review_user_id` | 审核人 ID |
| `review_time` | 审核时间 |
| `review_comments` | 审批意见/驳回理由 |
| `reject_reason` | 驳回全文 |
| `subject_id` | 所属学科 ID |
| `owner_id` | 负责人用户 ID |
| `create_user_id` | 原始创建人 ID |
| `create_time` | 创建时间 |

#### `subject_group_member`

组成员关系表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 序列 ID |
| `group_id` | 关联组 ID，外键 → `subject_group.group_id` |
| `user_id` | 用户 ID |
| `status` | 成员状态：`JOINED` 已加入，`QUITTED` 已退出 |
| `create_user_id` | 添加人 ID |
| `create_time` | 加入时间 |

#### `teacher_class`

教师授课班级关系表。

| 字段 | 说明 |
| --- | --- |
| `seq_id` | 主键 |
| `teacher_id` | 教师人员 ID，外键 → `sys_user.user_id` |
| `class_org_id` | 班级组织 ID，外键 → `sys_org.org_id`（`org_type_id=Org_School_Class`） |
| `subject_id` | 学科 ID，外键 → `data_school_subject.subject_id`（教师-班级-学科唯一约束） |
| `status` | 状态：`y` 启用，`n` 停用 |
| `create_time` | 创建时间 |
| `update_time` | 更新时间 |
| `create_user_id` | 创建人 ID |
| `update_user_id` | 更新人 ID |

### 5.7 迁移辅助表

#### `migration_id_map`

迁移 ID 映射表，记录旧系统 ID 到新系统 ID 的映射关系。

| 字段 | 说明 |
| --- | --- |
| `src_table` | 源表名（复合主键的一部分） |
| `src_id` | 源表记录 ID（复合主键的一部分） |
| `new_id` | 新系统分配 ID |
| `created_at` | 记录创建时间 |

#### `migration_error_log`

迁移错误日志表。

| 字段 | 说明 |
| --- | --- |
| `id` | 自增主键 |
| `batch_id` | 迁移批次 ID |
| `src_table` | 源表名 |
| `src_id` | 源表记录 ID |
| `error_type` | 错误类型 |
| `error_msg` | 错误信息 |
| `created_at` | 记录创建时间 |

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

`material_msg` 是材料主库，`exp_material` 是实验使用明细（允许自定义材料名称，`is_self = 'y'` 表示非库来源）。

并通过以下表进一步扩展：

| 扩展表 | 关联方式 |
| --- | --- |
| `material_pic` | 材料主库图片，外键 → `material_msg.material_id` |
| `material_security` | 材料固有安全性标签（多对多），外键 → `material_msg.material_id` 与 `data_material_security.security_id` |
| `exp_material_pic` | 实验材料图片，外键 → `exp_material.exp_material_id` |
| `exp_material_security` | 实验材料实例安全性标签（多对多），外键 → `exp_material.exp_material_id` 与 `data_material_security.security_id`，支持实验场景等级覆盖 |

安全性标签继承链：`exp_material_security.security_level（实验指定）→ data_material_security.security_level（字典默认）`。详见 §4.5.6。

### 6.3 教材体系与实验关系

实验可绑定教材章节体系：

- `exp_msg.coursebook_id` → `data_coursebook.coursebook_id`
- `exp_msg.unit_id` → `data_coursebook_unit.unit_id`

用于实现“按教材/章节/小节过滤实验”的能力。

### 6.4 班级与教师关系

- `sys_org` 承载班级组织
- `teacher_class` 表达教师授课班级关系
- `exp_homework` 通过 `class_id` 绑定班级

### 6.5 题库系统与实验关系

`exp_msg` 可以在业务层面关联多道题目，每道题目支持多选项、多答案（`exp_question` 表中无 `exp_id` 字段，题目与实验之间无直接外键，通过 API 层或作业配置表实现逻辑关联）：

- `exp_question` → `exp_question_select` 选项（一对多）
- `exp_question` → `exp_question_answer` 答题记录
- `exp_question_answer` → `exp_question_answer_select` 答题选择的选项明细

用于实现"实验后测评/实验报告"场景。

### 6.6 社交互动与实验关系

实验支持社交行为统计，`exp_msg` 中的 `like_num`、`notlike_num`、`collection_num`、`evaluate_num` 为聚合统计字段：

- `social_like.exp_id` → `exp_msg.exp_id`（点赞，唯一约束防止重复点赞）
- `social_notlike.exp_id` → `exp_msg.exp_id`（倒赞，唯一约束）
- `social_collection.exp_id` → `exp_msg.exp_id`（收藏，唯一约束）
- `social_evaluate.exp_id` → `exp_msg.exp_id`（评价，无唯一约束，同一用户可多次评价）

### 6.7 文件系统与材料/实验关系

`data_file` 是文件资源主表，`data_file_type` 是素材类别字典：

- `data_file_type.type_id` → `data_file.file_type_id`（文件类型归类）
- `data_file` 通过 `biz_type` 区分业务类型（`avatar`、`media`、`document`）
- `material_pic.material_url` 记录材料图片地址（可选关联 `data_file.file_id`）
- `exp_pic.file_id` 与 `exp_video` 的视频素材均可关联 `data_file`

---

## 7. 索引约束

### 7.1 唯一索引

典型唯一约束包括：

- `sys_user.uk_sys_user_login`：登录名唯一
- `social_like.uk_social_like_exp_user`：同一用户对同一实验只能点赞一次
- `social_notlike.uk_social_notlike_exp_user`：同一用户对同一实验只能倒赞一次
- `social_collection.uk_social_collection_exp_user`：同一用户对同一实验只能收藏一次
- `sys_role_menu_perm.uq_sys_role_menu_perm`：角色菜单权限唯一
- `sys_parent_student_rel.uk_parent_student`：家长学生绑定唯一
- `subject_group_member.uk_group_user`：组成员关系唯一
- `teacher_class.uk_teacher_class_subject`：教师-班级-学科唯一
- `exp_homework_student.uk_exp_hw_student_work_stu`：同一学生只能有一条作业记录（`work_id, student_user_id`）
- `exp_arbitration_like.uk_exp_arb_like_exp_user`：同一用户对同一仲裁只可支持一次
- `exp_arbitration_notlike.uk_exp_arb_notlike_exp_user`：同一用户对同一仲裁只可反对一次
- `data_file.uq_data_file_parent_relation`：父文件下同一关系类型唯一

### 7.2 组合索引

常见组合索引用于列表过滤和统计。关键组合索引包括：

| 表 | 索引名 | 索引字段 | 查询场景 |
| --- | --- | --- | --- |
| `exp_msg` | `idx_exp_msg_status_time` | `status, create_time` | 审核列表、发布时间线 |
| `exp_msg` | `idx_exp_msg_subject_grade_status` | `subject_id, grade_id, status` | 学科年级筛选 |
| `exp_homework` | `idx_exp_homework_class_time` | `class_id, create_time` | 班级任务列表 |
| `social_like` | `uk_social_like_exp_user`（唯一约束） | `exp_id, user_id` | 点赞唯一性与查询 |
| `social_collection` | `uk_social_collection_exp_user`（唯一约束） | `exp_id, user_id` | 收藏唯一性与查询 |
| `sys_log` | `idx_sys_log_type_time` | `log_type, log_time` | 日志按类型+时间检索 |
| `exp_step` | `idx_exp_step_exp` | `exp_id` | 按实验ID查步骤 |

完整索引定义见 DDL 中的 `idx_*`、`uk_*` 和 `uq_*` 约束。

### 7.3 外键约束

外键策略统一以 `RESTRICT` 为主，表达：

- 上游主数据不能随意删除
- 需要先处理子表，再处理主表
- 保证审计、实验、消息、组织等链路完整

---

## 8. 视图设计

数据库包含若干视图，主要用于权限与活跃关系查询：

### 8.1 `v_active_parent_children`

- 业务用途：返回当前有效的家长-学生绑定关系（仅 `audit_status = 'Y'` 的记录）。
- 典型场景：家长端展示可见学生、亲子实验报告、关联账户切换。
- 定义（DDL）：

```sql
CREATE VIEW `v_active_parent_children` AS
SELECT
  `r`.`seq_id`,
  `r`.`parent_user_id`,
  `r`.`student_user_id`,
  `r`.`school_org_id`,
  `r`.`create_time`,
  `r`.`audit_status`,
  `r`.`audit_user_id`,
  `r`.`audit_comments`,
  `r`.`audit_time`
FROM `sys_parent_student_rel` `r`
WHERE `r`.`audit_status` = 'Y';
```

### 8.2 `v_active_student_enrollments`

- 业务用途：返回当前有效的学生组织/班级归属。
- 典型场景：学生任务分发、班级访问控制、统计归属。
- 依赖外部表：`iam_student_enrollments`（不属于 `bs_exp_data` 库，由 IAM 系统维护）

### 8.3 `v_active_user_org_posts`

- 业务用途：返回有效的用户组织岗位信息。
- 典型场景：组织权限判断、组织树展示、人员任职管理。
- 依赖外部表：`iam_user_org_posts`（不属于 `bs_exp_data` 库，由 IAM 系统维护）

### 8.4 `v_active_user_org_subject_posts`

- 业务用途：返回有效的用户-组织-学科岗位信息。
- 典型场景：教研组、课题组、学科授权、教师教学范围校验。
- 依赖外部表：`iam_user_org_subject_posts`（不属于 `bs_exp_data` 库，由 IAM 系统维护）

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
