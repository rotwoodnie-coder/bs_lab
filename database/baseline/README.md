# 数据库结构基线（唯一权威）

本目录存放 **数据库约定说明**；可选再放从 **Navicat 等导出** 的、与线上一致（或约定为真源）的 SQL 快照子目录。当前 **`bs_exp_data` 全库 DDL** 在 **`../migrations/bs_exp_data.sql`**（见下表）。**优先查本 README 与上述文件**，不要再去猜别的库或旧文档里的 SQL。

## 当前快照

| 状态 | 路径 | 说明 |
|------|------|------|
| **当前生效（`bs_exp_data` DDL）** | `database/migrations/bs_exp_data.sql` | **Navicat 结构导出**（Source Schema: `bs_exp_data`，约 2026-04-21）。承担：**① 项目库表结构设计基线**；**② 新人空库一键建表**。含 `DROP TABLE`，仅允许空库或可全量重建环境执行；勿当每日自动迁移。 |

### 新人本地建 `bs_exp_data`（空库）

1. 确认 MySQL 可连，且**该库可丢弃或本为空**（脚本会 `DROP TABLE`）。  
2. 建库（字符集与线上一致示例）：

```sql
CREATE DATABASE IF NOT EXISTS bs_exp_data
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

3. 导入结构（在仓库根目录执行，按本机改主机/用户）：

```bash
mysql -h 127.0.0.1 -P 3306 -u 你的用户 -p bs_exp_data < database/migrations/bs_exp_data.sql
```

4. 需要种子数据时，使用团队提供的 **初始化数据 SQL**、备份导入或另行约定的导出（**先执行 `bs_exp_data.sql` 建结构，再导入数据**）。

5. **组织类型初始化**（校区 `Org_School_Campus`、学段 `Org_School_Level`）：
   在执行 `bs_exp_data.sql` 建库后，运行以下种子脚本补充字典行：

```bash
mysql -h 127.0.0.1 -P 3306 -u 你的用户 -p bs_exp_data < database/seed/insert-org-types-campus-level.sql
```

---

## 当前生效 SQL 基线（团队必须服从）

当负责人**把某一版导出定为「数据库最准确源」**时，按下面约定执行，其他开发**不得**再以个人本地库、旧截图或未合并的 SQL 为准改表或改代码。

### 为什么「写在 README 里」仍可能不生效

| 原因 | 说明 |
|------|------|
| **只有流程、没有冻结动作** | 「当前快照」里没有 **标为「当前生效」的 DDL 文件路径**（当前应为 **`bs_exp_data.sql`**），则团队与自动化规则缺乏统一对照。 |
| **没有可执行的 DDL** | 若目录里只有 **`INSERT` 数据**、没有 **`CREATE TABLE`** 结构导出，本文档自身也规定**不能**单靠 INSERT 当 DDL 真源，评审与实现仍会对齐到 migration。 |
| **代码与迁移未改** | README **不会**自动修改 `v2-*-repository`、HTTP 或前端；未合并的 PR 也不会改变别人拉下来的行为。 |
| **无门禁** | 若 CI / PR 模板未要求「对照当前生效路径」，只能靠人自觉，容易出现「写了文档、代码照旧」。 |

**满足下面两条才算「基线定义已生效」**：① **「当前快照」表**中 **「当前生效」行**指向真实 DDL 文件（现为 **`database/migrations/bs_exp_data.sql`**）；② **同一合并进主干的 PR** 已包含与该 DDL 一致的 **编号增量迁移 + 读写代码**（或书面说明新环境如何仅从该 DDL 建库）。

### 1. 如何「定义」生效基线（一次冻结）

1. **新建目录**（推荐命名）：`database/baseline/navicat-export-YYYY-MM-DD/`（或 `sql-baseline-YYYY-MM-DD/`，全团队统一一种即可）。  
2. **放入内容**（至少满足其一）：  
   - **推荐**：目标库（如 `bs_exp_data`）的 **结构导出**——含 **`CREATE TABLE`** 的整库/分表 SQL，能单独回答「列、类型、索引、FK」；  
   - **若仅有单表 `INSERT` 数据**：必须在同一 PR 中附带 **同库同版本的 `CREATE TABLE` 导出**，或写明「列集合与附件 `xxx-structure.sql` 一致」，**禁止**只靠 INSERT 列名当唯一 DDL 依据。  
3. **在本文件更新下表「当前生效」行**（只保留**一条**当前真源；旧目录移入「历史快照」或保留但标注「已冻结，仅供参考」）。  
4. **更新** `database/schema.sql` 顶部注释：指向**新目录名**与**更新日期**。  
5. **同一 PR 必须包含**：与基线一致的 **`database/migrations/` 增量脚本**（把已有环境从「上一真源」迁到本基线，或说明新环境如何一键对齐），以及受影响的 **`v2-*-repository` / HTTP zod / 前端类型**。  
6. **团队通知**：在 PR 描述或群公告写清：「自合并日起，库结构以 `baseline/…` 为准」。

**「当前生效」表示模板**（复制到上表上一行或单独小节，合并 PR 时改掉日期与路径）：

| 状态 | 路径 | 说明 |
|------|------|------|
| **当前生效** | `database/migrations/bs_exp_data.sql` 或 `baseline/sql-baseline-YYYY-MM-DD/…` | 目标库 **DDL 与列语义** 以约定文件为准；代码与迁移不得与之冲突。 |
| 历史 | （已移除的旧 Navicat 整包目录） | 不再随仓库分发；**不作为**结构依据。 |

### 2. 与其他真源的关系（避免打架）

- **`database/migrations/`**：仍是 **可重复执行**、把各环境从 A 版本迁到 B 版本的**唯一代码化路径**；其 **目标状态** 必须与 **「当前生效」基线中的 DDL** 一致。若不一致，以 **已宣布的当前基线** 为准，**改迁移或改基线导出**，并再发 PR。  
- **`0024_v2_full_schema_init.sql`**：视为 **历史起点**；若新基线中的表结构与 0024 不同，**不**再要求新人「以 0024 脑补列名」，而以 **当前生效基线里的 CREATE** 为准，并通过 **新迁移** 表达从旧到新的差分。  
- **异名 schema 的历史导出**（如非 `bs_exp_data` 的整库 SQL）：除非 README 明确标为「当前生效」，否则 **不得** 替代 **`bs_exp_data.sql`** 对 `material_msg` / `data_file` 等表的定义。

### 3. 开发服从性（可放进 CONTRIBUTING / 评审清单）

- 打开表结构问题时：**先打开本 README 里的「当前生效」路径**，再对 `CREATE TABLE` / 迁移。  
- 提交改表或改 `SELECT` 列：PR 中说明 **对照了哪一份基线文件**（路径 + 日期）。  
- 本地库与基线不一致：优先 **对齐基线**（执行迁移或重导），而不是让 API/前端去「兼容」未文档化的本地差异。

## 与 `database/migrations/` 的关系

- **`migrations/`**：版本化增量脚本，用于从空库或某版本 **顺序执行** 得到当前代码期望的 schema；**不等于**「线上某一时刻 Navicat 导出的字节级一致」。
- **`baseline/`**：**结构/数据对照的真源快照**；与代码或迁移不一致时，以 **产品确认的基线** 为准排期改代码或补迁移。

### 与 `0024_v2_full_schema_init.sql` 的关系

| 内容 | 说明 |
|------|------|
| **`bs_exp_data` 全库** | 以 **`database/migrations/bs_exp_data.sql`** 为 DDL 真源（与线上一致时定期重导替换）。 |
| **`0024_v2_full_schema_init.sql`** | 历史建库脚本；与 `bs_exp_data.sql` 冲突时以 **较新且已合并的** `bs_exp_data.sql` 及 README 裁定为准；增量用 **`00NN_*.sql`**。 |

**冲突处理**：发现「后端 SQL / 编号迁移」与 **`bs_exp_data.sql`** 不一致 → **产品裁定** → **要么**重导更新 `bs_exp_data.sql`，**要么**新增迁移把目标库改到裁定结果，并 **同一 PR** 调整 `v2-*-repository` / HTTP 契约 / 前端类型。

## 已废弃的参考位置

以下 **不再** 作为 DDL 真源使用（相关文件已从仓库删除或仅作流程说明时勿引用其 SQL 正文）：

- `docs/iam/01-iam-schema*.sql`（已删除，改查本 baseline）
- 仓库根下旧的 MVP ERD 草图（`database/ERD.md` 已删除）

流程类 Markdown（审核稿、迁移规则、人工核验清单）仍可保留作 **过程与合规** 参考，但 **`bs_exp_data` 表字段以 `database/migrations/bs_exp_data.sql` + 已执行编号迁移为准**。
