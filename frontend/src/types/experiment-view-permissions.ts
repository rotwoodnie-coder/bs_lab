/** 与 `GET /api/experiments/[id]/view-permissions` 对齐的能力声明（服务端为真源）。 */
export type ExperimentViewCapabilities = {
  showAuditBar: boolean;
  showSubmissionBar: boolean;
};
