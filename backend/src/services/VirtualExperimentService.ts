/**
 * 虚拟实验业务服务
 *
 * 职责：
 * 1. 审核状态机保护（非法流转拦截）
 * 2. Owner 校验
 * 3. 角色校验
 * 4. CRUD 委托到 Repository 层
 */
import type {
  VirtualExperimentRecord,
  CreateVirtualExperimentInput,
  UpdateVirtualExperimentInput,
  VirtualExperimentListQuery,
  VirtualExperimentListPage,
} from "../domain/v2-virtual-experiment/v2-virtual-experiment-types.ts";
import * as repo from "../infrastructure/repositories/v2-virtual-experiment-repository.ts";
import { deleteObject } from "../infrastructure/storage/s3-storage.ts";

// ─── 自定义错误类 ────────────────────────────────────

export class VirtualExperimentServiceError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "VirtualExperimentServiceError";
    this.code = code;
  }
}

// ─── 状态机 ────────────────────────────────────────────

/**
 * 状态流转合法性矩阵：
 * 仅以下映射可被执行，其余为非法流转。
 */
const STATUS_TRANSITIONS: Record<string, Record<string, string>> = {
  draft:    { submit: "pending" },
  pending:  { approve: "published", reject: "rejected" },
  published: { archive: "archived" },
  rejected: { submit: "pending" },
  archived: {}, // 终态
};

function validateTransition(current: string, action: string, callerUserId: string, record: VirtualExperimentRecord): void {
  const allowed = STATUS_TRANSITIONS[current];
  if (!allowed || !allowed[action]) {
    throw new VirtualExperimentServiceError(
      "INVALID_STATUS_TRANSITION",
      `当前状态「${current}」不允许执行「${action}」操作`,
    );
  }
}

// ─── CRUD ──────────────────────────────────────────────

export function getVirtualExperimentById(id: string): Promise<VirtualExperimentRecord | null> {
  return repo.getActiveVirtualExperimentById(id);
}

export function listVirtualExperiments(query: VirtualExperimentListQuery): Promise<VirtualExperimentListPage> {
  return repo.listVirtualExperiments(query);
}

export async function createVirtualExperiment(
  input: CreateVirtualExperimentInput,
): Promise<VirtualExperimentRecord> {
  return repo.insertVirtualExperiment(input);
}

export async function updateVirtualExperiment(
  id: string,
  input: UpdateVirtualExperimentInput,
  currentUserId: string,
): Promise<VirtualExperimentRecord> {
  const existing = await repo.getActiveVirtualExperimentById(id);
  if (!existing) throw new VirtualExperimentServiceError("NOT_FOUND", "虚拟实验不存在");
  if (existing.createUserId !== currentUserId) {
    throw new VirtualExperimentServiceError("FORBIDDEN_OWNER", "仅可操作本人创建的实验");
  }

  // 记录旧文件 key，用于替换后清理 S3 孤儿
  const oldFileStorageKey = existing.fileStorageKey;

  const updated = await repo.updateVirtualExperiment(id, input, currentUserId);
  if (!updated) throw new VirtualExperimentServiceError("NOT_FOUND", "虚拟实验不存在");

  // 非关键路径：异步清理旧 S3 文件
  const newFileStorageKey = updated.fileStorageKey;
  if (oldFileStorageKey && newFileStorageKey && oldFileStorageKey !== newFileStorageKey) {
    deleteObject(oldFileStorageKey).catch((err) => {
      console.error("[VirtualExperimentService] cleanup old S3 file failed", {
        id,
        oldKey: oldFileStorageKey,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  return updated;
}

export async function deleteVirtualExperiment(
  id: string,
  currentUserId: string,
): Promise<void> {
  const existing = await repo.getActiveVirtualExperimentById(id);
  if (!existing) throw new VirtualExperimentServiceError("NOT_FOUND", "虚拟实验不存在");
  if (existing.createUserId !== currentUserId) {
    throw new VirtualExperimentServiceError("FORBIDDEN_OWNER", "仅可操作本人创建的实验");
  }
  await repo.softDeleteVirtualExperiment(id, currentUserId);
}

export async function updateSortOrder(
  id: string,
  sortOrder: number,
  currentUserId: string,
): Promise<void> {
  const existing = await repo.getActiveVirtualExperimentById(id);
  if (!existing) throw new VirtualExperimentServiceError("NOT_FOUND", "虚拟实验不存在");
  if (existing.createUserId !== currentUserId) {
    throw new VirtualExperimentServiceError("FORBIDDEN_OWNER", "仅可操作本人创建的实验");
  }
  await repo.updateVirtualExperiment(id, { sortOrder }, currentUserId);
}

// ─── 审核流 ────────────────────────────────────────────

/**
 * 提交审核（Owner → draft/rejected → pending）
 */
export async function submitForReview(
  id: string,
  currentUserId: string,
): Promise<void> {
  const existing = await repo.getActiveVirtualExperimentById(id);
  if (!existing) throw new VirtualExperimentServiceError("NOT_FOUND", "虚拟实验不存在");

  // Owner 校验
  if (existing.createUserId !== currentUserId) {
    throw new VirtualExperimentServiceError("FORBIDDEN_OWNER", "仅创建者可提交审核");
  }

  // 状态机校验
  validateTransition(existing.status, "submit", currentUserId, existing);

  await repo.submitForReview(id, currentUserId);
}

/**
 * 审核处理（Admin/Researcher → pending → published/rejected）
 */
export async function processReview(
  id: string,
  action: "approved" | "rejected",
  reviewerId: string,
  reviewComment: string | null,
): Promise<void> {
  const existing = await repo.getActiveVirtualExperimentById(id);
  if (!existing) throw new VirtualExperimentServiceError("NOT_FOUND", "虚拟实验不存在");

  // 状态机校验（approve / reject）
  const stateAction = action === "approved" ? "approve" : "reject";
  validateTransition(existing.status, stateAction, reviewerId, existing);

  const targetStatus = action === "approved" ? "published" as const : "rejected" as const;
  await repo.processReview(id, targetStatus, reviewerId, reviewComment);
}

/**
 * 归档已发布实验（Admin/Researcher → published → archived）
 */
export async function archiveVirtualExperiment(
  id: string,
  currentUserId: string,
): Promise<void> {
  const existing = await repo.getActiveVirtualExperimentById(id);
  if (!existing) throw new VirtualExperimentServiceError("NOT_FOUND", "虚拟实验不存在");

  // 状态机校验
  validateTransition(existing.status, "archive", currentUserId, existing);

  await repo.updateVirtualExperimentStatus(id, "archived", currentUserId);
}

// ─── 计数 ──────────────────────────────────────────────

export function incrementViewCount(id: string): Promise<void> {
  return repo.incrementViewCount(id);
}

export function incrementCallCount(id: string): Promise<void> {
  return repo.incrementCallCount(id);
}
