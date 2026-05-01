#!/usr/bin/env bash
# PM2 前端启动包装脚本
# 从项目根目录加载 .env.local（被 .gitignore 排除，不会泄漏到仓库）
set -euo pipefail

export PATH="/www/server/nodejs/v22.22.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/share/pnpm:$HOME/.nvm/versions/node/*/bin"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 从根目录 .env.local 提取 MinIO 相关变量，避免全量 source 污染 NODE_ENV 等
if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
  # 用 grep+sed 提取指定行，tr -d '\r' 剥离 CRLF
  eval "$(grep -E '^(MINIO_|MEDIA_APP_)' "$PROJECT_ROOT/.env.local" | tr -d '\r' | sed 's/^/export /')"
else
  echo "[start-with-env] WARN: .env.local not found at $PROJECT_ROOT/.env.local"
fi

echo "[start-with-env] MINIO_PUBLIC_URL=${MINIO_PUBLIC_URL:-UNSET}"
echo "[start-with-env] MINIO_BUCKET=${MINIO_BUCKET:-UNSET}"
echo "[start-with-env] MEDIA_APP_ACCESS_KEY=${MEDIA_APP_ACCESS_KEY:+SET(redacted)}"
echo "[start-with-env] MEDIA_APP_SECRET_KEY=${MEDIA_APP_SECRET_KEY:+SET(redacted)}"

cd "$SCRIPT_DIR/.."
exec npx next start -p 4200
