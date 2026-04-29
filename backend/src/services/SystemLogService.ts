import { getMysqlPool } from "../infrastructure/mysql/mysql-client.ts";

export type IssueReportInput = {
  errorType: string;
  currentUserId: string | null;
  targetOrgId: string | null;
  operationType: "delete" | "bind";
  detail?: string | null;
};

export class SystemLogService {
  static async reportIssue(input: IssueReportInput): Promise<void> {
    try {
      const pool = getMysqlPool();
      await pool.query(
        `INSERT INTO sys_log (log_id, log_type, user_id, log_time, log_data_type, log_data_id, log_data_content)
         VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
        [
          `issue_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
          input.errorType,
          input.currentUserId ?? "",
          input.operationType,
          input.targetOrgId ?? "",
          JSON.stringify({
            errorType: input.errorType,
            currentUserId: input.currentUserId,
            targetOrgId: input.targetOrgId,
            operationType: input.operationType,
            detail: input.detail ?? null,
          }),
        ],
      );
    } catch (err) {
      console.error(`[SystemLogService.reportIssue] 写入 sys_log 失败 (errorType=${input.errorType}, userId=${input.currentUserId})`, err);
    }
  }
}
