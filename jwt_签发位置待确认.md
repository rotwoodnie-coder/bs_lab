# JWT 签发位置待确认

根据全局搜索结果，项目中未发现典型的 `jwt.sign` / `jsonwebtoken` 直接调用，当前 V2 会话 token 的签发入口实际位于：

- `backend/src/lib/auth/v2-session.ts`
  - `createV2SessionTokens(...)`
  - `rotateV2RefreshTokens(...)`

以及其调用方：

- `backend/src/http/routes/v2-auth.ts`
  - `POST /v2/auth/login`
  - `POST /v2/auth/refresh`
  - `POST /v2/auth/switch-role`

补充说明：
- 当前项目采用自定义 HMAC 签名会话实现，不依赖 `jsonwebtoken` 包。
- 需要扩展的 JWT-like payload 字段应在 `createV2SessionTokens` / `rotateV2RefreshTokens` 的 payload 组装处同步补齐。
