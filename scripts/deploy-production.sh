#!/usr/bin/env bash
# Mashoodwear production deploy — Ubuntu/Debian
# Usage: sudo bash deploy-production.sh [domain]
# Example: sudo bash deploy-production.sh mashoodwear.ir

set -euo pipefail

DOMAIN="${1:-mashoodwear.ir}"
WWW_DOMAIN="www.${DOMAIN}"
APP_DIR="/opt/mashoodwear"
UPLOAD_DIR="/var/lib/mashoodwear/uploads"
REPO_URL="https://github.com/callmesallad/mashoodwear.git"
SERVICE_USER="www-data"
NODE_MAJOR="20"

log() { echo "[deploy] $*"; }
die() { echo "[deploy] ERROR: $*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "Run as root: sudo bash $0 ${DOMAIN}"

export DEBIAN_FRONTEND=noninteractive

log "Installing system packages..."
apt-get update -qq
apt-get install -y -qq curl git nginx ca-certificates gnupg lsb-release

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt "${NODE_MAJOR}" ]]; then
  log "Installing Node.js ${NODE_MAJOR}.x..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
fi

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
fi

if ! command -v certbot >/dev/null 2>&1; then
  log "Installing Certbot..."
  apt-get install -y -qq certbot python3-certbot-nginx
fi

log "Cloning or updating app at ${APP_DIR}..."
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" fetch origin
  git -C "${APP_DIR}" reset --hard origin/master
else
  git clone "${REPO_URL}" "${APP_DIR}"
fi

log "Installing npm dependencies..."
cd "${APP_DIR}"
# Lockfiles created behind regional mirrors must not block deploy on other networks
for lock in backend/package-lock.json frontend/package-lock.json; do
  if [[ -f "${lock}" ]] && grep -q 'package-mirror.liara.ir' "${lock}"; then
    sed -i 's|https://package-mirror.liara.ir/repository/npm/|https://registry.npmjs.org/|g' "${lock}"
  fi
done
export NPM_CONFIG_REGISTRY="${NPM_CONFIG_REGISTRY:-https://registry.npmjs.org/}"
npm run install:all --loglevel=info

log "Preparing uploads directory..."
mkdir -p "${UPLOAD_DIR}"
chown -R "${SERVICE_USER}:${SERVICE_USER}" "${UPLOAD_DIR}"

wait_for_mysql() {
  log "Waiting for MySQL to accept queries..."
  for _ in $(seq 1 60); do
    if docker compose -f "${APP_DIR}/docker-compose.yml" exec -T mysql \
        mysql -u mashoodwear -pmashoodwear_dev mashoodwear -e "SELECT 1" >/dev/null 2>&1; then
      log "MySQL ready."
      return 0
    fi
    sleep 2
  done
  die "MySQL not ready after 120s — check: docker compose -f ${APP_DIR}/docker-compose.yml logs mysql"
}

log "Starting MySQL (Docker)..."
docker compose -f "${APP_DIR}/docker-compose.yml" up -d
wait_for_mysql

ENV_FILE="${APP_DIR}/backend/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  JWT_SECRET="$(openssl rand -hex 32)"
  cat > "${ENV_FILE}" <<EOF
PORT=3001
NODE_ENV=production

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=mashoodwear
DB_USER=mashoodwear
DB_PASS=mashoodwear_dev

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
  # Ensure production URLs match domain even on redeploy
  sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=https://${DOMAIN}|" "${ENV_FILE}"
  sed -i "s|^SITE_URL=.*|SITE_URL=https://${DOMAIN}|" "${ENV_FILE}"
  grep -q '^TRUST_PROXY=' "${ENV_FILE}" && sed -i 's|^TRUST_PROXY=.*|TRUST_PROXY=1|' "${ENV_FILE}" || echo 'TRUST_PROXY=1' >> "${ENV_FILE}"
  grep -q '^NODE_ENV=' "${ENV_FILE}" && sed -i 's|^NODE_ENV=.*|NODE_ENV=production|' "${ENV_FILE}" || echo 'NODE_ENV=production' >> "${ENV_FILE}"
  grep -q "^UPLOAD_DIR=" "${ENV_FILE}" && sed -i "s|^UPLOAD_DIR=.*|UPLOAD_DIR=${UPLOAD_DIR}|" "${ENV_FILE}" || echo "UPLOAD_DIR=${UPLOAD_DIR}" >> "${ENV_FILE}"
fi

log "Running database migrations..."
cd "${APP_DIR}"
npm run migrate || die "Database migration failed — fix errors above before starting API"

if ! docker compose -f "${APP_DIR}/docker-compose.yml" exec -T mysql \
    mysql -u mashoodwear -pmashoodwear_dev mashoodwear -N -e "SHOW TABLES LIKE 'admins';" 2>/dev/null | grep -q '^admins$'; then
  die "admins table missing after migrate — database schema incomplete"
fi

log "Building frontend..."
cd "${APP_DIR}/frontend"
npm run build

log "Installing systemd service..."
cat > /etc/systemd/system/mashoodwear-api.service <<EOF
[Unit]
Description=Mashoodwear API (Express)
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${ENV_FILE}
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}/backend" "${APP_DIR}/frontend/dist"
systemctl daemon-reload
systemctl enable mashoodwear-api
systemctl restart mashoodwear-api

log "Configuring nginx (HTTP first for Certbot)..."
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

log "Requesting TLS certificate..."
if certbot --nginx -d "${DOMAIN}" -d "${WWW_DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
  log "HTTPS enabled via Certbot."
else
  log "Certbot failed — check DNS A record for ${DOMAIN} -> this server. Site may work on HTTP only."
fi

log "Health check..."
for _ in $(seq 1 15); do
  if curl -fsS "http://127.0.0.1:3001/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
curl -fsS "http://127.0.0.1:3001/api/health" || die "API health check failed after restart"
systemctl --no-pager status mashoodwear-api | head -5

log "Deploy complete."
log "Site: https://${DOMAIN}"
log "Admin: https://${DOMAIN}/admin"
if [[ -f "${ENV_FILE}" ]] && grep -q ADMIN_SEED_PASSWORD "${ENV_FILE}"; then
  log "Admin password (change after first login): $(grep ADMIN_SEED_PASSWORD "${ENV_FILE}" | cut -d= -f2)"
fi
