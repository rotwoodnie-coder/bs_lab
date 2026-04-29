/**
 * 标准实验目录：默认 UI 不展示「纯内部」字段；控制台开启「开发者视图」后完整展示。
 * 业务编码（standard_code）默认不向用户展示，仅在开发者视图下可查看与复制。
 */

/** Core 详情：非技术模式下不占行的逻辑键 */
export const CORE_GUT_KEYS = new Set([
  "primaryKey",
  "standardCode",
  "nameFingerprint",
  "fingerprintVersion",
  "tenantApp",
]);

/** 映射边：非技术模式下不占行的逻辑键（边记录主键仍可通过复制按钮排障） */
export const EDGE_GUT_KEYS = new Set([
  "edgeRecordId",
  "tenantApp",
  "standardExperimentId",
  "idempotencyKey",
  "sourceActorId",
  "sourceType",
  "evidenceCount",
  "supportTeacherCount",
  "weightScore",
  "sortOrder",
  "edgeCreatedAt",
  "edgeUpdatedAt",
  "reviewedBy",
  "reviewedAt",
]);

export function showCoreGutField(key: string, technicalMode: boolean): boolean {
  return technicalMode || !CORE_GUT_KEYS.has(key);
}

export function showEdgeGutField(key: string, technicalMode: boolean): boolean {
  return technicalMode || !EDGE_GUT_KEYS.has(key);
}
