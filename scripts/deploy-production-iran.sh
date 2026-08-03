#!/usr/bin/env bash
# Mashoodwear production deploy — Iran / restricted network (ParsVDS etc.)
# No Docker Hub / NodeSource required. Uses apt MariaDB + Ubuntu Node + Liara npm mirror.
# Usage: sudo bash deploy-production-iran.sh [domain]
# Example: sudo bash deploy-production-iran.sh mashoodwear.ir

set -euo pipefail

DOMAIN="${1:-mashoodwear.ir}"
WWW_DOMAIN="www.${DOMAIN}"
APP_DIR="/opt/mashoodwear"
UPLOAD_DIR="/var/lib/mashoodwear/uploads"
REPO_URL="https://github.com/callmesallad/mashoodwear.git"
SERVICE_USER="www-data"
NPM_REGISTRY="https://package-mirror.liara.ir/repository/npm/"
DB_NAME="mashoodwear"
DB_USER="mashoodwear"
DB_PASS="mashoodwear_dev"

log() { echo "[deploy-iran] $*"; }
die() { echo "[deploy-iran] ERROR: $*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "Run as root: sudo bash $0 ${DOMAIN}"

export DEBIAN_FRONTEND=noninteractive

log "Installing system packages (apt mirror)..."
apt-get update -qq
apt-get install -y -qq curl git nginx ca-certificates mariadb-server mariadb-client

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 20 ]]; then
  log "Node.js 20+ required. Install from /root/node-v20.*.tar.xz if external mirrors are blocked."
  die "Upload node-v20.18.3-linux-x64.tar.xz to /root/ and re-run, or install Node 20 manually."
fi
log "Node $(node -v) / npm $(npm -v)"

log "Configuring MariaDB..."
systemctl enable --now mariadb
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';" 2>/dev/null || true
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost'; FLUSH PRIVILEGES;"

log "Cloning or updating app at ${APP_DIR}..."
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" fetch origin
  git -C "${APP_DIR}" reset --hard origin/master
else
  git clone "${REPO_URL}" "${APP_DIR}"
fi

log "Installing npm dependencies (Liara mirror)..."
cd "${APP_DIR}"
export NPM_CONFIG_REGISTRY="${NPM_REGISTRY}"
npm run install:all --loglevel=info
# jsdom 29+ pulls ESM-only deps that break on regional npm mirrors — pin compatible release
npm install jsdom@24.1.3 --prefix backend --save-exact --no-fund --no-audit

log "Preparing uploads directory..."
mkdir -p "${UPLOAD_DIR}"
chown -R "${SERVICE_USER}:${SERVICE_USER}" "${UPLOAD_DIR}"

ENV_FILE="${APP_DIR}/backend/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  JWT_SECRET="$(openssl rand -hex 32)"
  cat > "${ENV_FILE}" <<EOF
PORT=3001
NODE_ENV=production

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=8h

UPLOAD_DIR=${UPLOAD_DIR}
CORS_ORIGIN=https://${DOMAIN}
TRUST_PROXY=1
SITE_URL=https://${DOMAIN}

ADMIN_SEED_USERNAME=admin
ADMIN_SEED_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | head -c 16)
EOF
  chmod 600 "${ENV_FILE}"
  log "Created ${ENV_FILE} with generated secrets."
  log "Admin login: admin / $(grep ADMIN_SEED_PASSWORD "${ENV_FILE}" | cut -d= -f2)"
else
  sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=https://${DOMAIN}|" "${ENV_FILE}"
  sed -i "s|^SITE_URL=.*|SITE_URL=https://${DOMAIN}|" "${ENV_FILE}"
  grep -q '^TRUST_PROXY=' "${ENV_FILE}" && sed -i 's|^TRUST_PROXY=.*|TRUST_PROXY=1|' "${ENV_FILE}" || echo 'TRUST_PROXY=1' >> "${ENV_FILE}"
  grep -q '^NODE_ENV=' "${ENV_FILE}" && sed -i 's|^NODE_ENV=.*|NODE_ENV=production|' "${ENV_FILE}" || echo 'NODE_ENV=production' >> "${ENV_FILE}"
  grep -q "^UPLOAD_DIR=" "${ENV_FILE}" && sed -i "s|^UPLOAD_DIR=.*|UPLOAD_DIR=${UPLOAD_DIR}|" "${ENV_FILE}" || echo "UPLOAD_DIR=${UPLOAD_DIR}" >> "${ENV_FILE}"
  sed -i "s|^DB_HOST=.*|DB_HOST=127.0.0.1|" "${ENV_FILE}"
fi

log "Running database migrations..."
cd "${APP_DIR}"
npm run migrate || die "Database migration failed"

log "Building frontend..."
cd "${APP_DIR}/frontend"
npm run build

log "Installing systemd service..."
cat > /etc/systemd/system/mashoodwear-api.service <<EOF
[Unit]
Description=Mashoodwear API (Express)
After=network.target mariadb.service
Wants=mariadb.service

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${ENV_FILE}
ExecStart=/usr/local/bin/node src/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}/backend" "${APP_DIR}/frontend/dist"
systemctl daemon-reload
systemctl enable mashoodwear-api
systemctl restart mashoodwear-api

log "Configuring nginx..."
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

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/mashoodwear /etc/nginx/sites-enabled/mashoodwear
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

if ! command -v certbot >/dev/null 2>&1; then
  log "Installing Certbot..."
  apt-get install -y -qq certbot python3-certbot-nginx || log "Certbot install failed — HTTP only until TLS is configured manually."
fi

if command -v certbot >/dev/null 2>&1; then
  log "Requesting TLS certificate..."
  if certbot --nginx -d "${DOMAIN}" -d "${WWW_DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>/dev/null; then
    log "HTTPS enabled via Certbot."
  else
    log "Certbot failed — ensure DNS A record for ${DOMAIN} points to this server. Site works on HTTP for now."
  fi
fi

log "Health check..."
for _ in $(seq 1 15); do
  if curl -fsS "http://127.0.0.1:3001/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
curl -fsS "http://127.0.0.1:3001/api/health" || die "API health check failed"
systemctl --no-pager status mashoodwear-api | head -5

log "Deploy complete."
log "Site: http://${DOMAIN} (HTTPS if Certbot succeeded)"
log "Admin: http://${DOMAIN}/admin"
if [[ -f "${ENV_FILE}" ]] && grep -q ADMIN_SEED_PASSWORD "${ENV_FILE}"; then
  log "Admin password: $(grep ADMIN_SEED_PASSWORD "${ENV_FILE}" | cut -d= -f2)"
fi
