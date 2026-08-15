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

# لاگ Handshake / Learnings — Mashhoodwear × Medusa

> **هدف:** هر کشف مفید برای UI تست یا UI سفارشی بعدی اینجا ثبت شود.  
> **قالب هر ردیف:** تاریخ · علامت · علت · رفع · نکته قابل‌انتقال به ویترین بعدی

---

## نحوه استفاده برای Agent

1. قبل از کار روی سبد/پرداخت/آدرس، این فایل را بخوان.
2. بعد از هر باگ یا رفتار عجیب API، یک بند جدید **بالای بخش Entries** اضافه کن (تازه‌ها اول).
3. اگر قرارداد API عوض شد، لینک به `storefront-api-contract.md` را هم به‌روز کن.

---

## Entries

### ۱۴۰۵-۰۵-۱۹ — نقشهٔ راه ادمین فارسی + باگ موجودی وریانت قدیمی

- **علامت:** فروشنده نمی‌دانست ترتیب ساخت کانال/انبار/محصول/تخفیف کجاست؛ روی صفحه Stock برای وریانت‌هایی که بعداً Manage inventory روشن شده، موس ممنوع و سلول `-` است.
- **علت:** commerce فقط در Medusa Admin است؛ روشن کردن `manage_inventory` روی وریانت موجود Inventory Item نمی‌سازد (باگ Medusa #16199).
- **رفع:** راهنما `doc/medusa-admin-merchant-roadmap-fa.md`؛ برای وریانت خراب Delete + Create با Manage inventory روشن از اول؛ کد تخفیف از پروموشن‌ها.
- **قابل‌انتقال:** در UI مشتری بعدی، وریانت را از روز اول با inventory مدیریت‌شده بساز؛ راهنمای فروشنده را جدا از داک توسعه‌دهنده نگه دار.

### ۱۴۰۵-۰۵-۱۸ — قیمت per-variant + سایز/قد/ارتفاع از واریانت + کالکشن فقط Medusa

- **علامت:** (۱) قیمت محصول در PDP ثابت می‌ماند وقتی برای گزینه‌ها قیمت جدا می‌گذارید؛ گاهی `calculated_price` خالی است. (۲) کالکشن هنوز در `/cms` و فال‌بک Express بود. (۳) سایز/قد اشتباه map می‌شد (عنوان سه‌بخشی یا Size+قد بدون title) و ارتفاع فیزیکی فقط از محصول/واریانت اول می‌آمد.
- **علت:** نمایش فقط `product.price`؛ استخراج قیمت فقط از `calculated_amount`؛ fallback دوگزینه‌ای بدون عنوان همیشه Size+Color فرض می‌کرد؛ CMS collections موقت مانده بود.
- **رفع:** قیمت انتخاب‌شده روی PDP + fallback `prices[]` + `priceMax`/«از …»؛ mapper با `productOptionKinds` و عنوان `Size / قد / Color`؛ `attributes` روی هر واریانت؛ حذف CRUD/فال‌بک کالکشن از CMS.
- **قابل‌انتقال:** قیمت و ابعاد را همیشه از واریانت انتخاب‌شده بخوان؛ کالکشن را از روز اول فقط در Medusa نگه دار.

### ۱۴۰۵-۰۵-۱۳ — redeploy ویترین روی VPS + no-cache برای `index.html`

- **علامت:** بعد از Reload هنوز Lookbook / UI قدیمی دیده می‌شد.
- **علت:** `/opt/mashoodwear/frontend/dist` کهنه بود؛ مرورگر هم `index.html` را cache می‌کرد.
- **رفع:** sync کد ویترین + `npm run build` روی سرور با `VITE_*` پروداکشن؛ nginx برای HTTP/HTTPS روی `location = /index.html` هدر `Cache-Control: no-cache`؛ اسکریپت `scripts/redeploy-frontend-medusa.sh`.
- **قابل‌انتقال:** بعد از cutover، فقط git pull کافی نیست — rebuild `dist` و no-cache برای SPA shell لازم است.

### ۱۴۰۵-۰۵-۱۳ — hard reload روی CTA خالی → UI قدیمی (Lookbook / Express)

- **علامت:** از سبد خالی «View Products» (و چند StateMessage دیگر) سایت قبلی با Lookbook و محصولات Express باز می‌شد.
- **علت:** `window.location.href` / `reload` فول‌ریلود می‌کرد؛ اگر `frontend/dist` روی سرور کهنه باشد یا کش مرورگر index قدیمی بگیرد، UI pre-Medusa لود می‌شود. `/lookbook` هم هنوز در sitemap و بدون ریدایرکت بود.
- **رفع:** CTAها با `navigate` / retry درون‌SPA؛ ریدایرکت `/lookbook` و `/collection` در App + Vite + Express؛ sitemap بدون lookbook و بدون slugهای MySQL Express.
- **قابل‌انتقال:** بعد از cutover به Medusa، هر CTA داخلی را با Router ببر نه hard navigation؛ و `dist` را حتماً rebuild/redeploy کن.

### ۱۴۰۵-۰۵-۰۶ — بستهٔ `doc/ui-medusa-guides` برای ساخت UI روی Medusa


- **علامت:** راهنماهای مفید ساخت/سوار کردن ویترین داخل `doc/` پراکنده بودند؛ Agent برای UI بعدی باید چند فایل + قرارداد API بیرون ریپو را جدا پیدا می‌کرد.
- **علت:** `agent-priority` فقط اولویت ذخیره است؛ checklist / admin-split / payment smoke / API contract آنجا یک‌جا نبود.
- **رفع:** پوشهٔ `doc/ui-medusa-guides/` + `npm run sync:ui-medusa-guides`؛ README با ترتیب خواندن؛ ظاهر مانکن و DEPLOY عمداً خارج.
- **قابل‌انتقال:** برای ویترین مشتری بعدی اول `doc/ui-medusa-guides/README.md` را باز کن؛ کار را روی canonical بنویس، بعد sync.

### ۱۴۰۵-۰۵-۰۴ — آدرس ذخیره‌شده مشتری (Account + Medusa Admin)

- **علامت:** خریدار فقط روی cart آدرس می‌گذاشت؛ بعد از لاگین آدرس ماندگار نداشت؛ ادمین هم جایی برای «آدرس حساب» در ویترین نمی‌دید.
- **علت:** Store API آدرس مشتری (`/store/customers/me/addresses`) و بخش Addresses در Medusa Admin وجود داشت ولی به ویترین wire نشده بود.
- **رفع:** CRUD آدرس در `/account` + انتخاب/ذخیره در checkout وقتی لاگین است؛ validate ایران قبل از ذخیره؛ Admin = `Customers → Addresses` (بدون UI سفارشی در `/admin` mashood). راهنما: `doc/auth-otp.md`.
- **قابل‌انتقال:** آدرس حساب ≠ آدرس cart؛ هر دو با Iran Pack validate می‌شوند؛ SoT نمایش ادمین همان Customer Address مدوسا است.

### ۱۴۰۵-۰۵-۰۴ — Admin Vite: Failed to fetch dynamically imported module

- **علامت:** `http://localhost:9000/app/@fs/.../node_modules/.vite/deps/price-list-….js` با TypeError Failed to fetch.
- **علت:** prebundle Vite ادمین ناقص مانده (`deps_temp_*` بدون پوشهٔ نهایی `deps`) — اغلب بعد از قطع نصب npm یا ری‌استارت وسط باندل.
- **رفع:** پاک کردن `apps/backend/node_modules/.vite` سپس ری‌استارت `npm run dev` و Hard Refresh `/app`.
- **قابل‌انتقال:** همان پاک‌سازی کش Vite برای هر Admin Medusa روی Windows؛ ربطی به OTP ندارد ولی همزمان با تغییر `medusa-config` شایع است.

### ۱۴۰۵-۰۵-۰۴ — C-09: OTP موبایل + حساب خریدار (SMS.ir / stub)

- **علامت:** ویترین لاگین خریدار نداشت؛ Medusa فقط `emailpass` داشت؛ SMS.ir در Iran Pack نبود.
- **علت:** OTP عمداً به بعد از ویترین موکول شده بود (C-09 اختیاری).
- **رفع:** Auth provider `phone-auth` + مسیرهای `/store/iran/auth/*`؛ رمز با `emailpass` و ایمیل مصنوعی `{phone}@phone.local` (فقط سرور)؛ SMS.ir VERIFY یا stub؛ صفحات `/login` و `/account` + `transferCart` پس از لاگین. راهنما: `doc/auth-otp.md`.
- **قابل‌انتقال:** کلید SMS هرگز در Vite نرود؛ UI فقط شماره ببیند؛ در stub، `debug_otp` فقط غیر production برمی‌گردد؛ `AUTH_CORS` باید origin ویترین را داشته باشد. بک‌اند = `apps/medusa` نه Express CMS.

### ۱۴۰۵-۰۵-۰۴ — رنگ‌ها: Color روی product بود، روی variant نبود + فیلتر ثابت UI

- **علامت:** در Medusa Admin رنگ (blue/red/White) دیده می‌شد ولی PDP رنگ نداشت یا فیلتر رنگ‌های ثابت Mashhood (Gray/Cream/…) را نشان می‌داد که در کاتالوگ نبود.
- **علت:** افزودن Color values بدون ساخت ماتریس Size×Color؛ `variant.options` فقط Size داشت. فیلترها از `PRODUCT_COLORS` هاردکد بودند نه از Medusa.
- **رفع:** خواندن رنگ از `product.options`؛ inherit fallback (مثلاً White) برای واریانت Size-only؛ رنگ‌های بدون واریانت disabled + راهنما؛ facet سایز/رنگ داینامیک؛ swatch با hex map (red/blue/…).
- **قابل‌انتقال:** در Admin بعد از افزودن Color حتماً واریانت‌های Size×Color بسازید؛ UI فقط optionهای لینک‌شده را قابل خرید می‌کند.

### ۱۴۰۵-۰۵-۰۴ — سایز/رنگ از option title + کد تخفیف Store API

- **علامت:** ویترین سایز/رنگ را اشتباه یا فقط `Default` نشان می‌داد؛ فیلتر رنگ UI با مقادیر Medusa جور نبود؛ کد تخفیف در سبد نبود. بعضی فکر می‌کردند باید در پنل mashood ساخته شود.
- **علت:** `fields` محصول `variants.options.option` را expand نمی‌کرد؛ mapper بدون title به sentinel می‌افتاد. Promotion Module مدوسا در ویترین wire نشده بود. SoT commerce طبق گزینه الف Medusa Admin است نه `/admin`.
- **رفع:** expand `*variants.options.option` + map از `product.options`؛ مخفی کردن Color picker وقتی فقط Size؛ Cart → `addPromotions`/`removePromotions` + نمایش `discount_total`. ساخت کد = Medusa Admin → Promotions.
- **قابل‌انتقال:** UI بعدی همان قرارداد Store promotions؛ option titleها را همیشه با parent option بگیر؛ تخفیف را در پنل برند بازسازی نکن.

### ۱۴۰۵-۰۵-۰۴ — فاز ۷: Medusa جدا از npm scripts + تست legacy Express

- **علامت:** تازه‌واردها ممکن است `npm run medusa` را در این ریپو جستجو کنند؛ تست‌های `/api/products` Express هم با مسیر Medusa اشتباه گرفته می‌شوند.
- **علت:** commerce روی Medusa (`apps/medusa`) است؛ CMS Express فقط برند/صفحات است. کاتالوگ عمومی دیگر منبع حقیقت Express نیست.
- **رفع:** `npm run notes:medusa`؛ Vite proxy فقط `/api`+`/uploads`(+sitemap)؛ تست‌های کاتالوگ Express در `tests/legacy-express-catalog/` و خارج از `test:unit`.
- **قابل‌انتقال:** در UI بعدی هم Medusa را خارج از مونوریپو ویترین نگه دارید مگر عمداً workspace مشترک بسازید؛ تست‌های کاتالوگ قدیمی را از CI پیش‌فرض جدا کنید.

### ۱۴۰۵-۰۵-۰۴ — فاز ۵: payment session + return_url + complete (بدون verify در React)

- **علامت:** بعد از آدرس/ارسال باید به درگاه برود؛ برگشت با `result`/`ref`؛ سفارش فقط بعد از `POST /store/carts/:id/complete` قطعی می‌شود.
- **علت:** SDK با `store.payment.initiatePaymentSession` در صورت نبود، payment collection می‌سازد؛ `data.return_url` باید به ویترین (`/order/result`) برود تا stub pay با 302 برگرداند. Verify در provider `pp_iran-bank_iran` است.
- **رفع:** `/checkout/payment` → initiate + redirect به `session.data.redirect_url`؛ `/order/result` روی `result=success` فقط `cart.complete` می‌زند و `mashood_medusa_cart_id` را پاک می‌کند؛ fail → UI `failed` بدون complete.
- **قابل‌انتقال:** UI بعدی همان قرارداد C-05…C-08؛ هرگز HMAC/token stub را در فرانت بازسازی نکند.

### ۱۴۰۵-۰۵-۰۴ — فاز ۴: validate-address قبل از update cart + shipping options

- **علامت:** بدون آدرس ایران، shipping options ممکن است خالی/نامرتبط برگردند؛ خطای validation باید فارسی و با کد پایدار باشد.
- **علت:** Iran Pack روی `POST /store/iran/validate-address` و middleware آدرس cart کار می‌کند؛ استان باید از لیست شناخته‌شده باشد (fa/en).
- **رفع:** فرم checkout → validate → `cart.update` با `shipping_address`/`billing_address`/`email` → `fulfillment.listCartOptions` → `addShippingMethod`؛ پیام‌ها از `checkoutMessages.js`.
- **قابل‌انتقال:** UI بعدی همان ترتیب C-03 سپس C-04 را نگه دارد؛ کدهای `iran_*` را عوض نکند.

### ۱۴۰۵-۰۵-۰۴ — فاز ۳ سبد: cart_id محلی + variant_id (نه productId+size+color)

- **علامت:** سبد قدیمی `mashood_cart` در localStorage فقط `productId` عددی Express داشت و بدون `variant_id` قابل map به Cart API نبود.
- **علت:** Medusa line items با `variant_id` و `line_item.id` کار می‌کنند؛ هویت سبد سمت سرور است.
- **رفع:** کلید `mashood_medusa_cart_id`؛ یک‌بار پاک‌سازی legacy؛ `ensureCart` + `createLineItem`/`updateLineItem`/`deleteLineItem`؛ UI از `lineItemId` برای update/remove استفاده می‌کند.
- **قابل‌انتقال:** در UI بعدی از روز اول فقط `cart_id` + `variant_id` نگه دارید؛ سبد خالص localStorage را منبع حقیقت نکنید.

### ۱۴۰۵-۰۵-۰۴ — پوشهٔ `doc/agent-priority` + sync هر جلسه

- **علامت:** پیدا کردن «کدام فایل‌های اولویت‌دار» بین کل ریپو سخت بود؛ چت alone آرشیو نیست.
- **علت:** canonical در مسیرهای پراکنده است (ریشه، `.cursor/rules`، `doc/`، AI learning docs).
- **رفع:** بستهٔ شماره‌دار در `doc/agent-priority/` + اسکریپت `npm run sync:agent-priority`؛ Agent هر جلسهٔ معنادار بعد از آپدیت handshake/tasks باید sync کند.
- **قابل‌انتقال:** برای هر پروژهٔ تست‌بد بعدی هم یک پوشهٔ priority pack + sync از canonical مفید است.

### ۱۴۰۵-۰۵-۰۴ — اولویت ذخیره دانش (چت alone کافی نیست)

- **علامت:** یافته‌های تست‌بد اگر فقط در چت بمانند، جلسه بعد از صفر شروع می‌شود.
- **علت:** چت آرشیو پایدار نیست؛ Agent بعدی به transcript وابسته نیست.
- **رفع / قرارداد:** رتبه ذخیره = ۱ `AGENTS.md` → ۲ `.cursor/rules` alwaysApply → ۳ `handshake-learnings.md` → ۴ PURPOSE + tasks → ۵ AI learning docs.
- **قابل‌انتقال:** برای هر UI سفارشی بعدی، اول قرارداد Store API + همین لاگ باگ را بخوان؛ ظاهر Mashhoodwear الزامی نیست.

### ۱۴۰۵-۰۵-۰۴ — فاز ۲ کاتالوگ: فیلتر سایز/رنگ و collections خالی

- **علامت:** Store API فیلتر first-class برای size/color ندارد؛ seed مدوسا `collections: []` برمی‌گرداند.
- **علت:** گزینه‌های واریانت روی product options هستند؛ brand collections هنوز در Medusa seed نشده‌اند.
- **رفع:** فیلتر size/color/price موقتاً client-side روی batch حداکثر ۱۰۰؛ category/collection با resolve `handle → id` سمت سرور. Collections اگر خالی بود فال‌بک به Express CMS (`/api/collections`).
- **قابل‌انتقال:** در UI سفارشی بعدی یا فیلتر option-value مدوسا را wire کن، یا collections را در Medusa seed کن تا CMS حذف شود. تصاویر کاتالوگ از URL مطلق مدوسا (S3) می‌آیند نه `/uploads`.

### ۱۴۰۵-۰۵-۰۴ — CORS ویترین Vite

- **علامت:** درخواست Store API از `localhost:5173` ممکن بود بلاک شود.
- **علت:** `STORE_CORS` فقط `http://localhost:8000` (starter Next) بود.
- **رفع:** افزودن `http://localhost:5173` به `STORE_CORS` در `.env` بک‌اند Medusa.
- **قابل‌انتقال:** هر ویترین جدید باید originاش در `STORE_CORS` باشد.

### ۱۴۰۵-۰۵-۰۴ — Redis اختیاری در dev محلی

- **علامت:** `[ioredis] Unhandled error` هنگام `medusa develop`؛ سرور با این حال روی `:9000` بالا آمد.
- **علت:** Docker/Redis روی `6379` بالا نبود.
- **رفع موقت:** ادامه کار در dev با Local Event Bus؛ برای پایداری Redis را بالا بیاور.
- **قابل‌انتقال:** چک‌لیست go-live باید Redis را اجباری بداند.

### ۱۴۰۵-۰۵-۰۴ — قیمت IRT در seed دمو کوچک است

- **علامت:** `calculated_amount` نمونه محصول‌ها اغلب `10` با `currency_code: irt`.
- **علت:** seed Iran Pack از مقدار دمو `storeDefaultIrtAmount = 10` استفاده می‌کند.
- **رفع:** برای تست UI واقعی قیمت را در Medusa Admin عوض کن؛ mapper همان `calculated_amount` را نشان می‌دهد.
- **قابل‌انتقال:** UI نباید فرض کند واحد نمایش با IRR یکی است؛ region ایران + IRT را از API بگیر.

### ۱۴۰۵-۰۵-۰۴ — موجودی در list پیش‌فرض کامل نیست

- **علامت:** بعضی پاسخ‌های product list فیلد `inventory_quantity` ندارند با اینکه `manage_inventory: true` است.
- **علت:** fields/expansion پیش‌فرض Store API.
- **رفع موقت mapper:** اگر qty نبود، برای browse مقدار پیش‌فرض مثبت؛ با qty واقعی map کن.
- **قابل‌انتقال:** برای UI نهایی، fields موجودی را صریح درخواست کن یا از availability API استفاده کن.

### ۱۴۰۵-۰۵-۰۴ — CMS Express جدا از commerce است

- **علامت:** بدون `:3001`، `/api/settings/home` در Vite proxy خطا می‌دهد؛ کاتالوگ Medusa همچنان کار می‌کند.
- **علت:** تصمیم معماری — CMS روی Express، commerce روی Medusa.
- **رفع:** Layout خطا را log می‌کند و null می‌گذارد؛ برای Home کامل CMS را هم بالا بیاور.
- **قابل‌انتقال:** ویترین سفارشی بعدی می‌تواند CMS را جدا یا داخل Medusa نگه دارد؛ commerce را قاطی CMS نکن.

### ۱۴۰۵-۰۵-۰۴ — ادمین commerce = فقط Medusa Admin (گزینه الف)

- **علامت:** انتظار ورود محصول داخل `/admin` mashoodwear.
- **علت:** تصمیم قفل‌شده — بازسازی Admin مدوسا داخل Vite خارج از محدوده است.
- **رفع:** لینک به `:9000/app`؛ CRUD محصول Express deprecate.
- **قابل‌انتقال:** برای مشتری بعدی هم معمولاً Medusa Admin کافی است مگر درخواست صریح UI ادمین سفارشی.

### ۱۴۰۵-۰۵-۰۴ — فاز ۱۰: شکاف‌های چک‌لیست Storefront

- **علامت:** چک‌لیست از صفر شامل مالیات، جزئیات سفارش، reset رمز، categories، gift card، wishlist، returns بود که در مانکن نبود.
- **علت:** مسیر اصلی C-01…C-09 روی MVP خرید تمرکز داشت؛ extras بعداً اضافه شدند.
- **رفع:** totals با `tax_total`؛ `/account/orders/:id`؛ OTP reset؛ Loyalty plugin؛ wishlist local؛ `POST /store/returns` + seed مرجوعی ایران.
- **قابل‌انتقال:** Gift card نیاز به `@medusajs/loyalty-plugin` + migrate دارد؛ return نیاز به shipping option با `is_return=true` و قلم تحویل‌شده.

### ۱۴۰۵-۰۵-۰۴ — Cart ۵۰۰ بعد از اضافه کردن `*gift_cards`

- **علامت:** صفحه `/cart` خالی/خطا؛ GET cart با fields شامل `*gift_cards` → ۵۰۰؛ لاگ: `relation "cart_cart_loyalty_gift_card" does not exist`.
- **علت:** Loyalty plugin در config بود ولی `db:migrate` اجرا نشده بود؛ expand gift_cards جدول لینک را می‌خواست.
- **رفع:** `CART_FIELDS` بدون `*gift_cards` تا migrate؛ سپس migrate؛ بعد از جداول می‌توان دوباره expand کرد.
- **قابل‌انتقال:** هرگز `*gift_cards` را قبل از migrate Loyalty روی cart fields نگذار — کل سبد را می‌شکند.

### ۱۴۰۵-۰۵-۰۴ — فاز ۶: Dashboard CMS + deprecate محصولات/دسته

- **علامت:** منوی `/admin` هنوز Products/Categories داشت و Dashboard آمار موجودی Express نشان می‌داد.
- **علت:** پنل از قبل از اتصال Medusa برای کاتالوگ Express ساخته شده بود.
- **رفع:** ناوبری CMS-only؛ CTA به `VITE_MEDUSA_ADMIN_URL`؛ مسیرهای products/categories → صفحهٔ moved؛ export اختیاری `npm run export:products-for-medusa`.
- **قابل‌انتقال:** در ویترین بعدی هم commerce SoT را از brand CMS جدا نگه دار؛ لینک Admin کافی است مگر Path ب.

### ۱۴۰۵-۰۵-۱۲ — Cover image کالکشن در Medusa Admin

- **علامت:** فرم native کالکشن فقط title/handle دارد؛ کارت‌های `/collections` بدون کاور می‌مانند.
- **علت:** Product Collection مدوسا فیلد media ندارد؛ Store API هم به‌صورت پیش‌فرض `metadata` را برنمی‌گرداند.
- **رفع:** ویجت Admin در `product_collection.details.after` آپلود می‌کند و URL را در `metadata.cover_image_url` می‌نویسد؛ ویترین با `fields: id,title,handle,*metadata` می‌خواند و mapper همان کلید را map می‌کند.
- **قابل‌انتقال:** برای entityهای بدون media در Admin، metadata + upload + fields صریح روی Store کافی است؛ ماژول جدا فقط وقتی گالری چندتصویری لازم است.

### ۱۴۰۵-۰۵-۱۲ — Admin سفید: `__iranPackI18n` already declared

- **علامت:** `Uncaught SyntaxError: Identifier '__iranPackI18n' has already been declared` → صفحه `/app` لود نمی‌شود.
- **علت:** پلاگین `iran-pack-loyalty-i18n` stub اس‌بیلد را با `var` و پارامتر minify‌شده (`key2`) نمی‌شناخت؛ transform دوباره `import { instance as __iranPackI18n }` اضافه می‌کرد.
- **رفع:** strip/detect برای `var|let|const` stub انعطاف‌پذیر شد؛ قبل از import مشترک stub پاک می‌شود؛ deps فعلی به یک declaration ارتقا یافت.
- **قابل‌انتقال:** هر Vite plugin که به prebundle تزریق می‌کند باید فرم minify‌شدهٔ esbuild را هم strip کند وگرنه SyntaxError کل Admin را می‌کشد.

### ۱۴۰۵-۰۵-۱۸ — Monorepo: Medusa داخل همین ریپو

- **علامت:** برای کار لوکال باید دو مسیر جدا (`mashoodwear-medusa` + `F:\medusa-develop\...`) نگه داشت؛ clone از GitHub کامل نبود.
- **علت:** Iran Pack خارج از ریپوی GitHub بود.
- **رفع:** کپی به `apps/medusa`، npm workspaces، docker-compose (MySQL + Postgres `:5433` + Redis)، اسکریپت‌های `dev:medusa` / `migrate:medusa`، به‌روزرسانی deploy dual-stack.
- **قابل‌انتقال:** روی ویندوز اگر Postgres محلی `:5432` را گرفته، compose را روی پورت دیگر map کن؛ Redis موجود روی `:6379` را دوباره نساز.

---

## قالب کپی برای ردیف جدید

```markdown
### YYYY-MM-DD — عنوان کوتاه

- **علامت:**
- **علت:**
- **رفع:**
- **قابل‌انتقال:**
```
