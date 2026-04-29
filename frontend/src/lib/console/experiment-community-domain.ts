/**
 * 科学小实验社区 · 中台与 C 端共用的领域约定（占位阶段注释真源）。
 *
 * ## 作品标识（ID 统一）
 * - **`work_id`**：业务层「作品」主键，面向产品/运营/师生话术（科学社区语感）。
 * - **`submission_id`**：技术层「一次提交记录」主键（重传、多版本时可 1:N 归属同一 work_id）。
 * - **前端交互与对家长展示**：统一对外使用 `work_id`；仅在开发调试或流水线内部使用 `submission_id`。
 *
 * ## 发布与法庭（后置发布）
 * 推荐状态机：**学生上传 → AI 预检 → [可选：进入实验小法庭众裁] → Resolved（通过）→ 自动 Publish → 进入 Feed**。
 * 保证 Feed 中视频均经过算法或「民意」过滤，维护社区科学严肃性。
 *
 * ## 申辩（Appeal）
 * - **C 端**：「我的作品」中若作品被下架，展示红点提示，点击进入申辩页提交材料。
 * - **中台**：`/console/social/court` 案件列表支持 `is_appealed`（或等价 query）过滤器，便于复核队列。
 */

export const EXPERIMENT_COMMUNITY_DOMAIN_VERSION = "0.1.0-skeleton" as const;
