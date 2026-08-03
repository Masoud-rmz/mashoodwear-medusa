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
# طرح پیاده‌سازی — اتصال Mashhoodwear به Medusa

**تاریخ:** ۱۴۰۵-۰۵-۰۴  
**مسیر:** الف (حفظ UI فعلی Vite) + پرداخت Iran Pack  
**ادمین commerce:** گزینهٔ الف — فقط Medusa Admin (`:9000/app`)؛ داخل `/admin` mashoodwear بازسازی نمی‌شود  
**پروژه جدید:** `mashoodwear-medusa`  
**اصل دست‌نخورده:** `mashoodwear`

---

## ۱. هدف

ویترین فعلی Mashhoodwear (React + Vite) را به بک‌اند **Medusa v2** (`my-medusa-store` / Iran Pack) وصل کنیم تا کاتالوگ، موجودی، قیمت IRT، سبد، آدرس ایران، ارسال و **پرداخت بانکی** از Medusa بیاید؛ بدون بازنویسی ظاهر برند.

---

## ۲. محدوده مسیر اصلی

| حوزه | تصمیم |
|------|--------|
| UI عمومی | همان Vite / React Router |
| محصولات / دسته‌ها / فیلتر | Medusa Store API |
| سبد | Medusa Cart API (جایگزین `localStorage` خالص) |
| چک‌اوت | آدرس ایران + shipping options + پرداخت Iran Pack (`pp_iran-bank_iran`) |
| DM اینستا/تلگرام | فقط fallback اختیاری — نه مسیر اصلی |
| ادمین commerce (محصول، سفارش، موجودی، پرداخت، مشتری، منطقه، shipping) | **فقط** Medusa Admin آماده (`http://localhost:9000/app`) — لینک از `/admin` |
| پنل `/admin` mashoodwear | فقط CMS برند (pages، lookbook، home/settings) + لینک به Medusa Admin |
| CMS (صفحات، Lookbook، home/checkout settings) | Express + MySQL فعلی (موقت) |
| پرداخت بانکی ایران | **داخل محدوده** (مسیر اصلی) |

---

## ۳. معماری هدف

```
Browser (Vite SPA)
  ├─ Catalog / Cart     ──► Medusa Store API  (:9000)  + x-publishable-api-key
  ├─ Address / Shipping ──► Medusa Store API  (validate-address, shipping options)
  ├─ Payment            ──► Medusa payment collection + session (pp_iran-bank_iran)
  │                         └─ redirect → bank/stub → callback → complete cart
  └─ CMS / Settings     ──► Express API       (:3001)  + MySQL
Medusa Admin            ──► :9000/app
Bank / stub gateway     ◄── provider Iran Pack (verify فقط روی Medusa)
```

- Adapter لایه فرانت: پاسخ Medusa را به shape فعلی UI (`types.js`) مپ می‌کند تا صفحات Products/Detail کمتر عوض شوند.
- Backend Express فقط برای CMS/settings/uploads می‌ماند؛ routeهای `/api/products` و ادمین محصولات دیگر منبع حقیقت نیستند.
- منطق verify / webhook پرداخت **هرگز** به React کپی نمی‌شود؛ فرانت فقط session می‌سازد، redirect می‌کند، callback را می‌گیرد و complete cart را صدا می‌زند.
- **ادمین الف:** قابلیت‌های Medusa Admin (سفارش، موجودی، پرداخت، …) را داخل UI mashoodwear کپی/بازسازی **نمی‌کنیم**؛ فروشنده همان `:9000/app` را استفاده می‌کند.

---

## ۴. جریان خریدار (C-01 … C-08)

| کد | مرحله | توضیح |
|----|--------|--------|
| C-01 | کاتالوگ | لیست / جزئیات محصول از Store API (منطقه ایران / IRT) |
| C-02 | سبد | ایجاد cart، افزودن `variant_id`، به‌روزرسانی تعداد |
| C-03 | آدرس | ثبت آدرس ایران + `validate-address` |
| C-04 | ارسال | انتخاب shipping option منطقه ایران روی cart |
| C-05 | شروع پرداخت | payment collection + payment session با `pp_iran-bank_iran` |
| C-06 | درگاه | redirect خریدار به URL پرداخت (stub یا بانک) |
| C-07 | بازگشت | callback از درگاه؛ complete cart روی موفقیت |
| C-08 | نتیجه | صفحه وضعیت: `paid` / `failed` / `pending_payment` |

---

## ۵. وابستگی‌ها

| وابستگی | محل |
|---------|-----|
| Medusa backend | `F:\medusa-develop\my-medusa-store\apps\backend` |
| Region ایران + IRT | seed Iran Pack |
| Provider پرداخت | `pp_iran-bank_iran` |
| Publishable API Key | Admin یا script sync |
| Postgres (+ Redis طبق `.env` مدوسا) | محیط اجرای Medusa |

---

## ۶. تصمیم‌های کلیدی

1. **Adapter نه rewrite کامل UI** — مپینگ product/cart در `frontend/src/api/medusa/` و mapperها.
2. **variant_id مدوسا** جایگزین `productId + size + color` در سبد می‌شود؛ سبد قدیمی localStorage یک‌بار migrate یا clear می‌شود.
3. **قیمت** از `calculated_price` منطقه ایران (IRT)؛ فرمت نمایش فعلی (اعداد + ویرگول غربی) حفظ می‌شود.
4. **Checkout = آدرس + ارسال + پرداخت**؛ DM فقط لینک پشتیبان اختیاری است.
5. **Verify فقط در Medusa / provider** — فرانت منطق بانکی را پیاده نمی‌کند.
6. **ادمین commerce = فقط Medusa Admin** (گزینه الف). CRUD محصول/دسته/سفارش/پرداخت داخل `/admin` mashoodwear ساخته نمی‌شود؛ فقط deprecate + لینک واضح به `:9000/app`.
7. **`/admin` mashoodwear** فقط برای CMS برند می‌ماند (تا انتقال بعدی).
8. **Collections برند** اگر در Medusa معادل مستقیم ندارند: فعلاً از `product tags` / `collections` مدوسا یا نگه‌داشتن لیست CMS — در تسک‌ها مشخص می‌شود.

---

## ۷. ریسک‌ها (breaking)

- شناسه محصول/واریانت عوض می‌شود → سبد و تست‌های E2E باید به‌روز شوند.
- فیلتر size/color روی option مدوسا باید دوباره wire شود.
- تصاویر محصول از File module / URL مدوسا می‌آیند نه `/uploads` محلی.
- دو سرویس همزمان (Express + Medusa) در dev پیچیده‌تر است.
- callback و وضعیت‌های پرداخت به پیکربندی صحیح `pp_iran-bank_iran` وابسته‌اند.
- تغییر رفتار چک‌اوت از DM به پرداخت آنلاین مسیر اصلی را برای خریدار عوض می‌کند.

---

## ۸. خارج از محدوده

- بازسازی قابلیت‌های Medusa Admin داخل `/admin` mashoodwear (سفارش، موجودی، مشتری، تخفیف، …)
- OTP / احراز هویت موبایل خریدار
- SMS اعلان سفارش
- انتقال کامل CMS به Medusa
- بازنویسی storefront به Next.js
- حساب مشتری و تاریخچه سفارش در پنل خریدار (فاز اختیاری بعدی)

---

## ۹. معیار اتمام

- لیست و جزئیات محصول از Medusa لود می‌شود (منطقه ایران / IRT).
- افزودن به سبد و به‌روزرسانی تعداد از Cart API کار می‌کند.
- Checkout شامل آدرس ایران، shipping، و پرداخت با `pp_iran-bank_iran` است.
- صفحه نتیجه سفارش وضعیت‌های `paid` / `failed` / `pending_payment` را درست نشان می‌دهد.
- DM فقط به‌عنوان fallback اختیاری در دسترس است (نه مسیر اصلی).
- مدیریت محصول/سفارش/پرداخت فقط از Medusa Admin؛ `/admin` mashoodwear به آن لینک می‌دهد و CRUD commerce ندارد.
- اصل `mashoodwear` بدون تغییر مانده است.
- تست واحد mapper + smoke دستی کاتالوگ/سبد/پرداخت در برابر backend محلی.