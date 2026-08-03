#!/usr/bin/env bash
set -euo pipefail
cd /opt/mashoodwear/backend
export NPM_CONFIG_REGISTRY=https://package-mirror.liara.ir/repository/npm/
npm install html-encoding-sniffer@4.0.0 --save-exact --no-fund --no-audit
sudo -u www-data /usr/local/bin/node src/index.js &
PID=$!
sleep 3
if kill -0 $PID 2>/dev/null; then
  kill $PID
  systemctl restart mashoodwear-api
  sleep 3
  curl -fsS http://127.0.0.1:3001/api/health
  echo
else
  echo "Manual start failed"
  exit 1
fi
