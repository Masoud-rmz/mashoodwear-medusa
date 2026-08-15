<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol {
  font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important;
  direction: rtl;
  text-align: right;
}
pre, code {
  direction: ltr;
  text-align: left;
}
table {
  direction: rtl;
  text-align: right;
  width: 100%;
  border-collapse: collapse;
}
thead th, tbody td {
  text-align: right;
  vertical-align: top;
  padding: 0.35em 0.5em;
  border: 1px solid #ddd;
}
</style>

# راهنمای کامپیوتر دوست — نصب، بالا آوردن، بک‌آپ برای دیپلوی

> هدف: روی لپ‌تاپ دوست محصولات را در Medusa لوکال وارد کنی، بعد **بک‌آپ دیتابیس (+ تصاویر)** را بیاوری برای سرور.  
> این کار جایگزین دیپلوی کد نیست؛ فقط کاتالوگ را منتقل می‌کند.

نقشهٔ کار ادمین: [`medusa-admin-merchant-roadmap-fa.md`](./medusa-admin-merchant-roadmap-fa.md)

---

## ۱) چه چیزی روی فلش بریزی؟

### پوشهٔ پیشنهادی روی فلش

```text
FLASH:\mashood-setup\
  01-installers\          ← نرم‌افزارهای نصب
  02-project\             ← خود پروژه (بدون node_modules)
  03-guide\               ← همین فایل راهنما (کپی)
```

### الف) نصب‌کننده‌ها (`01-installers`)

| فایل | چرا |
|------|-----|
| Node.js **20 LTS** Windows `.msi` | اجرای Medusa و فرانت |
| Docker Desktop برای Windows `.exe` | Postgres + Redis (+ MySQL اگر CMS لازم شد) |
| (اختیاری) Git for Windows | اگر clone از گیت بخواهی؛ با فلش لازم نیست |

از سایت رسمی دانلود کن (ترجیحاً قبل از رفتن، چون اینترنت دوست ممکن است ضعیف باشد).

### ب) پروژه (`02-project`) — مهم

**همین ریپو را کپی کن:** پوشهٔ `mashoodwear-medusa`

قبل از کپی، اگر حجم کم است این‌ها را **نریز** (روی سیستم دوست دوباره نصب می‌شوند):

- همهٔ `node_modules`
- `.git` (اختیاری؛ برای کار فروشنده لازم نیست)
- پوشه‌های build مثل `frontend/dist`، `.medusa` اگر خیلی بزرگ شد

**حتماً همراه باشد:**

| چیز | توضیح |
|-----|--------|
| کل سورس `apps/medusa` ، `frontend` ، `backend` ، `docker-compose.yml` ، `package.json` | برای بالا آوردن |
| `apps/medusa/.env.example` و در صورت وجود `.env` لوکال تست | بدون secret پروداکشن |
| `frontend/.env.example` | بعداً key پر می‌شود |
| این راهنما `doc/friend-pc-local-catalog-backup-fa.md` | برای خودتان |

#### چطور zip سبک بسازی (روی سیستم خودت)

PowerShell در ریشهٔ ریپو:

```powershell
# از پوشهٔ والد mashoodwear-medusa اجرا کن
Compress-Archive -Path .\mashoodwear-medusa\* -DestinationPath .\mashoodwear-medusa-flash.zip -Force
```

اگر `node_modules` داخل zip رفت و سنگین شد، اول پاک/جدا کن یا با 7-Zip و exclude بساز.

**حجم تقریبی:** سورس بدون `node_modules` معمولاً چند صد مگابایت است؛ با `node_modules` چند گیگ می‌شود — برای فلش بهتر است بدون `node_modules`.

### ج) چه چیزی نبری

- رمزهای پروداکشن سرور  
- `.env` واقعی سرور با secret درگاه بانک  
- دیتابیس پروداکشن  

برای خانهٔ دوست فقط env لوکال نمونه کافی است.

---

## ۲) روی کامپیوتر دوست چه نصب شود؟

پیش‌نیاز ویندوز ۱۰/۱۱، حداقل ۸ گیگ رم (۱۶ بهتر)، فضای آزاد ~۱۵ گیگ.

1. **Node.js 20 LTS** را نصب کن → CMD بزن: `node -v` باید `v20...` باشد  
2. **Docker Desktop** را نصب کن → یک‌بار باز کن تا Engine سبز شود  
   - اگر WSL2 خواست، نصب را تأیید کن و ری‌استارت  
3. (اختیاری) Git  
4. فلش را وصل کن؛ پروژه را مثلاً به `C:\work\mashoodwear-medusa` کپی کن (مسیر فارسی/فاصله‌دار کمتر دردسر دارد)

---

## ۳) بالا آوردن پروژه (اولین بار)

PowerShell یا CMD در پوشهٔ پروژه:

```bat
cd C:\work\mashoodwear-medusa

npm run install:all
npm run db:up
```

صبر کن تا Docker این کانتینرها Up شوند:

- `mashoodwear-postgres` (پورت **5433**)  
- `mashoodwear-redis` (**6379**)  
- `mashoodwear-mysql` (**3306**) — فقط اگر CMS هم لازم شد  

Env یک‌بار:

```bat
copy apps\medusa\.env.example apps\medusa\.env
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
```

مهاجرت + Medusa:

```bat
npm run migrate:medusa
npm run dev:medusa
```

ترمینال جدا — ویترین (برای دیدن نتیجه):

```bat
npm run dev:frontend
```

| سرویس | آدرس |
|-------|------|
| Admin Medusa | http://localhost:9000/app |
| ویترین | http://localhost:5173 |

اولین ورود Admin: کاربر ادمین را طبق onboarding Medusa بساز (ایمیل/رمز خودتان).

### پر کردن `frontend/.env` (بعد از بالا آمدن Admin)

از Admin: publishable key و region را بردار و در `frontend/.env` بگذار:

- `VITE_MEDUSA_BACKEND_URL=http://localhost:9000`
- `VITE_MEDUSA_PUBLISHABLE_KEY=pk_...`
- `VITE_COMMERCE_PROVIDER=medusa`
- `VITE_MEDUSA_ADMIN_URL=http://localhost:9000/app`

بعد Vite را یک‌بار ری‌استارت کن.

### کار فروشنده روی همین سیستم

طبق نقشهٔ راه ادمین:

1. تنظیمات → مکان انبار / کانال فروش  
2. محصولات با **Manage inventory روشن از اول**  
3. موجودی Iran Warehouse  
4. در صورت نیاز پروموشن (کد تخفیف)

برای کاتالوگ، **CMS (`dev:cms`) لازم نیست** مگر Lookbook/صفحات برند بخواهید.

---

## ۴) بک‌آپ برای دیپلوی (مهم‌ترین بخش برگشت)

محصولات داخل **Postgres** کانتینر `mashoodwear-postgres` هستند.

### ۴.۱ — بک‌آپ دیتابیس Medusa

وقتی Docker بالا است:

```bat
cd C:\work\mashoodwear-medusa
mkdir backup-for-server
docker exec mashoodwear-postgres pg_dump -U medusa -d medusa_store -F c -f /tmp/medusa_store.dump
docker cp mashoodwear-postgres:/tmp/medusa_store.dump .\backup-for-server\medusa_store.dump
```

خروجی: `backup-for-server\medusa_store.dump`

برای نسخهٔ متنی (خواناتر، سنگین‌تر):

```bat
docker exec mashoodwear-postgres pg_dump -U medusa -d medusa_store > .\backup-for-server\medusa_store.sql
```

### ۴.۲ — تصاویر / آپلودها

اگر عکس‌ها را در Admin آپلود کرده‌ای، پوشه‌های استوریج لوکال Medusa را هم کپی کن (معمولاً زیر `apps/medusa` چیزهایی مثل `uploads` / `.medusa` / static — هر چه روی این سیستم ساخته شده).  
اگر همهٔ عکس‌ها URL اینترنتی بودند، فقط dump کافی است.

یک چک سریع:

```bat
dir /s apps\medusa\*upload*
```

هر پوشهٔ عکس واقعی را داخل `backup-for-server\uploads\` بگذار.

### ۴.۳ — یادداشت تنظیمات (متن ساده)

داخل `backup-for-server\NOTES.txt` بنویس:

- نام کانال فروش  
- نام Location (مثلاً Iran Warehouse)  
- کدهای تخفیف ساخته‌شده  
- ایمیل ادمین لوکال (رمز را جدا/امن نگه دار)

### ۴.۴ — چه چیزی را دوباره روی فلش برگردان

```text
FLASH:\mashood-bring-back\
  medusa_store.dump          ← اجباری
  uploads\                   ← اگر عکس لوکال دارید
  NOTES.txt
```

سورس کامل پروژه را لازم نیست دوباره بیاوری مگر تغییر کد داده‌اید.

---

## ۵) روی سرور بعد از دیپلوی کد چه کار می‌شود؟ (خلاصه)

1. Medusa + Postgres سرور بالا باشد  
2. **قبل از restore** از دیتابیس خالی/فعلی سرور هم safety backup بگیر  
3. restore مثلاً:

```bash
# نمونه — نام کانتینر/یوزر سرور ممکن است فرق کند؛ با DEPLOY-IRAN هماهنگ کن
docker exec -i SERVER_POSTGRES_CONTAINER pg_restore -U medusa -d medusa_store --clean --if-exists < medusa_store.dump
```

یا با `psql` برای فایل `.sql`.

4. فایل‌های `uploads` را در مسیر استوریج سرور کپی کن و دسترسی را درست کن  
5. Admin سرور را باز کن؛ محصولات را ببین؛ کانال فروش و Location را چک کن  
6. publishable key ویترین پروداکشن را در env فرانت سرور بگذار

> اگر سرور ایران بدون Docker است، restore با `pg_restore`/`psql` روی Postgres سیستمی طبق [`DEPLOY-IRAN.md`](./DEPLOY-IRAN.md) انجام می‌شود — نام دیتابیس را از env سرور بردار.

---

## ۶) چک‌لیست یک‌صفحه‌ای برای روز رفتن

**قبل از رفتن (خانه‌ات):**

- [ ] Node 20 + Docker Desktop installer روی فلش  
- [ ] zip/کپی پروژه **بدون** `node_modules`  
- [ ] کپی این راهنما  
- [ ] فلش تست شود (باز می‌شود)

**نزد دوست:**

- [ ] نصب Node + Docker  
- [ ] کپی پروژه → `npm run install:all` → `npm run db:up`  
- [ ] `.env` از example  
- [ ] `migrate:medusa` + `dev:medusa`  
- [ ] ساخت ادمین + محصول + موجودی  
- [ ] `pg_dump` → فلش برگشت

**برنگرداندن به خانه / سرور:**

- [ ] `medusa_store.dump` سالم است (حجم صفر نباشد)  
- [ ] uploads اگر لازم  
- [ ] NOTES.txt

---

## ۷) مشکلات پرتکرار

| مشکل | کار |
|------|-----|
| Docker Engine بالا نمی‌آید | Docker Desktop را باز کن؛ WSL2 را کامل کن؛ ری‌استارت |
| پورت 5432 شلوغ است | این پروژه از **5433** استفاده می‌کند — مشکلی نیست |
| Redis / 6379 اشغال | Redis قبلی را ببند یا در compose پورت را عوض نکن مگر بدانی چه می‌کنی |
| `npm run install:all` طول می‌کشد | اینترنت لازم است؛ در ایران mirror npm کمک می‌کند |
| Admin باز نمی‌شود | صبر تا Medusa کامل boot شود؛ ترمینال خطا را بخوان |
| موجودی قفل است | وریانت را با Manage inventory روشن از اول بساز (نقشهٔ راه ادمین) |

---

## ۸) توصیهٔ نهایی

- اگر اینترنت دوست خوب است و عجله داری: فقط installers + این راهنما ببر و پروژه را با `git clone` بگیر.  
- اگر اینترنت ضعیف است: **کل پروژه بدون node_modules روی فلش** ضروری است؛ `npm install` هنوز اینترنت می‌خواهد مگر `node_modules` را هم از سیستم خودت از قبل پر کرده باشی (حجم زیاد).  
- برای تعداد کم محصول: گاهی ساده‌تر است بعد از دیپلوی مستقیم روی Admin سرور وارد کنی و این مسیر dump را رد کنی.
