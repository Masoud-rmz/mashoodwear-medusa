import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const jsonDir = path.resolve(__dirname, "../json")

const enMissing = JSON.parse(
  fs.readFileSync(path.join(jsonDir, "_missing-en.json"), "utf8")
)
const existingFa = JSON.parse(
  fs.readFileSync(path.join(jsonDir, "fa.json"), "utf8")
)

const phrases = new Map([
  [
    "You are about to delete the {{entity}} {{title}}. This action cannot be undone.",
    "در حال حذف {{entity}} {{title}} هستید. این عمل قابل بازگشت نیست.",
  ],
  [
    "There are no records to show matching the filters",
    "رکوردی مطابق فیلترها یافت نشد",
  ],
  [
    "Select which values to use for each option",
    "مقادیر هر گزینه را انتخاب کنید",
  ],
  [
    "One or more files exceed the maximum file size of {{size}}: {{name}}",
    "یک یا چند فایل از حداکثر اندازه {{size}} بیشتر است: {{name}}",
  ],
  [
    "Add product images to the variant. To add new images, add them to the product first.",
    "تصاویر محصول را به واریانت اضافه کنید. برای تصویر جدید، ابتدا به خود محصول اضافه کنید.",
  ],
  [
    "Associate or disassociate product options from this product.",
    "گزینه‌های محصول را به این محصول متصل یا جدا کنید.",
  ],
  [
    "Select which options should be associated to this product.",
    "گزینه‌هایی که باید به این محصول متصل شوند را انتخاب کنید.",
  ],
  [
    "Please select at least one value for the added option(s).",
    "حداقل یک مقدار برای گزینه(های) اضافه‌شده انتخاب کنید.",
  ],
  [
    "Successfully updated the shipping profile for {{title}}.",
    "پروفایل ارسال برای {{title}} با موفقیت به‌روز شد.",
  ],
  [
    "Manage product options and their associated values.",
    "مدیریت گزینه‌های محصول و مقادیر مرتبط.",
  ],
  [
    "There are no values for this option.",
    "برای این گزینه مقداری وجود ندارد.",
  ],
  [
    'You are about to delete the option value "{{value}}". This action cannot be undone.',
    "در حال حذف مقدار گزینه «{{value}}» هستید. این عمل قابل بازگشت نیست.",
  ],
  ["Option value was successfully deleted.", "مقدار گزینه با موفقیت حذف شد."],
  [
    "There are no products with this option.",
    "محصولی با این گزینه وجود ندارد.",
  ],
  [
    "Create a new product option and manage its values.",
    "یک گزینه محصول جدید بسازید و مقادیرش را مدیریت کنید.",
  ],
  [
    'Product option "{{title}}" was successfully created.',
    "گزینه محصول «{{title}}» با موفقیت ساخته شد.",
  ],
  [
    "Enter the 6-digit code from your authenticator app.",
    "کد ۶ رقمی برنامه احراز هویت را وارد کنید.",
  ],
  ["Enter one of your recovery codes.", "یکی از کدهای بازیابی را وارد کنید."],
  [
    "The verification code could not be confirmed.",
    "کد تأیید تأیید نشد.",
  ],
  ["Authentication could not be completed.", "احراز هویت کامل نشد."],
  [
    "Lost access to your authenticator app?",
    "به برنامه احراز هویت دسترسی ندارید؟",
  ],
  [
    "Have access to your authenticator app?",
    "به برنامه احراز هویت دسترسی دارید؟",
  ],
  [
    "This updates the default layout for this page for all users who haven't customized it themselves. Are you sure?",
    "این کار چیدمان پیش‌فرض این صفحه را برای همه کاربرانی که شخصی‌سازی نکرده‌اند عوض می‌کند. مطمئنید؟",
  ],
  ["You're seeing a personal layout", "چیدمان شخصی را می‌بینید"],
  ["You're seeing a system layout", "چیدمان سیستمی را می‌بینید"],
  ["Drop here to move to the end", "اینجا رها کنید تا به انتها منتقل شود"],
  ["Save layout for everyone", "ذخیره چیدمان برای همه"],
  ["Image variants successfully updated.", "واریانت‌های تصویر با موفقیت به‌روز شد."],
  [
    "Add media to the variant to showcase it in your storefront.",
    "برای نمایش در ویترین، رسانه به واریانت اضافه کنید.",
  ],
  [
    "Connect the product to a shipping profile",
    "محصول را به یک پروفایل ارسال متصل کنید",
  ],
  ["Shipping profile is required", "پروفایل ارسال الزامی است"],
  ["Two-factor authentication", "احراز هویت دو مرحله‌ای"],
  ["Use a recovery code", "استفاده از کد بازیابی"],
  ["Use an authenticator code", "استفاده از کد احراز هویت"],
  ["Back to login", "بازگشت به ورود"],
  ["Recovery code", "کد بازیابی"],
  ["Organize rankings", "مرتب‌سازی اولویت‌ها"],
  ["Manage associated variants", "مدیریت واریانت‌های مرتبط"],
  [
    "Manage associated variants for the image",
    "مدیریت واریانت‌های مرتبط با تصویر",
  ],
  ["Add to multiple variants", "افزودن به چند واریانت"],
  ["Show available images", "نمایش تصاویر موجود"],
  ["Select images", "انتخاب تصاویر"],
  ["Remove Selected", "حذف انتخاب‌شده‌ها"],
  ["Variant images", "تصاویر واریانت"],
  ["Variant Media", "رسانه واریانت"],
  ["Manage variants", "مدیریت واریانت‌ها"],
  ["No media yet", "هنوز رسانه‌ای نیست"],
  ["Add media", "افزودن رسانه"],
  ["Edit variant images", "ویرایش تصاویر واریانت"],
  ["Edit images", "ویرایش تصاویر"],
  ["Go to product option", "رفتن به گزینه محصول"],
  ["Save and close", "ذخیره و بستن"],
  ["Save changes", "ذخیره تغییرات"],
  ["Select all", "انتخاب همه"],
  ["Unselect all", "لغو انتخاب همه"],
  ["Collapse all", "بستن همه"],
  ["Customize top bar", "سفارشی‌سازی نوار بالا"],
  ["Customize sidebar", "سفارشی‌سازی نوار کناری"],
  ["Customize settings sidebar", "سفارشی‌سازی نوار کناری تنظیمات"],
  ["Customize page", "سفارشی‌سازی صفحه"],
  ["Customize layout", "سفارشی‌سازی چیدمان"],
  ["Save for everyone", "ذخیره برای همه"],
  ["Layout saved", "چیدمان ذخیره شد"],
  ["Drag to reorder", "برای جابجایی بکشید"],
  ["Product-specific", "مختص محصول"],
  ["Quantity Price", "قیمت تعدادی"],
  ["Shipping profile", "پروفایل ارسال"],
  ["Shipping configuration", "پیکربندی ارسال"],
  ["Shipping Configuration", "پیکربندی ارسال"],
  ["Manage Product Options", "مدیریت گزینه‌های محصول"],
  ["Product Options", "گزینه‌های محصول"],
  ["Select options", "انتخاب گزینه‌ها"],
  ["Create Product Option", "ایجاد گزینه محصول"],
  ["Sales Channels", "کانال‌های فروش"],
  ["{{count}} value", "{{count}} مقدار"],
  ["{{count}} values", "{{count}} مقدار"],
  ["All", "همه"],
  ["Original", "اصلی"],
  ["Left", "باقی‌مانده"],
  ["Rank", "رتبه"],
  ["Global", "سراسری"],
  ["Show", "نمایش"],
  ["Manage", "مدیریت"],
  ["Addresses", "آدرس‌ها"],
  ["Personal", "شخصی"],
  ["Default", "پیش‌فرض"],
  ["Empty", "خالی"],
  ["Verify", "تأیید"],
  ["Details", "جزئیات"],
  ["Product", "محصول"],
  ["Variants", "واریانت‌ها"],
  ["Collection", "مجموعه"],
  ["Status", "وضعیت"],
  ["Thumbnail", "تصویرک"],
  ["Title", "عنوان"],
  ["Handle", "شناسه"],
  ["Created", "ایجاد"],
  ["Updated", "به‌روزرسانی"],
  ["Options", "گزینه‌ها"],
  ["Values", "مقادیر"],
])

const tokenMap = [
  ["product options", "گزینه‌های محصول"],
  ["Product Options", "گزینه‌های محصول"],
  ["product option", "گزینه محصول"],
  ["Product option", "گزینه محصول"],
  ["shipping profile", "پروفایل ارسال"],
  ["Shipping profile", "پروفایل ارسال"],
  ["sales channels", "کانال‌های فروش"],
  ["Sales Channels", "کانال‌های فروش"],
  ["sales channel", "کانال فروش"],
  ["stock locations", "مکان‌های انبار"],
  ["Stock Locations", "مکان‌های انبار"],
  ["stock location", "مکان انبار"],
  ["tax regions", "مناطق مالیاتی"],
  ["Tax Regions", "مناطق مالیاتی"],
  ["tax region", "منطقه مالیاتی"],
  ["price lists", "لیست‌های قیمت"],
  ["Price Lists", "لیست‌های قیمت"],
  ["price list", "لیست قیمت"],
  ["draft orders", "سفارش‌های پیش‌نویس"],
  ["Draft Orders", "سفارش‌های پیش‌نویس"],
  ["draft order", "سفارش پیش‌نویس"],
  ["refund reasons", "دلایل بازپرداخت"],
  ["Refund Reasons", "دلایل بازپرداخت"],
  ["refund reason", "دلیل بازپرداخت"],
  ["shipping option types", "انواع روش ارسال"],
  ["Shipping Option Types", "انواع روش ارسال"],
  ["shipping option type", "نوع روش ارسال"],
  ["authenticator app", "برنامه احراز هویت"],
  ["recovery code", "کد بازیابی"],
  ["Two-factor authentication", "احراز هویت دو مرحله‌ای"],
  ["cannot be undone", "قابل بازگشت نیست"],
  ["This action cannot be undone.", "این عمل قابل بازگشت نیست."],
  ["You are about to delete", "در حال حذف"],
  ["You are about to", "در حال"],
  ["was successfully created.", "با موفقیت ایجاد شد."],
  ["was successfully updated.", "با موفقیت به‌روز شد."],
  ["was successfully deleted.", "با موفقیت حذف شد."],
  ["Successfully updated", "با موفقیت به‌روز شد"],
  ["Successfully created", "با موفقیت ایجاد شد"],
  ["Successfully deleted", "با موفقیت حذف شد"],
  ["successfully", "با موفقیت"],
  ["Successfully", "با موفقیت"],
  ["There are no", "وجود ندارد:"],
  ["there are no", "وجود ندارد:"],
  ["No records", "رکوردی نیست"],
  ["no records", "رکوردی نیست"],
  ["Learn more", "بیشتر بدانید"],
  ["Are you sure?", "مطمئنید؟"],
  ["Are you sure", "مطمئنید"],
  ["customers", "مشتریان"],
  ["Customers", "مشتریان"],
  ["customer", "مشتری"],
  ["Customer", "مشتری"],
  ["orders", "سفارش‌ها"],
  ["Orders", "سفارش‌ها"],
  ["order", "سفارش"],
  ["Order", "سفارش"],
  ["products", "محصولات"],
  ["Products", "محصولات"],
  ["product", "محصول"],
  ["Product", "محصول"],
  ["variants", "واریانت‌ها"],
  ["Variants", "واریانت‌ها"],
  ["variant", "واریانت"],
  ["Variant", "واریانت"],
  ["inventory", "موجودی"],
  ["Inventory", "موجودی"],
  ["permissions", "مجوزها"],
  ["Permissions", "مجوزها"],
  ["permission", "مجوز"],
  ["Permission", "مجوز"],
  ["roles", "نقش‌ها"],
  ["Roles", "نقش‌ها"],
  ["role", "نقش"],
  ["Role", "نقش"],
  ["policies", "سیاست‌ها"],
  ["Policies", "سیاست‌ها"],
  ["policy", "سیاست"],
  ["Policy", "سیاست"],
  ["promotions", "پروموشن‌ها"],
  ["Promotions", "پروموشن‌ها"],
  ["promotion", "پروموشن"],
  ["Promotion", "پروموشن"],
  ["campaigns", "کمپین‌ها"],
  ["Campaigns", "کمپین‌ها"],
  ["campaign", "کمپین"],
  ["Campaign", "کمپین"],
  ["translations", "ترجمه‌ها"],
  ["Translations", "ترجمه‌ها"],
  ["translation", "ترجمه"],
  ["Translation", "ترجمه"],
  ["profile", "پروفایل"],
  ["Profile", "پروفایل"],
  ["users", "کاربران"],
  ["Users", "کاربران"],
  ["user", "کاربر"],
  ["User", "کاربر"],
  ["store", "فروشگاه"],
  ["Store", "فروشگاه"],
  ["settings", "تنظیمات"],
  ["Settings", "تنظیمات"],
  ["description", "توضیحات"],
  ["Description", "توضیحات"],
  ["optional", "اختیاری"],
  ["Optional", "اختیاری"],
  ["required", "الزامی"],
  ["Required", "الزامی"],
  ["enabled", "فعال"],
  ["Enabled", "فعال"],
  ["disabled", "غیرفعال"],
  ["Disabled", "غیرفعال"],
  ["active", "فعال"],
  ["Active", "فعال"],
  ["inactive", "غیرفعال"],
  ["Inactive", "غیرفعال"],
  ["status", "وضعیت"],
  ["Status", "وضعیت"],
  ["title", "عنوان"],
  ["Title", "عنوان"],
  ["name", "نام"],
  ["Name", "نام"],
  ["email", "ایمیل"],
  ["Email", "ایمیل"],
  ["password", "رمز عبور"],
  ["Password", "رمز عبور"],
  ["media", "رسانه"],
  ["Media", "رسانه"],
  ["images", "تصاویر"],
  ["Images", "تصاویر"],
  ["image", "تصویر"],
  ["Image", "تصویر"],
  ["values", "مقادیر"],
  ["Values", "مقادیر"],
  ["value", "مقدار"],
  ["Value", "مقدار"],
  ["options", "گزینه‌ها"],
  ["Options", "گزینه‌ها"],
  ["option", "گزینه"],
  ["Option", "گزینه"],
  ["actions", "اقدامات"],
  ["Actions", "اقدامات"],
  ["action", "اقدام"],
  ["Action", "اقدام"],
  ["cancel", "لغو"],
  ["Cancel", "لغو"],
  ["confirm", "تأیید"],
  ["Confirm", "تأیید"],
  ["continue", "ادامه"],
  ["Continue", "ادامه"],
  ["delete", "حذف"],
  ["Delete", "حذف"],
  ["edit", "ویرایش"],
  ["Edit", "ویرایش"],
  ["create", "ایجاد"],
  ["Create", "ایجاد"],
  ["update", "به‌روزرسانی"],
  ["Update", "به‌روزرسانی"],
  ["save", "ذخیره"],
  ["Save", "ذخیره"],
  ["close", "بستن"],
  ["Close", "بستن"],
  ["back", "بازگشت"],
  ["Back", "بازگشت"],
  ["search", "جستجو"],
  ["Search", "جستجو"],
  ["filter", "فیلتر"],
  ["Filter", "فیلتر"],
  ["filters", "فیلترها"],
  ["Filters", "فیلترها"],
  ["loading", "در حال بارگذاری"],
  ["Loading", "در حال بارگذاری"],
  ["empty", "خالی"],
  ["Empty", "خالی"],
  ["default", "پیش‌فرض"],
  ["Default", "پیش‌فرض"],
  ["personal", "شخصی"],
  ["Personal", "شخصی"],
  ["system", "سیستم"],
  ["System", "سیستم"],
  ["layout", "چیدمان"],
  ["Layout", "چیدمان"],
  ["page", "صفحه"],
  ["Page", "صفحه"],
  ["sidebar", "نوار کناری"],
  ["Sidebar", "نوار کناری"],
  ["header", "عنوان"],
  ["Header", "عنوان"],
  ["subtitle", "زیرعنوان"],
  ["Subtitle", "زیرعنوان"],
  ["hint", "راهنما"],
  ["Hint", "راهنما"],
  ["label", "برچسب"],
  ["Label", "برچسب"],
  ["labels", "برچسب‌ها"],
  ["Labels", "برچسب‌ها"],
  ["fields", "فیلدها"],
  ["Fields", "فیلدها"],
  ["field", "فیلد"],
  ["Field", "فیلد"],
  ["views", "نماها"],
  ["Views", "نماها"],
  ["view", "نما"],
  ["View", "نما"],
  ["domain", "دامنه"],
  ["Domain", "دامنه"],
  ["placeholder", "نگهدارنده متن"],
  ["Placeholder", "نگهدارنده متن"],
  ["success", "موفق"],
  ["Success", "موفق"],
  ["error", "خطا"],
  ["Error", "خطا"],
  ["warning", "هشدار"],
  ["Warning", "هشدار"],
  ["type", "نوع"],
  ["Type", "نوع"],
  ["code", "کد"],
  ["Code", "کد"],
  ["amount", "مبلغ"],
  ["Amount", "مبلغ"],
  ["price", "قیمت"],
  ["Price", "قیمت"],
  ["currency", "ارز"],
  ["Currency", "ارز"],
  ["region", "منطقه"],
  ["Region", "منطقه"],
  ["shipping", "ارسال"],
  ["Shipping", "ارسال"],
  ["payment", "پرداخت"],
  ["Payment", "پرداخت"],
  ["refund", "بازپرداخت"],
  ["Refund", "بازپرداخت"],
  ["tax", "مالیات"],
  ["Tax", "مالیات"],
  ["auth", "احراز هویت"],
  ["Auth", "احراز هویت"],
  ["authentication", "احراز هویت"],
  ["Authentication", "احراز هویت"],
  ["login", "ورود"],
  ["Login", "ورود"],
  ["verify", "تأیید"],
  ["Verify", "تأیید"],
  ["manage", "مدیریت"],
  ["Manage", "مدیریت"],
  ["add", "افزودن"],
  ["Add", "افزودن"],
  ["remove", "حذف"],
  ["Remove", "حذف"],
  ["select", "انتخاب"],
  ["Select", "انتخاب"],
  ["show", "نمایش"],
  ["Show", "نمایش"],
  ["hide", "مخفی"],
  ["Hide", "مخفی"],
  ["yes", "بله"],
  ["Yes", "بله"],
  ["no", "خیر"],
  ["No", "خیر"],
]

function translateString(s) {
  if (typeof s !== "string") return s
  if (phrases.has(s)) return phrases.get(s)

  let out = s
  for (const [en, fa] of tokenMap) {
    if (out.includes(en)) out = out.split(en).join(fa)
  }
  return out
}

function translateTree(node) {
  if (typeof node === "string") return translateString(node)
  if (Array.isArray(node)) return node.map(translateTree)
  if (node && typeof node === "object") {
    const out = {}
    for (const [k, v] of Object.entries(node)) out[k] = translateTree(v)
    return out
  }
  return node
}

function deepMerge(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) return b
  if (a && typeof a === "object" && b && typeof b === "object") {
    const out = { ...a }
    for (const [k, v] of Object.entries(b)) {
      out[k] = k in out ? deepMerge(out[k], v) : v
    }
    return out
  }
  return b
}

function countEnglishLeaves(node, acc = []) {
  if (typeof node === "string") {
    const letters = (node.match(/[A-Za-z]/g) || []).length
    const persian = (node.match(/[\u0600-\u06FF]/g) || []).length
    if (letters > 10 && persian === 0) acc.push(node)
    return acc
  }
  if (node && typeof node === "object") {
    for (const v of Object.values(node)) countEnglishLeaves(v, acc)
  }
  return acc
}

const translatedMissing = translateTree(enMissing)
const merged = deepMerge(existingFa, translatedMissing)

fs.writeFileSync(
  path.join(jsonDir, "fa.json"),
  JSON.stringify(merged, null, 2) + "\n"
)

const stillEn = countEnglishLeaves(translatedMissing)
console.log("top-level keys:", Object.keys(merged).length)
console.log("still English-looking leaves:", stillEn.length)
console.log(stillEn.slice(0, 40).join("\n"))
