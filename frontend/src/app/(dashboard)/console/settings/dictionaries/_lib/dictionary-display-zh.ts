/**
 * 字典页表格列头与单元格展示：将技术 id / 状态码等转为中文可读文案（与 bs_exp_data 字段语义对齐）。
 */

export type FkDisplayMaps = Record<string, Record<string, string>>;

const COMMON: Record<string, string> = {
  status: "状态",
  comments: "说明",
  sort_order: "排序",
};

/** 表 → 列 → 中文列头（未列出的列回退为通用规则） */
const TABLE_COLUMN_ZH: Record<string, Record<string, string>> = {
  data_msg_type: {
    type_id: "消息类型编码",
    type_name: "名称",
    ...COMMON,
  },
  data_school_level: {
    level_id: "学段编码",
    level_name: "学段名称",
    ...COMMON,
  },
  data_school_grade: {
    grade_id: "年级编码",
    grade_name: "年级名称",
    school_level_id: "所属学段",
    ...COMMON,
  },
  data_school_subject: {
    subject_id: "学科编码",
    subject_name: "学科名称",
    ...COMMON,
  },
  data_material_security: {
    security_id: "安全性编码",
    security_name: "安全性名称",
    security_level: "危险等级（数值）",
    ...COMMON,
  },
  data_material_type: {
    type_id: "分类编码",
    type_name: "分类名称",
    ...COMMON,
  },
  data_material_prop: {
    prop_id: "属性编码",
    prop_name: "属性名称",
    ...COMMON,
  },
  data_material_unit: {
    unit_id: "单位编码",
    unit_name: "计量单位名称",
    ...COMMON,
  },
  data_file_type: {
    type_id: "类型编码",
    type_name: "类型名称",
    logo_class: "图标样式",
    ...COMMON,
  },
  data_org_type: {
    type_id: "组织类型编码",
    type_name: "组织类型名称",
    ...COMMON,
  },
  data_role: {
    role_id: "角色编码",
    role_name: "角色名称",
    ...COMMON,
  },
  data_pref_title: {
    title_id: "职称编码",
    title_name: "职称名称",
    ...COMMON,
  },
  data_rating_scale: {
    scale_id: "评分档编码",
    scale_name: "评分名称",
    ...COMMON,
  },
  data_exp_difficulty: {
    difficulty_id: "难度编码",
    difficulty_name: "难度名称",
    ...COMMON,
  },
  data_difficulty_type: {
    type_id: "题库难度类型编码",
    type_name: "题库难度类型名称",
    ...COMMON,
  },
  data_question_type: {
    type_id: "题型编码",
    type_name: "题型名称",
    ...COMMON,
  },
  data_question_capacity: {
    capacity_id: "能力侧重点编码",
    capacity_name: "能力侧重点名称",
    ...COMMON,
  },
  scale_title: {
    role_id: "角色编码",
    title_name: "称号名称",
    icon: "图标",
    score_num: "达标积分下限",
  },
};

function fallbackColumnHeaderZh(columnName: string): string {
  const c = COMMON[columnName];
  if (c) return c;
  if (columnName.endsWith("_name")) return "名称";
  if (columnName.endsWith("_id")) return "编码";
  return columnName;
}

export function getDictColumnHeaderZh(tableName: string, columnName: string): string {
  const t = TABLE_COLUMN_ZH[tableName];
  if (t?.[columnName]) return t[columnName]!;
  return fallbackColumnHeaderZh(columnName);
}

/** 是否在「字典列配置」中显式声明（用于业务字典过滤未配置字段）。 */
export function hasExplicitDictColumn(tableName: string, columnName: string): boolean {
  const t = TABLE_COLUMN_ZH[tableName];
  return Boolean(t && Object.prototype.hasOwnProperty.call(t, columnName));
}

function formatStatusZh(v: unknown): string {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "y" || s === "t" || s === "1") return "启用";
  if (s === "n" || s === "0") return "停用";
  if (!s) return "—";
  return `状态（${String(v)}）`;
}

function pairedNameKey(idColumn: string): string | null {
  if (!idColumn.endsWith("_id")) return null;
  if (idColumn === "seq_id") return null;
  return `${idColumn.replace(/_id$/, "")}_name`;
}

function formatSecurityLevelZh(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (n <= 0) return `等级 ${n}（极高风险）`;
  if (n === 1) return `等级 ${n}（高风险）`;
  if (n === 2) return `等级 ${n}（中风险）`;
  return `等级 ${n}（相对较低）`;
}

export function formatDictCellDisplayZh(
  tableName: string,
  columnName: string,
  row: Record<string, unknown>,
  fkMaps: FkDisplayMaps,
): { text: string; title?: string } {
  const raw = row[columnName];
  if (raw === null || raw === undefined || raw === "") return { text: "—" };

  if (columnName === "status") {
    return { text: formatStatusZh(raw) };
  }

  if (tableName === "data_material_security" && columnName === "security_level") {
    return { text: formatSecurityLevelZh(raw), title: `原始值：${String(raw)}` };
  }

  const fk = fkMaps[columnName];
  if (fk) {
    const key = String(raw);
    const label = fk[key];
    if (label) return { text: label, title: `编码：${key}` };
    return { text: `未解析（${key}）`, title: `编码：${key}` };
  }

  const nk = pairedNameKey(columnName);
  if (nk && nk in row && row[nk] != null && String(row[nk]).trim() !== "") {
    const name = String(row[nk]).trim();
    const id = String(raw).trim();
    if (name === id) return { text: name };
    return { text: name, title: `系统编码：${id}` };
  }

  if (columnName.endsWith("_id")) {
    const s = String(raw);
    const short = s.length > 16 ? `${s.slice(0, 14)}…` : s;
    return { text: `主键编码 ${short}`, title: `完整编码：${s}` };
  }

  return { text: String(raw) };
}
