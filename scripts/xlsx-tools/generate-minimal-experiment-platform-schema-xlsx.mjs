/**
 * 中小学试验平台 · 以架构师 Excel 为基底的最小必须扩充版（仅文档）。
 * 输出：docs/中小学试验平台-数据结构-最小扩充版.xlsx
 * 运行：cd scripts/xlsx-tools && npm install && node generate-minimal-experiment-platform-schema-xlsx.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");
const outDir = join(repoRoot, "docs");
const outFile = join(outDir, "中小学试验平台-数据结构-最小扩充版.xlsx");

function block(titleZh, titleEn, rows) {
  const header = [`${titleZh}（${titleEn}）`, "", "", "", ""];
  const sub = ["字段名", "类型", "说明", "变更", "备注"];
  return [header, sub, ...rows, ["", "", "", "", ""]];
}

function joinBlocks(blocks) {
  const out = [];
  for (const b of blocks) {
    for (const row of b) out.push(row);
  }
  return out;
}

/** 基底表：仅列「最小必须」新增/调整项；未列出列视为与架构师第一版一致。 */
const sheetBase = joinBlocks([
  block("【说明】基础数据基底表", "sys_role 等", [
    ["—", "—", "以下字典表若未出现：仅当需要排序或与前端枚举映射时，增加对应列；否则保持原表不变。", "—", ""],
  ]),
  block("sys_role 用户角色（最小加列）", "sys_role", [
    ["app_role_code", "varchar(32)", "应用侧稳定编码（如 school_admin）", "新增", "与前端 roleIds 映射；可与 Role_* 并存"],
    ["sort_order", "int", "展示排序", "新增", "可选；不需要可不落库"],
  ]),
  block("warning_type 材料危险性（最小加列）", "warning_type", [
    ["app_hazard_code", "varchar(32)", "应用侧危险编码（如 no_taste）", "新增", "材料库 hazardIds 映射"],
  ]),
  block("sys_org 组织机构-树（最小加列）", "sys_org", [
    ["org_path", "varchar(512)", "组织路径缓存", "新增", "检索/展示；可程序维护"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("Sys_User 人员信息（最小加列）", "Sys_User", [
    ["nick_name", "varchar(60)", "昵称/显示名", "新增", ""],
    ["phone", "varchar(32)", "手机号", "新增", ""],
    ["email", "varchar(128)", "邮箱", "新增", ""],
    ["user_status", "varchar(32)", "账号状态（正常/冻结）", "新增", ""],
    ["valid_from", "date", "有效期起", "新增", "控制台用户"],
    ["valid_to", "date", "有效期止", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("sys_user_role 用户-多角色（新表·最小）", "sys_user_role", [
    ["seq_id", "varchar(32)", "主键id", "新增", ""],
    ["user_id", "varchar(32)", "用户id", "新增", "FK -> Sys_User.user_id"],
    ["role_id", "varchar(32)", "角色id", "新增", "FK -> sys_role.role_id"],
    ["is_primary", "tinyint", "是否主角色（1/0）", "新增", "与 Sys_User.user_role_id 一致"],
    ["status", "varchar(32)", "Status_Y/N", "新增", ""],
  ]),
  block("sys_user_account 登录账号（新表·最小·可选拆分）", "sys_user_account", [
    ["user_id", "varchar(32)", "用户id", "新增", "PK/FK -> Sys_User.user_id"],
    ["login_name", "varchar(64)", "登录名", "新增", "建议唯一"],
    ["password_hash", "varchar(255)", "密码摘要", "新增", "禁止明文"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
]);

const sheetExp = joinBlocks([
  block("【说明】试验相关基底表", "exp_library 等", [
    ["—", "—", "未列出列与架构师版一致；下列为「最小必须」加列或新表。", "—", ""],
  ]),
  block("exp_material 试验材料库（最小加列）", "exp_material", [
    ["unit", "varchar(32)", "默认计量单位", "新增", "与数量联动"],
    ["difficulty_level", "tinyint", "难度 1-5", "新增", "材料库页"],
    ["is_consumable", "tinyint", "是否耗材（1/0）", "新增", ""],
    ["disposal_guide", "varchar(500)", "处置提示", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("exp_material_pic / exp_library_pic / exp_library_vedio（最小加列）", "媒体行表", [
    ["storage_bucket", "varchar(64)", "对象存储桶", "新增", "MinIO/S3"],
    ["storage_key", "varchar(512)", "对象 key", "新增", ""],
    ["sort_order", "int", "排序", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", "按需"],
  ]),
  block("exp_material_pair 材料成对（新表·最小）", "exp_material_pair", [
    ["pair_id", "varchar(32)", "主键id", "新增", ""],
    ["pair_label", "varchar(200)", "成组备注", "新增", ""],
    ["lab_material_id", "varchar(32)", "实验室材料", "新增", "FK -> exp_material"],
    ["home_material_id", "varchar(32)", "家庭替用材料", "新增", "FK -> exp_material"],
    ["hazard_type_ids", "varchar(200)", "危险类型id列表", "新增", "JSON 或逗号分隔"],
    ["status", "varchar(32)", "Status_Y/N", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("exp_library 标准试验库（最小加列）", "exp_library", [
    ["phase", "varchar(20)", "学段", "新增", "课标/编排"],
    ["activity_type", "varchar(64)", "活动类型", "新增", ""],
    ["suggested_grade_range", "varchar(64)", "建议年级", "新增", ""],
    ["suggested_periods", "int", "建议课时", "新增", ""],
    ["publish_status", "varchar(32)", "draft/published", "新增", "与 Status_Y/N 可映射并存"],
    ["updated_by_user_id", "varchar(32)", "最后更新人", "新增", "FK -> Sys_User"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("exp_library_material（最小加列）", "exp_library_material", [
    ["pair_id", "varchar(32)", "材料成对id", "新增", "可空；FK -> exp_material_pair"],
  ]),
  block("curriculum_standard_row 课标条目（新表·最小）", "curriculum_standard_row", [
    ["row_id", "varchar(32)", "主键id", "新增", ""],
    ["subject_id", "varchar(32)", "学科id", "新增", "FK -> sys_subject"],
    ["phase", "varchar(20)", "学段", "新增", ""],
    ["level1_theme", "varchar(120)", "一级主题", "新增", ""],
    ["level2_theme", "varchar(120)", "二级主题", "新增", ""],
    ["requirements", "text", "课标要求", "新增", ""],
    ["basic_experiments", "text", "基本实验活动（JSON/多行）", "新增", ""],
    ["activity_type", "varchar(64)", "活动类型", "新增", ""],
    ["required_flag", "varchar(16)", "必做/选做", "新增", ""],
    ["suggested_grade_range", "varchar(64)", "建议年级", "新增", ""],
    ["suggested_periods", "int", "建议课时", "新增", ""],
    ["publish_status", "varchar(32)", "draft/published", "新增", ""],
    ["bind_exp_id", "varchar(32)", "关联 exp_library", "新增", "可空"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("standard_experiment_binding 课标行↔实验实例（新表·最小）", "standard_experiment_binding", [
    ["bind_id", "varchar(32)", "主键id", "新增", ""],
    ["org_id", "varchar(32)", "组织维度", "新增", "FK -> sys_org"],
    ["standard_row_id", "varchar(32)", "课标行id", "新增", "FK -> curriculum_standard_row"],
    ["experiment_id", "varchar(32)", "实验实例id", "新增", "与 exp_id 两套 id 时用绑定表衔接"],
    ["created_at", "datetime", "创建时间", "新增", ""],
  ]),
]);

const sheetStudent = joinBlocks([
  block("exp_task 试验任务（最小加列）", "exp_task", [
    ["requir_date_at", "date", "要求完成日期（标准类型）", "新增", "与 requir_date 字符串迁移对齐"],
    ["task_status", "varchar(32)", "任务状态", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("exp_task_student 学生试验任务（最小加列）", "exp_task_student", [
    ["submit_at", "datetime", "提交时间", "新增", "与 submit_date 对齐"],
    ["student_task_status", "varchar(32)", "学生任务状态", "新增", ""],
    ["work_id", "varchar(36)", "关联学生作品id", "新增", "可空；对接应用域 works"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
]);

/** Excel 原三页未覆盖、程序闭环必须的应用表（仅列最小字段集，与 database/schema.sql 对齐口径）。 */
const sheetApp = joinBlocks([
  block("works 学生作品（新表·最小）", "works", [
    ["id", "varchar(36)", "主键", "新增", ""],
    ["student_user_id", "varchar(32)", "学生", "新增", "FK -> Sys_User"],
    ["experiment_id", "varchar(32)", "实验实例", "新增", ""],
    ["status", "varchar(32)", "流程状态", "新增", "submitted/…/published"],
    ["video_url", "text", "视频", "新增", ""],
    ["description", "text", "说明", "新增", "可空"],
    ["submitted_at", "datetime", "提交时间", "新增", ""],
  ]),
  block("work_ai_prechecks AI 预审（新表·最小）", "work_ai_prechecks", [
    ["id", "varchar(36)", "主键", "新增", ""],
    ["work_id", "varchar(36)", "作品id", "新增", "FK -> works；1:1"],
    ["overall", "varchar(16)", "pass/review/reject", "新增", ""],
    ["dimensions", "json", "维度", "新增", ""],
    ["suggestions", "json", "建议", "新增", ""],
    ["provider", "varchar(64)", "提供方", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
  ]),
  block("work_reviews 人工审核（新表·最小）", "work_reviews", [
    ["id", "varchar(36)", "主键", "新增", ""],
    ["work_id", "varchar(36)", "作品id", "新增", "FK -> works"],
    ["reviewer_id", "varchar(32)", "审核人", "新增", "FK -> Sys_User"],
    ["decision", "varchar(16)", "approved/rejected", "新增", ""],
    ["reason", "text", "原因", "新增", "可空"],
    ["created_at", "datetime", "创建时间", "新增", ""],
  ]),
  block("parent_sessions / parent_reports（新表·最小）", "家长辅导", [
    ["parent_sessions.id", "varchar(36)", "主键", "新增", ""],
    ["parent_sessions.parent_user_id", "varchar(32)", "家长", "新增", ""],
    ["parent_sessions.student_user_id", "varchar(32)", "学生", "新增", ""],
    ["parent_sessions.experiment_id", "varchar(32)", "实验", "新增", ""],
    ["parent_sessions.work_id", "varchar(36)", "关联作品", "新增", "可空"],
    ["parent_reports.id", "varchar(36)", "主键", "新增", ""],
    ["parent_reports.session_id", "varchar(36)", "会话id", "新增", "1:1 session"],
    ["parent_reports.summary", "text", "摘要", "新增", ""],
    ["parent_reports.strengths", "json", "亮点", "新增", ""],
    ["parent_reports.improvements", "json", "改进", "新增", ""],
    ["parent_reports.next_recommendations", "json", "建议", "新增", ""],
  ]),
  block("teacher_assets 教师资源（新表·最小）", "teacher_assets", [
    ["id", "varchar(36)", "主键", "新增", ""],
    ["teacher_user_id", "varchar(32)", "教师", "新增", ""],
    ["experiment_id", "varchar(32)", "关联实验", "新增", "可空"],
    ["title", "varchar(200)", "标题", "新增", ""],
    ["category", "varchar(32)", "类别", "新增", "lesson_plan 等"],
    ["payload", "json", "内容包", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("audit_logs 审计（新表·最小）", "audit_logs", [
    ["id", "varchar(36)", "主键", "新增", ""],
    ["operator_id", "varchar(32)", "操作人", "新增", ""],
    ["entity_type", "varchar(64)", "实体类型", "新增", ""],
    ["entity_id", "varchar(36)", "实体id", "新增", ""],
    ["action", "varchar(64)", "动作", "新增", ""],
    ["before_payload", "json", "变更前", "新增", "可空"],
    ["after_payload", "json", "变更后", "可空", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
  ]),
]);

const sheetWorkflow = joinBlocks([
  block("workflow_event 工作流事件（新表·最小）", "workflow_event", [
    ["event_id", "varchar(32)", "主键id", "新增", ""],
    ["org_id", "varchar(32)", "组织", "新增", "FK -> sys_org"],
    ["type", "varchar(64)", "事件类型", "新增", ""],
    ["actor_id", "varchar(32)", "操作人", "新增", "FK -> Sys_User"],
    ["resource_type", "varchar(64)", "资源类型", "新增", ""],
    ["resource_id", "varchar(32)", "资源id", "新增", ""],
    ["payload_json", "json", "载荷", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
  ]),
]);

const sheetReadme = [
  ["中小学试验平台 · 数据结构（最小扩充版）", "", "", "", ""],
  ["范围", "", "", "", ""],
  ["1）以架构师 Excel（基础数据 / 试验相关 / 学生）为基底：未在本文件中逐条列出的字段 = 与第一版一致。", "", "", "", ""],
  ["2）本文件仅收录「最小必须」的新增列、新表；列含义见「变更」列（新增/—）。", "", "", "", ""],
  ["3）应用域表（作品/审核/家长/教师资源/审计）在架构师原三页中未出现，为程序闭环所必需，单独集中在工作表「05_应用域最小表」。", "", "", "", ""],
  ["", "", "", "", ""],
  ["工作表", "", "", "", ""],
  ["00_说明", "", "", "", ""],
  ["01_基础数据_最小增量", "", "", "", ""],
  ["02_试验相关_最小增量", "", "", "", ""],
  ["03_学生任务_最小增量", "", "", "", ""],
  ["04_工作流事件", "", "", "", ""],
  ["05_应用域最小表", "", "", "", ""],
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetReadme), "00_说明");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetBase), "01_基础数据_最小增量");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetExp), "02_试验相关_最小增量");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetStudent), "03_学生任务_最小增量");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetWorkflow), "04_工作流事件");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetApp), "05_应用域最小表");

await mkdir(outDir, { recursive: true });
const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
await writeFile(outFile, buf);

console.log(`Wrote: ${outFile}`);
