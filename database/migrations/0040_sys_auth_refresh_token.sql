-- ----------------------------
-- Migration: 0040_sys_auth_refresh_token
-- Refresh Token 持久化存储表
-- 替代单机内存 Map，支持多实例部署
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_auth_refresh_token (
  sid VARCHAR(64) NOT NULL PRIMARY KEY,
  token_hash VARCHAR(128) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  role_code VARCHAR(64) NOT NULL DEFAULT '',
  org_id VARCHAR(64) NOT NULL DEFAULT '',
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expires_at (expires_at),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
