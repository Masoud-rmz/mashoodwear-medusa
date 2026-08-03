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

# مرز ادمین — گزینهٔ الف

**تصمیم قفل‌شده:** commerce فقط از Medusa Admin؛ `/admin` mashoodwear فقط CMS برند + لینک به Medusa.

| کار | کجا |
|-----|-----|
| محصول، واریانت (سایز/رنگ)، قیمت، موجودی | Medusa Admin (`:9000/app`) |
| سفارش، پرداخت، مشتری (**و Addresses مشتری**)، منطقه، shipping، **تخفیف / Promotion** | Medusa Admin |
| صفحات About / Contact / How to Buy | `/admin` mashoodwear (Express) |
| Lookbook، Home hero، Instagram/Telegram settings | `/admin` mashoodwear (Express) |
| Collections برند (ساخت/ویرایش + عکس کاور در Medusa Admin) | Medusa Admin → Collections → Cover image widget |
| Collections برند (فال‌بک موقت اگر Medusa خالی باشد) | `/admin` → Collections (Express) |

## سایز / رنگ و کد تخفیف

- **سایز و رنگ** = Product Options در Medusa (`Size` / `Color` یا `سایز` / `رنگ`). ویترین فقط از Store API می‌خواند؛ CRUD در `/admin` mashoodwear نیست.
- **کد تخفیف** = Promotion در Medusa Admin؛ خریدار روی صفحه Cart با `POST /store/carts/:id/promotions` اعمال می‌کند. منطق قانون تخفیف در React کپی نمی‌شود.
- **آدرس خریدار** = Customer Addresses در Medusa؛ ویترین با `/store/customers/me/addresses` ذخیره می‌کند؛ ادمین در `Customers → [customer] → Addresses` می‌بیند (نه داخل `/admin` mashoodwear).

## ممنوع

- ساختن مجدد UI سفارش / موجودی / پرداخت / مشتری داخل Vite `/admin`
- نگه داشتن CRUD محصول یا دسته روی Express به‌عنوان منبع حقیقت موازی
- انتظار ورود محصول از Dashboard قدیمی Express

## لینک و env

- env: `VITE_MEDUSA_ADMIN_URL` (پیش‌فرض `http://localhost:9000/app`)
- در Dashboard و هدر سایدبار: دکمهٔ **Manage store in Medusa Admin**
- مسیرهای `/admin/products` و `/admin/categories` صفحهٔ deprecate با لینک به Medusa نشان می‌دهند (نه فرم CRUD)

## نقش‌ها به‌صورت خلاصه

```
Medusa Admin (:9000/app)  =  commerce SoT
/admin mashoodwear        =  brand CMS + لینک
```

## انتقال کاتالوگ Express → Medusa (اختیاری)

```bash
npm run export:products-for-medusa
```

خروجی JSON در `backend/exports/medusa-products-from-express.json` — برای import دستی / اسکریپت Admin API مدوسا؛ Express دیگر SoT کاتالوگ نیست.
