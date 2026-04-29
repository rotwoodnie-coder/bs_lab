# 中小学试验平台数据库开发前规范与字段设计审核稿

**版本**：V1.0  
**用途**：架构审核 / 开发前冻结  
**范围**：数据库字段设计、表结构边界、枚举规范、外键关系说明

---

# 目录

1. 文档目的
2. 项目数据库设计目标
3. 设计原则
4. 全局命名规范
5. 枚举值规范
6. 模块与字段设计说明
   1. 基础字典模块
   2. 系统主数据模块
   3. 素材资源模块
   4. 标准试验库与实验业务模块
   5. 作业与仲裁模块
   6. 社交互动模块
   7. 题库与答题模块
   8. 积分激励模块
7. 字段设计说明与外键说明
   1. 基础字典字段说明
   2. 组织与人员字段说明
   3. 素材资源字段说明
   4. 实验业务字段说明
   5. 作业与仲裁字段说明
   6. 社交互动字段说明
   7. 题库与答题字段说明
   8. 积分激励字段说明
8. 需要架构师重点审核的内容
9. 开发前审核建议结论
10. 提交摘要

---

# 1. 文档目的

用于在正式进入开发前，对项目数据库设计进行统一审核与冻结，确保数据库结构来源明确、字段语义清晰、命名风格统一、枚举值可控、模块边界明确、业务闭环完整。

---

# 2. 项目数据库设计目标

1. 支撑实验教学核心流程
2. 支撑作业发布、提交、批改、仲裁流程
3. 支撑题库、答题、判题闭环
4. 支撑互动、收藏、评价、积分激励
5. 支撑组织、人员、角色、课题组等基础主数据
6. 支撑素材统一管理
7. 控制扩展边界，防止无约束扩表

---

# 3. 设计原则

## 3.1 严格按原始文件建模
## 3.2 仅允许必要修正
## 3.3 字段设计必须有业务语义
## 3.4 外键只做必要关联

---

# 4. 全局命名规范

## 4.1 表名规范

### 4.1.1 统一原则
- 全小写
- 下划线分隔
- 前缀表达模块
- 不使用驼峰
- 不使用中英文混写
- 不使用临时缩写

### 4.1.2 推荐前缀
- `data_`：基础字典 / 主数据
- `sys_`：系统主数据
- `exp_`：实验业务
- `social_`：社交互动
- `scale_`：积分激励
- `subject_group`：课题组相关

### 4.1.3 示例
- `data_role`
- `data_pref_title`
- `data_file`
- `sys_user`
- `sys_org`
- `exp_msg`
- `exp_question`
- `social_like`
- `scale_log`

## 4.2 字段名规范

### 4.2.1 统一原则
- 全小写
- 下划线分隔
- 语义清晰
- 避免拼音和中英混写
- 避免不必要缩写

### 4.2.2 典型修正
- `vedio` → `video`
- `coments` → `comments`
- `requir_date` → `require_date`
- `securtiy` → `security`
- `refernece` → `reference`
- `Subject_id` → `subject_id`
- `expire‌_date` → `expire_date`
- `mark‌_user_id` → `mark_user_id`

---

# 5. 枚举值规范

## 5.1 `status`
- `y` = 启用 / 发布 / 通过
- `n` = 停用 / 不通过
- `t` = 草稿 / 审核中 / 处理中

## 5.2 `choose_type`
适用：`exp_library`、`exp_msg`
- `y` = 必做
- `n` = 选做

## 5.3 `exp_task_type`
适用：`exp_msg`
- `hw` = 作业
- `tk` = 拍同款
- `self` = 自主试验

## 5.4 `read_tag`
适用：`sys_msg`
- `0` = 未读
- `1` = 已读

## 5.5 `question_result`
适用：`exp_question_answer`
- `y` = 正确
- `n` = 错误

## 5.6 `initiator_status`
适用：`exp_arbitration`
- `t` = 仲裁中
- `y` = 通过
- `n` = 不通过

## 5.7 `is_right`
适用：`exp_question_select`
- `y` = 正确
- `n` = 错误

## 5.8 `is_self`
适用：`exp_material`
- `y` = 自定义
- `n` = 非自定义

---

# 6. 模块与字段设计说明

## 6.1 基础字典模块
### 模块说明
该模块用于支撑全系统公共枚举和基础选项。

### 已确认表
- `data_msg_type`
- `data_material_security`
- `data_material_type`
- `data_material_prop`
- `data_file_type`
- `data_file`
- `data_org_type`
- `data_role`
- `data_pref_title`
- `data_school_level`
- `data_school_grade`
- `data_school_subject`
- `data_school_grade_subject`
- `data_coursebook`
- `data_coursebook_chapter`
- `data_coursebook_unit`
- `data_rating_scale`
- `data_exp_difficulty`
- `data_difficulty_type`
- `data_question_type`
- `data_question_capacity`

### 字段设计原则
- 采用稳定 ID 作为主键
- 保留 `comments`、`status`、`sort_order` 作为通用管理字段
- 字典值以编码形式存储，中文名称作为展示字段

## 6.2 系统主数据模块
### 模块说明
该模块用于全系统统一的组织与人员管理。

### 已确认表
- `sys_org`
- `sys_user`
- `sys_user_role`
- `sys_msg`
- `sys_log`

### 字段设计原则
- `sys_org` 统一表达组织树
- `sys_user` 统一表达人员主档
- `sys_user_role` 处理人员-角色-组织关系
- `sys_msg` 处理消息收发
- `sys_log` 处理审计日志

## 6.3 素材资源模块
### 模块说明
该模块用于管理文件资源和材料主库。

### 已确认表
- `data_file`
- `material_msg`
- `material_pic`
- `material_security`

### 边界说明
- `data_file` = 文件资源主表，管理的是文件对象
- `material_msg` = 试验材料主库，管理的是材料词条
- `exp_material` = 实验中的材料明细，属于试验实例层

## 6.4 标准试验库与实验业务模块
### 模块说明
该模块是项目核心业务之一，负责标准实验模板、实验实例、材料、步骤、结果、安全、引用、模拟记录等。

### 已确认表
- `exp_library`
- `exp_library_grade`
- `exp_library_video`
- `exp_msg`
- `exp_grade`
- `exp_video`
- `exp_pic`
- `exp_material`
- `exp_material_pic`
- `exp_material_security`
- `exp_step`
- `exp_result`
- `exp_security`
- `exp_reference`
- `exp_reference_video`
- `exp_scientist`
- `exp_simulation_record`

### 边界说明
- `exp_library` 是标准模板
- `exp_msg` 是业务实例
- `exp_material` 是实验中的材料明细
- `exp_video` / `exp_pic` 是实验附件资源
- `exp_step` / `exp_result` / `exp_security` 是实验内容结构
- `exp_reference` / `exp_reference_video` / `exp_scientist` 是扩展内容
- `exp_simulation_record` 是模拟记录

## 6.5 作业与仲裁模块
### 模块说明
该模块用于教师布置作业、学生提交、老师批改，以及争议处理。

### 已确认表
- `exp_homework`
- `exp_homework_student`
- `exp_arbitration`
- `exp_arbitration_like`
- `exp_arbitration_notlike`

### 边界说明
- `exp_homework` = 教师发布作业主表
- `exp_homework_student` = 学生作业记录与批改结果
- `exp_arbitration` = 争议 / 仲裁主记录
- `exp_arbitration_like` / `exp_arbitration_notlike` = 仲裁支持 / 反对记录

## 6.6 社交互动模块
### 模块说明
该模块用于普通互动行为统计。

### 已确认表
- `social_like`
- `social_notlike`
- `social_collection`
- `social_evaluate`

### 边界说明
该模块仅表示普通互动行为，不承担流程裁决责任。

## 6.7 题库与答题模块
### 模块说明
该模块用于题目定义、选项配置、作答记录和选项明细记录。

### 已确认表
- `exp_question`
- `exp_question_select`
- `exp_question_answer`
- `exp_question_answer_select`

### 字典表
- `data_difficulty_type`
- `data_question_type`
- `data_question_capacity`

### 边界说明
- `exp_question` = 题目定义主表
- `exp_question_select` = 题目选项表
- `exp_question_answer` = 用户答题记录
- `exp_question_answer_select` = 用户答题选项明细

### 关键修正
`exp_question_select` 必须补充 `question_id`，否则无法建立题目与选项的关系。

## 6.8 积分激励模块
### 模块说明
该模块用于记录用户积分流水和称号规则。

### 已确认表
- `scale_log`
- `scale_title`

### 边界说明
- `scale_log` = 积分流水
- `scale_title` = 角色对应积分称号规则

---

# 7. 字段设计说明与外键说明

## 7.1 基础字典字段说明
### `data_msg_type`
- `type_id`：消息分类主键
- `type_name`：消息分类名称
- `comments`：说明
- `status`：启用/停用
- `sort_order`：排序

### `data_material_security`
- `security_id`：安全性主键
- `security_name`：安全性名称
- `comments`：说明
- `status`：启用/停用
- `sort_order`：排序
- `security_level`：危险等级，数值越低越危险

### `data_material_type`
- `type_id`：材料分类主键
- `type_name`：分类名称
- `comments`：说明
- `status`：启用/停用
- `sort_order`：排序

### `data_material_prop`
- `prop_id`：材料属性主键
- `prop_name`：属性名称
- `comments`：说明
- `status`：启用/停用
- `sort_order`：排序

### `data_file_type`
- `type_id`：文件类型主键
- `type_name`：类型名称
- `comments`：说明
- `status`：启用/停用
- `sort_order`：排序
- `logo_class`：图标或样式标识

### `data_file`
- `file_id`：文件主键
- `file_name`：文件名称
- `file_url`：文件 URL
- `file_type_id`：文件类型
- `status`：启用/停用
- `owner_user_id`：归属人
- `logo_url`：封面图

### `data_org_type`
- `type_id`：组织类型主键
- `type_name`：组织类型名称
- `comments`：说明
- `status`：启用/停用
- `sort_order`：排序

### `data_role`
- `role_id`：角色主键
- `role_name`：角色名称
- `comments`：说明
- `status`：启用/停用
- `sort_order`：排序

### `data_pref_title`
- `title_id`：职称主键
- `title_name`：职称名称
- `comments`：说明
- `status`：启用/停用
- `sort_order`：排序

### 外键说明
- `data_file.file_type_id` → `data_file_type.type_id`
- `data_file.owner_user_id` → `sys_user.user_id`（若统一用户主表最终确认）
- `sys_user.user_role_id` → `data_role.role_id`
- `sys_user.pref_title_id` → `data_pref_title.title_id`

## 7.2 组织与人员字段说明
### `sys_org`
- `org_id`：组织主键
- `org_name`：组织名称
- `org_type_id`：组织类型
- `grade_id`：年级信息
- `parent_org_id`：父组织
- `status`：启用/停用
- `sort_order`：排序

### `sys_user`
- `user_id`：人员主键
- `user_name`：姓名
- `user_org_id`：所属组织
- `user_role_id`：主角色
- `user_logo`：头像
- `user_nick_name`：昵称
- `login_name`：登录名
- `login_pwd`：登录密码
- `user_phone`：手机号
- `user_email`：邮箱
- `expire_date`：账号有效期
- `comments`：备注
- `status`：状态
- `last_login_time`：最后登录时间
- `pref_title_id`：个人职称
- `per_resume`：个人简介
- `per_score`：个人积分

### `sys_user_role`
- `seq_id`：主键
- `user_id`：人员
- `role_id`：角色
- `org_id`：组织

### `sys_msg`
- `msg_id`：消息主键
- `receiver_user_id`：接收人
- `sender_user_id`：发送人
- `msg_content`：消息内容
- `read_tag`：阅读状态
- `send_time`：发送时间
- `read_time`：阅读时间

### `sys_log`
- `log_id`：日志主键
- `user_id`：操作人
- `log_type`：日志类型
- `log_time`：记录时间
- `log_data_type`：操作数据类型
- `log_data_id`：操作数据 ID

### 外键说明
- `sys_org.org_type_id` → `data_org_type.type_id`
- `sys_org.grade_id` → `data_school_grade.grade_id`
- `sys_org.parent_org_id` → `sys_org.org_id`
- `sys_user.user_org_id` → `sys_org.org_id`
- `sys_user.user_role_id` → `data_role.role_id`
- `sys_user.pref_title_id` → `data_pref_title.title_id`
- `sys_user_role.user_id` → `sys_user.user_id`
- `sys_user_role.role_id` → `data_role.role_id`
- `sys_user_role.org_id` → `sys_org.org_id`
- `sys_msg.receiver_user_id` → `sys_user.user_id`
- `sys_msg.sender_user_id` → `sys_user.user_id`
- `sys_log.user_id` → `sys_user.user_id`

## 7.3 素材资源字段说明
### `material_msg`
- `material_id`：材料主键
- `material_name`：材料名称
- `material_prop_id`：材料属性
- `material_type_id`：材料分类
- `material_num`：建议用量
- `main_pic_url`：主图片
- `exp_purpose`：试验用途
- `additional_comments`：补充说明
- `comments`：备注
- `status`：状态

### `material_pic`
- `seq_id`：主键
- `material_id`：材料ID
- `material_url`：图片 URL
- `sort_order`：排序

### `material_security`
- `seq_id`：主键
- `material_id`：材料ID
- `security_id`：安全性 ID
- `sort_order`：排序

### 外键说明
- `material_msg.material_prop_id` → `data_material_prop.prop_id`
- `material_msg.material_type_id` → `data_material_type.type_id`
- `material_pic.material_id` → `material_msg.material_id`
- `material_security.material_id` → `material_msg.material_id`
- `material_security.security_id` → `data_material_security.security_id`

## 7.4 实验业务字段说明
### `exp_library`
- `lib_exp_id`：标准试验主键
- `lib_exp_name`：标准试验名称
- `choose_type`：必做/选做
- `subject_id`：学科
- `school_level_id`：学段
- `comments`：备注
- `status`：状态

### `exp_library_grade`
- `seq_id`：主键
- `lib_exp_id`：标准试验 ID
- `grade_id`：年级 ID

### `exp_library_video`
- `seq_id`：主键
- `exp_id`：标准试验 ID
- `video_url`：视频 URL
- `sort_order`：排序

### `exp_msg`
- `exp_id`：试验主键
- `exp_name`：试验名称
- `choose_type`：必做/选做
- `subject_id`：学科
- `school_level_id`：学段
- `class_id`：班级
- `difficulty_id`：难度
- `exp_principle`：试验原理
- `exp_caution`：注意事项
- `exp_danger`：危险提示
- `class_hour`：课时
- `coursebook_id`：教材
- `unit_id`：教材节
- `create_user_type`：发布人类型
- `create_user_id`：发布人
- `create_time`：发布时间
- `confirm_user_id`：审核人
- `confirm_time`：审核时间
- `confirm_comments`：审批意见
- `status`：审核状态
- `standard_exp_id`：标准试验库关联
- `link_exp_id`：关联试验
- `exp_task_type`：作业类型
- `like_num`：点赞数
- `notlike_num`：倒赞数
- `collection_num`：收藏数
- `evaluate_num`：评价数
- `simulator_url`：模拟器地址

### `exp_grade`
- `seq_id`：主键
- `lib_exp_id`：试验 ID
- `grade_id`：年级 ID
- `sort_order`：排序

### `exp_video`
- `seq_id`：主键
- `video_url`：视频 URL
- `exp_id`：试验 ID
- `sort_order`：排序
- `file_id`：素材 ID

### `exp_pic`
- `seq_id`：主键
- `pic_url`：图片 URL
- `exp_id`：试验 ID
- `sort_order`：排序
- `file_id`：素材 ID

### `exp_material`
- `exp_material_id`：主键
- `exp_id`：试验 ID
- `material_id`：材料 ID
- `material_name`：材料名称
- `is_self`：是否自定义
- `material_num`：试验用量
- `material_prop_id`：材料属性
- `material_type_id`：材料分类
- `main_pic_url`：主图片
- `exp_purpose`：试验用途
- `additional_comments`：补充说明
- `comments`：备注
- `sort_order`：排序

### `exp_material_pic`
- `seq_id`：主键
- `exp_material_id`：实验材料 ID
- `material_id`：材料 ID
- `material_url`：图片 URL
- `sort_order`：排序

### `exp_material_security`
- `seq_id`：主键
- `exp_material_id`：实验材料 ID
- `material_id`：材料 ID
- `security_id`：安全性 ID
- `sort_order`：排序

### `exp_step`
- `step_id`：主键
- `exp_id`：试验 ID
- `step_name`：步骤名称
- `step_comments`：步骤内容
- `sort_order`：排序

### `exp_result`
- `result_id`：主键
- `exp_id`：试验 ID
- `result_name`：结果名称
- `result_comments`：结果内容
- `sort_order`：排序

### `exp_security`
- `seq_id`：主键
- `exp_id`：试验 ID
- `security_id`：安全性 ID
- `sort_order`：排序
- `security_level`：危险等级

### `exp_reference`
- `seq_id`：主键
- `exp_id`：试验 ID
- `reference_name`：引用名称
- `reference_source`：引用来源或 URL
- `reference_comments`：引用说明
- `sort_order`：排序

### `exp_reference_video`
- `seq_id`：主键
- `video_url`：视频 URL
- `exp_id`：试验 ID
- `sort_order`：排序
- `file_id`：素材 ID

### `exp_scientist`
- `seq_id`：主键
- `exp_id`：试验 ID
- `scientist_name`：科学家名称
- `story_name`：故事名称
- `story_comments`：故事内容
- `sort_order`：排序

### `exp_simulation_record`
- `seq_id`：主键
- `exp_id`：试验 ID
- `user_id`：发起人
- `begin_time`：开始时间
- `end_time`：结束时间
- `score`：评分

### 外键说明
- `exp_library.subject_id` → `data_school_subject.subject_id`
- `exp_library.school_level_id` → `data_school_level.level_id`
- `exp_library_grade.lib_exp_id` → `exp_library.lib_exp_id`
- `exp_library_grade.grade_id` → `data_school_grade.grade_id`
- `exp_library_video.exp_id` → `exp_library.lib_exp_id`
- `exp_msg.subject_id` → `data_school_subject.subject_id`
- `exp_msg.school_level_id` → `data_school_level.level_id`
- `exp_msg.difficulty_id` → `data_exp_difficulty.difficulty_id`
- `exp_msg.coursebook_id` → `data_coursebook.coursebook_id`
- `exp_msg.unit_id` → `data_coursebook_unit.unit_id`
- `exp_msg.standard_exp_id` → `exp_library.lib_exp_id`
- `exp_msg.create_user_id` → `sys_user.user_id`
- `exp_msg.confirm_user_id` → `sys_user.user_id`
- `exp_msg.class_id` → `sys_org.org_id`
- `exp_grade.lib_exp_id` → `exp_library.lib_exp_id`
- `exp_grade.grade_id` → `data_school_grade.grade_id`
- `exp_video.exp_id` → `exp_msg.exp_id`
- `exp_video.file_id` → `data_file.file_id`
- `exp_pic.exp_id` → `exp_msg.exp_id`
- `exp_pic.file_id` → `data_file.file_id`
- `exp_material.exp_id` → `exp_msg.exp_id`
- `exp_material.material_prop_id` → `data_material_prop.prop_id`
- `exp_material.material_type_id` → `data_material_type.type_id`
- `exp_material_pic.exp_material_id` → `exp_material.exp_material_id`
- `exp_material_pic.material_id` → `material_msg.material_id`
- `exp_material_security.exp_material_id` → `exp_material.exp_material_id`
- `exp_material_security.material_id` → `material_msg.material_id`
- `exp_material_security.security_id` → `data_material_security.security_id`
- `exp_step.exp_id` → `exp_msg.exp_id`
- `exp_result.exp_id` → `exp_msg.exp_id`
- `exp_security.exp_id` → `exp_msg.exp_id`
- `exp_security.security_id` → `data_material_security.security_id`
- `exp_reference.exp_id` → `exp_msg.exp_id`
- `exp_reference_video.exp_id` → `exp_msg.exp_id`
- `exp_reference_video.file_id` → `data_file.file_id`
- `exp_scientist.exp_id` → `exp_msg.exp_id`
- `exp_simulation_record.exp_id` → `exp_msg.exp_id`
- `exp_simulation_record.user_id` → `sys_user.user_id`

## 7.5 作业与仲裁字段说明
### `exp_homework`
- `work_id`：作业主键
- `exp_id`：试验 ID
- `teacher_user_id`：教师 ID
- `class_id`：班级 ID
- `require_date`：要求完成日期

### `exp_homework_student`
- `seq_id`：主键
- `work_id`：试验任务 ID
- `exp_id`：试验 ID
- `teacher_user_id`：教师 ID
- `teacher_exp_id`：教师的试验 ID
- `require_date`：要求完成日期
- `submit_date`：提交日期
- `mark_user_id`：批改人
- `mark_time`：批改时间
- `mark_result`：批改结果评分
- `mark_comments`：批改意见

### `exp_arbitration`
- `seq_id`：主键
- `exp_id`：试验 ID
- `initiator_id`：发起人
- `initiator_time`：发起时间
- `like_num`：点赞数量
- `notlike_num`：倒赞数量
- `judge_user_id`：评判老师
- `judge_time`：评判时间
- `initiator_status`：仲裁状态

### `exp_arbitration_like`
- `seq_id`：主键
- `exp_id`：试验 ID
- `user_id`：用户 ID
- `comments`：理由
- `create_time`：时间

### `exp_arbitration_notlike`
- `seq_id`：主键
- `exp_id`：试验 ID
- `user_id`：用户 ID
- `comments`：理由
- `create_time`：时间

### 外键说明
- `exp_homework.exp_id` → `exp_msg.exp_id`
- `exp_homework.teacher_user_id` → `sys_user.user_id`
- `exp_homework.class_id` → `sys_org.org_id`
- `exp_homework_student.work_id` → `exp_homework.work_id`
- `exp_homework_student.exp_id` → `exp_msg.exp_id`
- `exp_homework_student.teacher_user_id` → `sys_user.user_id`
- `exp_homework_student.teacher_exp_id` → `exp_msg.exp_id`
- `exp_homework_student.mark_user_id` → `sys_user.user_id`
- `exp_arbitration.exp_id` → `exp_msg.exp_id`
- `exp_arbitration.initiator_id` → `sys_user.user_id`
- `exp_arbitration.judge_user_id` → `sys_user.user_id`
- `exp_arbitration_like.exp_id` → `exp_msg.exp_id`
- `exp_arbitration_like.user_id` → `sys_user.user_id`
- `exp_arbitration_notlike.exp_id` → `exp_msg.exp_id`
- `exp_arbitration_notlike.user_id` → `sys_user.user_id`

## 7.6 社交互动字段说明
### `social_like`
- `seq_id`
- `exp_id`
- `user_id`
- `create_time`

### `social_notlike`
- `seq_id`
- `exp_id`
- `user_id`
- `create_time`

### `social_collection`
- `seq_id`
- `exp_id`
- `user_id`
- `create_time`

### `social_evaluate`
- `seq_id`
- `exp_id`
- `user_id`
- `evaluate_content`
- `evaluate_url`
- `create_time`

### 外键说明
- `exp_id` → `exp_msg.exp_id`
- `user_id` → `sys_user.user_id`

## 7.7 题库与答题字段说明
### `exp_question`
- `question_id`：题目主键
- `question_content`：题干内容
- `teacher_user_id`：教师或出题关联字段
- `class_id`：班级 / 年级关联字段
- `difficulty_type_id`：难度类型
- `question_type_id`：题型
- `question_capacity_id`：能力侧重点
- `unit_id`：教材节
- `knowledge_id`：知识点 ID
- `knowledge_content`：知识点内容
- `choose_type`：单选 / 多选
- `create_user_id`：出题人
- `status`：状态

### `exp_question_select`
- `select_id`：选项主键
- `question_id`：题目 ID
- `select_content`：选项内容
- `sort_order`：排序
- `is_right`：是否正确答案

### `exp_question_answer`
- `answer_id`：答题记录主键
- `question_id`：题目 ID
- `user_id`：答题人
- `create_time`：答题时间
- `question_result`：答题结果

### `exp_question_answer_select`
- `seq_id`：主键
- `answer_id`：答题记录 ID
- `question_id`：题目 ID
- `select_id`：对应选项

### 外键说明
- `exp_question.difficulty_type_id` → `data_difficulty_type.type_id`
- `exp_question.question_type_id` → `data_question_type.type_id`
- `exp_question.question_capacity_id` → `data_question_capacity.capacity_id`
- `exp_question.unit_id` → `data_coursebook_unit.unit_id`
- `exp_question.create_user_id` → `sys_user.user_id`
- `exp_question.teacher_user_id` → `sys_user.user_id`
- `exp_question.class_id` → `sys_org.org_id`
- `exp_question_select.question_id` → `exp_question.question_id`
- `exp_question_answer.question_id` → `exp_question.question_id`
- `exp_question_answer.user_id` → `sys_user.user_id`
- `exp_question_answer_select.answer_id` → `exp_question_answer.answer_id`
- `exp_question_answer_select.question_id` → `exp_question.question_id`
- `exp_question_answer_select.select_id` → `exp_question_select.select_id`

## 7.8 积分激励字段说明
### `scale_log`
- `seq_id`
- `user_id`
- `scale_source`
- `scale_num`
- `create_time`

### `scale_title`
- `seq_id`
- `role_id`
- `title_name`
- `icon`
- `score_num`

### 外键说明
- `scale_log.user_id` → `sys_user.user_id`
- `scale_title.role_id` → `data_role.role_id`

---

# 8. 需要架构师重点审核的内容

1. `exp_question.teacher_user_id` 的真实语义
2. `exp_question.class_id` 的真实语义
3. `exp_question_select.question_id` 必须补齐
4. `sys_user` 是否作为统一人员主表
5. `data_file` 与 `material_msg` 的职责边界
6. `exp_library` 与 `exp_msg` 的模板 / 实例边界
7. `social_*` 与 `exp_arbitration_*` 的边界区分
8. `exp_task_type`、`choose_type`、`initiator_status`、`question_result` 等枚举值冻结

---

# 9. 开发前审核建议结论

当前数据库设计已经覆盖项目核心业务闭环，包括基础字典、组织人员、素材资源、实验库与实验实例、作业与仲裁、社交互动、题库测评、积分激励等模块。

建议在正式进入开发前，先冻结以下内容：

1. 全库命名规范
2. 字段拼写规范
3. 枚举值规范
4. 模块边界规范
5. 外键关系规范
6. `exp_question_select.question_id` 补齐确认
7. `sys_user` / `sys_org` 是否作为全局主数据确认

如审核无异议，即可进入最终 SQL 定稿与开发实施阶段。

---

# 10. 提交摘要

当前数据库设计已覆盖项目核心业务闭环。为保证后续开发稳定性，建议先冻结命名规范、枚举规范、模块边界与外键关系，并重点确认题库选项结构、人员主数据与组织主数据边界，以及 `data_file` 与 `material_msg` 的职责分工。审核通过后，即可进入最终 SQL 定稿与开发阶段。
