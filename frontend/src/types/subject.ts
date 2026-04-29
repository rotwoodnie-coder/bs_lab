/**
 * 学科架构（与学段脑图对齐）：小学科学；初高中物理/化学/生物。
 */
export type EducationPhase = "primary" | "junior" | "senior";

export type SubjectDiscipline = "science" | "physics" | "chemistry" | "biology";

/** 脑图节点：可嵌套形成学段 > 学科树 */
export interface SubjectNode {
  id: string;
  /** 展示名，如「科学」「物理」 */
  label: string;
  type: "phase" | "discipline";
  /** 学段（phase 节点可省略，由父级推导） */
  phase?: EducationPhase;
  /** 学科（叶子 discipline 节点必填） */
  discipline?: SubjectDiscipline;
  /** 适用年级编码与展示文案 */
  grades?: readonly { code: string; label: string }[];
  children?: SubjectNode[];
}
