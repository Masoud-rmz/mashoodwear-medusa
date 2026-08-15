#!/usr/bin/env bash
# Dual-stack production deploy for Iran VPS (monorepo):
#   - mashoodwear-medusa at /opt/mashoodwear
#   - Medusa Iran Pack at /opt/mashoodwear/apps/medusa (:9000)
#   - CMS Express at /opt/mashoodwear/backend (:3001)
#   - Vite UI at /opt/mashoodwear/frontend/dist
# Usage (as root):
#   bash deploy-dual-stack-iran.sh mashoodwear.ir
# Optional env:
#   UI_REPO_URL=https://github.com/callmesallad/mashoodwear-medusa.git
#   MEDUSA_TARBALL=...   # legacy fallback only (copies into apps/medusa)
#   SKIP_UI_CUTOVER=1    # install Medusa from monorepo/tarball; leave old site if present
#   SITE_SCHEME=http

set -euo pipefail

DOMAIN="${1:-mashoodwear.ir}"
WWW_DOMAIN="www.${DOMAIN}"
SITE_SCHEME="${SITE_SCHEME:-http}"
SITE_ORIGIN="${SITE_SCHEME}://${DOMAIN}"

APP_DIR="/opt/mashoodwear"
MEDUSA_DIR="${APP_DIR}/apps/medusa"
UPLOAD_DIR="/var/lib/mashoodwear/uploads"
SERVICE_USER="www-data"
NPM_REGISTRY="https://package-mirror.liara.ir/repository/npm/"
UI_REPO_URL="${UI_REPO_URL:-https://github.com/callmesallad/mashoodwear-medusa.git}"
MEDUSA_REPO_URL="${MEDUSA_REPO_URL:-}"
MEDUSA_TARBALL="${MEDUSA_TARBALL:-}"
SKIP_UI_CUTOVER="${SKIP_UI_CUTOVER:-0}"

DB_NAME_CMS="mashoodwear"
DB_USER_CMS="mashoodwear"
DB_PASS_CMS="${DB_PASS_CMS:-mashoodwear_dev}"

PG_DB="medusa_store"
PG_USER="medusa"
PG_PASS="${PG_PASS:-}"

log() { echo "[dual-stack] $*"; }
die() { echo "[dual-stack] ERROR: $*" >&2; exit 1; }
need_cmd() { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

[[ "$(id -u)" -eq 0 ]] || die "Run as root: sudo bash $0 ${DOMAIN}"
need_cmd node
need_cmd npm
need_cmd curl
need_cmd tar
need_cmd openssl

NODE_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
[[ "${NODE_MAJOR}" -ge 20 ]] || die "Node 20+ required (found $(node -v))"

export DEBIAN_FRONTEND=noninteractive
export NPM_CONFIG_REGISTRY="${NPM_REGISTRY}"

log "Installing apt packages..."
apt-get update -qq
apt-get install -y -qq curl git nginx ca-certificates \
  mariadb-server mariadb-client \
  postgresql postgresql-contrib redis-server

systemctl enable --now postgresql redis-server mariadb nginx

if [[ -z "${PG_PASS}" ]]; then
  PG_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 28)"
fi

log "Preparing Postgres role/db..."
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${PG_USER}') THEN
    CREATE ROLE ${PG_USER} LOGIN PASSWORD '${PG_PASS}';
  ELSE
    ALTER ROLE ${PG_USER} PASSWORD '${PG_PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${PG_DB} OWNER ${PG_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${PG_DB}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${PG_DB} TO ${PG_USER};
SQL
sudo -u postgres psql -d "${PG_DB}" -c "GRANT ALL ON SCHEMA public TO ${PG_USER};"
redis-cli ping | grep -qi PONG || die "Redis not responding"

log "Preparing MariaDB for CMS..."
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME_CMS} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER_CMS}'@'localhost' IDENTIFIED BY '${DB_PASS_CMS}';" 2>/dev/null || true
mysql -e "ALTER USER '${DB_USER_CMS}'@'localhost' IDENTIFIED BY '${DB_PASS_CMS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME_CMS}.* TO '${DB_USER_CMS}'@'localhost'; FLUSH PRIVILEGES;"

install_medusa_from_tarball_into_apps() {
  # purpose --- legacy fallback when monorepo apps/medusa is missing ---
  local tarball="$1"
  [[ -f "${tarball}" ]] || die "Medusa tarball not found: ${tarball}"
  mkdir -p "${APP_DIR}/apps" /tmp/medusa-extract
  rm -rf /tmp/medusa-extract/* "${MEDUSA_DIR}"
  tar -xzf "${tarball}" -C /tmp/medusa-extract
  if [[ -d /tmp/medusa-extract/apps/medusa ]]; then
    mv /tmp/medusa-extract/apps/medusa "${MEDUSA_DIR}"
  elif [[ -d /tmp/medusa-extract/apps/backend ]]; then
    mv /tmp/medusa-extract/apps/backend "${MEDUSA_DIR}"
  elif [[ -d /tmp/medusa-extract/my-medusa-store/apps/backend ]]; then
    mv /tmp/medusa-extract/my-medusa-store/apps/backend "${MEDUSA_DIR}"
  elif [[ -f /tmp/medusa-extract/package.json ]] && [[ -f /tmp/medusa-extract/medusa-config.ts ]]; then
    mv /tmp/medusa-extract "${MEDUSA_DIR}"
  else
    die "Unexpected tarball layout under /tmp/medusa-extract"
  fi
  rm -rf /tmp/medusa-extract
}

log "Safety backup of current /opt/mashoodwear before monorepo deploy..."
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "/root/backups/pre-cutover-${STAMP}"
if [[ -d "${APP_DIR}" ]]; then
  tar -C /opt -czf "/root/backups/pre-cutover-${STAMP}/mashoodwear-app.tar.gz" mashoodwear || true
fi
mysqldump --single-transaction --routines --triggers "${DB_NAME_CMS}" 2>/dev/null \
  | gzip > "/root/backups/pre-cutover-${STAMP}/mashoodwear-db.sql.gz" || true

PREV_ENV=""
if [[ -f "${APP_DIR}/backend/.env" ]]; then
  PREV_ENV="$(mktemp)"
  cp -a "${APP_DIR}/backend/.env" "${PREV_ENV}"
fi

log "Deploying monorepo → ${APP_DIR}"
systemctl stop mashoodwear-api || true
systemctl stop medusa-api || true
rm -rf "${APP_DIR}"
git clone "${UI_REPO_URL}" "${APP_DIR}"

if [[ ! -d "${MEDUSA_DIR}" ]]; then
  log "apps/medusa missing in clone — trying legacy tarball..."
  if [[ -n "${MEDUSA_TARBALL}" ]]; then
    install_medusa_from_tarball_into_apps "${MEDUSA_TARBALL}"
  elif ls /root/medusa-iran-pack-backup-*.tar.gz >/dev/null 2>&1; then
    install_medusa_from_tarball_into_apps "$(ls -1t /root/medusa-iran-pack-backup-*.tar.gz | head -1)"
  else
    die "Monorepo missing apps/medusa and no MEDUSA_TARBALL available"
  fi
fi

log "npm install monorepo (Liara mirror)..."
cd "${APP_DIR}"
npm install --no-fund --no-audit
npm install jsdom@24.1.3 --prefix backend --save-exact --no-fund --no-audit || true

MEDUSA_ENV="${MEDUSA_DIR}/.env"
JWT_SECRET="$(openssl rand -hex 32)"
COOKIE_SECRET="$(openssl rand -hex 32)"
MFA_KEY="$(openssl rand -hex 32)"
PHONE_JWT="$(openssl rand -hex 32)"
BANK_SECRET="$(openssl rand -hex 24)"
# URL-encode password for DATABASE_URL (basic)
PG_PASS_ENC="$(python3 - <<PY
import urllib.parse
print(urllib.parse.quote('''${PG_PASS}''', safe=''))
PY
)"

cat > "${MEDUSA_ENV}" <<EOF
NODE_ENV=production
MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs

STORE_CORS=${SITE_ORIGIN}
ADMIN_CORS=${SITE_ORIGIN}
AUTH_CORS=${SITE_ORIGIN}

REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}
AUTH_MFA_ENCRYPTION_KEY=${MFA_KEY}
DATABASE_URL=postgresql://${PG_USER}:${PG_PASS_ENC}@127.0.0.1:5432/${PG_DB}
DB_NAME=${PG_DB}

IRAN_BANK_ADAPTER=stub
IRAN_BANK_MERCHANT_ID=stub-merchant
IRAN_BANK_TERMINAL_ID=stub-terminal
IRAN_BANK_SECRET_KEY=${BANK_SECRET}
IRAN_BANK_CALLBACK_BASE_URL=${SITE_ORIGIN}

PHONE_AUTH_JWT_SECRET=${PHONE_JWT}
SMS_IR_STUB=1
# purpose --- Certbot often blocked in Iran; allow http origins until TLS works ---
CORS_PRODUCTION_GUARD=0
EOF
chmod 600 "${MEDUSA_ENV}"
mkdir -p /root/backups
umask 077
cat > /root/backups/medusa-pg-credentials.txt <<EOF
PG_USER=${PG_USER}
PG_PASS=${PG_PASS}
PG_DB=${PG_DB}
DATABASE_URL=postgresql://${PG_USER}:${PG_PASS_ENC}@127.0.0.1:5432/${PG_DB}
EOF
chmod 600 /root/backups/medusa-pg-credentials.txt
log "Postgres credentials saved to /root/backups/medusa-pg-credentials.txt"

log "Medusa db:migrate (+ Iran seed scripts)..."
cd "${MEDUSA_DIR}"
npx medusa db:migrate

log "Building Medusa..."
npm run build || log "WARNING: medusa build exited non-zero — checking admin assets..."
# purpose --- medusa start looks for ./public/admin relative to apps/medusa cwd ---
mkdir -p public
if [[ -d .medusa/server/public/admin ]]; then
  rm -rf public/admin
  cp -a .medusa/server/public/admin public/admin
fi
[[ -f public/admin/index.html ]] || log "WARNING: public/admin/index.html missing after build"

log "Creating publishable API key..."
PK_OUT="$(npx medusa exec ./src/scripts/create-publishable-key.ts 2>&1 || true)"
echo "${PK_OUT}"
PUBLISHABLE_KEY="$(echo "${PK_OUT}" | sed -n 's/^Token: //p' | tail -1)"
if [[ -z "${PUBLISHABLE_KEY}" ]]; then
  PUBLISHABLE_KEY="pk_REPLACE_AFTER_ADMIN_LOGIN"
  log "WARNING: could not parse publishable key — set manually in frontend/.env before rebuild"
fi
echo "${PUBLISHABLE_KEY}" > /root/backups/medusa-publishable-key.txt
chmod 600 /root/backups/medusa-publishable-key.txt

NODE_BIN="$(command -v node)"
MEDUSA_CLI="${APP_DIR}/node_modules/@medusajs/cli/cli.js"
if [[ ! -f "${MEDUSA_CLI}" ]]; then
  MEDUSA_CLI="${MEDUSA_DIR}/node_modules/@medusajs/cli/cli.js"
fi
[[ -f "${MEDUSA_CLI}" ]] || die "Medusa CLI not found after npm install"

cat > /etc/systemd/system/medusa-api.service <<EOF
[Unit]
Description=Mashoodwear Medusa Iran Pack
After=network.target postgresql.service redis-server.service
Wants=postgresql.service redis-server.service

[Service]
Type=simple
User=root
WorkingDirectory=${MEDUSA_DIR}
EnvironmentFile=${MEDUSA_ENV}
Environment=NODE_ENV=production
ExecStart=${NODE_BIN} ${MEDUSA_CLI} start
Restart=on-failure
RestartSec=8
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable medusa-api
systemctl restart medusa-api

log "Waiting for Medusa :9000..."
ok=0
for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:9000/health" >/dev/null 2>&1 \
    || curl -fsS "http://127.0.0.1:9000/store/regions" -H "x-publishable-api-key: ${PUBLISHABLE_KEY}" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 3
done
[[ "${ok}" -eq 1 ]] || log "WARNING: Medusa health not confirmed yet — check journalctl -u medusa-api -n 80"

if [[ "${SKIP_UI_CUTOVER}" == "1" ]]; then
  log "SKIP_UI_CUTOVER=1 — Medusa installed from monorepo; CMS/UI systemd skipped."
  log "Done (Medusa only)."
  exit 0
fi

mkdir -p "${UPLOAD_DIR}"
chown -R "${SERVICE_USER}:${SERVICE_USER}" "${UPLOAD_DIR}"

CMS_ENV="${APP_DIR}/backend/.env"
if [[ -n "${PREV_ENV}" && -f "${PREV_ENV}" ]]; then
  cp -a "${PREV_ENV}" "${CMS_ENV}"
  rm -f "${PREV_ENV}"
  sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=${SITE_ORIGIN}|" "${CMS_ENV}" || true
  sed -i "s|^SITE_URL=.*|SITE_URL=${SITE_ORIGIN}|" "${CMS_ENV}" || true
  grep -q '^TRUST_PROXY=' "${CMS_ENV}" && sed -i 's|^TRUST_PROXY=.*|TRUST_PROXY=1|' "${CMS_ENV}" || echo 'TRUST_PROXY=1' >> "${CMS_ENV}"
  grep -q '^NODE_ENV=' "${CMS_ENV}" && sed -i 's|^NODE_ENV=.*|NODE_ENV=production|' "${CMS_ENV}" || echo 'NODE_ENV=production' >> "${CMS_ENV}"
else
  JWT_CMS="$(openssl rand -hex 32)"
  cat > "${CMS_ENV}" <<EOF
PORT=3001
NODE_ENV=production
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=${DB_NAME_CMS}
DB_USER=${DB_USER_CMS}
DB_PASS=${DB_PASS_CMS}
JWT_SECRET=${JWT_CMS}
JWT_EXPIRES_IN=8h
UPLOAD_DIR=${UPLOAD_DIR}
CORS_ORIGIN=${SITE_ORIGIN}
TRUST_PROXY=1
SITE_URL=${SITE_ORIGIN}
ADMIN_SEED_USERNAME=admin
ADMIN_SEED_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | head -c 16)
EOF
fi
chmod 600 "${CMS_ENV}"

cat > "${APP_DIR}/frontend/.env" <<EOF
VITE_MEDUSA_BACKEND_URL=${SITE_ORIGIN}
VITE_MEDUSA_PUBLISHABLE_KEY=${PUBLISHABLE_KEY}
VITE_MEDUSA_DEFAULT_COUNTRY=ir
VITE_MEDUSA_ADMIN_URL=${SITE_ORIGIN}/app
VITE_COMMERCE_PROVIDER=medusa
EOF

log "CMS migrate + frontend build..."
cd "${APP_DIR}"
npm run migrate || die "CMS migrate failed"
npm run build || die "Frontend build failed"

cat > /etc/systemd/system/mashoodwear-api.service <<EOF
[Unit]
Description=Mashoodwear CMS API (Express)
After=network.target mariadb.service
Wants=mariadb.service

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${CMS_ENV}
ExecStart=${NODE_BIN} src/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}/backend" "${APP_DIR}/frontend/dist"
systemctl daemon-reload
systemctl enable mashoodwear-api
systemctl restart mashoodwear-api

log "Writing nginx dual-stack config..."
cat > /etc/nginx/sites-available/mashoodwear <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    root ${APP_DIR}/frontend/dist;
    index index.html;
    client_max_body_size 6M;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /sitemap.xml {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /store/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /auth/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /app {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /hooks/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # purpose --- SPA shell must not stick after Medusa cutover (stale Lookbook UI) ---
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/mashoodwear /etc/nginx/sites-enabled/mashoodwear
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

log "Health checks..."
curl -fsS "http://127.0.0.1:3001/api/health" || die "CMS health failed"
systemctl --no-pager status mashoodwear-api | head -6
systemctl --no-pager status medusa-api | head -6

log "Deploy complete."
log "Site: ${SITE_ORIGIN}"
log "Brand CMS: ${SITE_ORIGIN}/cms"
log "Medusa admin: ${SITE_ORIGIN}/app"
log "Publishable key file: /root/backups/medusa-publishable-key.txt"
log "Rollback old UI: bash /root/restore-mashoodwear-from-backup.sh /root/backups/mashoodwear-20260803-201145 && systemctl stop medusa-api"
