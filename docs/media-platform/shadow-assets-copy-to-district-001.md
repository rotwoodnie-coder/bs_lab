# 影子资源补齐到 district-001（Phase 2 前置）

目标：把已存在于 `org-school-east/console` 的三张默认图，以同 `storage_key` 重新登记到 `district-001/console`，用于标准实验 Core（租户 `district-001`）联调。

> 推荐走 API（`/v1/media/assets/upload`）而不是手写 SQL：
> - 自动写入 `sys_media_assets` + `edu_media_registry`
> - 自动触发缩略图 job 与默认字段
> - 与现网上传链路一致，回归成本更低

## 1) 请求头（示例）

- `x-role: researcher`
- `x-user-id: researcher-a`
- `x-user-name: 控制台用户`（可 URL 编码）
- `x-org-id: district-001`
- `x-tenant-id: district-001`
- `x-app-id: console`
- `x-subject-key: SYSTEM:bootstrap`
- `content-type: application/json`

## 2) 三条登记请求（示例）

将 `<API_BASE>` 替换为你的后端地址（如 `http://localhost:4100`）。

### 2.1 实验封面默认图（16:9）

```bash
curl -X POST "<API_BASE>/v1/media/assets/upload" \
  -H "content-type: application/json" \
  -H "x-role: researcher" \
  -H "x-user-id: researcher-a" \
  -H "x-user-name: 控制台用户" \
  -H "x-org-id: district-001" \
  -H "x-tenant-id: district-001" \
  -H "x-app-id: console" \
  -H "x-subject-key: SYSTEM:bootstrap" \
  -d '{
    "hash": "759b9ec8238a6a5bf91b10f270307b7ab294d8690c63604ff3a8e1259a53aec8",
    "fileSize": 1030848,
    "fileExt": "png",
    "mediaType": "IMAGE",
    "mimeType": "image/png",
    "storageEngine": "S3",
    "storageKey": "u/75/759b9ec8238a6a5bf91b10f270307b7ab294d8690c63604ff3a8e1259a53aec8.png",
    "title": "实验封面默认图",
    "ownerType": "SYSTEM",
    "ownerKey": "SYSTEM:bootstrap"
  }'
```

### 2.2 实验材料默认图（1:1）

```bash
curl -X POST "<API_BASE>/v1/media/assets/upload" \
  -H "content-type: application/json" \
  -H "x-role: researcher" \
  -H "x-user-id: researcher-a" \
  -H "x-user-name: 控制台用户" \
  -H "x-org-id: district-001" \
  -H "x-tenant-id: district-001" \
  -H "x-app-id: console" \
  -H "x-subject-key: SYSTEM:bootstrap" \
  -d '{
    "hash": "af69eacb0f53c4ddfab5034f7ae91c0754106c9f2f9bcf474e48133cc1cfe9c7",
    "fileSize": 1297049,
    "fileExt": "png",
    "mediaType": "IMAGE",
    "mimeType": "image/png",
    "storageEngine": "S3",
    "storageKey": "u/af/af69eacb0f53c4ddfab5034f7ae91c0754106c9f2f9bcf474e48133cc1cfe9c7.png",
    "title": "实验材料默认图",
    "ownerType": "SYSTEM",
    "ownerKey": "SYSTEM:bootstrap"
  }'
```

### 2.3 教材默认图（竖版）

```bash
curl -X POST "<API_BASE>/v1/media/assets/upload" \
  -H "content-type: application/json" \
  -H "x-role: researcher" \
  -H "x-user-id: researcher-a" \
  -H "x-user-name: 控制台用户" \
  -H "x-org-id: district-001" \
  -H "x-tenant-id: district-001" \
  -H "x-app-id: console" \
  -H "x-subject-key: SYSTEM:bootstrap" \
  -d '{
    "hash": "3ef6389bbda1c6bbf2f983cfa4cbece2e82f722a42bbcadc39810743993fc29f",
    "fileSize": 1163035,
    "fileExt": "png",
    "mediaType": "IMAGE",
    "mimeType": "image/png",
    "storageEngine": "S3",
    "storageKey": "u/3e/3ef6389bbda1c6bbf2f983cfa4cbece2e82f722a42bbcadc39810743993fc29f.png",
    "title": "教材默认图",
    "ownerType": "SYSTEM",
    "ownerKey": "SYSTEM:bootstrap"
  }'
```

## 3) 完成标准（继续下一步前）

1. 记录三条新 `registry.id` 到 `README.local`（`district-001` 环境）。  
2. 任意一条可通过媒体流接口访问成功（无 404/403）。  
3. 回到 `docs/de-mock-handoff-checkpoints.md` 将 Phase 2 对应勾选项更新为已完成。

完成后在会话中直接回复：

- 「district-001 三条 registry 已完成，id 分别是 ...」

Agent 将继续 Phase 2 的 Core 绑定与详情验收。
