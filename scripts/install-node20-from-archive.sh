#!/usr/bin/env bash
set -euo pipefail
NODE_VER=v20.18.3
ARCHIVE="/root/node-${NODE_VER}-linux-x64.tar.xz"
cd /tmp
tar -xf "${ARCHIVE}"
rm -rf /usr/local/lib/nodejs
mkdir -p /usr/local/lib/nodejs
mv "node-${NODE_VER}-linux-x64" /usr/local/lib/nodejs/node
ln -sf /usr/local/lib/nodejs/node/bin/node /usr/local/bin/node
ln -sf /usr/local/lib/nodejs/node/bin/npm /usr/local/bin/npm
ln -sf /usr/local/lib/nodejs/node/bin/npx /usr/local/bin/npx
node -v
sed -i 's|ExecStart=.*|ExecStart=/usr/local/bin/node src/index.js|' /etc/systemd/system/mashoodwear-api.service
systemctl daemon-reload
systemctl restart mashoodwear-api
sleep 4
curl -fsS http://127.0.0.1:3001/api/health
echo
curl -sI http://127.0.0.1/ | head -5
systemctl status mashoodwear-api --no-pager | head -8
