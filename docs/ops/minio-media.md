# MinIO 媒体存储（开发服务器）配置指南

本项目当前采用 **S3 兼容的 presigned URL** 模式（前端向 Next.js API 请求签名 URL，浏览器直接 PUT/GET MinIO）。

## 1. 需要你准备的信息

- **MinIO S3 API 地址**：`http://<dev-server-host>:9000`
- **MinIO Console 地址**：`http://<dev-server-host>:9001`
- **Bucket 名称**：建议 `bs-media`
- **应用访问密钥**：建议单独创建用户 `media-app`（不要使用 root）

## 2. 在项目里配置环境变量

把以下变量放到你运行 **frontend（Next.js）** 的环境中（本地可放 `.env.local`，服务器按你的部署方式注入）：

- `MINIO_ENDPOINT=http://<dev-server-host>:9000`
- `MINIO_BUCKET=bs-media`
- `MEDIA_APP_ACCESS_KEY=media-app`
- `MEDIA_APP_SECRET_KEY=<你的强密码>`

注意：`MINIO_ENDPOINT` 是 **S3 API**（9000），不是 Console（9001）。

## 3. 在 MinIO Console 里完成一次性配置（推荐）

### 3.1 创建 Bucket

- 进入 Console → Buckets → Create bucket → 输入 `bs-media`

建议对象前缀约定：

- `raw/`：原始上传
- `hls/`：未来 HLS 转码产物（可先不用）

### 3.2 配置 CORS（必须，否则浏览器直传会跨域失败）

Console → Buckets → 选择 `bs-media` → **CORS**，设置类似（按你实际前端域名调整）：

- AllowedOrigins: `http://localhost:4200`（或你的前端域名）
- AllowedMethods: `GET, PUT, POST, HEAD, DELETE`
- AllowedHeaders: `*`
- ExposeHeaders: `ETag`

如果你前端不在本机（比如通过内网域名访问），务必把真实 Origin 也加进去（例如 `http://dev-frontend.your.lan`）。

### 3.3 创建应用用户（media-app）

Console → Identity → Users → Create User

- Access Key: `media-app`
- Secret Key: 生成强密码

### 3.4 给应用用户绑定最小权限策略

Console → Identity → Policies → Create Policy，粘贴下面策略（把 `bs-media` 替换成你的 bucket）：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BucketList",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::bs-media"]
    },
    {
      "Sid": "ObjectReadWrite",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": ["arn:aws:s3:::bs-media/*"]
    }
  ]
}
```

然后把该 policy attach 给用户 `media-app`。

## 4. 用 `mc`（命令行）配置（可选）

适合自动化/脚本化。以你的 dev-server 为例：

```bash
mc alias set dev http://<dev-server-host>:9000 <ROOT_USER> <ROOT_PASSWORD> --api S3v4
mc mb --ignore-existing dev/bs-media
mc cors set dev/bs-media cors.json
mc admin user add dev media-app <SECRET>
mc admin policy create dev media-app-policy policy-media-app.json --force
mc admin policy attach dev media-app-policy --user media-app
```

## 5. 项目内已提供的 presign API（你可以直接测）

- `POST /api/media/presign-upload` 入参：
  - `filename`
  - `contentType`
  - `size`（当前未强校验，后续可加限制）

返回：
- `method: "PUT"`
- `url`（短期有效）
- `headers`（至少包含 `Content-Type`）
- `objectKey`

上传后用 `objectKey` 调用：

- `POST /api/media/presign-download` `{ objectKey }` → 返回短期 GET `url`

## 6. 常见坑

- **访问不通**：确保 dev-server 的 `9000/9001` 端口对你当前运行 Next.js 的机器可达（防火墙/安全组/内网路由）。\n- **跨域失败**：浏览器报 CORS，检查 bucket 的 CORS AllowedOrigins 是否包含你前端真实 Origin。\n- **签名能拿到但 PUT 失败**：确认 `MEDIA_APP_ACCESS_KEY/SECRET_KEY` 的 policy 覆盖了 bucket 和对象前缀。\n- **不要把 MinIO root 密钥放到应用里**：应用只用 `media-app` 这类最小权限用户。

