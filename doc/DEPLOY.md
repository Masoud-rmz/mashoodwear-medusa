# Mashoodwear — Production Deploy Guide

> Stack: React (Vite) + Node.js (Express) + MySQL · Orders via Instagram / Telegram DM.

> **سرور ایران:** راهنمای جداگانه با mirror npm، MariaDB بدون Docker و نصب Node از tarball → [`DEPLOY-IRAN.md`](./DEPLOY-IRAN.md)

---

## 1. Server requirements

| Item | Recommendation |
|------|----------------|
| OS | Ubuntu 22.04+ or Debian 12+ |
| CPU / RAM | 1 vCPU, 1–2 GB RAM (small catalog) |
| Node.js | 20 LTS (`node -v`) |
| MySQL | 8.0 (managed or self-hosted) |
| Reverse proxy | nginx + Let's Encrypt (HTTPS) |
| Domain | e.g. `shop.example.com` |

---

## 2. Clone and install

```bash
git clone <your-repo-url> /opt/mashoodwear
cd /opt/mashoodwear
npm run install:all
```

---

## 3. Database

### Option A — Docker on the same server

```bash
cd /opt/mashoodwear
npm run db:up
npm run migrate
```

### Option B — Managed MySQL

Create database + user, then set credentials in `backend/.env` (see §4) and run:

```bash
cd /opt/mashoodwear
npm run migrate
```

---

## 4. Backend environment

Copy and edit production env:

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

| Variable | Production value |
|----------|------------------|
| `PORT` | `3001` (internal; nginx proxies) |
| `NODE_ENV` | `production` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASS` | MySQL credentials |
| `JWT_SECRET` | Random 32+ char string (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `8h` |
| `UPLOAD_DIR` | `/var/lib/mashoodwear/uploads` (create dir, writable by API user) |
| `CORS_ORIGIN` | `https://shop.example.com` |
| `TRUST_PROXY` | `1` (behind nginx) |
| `SITE_URL` | `https://shop.example.com` (for sitemap.xml absolute URLs) |
| `ADMIN_SEED_USERNAME` | Optional — first-boot admin username |
| `ADMIN_SEED_PASSWORD` | Optional — first-boot admin password |

Create uploads directory:

```bash
sudo mkdir -p /var/lib/mashoodwear/uploads
sudo chown -R $USER:$USER /var/lib/mashoodwear/uploads
```

---

## 5. Build frontend

```bash
cd /opt/mashoodwear/frontend
npm run build
```

Output: `frontend/dist/` — static files served by nginx.

---

## 6. systemd service (API)

```bash
sudo cp /opt/mashoodwear/scripts/mashoodwear-api.service.example /etc/systemd/system/mashoodwear-api.service
sudo nano /etc/systemd/system/mashoodwear-api.service
# Set User=, WorkingDirectory=, EnvironmentFile= paths

sudo systemctl daemon-reload
sudo systemctl enable --now mashoodwear-api
sudo systemctl status mashoodwear-api
```

Health check:

```bash
curl -s http://127.0.0.1:3001/api/health
```

---

## 7. nginx (HTTPS + SPA)

```bash
sudo cp /opt/mashoodwear/scripts/nginx-mashoodwear.conf.example /etc/nginx/sites-available/mashoodwear
sudo ln -s /etc/nginx/sites-available/mashoodwear /etc/nginx/sites-enabled/
sudo nano /etc/nginx/sites-available/mashoodwear
# Replace shop.example.com and dist path

sudo nginx -t
sudo systemctl reload nginx
```

TLS with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d shop.example.com
```

---

## 8. Post-deploy checklist

- [ ] `GET /api/health` returns DB connected
- [ ] Public site loads at `https://shop.example.com`
- [ ] Admin login at `https://shop.example.com/admin` — **change default password** (Settings → Change password)
- [ ] Instagram + Telegram URLs set in **Admin → Settings**
- [ ] Hero / Home copy reviewed in **Admin → Home**
- [ ] `robots.txt` and `sitemap.xml` reachable (served from `frontend/dist` after build)
- [ ] Upload test image in admin — file appears under `/uploads/...`

---

## 9. Reset CMS text after testing

Admin edits live in MySQL. To restore default copy **without redeploying code**:

```bash
cd /opt/mashoodwear
npm run reset:cms
```

Resets: Home hero text, brand story teaser/body, Instagram/Telegram settings, About / Contact / How to Buy / Lookbook page bodies.

Does **not** reset: products, categories, collections, lookbook images, logo/hero uploaded images.

---

## 10. Updates (redeploy)

```bash
cd /opt/mashoodwear
git pull
npm run install:all
npm run migrate
cd frontend && npm run build
sudo systemctl restart mashoodwear-api
```

---

## 11. Troubleshooting

| Symptom | Check |
|---------|--------|
| 502 Bad Gateway | `journalctl -u mashoodwear-api -n 50` — API down or wrong port |
| `admins doesn't exist` | Run `cd /opt/mashoodwear && npm run migrate` then `systemctl restart mashoodwear-api`. API also auto-runs SQL migrations on boot (v0.1.1+). |
| CORS errors | `CORS_ORIGIN` must match exact site URL (scheme + host) |
| Upload fails | `UPLOAD_DIR` exists and is writable |
| Admin 403 | JWT expired — log in again; check `JWT_SECRET` unchanged |
| Blank SPA routes | nginx `try_files $uri $uri/ /index.html` for `/` location |

---

## 12. Security reminders

- HTTPS only in production (`design.md` §11)
- Strong `JWT_SECRET` and admin password
- `robots.txt` disallows `/admin`
- Never commit `backend/.env` or upload secrets to git
