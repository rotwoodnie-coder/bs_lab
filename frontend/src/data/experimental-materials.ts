/** 实验材料库：前端用单材料主档模型 */

export const EXPERIMENTAL_MATERIALS_STORAGE_KEY = "bs-lab-experimental-materials-v2";
const EXPERIMENTAL_MATERIALS_LEGACY_STORAGE_KEY = "bs-lab-experimental-materials-v1";

/** 与维表 `edu_experimental_material_types.code` 对齐，可扩展 */
export type ExperimentalMaterialType = string;
/** 与维表 `edu_experimental_material_categories.code` 对齐，可扩展 */
export type ExperimentalMaterialCategory = string;
/** 与维表 `edu_experimental_material_safety_tags.code` 对齐，可扩展 */
export type ExperimentalMaterialSafetyTag = string;

/** 列表接口与维表聚合后的安全风险档位 */
export type ExperimentalMaterialRiskLevel = "none" | "low" | "medium" | "high";

export type ExperimentalMaterialRecord = {
  id: string;
  name: string;
  photoUrl: string;
  materialType: ExperimentalMaterialType;
  categories: ExperimentalMaterialCategory[];
  usage: string;
  numValue?: string;
  unitId?: string;
  suggestedAmount: string;
  homeAlternative: string;
  safetyTags: ExperimentalMaterialSafetyTag[];
  safetyNote: string;
  remark: string;
  /** 后端冗余：逗号分隔分类 code 或短文本，用于展示兜底 */
  categoryNameProxy?: string;
  /** 后端冗余：逗号分隔安全标签 code */
  safetyTagsProxy?: string;
  /** 主档封面登记 ID（与 edu_experimental_materials.cover_registry_id 对齐） */
  coverRegistryId?: string | null;
  /** 主档状态 */
  status?: "ACTIVE" | "ARCHIVED";
  /** 乐观锁版本号 */
  version?: number;
  /** 列表接口聚合的安全风险档位（与维表一致） */
  riskLevel?: ExperimentalMaterialRiskLevel;
  /** 当前用户是否已收藏（列表接口） */
  favorited?: boolean;
  /** 展示用：优先显示创建人名称（来自业务字段 displayOwnerName） */
  displayOwnerName?: string;
  createdByActorId: string;
  createdAt: string;
  updatedByActorId: string;
  updatedAt: string;
};

/** 离线/接口失败时的筛选项兜底，真源以 `GET /v1/experimental-materials/dimensions` 为准 */
export const EXPERIMENTAL_MATERIAL_TYPE_OPTIONS: { id: string; label: string }[] = [
  { id: "lab_only", label: "实验室专用" },
  { id: "home_common", label: "家庭常用" },
  { id: "general", label: "通用" },
];

export const EXPERIMENTAL_MATERIAL_CATEGORY_OPTIONS: { id: string; label: string }[] = [
  { id: "physics", label: "物理" },
  { id: "chemistry", label: "化学" },
  { id: "biology", label: "生物" },
  { id: "general_tool", label: "通用工具" },
  { id: "daily_supply", label: "日常耗材" },
];

export const EXPERIMENTAL_MATERIAL_SAFETY_TAG_OPTIONS: { id: string; label: string }[] = [
  { id: "adult_supervision", label: "需成人监护" },
  { id: "fire_prevention", label: "防火" },
  { id: "heat_protection", label: "防烫" },
  { id: "cut_protection", label: "防割伤" },
  { id: "stab_protection", label: "防扎手" },
  { id: "avoid_ingestion", label: "避免入口" },
  { id: "avoid_skin_contact", label: "避免接触皮肤" },
];

/** 计量单位本地兜底，真源以 `data_material_unit` 字典表为准 */
export const EXPERIMENTAL_MATERIAL_UNIT_OPTIONS: { id: string; label: string }[] = [
  { id: "mL", label: "毫升" },
  { id: "L", label: "升" },
  { id: "g", label: "克" },
  { id: "kg", label: "千克" },
  { id: "mg", label: "毫克" },
  { id: "cm", label: "厘米" },
  { id: "m", label: "米" },
  { id: "mm", label: "毫米" },
  { id: "个", label: "个" },
  { id: "根", label: "根" },
  { id: "支", label: "支" },
  { id: "片", label: "片" },
  { id: "粒", label: "粒" },
  { id: "条", label: "条" },
  { id: "块", label: "块" },
  { id: "段", label: "段" },
  { id: "滴", label: "滴" },
  { id: "杯", label: "杯" },
  { id: "勺", label: "勺" },
  { id: "份", label: "份" },
  { id: "瓶", label: "瓶" },
];

export function experimentalMaterialSummary(record: ExperimentalMaterialRecord): string {
  return record.name.trim() || "未命名材料";
}

export function getExperimentalMaterialTypeLabel(
  type: string,
  dimensionTypes?: readonly { code: string; displayName: string }[],
): string {
  const fromDim = dimensionTypes?.find((t) => t.code === type)?.displayName;
  if (fromDim) return fromDim;
  return EXPERIMENTAL_MATERIAL_TYPE_OPTIONS.find((item) => item.id === type)?.label ?? type;
}

export function getExperimentalMaterialCategoryLabels(
  categories: readonly string[],
  dimensionCategories?: readonly { code: string; displayName: string }[],
): string[] {
  return categories.map((category) => {
    const fromDim = dimensionCategories?.find((d) => d.code === category)?.displayName;
    if (fromDim) return fromDim;
    return EXPERIMENTAL_MATERIAL_CATEGORY_OPTIONS.find((item) => item.id === category)?.label ?? category;
  });
}

/** 分类展示：优先已解析 code；否则用 `categoryNameProxy` 逗号分隔文本 */
export function getExperimentalMaterialCategoryDisplayLabels(
  record: ExperimentalMaterialRecord,
  dimensionCategories?: readonly { code: string; displayName: string }[],
): string[] {
  if (record.categories.length > 0) return getExperimentalMaterialCategoryLabels(record.categories, dimensionCategories);
  const raw = record.categoryNameProxy?.trim();
  if (!raw) return [];
  return getExperimentalMaterialCategoryLabels(raw.split(",").map((s) => s.trim()).filter(Boolean), dimensionCategories);
}

export function getExperimentalMaterialSafetyLabels(
  tags: readonly string[],
  dimensionSafetyTags?: readonly { code: string; name: string }[],
): string[] {
  return tags.map((tag) => {
    const fromDim = dimensionSafetyTags?.find((d) => d.code === tag)?.name;
    if (fromDim) return fromDim;
    return EXPERIMENTAL_MATERIAL_SAFETY_TAG_OPTIONS.find((item) => item.id === tag)?.label ?? tag;
  });
}

/** 卡片/选择器警示色：以列表聚合 `riskLevel`（维表 MAX(risk_level)）为准，避免前端写死标签推断 */
export function getExperimentalMaterialSafetyLevel(
  record: ExperimentalMaterialRecord,
  dimensionSafetyTags?: readonly { code: string; riskLevel: ExperimentalMaterialRiskLevel }[],
): "normal" | "warning" | "danger" {
  const r = getExperimentalMaterialRiskLevel(record, dimensionSafetyTags);
  if (r === "high") return "danger";
  if (r === "medium" || r === "low") return "warning";
  return "normal";
}

const RISK_ORD: Record<ExperimentalMaterialRiskLevel, number> = {
  none: 1,
  low: 2,
  medium: 3,
  high: 4,
};

export function getExperimentalMaterialRiskLevel(
  record: ExperimentalMaterialRecord,
  dimensionSafetyTags?: readonly { code: string; riskLevel: ExperimentalMaterialRiskLevel }[],
): ExperimentalMaterialRiskLevel {
  if (record.riskLevel != null) return record.riskLevel;
  if (dimensionSafetyTags?.length && record.safetyTags.length > 0) {
    let max = 0;
    for (const code of record.safetyTags) {
      const rl = dimensionSafetyTags.find((d) => d.code === code)?.riskLevel;
      if (rl) max = Math.max(max, RISK_ORD[rl]);
    }
    if (max >= 4) return "high";
    if (max >= 3) return "medium";
    if (max >= 2) return "low";
    if (max >= 1) return "none";
  }
  const hasAnySafety = record.safetyTags.length > 0 || record.safetyNote.trim().length > 0;
  if (!hasAnySafety) return "none";
  return "medium";
}

export function getExperimentalMaterialRiskLabel(level: ExperimentalMaterialRiskLevel): string {
  switch (level) {
    case "none":
      return "无风险";
    case "low":
      return "低风险";
    case "medium":
      return "中风险";
    case "high":
      return "高风险";
    default:
      return level;
  }
}

export function getExperimentalMaterialRiskSummary(
  record: ExperimentalMaterialRecord,
  dimensionSafetyTags?: readonly { code: string; name: string; riskLevel: ExperimentalMaterialRiskLevel }[],
): string {
  const level = getExperimentalMaterialRiskLevel(
    record,
    dimensionSafetyTags?.map((d) => ({ code: d.code, riskLevel: d.riskLevel })),
  );
  if (level === "none") return "暂无安全提示";

  const labels = getExperimentalMaterialSafetyLabels(record.safetyTags, dimensionSafetyTags);
  const uniqueLabels = [...new Set(labels)].join("、");

  if (level === "high" && record.safetyTags.includes("adult_supervision")) {
    return uniqueLabels ? `${uniqueLabels}，禁止儿童单独使用` : "需成人监护，禁止儿童单独使用";
  }

  return uniqueLabels || (record.safetyNote.trim() ? "已填写安全补充说明" : "暂无安全提示");
}
