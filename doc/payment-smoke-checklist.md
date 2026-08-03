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

# چک‌لیست Smoke پرداخت — C-03…C-08

> برای mashoodwear-medusa + Iran Pack (`pp_iran-bank_iran`).  
> Verify فقط روی Medusa؛ فرانت فقط API را صدا می‌زند.  
> مرور نهایی فاز ۷: مسیرها و وضعیت‌های زیر همچنان با `PaymentPage` / `OrderResultPage` هم‌خوان‌اند.

## پیش‌نیاز

- Medusa: `http://localhost:9000` (Iran Pack) — `npm run notes:medusa`
- Storefront: `http://localhost:5173` با `VITE_COMMERCE_PROVIDER=medusa`
- Publishable key + region ایران در `frontend/.env`
- Provider `pp_iran-bank_iran` روی region فعال

## مسیر موفق (happy path)

| # | گام | انتظار |
|---|-----|--------|
| 1 | محصول → Add to cart → `/cart` | خط سبد با قیمت IRT |
| 2 | Continue to Checkout → `/checkout` | فرم آدرس ایران |
| C-03 | آدرس معتبر (استان شناخته‌شده، کدپستی ۱۰ رقم، موبایل `09…`) → تأیید | بدون خطای `iran_*` |
| C-04 | انتخاب shipping option | totals اقلام + ارسال به‌روز |
| C-05 | «ادامه به پرداخت» → `/checkout/payment` | مبلغ نهایی + دکمه درگاه |
| C-06 | کلیک «پرداخت از طریق درگاه» | redirect به stub `/store/iran-bank/stub/pay` |
| C-06b | stub با `result=success` (پیش‌فرض) | برگشت به `/order/result?result=success&ref=…` |
| C-07 | صفحه نتیجه | وضعیت **paid** + شماره/شناسه سفارش |
| C-07b | localStorage | `mashood_medusa_cart_id` پاک شده؛ سبد خالی |

## مسیر ناموفق

| # | گام | انتظار |
|---|-----|--------|
| F1 | روی URL stub به‌جای success مقدار `result=fail` بگذارید (یا از درگاه fail شبیه‌سازی) | `/order/result?result=fail` |
| F2 | صفحه نتیجه | وضعیت **failed** + دکمه تلاش مجدد |
| F3 | سبد | هنوز موجود است (cart_id پاک نشده) |

## مسیر در انتظار

| # | گام | انتظار |
|---|-----|--------|
| P1 | باز کردن `/order/result` بدون query | **pending_payment** |
| P2 | success ولی complete ناموفق (شبکه قطع) | **pending_payment** + پیام خطا |

## وضعیت‌های UI

| وضعیت سیستم | متن تقریبی خریدار |
|-------------|-------------------|
| `paid` | پرداخت موفق — سفارش ثبت شد |
| `failed` / `payment_failed` | پرداخت ناموفق — تلاش مجدد |
| `pending_payment` | هنوز تأیید نشده |
| `config_incomplete` | درگاه آماده‌نیست |

## ممنوع

- کپی منطق verify / HMAC stub داخل React
- اتکا به DM اینستا به‌عنوان مسیر اصلی (فقط fallback در checkout)

## اثبات API بدون UI (اختیاری)

```bash
cd F:\medusa-develop\my-medusa-store\apps\backend
npx medusa exec ./src/scripts/phase-4-smoke.ts
```
