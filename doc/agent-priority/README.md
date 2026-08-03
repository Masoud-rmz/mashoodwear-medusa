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

# بستهٔ اولویت ذخیره — Agent Priority Pack

> **این پوشه فقط برای دیدن سریع «کدام فایل‌ها مهم‌اند» است.**  
> **منبع اصلی (canonical) هنوز مسیرهای اصلی ریپو است** — Agent اول آنجا را می‌خواند و می‌نویسد، بعد همین پوشه را sync می‌کند.

چت alone کافی نیست. Mashhoodwear اینجا مانکن تست است؛ ماندنی = قرارداد API + فهرست باگ.

## فهرست شماره‌دار (همین پوشه)

| رتبه | فایل در این پوشه | منبع اصلی (canonical) | نقش |
|------|------------------|------------------------|-----|
| ۱ | `01-AGENTS.md` | `/AGENTS.md` | اول چیزی که Agent می‌خواند |
| ۲ | `02-cursor-rule-mashoodwear-medusa.mdc` | `/.cursor/rules/mashoodwear-medusa.mdc` | alwaysApply در هر چت |
| ۳ | `03-handshake-learnings.md` | `/doc/handshake-learnings.md` | لاگ زنده باگ — مهم‌ترین برای UI بعدی |
| ۴ | `04-PURPOSE.md` | `/doc/PURPOSE.md` | هدف تست‌بد |
| ۴ | `04-tasks-medusa.md` | `/doc/tasks-medusa.md` | پیشرفت فازها |
| ۵ | `05-medusa-ui-testbed-then-custom-storefront.md` | `AI learning docs/.../medusa-ui-testbed-then-custom-storefront.md` | دانش عمومی + لینک |
| ۶ | `06-auth-otp.md` | `/doc/auth-otp.md` | OTP موبایل + حساب خریدار (C-09) |
| ۷ | `07-storefront-extras-guide.md` | `/doc/storefront-extras-guide.md` | Categories / Wishlist / gift / returns / tax — برای UI بعدی |
| ۸ | `08-storefront-feature-checklist.md` | `/doc/storefront-feature-checklist.md` | چک‌لیست کامل + وضعیت mashood |

## قانون هر جلسه (برای Agent)

1. کار واقعی را روی **canonical** انجام بده (نه فقط کپی این پوشه).
2. کشف/باگ → همان جلسه در `doc/handshake-learnings.md`.
3. پیشرفت → تیک در `doc/tasks-medusa.md`.
4. پایان جلسهٔ معنادار → اجرای sync:

```bash
node scripts/sync-agent-priority.mjs
```

یا از ریشهٔ پروژه:

```bash
npm run sync:agent-priority
```

## مسیر پوشه

`C:\Users\KASRA\Desktop\mashoodwear-medusa\doc\agent-priority`

## بعداً چطور برای UI مشتری استفاده می‌شود؟

وقتی ویترین جدید روی **همان** Medusa سوار می‌شود:

1. این پوشه / `handshake` را می‌خوانیم تا باگ‌های کشف‌شده تکرار نشوند.
2. قرارداد `storefront-api-contract.md` (C-01…C-09) نقشهٔ API است.
3. UI جدید جدا ساخته می‌شود؛ ظاهر Mashhoodwear کپی نمی‌شود مگر درخواست مشتری.
4. فقط الگوها منتقل می‌شوند: SDK + key + region IRT + سبد با `variant_id` + آدرس ایران + `pp_iran-bank_iran` بدون verify در فرانت + OTP از `/store/iran/auth/*` بدون کلید SMS در فرانت.

## بستهٔ جدا برای ساخت UI روی Medusa

برای ترتیب خواندن + کپی همهٔ راهنماهای سوار کردن ویترین (checklist، API contract، OTP، payment smoke، …) برو به:

[`doc/ui-medusa-guides/`](../ui-medusa-guides/README.md) — sync: `npm run sync:ui-medusa-guides`

اسناد پشتیبان مرتبط (canonical):  
`doc/payment-smoke-checklist.md` · `doc/admin-split.md` · `doc/auth-otp.md` · قرارداد C-01…C-09 در my-medusa-store.

جزئیات کامل:  
`C:\Users\KASRA\Desktop\AI learning docs\05-Web-Development\medusa-ui-testbed-then-custom-storefront.md` بخش «پلی‌بوک».
