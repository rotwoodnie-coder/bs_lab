/**
 * 生成「中小学试验平台」以老师 Excel 为基底的字段扩充版 .xlsx（仅文档，不落库）。
 * 运行：在 scripts/xlsx-tools 目录执行 npm install 后，node generate-expanded-experiment-platform-schema-xlsx.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");
const outDir = join(repoRoot, "docs");
const outFile = join(outDir, "中小学试验平台-数据结构-扩充版.xlsx");

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

const sheetBase = joinBlocks([
  block("sys_role 用户角色", "sys_role", [
    ["role_id", "varchar(32)", "主键id", "保留", ""],
    ["role_name", "varchar(60)", "名称", "保留", ""],
    ["comments", "varchar(100)", "说明", "保留", ""],
    ["status", "varchar(32)", "状态：Status_Y启用 Status_N停用", "保留", ""],
    ["sort_order", "int", "排序（列表展示）", "新增", "可选"],
    ["app_role_code", "varchar(32)", "应用侧稳定编码（如 school_admin）", "新增", "与前端 roleIds 映射；与 Role_* 并存"],
  ]),
  block("msg_type 消息分类", "msg_type", [
    ["type_id", "varchar(32)", "主键id", "保留", ""],
    ["type_name", "varchar(60)", "名称", "保留", ""],
    ["comments", "varchar(100)", "说明", "保留", ""],
    ["status", "varchar(32)", "状态：Status_Y启用 Status_N停用", "保留", ""],
    ["sort_order", "int", "排序", "新增", "可选"],
  ]),
  block("sys_subject 学科", "sys_subject", [
    ["subject_id", "varchar(32)", "主键id", "保留", ""],
    ["subject_name", "varchar(60)", "名称", "保留", ""],
    ["comments", "varchar(100)", "说明", "保留", ""],
    ["status", "varchar(32)", "状态：Status_Y启用 Status_N停用", "保留", ""],
    ["sort_order", "int", "排序", "新增", "可选"],
    ["phase_tags", "varchar(200)", "适用学段标签（如 小学,初中）", "新增", "可用逗号分隔；后续可拆关联表"],
  ]),
  block("warning_type 材料危险性", "warning_type", [
    ["type_id", "varchar(32)", "主键id", "保留", ""],
    ["type_name", "varchar(60)", "名称", "保留", ""],
    ["comments", "varchar(100)", "说明", "保留", ""],
    ["status", "varchar(32)", "状态：Status_Y启用 Status_N停用", "保留", ""],
    ["app_hazard_code", "varchar(32)", "应用侧危险编码（如 no_taste）", "新增", "与材料库前端枚举映射"],
  ]),
  block("org_type 组织类型", "org_type", [
    ["type_id", "varchar(32)", "主键id", "保留", ""],
    ["type_name", "varchar(60)", "名称", "保留", ""],
    ["comments", "varchar(100)", "说明", "保留", ""],
    ["status", "varchar(32)", "状态：Status_Y启用 Status_N停用", "保留", ""],
    ["sort_order", "int", "排序", "新增", "可选"],
  ]),
  block("grade_msg 年级信息", "grade_msg", [
    ["grade_id", "varchar(32)", "主键id", "保留", ""],
    ["grade_name", "varchar(60)", "名称", "保留", ""],
    ["comments", "varchar(100)", "说明", "保留", ""],
    ["status", "varchar(32)", "状态：Status_Y启用 Status_N停用", "保留", ""],
    ["sort_order", "int", "排序", "新增", "可选"],
    ["phase", "varchar(20)", "所属学段（小学/初中/高中）", "新增", "可选"],
  ]),
  block("sys_org 组织机构-树", "sys_org", [
    ["org_id", "varchar(32)", "主键id", "保留", ""],
    ["org_name", "varchar(60)", "组织名称", "保留", ""],
    ["org_type_id", "varchar(32)", "组织类型", "保留", "FK -> org_type.type_id"],
    ["grade_id", "varchar(32)", "年级信息（如果是年级类型）", "保留", "FK -> grade_msg.grade_id"],
    ["parent_org_id", "varchar(32)", "父级组织id", "保留", "FK -> sys_org.org_id"],
    ["status", "varchar(32)", "状态：Status_Y启用 Status_N停用", "保留", ""],
    ["org_path", "varchar(512)", "组织路径缓存（如 /区/校/年级/班）", "新增", "可程序维护，便于检索展示"],
    ["sort_order", "int", "同级排序", "新增", "可选"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("Sys_User 人员信息", "Sys_User", [
    ["user_id", "varchar(32)", "主键id", "保留", ""],
    ["user_name", "varchar(60)", "姓名", "保留", ""],
    ["user_org_id", "varchar(32)", "所属组织id", "保留", "FK -> sys_org.org_id"],
    ["user_role_id", "varchar(32)", "用户类型（基础数据-系统角色）", "保留", "FK -> sys_role.role_id；建议作为默认/主角色"],
    ["nick_name", "varchar(60)", "昵称/显示名", "新增", "可与 user_name 不同"],
    ["phone", "varchar(32)", "手机号", "新增", "注意脱敏与唯一性策略"],
    ["email", "varchar(128)", "邮箱", "新增", "注意唯一性策略"],
    ["user_status", "varchar(32)", "账号状态（正常/冻结）", "新增", "与字典统一或直接用中英文枚举"],
    ["valid_from", "date", "有效期起", "新增", "控制台用户管理对齐"],
    ["valid_to", "date", "有效期止", "新增", ""],
    ["last_active_at", "datetime", "最近活跃时间", "新增", "可选"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("sys_user_role 用户-角色（多角色）", "sys_user_role", [
    ["seq_id", "varchar(32)", "主键id", "新增", ""],
    ["user_id", "varchar(32)", "用户id", "新增", "FK -> Sys_User.user_id"],
    ["role_id", "varchar(32)", "角色id", "新增", "FK -> sys_role.role_id"],
    ["is_primary", "tinyint", "是否主角色（1/0）", "新增", "与 Sys_User.user_role_id 建议一致"],
    ["status", "varchar(32)", "状态：Status_Y启用 Status_N停用", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("sys_user_account 登录账号（可选拆分）", "sys_user_account", [
    ["user_id", "varchar(32)", "用户id", "新增", "PK/FK -> Sys_User.user_id"],
    ["login_name", "varchar(64)", "登录名", "新增", "建议唯一"],
    ["password_hash", "varchar(255)", "密码摘要", "新增", "禁止明文落库"],
    ["password_salt", "varchar(64)", "盐", "新增", "可选，视算法而定"],
    ["must_change_password", "tinyint", "首次登录改密（1/0）", "新增", "可选"],
    ["locked", "tinyint", "锁定（1/0）", "新增", "与 user_status 二选一亦可"],
    ["last_login_at", "datetime", "最近登录时间", "新增", "可选"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
]);

const sheetExp = joinBlocks([
  block("exp_material 试验材料库", "exp_material", [
    ["material_id", "varchar(32)", "主键id", "保留", ""],
    ["material_name", "varchar(60)", "名称", "保留", ""],
    ["material_type", "varchar(100)", "类别", "保留", ""],
    ["special_comments", "varchar(200)", "危险属性", "保留", "可与 warning_type 并存"],
    ["status", "varchar(32)", "状态：Status_Y启用 Status_N停用", "保留", ""],
    ["unit", "varchar(32)", "默认计量单位", "新增", "与 BOM 数量联动"],
    ["difficulty_level", "tinyint", "难度等级（1-5）", "新增", "与前端材料库一致"],
    ["is_consumable", "tinyint", "是否耗材（1/0）", "新增", ""],
    ["disposal_guide", "varchar(500)", "废弃/处置提示", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("exp_material_pic 试验材料图片", "exp_material_pic", [
    ["seq_id", "varchar(32)", "主键id", "保留", ""],
    ["exp_id", "varchar(32)", "实验库试验id", "保留", "FK -> exp_library.exp_id"],
    ["material_id", "varchar(60)", "材料id", "保留", "FK -> exp_material.material_id"],
    ["material_url", "varchar(500)", "图片URL", "调整", "建议改为可存对象存储 key；URL 可作为派生"],
    ["storage_bucket", "varchar(64)", "对象存储桶", "新增", "对接 MinIO/S3"],
    ["storage_key", "varchar(512)", "对象 key", "新增", ""],
    ["file_name", "varchar(255)", "原始文件名", "新增", "可选"],
    ["mime_type", "varchar(128)", "MIME", "新增", "可选"],
    ["sort_order", "int", "排序", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
  ]),
  block("exp_material_pair 材料成对（实验室↔家庭替用）", "exp_material_pair", [
    ["pair_id", "varchar(32)", "主键id", "新增", ""],
    ["pair_label", "varchar(200)", "成组备注/主题", "新增", "检索展示用"],
    ["lab_material_id", "varchar(32)", "实验室材料id", "新增", "FK -> exp_material.material_id"],
    ["home_material_id", "varchar(32)", "家庭替用材料id", "新增", "FK -> exp_material.material_id"],
    ["hazard_type_ids", "varchar(200)", "危险类型id列表", "新增", "逗号分隔或 JSON；FK -> warning_type"],
    ["status", "varchar(32)", "状态：Status_Y启用 Status_N停用", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("exp_library 标准试验库", "exp_library", [
    ["exp_id", "varchar(32)", "主键id", "保留", ""],
    ["exp_name", "varchar(100)", "名称", "保留", ""],
    ["choose_type", "varchar(32)", "必做选做（Choose/Must）", "保留", ""],
    ["theme_first", "varchar(60)", "一级主题", "保留", ""],
    ["theme_second", "varchar(60)", "二级主题", "保留", ""],
    ["standard_req", "varchar(500)", "课标要求", "调整", "建议放宽长度；大文本可改 text"],
    ["standard_content", "varchar(500)", "基本试验活动", "调整", "建议 text；或多行拆分"],
    ["subject_id", "varchar(32)", "学科id", "保留", "FK -> sys_subject.subject_id"],
    ["textbook_name", "varchar(60)", "教材名称", "保留", ""],
    ["textbook_version", "varchar(60)", "教材版本", "保留", ""],
    ["textbook_union", "varchar(60)", "教材单元", "保留", ""],
    ["exp_principle", "varchar(500)", "试验原理", "调整", "可 text"],
    ["exp_comments", "varchar(500)", "试验描述", "调整", "可 text"],
    ["status", "varchar(32)", "状态：Status_Y启用 Status_N停用", "保留", ""],
    ["phase", "varchar(20)", "学段（小学/初中/高中）", "新增", "课标页对齐"],
    ["activity_type", "varchar(64)", "活动类型", "新增", "课标页对齐"],
    ["suggested_grade_range", "varchar(64)", "建议年级（如 1~2年级）", "新增", ""],
    ["suggested_periods", "int", "建议课时", "新增", ""],
    ["effective_year", "int", "生效年份（课纲版本年）", "新增", "可选"],
    ["publish_status", "varchar(32)", "发布状态（draft/published）", "新增", "与 Status_Y/N 可映射并存"],
    ["updated_by_user_id", "varchar(32)", "最后更新人", "新增", "FK -> Sys_User.user_id"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("exp_library_grade 标准试验库适用年级", "exp_library_grade", [
    ["seq_id", "varchar(32)", "主键id", "保留", ""],
    ["exp_id", "varchar(32)", "实验库试验id", "保留", "FK -> exp_library.exp_id"],
    ["grade_id", "varchar(32)", "年级id", "保留", "FK -> grade_msg.grade_id"],
    ["created_at", "datetime", "创建时间", "新增", "可选"],
  ]),
  block("exp_library_material 标准试验所需材料", "exp_library_material", [
    ["seq_id", "varchar(32)", "主键id", "保留", ""],
    ["exp_id", "varchar(32)", "实验库试验id", "保留", "FK -> exp_library.exp_id"],
    ["material_id", "varchar(32)", "材料id", "保留", "FK -> exp_material.material_id"],
    ["material_num", "varchar(50)", "需要数量", "保留", "建议未来改为 decimal + unit_id"],
    ["pair_id", "varchar(32)", "材料成对id（可选）", "新增", "FK -> exp_material_pair.pair_id；不强制"],
    ["remark", "varchar(200)", "备注", "新增", "可选"],
  ]),
  block("exp_library_vedio 标准试验视频", "exp_library_vedio", [
    ["seq_id", "varchar(32)", "主键id", "保留", ""],
    ["exp_id", "varchar(32)", "实验库试验id", "保留", "FK -> exp_library.exp_id"],
    ["vedio_url", "varchar(500)", "视频URL", "调整", "字段名可后续统一为 video_url；兼容期保留"],
    ["storage_bucket", "varchar(64)", "对象存储桶", "新增", ""],
    ["storage_key", "varchar(512)", "对象 key", "新增", ""],
    ["duration_sec", "int", "时长（秒）", "新增", "可选"],
    ["sort_order", "int", "排序", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
  ]),
  block("exp_library_note 标准试验库注意事项", "exp_library_note", [
    ["note_id", "varchar(32)", "主键id", "保留", ""],
    ["note_type", "varchar(60)", "事项", "保留", ""],
    ["note_content", "varchar(500)", "内容", "调整", "可 text"],
    ["exp_id", "varchar(32)", "实验库试验id", "保留", "FK -> exp_library.exp_id"],
    ["sort_order", "int", "排序", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
  ]),
  block("exp_library_pic 标准试验图片", "exp_library_pic", [
    ["seq_id", "varchar(32)", "主键id", "保留", ""],
    ["exp_id", "varchar(32)", "实验库试验id", "保留", "FK -> exp_library.exp_id"],
    ["pic_url", "varchar(500)", "图片URL", "新增", "若原表已有同义字段可合并；此处为补齐命名"],
    ["storage_bucket", "varchar(64)", "对象存储桶", "新增", ""],
    ["storage_key", "varchar(512)", "对象 key", "新增", ""],
    ["sort_order", "int", "排序", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
  ]),
  block("curriculum_standard_row 课标条目（编排扩展，可与 exp 解耦）", "curriculum_standard_row", [
    ["row_id", "varchar(32)", "主键id", "新增", ""],
    ["subject_id", "varchar(32)", "学科id", "新增", "FK -> sys_subject.subject_id"],
    ["phase", "varchar(20)", "学段", "新增", ""],
    ["level1_theme", "varchar(120)", "一级主题", "新增", ""],
    ["level2_theme", "varchar(120)", "二级主题", "新增", ""],
    ["requirements", "text", "课标要求（长文本）", "新增", ""],
    ["basic_experiments", "text", "基本实验活动（可多行/JSON）", "新增", ""],
    ["applicable_grades", "varchar(200)", "适用年级列表", "新增", "JSON 或逗号分隔"],
    ["activity_type", "varchar(64)", "活动类型", "新增", ""],
    ["required_flag", "varchar(16)", "必做/选做", "新增", "与 choose_type 映射"],
    ["suggested_grade_range", "varchar(64)", "建议年级", "新增", ""],
    ["suggested_periods", "int", "建议课时", "新增", ""],
    ["effective_year", "int", "生效年份", "新增", ""],
    ["publish_status", "varchar(32)", "draft/published", "新增", ""],
    ["suggested_core_materials", "text", "建议核心材料", "新增", ""],
    ["difficulty_level", "varchar(32)", "难度系数（文本枚举）", "新增", "可选"],
    ["bind_exp_id", "varchar(32)", "关联标准试验库id", "新增", "可空；FK -> exp_library.exp_id"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("standard_experiment_binding 课标/标准实验与实验实例绑定", "standard_experiment_binding", [
    ["bind_id", "varchar(32)", "主键id", "新增", ""],
    ["org_id", "varchar(32)", "组织维度（区/校）", "新增", "FK -> sys_org.org_id；平台级可用固定根组织"],
    ["standard_row_id", "varchar(32)", "课标条目id", "新增", "FK -> curriculum_standard_row.row_id"],
    ["experiment_id", "varchar(32)", "实验实例id", "新增", "对接应用侧 experiments.id（或后续统一 exp_id）"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("standard_experiment_version 标准实验版本快照", "standard_experiment_version", [
    ["version_id", "varchar(32)", "主键id", "新增", ""],
    ["experiment_id", "varchar(32)", "实验实例id", "新增", ""],
    ["version_no", "int", "版本号", "新增", ""],
    ["snapshot_json", "json", "快照（目标/材料/步骤等）", "新增", ""],
    ["editor_user_id", "varchar(32)", "编辑人", "新增", "FK -> Sys_User.user_id"],
    ["edited_at", "datetime", "编辑时间", "新增", ""],
  ]),
  block("resource_audit_log 资源审计流水", "resource_audit_log", [
    ["audit_id", "varchar(32)", "主键id", "新增", ""],
    ["resource_type", "varchar(64)", "资源类型", "新增", "如 standard_experiment / curriculum_row"],
    ["resource_id", "varchar(32)", "资源id", "新增", ""],
    ["action", "varchar(32)", "动作", "新增", "create/update/delete/rollback"],
    ["actor_user_id", "varchar(32)", "操作人", "新增", "FK -> Sys_User.user_id"],
    ["changed_fields_json", "json", "变更字段", "新增", ""],
    ["reason", "varchar(500)", "原因", "新增", "可选"],
    ["created_at", "datetime", "创建时间", "新增", ""],
  ]),
]);

const sheetStudent = joinBlocks([
  block("exp_task 试验任务", "exp_task", [
    ["task_id", "varchar(32)", "主键id", "保留", ""],
    ["exp_id", "varchar(32)", "试验id", "保留", "FK -> exp_library.exp_id"],
    ["teacher_user_id", "varchar(32)", "教师id", "保留", "FK -> Sys_User.user_id"],
    ["class_id", "varchar(32)", "班级id", "保留", "FK -> sys_org.org_id（班级节点）"],
    ["requir_date", "varchar(20)", "要求完成日期", "保留", "过渡期保留字符串"],
    ["requir_date_at", "date", "要求完成日期（标准类型）", "新增", "与上一列迁移对齐"],
    ["task_title", "varchar(120)", "任务标题", "新增", "可选"],
    ["task_status", "varchar(32)", "任务状态", "新增", "如 draft/assigned/closed"],
    ["school_year", "varchar(16)", "学年（可选）", "新增", "如 2025-2026"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
  block("exp_task_student 学生试验任务", "exp_task_student", [
    ["seq_id", "varchar(32)", "主键id", "保留", ""],
    ["task_id", "varchar(32)", "试验任务id", "保留", "FK -> exp_task.task_id"],
    ["exp_id", "varchar(32)", "试验id", "保留", "FK -> exp_library.exp_id"],
    ["student_user_id", "varchar(32)", "学生id", "保留", "说明列应以学生为准；非教师id"],
    ["requir_date", "varchar(20)", "要求完成日期", "保留", ""],
    ["submit_date", "varchar(20)", "提交日期", "保留", ""],
    ["submit_at", "datetime", "提交时间（标准类型）", "新增", "与 submit_date 迁移对齐"],
    ["student_task_status", "varchar(32)", "学生任务状态", "新增", "未提交/已提交/逾期等"],
    ["work_id", "varchar(36)", "关联学生作品/提交物id", "新增", "可空；对接 works.id（应用侧）"],
    ["is_overdue", "tinyint", "是否逾期（1/0）", "新增", "可派生落库"],
    ["created_at", "datetime", "创建时间", "新增", ""],
    ["updated_at", "datetime", "更新时间", "新增", ""],
  ]),
]);

const sheetWorkflow = joinBlocks([
  block("workflow_event 工作流/操作事件（通用）", "workflow_event", [
    ["event_id", "varchar(32)", "主键id", "新增", ""],
    ["org_id", "varchar(32)", "组织维度", "新增", "FK -> sys_org.org_id"],
    ["type", "varchar(64)", "事件类型", "新增", ""],
    ["actor_id", "varchar(32)", "操作人id", "新增", "FK -> Sys_User.user_id"],
    ["actor_name", "varchar(64)", "操作人姓名（冗余展示）", "新增", "可选"],
    ["resource_type", "varchar(64)", "资源类型", "新增", ""],
    ["resource_id", "varchar(32)", "资源id", "新增", ""],
    ["payload_json", "json", "载荷", "新增", ""],
    ["created_at", "datetime", "创建时间", "新增", ""],
  ]),
]);

const sheetReadme = [
  ["中小学试验平台 · 数据结构（Excel 基底扩充版）", "", "", "", ""],
  ["生成说明", "", "", "", ""],
  ["1）本文件在老师提供的字段清单基础上做“增量扩充”，原字段默认标记为「保留」。", "", "", "", ""],
  ["2）「新增」为建议新增字段/新增表；「调整」为类型或语义建议优化（兼容期可并存）。", "", "", "", ""],
  ["3）未改动的原表若未逐行列出，可视为与第一版一致；本版已将关键表完整展开便于评审。", "", "", "", ""],
  ["4）实施落库前请再确认：主键策略（32 位串 vs UUID）、时间与状态字段统一规则、对象存储字段是否替代裸 URL。", "", "", "", ""],
  ["", "", "", "", ""],
  ["工作表索引", "", "", "", ""],
  ["00_扩充说明", "本页", "", "", ""],
  ["01_基础数据", "字典 / 组织 / 用户 / 多角色 / 账号", "", "", ""],
  ["02_试验相关", "试验库 / 媒体 / 材料成对 / 课标行 / 绑定 / 版本 / 审计", "", "", ""],
  ["03_学生任务", "任务与提交关联", "", "", ""],
  ["04_工作流事件", "通用事件流水", "", "", ""],
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetReadme), "00_扩充说明");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetBase), "01_基础数据");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetExp), "02_试验相关");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetStudent), "03_学生任务");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetWorkflow), "04_工作流事件");

await mkdir(outDir, { recursive: true });
const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
await writeFile(outFile, buf);

console.log(`Wrote: ${outFile}`);
