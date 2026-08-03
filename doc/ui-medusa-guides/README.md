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

# بستهٔ راهنما — ساخت UI و سوار کردن روی Medusa

> **برای Agent / سازندهٔ ویترین بعدی:** همهٔ راهنماهای مفید از `doc/` (+ قرارداد API ایران Pack + learning note) اینجاست.  
> **منبع اصلی (canonical) هنوز مسیرهای اصلی است** — اینجا فقط کپی شماره‌دار برای خواندن یک‌جا. بعد از ویرایش canonical: `npm run sync:ui-medusa-guides`.

این بسته با `doc/agent-priority/` فرق دارد:

| پوشه | هدف |
|------|-----|
| `doc/agent-priority/` | اولویت **ذخیرهٔ دانش** جلسه (handshake، tasks، …) |
| **`doc/ui-medusa-guides/`** | ترتیب خواندن برای **ساخت / سوار کردن Storefront روی Medusa** |

---

## ترتیب خواندن (ساخت ویترین جدید)

1. `01-AGENTS.md` — نقشهٔ ریپو، تصمیم‌های قفل، hotspots adapter  
2. `02-PURPOSE.md` — چه چیزی منتقل می‌شود / چه چیزی نه  
3. `03-implementation_plan.md` — معماری Path A + adapter + محدوده  
4. `04-admin-split.md` — commerce فقط Medusa Admin؛ CMS جدا  
5. `05-storefront-api-contract.md` — قرارداد C-01…C-09 (ایران Pack)  
6. `06-storefront-feature-checklist.md` — صفحات، دکمه‌ها، totals، env  
7. `07-storefront-extras-guide.md` — categories، wishlist، gift، return، tax  
8. `08-auth-otp.md` — OTP / حساب / آدرس ذخیره‌شده  
9. `09-payment-smoke-checklist.md` — smoke پرداخت C-03…C-08  
10. `10-handshake-learnings.md` — باگ‌ها را تکرار نکن  
11. `11-tasks-medusa.md` — وضعیت پیشرفت تست‌بد (زمینه)  
12. `12-medusa-ui-testbed-then-custom-storefront.md` — پلی‌بوک یادگیری

**حداقل کوتاه برای شروع کد:** `01` → `05` → `06` → `10` → hotspots در AGENTS.

---

## فهرست فایل‌ها ↔ canonical

| # | در این پوشه | منبع اصلی |
|---|-------------|-----------|
| 01 | `01-AGENTS.md` | `/AGENTS.md` |
| 02 | `02-PURPOSE.md` | `/doc/PURPOSE.md` |
| 03 | `03-implementation_plan.md` | `/doc/implementation_plan.md` |
| 04 | `04-admin-split.md` | `/doc/admin-split.md` |
| 05 | `05-storefront-api-contract.md` | `F:\medusa-develop\my-medusa-store\docs\phase-a-iran-pack\storefront-api-contract.md` |
| 06 | `06-storefront-feature-checklist.md` | `/doc/storefront-feature-checklist.md` |
| 07 | `07-storefront-extras-guide.md` | `/doc/storefront-extras-guide.md` |
| 08 | `08-auth-otp.md` | `/doc/auth-otp.md` |
| 09 | `09-payment-smoke-checklist.md` | `/doc/payment-smoke-checklist.md` |
| 10 | `10-handshake-learnings.md` | `/doc/handshake-learnings.md` |
| 11 | `11-tasks-medusa.md` | `/doc/tasks-medusa.md` |
| 12 | `12-medusa-ui-testbed-then-custom-storefront.md` | `AI learning docs/.../medusa-ui-testbed-then-custom-storefront.md` |

---

## عمداً داخل این بسته نیست

این‌ها برای **ظاهر مانکن Mashhoodwear** یا **دیپلوی**‌اند، نه قرارداد سوار کردن UI مشتری روی Medusa:

| فایل در `doc/` | چرا خارج است |
|----------------|--------------|
| `look-and-feel.md` · `design.md` · `ui-behavior.md` | برند/UX مانکن — کپی نکن مگر مشتری همان را بخواهد |
| `DEPLOY.md` · `DEPLOY-IRAN.md` | استقرار سرور، نه adapter ویترین |
| `proposal.md` · `tasks.md` | قدیمی / عمومی؛ پیشرفت فعلی = `tasks-medusa.md` |

اگر ظاهر مانکن لازم شد: مستقیم همان فایل‌های canonical در `doc/` را بخوان.

---

## قوانین طلایی هنگام ساخت UI

1. Adapter نازک زیر `frontend/src/api/medusa/` — صفحات را به shape Medusa خام قفل نکن.  
2. Verify درگاه و کلید SMS را در React نگذار.  
3. ظاهر Mashhoodwear را کپی نکن مگر درخواست صریح.  
4. باگ جدید → همان جلسه در `doc/handshake-learnings.md` (canonical).  
5. بعد از آپدیت canonicalهای این بسته:

```bash
npm run sync:ui-medusa-guides
npm run sync:agent-priority
```

---

## مسیر پوشه

`C:\Users\KASRA\Desktop\mashoodwear-medusa\doc\ui-medusa-guides`
