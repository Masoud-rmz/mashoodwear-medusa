#!/usr/bin/env bash
echo "=== SERVICES ==="
systemctl is-active nginx mashoodwear-api mariadb
echo "=== PORTS ==="
ss -tlnp | grep -E ':80|:3001|:443' || true
echo "=== LOCAL HTTP ==="
curl -sI http://127.0.0.1/ | head -5
curl -s http://127.0.0.1:3001/api/health; echo
echo "=== NGINX SITES ==="
ls -la /etc/nginx/sites-enabled/
echo "=== API LOG ==="
journalctl -u mashoodwear-api -n 10 --no-pager
echo "=== DISK/MEM ==="
df -h / | tail -1
free -h | head -2
