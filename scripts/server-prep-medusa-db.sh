#!/usr/bin/env bash
# purpose --- prepare Postgres role/db for Medusa demo on Iran VPS ---
set -euo pipefail

if ! sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='medusa'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE USER medusa WITH PASSWORD 'MedusaDemo1405!';"
fi

if ! sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='medusa_store'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE DATABASE medusa_store OWNER medusa;"
fi

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE medusa_store TO medusa;"
sudo -u postgres psql -d medusa_store -c "GRANT ALL ON SCHEMA public TO medusa;"

redis-cli ping
ss -tlnp | grep -E ':5432|:6379|:3001|:80|:443' || true
free -h
df -h /
echo PREP_DONE
