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
}
table td code, table th code {
  direction: ltr;
  unicode-bidi: embed;
  text-align: left;
  display: inline-block;
}
</style>

# راهنمای OTP و حساب خریدار (C-09)

> **منبع حقیقت بک‌اند:** `apps/medusa` (همین monorepo)  
> **ویترین تست:** `C:\Users\KASRA\Desktop\mashoodwear-medusa`  
> **قرارداد API:** `my-medusa-store/docs/phase-a-iran-pack/storefront-api-contract.md` (C-09)

## تمثیل ساده

مثل نگهبان ساختمان که اول با پیامک کد می‌فرستد تا هویت‌تان را ثابت کنید؛ بعد می‌توانید با همان شماره + رمز (یا دوباره با کد) وارد شوید. کلید پنل پیامک فقط پیش نگهبان (سرور) است، نه روی گوشی بازدیدکننده (Vite).

## کجا پیاده شده؟

| لایه | مسیر | نقش |
|------|------|-----|
| Auth provider | `apps/medusa/src/modules/phone-auth/` | OTP هویت موبایل + SMS.ir / stub |
| Store routes | `…/src/api/store/iran/auth/` | قرارداد ویترین `{ ok, … }` |
| Config | `apps/backend/medusa-config.ts` | `phone-auth` + `emailpass` برای `customer` |
| Adapter ویترین | `mashoodwear-medusa/frontend/src/api/medusa/auth.js` | فراخوانی مسیرهای بالا |
| JWT محلی | `…/customerAuth.js` | `mashood_customer_token` در localStorage |
| UI | `/login` · `/account` | ثبت‌نام / ورود / پروفایل / **آدرس‌های ذخیره‌شده** / سفارش‌ها |

**مهم:** منطق OTP و کلید SMS.ir روی **Medusa** است، نه Express CMS و نه React.

## جریان‌ها

1. **ثبت‌نام:** شماره → ارسال OTP → تأیید + نام + رمز → JWT مشتری  
2. **ورود با رمز:** شماره + رمز  
3. **ورود با OTP:** شماره → ارسال OTP → تأیید کد  
4. بعد از لاگین موفق: `transferCart` سبد مهمان به مشتری (در صورت وجود `cart_id`)
5. **آدرس ذخیره‌شده:** در `/account` یا هنگام checkout (اگر لاگین باشد) با Store API روی مشتری Medusa ذخیره می‌شود؛ در Admin در بخش Addresses همان مشتری دیده می‌شود

رمز روی سرور با provider `emailpass` و ایمیل مصنوعی `{phone}@phone.local` ذخیره می‌شود؛ UI فقط شماره می‌بیند.

## API ویترین

| Method | Path | نقش |
|--------|------|-----|
| POST | `/store/iran/auth/otp/send` | body: `{ phone, purpose: "register" \| "login" \| "reset" }` |
| POST | `/store/iran/auth/register` | `{ phone, otp, password, first_name, last_name? }` |
| POST | `/store/iran/auth/login/password` | `{ phone, password }` |
| POST | `/store/iran/auth/login/otp` | `{ phone, otp }` |
| POST | `/store/iran/auth/password/reset` | `{ phone, otp, password }` — به‌روزرسانی رمز emailpass |
| GET | `/store/customers/me` | پروفایل (Bearer) |
| POST | `/store/customers/me` | به‌روزرسانی نام |
| GET | `/store/customers/me/addresses` | لیست آدرس‌های ذخیره‌شده (Bearer) |
| POST | `/store/customers/me/addresses` | ایجاد آدرس ایران (middleware validate Iran Pack) |
| POST | `/store/customers/me/addresses/:id` | به‌روزرسانی آدرس |
| DELETE | `/store/customers/me/addresses/:id` | حذف آدرس |
| GET | `/store/orders` | تاریخچه سفارش (Bearer) |

هدرها: `x-publishable-api-key` · برای مسیرهای me/orders/addresses: `Authorization: Bearer <token>`

**نکته آدرس:** قبل از create/update، ویترین معمولاً `POST /store/iran/validate-address` را هم صدا می‌زند؛ middleware مدوسا روی create/update آدرس مشتری هم همان validation را اجباری می‌کند (`country_code: ir`).

## Env بک‌اند Medusa

در `apps/backend/.env` (نمونه در `.env.template`):

| متغیر | نقش |
|--------|-----|
| `PHONE_AUTH_JWT_SECRET` | امضای هش OTP (fallback: `JWT_SECRET`) |
| `SMS_IR_API_KEY` | کلید API پنل SMS.ir — **فقط سرور** |
| `SMS_IR_TEMPLATE_ID` | شناسه قالب VERIFY با پارامتر `Code` |
| `SMS_IR_STUB` | `1` = اجبار stub؛ بدون کلید/قالب هم stub خودکار است |
| `AUTH_CORS` | باید `http://localhost:5173` را داشته باشد |

### Stub (توسعه بدون پیامک)

- OTP در لاگ سرور چاپ می‌شود.
- در پاسخ غیر-production ممکن است `debug_otp` برگردد تا UI تست سریع شود.
- برای پیامک واقعی: کلید + TemplateId بگذار و `SMS_IR_STUB` را خاموش کن.

## صفحات ویترین

| URL | کار |
|-----|-----|
| `http://localhost:5173/login` | ثبت‌نام / ورود / فراموشی رمز |
| `http://localhost:5173/account` | پروفایل + آدرس‌های ذخیره‌شده + سفارش‌ها (نیاز به لاگین) |
| `http://localhost:5173/account/orders/:id` | جزئیات سفارش + درخواست مرجوعی |
| `http://localhost:5173/wishlist` | علاقه‌مندی‌های محلی |
| `http://localhost:5173/categories` | دسته‌های Medusa |
| `http://localhost:5173/checkout` | اگر لاگین باشد: انتخاب آدرس ذخیره‌شده یا ذخیرهٔ آدرس جدید در حساب |
| هدر | لینک Login یا Account · Wishlist · Categories |

## نمایش در Medusa Admin (گزینه الف)

آدرس‌های ذخیره‌شده **بدون UI سفارشی در `/admin` mashoodwear** در پنل مدوسا دیده می‌شوند:

1. باز کردن `http://localhost:9000/app`
2. **Customers** → انتخاب مشتری (با شماره / ایمیل مصنوعی `{phone}@phone.local`)
3. بخش **Addresses** روی صفحهٔ جزئیات مشتری — افزودن / ویرایش / حذف هم از همین‌جا ممکن است

منبع حقیقت آدرس مشتری = Customer Address در Medusa؛ ویترین فقط Store API را صدا می‌زند.

## Dev / Admin Vite

اگر Admin (`:9000/app`) خطای `Failed to fetch dynamically imported module` از `.vite/deps` داد:

1. پوشه `apps/backend/node_modules/.vite` را پاک کن  
2. `npm run dev` در بک‌اند Medusa را ری‌استارت کن  
3. Hard Refresh روی `/app`

## تست

```bash
# Medusa — unit OTP/SMS stub
cd apps/medusa
# یا از روت: npm run dev:medusa
# Windows PowerShell:
$env:TEST_TYPE='unit'; $env:NODE_OPTIONS='--experimental-vm-modules'
npx jest --runInBand --forceExit --testPathPattern=phone-auth

# ویترین — پیام‌ها + mapper سفارش
cd C:\Users\KASRA\Desktop\mashoodwear-medusa
npm run test:unit
```

Smoke دستی: stub → ثبت‌نام در `/login` → ورود با رمز → ورود با OTP → `/account` → افزودن آدرس ایران → در Medusa Admin همان آدرس در Customers → Addresses → در `/checkout` (لاگین) انتخاب آدرس ذخیره‌شده.

## قابل‌انتقال به UI سفارشی بعدی

- همان مسیرهای `/store/iran/auth/*` و کدهای خطای پایدار (`phone_invalid`, `otp_expired`, …)
- آدرس مشتری: `/store/customers/me/addresses` + validate Iran Pack؛ Admin فقط Customers → Addresses
- هرگز `SMS_IR_API_KEY` را در env فرانت نگذار
- synthetic email را در UI نشان نده
- guest checkout می‌تواند بماند؛ لاگین اختیاری است مگر محصول خلاف آن را بخواهد

## لینک‌های مرتبط

- [`handshake-learnings.md`](./handshake-learnings.md) — ردیف C-09  
- [`tasks-medusa.md`](./tasks-medusa.md) — ۸.۲ و ۸.۴  
- [`AGENTS.md`](../AGENTS.md)  
- Medusa: `apps/backend/src/modules/phone-auth/README.md`  
- قرارداد: `storefront-api-contract.md` (C-09)
