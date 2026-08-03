#!/usr/bin/env bash
# purpose --- prepare Postgres role/db for Medusa on Iran VPS (random password) ---
set -euo pipefail

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

PG_USER="${PG_USER:-medusa}"
PG_DB="${PG_DB:-medusa_store}"
PG_PASS="${PG_PASS:-$(openssl rand -base64 24 | tr -d '/+=' | head -c 28)}"
CREDS_FILE="${CREDS_FILE:-/root/backups/medusa-pg-credentials.txt}"

systemctl enable --now postgresql redis-server

if ! sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${PG_USER}'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE USER ${PG_USER} WITH PASSWORD '${PG_PASS}';"
else
  sudo -u postgres psql -c "ALTER USER ${PG_USER} WITH PASSWORD '${PG_PASS}';"
fi

if ! sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${PG_DB}'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE DATABASE ${PG_DB} OWNER ${PG_USER};"
fi

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${PG_DB} TO ${PG_USER};"
sudo -u postgres psql -d "${PG_DB}" -c "GRANT ALL ON SCHEMA public TO ${PG_USER};"

mkdir -p "$(dirname "${CREDS_FILE}")"
umask 077
cat > "${CREDS_FILE}" <<EOF
PG_USER=${PG_USER}
PG_PASS=${PG_PASS}
PG_DB=${PG_DB}
DATABASE_URL=postgresql://${PG_USER}:${PG_PASS}@127.0.0.1:5432/${PG_DB}
EOF
chmod 600 "${CREDS_FILE}"

redis-cli ping
ss -tlnp | grep -E ':5432|:6379|:3001|:9000|:80|:443' || true
free -h
df -h /
echo "Credentials: ${CREDS_FILE}"
echo PREP_DONE
