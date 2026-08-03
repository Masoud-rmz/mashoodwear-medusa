#!/usr/bin/env bash
set -euo pipefail
SSL_DIR=/etc/ssl/mashoodwear
mkdir -p "$SSL_DIR"
chmod 755 "$SSL_DIR"
chmod 644 "$SSL_DIR/fullchain.pem"
chmod 600 "$SSL_DIR/privkey.pem"
chown root:root "$SSL_DIR/fullchain.pem" "$SSL_DIR/privkey.pem"
nginx -t
systemctl reload nginx
echo "=== CERT INFO ==="
openssl x509 -in "$SSL_DIR/fullchain.pem" -noout -subject -dates -issuer
echo "=== HTTPS TEST ==="
curl -sI https://mashoodwear.ir/ | head -6
curl -s https://mashoodwear.ir/api/health
echo
