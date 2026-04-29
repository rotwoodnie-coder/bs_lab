# 规范名指纹与幂等键规范（v1）

本文约定 `name_fingerprint` 与各类边 `idempotency_key` 的生成方式。版本字段 `fingerprint_version`（见核心表）与本文档版本对应；**变更算法时需递增版本并评估历史数据回填**。

## 1. name_fingerprint（核心表去重）

**输入**：用户或教研录入的原始展示名称字符串（允许含书名号、全角符号、首尾空格）。

**处理顺序（必须固定）**

1. **trim**：去除首尾 Unicode 空白（含全角空格）。
2. **NFKC 兼容分解**：Unicode 规范化（实现可选用 NFKC，与运行环境一致即可；需在服务端统一实现）。
3. **全角转半角**：将常见全角字母、数字、ASCII 标点转为半角（与业务字符集白名单一致）。
4. **移除书名号**：删除 `《` `》`；英文双引号是否移除由实现统一（v1 建议保留内容仅去书名号）。
5. **空白折叠**：连续空白合并为单个半角空格，或全部移除（**v1 采用：合并为单个空格**）。
6. **小写化**：对拉丁字母执行 `toLowerCase`；中文不受影响。

**输出**

- 对规范化后的字符串计算 **SHA-256 十六进制小写**（64 字符），写入 `name_fingerprint`。
- 展示用名称写入 `display_name`（可为原始清洗后的可读形式，与指纹分离）。

**唯一性**：同一 `tenant_id + app_id + stage_id + subject_id + name_fingerprint` 仅允许一条 Core 记录（见库表唯一约束）。

## 2. idempotency_key（边表幂等）

通用要求：同一租户应用下，`idempotency_key` **全局唯一**（跨边类型亦唯一，因分表存储不存在冲突；若未来合并为单表需加 `edge_kind` 前缀）。

推荐算法：**64 字符十六进制**（如对规范拼接串做 SHA-256）。

### 2.1 章节边 `edu_standard_experiment_chapter_edges`

拼接字段（UTF-8 字符串，固定顺序，用 `|` 分隔，空值用字面量 `NULL`）：

`CHAPTER|{tenant_id}|{app_id}|{standard_experiment_id}|{textbook_id}|{textbook_edition_id或 NULL}|{chapter_id}`

### 2.2 材料边 `edu_standard_experiment_material_edges`

`MATERIAL|{tenant_id}|{app_id}|{standard_experiment_id}|{material_id}|{standard_qty 规范化字符串}|{qty_unit 规范化大写}`

说明：`standard_qty` 建议先格式化为定点小数字符串（如 `4.0000`），避免 `4` 与 `4.0` 产生重复边。

### 2.3 媒体边 `edu_standard_experiment_media_edges`

`MEDIA|{tenant_id}|{app_id}|{standard_experiment_id}|{registry_id}|{media_kind}`

`media_kind` 大写，如 `VIDEO`、`DOC`。

## 3. 统计口径（与字段配合）

- `evidence_count`：原始引用/保存次数累计（可按产品策略节流）。
- `support_teacher_count`：**去重教师数**等业务口径由应用层维护；晋升阈值（如「不少于 N 位不同教师」）应对齐该字段或离线任务回写。

## 4. v1 冻结清单

- 指纹算法：SHA-256，小写十六进制。
- 章节边 edition未使用：拼接中使用字面量 `NULL`。
- 变更本页规则时：递增 `fingerprint_version` 并新增 `v2` 文档段落或新文件。
