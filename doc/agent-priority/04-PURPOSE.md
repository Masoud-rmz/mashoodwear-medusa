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

# هدف پروژه — Medusa UI Testbed

## تمثیل ساده

مثل این است که قبل از دوختن کت‌وشلوار سفارشی مشتری، یک مانکن آماده را با همان پارچه و دوخت کارخانه امتحان کنیم تا ببینیم کجا گیر می‌کند؛ بعد الگوی درست را برای کت اختصاصی استفاده کنیم.

- **مانکن آماده** = UI فعلی Mashhoodwear (Vite)
- **کارخانه** = Medusa + Iran Pack
- **کت سفارشی بعدی** = ویترین شخصی مشتری روی همان Medusa

## هدف اصلی

1. سوار کردن یک UI آماده روی Medusa برای **تست واقعی** جریان خرید.
2. پیدا کردن باگ‌ها و نقاط ضعف API / پرداخت / آدرس ایران / سبد.
3. ثبت آموخته‌ها طوری که ساخت UI بعدی برای مشتری سریع‌تر و کم‌ریسک‌تر باشد.

## این پروژه چیست / نیست

| هست | نیست |
|-----|------|
| Testbed اتصال UI ↔ Medusa | محصول نهایی برند مشتری |
| محل ثبت bug و handshake | بازنویسی کامل Medusa Admin |
| منبع الگوی adapter برای UI بعدی | جایگزین `my-medusa-store` backend |

## چه چیزی به UI سفارشی بعدی منتقل می‌شود

این‌ها را **حفظ و منتقل** کن (نه ظاهر Mashhoodwear):

- قرارداد جریان C-01…C-09 (کاتالوگ → سبد → آدرس → ارسال → پرداخت → سفارش → OTP/حساب)
- قواعد validation آدرس ایران و کدهای خطای پایدار
- الگوی SDK + publishable key + region ایران / IRT
- ممنوعیت کپی verify درگاه در فرانت
- الگوی OTP موبایل: مسیرهای `/store/iran/auth/*` روی Medusa؛ کلید SMS فقط سرور (`doc/auth-otp.md`)
- فهرست باگ‌ها در `handshake-learnings.md`
- تصمیم ادمین: commerce در Medusa Admin؛ ویترین جدا

ظاهر برند، فونت، و کامپوننت‌های Mashhoodwear الزاماً به UI بعدی نمی‌روند مگر مشتری همان را بخواهد.

## منبع حقیقت اسناد (اولویت ذخیره)

چت alone کافی نیست. ترتیب برای Agent و انسان:

| رتبه | کجا | نقش |
|------|-----|-----|
| ۱ | `AGENTS.md` (ریشه همین ریپو) | اول چیزی که Agent می‌خواند |
| ۲ | `.cursor/rules/…mdc` با `alwaysApply` | در هر چت همین workspace اعمال می‌شود |
| ۳ | `doc/handshake-learnings.md` | لاگ زنده باگ/کشف — مهم‌ترین بخش برای UI بعدی |
| ۴ | `doc/PURPOSE.md` + `doc/tasks-medusa.md` | هدف تست‌بد + پیشرفت |
| ۵ | AI learning docs (`medusa-ui-testbed-then-custom-storefront.md`) | دانش عمومی + لینک به ریپو |

ایده: Mashhoodwear اینجا مانکن تست است؛ چیزی که برای مشتری بعدی می‌ماند **قرارداد API + فهرست باگ‌ها** است، نه لزوماً ظاهر برند.

**پوشهٔ یک‌جا برای ذخیرهٔ دانش:** `doc/agent-priority/` — همان فایل‌های اولویت با شماره.  
Sync: `npm run sync:agent-priority`

**پوشهٔ یک‌جا برای ساخت UI روی Medusa:** `doc/ui-medusa-guides/` — ترتیب خواندن + کپی checklist / API contract / OTP / payment smoke / …  
Sync: `npm run sync:ui-medusa-guides`

اسناد پشتیبان دیگر: `implementation_plan.md`، `admin-split.md`، `payment-smoke-checklist.md`، `auth-otp.md` (C-09)، و قرارداد API در  
`my-medusa-store/docs/phase-a-iran-pack/storefront-api-contract.md`.

## وضعیت تست‌بد (خلاصه)

فاز ۰–۷ انجام شده: کاتالوگ، سبد، آدرس ایران، ارسال، پرداخت `pp_iran-bank_iran` (stub)، ادمین الف، polish.  
فاز ۸ جزئی: **OTP + حساب خریدار (۸.۲ / ۸.۴)** + **آدرس ذخیره‌شده (۸.۴b)** روی Medusa + صفحات `/login` و `/account` — راهنما: `auth-otp.md`.  
مسیرهای کلیدی ویترین: `/checkout` → `/checkout/payment` → `/order/result` · `/login` → `/account` (آدرس‌ها در Admin: Customers → Addresses).  
باقی اختیاری: درگاه بانکی واقعی، SMS وضعیت سفارش، انتقال کامل CMS.

## قانون به‌روزرسانی

هر بار که یک باگ Medusa/Iran Pack یا رفتار غیرمنتظره API پیدا شد → همان جلسه یک ردیف به `handshake-learnings.md` اضافه شود.  
چت به‌تنهایی کافی نیست؛ بدون این لاگ، چت بعدی از صفر شروع می‌شود.  
پایان جلسهٔ معنادار → `npm run sync:agent-priority` و `npm run sync:ui-medusa-guides` تا هر دو بسته تازه بمانند.
