#!/usr/bin/env bash
# ===========================================================================
# BS-Lab one-click deploy script
# Auto-detects config from .env.local in deployment dir
# Usage:
#   First deploy:  sudo bash install.sh
#   Update:        sudo bash install.sh --update
#   Auto-update:   sudo bash install.sh --watch
# ===========================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'
log_info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_step()  { echo -e "\n${YELLOW}--- $* ---${NC}"; }

# ---- Defaults ----
DEFAULT_DEPLOY_DIR="/opt/bs-lab"
DEFAULT_GIT_REPO_URL="git@github.com:rotwoodnie-coder/bs_lab.git"
DEFAULT_GIT_BRANCH="main"
DEFAULT_FRONTEND_PORT=4200
DEFAULT_BACKEND_PORT=4100
DEFAULT_WATCH_INTERVAL=300
DEPLOY_CONF="bslab-deploy.conf"

# ===========================================================================
# Auto-detect config from .env.local
# ===========================================================================
load_env_config() {
  local env_file="$1"
  if [[ ! -f "$env_file" ]]; then
    return 1
  fi

  log_info "Reading config from: $env_file"

  # Source the env file (only needed vars)
  set +a
  source "$env_file"
  set -a

  # Map .env.local vars to our script vars
  DB_HOST="${DB_HOST:-}"
  DB_PORT="${DB_PORT:-}"
  DB_USER="${DB_USER:-}"
  DB_PASSWORD="${DB_PASSWORD:-}"
  DB_NAME="${DB_NAME:-}"
  REDIS_URL="${REDIS_URL:-}"
  MINIO_ENDPOINT="${MINIO_ENDPOINT:-}"
  MINIO_BUCKET="${MINIO_BUCKET:-bs-media}"
  MINIO_ACCESS_KEY="${MEDIA_APP_ACCESS_KEY:-}"
  MINIO_SECRET_KEY="${MEDIA_APP_SECRET_KEY:-}"
  BACKEND_PORT="${PORT:-$DEFAULT_BACKEND_PORT}"

  # Try to extract SERVER_DOMAIN from ALLOWED_ORIGINS
  if [[ -n "${ALLOWED_ORIGINS:-}" ]]; then
    # Take the first origin, strip https:// prefix
    SERVER_DOMAIN="$(echo "$ALLOWED_ORIGINS" | cut -d',' -f1 | sed 's|https://||' | sed 's|http://||')"
  fi
  SERVER_DOMAIN="${SERVER_DOMAIN:-localhost}"

  return 0
}

# ===========================================================================
# Pre-checks
# ===========================================================================
check_root() {
  if [[ $EUID -ne 0 ]]; then
    log_error "Please run as root (sudo bash install.sh)"
    exit 1
  fi
}

ensure_mysql_client() {
  if ! command -v mysql &>/dev/null; then
    log_info "Installing MySQL client..."
    apt-get install -y default-mysql-client 2>/dev/null || \
      apt-get install -y mysql-client 2>/dev/null || true
  fi
}

# ===========================================================================
# Git SSH setup
# ===========================================================================
ensure_git_ssh() {
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"

  if [[ ! -f "$HOME/.ssh/id_ed25519" ]]; then
    log_info "Generating SSH key..."
    ssh-keygen -t ed25519 -C "bs-lab@$(hostname)" -N "" -f "$HOME/.ssh/id_ed25519" <<< y > /dev/null 2>&1
  fi

  # Add github.com to known_hosts
  grep -q "github.com" "$HOME/.ssh/known_hosts" 2>/dev/null || \
    ssh-keyscan -H github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null || true

  # Test connection
  if ssh -T -o BatchMode=yes -o ConnectTimeout=5 git@github.com 2>&1 | grep -qi "successfully\|Hi " > /dev/null 2>&1; then
    log_ok "GitHub SSH OK"
    return 0
  fi

  # Print pub key for user to add
  echo ""
  log_warn "=============================================================="
  log_warn "Add this SSH public key to GitHub Deploy Keys:"
  log_warn "  Repo -> Settings -> Deploy Keys -> Add deploy key"
  log_warn "=============================================================="
  cat "$HOME/.ssh/id_ed25519.pub"
  log_warn "=============================================================="
  echo ""
  read -r -p "Press Enter after adding the key (or type 'skip'): " _
  [[ "$_" == "skip" ]] && return 1

  # Verify
  local retry=0
  while [[ $retry -lt 10 ]]; do
    if ssh -T -o BatchMode=yes -o ConnectTimeout=5 git@github.com 2>&1 | grep -qi "successfully\|Hi " > /dev/null 2>&1; then
      log_ok "GitHub SSH verified"
      return 0
    fi
    ((retry++))
    sleep 2
  done
  log_warn "SSH verify timed out, continuing anyway"
  return 1
}

# ===========================================================================
# Fetch source
# ===========================================================================
fetch_source() {
  local repo_url="${1:-$DEFAULT_GIT_REPO_URL}"
  local branch="${2:-$DEFAULT_GIT_BRANCH}"
  local target_dir="$3"

  mkdir -p "$target_dir"

  if [[ -d "$target_dir/.git" ]]; then
    cd "$target_dir"
    log_info "Updating existing repo..."
    git fetch --all
    local dirty=$(git status --porcelain | wc -l)
    [[ "$dirty" -gt 0 ]] && git stash --include-untracked
    git checkout "$branch"
    git pull origin "$branch"
    [[ "$dirty" -gt 0 ]] && git stash pop 2>/dev/null || true
  else
    log_info "Cloning $repo_url ($branch)..."
    git clone --depth 1 --branch "$branch" "$repo_url" "$target_dir"
  fi

  cd "$target_dir"
  log_ok "Source: $(git log -1 --format='%h %s')"
}

# ===========================================================================
# Build & deploy
# ===========================================================================
install_deps() {
  cd "$DEPLOY_DIR"
  log_info "Installing npm dependencies..."
  pnpm install --frozen-lockfile 2>&1
  log_ok "Dependencies ready"
}

run_migrations() {
  local dir="$DEPLOY_DIR/database/migrations"
  [[ ! -d "$dir" ]] && return

  cd "$dir"

  # DDL baseline
  [[ -f "bs_exp_data.sql" ]] && {
    log_info "Running DDL baseline..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "bs_exp_data.sql" 2>/dev/null || \
      log_warn "Baseline may have existing tables (ok)"
  }

  # Incremental migrations
  for f in $(ls [0-9]*.sql 2>/dev/null | sort); do
    log_info "Migration: $f"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$f" 2>/dev/null || \
      log_warn "$f failed, continuing"
  done

  log_ok "Migrations done"
}

build_frontend() {
  cd "$DEPLOY_DIR"
  log_info "Building frontend (Next.js SSR)..."
  export NODE_OPTIONS="--max-old-space-size=4096"

  if ! pnpm build 2>&1; then
    log_warn "Retrying build after cache clear..."
    rm -rf "$DEPLOY_DIR/frontend/.next/cache" 2>/dev/null || true
    pnpm build
  fi

  [[ -d "$DEPLOY_DIR/frontend/.next" ]] && \
    log_ok "Build OK ($(du -sh "$DEPLOY_DIR/frontend/.next" | cut -f1))" || \
    { log_error "Build failed"; exit 1; }
}

setup_systemd() {
  log_info "Configuring systemd services..."

  cat > /etc/systemd/system/bslab-backend.service << UNIT
[Unit]
Description=BS-Lab Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${DEPLOY_DIR}/backend
EnvironmentFile=${DEPLOY_DIR}/.env.local
Environment=NODE_ENV=production
ExecStart=/usr/bin/node --experimental-strip-types src/http/server.ts
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
UNIT

  cat > /etc/systemd/system/bslab-frontend.service << UNIT
[Unit]
Description=BS-Lab Frontend
After=network.target bslab-backend.service
Wants=bslab-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=${DEPLOY_DIR}/frontend
EnvironmentFile=${DEPLOY_DIR}/.env.local
Environment=NODE_ENV=production
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -p ${FRONTEND_PORT:-$DEFAULT_FRONTEND_PORT}
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
UNIT

  systemctl daemon-reload
  log_ok "systemd services ready"
}

setup_nginx() {
  [[ "${SKIP_NGINX:-}" == "true" ]] && return

  log_info "Configuring Nginx..."

  local ssl_dir="/etc/nginx/ssl/bslab"
  mkdir -p "$ssl_dir"

  if [[ ! -f "$ssl_dir/fullchain.pem" ]]; then
    log_info "Generating self-signed SSL (365 days)..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout "$ssl_dir/privkey.pem" \
      -out "$ssl_dir/fullchain.pem" \
      -subj "/CN=$SERVER_DOMAIN" 2>/dev/null
  fi

  cat > /etc/nginx/sites-available/bslab.conf << NGINX
server {
    listen 80;
    server_name ${SERVER_DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name ${SERVER_DOMAIN};

    ssl_certificate ${ssl_dir}/fullchain.pem;
    ssl_certificate_key ${ssl_dir}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;

    client_max_body_size 500M;

    location /v2/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT:-$DEFAULT_BACKEND_PORT}/v2/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Cookie \$http_cookie;
        proxy_pass_header Set-Cookie;
        proxy_read_timeout 120s;
    }

    location / {
        proxy_pass http://127.0.0.1:${FRONTEND_PORT:-$DEFAULT_FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }

    location /uploads/ {
        alias ${DEPLOY_DIR}/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;
    gzip_min_length 1000;
    gzip_vary on;

    access_log /var/log/nginx/bslab-access.log;
    error_log /var/log/nginx/bslab-error.log;
}
NGINX

  rm -f /etc/nginx/sites-enabled/default
  ln -sf /etc/nginx/sites-available/bslab.conf /etc/nginx/sites-enabled/

  if nginx -t 2>&1; then
    systemctl reload nginx
    log_ok "Nginx configured"
  else
    log_warn "Nginx config test failed, check manually"
  fi
}

start_services() {
  log_info "Starting all services..."

  systemctl enable bslab-backend 2>/dev/null || true
  systemctl enable bslab-frontend 2>/dev/null || true
  systemctl enable nginx 2>/dev/null || true

  systemctl restart bslab-backend || log_error "Backend failed, see: journalctl -xu bslab-backend -n 50"
  sleep 3
  systemctl restart bslab-frontend || log_error "Frontend failed, see: journalctl -xu bslab-frontend -n 50"
  systemctl restart nginx 2>/dev/null || true

  systemctl is-active bslab-backend > /dev/null 2>&1 && log_ok "Backend: running" || log_error "Backend: down"
  systemctl is-active bslab-frontend > /dev/null 2>&1 && log_ok "Frontend: running" || log_error "Frontend: down"
  systemctl is-active nginx > /dev/null 2>&1 && log_ok "Nginx: running" || log_error "Nginx: down"
}

# ===========================================================================
# Save deploy config
# ===========================================================================
save_deploy_conf() {
  cat > "$DEPLOY_DIR/$DEPLOY_CONF" << EOF
GIT_REPO_URL=${GIT_REPO_URL:-$DEFAULT_GIT_REPO_URL}
GIT_BRANCH=${GIT_BRANCH:-$DEFAULT_GIT_BRANCH}
SERVER_DOMAIN=${SERVER_DOMAIN}
FRONTEND_PORT=${FRONTEND_PORT:-$DEFAULT_FRONTEND_PORT}
BACKEND_PORT=${BACKEND_PORT:-$DEFAULT_BACKEND_PORT}
SKIP_NGINX=${SKIP_NGINX:-false}
EOF
  log_info "Saved: $DEPLOY_DIR/$DEPLOY_CONF"
}

load_deploy_conf() {
  local f="$1/$DEPLOY_CONF"
  [[ -f "$f" ]] && source "$f" || true
}

# ===========================================================================
# Main deploy
# ===========================================================================
do_deploy() {
  log_step "1/6: System dependencies"
  apt-get update -qq
  if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
  fi
  if ! command -v pnpm &>/dev/null; then
    npm install -g pnpm
  fi
  apt-get install -y nginx git ffmpeg openssl rsync curl 2>/dev/null || true
  ensure_mysql_client
  log_ok "Node: $(node -v) | pnpm: $(pnpm -v)"

  log_step "2/6: Fetch source code"
  ensure_git_ssh || true
  fetch_source "$GIT_REPO_URL" "$GIT_BRANCH" "$DEPLOY_DIR"

  log_step "3/6: Install dependencies"
  install_deps

  log_step "4/6: Database migrations"
  run_migrations

  log_step "5/6: Build frontend"
  build_frontend

  log_step "6/6: Configure services"
  save_deploy_conf
  setup_systemd
  setup_nginx
  start_services

  echo ""
  echo -e "${GREEN}=============================="
  echo -e "  BS-Lab Deploy Complete"
  echo -e "==============================${NC}"
  echo ""
  echo "  https://${SERVER_DOMAIN}"
  echo ""
  echo "  Backend logs:  journalctl -fu bslab-backend"
  echo "  Frontend logs: journalctl -fu bslab-frontend"
  echo ""
}

# ===========================================================================
# --update mode
# ===========================================================================
do_update() {
  log_step "BS-Lab Update"

  # Determine deploy dir
  if [[ -z "${DEPLOY_DIR:-}" ]]; then
    for d in "$DEFAULT_DEPLOY_DIR" "/var/www/bs-lab" "/srv/bs-lab"; do
      if [[ -f "$d/.env.local" ]]; then
        DEPLOY_DIR="$d"
        load_deploy_conf "$d"
        break
      fi
    done
  fi

  if [[ -z "${DEPLOY_DIR:-}" || ! -d "$DEPLOY_DIR" ]]; then
    log_error "Usage: sudo DEPLOY_DIR=/path/to/deploy bash install.sh --update"
    exit 1
  fi

  # Read DB config from .env.local
  load_env_config "$DEPLOY_DIR/.env.local"

  cd "$DEPLOY_DIR"
  local old=$(git log -1 --format="%h %s" 2>/dev/null)

  git fetch --all
  local behind=$(git rev-list HEAD..origin/"$GIT_BRANCH" 2>/dev/null | wc -l)
  if [[ "$behind" -eq 0 ]]; then
    log_ok "Already up to date ($old)"
    return 0
  fi

  log_info "New commits: $behind"
  local dirty=$(git status --porcelain | wc -l)
  [[ "$dirty" -gt 0 ]] && git stash --include-untracked
  git checkout "$GIT_BRANCH"
  git pull origin "$GIT_BRANCH"
  [[ "$dirty" -gt 0 ]] && git stash pop 2>/dev/null || true

  local now=$(git log -1 --format="%h %s" 2>/dev/null)
  log_ok "Updated: $old -> $now"

  pnpm install --frozen-lockfile 2>&1
  run_migrations
  build_frontend
  start_services
}

# ===========================================================================
# --watch mode
# ===========================================================================
setup_watch() {
  log_step "Setting up auto-update timer"

  if [[ -z "${DEPLOY_DIR:-}" ]]; then
    DEPLOY_DIR="$DEFAULT_DEPLOY_DIR"
  fi

  if [[ ! -f "$DEPLOY_DIR/.env.local" ]]; then
    log_error "No .env.local in $DEPLOY_DIR, deploy first"
    exit 1
  fi

  load_deploy_conf "$DEPLOY_DIR"

  local script="$DEPLOY_DIR/bslab-watch.sh"
  cat > "$script" << 'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail
exec >> /var/log/bslab-watch.log 2>&1
echo "[$(date)] === auto-update check ==="

DIR="{{DEPLOY_DIR}}"
CONF="$DIR/bslab-deploy.conf"

[[ ! -f "$CONF" ]] && { echo "No conf"; exit 1; }
source "$CONF"

cd "$DIR"
git fetch --all
behind=$(git rev-list HEAD..origin/"$GIT_BRANCH" 2>/dev/null | wc -l)
[[ "$behind" -eq 0 ]] && { echo "Up to date"; exit 0; }

echo "New commits: $behind"
dirty=$(git status --porcelain | wc -l)
[[ "$dirty" -gt 0 ]] && git stash --include-untracked
git checkout "$GIT_BRANCH"
git pull origin "$GIT_BRANCH"
[[ "$dirty" -gt 0 ]] && git stash pop 2>/dev/null || true

pnpm install --frozen-lockfile 2>&1

# Migrations
source "$DIR/.env.local"
if command -v mysql &>/dev/null && [[ -n "${DB_HOST:-}" ]]; then
  for f in $(ls "$DIR/database/migrations"/[0-9]*.sql 2>/dev/null | sort); do
    mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "${DB_NAME:-bs_exp_data}" < "$f" 2>/dev/null || true
  done
fi

export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build 2>&1 || { rm -rf "$DIR/frontend/.next/cache" 2>/dev/null || true; pnpm build 2>&1; }

systemctl restart bslab-backend bslab-frontend nginx 2>/dev/null || true
echo "[OK] $(date)"
SCRIPT
  sed -i "s|{{DEPLOY_DIR}}|$DEPLOY_DIR|g" "$script"
  chmod +x "$script"

  local interval="${WATCH_INTERVAL:-$DEFAULT_WATCH_INTERVAL}"

  cat > /etc/systemd/system/bslab-watch.service << UNIT
[Unit]
Description=BS-Lab Auto Update
[Service]
Type=oneshot
ExecStart=/bin/bash $script
User=root
UNIT

  cat > /etc/systemd/system/bslab-watch.timer << UNIT
[Unit]
Description=BS-Lab Auto Update Timer
[Timer]
OnUnitActiveSec=${interval}
OnBootSec=120
Persistent=true
[Install]
WantedBy=timers.target
UNIT

  systemctl daemon-reload
  systemctl enable bslab-watch.timer 2>/dev/null || true
  systemctl restart bslab-watch.timer

  log_ok "Auto-update started (every ${interval}s)"
  log_info "Stop: sudo systemctl stop bslab-watch.timer && sudo systemctl disable bslab-watch.timer"
}

# ===========================================================================
# --status mode
# ===========================================================================
show_status() {
  local dir="${DEPLOY_DIR:-$DEFAULT_DEPLOY_DIR}"
  echo ""
  echo -e "${CYAN}=== BS-Lab Status ===${NC}"

  if [[ ! -f "$dir/.env.local" ]]; then
    echo -e "  ${YELLOW}No deployment found at $dir${NC}"
    exit 0
  fi

  echo "  Dir: $dir"
  if [[ -d "$dir/.git" ]]; then
    cd "$dir"
    echo "  Commit: $(git log -1 --format='%h %s' 2>/dev/null)"
    behind=$(git rev-list HEAD..origin/main 2>/dev/null | wc -l)
    [[ "$behind" -gt 0 ]] && echo -e "  ${YELLOW}Behind: ${behind} commits${NC}" || echo "  Sync: up to date"
  fi

  echo ""
  for svc in bslab-backend bslab-frontend nginx; do
    st=$(systemctl is-active "$svc" 2>/dev/null || echo "not found")
    echo "  $svc: $st"
  done

  if systemctl is-active bslab-watch.timer > /dev/null 2>&1; then
    echo -e "  ${GREEN}Auto-update: enabled${NC}"
  fi
}

# ===========================================================================
# Main
# ===========================================================================
main() {
  [[ $EUID -ne 0 ]] && { log_error "Run as root: sudo bash install.sh"; exit 1; }

  local mode="deploy"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --update|-u)    mode="update"; shift ;;
      --watch|-w)     mode="watch"; shift ;;
      --status|-s)    mode="status"; shift ;;
      --help|-h)      echo "Usage: sudo bash install.sh [--update|--watch|--status]"; exit 0 ;;
      *)              log_error "Unknown: $1"; exit 1 ;;
    esac
  done

  case "$mode" in
    status)
      show_status
      exit 0
      ;;
    watch)
      setup_watch
      exit 0
      ;;
    update)
      do_update
      exit 0
      ;;
    deploy)
      # Determine deploy dir
      DEPLOY_DIR="${DEPLOY_DIR:-$DEFAULT_DEPLOY_DIR}"

      # If .env.local already exists in deploy dir, read it
      if [[ -f "$DEPLOY_DIR/.env.local" ]]; then
        log_info "Found existing .env.local in $DEPLOY_DIR"
        load_env_config "$DEPLOY_DIR/.env.local"
        load_deploy_conf "$DEPLOY_DIR"
      fi

      # If SERVER_DOMAIN still empty, prompt once
      if [[ -z "${SERVER_DOMAIN:-}" ]]; then
        read -r -p "Server domain/IP (for Nginx): " SERVER_DOMAIN
        SERVER_DOMAIN="${SERVER_DOMAIN:-localhost}"
      fi

      # If GIT_REPO_URL still empty, use default
      GIT_REPO_URL="${GIT_REPO_URL:-$DEFAULT_GIT_REPO_URL}"
      GIT_BRANCH="${GIT_BRANCH:-$DEFAULT_GIT_BRANCH}"

      # If no DB config, exit
      if [[ -z "${DB_HOST:-}" ]]; then
        log_error "No .env.local found and no DB config available."
        log_error "Place .env.local in $DEPLOY_DIR first, then run this script."
        log_error "Or set DEPLOY_DIR=/path/to/dir bash install.sh"
        exit 1
      fi

      do_deploy
      exit 0
      ;;
  esac
}

main "$@"
