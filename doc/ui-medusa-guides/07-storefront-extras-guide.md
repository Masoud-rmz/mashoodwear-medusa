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

# راهنمای قابلیت‌های اضافهٔ Storefront (برای Agent و ویترین بعدی)

## تمثیل

مسیر اصلی خرید مثل جادهٔ اصلی شهر است (کاتالوگ → سبد → آدرس → پرداخت).  
این سند **فرعی‌های مفید** را توضیح می‌دهد: دسته‌ها، علاقه‌مندی، کارت هدیه، مالیات در totals، جزئیات سفارش، مرجوعی، بازیابی رمز — بدون قاطی کردن با درگاه واقعی بانک یا SMS واقعی.

**مخاطب:** Agent جلسهٔ بعد · سازندهٔ UI مشتری روی همان Medusa.

---

## کجا بخوانی (ترتیب)

| رتبه | سند | نقش |
|------|-----|-----|
| ۱ | [`AGENTS.md`](../AGENTS.md) | نقشهٔ ریپو + hotspots |
| ۲ | [`handshake-learnings.md`](./handshake-learnings.md) | باگ‌های کشف‌شده |
| ۳ | [`storefront-feature-checklist.md`](./storefront-feature-checklist.md) | چک‌لیست کامل + وضعیت mashood |
| ۳b | [`ui-medusa-guides/`](./ui-medusa-guides/README.md) | بستهٔ یک‌جا برای ساخت/سوار کردن UI روی Medusa |
| ۴ | **همین فایل** | جزئیات extras و قرارداد قابل‌انتقال |
| ۵ | قرارداد API | `F:\medusa-develop\my-medusa-store\docs\phase-a-iran-pack\storefront-api-contract.md` |
| ۶ | OTP | [`auth-otp.md`](./auth-otp.md) |

---

## نقشهٔ مسیرها (مانکن)

| مسیر | نقش | زبان UI مانکن |
|------|-----|----------------|
| `/categories` · `/categories/:slug` | لیست / PLP دستهٔ Medusa | **English** (مثل Collections) |
| `/wishlist` | علاقه‌مندی محلی | **English** |
| `/account/orders/:orderId` | جزئیات سفارش + مرجوعی | فارسی (مسیر حساب ایران) |
| `/login?mode=reset` یا تب فراموشی رمز | بازیابی رمز با OTP | فارسی |
| `/cart` | پرومو + gift card + totals (مالیات) | ترکیبی؛ فرم‌های کد فارسی |

Checkout / پرداخت / OTP عمداً فارسی می‌مانند (بازار ایران). Categories و Wishlist مثل بقیهٔ discovery برند (Collections, Products) انگلیسی‌اند تا با مانکن گیج‌کننده نشوند.

---

## ۱) Categories

**Backend:** Store API `GET /store/product-categories` · فیلتر محصولات با `category_id`.  
**فرانت:**

- [`frontend/src/pages/CategoriesPage.jsx`](../frontend/src/pages/CategoriesPage.jsx)
- [`frontend/src/pages/CategoryDetailPage.jsx`](../frontend/src/pages/CategoryDetailPage.jsx)
- Adapter: `getCategories` / `getCategoryBySlug` در `api/medusa/catalog.js` و facade `api/client.js`

**قابل‌انتقال به UI مشتری:** همان API؛ ظاهر برند را کپی نکن. Handle دسته در Medusa Admin ساخته می‌شود.

**فیلتر سایز/رنگ:** سرور category/collection/search را می‌گیرد؛ برای گزینه تا سقف ۵۰۰ قلم صفحه‌بندی سپس فیلتر client (`listRawProductsForClientFilter`).

---

## ۲) Wishlist

**Medusa هسته ندارد.** ماندنی در `localStorage` کلید `mashood_wishlist`.

| فایل | نقش |
|------|-----|
| `frontend/src/utils/wishlistStorage.js` | read/write/toggle |
| `frontend/src/hooks/useWishlist.js` | React subscribe |
| `frontend/src/components/WishlistButton.jsx` | قلب روی کارت / PDP |
| `frontend/src/pages/WishlistPage.jsx` | صفحهٔ لیست |

**قابل‌انتقال:** یا همان الگوی localStorage، یا sync به customer metadata / ماژول سفارشی اگر مشتری خواست. هرگز فرض نکن Store API wishlist دارد.

---

## ۳) مالیات در totals

از فیلدهای Cart بخوان؛ دوباره حساب نکن:

- `tax_total` · `discount_total` · `gift_card_total` · `shipping_total` · `total`
- Helpers: `promotionHelpers.mapCartMoneySummary` · `checkoutHelpers.extractCartTotals`

نمایش ردیف مالیات حتی اگر ۰ باشد مفید است برای UI بعدی.

---

## ۴) Gift card

**Backend:** `@medusajs/loyalty-plugin` در `medusa-config.ts` ایران Pack. بعد از نصب **حتماً** `npx medusa db:migrate` (بدون migrate، expand `*gift_cards` روی cart کل سبد را با ۵۰۰ می‌شکند — ردیف handshake مربوطه را ببین).  
**Store API:** `POST/DELETE /store/carts/:id/gift-cards` با body `{ code }`.  
**فرانت:** `GiftCodeForm` + `addCartGiftCard` / `removeCartGiftCard` در `cart.js`.  
ساخت کارت فقط در Medusa Admin.

---

## ۵) جزئیات سفارش + مرجوعی

- `GET /store/orders/:id` → `OrderDetailPage`
- `POST /store/returns` + `GET /store/shipping-options?is_return=true`
- Seed ایران: shipping option «مرجوعی (ایران)» با `is_return=true` در `initial-data-seed.ts`
- قلم معمولاً بعد از تحویل (`delivered`) قابل مرجوعی است؛ UI اگر option نباشد پیام واضح می‌دهد

---

## ۶) بازیابی رمز (OTP stub)

- `POST /store/iran/auth/otp/send` با `purpose: "reset"`
- `POST /store/iran/auth/password/reset` با `{ phone, otp, password }`
- SMS واقعی عمداً خارج از محدوده؛ stub/`debug_otp` کافی برای تست

جزئیات: [`auth-otp.md`](./auth-otp.md).

---

## پلی‌بوک ویترین مشتری بعدی

1. این راهنما + handshake + checklist وضعیت mashood را بخوان.
2. ریپوی UI جدید بساز؛ ظاهر Mashhoodwear را کپی نکن مگر درخواست.
3. Adapter نازک: categories · wishlist (تصمیم بگیر local یا server) · gift card اگر Loyalty روشن است · tax در totals · order detail · returns در صورت نیاز.
4. env: publishable key · region IR · CORS.
5. Verify پرداخت و کلید SMS را در فرانت نگذار.

---

## Anti-confusion (زبان مانکن)

| بخش | زبان |
|-----|------|
| Home / Collections / Products / Categories / Wishlist / Lookbook / About | English labels |
| Checkout / Payment / Login OTP / Account / ایران آدرس | فارسی |
| Admin CMS mashood `/admin` | English (قبلی) |

اگر مشتری RTL فارسی کامل خواست، در ویترین بعدی همه را فارسی کن — اینجا فقط مانکن تست است.

---

## چک سریع بعد از تغییر

```bash
cd C:\Users\KASRA\Desktop\mashoodwear-medusa
npm run test:unit
npm run sync:agent-priority
```

Medusa (جدا): migrate Loyalty اگر gift card تازه است؛ seed مرجوعی اگر DB قدیمی است.
