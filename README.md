# Mashhoodwear × Medusa (monorepo)

یک ریپوی کامل و قابل‌کلون: **Medusa Iran Pack** + **Vite storefront** + **CMS Express**.

| قطعه | مسیر | پورت |
|------|------|------|
| Medusa (تجارت) | `apps/medusa` | `9000` |
| CMS Express (برند / lookbook) | `backend` | `3001` |
| Storefront Vite | `frontend` | `5173` |

ریپو: https://github.com/callmesallad/mashoodwear-medusa

> کپی قدیمی `F:\medusa-develop\my-medusa-store` دیگر منبع حقیقت نیست؛ کار روی همین monorepo انجام شود.

## Clone و راه‌اندازی لوکال

```bash
git clone https://github.com/callmesallad/mashoodwear-medusa.git
cd mashoodwear-medusa

npm run install:all
npm run db:up

# Env (یک‌بار)
cp apps/medusa/.env.example apps/medusa/.env
cp frontend/.env.example frontend/.env   # سپس publishable key + region را پر کن
cp backend/.env.example backend/.env

# ترمینال ۱ — Medusa
npm run migrate:medusa   # first time
npm run dev:medusa

# ترمینال ۲ — CMS (اختیاری)
npm run migrate:cms
npm run dev:cms

# ترمینال ۳ — UI
npm run dev:frontend
```

یادآوری سریع: `npm run notes:medusa`

| سرویس | URL |
|-------|-----|
| Storefront | http://localhost:5173 |
| Medusa Admin | http://localhost:9000/app |
| Medusa Store API | http://localhost:9000 |
| CMS API | http://localhost:3001 |

Docker Compose بالا می‌آورد: **MySQL** `:3306` (CMS)، **Postgres** `:5433` + **Redis** `:6379` (Medusa).

> اگر روی ویندوز Postgres دیگری روی `:5432` دارید، compose عمداً از **5433** استفاده می‌کند (`DATABASE_URL` در `apps/medusa/.env.example`).
> اگر Redis از قبل روی `:6379` بالا باشد، همان کافی است.

### Env فرانت (commerce)

- `VITE_MEDUSA_BACKEND_URL=http://localhost:9000`
- `VITE_MEDUSA_PUBLISHABLE_KEY=pk_…` (از Medusa Admin)
- `VITE_MEDUSA_REGION_ID` یا `VITE_MEDUSA_DEFAULT_COUNTRY=ir`
- `VITE_MEDUSA_ADMIN_URL=http://localhost:9000/app`
- `VITE_COMMERCE_PROVIDER=medusa`

Vite فقط مسیرهای CMS را به `:3001` پروکسی می‌کند؛ درخواست‌های Medusa مستقیم به `:9000` می‌روند.

## اسکریپت‌های npm (روت)

| اسکریپت | کار |
|---------|-----|
| `install:all` | `npm install` (workspaces) |
| `db:up` / `db:down` | Docker Compose |
| `dev:medusa` | Medusa develop |
| `dev:cms` | Express CMS |
| `dev:frontend` | Vite |
| `migrate:cms` | مهاجرت MySQL CMS |
| `build` | build فرانت |

## تست

```bash
npm run test:unit
```

## دیپلوی سرور ایران

راهنما: [`doc/DEPLOY-IRAN.md`](doc/DEPLOY-IRAN.md)  
اسکریپت monorepo: `scripts/deploy-dual-stack-iran.sh` (Medusa از `apps/medusa` داخل همین ریپو).

## Docs

| Doc | نقش |
|-----|------|
| `doc/implementation_plan-monorepo.md` | طرح یکپارچه‌سازی monorepo |
| `doc/agent-priority/` | اولویت ذخیره برای agent |
| `doc/ui-medusa-guides/` | راهنمای UI روی Medusa |
| `doc/handshake-learnings.md` | باگ‌ها و یادداشت‌ها |
| `doc/tasks-medusa.md` | چک‌لیست پیاده‌سازی |
| `doc/auth-otp.md` | OTP خریدار |

## Status

Phases **0–7** کامل؛ Phase **8** (OTP / account / addresses) در UI+Medusa موجود است.  
Monorepo: Medusa داخل ریپو است — یک clone کافی است.
