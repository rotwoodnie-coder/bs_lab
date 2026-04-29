# 实验材料联调验收用例

用于验收「创建材料 → 配置共享范围 → 在前端列表可见」的端到端链路。以下示例默认后端基址为 `http://localhost:4100`，可按部署替换。

## 前置条件

- 已执行材料相关数据库迁移，且 `MATERIALS_REPOSITORY_DRIVER=mysql`（或联调环境等价配置）。
- 请求头与前端 `callNewCoreApi` 一致，至少包含：

| 头名称 | 说明 |
|--------|------|
| `content-type` | `application/json` |
| `x-role` | `teacher` / `admin` / `researcher` / `district_admin` / `super_admin` 等（需具备写权限） |
| `x-user-id` | 操作者标识，可与业务用户表对齐 |
| `x-org-id` | 组织维度，材料列表按租户过滤时常用 |
| `x-user-name` | 可选，建议 UTF-8 经 `encodeURIComponent` 后传入 |
| `x-tenant-id` | 可选；缺省时后端使用 `x-org-id` 作为租户 |
| `x-app-id` | 可选；缺省为 `console` |

读接口需 `experimental-materials:read`，写接口需 `experimental-materials:write`（见 `backend/src/http/permissions.ts`）。

## 1. 创建材料（入库）

```bash
curl -sS -X POST "http://localhost:4100/v1/experimental-materials" \
  -H "content-type: application/json" \
  -H "x-role: teacher" \
  -H "x-user-id: u-accept-001" \
  -H "x-org-id: org-demo-001" \
  -H "x-user-name: %E9%AA%8C%E6%94%B6%E7%94%A8%E6%88%B7" \
  -d "{\"name\":\"验收用烧杯\",\"materialTypeCode\":\"general\",\"usage\":\"分组实验\",\"suggestedAmount\":\"每组 1 只\",\"remark\":\"联调创建\"}"
```

响应 `data.id` 记为 `MATERIAL_ID`。

## 2. 关联共享范围（scope）

将材料授权到当前组织（示例：`ORG` + `subjectKey` 与组织 ID 一致，掩码按业务约定填写正整数）：

```bash
curl -sS -X POST "http://localhost:4100/v1/experimental-materials/$MATERIAL_ID/scopes" \
  -H "content-type: application/json" \
  -H "x-role: teacher" \
  -H "x-user-id: u-accept-001" \
  -H "x-org-id: org-demo-001" \
  -d "{\"subjectType\":\"ORG\",\"subjectKey\":\"org-demo-001\",\"permissionMask\":7}"
```

## 3. 列表可见（验收点）

```bash
curl -sS "http://localhost:4100/v1/experimental-materials?keyword=验收" \
  -H "x-role: teacher" \
  -H "x-user-id: u-accept-001" \
  -H "x-org-id: org-demo-001"
```

预期：`data` 数组中存在步骤 1 创建的记录（名称含「验收」或全量列表中出现该 `id`）。

## 4. 与实验编辑器对齐的验收路径（产品侧）

1. 在「实验编辑器 → 材料」中新建材料，并勾选「同步到实验材料库」（对应调用创建接口）。
2. 打开「从材料库选择」，列表应能拉取到上一步入库的材料（对应列表接口，与当前 `ApiActor` 的 `x-org-id` / `x-role` 一致）。
3. 在「实验材料」管理页刷新，应能看到同一主档（与步骤 3 列表一致）。
4. 保存实验草稿后，前端会调用 `POST /v1/experimental-materials/experiment-links/sync`，将当前步骤中带 `libraryMaterialId` 的材料主键写入 `edu_experimental_material_experiment_link`（弱引用）。

前端材料相关 `ApiActor` 由 `frontend/src/lib/materials-api-actor.ts` 统一构造，避免页面与实验编辑器各自拼写 `userId` / 媒体 `ownerUserId`。

## 5. 同步实验—材料弱引用

```bash
curl -sS -X POST "http://localhost:4100/v1/experimental-materials/experiment-links/sync" \
  -H "content-type: application/json" \
  -H "x-role: teacher" \
  -H "x-user-id: u-accept-001" \
  -H "x-org-id: org-demo-001" \
  -d "{\"experimentId\":\"YOUR_EXP_UUID\",\"materialIds\":[\"$MATERIAL_ID\"]}"
```

预期：`data.synced` 为写入的行数；再次调用同一 `experimentId` 会全量替换为该列表（幂等）。

## 6. 失败排查

- **403**：检查 `x-role` 是否具备读/写权限。
- **404 / 空列表**：核对 `x-org-id`、`x-tenant-id` 与入库时租户是否一致。
- **422**：对照 `createMaterialSchema` / `createScopeSchema` 校验字段类型与枚举。
