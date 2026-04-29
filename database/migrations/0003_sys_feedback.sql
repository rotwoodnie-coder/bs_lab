-- ----------------------------
-- Table structure for sys_feedback
-- 用户反馈与修复闭环
-- ----------------------------
DROP TABLE IF EXISTS `sys_feedback`;
CREATE TABLE `sys_feedback` (
  `feedback_id`    VARCHAR(32)   NOT NULL COMMENT '主键',
  `type`           VARCHAR(16)   NOT NULL COMMENT 'BUG / FEATURE / OPTIMIZE / INQUIRY',
  `title`          VARCHAR(200)  NOT NULL COMMENT '简述标题',
  `content`        MEDIUMTEXT    NULL     COMMENT '富文本 HTML 内容',
  `status`         VARCHAR(16)   NOT NULL DEFAULT 'TODO' COMMENT 'TODO / DOING / DONE / REJECT',
  `reporter`       JSON          NULL     COMMENT '提报人信息：{userId, name, role, orgId, orgName}',
  `env`            JSON          NULL     COMMENT '环境信息：{url, ua, browser, resolution}',
  `reply`          MEDIUMTEXT    NULL     COMMENT '修复说明 HTML',
  `replier_id`     VARCHAR(32)   NULL     COMMENT '运维回复人 user_id',
  `reply_time`     DATETIME      NULL     COMMENT '回复时间',
  `create_user_id` VARCHAR(32)   NULL,
  `create_time`    DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP,
  `update_user_id` VARCHAR(32)   NULL,
  `update_time`    DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`     TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (`feedback_id`),
  KEY `idx_feedback_type` (`type`),
  KEY `idx_feedback_status` (`status`),
  KEY `idx_feedback_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈表';
