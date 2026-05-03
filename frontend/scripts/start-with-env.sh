#!/usr/bin/env bash
# PM2 前端启动包装脚本
# 从项目根目录加载 .env.local（被 .gitignore 排除，不会泄漏到仓库）
set -euo pipefail

export PATH="/www/server/nodejs/v22.22.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/share/pnpm:$HOME/.nvm/versions/node/*/bin"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 从根目录 .env.local 提取 MinIO 相关变量及 NODE_ENV（兜底），避免全量 source 污染
if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
  # 用 grep+sed 提取指定行，tr -d '\r' 剥离 CRLF
  eval "$(grep -E '^(MINIO_|MEDIA_APP_|NODE_ENV)' "$PROJECT_ROOT/.env.local" | tr -d '\r' | sed 's/^/export /')"
else
  echo "[start-with-env] WARN: .env.local not found at $PROJECT_ROOT/.env.local"
fi

# MINIO_ENDPOINT → NEXT_PUBLIC_MINIO_ENDPOINT（客户端可读）
if [[ -n "${MINIO_ENDPOINT:-}" ]]; then
  export NEXT_PUBLIC_MINIO_ENDPOINT="$MINIO_ENDPOINT"
fi
# MINIO_PUBLIC_URL → NEXT_PUBLIC_MINIO_PUBLIC_URL（客户端判断生产/开发）
if [[ -n "${MINIO_PUBLIC_URL:-}" ]]; then
  export NEXT_PUBLIC_MINIO_PUBLIC_URL="$MINIO_PUBLIC_URL"
fi

echo "[start-with-env] MINIO_PUBLIC_URL=${MINIO_PUBLIC_URL:-UNSET}"
echo "[start-with-env] MINIO_BUCKET=${MINIO_BUCKET:-UNSET}"
echo "[start-with-env] MEDIA_APP_ACCESS_KEY=${MEDIA_APP_ACCESS_KEY:+SET(redacted)}"
echo "[start-with-env] MEDIA_APP_SECRET_KEY=${MEDIA_APP_SECRET_KEY:+SET(redacted)}"
echo "[start-with-env] NEXT_PUBLIC_MINIO_ENDPOINT=${NEXT_PUBLIC_MINIO_ENDPOINT:-UNSET}"

cd "$SCRIPT_DIR/.."
exec npx next start -p 4200
