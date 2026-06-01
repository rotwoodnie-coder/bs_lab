/**
 * 虚拟实验 iframe 安全策略常量
 */

// 外部 URL 与 MinIO 托管模式均使用最小权限
export const PLAY_MODE_SANDBOX = "allow-scripts allow-same-origin allow-modals";
export const IFRAME_REFERRER_POLICY = "no-referrer" as const;
