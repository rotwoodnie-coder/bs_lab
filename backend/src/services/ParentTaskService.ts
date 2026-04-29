/**
 * V2 家长任务 Service
 * 查询家长所有已绑定孩子的作业任务
 */
import { fetchParentTasks } from "../infrastructure/repositories/v2-parent-task-repository.ts";
import type { ParentTaskItem } from "../domain/v2-parent/v2-parent-task-types.ts";

export async function listParentTasks(parentUserId: string): Promise<ParentTaskItem[]> {
  return fetchParentTasks(parentUserId);
}
