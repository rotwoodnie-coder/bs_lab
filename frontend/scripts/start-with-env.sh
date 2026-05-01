#!/usr/bin/env bash
# PM2 前端启动包装脚本
# 从项目根目录加载 .env.local（被 .gitignore 排除，不会泄漏到仓库）
set -euo pipefail

export PATH="/www/server/nodejs/v22.22.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/share/pnpm:$HOME/.nvm/versions/node/*/bin"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

set -a
# 用 tr -d '\r' 处理 Windows 换行符，防止 \r 污染变量值
source <(tr -d '\r' < "$PROJECT_ROOT/.env.local") 2>/dev/null \
  || echo "[start-with-env] WARN: .env.local not found at $PROJECT_ROOT/.env.local"
set +a

# 清除 PORT 变量，防止 .env.local 中的 PORT=4100 被 Next.js 当作监听端口
unset PORT

# 强制生产模式：.env.local 中可能写 NODE_ENV=development，会覆盖 PM2 设置
export NODE_ENV=production

echo "[start-with-env] MINIO_PUBLIC_URL=${MINIO_PUBLIC_URL:-UNSET}"
echo "[start-with-env] MINIO_BUCKET=${MINIO_BUCKET:-UNSET}"
echo "[start-with-env] MEDIA_APP_ACCESS_KEY=${MEDIA_APP_ACCESS_KEY:+SET(redacted)}"
echo "[start-with-env] MEDIA_APP_SECRET_KEY=${MEDIA_APP_SECRET_KEY:+SET(redacted)}"

cd "$SCRIPT_DIR/.."
exec npx next start -p 4200
