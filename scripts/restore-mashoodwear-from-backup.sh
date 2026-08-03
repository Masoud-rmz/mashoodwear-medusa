#!/usr/bin/env bash
# Restore the previous Mashoodwear production site from a backup created on this server.
# Safe rollback after a failed cutover to mashoodwear-medusa.
#
# Usage (as root on the server):
#   bash /root/restore-mashoodwear-from-backup.sh /root/backups/mashoodwear-20260803-201145
#
# What it restores:
#   - /opt/mashoodwear (app code + backend/.env)
#   - /var/lib/mashoodwear/uploads
#   - MariaDB database `mashoodwear`
#   - nginx site + systemd unit (if present in backup/config)
#
# Does NOT touch: unrelated databases, SSL certs under /etc/letsencrypt (kept as-is).

set -euo pipefail

BACKUP_DIR="${1:-}"
APP_DIR="/opt/mashoodwear"
UPLOAD_DIR="/var/lib/mashoodwear/uploads"
DB_NAME="mashoodwear"
SERVICE_NAME="mashoodwear-api"

log() { echo "[restore-mashoodwear] $*"; }
die() { echo "[restore-mashoodwear] ERROR: $*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "Run as root."
[[ -n "${BACKUP_DIR}" ]] || die "Usage: $0 /root/backups/mashoodwear-YYYYMMDD-HHMMSS"
[[ -d "${BACKUP_DIR}" ]] || die "Backup dir not found: ${BACKUP_DIR}"
[[ -f "${BACKUP_DIR}/mashoodwear-app.tar.gz" ]] || die "Missing mashoodwear-app.tar.gz"
[[ -f "${BACKUP_DIR}/mashoodwear-db.sql.gz" ]] || die "Missing mashoodwear-db.sql.gz"

if [[ -f "${BACKUP_DIR}/MANIFEST.txt" ]]; then
  log "Manifest:"
  cat "${BACKUP_DIR}/MANIFEST.txt"
  echo
fi

read -r -p "This will STOP ${SERVICE_NAME}, replace ${APP_DIR}, restore DB ${DB_NAME}, and restart. Type YES to continue: " CONFIRM
[[ "${CONFIRM}" == "YES" ]] || die "Aborted (confirmation was not YES)."

log "Stopping ${SERVICE_NAME}..."
systemctl stop "${SERVICE_NAME}" || true

STAMP="$(date +%Y%m%d-%H%M%S)"
PRE_RESTORE="/root/backups/pre-restore-${STAMP}"
mkdir -p "${PRE_RESTORE}"
log "Safety snapshot of current tree → ${PRE_RESTORE}"
if [[ -d "${APP_DIR}" ]]; then
  tar -C /opt -czf "${PRE_RESTORE}/mashoodwear-app-before-restore.tar.gz" mashoodwear || true
fi
if systemctl is-active --quiet mariadb || systemctl is-active --quiet mysql; then
  mysqldump --single-transaction --routines --triggers "${DB_NAME}" 2>/dev/null \
    | gzip > "${PRE_RESTORE}/mashoodwear-db-before-restore.sql.gz" || true
fi

log "Replacing ${APP_DIR}..."
rm -rf "${APP_DIR}"
mkdir -p /opt
tar -C /opt -xzf "${BACKUP_DIR}/mashoodwear-app.tar.gz"
[[ -d "${APP_DIR}" ]] || die "Extract failed — ${APP_DIR} missing after tar."

if [[ -f "${BACKUP_DIR}/mashoodwear-uploads.tar.gz" ]]; then
  log "Restoring uploads → ${UPLOAD_DIR}"
  mkdir -p /var/lib/mashoodwear
  rm -rf "${UPLOAD_DIR}"
  tar -C /var/lib/mashoodwear -xzf "${BACKUP_DIR}/mashoodwear-uploads.tar.gz"
fi

if [[ -f "${BACKUP_DIR}/config/backend.env" ]]; then
  log "Restoring backend/.env from backup/config"
  cp -a "${BACKUP_DIR}/config/backend.env" "${APP_DIR}/backend/.env"
  chmod 600 "${APP_DIR}/backend/.env"
fi

if [[ -f "${BACKUP_DIR}/config/mashoodwear-api.service" ]]; then
  log "Restoring systemd unit"
  cp -a "${BACKUP_DIR}/config/mashoodwear-api.service" /etc/systemd/system/mashoodwear-api.service
  systemctl daemon-reload
fi

if [[ -f "${BACKUP_DIR}/config/mashoodwear" ]]; then
  log "Restoring nginx site config"
  if [[ -d /etc/nginx/sites-available ]]; then
    cp -a "${BACKUP_DIR}/config/mashoodwear" /etc/nginx/sites-available/mashoodwear
    ln -sf /etc/nginx/sites-available/mashoodwear /etc/nginx/sites-enabled/mashoodwear
  else
    cp -a "${BACKUP_DIR}/config/mashoodwear" /etc/nginx/sites-enabled/mashoodwear
  fi
  nginx -t
  systemctl reload nginx
fi

log "Restoring MariaDB database ${DB_NAME}..."
systemctl start mariadb 2>/dev/null || systemctl start mysql 2>/dev/null || true
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
# Drop and recreate for a clean restore of the dumped schema+data
mysql -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
gunzip -c "${BACKUP_DIR}/mashoodwear-db.sql.gz" | mysql "${DB_NAME}"

chown -R www-data:www-data "${APP_DIR}/backend" "${APP_DIR}/frontend/dist" 2>/dev/null || true
if [[ -d "${UPLOAD_DIR}" ]]; then
  chown -R www-data:www-data /var/lib/mashoodwear
fi

log "Starting ${SERVICE_NAME}..."
systemctl enable "${SERVICE_NAME}"
systemctl restart "${SERVICE_NAME}"

log "Health check..."
ok=0
for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:3001/api/health" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 1
done
[[ "${ok}" -eq 1 ]] || die "API health check failed after restore. Check: journalctl -u ${SERVICE_NAME} -n 80"

curl -fsS "http://127.0.0.1:3001/api/health"
echo
systemctl --no-pager status "${SERVICE_NAME}" | head -8

log "Restore complete."
log "Backup used: ${BACKUP_DIR}"
log "Pre-restore safety copy: ${PRE_RESTORE}"
log "Site should be back on the previous Mashhoodwear build."
