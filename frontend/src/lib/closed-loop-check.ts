"use client";

/**
 * 闭环 A/B 冒烟自检：遍历统一仓作品，校验会话与任务引用；可选对照 experiment-mgmt。
 * 在开发环境挂载到 `window.__BS_LAB__.checkLoopA()` 便于控制台调用。
 */

import { readExperimentMgmtRows } from "@/lib/experiment-mgmt-mock-store";
import {
  isExperimentPublishedForAssignment,
  listUnifiedSessions,
  listUnifiedTasks,
  listUnifiedWorks,
} from "@/lib/unified-mock-store";

export type LoopCheckIssue = {
  level: "error" | "warn";
  message: string;
};

export type LoopACheckResult = {
  ok: boolean;
  workCount: number;
  errors: LoopCheckIssue[];
  warnings: LoopCheckIssue[];
  /** A2：已完成会话缺少家长背书时非空 */
  parentAttestationViolations: LoopCheckIssue[];
};

export type LoopP0CheckResult = {
  ok: boolean;
  errors: LoopCheckIssue[];
  warnings: LoopCheckIssue[];
};

/**
 * P0 闭环：任务引用的 experimentId 须「可下发」；已评价会话须有 teacher_feedback。
 */
export function checkLoopP0(): LoopP0CheckResult {
  const errors: LoopCheckIssue[] = [];
  const warnings: LoopCheckIssue[] = [];
  const tasks = listUnifiedTasks();
  for (const t of tasks) {
    if (t.status === "published" && !isExperimentPublishedForAssignment(t.experimentId)) {
      errors.push({
        level: "error",
        message: `任务 ${t.taskId}: experimentId ${t.experimentId} 未满足教研上架 / 区本准入`,
      });
    }
  }
  for (const s of listUnifiedSessions()) {
    if (s.evaluation_status === "evaluated" && !(s.teacher_feedback && s.teacher_feedback.trim())) {
      warnings.push({
        level: "warn",
        message: `session ${s.sessionId}: evaluation_status=evaluated 但 teacher_feedback 为空`,
      });
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

/**
 * A1：作品与会话绑定；taskId 若存在须在任务表；
 * A2：`completion_status` 为 `completed` / `parent_confirmed` 时会话须具备 `parent_attested_at`；
 * A4：预审字段由 submitWorkWithAudit / calculateWorkSuggestion 写入，此处不重复校验。
 *
 * experiment-mgmt 中无对应 id 时仅 **warn**（宝山种子实验 id 未必录入管理行）。
 */
export function checkLoopA(): LoopACheckResult {
  const works = listUnifiedWorks();
  const sessions = new Map(listUnifiedSessions().map((s) => [s.sessionId, s]));
  const taskMap = new Map(listUnifiedTasks().map((t) => [t.taskId, t]));
  const mgmtById = new Map(readExperimentMgmtRows().map((r) => [r.id, r]));

  const errors: LoopCheckIssue[] = [];
  const warnings: LoopCheckIssue[] = [];

  for (const w of works) {
    const sess = sessions.get(w.sessionId);
    if (!sess) {
      errors.push({
        level: "error",
        message: `work ${w.workId}: session ${w.sessionId} 不存在`,
      });
    } else if (sess.experimentId !== w.experimentId) {
      errors.push({
        level: "error",
        message: `work ${w.workId}: experimentId 与会话不一致（work=${w.experimentId} session=${sess.experimentId}）`,
      });
    }

    if (w.taskId) {
      const t = taskMap.get(w.taskId);
      if (!t) {
        errors.push({
          level: "error",
          message: `work ${w.workId}: taskId ${w.taskId} 在任务表中不存在`,
        });
      } else {
        if (t.experimentId !== w.experimentId) {
          errors.push({
            level: "error",
            message: `work ${w.workId}: 任务 experimentId ${t.experimentId} 与作品 ${w.experimentId} 不一致`,
          });
        }
        const row = mgmtById.get(t.experimentId);
        if (!row) {
          warnings.push({
            level: "warn",
            message: `work ${w.workId}: experimentId ${t.experimentId} 未在 experiment-mgmt 表中（种子常见）`,
          });
        } else if (!row.isStandard) {
          warnings.push({
            level: "warn",
            message: `work ${w.workId}: 关联实验 ${t.experimentId} 在管理行中 isStandard=false（非区本标准库条目）`,
          });
        }
      }
    } else {
      const row = mgmtById.get(w.experimentId);
      if (!row) {
        warnings.push({
          level: "warn",
          message: `work ${w.workId}: experimentId ${w.experimentId} 未在 experiment-mgmt 表中`,
        });
      }
    }
  }

  const parentAttestationViolations: LoopCheckIssue[] = [];
  for (const s of listUnifiedSessions()) {
    const done =
      s.completion_status === "completed" || s.completion_status === "parent_confirmed";
    if (done && !s.parent_attested_at) {
      parentAttestationViolations.push({
        level: "error",
        message: `session ${s.sessionId}: 已完成（${s.completion_status}）但缺少 parent_attested_at`,
      });
    }
  }
  for (const v of parentAttestationViolations) {
    errors.push(v);
  }
  if (parentAttestationViolations.length > 0) {
    console.warn("闭环 A 未完成：家长背书缺失");
  }

  return {
    ok: errors.length === 0,
    workCount: works.length,
    errors,
    warnings,
    parentAttestationViolations,
  };
}
