# 组织树与教师授课 UI（与基线 SQL 对齐说明）

**结构真源（唯一）**：`database/migrations/bs_exp_data.sql`  
本文档不重复编造表结构；凡与列名、类型、外键不一致的表述以该文件为准。

---

## 1. 基线中与「学校 / 年级 / 班级」相关的表

以下表在该文件中均有 `CREATE TABLE` 定义（行号随文件版本可能变化，以文件内 `Table structure for …` 注释为准）：

| 表名 | 作用（以 SQL 内 COMMENT 为准） |
|------|--------------------------------|
| `sys_org` | 组织（学校/班级等）；`org_type_id` → `data_org_type.type_id`；`parent_org_id` 自引用；`grade_id` → `data_school_grade`（班级节点用） |
| `data_org_type` | 组织类型字典 |
| `data_school_grade` | 年级字典 |
| `data_school_subject` | 学科字典 |
| `sys_user` | 用户 |
| `sys_user_role` | 用户角色与可选 `org_id` 范围 |

**基线文件中未出现的表**：当前 `database/migrations/bs_exp_data.sql` **没有**定义任何「教师—班级—学科」授课关系物理表。后端若通过 `TEACHER_CLASS_TABLE` 访问某张表，该表须**先出现在此基线文件（经同一真源流程合并）**或由运维配置 **`TEACHER_CLASS_PHYSICAL_TABLE`** 指向库内**真实存在且与代码写入列一致**的表；**不得**以本仓库其它 SQL 文件冒充基线定义。

---

## 2. `org_type_id` 与代码常量

- 库侧：`sys_org.org_type_id` 外键引用 `data_org_type.type_id`（见基线 SQL 中 `sys_org` 的 `CONSTRAINT fk_sys_org_type`）。
- 代码侧：`V2_ORG_TYPE_IDS`（`frontend` / `backend` 同名常量文件）中的取值须与**目标库** `data_org_type` 中实际行一致；**不得以本文档代替**字典内容。基线 SQL 为纯结构导出时可能不含 `INSERT`，运行库数据以实际种子为准。

---

## 3. 前端组织树与选班行为（非 DDL）

以下逻辑仅描述 **UI 如何遍历已返回的树形 `V2SysOrgItem[]`**，不改变基线表结构：

- 组织树完整层级（初始化后固定，见 `database/seed/insert-org-types-campus-level.sql`）：
  ```
  Org_Manage（管理教育局/集团）
  └── Org_School（顶层学校）
       └── Org_School_Campus（校区/分校）
            └── Org_School_Level（学段，如小学、初中）
                 ├── Org_School_Grade（年级）
                 │    └── Org_School_Class（班级）
                 └── ...
  ```
- 学校下拉：`listSchools` 只返回**顶层学校**（父级不是 `Org_School` 的节点），中间校区/学部不作为独立选项。
- 年级 / 班级：在同一学校子树内按 `grade` / `class` 常量**递归**收集（兼容学校→校区→学段→年级等多级嵌套）。
- 扁平接口组树：见 `frontend/src/lib/v2/build-org-tree-from-flat.ts` 及接口注释。

实现索引：`frontend/src/app/(dashboard)/system-manage/teacher-class/_lib/teacher-config-tree-helpers.ts`、`ClassPickerDialog.tsx`、`TeacherConfigBody.tsx`。

---

## 4. 授课关系接口 503（表不存在）

当 MySQL 返回 **1146** 时，后端返回「授课关系表尚未在目标库就绪」类提示。排障时：

1. 对照 **`database/migrations/bs_exp_data.sql`**：确认目标库 schema 是否与该基线一致、是否已包含你们实际使用的授课表。
2. 若基线**尚未**收录该表：由产品/DBA 将表定义**合并进同一基线文件**后再发布；在此之前可通过 **`TEACHER_CLASS_PHYSICAL_TABLE`** 指向库内已有且列契约与后端写入代码一致的物理表（见 `backend/src/domain/v2-sys/teacher-class-table.ts`）。

**禁止**：用仓库内与 `bs_exp_data.sql` 并行的「手写迁移片段」充当结构真源描述。
