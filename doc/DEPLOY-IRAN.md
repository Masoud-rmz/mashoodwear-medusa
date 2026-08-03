# Mashoodwear — راهنمای دیپلوی روی سرور ایران

> مکمل [`DEPLOY.md`](./DEPLOY.md) · مخصوص سرورهای داخل ایران با محدودیت دسترسی به Docker Hub، NodeSource، npmjs و Let's Encrypt.

**Stack:** React (Vite) + Node.js 20 (Express) + MariaDB + nginx

---

## ۱. خلاصه محدودیت‌های رایج

| منبع | وضعیت معمول در ایران | راه‌حل |
|------|------------------------|--------|
| `apt` (Ubuntu mirror داخلی) | ✅ کار می‌کند | `mariadb-server`, `nginx`, `git` از apt |
| npm registry (`registry.npmjs.org`) | ⚠️ کند یا مسدود | mirror لیارا: `https://package-mirror.liara.ir/repository/npm/` |
| NodeSource / `nodejs.org` | ❌ اغلب مسدود | آپلود باینری Node 20 از ماشین لوکال (WSL) |
| Docker Hub | ❌ اغلب مسدود | MariaDB سیستمی به‌جای `docker compose` |
| Let's Encrypt API | ⚠️ timeout | HTTP موقت، یا SSL از CDN (آروان و …) |

---

## ۲. پیش‌نیازها

| مورد | مقدار پیشنهادی |
|------|----------------|
| OS | Ubuntu 24.04 LTS |
| RAM | 1–2 GB |
| دامنه | `mashoodwear.ir` (رکورد A → IP سرور) |
| SSH | `root@<SERVER_IP> -p <SSH_PORT>` |
| مسیر نصب | `/opt/mashoodwear` |

---

## ۳. دیپلوی خودکار (روش اصلی)

اسکریپت: [`scripts/deploy-production-iran.sh`](../scripts/deploy-production-iran.sh)

### ۳.۱ — آپلود اسکریپت و اجرا

از **WSL** روی ویندوز (با `sshpass`):

```bash
# نصب sshpass در WSL (یک‌بار)
sudo apt-get install -y sshpass

# آپلود اسکریپت (CRLF ویندوز را حذف کن)
sed 's/\r$//' scripts/deploy-production-iran.sh > /tmp/deploy-production-iran.sh
sshpass -p '<SSH_PASSWORD>' scp -P <SSH_PORT> /tmp/deploy-production-iran.sh root@<SERVER_IP>:/root/

# اجرا
sshpass -p '<SSH_PASSWORD>' ssh -p <SSH_PORT> root@<SERVER_IP> \
  'bash /root/deploy-production-iran.sh mashoodwear.ir'
```

### ۳.۲ — کارهایی که اسکریپت انجام می‌دهد

1. نصب `nginx`, `mariadb-server`, `git`, `curl` از apt
2. ساخت دیتابیس `mashoodwear` و کاربر MariaDB
3. `git clone` از GitHub به `/opt/mashoodwear`
4. `npm install` با mirror لیارا
5. pin کردن `jsdom@24.1.3` (جلوگیری از خطای ESM)
6. ساخت `backend/.env` با secretهای تصادفی
7. `npm run migrate` + `npm run build` (frontend)
8. systemd service: `mashoodwear-api`
9. پیکربندی nginx
10. تلاش برای Certbot (ممکن است fail شود)

> **نکته:** اسکریپت فرض می‌کند Node 20 از قبل روی سرور نصب است. اگر نیست، بخش ۴ را ببین.

---

## ۴. نصب Node.js 20 (وقتی mirror خارجی مسدود است)

Ubuntu apt فقط Node 18 می‌دهد که برای `jsdom` جدید کافی نیست. وقتی `nodejs.org` از سرور در دسترس نیست:

### ۴.۱ — دانلود روی WSL لوکال

```bash
curl -fsSL -o /tmp/node-v20.18.3-linux-x64.tar.xz \
  https://nodejs.org/dist/v20.18.3/node-v20.18.3-linux-x64.tar.xz
```

### ۴.۲ — آپلود به سرور

```bash
sshpass -p '<SSH_PASSWORD>' scp -P <SSH_PORT> \
  /tmp/node-v20.18.3-linux-x64.tar.xz \
  root@<SERVER_IP>:/root/
```

### ۴.۳ — نصب روی سرور

اسکریپت آماده: [`scripts/install-node20-from-archive.sh`](../scripts/install-node20-from-archive.sh)

```bash
# روی سرور
cd /tmp
tar -xf /root/node-v20.18.3-linux-x64.tar.xz
rm -rf /usr/local/lib/nodejs
mkdir -p /usr/local/lib/nodejs
mv node-v20.18.3-linux-x64 /usr/local/lib/nodejs/node
ln -sf /usr/local/lib/nodejs/node/bin/node /usr/local/bin/node
ln -sf /usr/local/lib/nodejs/node/bin/npm /usr/local/bin/npm
ln -sf /usr/local/lib/nodejs/node/bin/npx /usr/local/bin/npx
node -v   # باید v20.18.3 باشد
```

به‌روزرسانی systemd:

```bash
sed -i 's|ExecStart=.*|ExecStart=/usr/local/bin/node src/index.js|' \
  /etc/systemd/system/mashoodwear-api.service
systemctl daemon-reload
systemctl restart mashoodwear-api
```

---

## ۵. رفع خطای jsdom (ERR_REQUIRE_ESM)

### علامت

```
Error [ERR_REQUIRE_ESM]: require() of ES Module .../node_modules/@exodus/bytes/encoding-lite.js
```

### علت

`jsdom@29` وابستگی‌های ESM-only می‌کشد که با mirror npm ایران و Node قدیمی سازگار نیست.

### راه‌حل

```bash
cd /opt/mashoodwear/backend
export NPM_CONFIG_REGISTRY=https://package-mirror.liara.ir/repository/npm/
npm install jsdom@24.1.3 --save-exact --no-fund --no-audit
systemctl restart mashoodwear-api
```

در `backend/package.json` نسخه pin شده:

```json
"jsdom": "24.1.3"
```

---

## ۶. HTTPS و Certbot

### مشکل

```text
requests.exceptions.ReadTimeout: acme-v02.api.letsencrypt.org
```

اتصال مستقیم سرور ایران به API لِتس‌انکریپت اغلب timeout می‌شود.

### گزینه‌ها

| روش | توضیح |
|-----|--------|
| **SSL خودامضا (موقت)** | `scripts/enable-selfsigned-ssl.sh` — پورت ۴۴۳ باز می‌شود؛ مرورگر هشدار امنیتی می‌دهد |
| CDN + SSL ابری | آروان، Cloudflare (اگر در دسترس) — رکورد A به CDN، SSL روی CDN |
| Retry Certbot | گاهی در ساعات مختلف شبکه بازتر است |
| سرور واسط | صدور cert روی VPS خارج و کپی به سرور ایران |

### نصب گواهی دیتاسنتر (fullchain + privateKey)

اگر از پنل دیتاسنتر `fullchain.pem` و `privateKey.pem` گرفتی:

```bash
# از WSL — آپلود
sshpass -p '<SSH_PASSWORD>' scp -P <SSH_PORT> \
  /mnt/c/Users/<YOU>/Downloads/fullchain.pem \
  root@<SERVER_IP>:/etc/ssl/mashoodwear/fullchain.pem

sshpass -p '<SSH_PASSWORD>' scp -P <SSH_PORT> \
  /mnt/c/Users/<YOU>/Downloads/privateKey.pem \
  root@<SERVER_IP>:/etc/ssl/mashoodwear/privkey.pem

# روی سرور
chmod 644 /etc/ssl/mashoodwear/fullchain.pem
chmod 600 /etc/ssl/mashoodwear/privkey.pem
nginx -t && systemctl reload nginx
```

اسکریپت آماده: [`scripts/install-datacenter-ssl.sh`](../scripts/install-datacenter-ssl.sh)

nginx از قبل به `/etc/ssl/mashoodwear/fullchain.pem` و `privkey.pem` اشاره می‌کند.

مرورگرها به‌طور پیش‌فرض `https://` را امتحان می‌کنند. بدون گواهی روی پورت ۴۴۳، سایت «در دسترس نیست» به نظر می‌رسد.

```bash
# روی سرور
bash /root/enable-selfsigned-ssl.sh
```

یا از repo: [`scripts/enable-selfsigned-ssl.sh`](../scripts/enable-selfsigned-ssl.sh)

کاربر در مرورگر: **Advanced → Proceed to mashoodwear.ir** (هشدار گواهی خودامضا طبیعی است).

### تلاش مجدد Certbot

```bash
certbot --nginx -d mashoodwear.ir -d www.mashoodwear.ir \
  --non-interactive --agree-tos --register-unsafely-without-email --redirect
```

تا قبل از فعال شدن HTTPS، سایت روی **HTTP** در دسترس است.

---

## ۷. بررسی سلامت بعد از دیپلوی

```bash
# روی سرور
curl -s http://127.0.0.1:3001/api/health
# انتظار: {"ok":true,"db":"connected"}

systemctl status mashoodwear-api
systemctl status nginx
systemctl status mariadb

# از بیرون
curl -sI http://mashoodwear.ir/
curl -s http://mashoodwear.ir/api/health
```

### مسیرها

| URL | کاربرد |
|-----|--------|
| `http://mashoodwear.ir/` | فروشگاه |
| `http://mashoodwear.ir/admin` | پنل مدیریت |
| `http://mashoodwear.ir/api/health` | سلامت API |

### اطلاعات ادمین

بعد از دیپلوی اول، رمز در `backend/.env` ذخیره می‌شود:

```bash
grep ADMIN_SEED /opt/mashoodwear/backend/.env
```

- نام کاربری پیش‌فرض: `admin`
- **بعد از اولین ورود حتماً رمز را عوض کن** (Settings → Change password)

---

## ۸. به‌روزرسانی (redeploy)

```bash
cd /opt/mashoodwear
git pull
export NPM_CONFIG_REGISTRY=https://package-mirror.liara.ir/repository/npm/
npm run install:all
npm install jsdom@24.1.3 --prefix backend --save-exact
npm run migrate
cd frontend && npm run build
systemctl restart mashoodwear-api
```

---

## ۹. عیب‌یابی

| علامت | بررسی |
|-------|--------|
| `502 Bad Gateway` | `journalctl -u mashoodwear-api -n 50` |
| API بالا نمی‌آید | `node -v` باید 20+ باشد؛ مسیر systemd: `/usr/local/bin/node` |
| `ERR_REQUIRE_ESM` | بخش ۵ — downgrade `jsdom` |
| `admins doesn't exist` | `npm run migrate` سپس `systemctl restart mashoodwear-api` |
| آپلود تصویر fail | `ls -la /var/lib/mashoodwear/uploads` — مالکیت `www-data` |
| CORS error | `CORS_ORIGIN` در `.env` باید دقیقاً URL سایت باشد |
| Certbot fail | بخش ۶ — HTTP موقت یا SSL ابری |

### لاگ‌های مفید

```bash
journalctl -u mashoodwear-api -f
tail -f /var/log/nginx/error.log
```

---

## ۱۰. ساختار فایل‌های سرور

```text
/opt/mashoodwear/              # کد پروژه
/opt/mashoodwear/backend/.env  # تنظیمات محرمانه (chmod 600)
/opt/mashoodwear/frontend/dist # خروجی build — nginx سرو می‌کند
/var/lib/mashoodwear/uploads   # تصاویر آپلود شده
/etc/nginx/sites-available/mashoodwear
/etc/systemd/system/mashoodwear-api.service
/usr/local/lib/nodejs/node/    # Node 20 (نصب دستی)
```

---

## ۱۱. اسکریپت‌های کمکی در repo

| فایل | کاربرد |
|------|--------|
| `scripts/deploy-production-iran.sh` | دیپلوی کامل مخصوص ایران |
| `scripts/install-node20-from-archive.sh` | نصب Node از tarball آپلود شده |
| `scripts/fix-jsdom-downgrade.sh` | downgrade jsdom و restart API |
| `scripts/deploy-production.sh` | دیپلوی استاندارد (سرور خارج / Docker) |

---

## ۱۲. چک‌لیست امنیت

- [ ] رمز SSH root را بعد از دیپلوی عوض کن
- [ ] رمز ادمین پنل را عوض کن
- [ ] `backend/.env` را commit نکن
- [ ] HTTPS را فعال کن (CDN یا Certbot)
- [ ] فایروال: فقط پورت‌های 80، 443 و SSH لازم باز باشد

---

## ۱۳. تاریخچه دیپلوی مرجع

**سرور:** Ubuntu 24.04 · ParsVDS mirror · IP نمونه: `193.242.208.96` · SSH port: `9011`

**مراحل انجام‌شده (ژوئیه ۲۰۲۶):**

1. دیپلوی با `deploy-production-iran.sh` — MariaDB + nginx + npm (لیارا) ✅
2. آپلود Node 20.18.3 از WSL (چون nodejs.org از سرور در دسترس نبود) ✅
3. downgrade `jsdom` به 24.1.3 (رفع ERR_REQUIRE_ESM) ✅
4. سایت روی `http://mashoodwear.ir` بالا آمد ✅
5. Certbot — timeout به Let's Encrypt ❌ (HTTP موقت)

---

*برای دیپلوی روی VPS خارجی با Docker، [`DEPLOY.md`](./DEPLOY.md) را ببین.*
