# قرارداد اتصال UI نهایی شما به Backend

> هدف این سند: وقتی ویترین اختصاصی‌تان را ساختید، **بدون غافلگیری** به Iran Pack وصل شود.  
> این سند ظاهر UI را تعیین نمی‌کند — فقط می‌گوید backend چه قابلیت‌هایی باید داشته باشد تا UI شما کامل کار کند.  
> ارجاع: [proposal.md](./proposal.md) · [design.md](./design.md)

---

## تغییرات (Changelog)

| تاریخ      | چه عوض شد   | چرا                              |
| ---------- | ----------- | -------------------------------- |
| ۱۴۰۵-۰۴-۲۵ | نسخهٔ اولیه | قفل اصل انطباق با UI نهایی کاربر |
| ۱۴۰۵-۰۴-۳۱ | فاز ۴: endpointها، کدهای خطا، تست smoke | هم‌خوان با کد واقعی (`phase-4-smoke`) |
| ۱۴۰۵-۰۵-۰۴ | C-09 OTP موبایل | مسیرهای `/store/iran/auth/*` + SMS.ir VERIFY / stub |

---

## قطب‌نما

| لایه                       | الان                    | در پایان                        |
| -------------------------- | ----------------------- | ------------------------------- |
| ظاهر خریدار                | ساخته نمی‌شود           | **UI شما**                      |
| منطق خرید / پرداخت / سفارش | در backend ساخته می‌شود | همان منطق، مصرف‌شده توسط UI شما |
| Admin                      | فارسی می‌شود            | همچنان برای فروشنده             |
| starter storefront         | فقط smoke               | معیار محصول نیست                |

اگر در فاز A چیزی فقط داخل کامپوننت starter کار کند و از API قابل استفاده نباشد → نقص قرارداد است.

---

## جریان‌هایی که UI شما باید بتواند اجرا کند

این‌ها را backend در فاز A باید پشتیبانی کند (حتی اگر UI هنوز نیست):

| #    | جریان خریدار (روی UI شما)  | backend باید بدهد                            | API / ماژول (واقعیت کد) |
| ---- | -------------------------- | -------------------------------------------- | ----------------------- |
| C-01 | دیدن محصولات / قیمت محلی   | Store API محصولات + Region/ارز ایران         | `GET /store/products` · `GET /store/regions/:id` — Region ایران، ارز پیش‌فرض `irt` |
| C-02 | سبد: افزودن/کم کردن        | Cart API پایدار                              | `POST /store/carts` · `POST /store/carts/:id/line-items` |
| C-03 | آدرس ایران در checkout     | ذخیره و validation فیلدهای ایران             | `POST /store/carts/:id` (middleware) · `POST /store/iran/validate-address` · `POST /store/customers/me/addresses` |
| C-04 | انتخاب ارسال               | لیست shipping optionهای فعال                 | `GET /store/shipping-options?cart_id=` · `POST /store/carts/:id/shipping-methods` — seed: `ارسال عادی (ایران)` / `ارسال سریع (ایران)` |
| C-05 | شروع پرداخت ایرانی         | initiate payment session + URL/redirect info | `POST /store/payment-collections` · `POST /store/payment-collections/:id/payment-sessions` — provider: `pp_iran-bank_iran` |
| C-06 | برگشت از درگاه موفق/ناموفق | verify + وضعیت صریح paid / failed            | stub callback: `GET/POST /store/iran-bank/stub/callback` · verify در `iran-bank-payment` provider |
| C-07 | صفحهٔ نتیجه / شماره سفارش  | بازیابی سفارش و وضعیت پرداخت                 | `GET /store/carts/:id` (با `payment_collection`) · `POST /store/carts/:id/complete` → `GET /store/orders/:id` |
| C-08 | خطاهای قابل نمایش          | پیام/کد پایدار بدون وابستگی به JSX starter   | کدهای پایدار زیر — پاسخ `{ ok: false, error, message, fields? }` |

اختیاری همین فاز یا بلافاصله بعد از اتصال UI:

| #    | جریان           | یادداشت | API |
| ---- | --------------- | ------- | --- |
| C-09 | ورود OTP موبایل | ثبت‌نام با OTP + ورود با رمز یا OTP؛ بازیابی رمز با OTP؛ SMS.ir VERIFY یا stub | `POST /store/iran/auth/otp/send` · `register` · `login/password` · `login/otp` · `password/reset` · providers `phone-auth` + `emailpass` (`{phone}@phone.local`) |
| C-10 | SMS وضعیت سفارش | رویداد از backend؛ ظاهر پیام در UI شما | — |

---

## C-03 — قوانین validation آدرس ایران

وقتی `country_code` برابر `ir` است:

| فیلد | قانون |
| ---- | ----- |
| `first_name`, `last_name`, `address_1`, `city`, `province`, `postal_code`, `phone` | الزامی |
| `postal_code` | دقیقاً ۱۰ رقم |
| `phone` | موبایل ایران: `09xxxxxxxxx` یا `+989xxxxxxxxx` |
| `province` | یکی از استان‌های شناخته‌شده (فارسی یا انگلیسی) — لیست در `src/modules/iran-shipping/provinces.ts` |

کشور غیر `ir` → validation ایران اعمال نمی‌شود.

---

## C-08 — کدهای خطای پایدار

| `error` | معنی | `fields` نمونه |
| ------- | ---- | -------------- |
| `iran_address_invalid` | آدرس ایران ناقص/غلط | `{ "postal_code": "iran_postal_code_invalid" }` |
| `iran_address_required` | فیلد الزامی خالی | در `fields.<field>` |
| `iran_postal_code_invalid` | کد پستی غیر ۱۰ رقمی | — |
| `iran_phone_invalid` | موبایل نامعتبر | — |
| `iran_province_invalid` | استان ناشناخته | — |

پرداخت (از فاز ۳): `missing_ref`, `not_found`, `config_incomplete` — جزئیات در `iran-bank-payment` README.

Auth موبایل (C-09): `phone_invalid`, `otp_invalid`, `otp_expired`, `otp_not_found`, `otp_send_failed`, `already_registered`, `not_registered`, `invalid_credentials`, `password_too_short` — پاسخ `{ ok: false, error, message }`.

---

## وضعیت‌هایی که UI شما باید بتواند نشان دهد

| وضعیت            | معنی برای خریدار (متن نهایی با شماست) | سیستم               |
| ---------------- | ------------------------------------- | ------------------- |
| در انتظار پرداخت | هنوز تأیید نشده                       | `pending_payment`   |
| پرداخت موفق      | سفارش قطعی از نظر پول                 | `paid`              |
| پرداخت ناموفق    | می‌تواند دوباره تلاش کند              | `payment_failed`    |
| درگاه آماده‌نیست | خرید موقتاً ممکن نیست                 | `config_incomplete` |

متن دکمه‌ها و کپی برند = تصمیم UI شما. نام وضعیت‌ها در سیستم ثابت می‌مانند تا UI به آن‌ها map کند.

---

## تست قرارداد (بدون UI)

```bash
# واحد — validation آدرس
cd apps/backend && npm run test:unit

# E2E API — نیاز به backend روی :9000
npx medusa exec ./src/scripts/phase-4-smoke.ts
```

اسکریپت `phase-4-smoke.ts` جریان‌های C-01 تا C-08 را با `fetch` و publishable key تست می‌کند.

---

## قوانین ضدگمراهی برای تیم / AI

1. منطق verify پرداخت را داخل صفحهٔ starter نگذار — در Payment Provider بماند.
2. فرمت پول یک تابع/سرویس مشترک داشته باشد؛ UI شما همان را مصرف کند (یا معادل API).
3. وقتی UI شما آمد، سند `ui-behavior-storefront.md` از روی **طراحی شما** نوشته می‌شود و این قرارداد را مصرف می‌کند — برعکس نه.
4. اگر طراحی UI شما جریان تازه‌ای خواست که اینجا نیست → اول این قرارداد و design را گسترش بده، بعد UI را کامل کن.

---

## چک پذیرش «آماده‌ایم برای UI شما»

- [x] C-01 تا C-08 در backend قابل تست با API (یا client خنثی) هستند — `phase-4-smoke.ts`
- [x] هیچ‌کدام فقط با رندر starter اثبات نشده‌اند
- [x] ادمین می‌تواند نتیجهٔ C-05/C-06 را در سفارش ببیند (فاز ۳)
- [x] این فایل با واقعیت کد هم‌خوان است (فاز ۴)

---

## بعد از آمدن UI شما

1. طراحی بصری و `ui-behavior-storefront.md` بر اساس UI واقعی
2. اتصال به همین قرارداد
3. E2E خریدار روی ویترین اختصاصی (جایگزین معیار نهایی خریدار به‌جای smoke)
