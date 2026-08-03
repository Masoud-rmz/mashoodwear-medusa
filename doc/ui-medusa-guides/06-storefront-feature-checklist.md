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

# چک‌لیست ساخت Storefront از صفر روی Medusa v2

## تمثیل روزمره

Medusa مثل **موتور فروشگاه + انبار مرکزی** است؛ Storefront مثل **ویترین و صندوق و اتاق پرو** است که خریدار می‌بیند. موتور تقریباً همه‌چیز را حساب می‌کند (قیمت، مالیات، تخفیف، ارسال، پرداخت)؛ شما فقط صفحات، دکمه‌ها و نمایش اعداد را می‌سازید و به Store API وصل می‌کنید.

این سند **فهرست قابلیت‌ها و UI لازم** است — نه طرح بصری برند.

---

## وضعیت mashoodwear-medusa (آخرین sync)

| حوزه | وضعیت |
|------|--------|
| env / publishable key / region / CORS | انجام |
| کاتالوگ + variant + موجودی + کالکشن | انجام |
| `/categories` + `/categories/:slug` | انجام |
| فیلتر سایز/رنگ/قیمت | هیبرید — صفحه‌بندی سروری تا ۵۰۰ سپس فیلتر گزینه |
| سبد + پرومو + کارت هدیه (Loyalty plugin) | انجام |
| مالیات در totals (`tax_total`) | انجام |
| Checkout ایران + shipping + پرداخت stub | انجام (درگاه واقعی = ۸.۱ باز) |
| OTP + لاگین + حساب + آدرس + سفارش‌ها | انجام |
| بازیابی رمز (`purpose: reset` + `/password/reset`) | انجام (SMS واقعی = stub/۸.۳ جدا) |
| `/account/orders/:id` + درخواست مرجوعی | انجام (نیاز به option `is_return` + تحویل) |
| Wishlist (`localStorage`) | انجام |
| درگاه واقعی بانک / SMS اعلان سفارش | **عمداً خارج از این موج** |

---

## دو لایه را قاطی نکنید

| لایه | چه کسی می‌سازد | مثال |
|------|----------------|------|
| **Backend Medusa** | Admin + ماژول‌ها | Region، Tax rate، Promotion، Shipping option، Payment provider |
| **Storefront (فرانت)** | شما | صفحه محصول، دکمه «افزودن به سبد»، فرم کد تخفیف، صفحه لاگین |

اگر چیزی فقط در Admin تنظیم می‌شود ولی در ویترین دکمه‌ای ندارد → در چک‌لیست به‌عنوان «نمایش در totals» یا «اختیاری UI» علامت خورده.

برای ایران (Iran Pack): قرارداد C-01…C-09 در `my-medusa-store` — این چک‌لیست عمومی Medusa است + ستون ایران.

---

## ۰) کلیدها، env و پیش‌نیاز اتصال

بدون این‌ها هیچ صفحه‌ای کار نمی‌کند:

| مورد | چیست | کجا ساخته می‌شود |
|------|------|------------------|
| `MEDUSA_BACKEND_URL` | آدرس API (مثلاً `http://localhost:9000`) | env فرانت |
| **Publishable API Key** | کلید عمومی ویترین برای `/store/*` | Medusa Admin → Settings → Publishable API Keys |
| **Region ID** (یا country مثلاً `ir`) | ارز، مالیات، shipping، payment همان منطقه | Admin → Settings → Regions |
| **Sales Channel** | کانال فروش (وب‌شاپ) | معمولاً به publishable key وصل است |
| `STORE_CORS` | origin فرانت در backend | env مدوسا |
| JWT / cookie session | بعد از لاگین مشتری | Auth Store API |
| (ایران) provider پرداخت `pp_iran-bank_iran` | مسیر اصلی checkout | Iran Pack |
| (ایران) OTP `/store/iran/auth/*` | ورود موبایل | Iran Pack |

- [ ] Backend بالا است و `GET /store/products` با publishable key جواب ۲۰۰ می‌دهد
- [ ] Region ایران / ارز نمایش (IRT یا IRR) مشخص است
- [ ] CORS برای origin ویترین تنظیم شده
- [ ] SDK یا client نازک (`@medusajs/js-sdk` یا fetch) آماده‌است

---

## ۱) نقشهٔ صفحات (Screen Map)

### اولویت A — حداقل قابل فروش (MVP)

| صفحه / مسیر نمونه | کار خریدار | API اصلی Medusa |
|-------------------|------------|-----------------|
| Home / لندینگ | ورود و کشف | محصولات featured / collections |
| `/products` | لیست کاتالوگ | `GET /store/products` |
| `/products/:handle` | جزئیات + انتخاب variant | `GET /store/products/:id` |
| `/cart` | سبد | Cart API |
| `/checkout` | ایمیل/آدرس/ارسال | Cart update + shipping options |
| `/checkout/payment` | انتخاب درگاه و پرداخت | Payment collection + sessions |
| `/order/confirmation` یا `/order/result` | نتیجه سفارش | `complete` cart + `GET /store/orders/:id` |

### اولویت B — حساب و بازگشت خریدار

| صفحه | کار | API |
|------|-----|-----|
| `/login` · `/register` | ورود / ثبت‌نام | Customer auth (emailpass یا ایران OTP) |
| `/account` | پروفایل | `GET/POST /store/customers/me` |
| `/account/orders` | تاریخچه سفارش | `GET /store/orders` (با auth) |
| `/account/addresses` | آدرس‌های ذخیره‌شده | `/store/customers/me/addresses` |
| `/account/orders/:id` | جزئیات یک سفارش | `GET /store/orders/:id` |
| بازیابی رمز | reset password | Auth reset flows |

### اولویت C — کشف و مرچندایزینگ

| صفحه | کار | API |
|------|-----|-----|
| `/categories/:handle` | دسته | Product categories |
| `/collections/:handle` | کالکشن | Product collections |
| جستجو | query روی عنوان/تگ | `GET /store/products?q=` یا فیلتر client |
| (اختیاری) صفحات CMS | درباره، تماس، lookbook | خارج از Medusa (مثلاً Express/CMS) |

### اولویت D — بعد از خرید / پیشرفته

| صفحه | کار | پشتیبانی Medusa |
|------|-----|-----------------|
| پیگیری سفارش (مهمان با شماره+ایمیل) | وضعیت | Order retrieve |
| درخواست مرجوعی / return از ویترین | return request | Order returns (راهنمای docs) |
| Gift card redeem | اعمال کارت هدیه | Gift card module + cart |
| Wishlist | علاقه‌مندی | **هستهٔ Medusa نیست** — سفارشی یا پلاگین |

---

## ۲) چک‌لیست قابلیت‌ها به‌تفکیک دامنه

علامت‌ها: **M** = Medusa هسته دارد · **UI** = باید در فرانت بسازید · **IR** = در ایران Pack / بازار ایران مهم است · **Admin** = عمدتاً تنظیم ادمین، فرانت فقط نتیجه را نشان می‌دهد

### ۲.۱ کاتالوگ و محصول

| # | قابلیت | M | UI | IR | یادداشت |
|---|--------|---|----|----|---------|
| P1 | لیست محصولات + pagination | ✓ | ✓ | | `limit` / `offset` |
| P2 | جزئیات محصول (عنوان، توضیح، تصاویر) | ✓ | ✓ | | |
| P3 | Variant (سایز/رنگ/…) | ✓ | ✓ | | انتخاب قبل از add-to-cart |
| P4 | قیمت محاسبه‌شده منطقه (`calculated_price`) | ✓ | ✓ | ✓ | نمایش تومان/ریال |
| P5 | موجودی / sold out | ✓ | ✓ | | دکمه غیرفعال وقتی موجودی صفر |
| P6 | Categories (تو در تو) | ✓ | ✓ | | منوی مگامنو |
| P7 | Collections | ✓ | ✓ | | |
| P8 | فیلتر (قیمت، تگ، گزینه) | جزئی | ✓ | | بخشی client-side ممکن است |
| P9 | محصولات مرتبط | جزئی | ✓ | | با tag/collection یا منطق خودتان |
| P10 | چند Sales Channel | ✓ | | | معمولاً شفاف برای خریدار |

**دکمه‌ها / کنترل‌ها:** افزودن به سبد · انتخاب سایز/رنگ · تغییر تعداد · فیلتر · مرتب‌سازی · pagination · مشاهده سریع (اختیاری)

- [ ] کارت محصول: تصویر، نام، قیمت، badge موجودی/تخفیف
- [ ] صفحه جزئیات: گالری، گزینه‌ها، قیمت، CTA افزودن به سبد
- [ ] حالت خالی کاتالوگ و خطای شبکه

### ۲.۲ سبد (Cart)

| # | قابلیت | M | UI | یادداشت |
|---|--------|---|----|---------|
| C1 | ساخت سبد + نگه‌داشتن `cart_id` | ✓ | ✓ | localStorage / cookie |
| C2 | افزودن / کم کردن / حذف line item | ✓ | ✓ | با `variant_id` |
| C3 | به‌روزرسانی تعداد | ✓ | ✓ | |
| C4 | نمایش totals | ✓ | ✓ | زیر‌مجموعه در بخش مالیات/تخفیف |
| C5 | اتصال سبد به customer بعد از لاگین | ✓ | ✓ | |
| C6 | بازیابی سبد قبلی مشتری | ✓ | ✓ | |

**دکمه‌ها:** + / − · حذف · رفتن به checkout · ادامه خرید · اعمال کد تخفیف

- [ ] Drawer یا صفحه سبد
- [ ] Badge تعداد در هدر
- [ ] Totals زنده بعد از هر تغییر

### ۲.۳ کد تخفیف و Promotion

| # | قابلیت | M | UI | Admin |
|---|--------|---|----|-------|
| D1 | کد پروموشن (درصد / مبلغ ثابت) | ✓ | ✓ فرم کد | ساخت در Admin |
| D2 | حذف کد از سبد | ✓ | ✓ | |
| D3 | Buy X Get Y / spend-get / کمپین زمانی | ✓ | نمایش در totals | قوانین در Admin |
| D4 | تخفیف روی shipping | ✓ | نمایش | |
| D5 | محدودیت گروه مشتری | ✓ | پیام خطا | |

**UI لازم:** فیلد کد · دکمه اعمال · دکمه حذف · پیام خطای فارسی · خط تخفیف در خلاصه سفارش

- [ ] `POST` promotions روی cart (طبق Store API / JS SDK manage promotions)
- [ ] نمایش `discount_total` در خلاصه

### ۲.۴ مالیات (Tax)

| # | قابلیت | M | UI | Admin |
|---|--------|---|----|-------|
| T1 | محاسبه خودکار مالیات بر اساس Region / آدرس | ✓ | نمایش `tax_total` | Tax rates در Admin |
| T2 | قیمت inclusive / exclusive tax | ✓ | برچسب «با مالیات» / «بدون» | تنظیم Region |
| T3 | معافیت یا نرخ خاص محصول | ✓ | معمولاً نامرئی | Tax providers / rates |
| T4 | اتصال Avalara و مشابه | ✓ ماژول | — | اختیاری enterprise |

**در فرانت معمولاً فقط نمایش است** — محاسبه را دوباره ننویسید؛ از totals سبد بخوانید:

```
subtotal
− discount_total
+ shipping_total
+ tax_total
= total
```

- [ ] ردیف مالیات در Cart و Checkout
- [ ] اگر مالیات ایران صفر/ساده است، باز هم فیلد را از API بخوان (نه hardcode)

### ۲.۵ Checkout — آدرس، ایمیل، ارسال

| # | قابلیت | M | UI | IR |
|---|--------|---|----|-----|
| X1 | ایمیل مهمان روی cart | ✓ | ✓ | |
| X2 | آدرس ارسال (shipping address) | ✓ | ✓ | استان/شهر/کدپستی ۱۰ رقمی/موبایل |
| X3 | آدرس صورتحساب (billing) | ✓ | ✓ اختیاری | اغلب = همان ارسال |
| X4 | اعتبارسنجی آدرس ایران | Iran Pack | ✓ | `validate-address` |
| X5 | لیست shipping options | ✓ | ✓ رادیو/کارت | عادی / سریع |
| X6 | انتخاب shipping method روی cart | ✓ | ✓ | |
| X7 | هزینه ارسال در totals | ✓ | ✓ | |

**دکمه‌ها:** ادامه به ارسال · ادامه به پرداخت · بازگشت · انتخاب از آدرس‌های ذخیره‌شده

- [ ] Wizard یا تک‌صفحه‌ای checkout
- [ ] پیام‌های خطای فیلد (کدپستی، استان، تلفن)

### ۲.۶ پرداخت (Payment)

| # | قابلیت | M | UI | IR |
|---|--------|---|----|-----|
| Y1 | لیست payment providers منطقه | ✓ | ✓ | |
| Y2 | ساخت payment collection + session | ✓ | ✓ | `pp_iran-bank_iran` |
| Y3 | Redirect به درگاه | ✓ | ✓ | |
| Y4 | بازگشت موفق/ناموفق | ✓ | ✓ صفحه نتیجه | stub/callback در backend |
| Y5 | `complete` cart → Order | ✓ | ✓ | |
| Y6 | **Verify پرداخت فقط در backend** | ✓ | ممنوع در React | قانون طلایی |

**دکمه‌ها:** پرداخت · تلاش مجدد · بازگشت به سبد · پیگیری سفارش

وضعیت‌هایی که UI باید نشان دهد: `pending_payment` · `paid` · `payment_failed` · `config_incomplete`

- [ ] صفحه `/checkout/payment`
- [ ] صفحه `/order/result` با شماره سفارش
- [ ] هیچ کلید درگاه / verify در فرانت نباشد

### ۲.۷ حساب مشتری (Customer)

| # | قابلیت | M | UI | IR |
|---|--------|---|----|-----|
| A1 | ثبت‌نام email + password | ✓ | ✓ | یا OTP موبایل |
| A2 | لاگین | ✓ | ✓ | `/login` |
| A3 | خروج | ✓ | ✓ | |
| A4 | تأیید ایمیل | ✓ docs | ✓ | اختیاری |
| A5 | فراموشی / reset password | ✓ | ✓ | |
| A6 | Social login (Google و …) | ✓ | ✓ | کمتر رایج در ایران |
| A7 | ویرایش پروفایل | ✓ | ✓ | |
| A8 | آدرس‌های ذخیره‌شده CRUD | ✓ | ✓ | validation ایران |
| A9 | تاریخچه و جزئیات سفارش | ✓ | ✓ | |
| A10 | OTP موبایل + رمز | Iran Pack | ✓ | C-09 |

**دکمه‌ها:** ورود · ثبت‌نام · ارسال OTP · تأیید · ذخیره آدرس · حذف آدرس · مشاهده سفارش

- [ ] مسیرهای محافظت‌شده `/account*`
- [ ] نگه‌داری JWT و اتصال cart به customer

### ۲.۸ سفارش بعد از خرید (Order)

| # | قابلیت | M | UI |
|---|--------|---|-----|
| O1 | Confirmation با display_id / id | ✓ | ✓ |
| O2 | وضعیت پرداخت / fulfillment | ✓ | ✓ badge |
| O3 | سفارش‌های من | ✓ | ✓ |
| O4 | مرجوعی از ویترین | ✓ (returns guide) | اختیاری |
| O5 | اعلان SMS/ایمیل وضعیت | Notification module | UI معمولاً ندارد؛ backend |

### ۲.۹ Region، ارز، Localization

| # | قابلیت | M | UI |
|---|--------|---|-----|
| R1 | لیست / انتخاب Region | ✓ | اگر چند کشور می‌فروشید |
| R2 | ارز و فرمت پول | ✓ | تابع format پول فارسی |
| R3 | Localization محتوا | ✓ docs | i18n فرانت |
| R4 | RTL فارسی | — | ✓ الزامی ایران |

برای تک‌منطقه‌ای ایران: Region را در env قفل کنید؛ selector نسازید مگر لازم باشد.

### ۲.۱۰ قابلیت‌های پیشرفته / اختیاری Medusa

| قابلیت | در هسته؟ | نیاز UI ویترین؟ | اولویت پیشنهادی |
|--------|----------|-----------------|-----------------|
| Gift cards | بله (ماژول) | فرم redeem در cart/checkout | بعد از MVP |
| Returns از storefront | بله (راهنما) | صفحه درخواست مرجوعی | بعد از فروش واقعی |
| Draft orders / B2B quotes | بله | معمولاً B2B starter | فقط اگر B2B |
| Buy online pick up in store | بله v2 | انتخاب محل تحویل | اختیاری |
| Price lists / گروه مشتری | بله | قیمت خودکار عوض می‌شود | Admin + لاگین |
| Inventory multi-warehouse | بله | نمایش موجودی | پیشرفته |
| Search پیشرفته (Meilisearch و …) | یکپارچه‌سازی | صفحه جستجو | اختیاری |
| Wishlist / مقایسه | خیر | سفارشی | خارج از هسته |
| CMS صفحات مجله | خیر | جدا از Medusa | مثل mashoodwear CMS |
| Subscription / booking | recipe/سفارشی | — | پروژه جدا |

---

## ۳) موجودی UI: کارت‌ها، دکمه‌ها، فرم‌ها

چک‌لیست سریع «چه کامپوننتی باید داشته باشم؟»

### کارت‌ها (Cards)

- [ ] Product card (لیست)
- [ ] Cart line item card
- [ ] Shipping option card
- [ ] Payment method card
- [ ] Order summary card (subtotal / discount / shipping / tax / total)
- [ ] Order history card
- [ ] Address card (انتخاب / ویرایش)
- [ ] Empty state card (سبد خالی، بدون سفارش)

### دکمه‌ها / CTAها

- [ ] افزودن به سبد
- [ ] خرید فوری / Express checkout (اختیاری)
- [ ] به‌روزرسانی تعداد (+/−)
- [ ] حذف از سبد
- [ ] اعمال / حذف کد تخفیف
- [ ] رفتن به Checkout
- [ ] انتخاب ارسال
- [ ] پرداخت / هدایت به درگاه
- [ ] تلاش مجدد پرداخت
- [ ] ورود / ثبت‌نام / خروج
- [ ] ارسال OTP / تأیید OTP
- [ ] ذخیره آدرس
- [ ] مشاهده سفارش / بازگشت به فروشگاه

### فرم‌ها و فیلدها

- [ ] جستجو
- [ ] فیلتر کاتالوگ
- [ ] انتخاب variant
- [ ] کد تخفیف
- [ ] ایمیل checkout
- [ ] آدرس (نام، استان، شهر، خیابان، کدپستی، موبایل)
- [ ] لاگین / ثبت‌نام / OTP / رمز
- [ ] پروفایل مشتری

### کلیدها و شناسه‌های سمت کلاینت (نه secret)

- [ ] Publishable key در header هر درخواست Store
- [ ] `cart_id` پایدار
- [ ] `region_id` یا country
- [ ] `variant_id` هنگام add-to-cart
- [ ] JWT مشتری بعد از auth
- [ ] (هرگز) secret API key مدوسا یا کلید درگاه بانکی در فرانت

---

## ۴) ترتیب پیشنهادی ساخت از صفر

مثل ساخت مغازه: اول قفسه، بعد سبد، بعد صندوق، بعد کارت عضویت.

| مرحله | چه بساز | معیار Done |
|-------|---------|------------|
| 0 | env + SDK + region + key | products API جواب می‌دهد |
| 1 | لیست + جزئیات محصول + قیمت | می‌شود خرید را تصور کرد |
| 2 | سبد کامل + totals | add/update/remove کار می‌کند |
| 3 | کد تخفیف | اعمال/حذف در خلاصه دیده می‌شود |
| 4 | Checkout آدرس + shipping | options لیست و انتخاب می‌شوند |
| 5 | مالیات در UI | `tax_total` نمایش داده می‌شود (حتی اگر ۰) |
| 6 | پرداخت + نتیجه سفارش | paid / failed درست map می‌شود |
| 7 | لاگین + حساب + آدرس‌ها + سفارش‌ها | بازگشت خریدار |
| 8 | Categories / collections / search | کشف بهتر |
| 9 | Returns / gift card / extras | بر اساس نیاز کسب‌وکار |

برای ایران همان ترتیب + validation آدرس + OTP به‌جای/کنار email.

---

## ۵) خلاصهٔ totals که UI باید نشان دهد

از پاسخ Cart / Order بخوانید؛ دوباره حساب نکنید مگر برای UX:

| فیلد مفهومی | معمولاً در API | نمایش پیشنهادی |
|-------------|----------------|----------------|
| جمع اقلام | `subtotal` / item totals | جمع کالاها |
| تخفیف | `discount_total` | کد تخفیف / پروموشن |
| ارسال | `shipping_total` | هزینه ارسال |
| مالیات | `tax_total` | مالیات بر ارزش افزوده / مالیات |
| جمع نهایی | `total` | مبلغ قابل پرداخت |

---

## ۶) Admin در برابر Storefront (یادآوری)

این‌ها را در ویترین «دکمه ساخت» نگذارید — در Medusa Admin می‌مانند:

- ساخت محصول / موجودی / قیمت
- تعریف Tax rate و Region
- ساخت Promotion و Gift card
- تعریف Shipping option و Payment provider
- مدیریت سفارش، refund، fulfillment از سمت فروشنده

ویترین فقط **مصرف‌کننده** است.

---

## ۷) لینک‌های مرتبط

- منبع آموزشی (canonical): `C:\Users\KASRA\Desktop\AI learning docs\05-Web-Development\medusa-storefront-from-scratch-checklist.md`
- پلی‌بوک تست‌بد: `doc/agent-priority/05-medusa-ui-testbed-then-custom-storefront.md`
- OTP: `doc/auth-otp.md`
- قرارداد API ایران: `F:\medusa-develop\my-medusa-store\docs\phase-a-iran-pack\storefront-api-contract.md`
- مستندات رسمی: [Storefront Development](https://docs.medusajs.com/resources/storefront-development) · [Store API](https://docs.medusajs.com/api/store)

---

## قانون یک‌خطی

**Medusa حساب می‌کند؛ شما نشان می‌دهید و دکمه می‌زنید.**  
از صفر: کلید + کاتالوگ + سبد + تخفیف + مالیات در totals + آدرس/ارسال + پرداخت + حساب.
