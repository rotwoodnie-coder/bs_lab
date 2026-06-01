-- 迁移脚本：0012_add_agent_type_to_chat_session.sql
-- 用途：在 ai_chat_session 表中新增 agent_type 字段，用于区分智能体类型
-- 对应 agents-service 多角色路由需求

ALTER TABLE ai_chat_session
  ADD COLUMN agent_type enum('student','teacher','researcher','parent') NOT NULL DEFAULT 'student'
    COMMENT '智能体类型：student=学生端石头老师, teacher=教师助手, researcher=教研助手, parent=家长助手'
    AFTER user_role;
