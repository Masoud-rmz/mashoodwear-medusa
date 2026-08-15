#!/usr/bin/env bash
# Rebuild Vite storefront on the live server and stop serving a stale pre-Medusa UI.
# Run ON the VPS as root:
#   bash /root/redeploy-frontend-medusa.sh
# Or from WSL:
#   sshpass -p '...' scp -P 9011 scripts/redeploy-frontend-medusa.sh root@193.242.208.96:/root/
#   sshpass -p '...' ssh -p 9011 root@193.242.208.96 'bash /root/redeploy-frontend-medusa.sh'
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/mashoodwear}"
SITE_ORIGIN="${SITE_ORIGIN:-https://mashoodwear.ir}"
SERVICE_USER="${SERVICE_USER:-www-data}"
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-available/mashoodwear}"
KEY_FILE="${KEY_FILE:-/root/backups/medusa-publishable-key.txt}"
NODE_BIN="${NODE_BIN:-/usr/local/bin/node}"
export PATH="/usr/local/bin:${PATH}"
export NPM_CONFIG_REGISTRY="${NPM_CONFIG_REGISTRY:-https://package-mirror.liara.ir/repository/npm/}"

log() { echo "[redeploy-frontend] $*"; }
die() { echo "[redeploy-frontend] ERROR: $*" >&2; exit 1; }

[[ -d "${APP_DIR}/frontend" ]] || die "missing ${APP_DIR}/frontend"
command -v npm >/dev/null || die "npm not found"
[[ -x "${NODE_BIN}" ]] || NODE_BIN="$(command -v node)"

PUBLISHABLE_KEY=""
if [[ -f "${KEY_FILE}" ]]; then
  PUBLISHABLE_KEY="$(tr -d '[:space:]' < "${KEY_FILE}")"
fi
if [[ -z "${PUBLISHABLE_KEY}" && -f "${APP_DIR}/frontend/.env" ]]; then
  PUBLISHABLE_KEY="$(grep -E '^VITE_MEDUSA_PUBLISHABLE_KEY=' "${APP_DIR}/frontend/.env" | cut -d= -f2- | tr -d '[:space:]')"
fi
[[ -n "${PUBLISHABLE_KEY}" ]] || die "no publishable key — set ${KEY_FILE} or frontend/.env"

log "Writing production frontend/.env (Medusa via same origin)..."
cat > "${APP_DIR}/frontend/.env" <<EOF
VITE_MEDUSA_BACKEND_URL=${SITE_ORIGIN}
VITE_MEDUSA_PUBLISHABLE_KEY=${PUBLISHABLE_KEY}
VITE_MEDUSA_DEFAULT_COUNTRY=ir
VITE_MEDUSA_ADMIN_URL=${SITE_ORIGIN}/app
VITE_COMMERCE_PROVIDER=medusa
EOF
chmod 600 "${APP_DIR}/frontend/.env"

log "Installing frontend deps (if needed) + building..."
cd "${APP_DIR}/frontend"
npm install --no-audit --no-fund
npm run build
[[ -f dist/index.html ]] || die "build produced no dist/index.html"

# purpose --- prove new shell is not the pre-Medusa Lookbook UI ---
if grep -q 'Lookbook' dist/index.html dist/assets/*.js 2>/dev/null; then
  log "WARNING: Lookbook string still present in dist — check source tree on server"
else
  log "Lookbook nav string not found in dist (good)"
fi

chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}/frontend/dist"

if [[ -f "${NGINX_SITE}" ]]; then
  if ! grep -q 'Cache-Control.*no-cache' "${NGINX_SITE}"; then
    log "Patching nginx: no-cache for index.html..."
    python3 - <<'PY' || die "nginx patch failed"
from pathlib import Path
path = Path("/etc/nginx/sites-available/mashoodwear")
text = path.read_text()
snippet = """
    # SPA shell must never stick in browser/CDN cache after cutover
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
    }

"""
marker = "    location / {"
if "no-cache, no-store, must-revalidate" in text and "location = /index.html" in text:
    print("index.html cache block already present")
elif marker not in text:
    raise SystemExit("could not find location / block")
else:
    # Patch every SPA location / block (HTTP + HTTPS server)
    path.write_text(text.replace(marker, snippet + marker))
    print("patched")
PY
  else
    log "nginx already has no-cache for SPA shell"
  fi
  nginx -t
  systemctl reload nginx
else
  log "WARNING: ${NGINX_SITE} missing — skipped nginx reload"
fi

log "Done. Dist mtime:"
ls -la "${APP_DIR}/frontend/dist/index.html"
log "Hard-refresh the site (Ctrl+Shift+R) or open Incognito to verify."
