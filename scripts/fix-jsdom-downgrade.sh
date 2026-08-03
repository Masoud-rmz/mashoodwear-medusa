#!/usr/bin/env bash
set -euo pipefail
cd /opt/mashoodwear/backend
export NPM_CONFIG_REGISTRY=https://package-mirror.liara.ir/repository/npm/
npm install jsdom@24.1.3 --save-exact --no-fund --no-audit
sudo -u www-data /usr/local/bin/node -e "import('./src/utils/sanitize.js').then(() => console.log('sanitize ok'))"
systemctl restart mashoodwear-api
sleep 4
curl -fsS http://127.0.0.1:3001/api/health
echo
curl -sI http://127.0.0.1/ | head -5
grep ADMIN_SEED_PASSWORD /opt/mashoodwear/backend/.env
