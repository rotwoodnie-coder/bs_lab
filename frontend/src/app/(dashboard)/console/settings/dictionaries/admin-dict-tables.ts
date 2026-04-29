/**
 * 字典表白名单与分组。
 * 分组按业务用途划分，不按「管理/业务」技术维度：
 *   A. 教学基础数据 — 学段/年级/学科/教材体系
 *   B. 实验与材料配置 — 材料/难度/文件类型
 *   C. 题库与评测配置 — 题型/难度/能力
 *   D. 系统级字典（只读） — 组织类型/角色/评分等级（初始化种子，不可修改）
 *   E. 激励与规则 — 积分等级/职称
 *   （材料安全性已归入安全管理入口，不在字典页编辑）
 */

export type AdminDictTableOption = {
  readonly table: string;
  readonly title: string;
  /** 为 false 时控制台隐藏新建与行内编辑/删除。 */
  readonly allowMutation?: boolean;
  /** 为 true 时仅允许查看。 */
  readonly readOnly?: boolean;
};

/**
 * A. 教学基础数据 — 区管/超管维护
 */
export const TEACHING_BASIC_OPTIONS: readonly AdminDictTableOption[] = [
  { table: "data_school_level", title: "学段" },
  { table: "data_school_grade", title: "年级" },
  { table: "data_school_subject", title: "学科" },
] as const;

/**
 * B. 实验与材料配置 — 区管/校管/超管维护
 */
export const MATERIAL_CONFIG_OPTIONS: readonly AdminDictTableOption[] = [
  { table: "data_material_type", title: "材料分类" },
  { table: "data_material_prop", title: "材料属性" },
  { table: "data_material_security", title: "材料安全性" },
  { table: "data_exp_difficulty", title: "实验难度" },
  { table: "data_file_type", title: "文件类型" },
  { table: "data_material_unit", title: "材料计量单位" },
] as const;

/**
 * C. 题库与评测配置 — 区管/超管维护
 */
export const ASSESSMENT_CONFIG_OPTIONS: readonly AdminDictTableOption[] = [
  { table: "data_difficulty_type", title: "难度类型" },
  { table: "data_question_type", title: "题型" },
  { table: "data_question_capacity", title: "能力侧重点" },
] as const;

/**
 * D. 系统级字典（初始化种子，不可改）— 仅超管查看
 */
export const SYSTEM_DICT_OPTIONS: readonly AdminDictTableOption[] = [
  { table: "data_org_type", title: "组织类型", allowMutation: false },
  { table: "data_msg_type", title: "消息分类", allowMutation: false },
  { table: "data_role", title: "用户角色", allowMutation: false, readOnly: true },
  { table: "data_rating_scale", title: "评分等级", allowMutation: false, readOnly: true },
] as const;

/**
 * E. 激励与规则 — 区管/超管维护
 */
export const INCENTIVE_CONFIG_OPTIONS: readonly AdminDictTableOption[] = [
  { table: "scale_title", title: "积分等级规则" },
  { table: "data_pref_title", title: "职称表" },
] as const;

/** 向后兼容：汇总所有字典表 */
export const ADMIN_DICT_TABLE_OPTIONS: readonly AdminDictTableOption[] = [
  ...TEACHING_BASIC_OPTIONS,
  ...MATERIAL_CONFIG_OPTIONS,
  ...ASSESSMENT_CONFIG_OPTIONS,
  ...SYSTEM_DICT_OPTIONS,
  ...INCENTIVE_CONFIG_OPTIONS,
];
