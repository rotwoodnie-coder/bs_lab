"use client";

/**
 * 三方互动统一 Mock 仓（localStorage）：taskId / sessionId / workId 粘合。
 * 说明：本文件已按领域拆分为 `stores/` 下的多个模块，这里仅做 re-export 以保持历史导入路径稳定。
 */

export * from "./stores/unified-mock-store.types";
export * from "./stores/experiment-store";
export * from "./stores/user-store";
export * from "./stores/curriculum-store";

// 兼容历史导出（少量跨领域核心能力）
export { subscribeUnifiedMock, normalizeSession, normalizeWork } from "./stores/unified-mock-store.core";
