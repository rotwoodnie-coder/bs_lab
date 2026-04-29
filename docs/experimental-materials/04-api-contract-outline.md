# 实验材料 API 契约大纲

## 1. 路由前缀与上下文

- 路由前缀建议：`/v1/experimental-materials`
- 请求上下文：`x-tenant-id`、`x-app-id`、`x-user-id`、`x-role`
- 统一返回：
  - `success`
  - `data`
  - `error`

## 2. 核心接口

### 2.1 列表查询

- `GET /v1/experimental-materials`
- 入参：
  - `keyword`
  - `materialType`
  - `categoryCodes[]`
  - `stageIds[]`
  - `subjectIds[]`
  - `gradeIds[]`
  - `hasHomeAlternative`
  - `riskLevel`
  - `onlyFavorites`
  - `page`、`size`
- 行为：
  - 默认过滤 `ACTIVE` 和未软删数据。
  - 只返回当前用户主体命中 scope 的材料。

### 2.2 详情查询

- `GET /v1/experimental-materials/{id}`
- 返回：
  - 主档信息
  - 分类/适用范围/安全标签
  - 资源按 `slot_key` 分组
  - 收藏状态

### 2.3 创建与更新

- `POST /v1/experimental-materials`
- `PATCH /v1/experimental-materials/{id}`
- 更新建议启用 `version` 并发控制。

### 2.4 资源关联

- `POST /v1/experimental-materials/{id}/resources`
- `DELETE /v1/experimental-materials/{id}/resources/{linkId}`
- 校验：
  - `slot_key` 合法
  - 视频槽位必须绑定 `VIDEO`

### 2.5 共享授权

- `POST /v1/experimental-materials/{id}/scopes`
- `DELETE /v1/experimental-materials/{id}/scopes/{scopeId}`
- 支持主体类型：`ORG/SCHOOL/CLASS/GROUP/ROLE/USER/EXTERNAL`

## 3. 错误码建议

- `VALIDATION_FAILED`
- `PERMISSION_DENIED`
- `NOT_FOUND`
- `CONFLICT_VERSION`
- `MEDIA_TYPE_MISMATCH`
