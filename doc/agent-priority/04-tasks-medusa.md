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
# تسک‌ها — Mashhoodwear × Medusa (مسیر الف + پرداخت)

> **منبع:** `implementation_plan.md`  
> **پروژه:** `C:\Users\KASRA\Desktop\mashoodwear-medusa`  
> **اصل دست‌نخورده:** `C:\Users\KASRA\Desktop\mashoodwear`  
> **Backend:** `apps/medusa` (همین monorepo)  
> **ادمین commerce:** گزینهٔ الف — فقط Medusa Admin (`:9000/app`)؛ داخل `/admin` بازسازی نمی‌شود  
> **وضعیت:** فاز ۰–۷ انجام شد؛ فاز ۸ جزئی: ۸.۲ OTP، ۸.۴ حساب خریدار، ۸.۴b آدرس ذخیره‌شده (راهنما: `doc/auth-otp.md`)

---

## فاز ۰ — آماده‌سازی پروژه و محیط

> **Done when:** پروژه جدید از اصل جدا است؛ env و دسترسی به Medusa محلی و provider پرداخت ایران تأیید شده.

- [x] 0.1 تأیید کپی `mashoodwear-medusa` بدون دست‌کاری اصل `[first]`
- [x] 0.2 `git init` در پروژه جدید (در صورت نیاز) + `.gitignore` از اصل
- [x] 0.3 نصب وابستگی‌های frontend/backend پروژه جدید (`npm install`)
- [x] 0.4 بالا آوردن Medusa backend محلی (`:9000`) + migrate/seed ایران
- [x] 0.5 گرفتن / ساخت Publishable API Key و ثبت در `.env` فرانت
- [x] 0.6 متغیرهای env فرانت: `VITE_MEDUSA_BACKEND_URL`, `VITE_MEDUSA_PUBLISHABLE_KEY`, `VITE_MEDUSA_REGION_ID` (یا country `ir`)
- [x] 0.7 CORS مدوسا برای origin فرانت (`http://localhost:5173`) — `STORE_CORS` به‌روز شد
- [x] 0.8 smoke دستی: `GET /store/products` با publishable key پاسخ ۲۰۰ می‌دهد
- [x] 0.9 تأیید provider پرداخت `pp_iran-bank_iran` در Medusa (region ایران / Iran Pack) فعال و قابل انتخاب است
- [x] 0.10 **Phase complete:** env + Medusa + provider پرداخت + پروژه جدید آماده

---

## فاز ۱ — کلاینت Medusa و Adapter

> **Done when:** لایه API فرانت می‌تواند محصول را از Medusa بخواند و به shape فعلی UI برگرداند.

- [x] 1.1 افزودن `@medusajs/js-sdk` (یا fetch wrapper معادل) به `frontend`
- [x] 1.2 ماژول `frontend/src/api/medusa/client.js` — SDK + headers
- [x] 1.3 mapper: Medusa product → `types.js` Product / ProductDetail `[first]`
- [x] 1.4 mapper: variants → size/color/stock/price سازگار با UI فعلی
- [x] 1.5 mapper: categories / collections (یا tags) برای فیلترها
- [x] 1.6 توابع جایگزین در `client.js` یا facade: `getProducts`, `getProductBySlug`, `getCategories`, `getRelatedProducts`
- [x] 1.7 flag/env `VITE_COMMERCE_PROVIDER=medusa` برای سوئیچ (اختیاری ولی مفید در transition)
- [x] 1.8 unit test برای mapperها (قیمت IRT، sold out، گزینه سایز/رنگ)
- [x] 1.9 **Phase complete:** mapper + client بدون UI هنوز قابل تست است

---

## فاز ۲ — صفحات کاتالوگ روی Medusa

> **Done when:** Home / Products / Product detail از Medusa داده می‌گیرند؛ ظاهر برند حفظ است.

- [x] 2.1 Home — New Arrivals از Medusa (featured / tag / limit)
- [x] 2.2 `/products` — لیست + pagination از Store API
- [x] 2.3 فیلتر category / size / color / search روی query مدوسا (یا فیلتر client-side موقت با TODO)
- [x] 2.4 Product detail — slug → product + انتخاب variant
- [x] 2.5 Related products (category یا tag مشترک)
- [x] 2.6 تصاویر از URL مدوسا (شکستن `/uploads` برای کاتالوگ)
- [x] 2.7 Collection pages — Medusa collection؛ اگر خالی بود فال‌بک CMS موقت (Drift/Urban Night)
- [x] 2.8 به‌روزرسانی E2E کاتالوگ که به Express محصول وابسته بودند
- [x] 2.9 **Phase complete:** مرور دستی 375/768/1440 + لیست/جزئیات از مدوسا

---

## فاز ۳ — سبد Medusa

> **Done when:** سبد پایدار روی Cart API است؛ UI Cart فعلی رفتار را حفظ می‌کند.

- [x] 3.1 ایجاد/بازیابی cart (`POST /store/carts`) + ذخیره `cart_id` در localStorage
- [x] 3.2 افزودن line item با `variant_id` (جایگزین productId+size+color)
- [x] 3.3 به‌روزرسانی تعداد / حذف خط
- [x] 3.4 بازنویسی `useCart` / `cartStorage` برای sync با Medusa `[first]`
- [x] 3.5 migration یک‌باره: پاک کردن سبد قدیمی `mashood_cart` یا map در صورت امکان
- [x] 3.6 Cart page — خواندن از cart مدوسا (قیمت، تصویر، موجودی)
- [x] 3.7 Badge تعداد در هدر از cart مدوسا
- [x] 3.8 unit/integration سبک برای add/update/remove
- [x] 3.9 **Phase complete:** add to cart → cart page بدون Express catalog

---

## فاز ۴ — آدرس ایران + ارسال (C-03 / C-04)

> **Done when:** خریدار می‌تواند آدرس ایران را ثبت کند و روش ارسال منطقه ایران را انتخاب کند؛ cart آمادهٔ پرداخت است.

- [x] 4.1 صفحه / مرحله checkout — ورود آدرس ایران (استان، شهر، کدپستی، موبایل، نام) هم‌راستا با Store API
- [x] 4.2 فراخوانی `validate-address` (Iran Pack) قبل از ادامه؛ نمایش خطای فارسی قابل فهم
- [x] 4.3 ذخیره آدرس روی cart (`update cart` / shipping address)
- [x] 4.4 واکشی shipping options منطقه ایران و نمایش در UI
- [x] 4.5 انتخاب shipping option و ثبت روی cart
- [x] 4.6 به‌روزرسانی totals (اقلام + ارسال) روی همان صفحه
- [x] 4.7 empty cart / خطاهای شبکه با UX واضح
- [x] 4.8 E2E سبک: cart → آدرس معتبر → shipping انتخاب‌شده
- [x] 4.9 **Phase complete:** C-03 + C-04 سبز؛ cart آماده payment session

---

## فاز ۵ — پرداخت بانکی + نتیجه سفارش (C-05 / C-06 / C-07 / C-08)

> **Done when:** جریان payment collection با `pp_iran-bank_iran`، redirect/callback، complete cart و صفحه وضعیت سفارش کار می‌کند. منطق verify فقط روی Medusa می‌ماند.

- [x] 5.1 ایجاد / بازیابی payment collection برای cart
- [x] 5.2 ایجاد payment session با provider `pp_iran-bank_iran` (stub یا پیکربندی Iran Pack)
- [x] 5.3 UI «پرداخت» — نمایش مبلغ نهایی IRT + دکمه هدایت به درگاه / صفحه stub
- [x] 5.4 redirect خریدار به URL پرداخت (از session / provider data)
- [x] 5.5 صفحه / route callback برگشت از درگاه (query params طبق handshake Iran Pack)
- [x] 5.6 complete cart پس از موفقیت پرداخت (Store API) — **نه** کپی منطق verify به React
- [x] 5.7 صفحه نتیجه سفارش: وضعیت‌های `paid` / `failed` / `pending_payment` با پیام فارسی
- [x] 5.8 نمایش شماره سفارش / order id در صورت وجود
- [x] 5.9 پاک‌سازی یا جدا کردن `cart_id` محلی بعد از سفارش موفق
- [x] 5.10 (اختیاری fallback) لینک DM اینستا/تلگرام فقط به‌عنوان پشتیبان؛ مسیر اصلی = پرداخت ایران
- [x] 5.11 smoke دستی طبق `doc/payment-smoke-checklist.md` (C-05…C-08)
- [x] 5.12 **Phase complete:** پرداخت بانکی end-to-end روی مسیر اصلی؛ verify فقط در بک‌اند

---

## فاز ۶ — ادمین الف: Medusa Admin + CMS سبک

> **Done when:** commerce فقط از Medusa Admin مدیریت می‌شود؛ `/admin` mashoodwear فقط CMS + لینک است؛ هیچ UI سفارشی برای سفارش/موجودی/پرداخت ساخته نشده.

- [x] 6.1 env `VITE_MEDUSA_ADMIN_URL` (پیش‌فرض `http://localhost:9000/app`)
- [x] 6.2 در Dashboard / منوی `/admin`: دکمهٔ واضح «مدیریت فروشگاه در Medusa Admin» (محصول، سفارش، موجودی، پرداخت)
- [x] 6.3 deprecate / مخفی کردن CRUD محصول و دسته در `/admin` (یا صفحهٔ جایگزین با لینک به Medusa) `[first]`
- [x] 6.4 **نساختن** صفحات سفارش / موجودی / مشتری / پرداخت داخل mashoodwear (خارج از محدودهٔ گزینه الف)
- [x] 6.5 نگه‌داشتن ادمین CMS: pages، home، site settings روی Express (collections حذف شد → فقط Medusa)
- [x] 6.6 مستند `doc/admin-split.md`: Medusa Admin = commerce · `/admin` = CMS برند
- [x] 6.7 (اختیاری) اسکریپت seed محصولات mashoodwear → Medusa از MySQL اصل یا export JSON
- [x] 6.8 **Phase complete:** مرز ادمین الف روشن؛ بدون double source of truth برای کاتالوگ

---

## فاز ۷ — DevOps فرانت و polish

> **Done when:** dev scripts و README پروژه جدید کامل‌اند؛ چک‌لیست smoke پرداخت موجود است؛ اصل همچنان سالم است.

- [x] 7.1 اسکریپت‌های root: `dev:frontend`, `dev:cms-backend`, یادداشت `medusa` جدا (`notes:medusa`)
- [x] 7.2 به‌روزرسانی `README.md` با دستورات روزانه (Medusa + Vite + Express CMS + پرداخت)
- [x] 7.3 Vite proxy فقط برای `/api` و `/uploads` CMS؛ درخواست‌های مدوسا مستقیم به `:9000` (یا proxy جدا)
- [x] 7.4 حذف/جدا کردن تست‌هایی که فقط Express catalog را فرض می‌کنند → `backend/tests/legacy-express-catalog/` + `test:legacy-express-catalog`
- [x] 7.5 افزودن `doc/payment-smoke-checklist.md` (مراحل C-03…C-08 + وضعیت‌های paid/failed/pending) — **انجام‌شده در فاز ۵**؛ در فاز ۷ فقط مرور نهایی
- [x] 7.6 تأیید نهایی: پوشه `mashoodwear` بدون diff ناخواسته
- [x] 7.7 **Phase complete:** migration مسیر الف + پرداخت قابل تحویل برای review

---

## فاز ۹ — باگ‌فیکس ویترین: سایز/رنگ + کد تخفیف (Medusa SoT)

> **Done when:** گزینه‌های واریانت از Medusa درست در PDP دیده می‌شوند؛ کد تخفیف از Cart با Store API اعمال می‌شود؛ ساخت کد/واریانت فقط در Medusa Admin.

- [x] 9.1 expand `*variants.options.option` + resolve title از `product.options`
- [x] 9.2 PDP: مخفی کردن Color وقتی محصول Color option ندارد؛ auto `Default`
- [x] 9.3 Cart: `addPromotions` / `removePromotions` + نمایش تخفیف در totals
- [x] 9.4 به‌روزرسانی `admin-split.md` + `handshake-learnings.md`
- [x] 9.5 unit test mapper / variantSelection / promotionHelpers
- [ ] 9.6 smoke دستی: محصول با Size+Color در Medusa → PDP درست؛ Promotion در Admin → کد در Cart

---

## فاز ۱۰ — پر کردن شکاف‌های چک‌لیست Storefront (بدون درگاه واقعی / SMS واقعی)

> **Done when:** مالیات، جزئیات سفارش، بازیابی رمز OTP، categories، فیلتر کامل‌تر، gift card، wishlist، مرجوعی در ویترین تست‌بد هستند.

- [x] 10.1 `tax_total` (+ gift card total) در Cart/Checkout/Payment totals
- [x] 10.2 `/account/orders/:orderId` + mapper جزئیات سفارش
- [x] 10.3 بازیابی رمز: `purpose: reset` + `POST /store/iran/auth/password/reset` + UI لاگین
- [x] 10.4 `/categories` و `/categories/:slug` + فیلتر سایز/رنگ با صفحه‌بندی تا ۵۰۰
- [x] 10.5 `@medusajs/loyalty-plugin` + `GiftCodeForm` روی Cart
- [x] 10.6 Wishlist localStorage + `/wishlist` + دکمه قلب
- [x] 10.7 Order return panel (`POST /store/returns`) + seed «مرجوعی (ایران)»
- [x] 10.8 به‌روزرسانی چک‌لیست / auth-otp / handshake / tasks
- [ ] 10.9 smoke دستی: reset رمز stub · gift card Admin · return option · wishlist

---

## فاز ۸ — اختیاری / بعداً (خارج از مسیر اصلی فعلی)

> فقط پس از تأیید جدا؛ مسیر اصلی فازهای ۰–۷ را بلوکه نکند.

- [ ] 8.1 اتصال درگاه واقعی بانک (جایگزین stub) طبق env Iran Pack
- [x] 8.2 OTP / احراز هویت موبایل خریدار
- [ ] 8.3 SMS اعلان سفارش
- [x] 8.4 حساب مشتری و تاریخچه سفارش در پنل خریدار
- [x] 8.4b آدرس ذخیره‌شده در حساب + نمایش در Medusa Admin (Customers → Addresses) · راهنما: `doc/auth-otp.md`
- [ ] 8.5 انتقال کامل CMS به Medusa / حذف تدریجی Express برای محتوای سبک
- [ ] 8.6 (فقط اگر بعداً تأیید شد) بازسازی بخشی از Medusa Admin داخل `/admin` — خلاف گزینه الف فعلی

---

## ترتیب پیشنهادی اجرا

```
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
         (8 اختیاری — درگاه واقعی / OTP / SMS / حساب / CMS کامل)
```

## معیار پذیرش کلی (مسیر الف + پرداخت)

1. کاتالوگ و سبد از Medusa  
2. Checkout = آدرس ایران + ارسال + پرداخت Iran Pack (`pp_iran-bank_iran`)  
3. DM فقط fallback اختیاری (نه مسیر اصلی)  
4. ادمین commerce = فقط Medusa Admin (`:9000/app`)؛ `/admin` فقط CMS + لینک  
5. CMS روی Express (موقت)  
6. اصل `mashoodwear` دست‌نخورده  
7. تست mapper + smoke دستی کاتالوگ/سبد/پرداخت سبز  
8. منطق verify پرداخت هرگز در React کپی نشده