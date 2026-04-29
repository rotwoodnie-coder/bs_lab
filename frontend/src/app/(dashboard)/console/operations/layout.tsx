import type { ReactNode } from "react";

/**
 * 运维中心（operations）：通知、部署、审计、AI 策略等 L3 能力。
 * 与「配置管理」settings 权限模型区分，避免业务管理员误触迁移类操作。
 */
export default function ConsoleOperationsLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1">{children}</div>;
}
