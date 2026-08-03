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

# تست‌بد UI روی Medusa — الگوی کار برای ویترین سفارشی بعدی

## تمثیل

مثل تست مانکن قبل از دوخت کت سفارشی مشتری است: اول یک UI آماده را روی موتور فروش (Medusa) سوار می‌کنیم، گیرها را پیدا می‌کنیم، بعد همان موتور را زیر ویترین اختصاصی مشتری می‌گذاریم.

## ایده اصلی

| مرحله | کار |
|--------|-----|
| ۱ | UI آماده (اینجا: Mashhoodwear Vite) → Medusa + Iran Pack |
| ۲ | تست جریان خرید و ثبت باگ |
| ۳ | UI شخصی مشتری روی **همان** بک‌اند Medusa |

ظاهر مانکن دور ریختنی است؛ قرارداد API و فهرست باگ‌ها ماندنی است.

## وضعیت تست‌بد (mashoodwear-medusa)

| فاز | موضوع | وضعیت |
|-----|--------|--------|
| ۰–۲ | env + کاتالوگ Medusa | انجام |
| ۳ | سبد (`cart_id` + `variant_id`) | انجام |
| ۴ | آدرس ایران + shipping | انجام |
| ۵ | پرداخت `pp_iran-bank_iran` + نتیجه سفارش | انجام (stub؛ verify فقط در Medusa) |
| ۶ | ادمین الف (Medusa Admin + CMS) | انجام |
| ۷ | DevOps / polish | انجام |
| ۸.۲ / ۸.۴ | OTP موبایل + حساب خریدار (C-09) | انجام — بک‌اند در `my-medusa-store` |

مسیر خریدار در مانکن: `/checkout` → `/checkout/payment` → `/order/result` · `/login` → `/account`.  
چک‌لیست پرداخت: `mashoodwear-medusa/doc/payment-smoke-checklist.md`.  
راهنمای OTP: `mashoodwear-medusa/doc/auth-otp.md` (کد در `my-medusa-store/apps/backend/src/modules/phone-auth` + `/store/iran/auth/*`).

## کجا ذخیره شود تا Agent بعدی گم نشود

| اولویت | محل | نقش |
|--------|------|-----|
| ۱ | `AGENTS.md` در ریشه پروژه تست‌بد | اول چیزی که Agent می‌خواند |
| ۲ | `.cursor/rules/*.mdc` با `alwaysApply` | در هر چت داخل همان workspace اعمال می‌شود |
| ۳ | `doc/handshake-learnings.md` | لاگ زنده باگ/کشف — **مهم‌ترین بخش برای UI بعدی** |
| ۴ | `doc/PURPOSE.md` + `doc/tasks-medusa.md` | هدف تست‌بد + پیشرفت |
| ۵ | این فایل در AI learning docs | دانش عمومی؛ لینک به ریپوی واقعی |

**چت Cursor به‌تنهایی آرشیو پایدار نیست.** اگر فقط در چت بماند، جلسه بعد باید دوباره کشف شود.

ایده عملی: Mashhoodwear اینجا **مانکن تست** است؛ چیزی که برای ویترین مشتری بعدی می‌ماند **قرارداد API + فهرست باگ‌ها** است، نه لزوماً ظاهر برند.

**پوشهٔ بسته‌شده در ریپو:**  
`C:\Users\KASRA\Desktop\mashoodwear-medusa\doc\agent-priority\`  
(فایل‌های شماره‌دار ۱…۶ + README — برای دیدن سریع «کدام‌ها مهم‌اند»)

## مسیر ریپوی تست‌بد

`C:\Users\KASRA\Desktop\mashoodwear-medusa`

اسناد کلیدی آنجا:

- `AGENTS.md`
- `doc/PURPOSE.md`
- `doc/handshake-learnings.md`
- `doc/tasks-medusa.md`
- `doc/agent-priority/` (بستهٔ اولویت)
- قرارداد API: `F:\medusa-develop\my-medusa-store\docs\phase-a-iran-pack\storefront-api-contract.md`

## پلی‌بوک: سوار کردن UI سفارشی بعدی روی همان Medusa

وقتی بعداً بگویی «یک ویترین جدید برای مشتری X روی همین بک‌اند سوار کن»، Agent این ترتیب را می‌رود — **نه** کپی ظاهر Mashhoodwear.

### قدم ۰ — مرز را قفل کن

| می‌آید از تست‌بد | نمی‌آید (مگر مشتری بخواهد) |
|------------------|------------------------------|
| قرارداد Store API (C-01…C-08) | CSS / فونت / کامپوننت‌های Mashhoodwear |
| `handshake-learnings.md` (لیست باگ) | پنل `/admin` برند |
| الگوی env: publishable key + region IR / IRT | سبد localStorage قدیمی |
| ممنوعیت verify در فرانت | فرض‌های خاص فیلتر size/color تست‌بد |

### قدم ۱ — خواندن اسناد (به‌ترتیب)

1. **`doc/agent-priority/` یا `AGENTS.md` تست‌بد** → یادآوری هدف مانکن و مسیرها  
2. **`03-handshake-learnings.md`** → تمام گیرهای API/پرداخت/CORS/موجودی را قبل از کد بخوان تا دوباره نخوری  
3. **`storefront-api-contract.md`** در `my-medusa-store` → قرارداد رسمی C-01…C-08  
4. **`04-PURPOSE.md`** → چه چیزی «قابل‌انتقال» است  
5. این فایل (AI learning) → الگوی کلی مانکن → ویترین سفارشی

### قدم ۲ — پروژهٔ UI جدید (جدا از مانکن)

- ریپوی جدید یا پوشهٔ جدا برای ویترین مشتری (Next/Vite/هرچه مشتری خواست).
- `mashoodwear-medusa` را **دست نزن** مگر برای ادامهٔ تست؛ مانکن می‌ماند برای regression.
- env ویترین جدید:
  - `MEDUSA_BACKEND_URL` / `VITE_MEDUSA_BACKEND_URL`
  - publishable API key
  - region ایران / country `ir`
- CORS مدوسا: origin ویترین جدید را به `STORE_CORS` اضافه کن (یادداشت handshake).

### قدم ۳ — لایهٔ نازک API (نه کپی UI)

همان ایدهٔ adapter تست‌بد، ولی shape مخصوص UI مشتری:

```
UI مشتری  →  client/SDK Medusa  →  Store API (:9000)
                 ↑
         از handshake یاد بگیر چه fields/gotchaهایی لازم است
```

ترتیب پیاده‌سازی پیشنهادی (مثل فازهای تست‌بد، بدون برند):

1. کاتالوگ (list + detail + قیمت IRT)  
2. سبد (`variant_id` + Cart API)  
3. آدرس ایران + validate-address  
4. shipping options  
5. payment session `pp_iran-bank_iran` → redirect → complete cart  
6. صفحهٔ نتیجهٔ سفارش  
7. (اختیاری) OTP موبایل `/store/iran/auth/*` + حساب — راهنما: `doc/auth-otp.md`  

در مانکن تست‌بد، گام‌های ۱–۷ برای مسیر اصلی خریدار (+ OTP) پیاده شده‌اند؛ برای UI مشتری همان ترتیب را تکرار کن، نه کپی کامپوننت‌های Mashhoodwear.

### قدم ۴ — چک‌لیست ضد تکرار باگ

قبل از «تمام شد»، هر ردیف مهم `handshake-learnings` را تیک بزن؛ مثال‌های رایج:

- [ ] CORS برای origin جدید  
- [ ] `fields` موجودی/قیمت صریح  
- [ ] قیمت از `calculated_price` منطقه ایران  
- [ ] verify فقط روی Medusa  
- [ ] collections/tags اگر در seed خالی‌اند، فرض نکن مثل مانکن پرند  

### قدم ۵ — ادمین

commerce همچنان **Medusa Admin** (`:9000/app`) مگر مشتری صریحاً UI ادمین سفارشی بخواهد.

### تمثیل یک‌خطی

مانکن = اتاق پرو؛ ویترین مشتری = لباس دوخته‌شده.  
از اتاق پرو فقط اندازه و ایراد دوخت را برمی‌داری، نه رنگ مانکن را.

## قانون طلایی برای UI بعدی مشتری

از تست‌بد این‌ها را ببر، نه لزوماً CSS/برند Mashhoodwear:

1. جریان C-01…C-09
2. publishable key + region ایران / IRT
3. validation آدرس ایران
4. provider `pp_iran-bank_iran` بدون verify در فرانت
5. OTP موبایل بدون کلید SMS در فرانت (`/store/iran/auth/*`)
6. تمام ردیف‌های `handshake-learnings.md`
7. پلی‌بوک همین بخش (قدم ۰…۵)

## لینک‌های مرتبط

- [چک‌لیست ساخت Storefront از صفر روی Medusa](./medusa-storefront-from-scratch-checklist.md) — صفحات، دکمه‌ها، کلیدها، مالیات، تخفیف، حساب
- [راهنمای extras ویترین](./medusa-storefront-extras-guide.md) — Categories / Wishlist / Gift / Returns
- [شکاف Medusa با فروشگاه ایران](./iranian-store-vs-medusa-gap-analysis.md)
- [اول ایرانیزه بعد فروشگاه‌ساز](./iranize-then-store-builder-no-rework.md)
- [بک‌اندهای آماده فروشگاه‌ساز](./shop-builder-ready-backends-and-cheapest-path.md)
- [OTP موبایل روی Medusa با SMS.ir](./medusa-otp-sms-ir-phone-auth.md)
