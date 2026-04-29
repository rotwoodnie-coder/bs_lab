export type OrgKind =
  | "district"
  | "office"
  | "personnel"
  | "school"
  | "campus"
  | "teachers"
  | "grade"
  | "class"
  | "students"
  | "management"
  | "admins";

export type OrgTreeNode = {
  id: string;
  name: string;
  kind: OrgKind;
  description?: string;
  children?: OrgTreeNode[];
};

export const ORG_EXPORT_SCHEMA = "bs-lab.console.organizations.export.v1";
export const ORG_IMPORT_SCHEMA = "bs-lab.console.organizations.import.v1";

export const ORG_TREE: OrgTreeNode = {
  id: "root",
  name: "组织结构",
  kind: "district",
  description: "区教育学院与下属学校的行政与教学组织关系（示意数据）。",
  children: [
    {
      id: "inst-bs",
      name: "宝山区教育学院",
      kind: "district",
      description: "区级教研与行政管理中枢。",
      children: [
        {
          id: "office-tro",
          name: "教研室",
          kind: "office",
          description: "学科教研与业务指导。",
          children: [
            {
              id: "staff-tro",
              name: "教研员",
              kind: "personnel",
              description: "各学科教研员编制与分工。",
            },
          ],
        },
        {
          id: "office-principal",
          name: "校长室",
          kind: "office",
          description: "区级校级协同与政策传达。",
          children: [
            {
              id: "adm-district",
              name: "区级管理员",
              kind: "admins",
              description: "具备全区可见与跨校治理权限（与校级隔离）。",
            },
          ],
        },
      ],
    },
    {
      id: "sch-demo",
      name: "上海市宝山中学",
      kind: "school",
      description: "示例学校：多校区、年级—班级—学生链路。",
      children: [
        {
          id: "campus-1",
          name: "校区 1",
          kind: "campus",
          description: "主校区：承担高中部教学。",
          children: [
            {
              id: "campus-1-teachers",
              name: "老师",
              kind: "teachers",
              description: "归属本校区的任课教师。",
            },
            {
              id: "g3",
              name: "三年级",
              kind: "grade",
              children: [
                {
                  id: "g3-c1",
                  name: "三年级 (1) 班",
                  kind: "class",
                  children: [
                    {
                      id: "g3-c1-stu",
                      name: "学生",
                      kind: "students",
                      description: "行政班在籍学生名册。",
                    },
                  ],
                },
                {
                  id: "g3-c2",
                  name: "三年级 (2) 班",
                  kind: "class",
                  children: [
                    {
                      id: "g3-c2-stu",
                      name: "学生",
                      kind: "students",
                      description: "行政班在籍学生名册。",
                    },
                  ],
                },
                {
                  id: "g4-c1",
                  name: "四年级 (1) 班",
                  kind: "class",
                  description: "与教师侧四年级（2）班映射可不对齐，仅作组织树占位。",
                  children: [
                    {
                      id: "g4-c1-stu",
                      name: "学生",
                      kind: "students",
                      description: "行政班在籍学生名册。",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "campus-2",
          name: "校区 2",
          kind: "campus",
          description: "分校区：与校区 1 平行的组织单元。",
          children: [
            {
              id: "campus-2-teachers",
              name: "老师",
              kind: "teachers",
              description: "归属本分校区的任课教师。",
            },
          ],
        },
        {
          id: "sch-mgmt",
          name: "管理",
          kind: "management",
          description: "校级人事与权限配置入口。",
          children: [
            {
              id: "sch-admins",
              name: "校级管理员",
              kind: "admins",
              description: "仅管理本校及下属校区/年级/班级数据。",
            },
          ],
        },
      ],
    },
  ],
};

export const DEMO_MEMBERS: Record<string, { role: string; name: string; id: string }[]> = {
  "staff-tro": [
    { id: "r-1", name: "王教研", role: "物理" },
    { id: "r-2", name: "陈教研", role: "化学" },
  ],
  "adm-district": [{ id: "d-1", name: "区管理员 A", role: "全区策略" }],
  "campus-1-teachers": [
    { id: "t-1", name: "李老师", role: "数学" },
    { id: "t-2", name: "周老师", role: "语文" },
  ],
  "g10-c1-stu": [
    { id: "s-1", name: "张同学", role: "在籍" },
    { id: "s-2", name: "刘同学", role: "在籍" },
  ],
  "g10-c2-stu": [
    { id: "s-c2-1", name: "郑同学", role: "在籍" },
    { id: "s-c2-2", name: "冯同学", role: "在籍" },
  ],
  "g10-c3-stu": [
    { id: "s-c3-1", name: "沈同学", role: "在籍" },
  ],
  "sch-admins": [
    { id: "a-1", name: "赵管理员", role: "主管理员" },
    { id: "a-2", name: "钱管理员", role: "协同" },
  ],
};

export function kindLabel(kind: OrgKind): string {
  const map: Record<OrgKind, string> = {
    district: "区 / 学院",
    office: "处室",
    personnel: "人员编制",
    school: "学校",
    campus: "校区",
    teachers: "教师",
    grade: "年级",
    class: "班级",
    students: "学生",
    management: "管理",
    admins: "管理员",
  };
  return map[kind];
}

export function findPath(root: OrgTreeNode, id: string, trail: OrgTreeNode[] = []): OrgTreeNode[] | null {
  const next = [...trail, root];
  if (root.id === id) return next;
  if (!root.children) return null;
  for (const ch of root.children) {
    const hit = findPath(ch, id, next);
    if (hit) return hit;
  }
  return null;
}

export function findNode(root: OrgTreeNode, id: string): OrgTreeNode | null {
  if (root.id === id) return root;
  if (!root.children) return null;
  for (const ch of root.children) {
    const hit = findNode(ch, id);
    if (hit) return hit;
  }
  return null;
}

/** 递归统计成员（含子树），用于「成员总数」与导出载荷。 */
export function subtreeDemoMemberCount(node: OrgTreeNode): number {
  let n = DEMO_MEMBERS[node.id]?.length ?? 0;
  for (const ch of node.children ?? []) n += subtreeDemoMemberCount(ch);
  return n;
}

export type OrgExportNode = {
  id: string;
  name: string;
  kind: OrgKind;
  description?: string;
  memberTotal: number;
  children?: OrgExportNode[];
};

export function decorateExportTree(node: OrgTreeNode): OrgExportNode {
  return {
    id: node.id,
    name: node.name,
    kind: node.kind,
    description: node.description,
    memberTotal: subtreeDemoMemberCount(node),
    children: node.children?.map(decorateExportTree),
  };
}

export function buildExportDocument(opts: { mode: "full" | "subtree"; nodeId?: string }) {
  const exportedAt = new Date().toISOString();
  if (opts.mode === "full") {
    return {
      schema: ORG_EXPORT_SCHEMA,
      exportedAt,
      mode: "full" as const,
      tree: decorateExportTree(ORG_TREE),
    };
  }
  const anchor = opts.nodeId ? findNode(ORG_TREE, opts.nodeId) : null;
  if (!anchor) return null;
  return {
    schema: ORG_EXPORT_SCHEMA,
    exportedAt,
    mode: "subtree" as const,
    anchorNodeId: anchor.id,
    tree: decorateExportTree(anchor),
  };
}

export function buildBatchExportDocument(nodeIds: string[]) {
  const roots = nodeIds.map((id) => findNode(ORG_TREE, id)).filter((x): x is OrgTreeNode => x != null);
  return {
    schema: ORG_EXPORT_SCHEMA,
    exportedAt: new Date().toISOString(),
    mode: "batch" as const,
    roots: roots.map(decorateExportTree),
  };
}

export function countTreeNodes(node: { children?: OrgTreeNode[] }): number {
  let n = 1;
  for (const ch of node.children ?? []) n += countTreeNodes(ch);
  return n;
}
