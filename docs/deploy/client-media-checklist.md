# 客户部署媒体访问检查清单

用于客户现场部署、内测环境迁移、以及后续存储/应用分离交付时的媒体访问验收。

## 1. 部署前必须确认的配置

### 1.1 应用侧环境变量

请在后端与前端运行环境中确认以下变量：

- `MINIO_ENDPOINT`
  - 含义：后端访问 MinIO/S3 的内部地址
  - 示例：`http://10.0.181.204:19000`
- `MINIO_PUBLIC_URL`
  - 含义：浏览器访问媒体资源时使用的对外地址
  - 示例：`https://lab.aliberg.cn`
- `MINIO_BUCKET`
  - 含义：媒体 bucket 名称
  - 示例：`bslab-media` 或项目当前约定值
- `MEDIA_APP_ACCESS_KEY`
  - 含义：应用访问 MinIO 的最小权限账号
- `MEDIA_APP_SECRET_KEY`
  - 含义：应用访问 MinIO 的最小权限账号密钥
- `ALLOWED_ORIGINS`
  - 含义：后端 CORS 白名单
  - 示例：`https://lab.aliberg.cn,https://admin.lab.aliberg.cn`

### 1.2 资源访问原则

- 对外访问必须使用域名，不允许把内网 IP 暴露给浏览器
- 数据库存储建议保存 `storage key`，不要保存固定公网/内网绝对地址
- 前端只依赖后端返回的公共 URL、预签名 URL、或 registry 代理地址

## 2. Nginx / 反向代理检查

### 2.1 主站代理

确认以下入口可访问：

- `/` → 前端应用
- `/api/` 或 `/v2/` → 后端服务

### 2.2 媒体资源代理

确认媒体公共路径可访问并能正确转发到对象存储：

- `https://<public-domain>/media/...`
- 或项目实际约定的 bucket 公共路径
- 若使用 registry 代理，确保 `/api/media/registry-stream` 正常可用

### 2.3 验收点

- 浏览器访问媒体封面图片不应出现 404
- 浏览器访问视频预览不应出现跨域或源站错误
- 下载链接应返回有效的预签名 URL

## 3. MinIO / S3 检查

### 3.1 Bucket

- bucket 已创建并命名正确
- bucket 访问策略符合当前方案
  - 若 bucket 私有：前端访问必须通过预签名 URL
  - 若 bucket 公开：必须确保仅公开需要展示的对象路径

### 3.2 应用账号权限

确认 `MEDIA_APP_ACCESS_KEY` 对 bucket 有以下最小权限：

- `s3:ListBucket`
- `s3:GetBucketLocation`
- `s3:GetObject`
- `s3:PutObject`
- `s3:DeleteObject`
- `s3:AbortMultipartUpload`
- `s3:ListMultipartUploadParts`

### 3.3 CORS

若采用浏览器直传或前端直连预签名地址，需要确认 bucket CORS 已配置：

- `AllowedOrigins` 包含前端实际域名
- `AllowedMethods` 包含 `GET, PUT, POST, HEAD, DELETE`
- `AllowedHeaders` 包含 `*`
- `ExposeHeaders` 包含 `ETag`

## 4. 功能验收清单

### 4.1 上传

- [ ] 上传图片成功
- [ ] 上传视频成功
- [ ] 上传文档/素材成功
- [ ] 上传后页面能拿到正确的 `viewUrl`
- [ ] 上传后数据库记录保存的是 storage key 或可兼容字段

### 4.2 预览

- [ ] 图片预览正常
- [ ] 视频封面预览正常
- [ ] 视频点击播放正常
- [ ] 教材封面正常显示
- [ ] 实验材料封面正常显示
- [ ] 媒体库列表缩略图正常显示

### 4.3 下载 / 打开

- [ ] 预览按钮可打开文件
- [ ] 下载按钮可生成有效预签名链接
- [ ] 私有 bucket 下，浏览器可通过预签名地址访问

### 4.4 兼容旧数据

- [ ] 旧的 storage key 能自动转成公共 URL
- [ ] 旧的媒体路径能通过统一代理正常访问
- [ ] 历史记录中若存在旧 URL，不影响页面展示

## 5. 常见故障排查

### 5.1 图片加载失败

排查顺序：

1. 检查前端最终拿到的 URL 是否是公共域名
2. 检查 nginx 是否已代理到 MinIO
3. 检查 bucket 中对象是否存在
4. 检查 `MINIO_PUBLIC_URL` 是否配置正确

### 5.2 视频无法播放

排查顺序：

1. 检查 `MediaPreview` 是否拿到了正确的 registry URL
2. 检查预签名 URL 是否返回 200
3. 检查对象存储是否支持 `Range` 请求
4. 检查文件类型识别是否正确

### 5.3 预签名下载失败

排查顺序：

1. 检查 `MEDIA_APP_ACCESS_KEY/SECRET_KEY` 是否正确
2. 检查 bucket policy 是否允许读取对象
3. 检查后端 `MINIO_ENDPOINT` 是否能联通
4. 检查后端日志里是否有签名或读取错误

## 6. 客户交付建议

建议客户现场部署遵循以下原则：

- 只改配置，不改代码
- 只换域名，不换业务逻辑
- 内部地址与对外地址分离
- 媒体统一走公共入口或预签名 URL
- 数据库存储统一使用资源标识，不固化 IP

## 7. 最终验收标准

当满足以下条件时，认为媒体访问链路已通过客户部署验收：

- 前端所有媒体展示正常
- 上传、预览、下载、删除都正常
- 私有 bucket 访问不依赖浏览器直连内网地址
- 客户环境仅通过配置即可完成迁移
