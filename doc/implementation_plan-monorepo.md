# طرح یکپارچه‌سازی Monorepo (mashoodwear-medusa)

## هدف

یک ریپوی Git کامل تا بتوان با `git clone` کل استک را گرفت، لوکال کار کرد، و همان را push کرد.

## تصمیم‌ها

- ریپو: `callmesallad/mashoodwear-medusa`
- Medusa: فقط Iran Pack → `apps/medusa` (از `my-medusa-store/apps/backend`)
- `frontend/` و `backend/` (CMS) بدون rename باقی ماندند

## ساختار

```text
apps/medusa/     Medusa v2 Iran Pack (:9000)
frontend/        Vite storefront (:5173)
backend/         CMS Express (:3001)
docker-compose   MySQL + Postgres + Redis
```

## منبع حقیقت

بعد از این تغییر، کار روی همین ریپو است. مسیر قدیمی `F:\medusa-develop\my-medusa-store` آرشیو محسوب می‌شود.

## لوکال

```bash
npm run install:all
npm run db:up
cp apps/medusa/.env.example apps/medusa/.env
npm run dev:medusa
npm run dev:cms
npm run dev:frontend
```

## دیپلوی

`scripts/deploy-dual-stack-iran.sh` از `apps/medusa` داخل monorepo استفاده می‌کند؛ tarball فقط fallback است.
