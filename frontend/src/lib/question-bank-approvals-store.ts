import type { QuestionBankApprovalMap, QuestionBankReviewStatus } from "@/types/question-bank";

const CHANGED = "bs-lab-question-bank-approvals-changed";

type StoredShape = {
  approvals: QuestionBankApprovalMap;
  rejectReasons: Record<string, string>;
};

function empty(): StoredShape {
  return { approvals: {}, rejectReasons: {} };
}

let inMemory: StoredShape = empty();

function readStored(): StoredShape {
  return inMemory;
}

function writeStored(next: StoredShape): void {
  inMemory = next;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGED));
}

export function readQuestionBankApprovalMap(): QuestionBankApprovalMap {
  return readStored().approvals;
}

export function readRejectReason(questionId: string): string | undefined {
  return readStored().rejectReasons[questionId];
}

export function setQuestionBankReview(
  questionId: string,
  status: Exclude<QuestionBankReviewStatus, "pending">,
  rejectReason?: string,
): void {
  const cur = readStored();
  const approvals = { ...cur.approvals, [questionId]: status };
  const rejectReasons = { ...cur.rejectReasons };
  if (status === "rejected" && rejectReason?.trim()) {
    rejectReasons[questionId] = rejectReason.trim();
  } else {
    delete rejectReasons[questionId];
  }
  writeStored({ approvals, rejectReasons });
}

export function subscribeQuestionBankApprovals(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = () => cb();
  window.addEventListener(CHANGED, fn);
  return () => {
    window.removeEventListener(CHANGED, fn);
  };
}

export function clearQuestionBankApprovals(): void {
  inMemory = empty();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGED));
}

/** 移除某题的审核覆盖，恢复为种子数据默认状态（：用于撤回入库 / 重新送审） */
export function unsetQuestionBankReview(questionId: string): void {
  const cur = readStored();
  const approvals = { ...cur.approvals };
  delete approvals[questionId];
  const rejectReasons = { ...cur.rejectReasons };
  delete rejectReasons[questionId];
  writeStored({ approvals, rejectReasons });
}
