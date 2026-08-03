#!/usr/bin/env bash
set -euo pipefail
DOMAIN=mashoodwear.ir
WWW=www.mashoodwear.ir
APP_DIR=/opt/mashoodwear
SSL_DIR=/etc/ssl/mashoodwear

mkdir -p "$SSL_DIR"
if [[ ! -f "$SSL_DIR/fullchain.pem" ]]; then
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/privkey.pem" \
    -out "$SSL_DIR/fullchain.pem" \
    -subj "/CN=${DOMAIN}/O=Mashoodwear/C=IR" \
    -addext "subjectAltName=DNS:${DOMAIN},DNS:${WWW}"
fi

cat > /etc/nginx/sites-available/mashoodwear <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${DOMAIN} ${WWW};

    ssl_certificate     ${SSL_DIR}/fullchain.pem;
    ssl_certificate_key ${SSL_DIR}/privkey.pem;

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

nginx -t
systemctl reload nginx
sleep 1
curl -skI https://127.0.0.1/ -H "Host: ${DOMAIN}" | head -5
curl -sk https://127.0.0.1/api/health -H "Host: ${DOMAIN}"
echo
ss -tlnp | grep ':443' || true
echo "Self-signed SSL enabled on port 443"
