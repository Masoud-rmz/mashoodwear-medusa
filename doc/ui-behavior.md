# UI Behavior — Mashhoodwear Storefront

## 1. Introduction

This document describes what users see and do on each screen — including loading, empty, error, and success states. Written from the user's perspective with **no API or database details** (those live in `design.md`).

**Language:** All UI copy is **English** — labels, buttons, placeholders, toasts, errors, CMS page content, and SEO text.

**Purchase channels:** **Instagram Direct** (primary) and **Telegram** (secondary) only. No WhatsApp or other order paths in phase 1.

**Visual details:** colors, typography, spacing → `look-and-feel.md`.

**Preview reference:** `preview/full-site.html` implements most public flows with in-page sample data. Gaps vs production are listed in §12 (price slider, search logic, skeletons, API errors, per-variant stock, featured New Arrivals, etc.).

---

## 2. Roles

| Role | Description | Access |
|------|-------------|--------|
| **Customer** | Anyone visiting the site; no sign-up | Browse, search, filter, cart, checkout via Instagram |
| **Admin** | Mashhoodwear team | Products, categories, brand collections, pages, home content, site settings |

---

## 3. Page Map

| Page | One-line |
|------|----------|
| **Home** | Entry point: hero, new arrivals, brand story, footer |
| **Collections** | Brand drops — cover grid; intro copy *"Brand drops — tap a collection to see the pieces."* |
| **Collection detail** | Products in one brand collection with stock labels |
| **Products** | All products with filters and search |
| **Product detail** | Full product view, size/color, stock, add to cart |
| **Cart** | Selected items, qty controls, total, continue to checkout |
| **Checkout** | Order summary, Instagram CTA, copy details, Telegram fallback |
| **Lookbook** | Editorial styling content (CMS page) |
| **About** | Full brand story: tagline, values, approach, homies tribute (CMS) |
| **Contact** | Contact info and social links (CMS; no form in phase 1) |
| **How to Buy** | Payment & delivery FAQ after DM checkout (CMS) |
| **Admin** | Login, dashboard, products, categories, collections, pages, home, settings |

**Header nav:** Home · Collections · Products · Lookbook · About · Contact · cart icon. **How to Buy** appears in mobile hamburger and footer only — not desktop header. **Order on Instagram** appears in the **hero** and **checkout** only — not in the header.

---

## 4. Pages (full stories)

### 4.1 Home

**Who arrives:** Anyone opening the site URL.

**First impression:**
- Sticky header with **image logo** (PNG/SVG from brand team — hover zoom in/out on the image), nav links, and cart icon. No **Order on Instagram** in the header.
- **Hero** (two-column on desktop) — text and images from admin **Home** settings (defaults below if unset):
  - **Left:** optional eyebrow (default **Independent streetwear**; hidden when empty), headline (default "FROM THE STREETS, FOR THE FEW" with accent **STREETS** / **FEW** in maroon), subtitle (default "Designed by hand. Inspired by the streets. Every piece tells a story — yours to wear."), CTAs **View Products** / **Order on Instagram**.
  - **Right:** two model images side by side (uploaded in admin Home, or placeholder until set).
  - **Default = no video.** Pure black base with subtle faded maroon glow. Optional looped muted video when enabled in admin Settings.
- Scroll reveals (fade + slight upward motion) for sections below hero. Disabled entirely when `prefers-reduced-motion: reduce`.

**User actions:**
1. Logo or Home → scroll to top / home.
2. Nav to other pages.
3. **Order on Instagram** → Instagram Direct (no cart required).
4. **View Products** → products page (`/products`).
5. **New Arrivals** — up to 6 **featured** products (admin checkbox on product); backfill with newest active products if fewer than 4 featured. Image, name, price (number only, no `$`). **No stock label** on home cards (stock labels only on Products grid and Collection detail).
6. **Brand story** — teaser text from admin Home (default "BUILT DIFFERENT.") + **Read more** → About.
7. Footer: three columns — brand tagline, **Shop** (Collections, Products, Lookbook, How to Buy), **Info** (About, Contact). Bottom: copyright + **Instagram** and **Telegram** from Settings (same URLs as checkout). Email optional via Contact CMS (not required in footer).

**Loading:** skeleton cards for products. If hero video loading, show poster/static image.

**Empty:** "Nothing to show right now — check back soon" + **Try again**.

**Error:** "Couldn't load data — refresh the page" + refresh button.

---

### 4.2 Products

**Who arrives:** User tapped Products in nav, **View Products** on home, or **View all** on New Arrivals.

**First impression:**
- Sticky header.
- Title: **Products**.
- Search bar at top.
- **Desktop:** filter sidebar (left). **Mobile:** floating **Filters** button → **bottom sheet** (slides up from bottom, not top).
- Filters: category (T-Shirts, Hoodies, Pants, Crop, Stickers), size (S–2XL), color (Black, White, Gray, Cream, Brown, Blue, Pastel Green, Tiffany Green), price range (dual slider) **(build only — not in static preview yet)**.
- Meta line above grid: **Showing N products** (updates when filters change; singular **Showing 1 product** when one match).
- Product grid: 3 cols desktop / 2 tablet / 1 mobile. Each card shows image, name, price, and **stock label** (In stock / Sold out / Only N left when total stock 1–3).
- Pagination at bottom.

**User actions:**
1. Type in search → Enter or search icon.
2. Apply filters.
3. Adjust price slider.
4. Tap product card → product detail page (`/products/:slug`).
5. **Clear filters** resets all.
6. **Mobile:** open/close bottom sheet (swipe down or **Apply filters**).

**Loading:** skeleton cards.

**Empty (no matches):** "No products match these filters — try changing them" + **Clear filters**.

**Error:** same pattern as home.

---

### 4.2-A Collections (brand drops)

**Who arrives:** User tapped **Collections** in nav or footer.

**First impression:**
- Sticky header.
- Title: **Collections**.
- Subtitle (below title): **Brand drops — tap a collection to see the pieces.**
- Grid of collection cards: cover image, name, subtitle **N pieces** (product count).
- 3 cols desktop / 2 tablet / 1 mobile.

**User actions:**
1. Tap a collection card → collection detail page (`/collections/:slug`).

**Loading:** skeleton cards.

**Empty:** "No collections yet — check back soon".

**Error:** same pattern as home.

---

### 4.2-B Collection detail

**Who arrives:** User tapped a collection card (e.g. Drift).

**First impression:**
- Sticky header.
- Collection name as page title; optional short description below (from admin).
- Product grid (same layout as Products): image, name, price, **stock label**.
- Only products assigned to this collection.

**User actions:**
1. Tap product card → product detail (`/products/:slug`).
2. Back link → **Collections** list.

**Loading:** skeleton cards.

**Empty:** "No pieces in this collection yet" + link to **Products**.

**Not found:** 404 — "Collection not found" + **Back to Collections**.

**Error:** same pattern as home.

---

### 4.3 Product detail

**Who arrives:** User tapped a product card.

**First impression:**
- Two-column desktop: large image/gallery left; info right — name, price, size buttons (S–2XL), color swatches, stock for **selected** size+color (In stock / Sold out / "Only N left" when stock 1–3), **Add to Cart**, description, care/material notes.

**User actions:**
1. Pick size and color (required if product has variants).
2. Stock label updates when size/color changes.
3. **Add to Cart:**
   - Missing size/color → disabled button or "Pick a size and color first".
   - Selected variant in stock → item added, toast "Added to cart".
   - Selected variant stock 0 → disabled, label "Sold out" or "This size and color is sold out".
   - All variants out → product-level "Sold out".
3. Header cart icon → cart page.
4. Back → products (or collection detail if user arrived from a brand collection).

**Loading:** skeleton layout.

**Not found:** 404 — "Product not found — it may have been removed" + **Back to Products**.

**Error:** "Couldn't load this product" + retry.

---

### 4.4 Cart

**Who arrives:** User tapped cart icon.

**First impression:**
- Title "Cart".
- Lines: thumbnail, name, size/color, qty (+/−), unit price, line total, remove.
- Grand total with **Toman** label (e.g. `1,250,000 Toman`).
- **Continue to Checkout** (disabled if empty).

**User actions:**
1. Change qty (min 1, max **selected variant** stock).
2. Remove item (optional confirm).
3. Continue to checkout.

**Empty:** "Your cart is empty — go find something" + **View Products** + minimal brand icon.

**Error (qty > stock):** "Requested quantity exceeds available stock" — qty capped to stock.

---

### 4.5 Checkout

**Who arrives:** User tapped Continue to Checkout from cart.

**First impression:**
- Title "Complete Order".
- Order summary: items, sizes/colors, qty, prices, total with **Toman**.
- Info box: "Finalize your order through Instagram Direct. Payment and delivery details are on the **How to Buy** page." (inline link to `/how-to-buy`).
- **Primary:** large **Complete Order on Instagram** (brand CTA style + Instagram icon).
- **Secondary:** **Copy order details for DM** — copies formatted text (names, size, color, qty, unit price, total).
- **Tertiary:** smaller **Or order via Telegram** link below primary.

**User actions:**
1. Tap Instagram CTA → new tab to Instagram Direct (URL from settings API).
2. Tap copy → clipboard filled → toast "Order details copied — paste in DM".
3. Tap Telegram → `t.me/{username}`.
4. **Back to cart**.

**Loading:** primary button shows "Opening Instagram…" and disables to prevent double-click.

**Empty cart (direct URL):** "Your cart is empty" + link home.

**Error (link fails):** "Couldn't open Instagram — try Telegram or Contact us" + Telegram link + Contact link.

---

### 4.6 Content pages

#### About

**Who arrives:** User tapped **About** in nav, footer, or **Read more** on home brand-story section.

**First impression:**
- Sticky header.
- Page title: **About Mashood** (CMS `title`; nav label stays **About**).
- Tagline directly under title: **NOT MADE TO FOLLOW. MADE TO LEAD.** — Bebas Neue, accent maroon, `text-transform: uppercase` (CMS may store sentence case; CSS uppercases for display — see `look-and-feel.md` §11-B).
- Body sections separated by horizontal dividers (`---` in Markdown → styled rule).
- Four content blocks: **intro** → **Our Values** (3 items) → **Our Approach** → **For My Homies in the Hood** → closing line **Welcome to MASHOOD**.

**Default CMS content** (seed on first deploy; admin editable in **Pages → About**):

```markdown
NOT MADE TO FOLLOW. MADE TO LEAD.

MASHOOD was born for those who refuse to stay in line.

Rooted in hip-hop culture, street culture, graffiti, music, and the raw energy of the streets, we create clothing that represents individuality, confidence, and self-expression.

We don't chase trends.
We create pieces that carry meaning.

Every graphic, every fabric, and every detail is designed to remind you that your story deserves to be worn.

---

## OUR VALUES

### STREET CULTURE

Streetwear is more than clothing—it's a language. Every piece we create reflects the creativity, resilience, and attitude born from the streets.

### HIP-HOP CULTURE

Hip-hop has always been about authenticity, expression, and turning struggle into art. That mindset shapes everything we design—from our graphics to the stories behind every collection.

### BROTHERHOOD

Built for the people who stand beside you.
For the nights you'll never forget.
For the ones who were there before anyone else.

---

## OUR APPROACH

Quality over quantity.

Every MASHOOD drop is produced in limited numbers because clothing should feel personal—not disposable.

Every collection tells a different story, inspired by the culture that raised us and the people who continue to shape who we are.

---

## FOR MY HOMIES IN THE HOOD

More than a slogan.

It's a tribute to where we started, the people who shaped us, and the ones who stay beside us no matter how far the road goes.

Because no matter where life takes you, you never forget your homies.

**Welcome to MASHOOD**
```

**User actions:**
1. Read scroll-only content (no forms or CTAs on this page).
2. **Our Values** cards show a continuous **fire / burn** animation (flames, embers, maroon glow) — **always on**, no hover or touch required. Optional slight lift on hover only (see `look-and-feel.md` §11-B).
3. Nav to Collections, Products, Lookbook, Contact, or home via header/footer.

**Loading:** skeleton for title + 3–4 text lines.

**Empty CMS body:** show title + "Content coming soon — check back later."

**Error:** "Couldn't load this page" + retry.

**Home link:** brand-story teaser on home (default `BUILT DIFFERENT.`) + **Read more** → About. Teaser is separate from full About copy (admin **Home** settings).

#### How to Buy

- Sticky header, page title, CMS body (Markdown rendered to HTML).

**Default seed content** (admin editable in **Pages → How to Buy**):

1. Add items to cart and go to checkout.
2. Tap Complete Order on Instagram or copy order details into DM.
3. Payment: bank transfer after order confirmation.
4. Delivery: 3–7 business days within Iran.

#### Lookbook

- Optional intro Markdown from CMS + **image grid** from admin Lookbook uploads (reorder, caption, delete).
- Empty grid: intro text only or empty-state message.

#### Contact (phase 1)

- CMS body: short intro + contact handles (email optional in Markdown).
- **Purchase links block** below body — auto-rendered from Settings (Instagram Direct + Telegram); admin does not paste these URLs in the textarea.

**Default seed body** (preview uses equivalent copy):

- Questions? Reach us on Instagram Direct or Telegram.
- **Instagram:** @mashood.wear
- **Telegram:** @lilhosseini

- **No contact form** in phase 1 (phase 2).

---

### 4.7 Admin panel

**Language:** English. **Responsive:** usable at 375px+ — sidebar collapses to hamburger on mobile; tables scroll horizontally.

#### Login (`/admin`)

- Username + password, **Log in** button.
- Wrong credentials → "Wrong username or password" (fields kept).
- Loading → button "Checking…" disabled.
- Session persists on page refresh (same browser tab) until logout or token expiry.

#### Dashboard

- Header: logo + **Log out**.
- Sidebar: **Products**, **Categories**, **Collections**, **Pages**, **Home**, **Settings**.
- Stats: total products, total categories, **active collections** count, **out of stock** count (link to filtered list), **low stock** count (any variant stock 1–3).
- **Recent updates:** last 5 edited products with quick edit link.
- Order count placeholder for phase 2.

#### Products

- Table: image, name, price, total stock, status, featured flag, edit/delete. Pagination (20 per page). Search by name.
- **Add New Product** / edit form:
  - Fields per `design.md` §6.9.
  - **Variant stock grid:** rows for each size×color combination.
  - **Featured** checkbox + optional display order.
  - **Collections** multi-select (assign product to one or more brand collections).
  - **Slug** auto-filled from name; editable.
  - Images: upload, reorder (drag), delete individual; 1–5 total.
  - **View on site** link opens public product page in new tab (when active/out_of_stock).
- Delete → confirm "Sure? This can't be undone." / Cancel.
- Save loading → "Saving…"; success → "Saved."

#### Categories

- List with add, edit name/slug/display order, delete.
- Delete blocked if **any** product uses category → error from API.

#### Collections (brand drops)

- Table: cover thumbnail, name, product count, active status, display order, edit/delete.
- **Add New Collection** / edit form:
  - Name, slug (auto from name), optional description (Markdown), display order, active toggle.
  - Cover image upload (required on create; replace on edit).
  - **Product picker:** multi-select/search to assign products to this collection.
  - **View on site** link → `/collections/:slug` (when active).
- Delete → confirm; removes collection and assignments only — products stay.
- Save loading → "Saving…"; success → "Saved."

#### Pages

- Tabs: About, Contact, How to Buy, Lookbook (intro text only).
- **Markdown** editor with preview toggle; Save / Cancel.
- Lookbook **images** managed on separate Lookbook tab: upload, reorder, caption, delete (max 12).

#### Home

- Hero eyebrow (optional), headline, subtitle.
- Hero image 1 and 2 upload (jpg/png/webp).
- Brand story teaser text.
- Save / Cancel; changes live on public home without redeploy.

#### Settings

- Instagram Direct URL, Telegram username (source of truth for all purchase links site-wide).
- Hero video enable/disable + video URL (optional).
- Logo upload.
- **Change password:** current password, new password, confirm — on success redirect to login.

---

## 5. Main flows

### Flow 1: Browse and buy

1. Home → Collections → Drift → product detail.
2. Or Home → Products → filter size L → open t-shirt.
3. Select L + Black → Add to Cart.
4. Open cart → qty 2 → Continue to Checkout.
5. Copy order details (optional) → Complete Order on Instagram.

**Error branches:** sold out, missing variant, Instagram fail → Telegram/Contact.

**E2E:** E2E-D-01

### Flow 2: Admin adds product

1. Login → Products → Add New Product.
2. Fill form + upload image → Save.
3. Visible in admin and public catalog.

**E2E:** E2E-D-02

### Flow 3: Admin edits/deletes product

1. Edit price/stock → Save → live on site.
2. Delete → confirm → removed from site.

**E2E:** E2E-D-03

---

## 6. Shared states

| State | Behavior |
|-------|----------|
| **Loading** | Skeletons or spinner; primary buttons disabled |
| **Empty** | Minimal outline icon (brand style) + message + action button |
| **Error** | Plain English + suggested next step |
| **Success toast** | Short confirm; auto-dismiss 2–3s (slide in top-right) or dismiss tap |
| **Disabled** | `opacity: 0.35`; tooltip explains why e.g. "Pick a size first" |

---

## 7. Copy & tone

Bold, street, direct — not corporate. All English.

| Situation | Example copy |
|-----------|--------------|
| Added to cart | "Added to cart" |
| Empty cart | "Your cart is empty — go find something" |
| Sold out | "This one's gone — check back later" |
| Server error | "That's on us — try again in a minute" |
| Bad admin login | "Wrong username or password" |
| Variant sold out | "This size and color is sold out" |
| Delete confirm | "Sure? This can't be undone" |
| Save success | "Saved" |
| Incomplete form | "Fill in the required fields" |
| Copy order | "Order details copied — paste in DM" |

---

## 8. UX risks

| Topic | Bad UX | Mitigation |
|-------|--------|------------|
| Silent loading | User thinks site froze | Skeletons / status text on every wait |
| Accidental delete | Data loss | Confirm dialog |
| Technical errors | User stuck | Plain message + next action |
| Lost cart (localStorage) | Frustration | Accepted phase 1; copy-details helps |
| Broken DM link | Lost sale | Telegram fallback + editable admin links |
| Long admin form | Data loss on error | Keep form short; preserve values on error |

---

## 9. Accessibility

- **Keyboard:** Tab focus; Enter/Space activate; Escape closes hamburger menu and bottom sheet.
- **Labels:** visible form labels; icon buttons have `aria-label`.
- **Contrast:** per `look-and-feel.md` — white on `#000000` (~21:1 AAA).
- **Errors:** icon + text, not color alone.
- **Reduced motion:** all scroll/video/hover animations off when `prefers-reduced-motion: reduce`.

---

## 9-A. Logo, pricing, hero media

- **Logo:** image file site-wide; click → home; hover subtle zoom. Fallback if image fails: text **MASHHOOD** in Bebas Neue, white — same hover.
- **Prices:** no `$` or currency symbols on cards/detail. Western commas: `1,250,000`. **Cart & checkout:** append **Toman** (e.g. `1,250,000 Toman`).
- **Hero video:** optional via admin; default minimal gradient. `prefers-reduced-motion` → static poster only.

---

## 10. Responsive

| Breakpoint | Changes |
|------------|---------|
| **Mobile ≤768px** | Hamburger nav, 1-col grid, bottom-sheet filters, full-width buttons, single-column hero |
| **Tablet 769–1024px** | Compact horizontal nav, 2-col grid |
| **Desktop ≥1025px** | Full nav, 3-col grid, sidebar filters |
| **Admin mobile ≤768px** | Collapsible sidebar; product form stacks; variant grid scrollable |

Test at: 375 / 768 / 1024 / 1440 px (public + admin).

---

## 11. E2E coverage

| Flow | ID |
|------|-----|
| Full purchase → Instagram | E2E-D-01 |
| Admin add product | E2E-D-02 |
| Admin edit product | E2E-D-03 |
| Empty cart checkout | E2E-D-04 |
| Admin login failure | E2E-D-05 |
| Variant stock zero | E2E-D-06 |
| Featured on home | E2E-D-07 |
| Admin adds brand collection | E2E-D-08 |
| Products in collection with stock | E2E-D-09 |
| Product link from collection | E2E-D-10 |
| Products page filters after rename | E2E-D-11 |

---

## 12. Preview vs production (`preview/full-site.html`)

Static SPA in `preview/full-site.html` + `preview/shared.css`. Dev-only **Preview** toolbar at top switches pages — **not shipped in production**.

| Feature | Preview | Production build |
|---------|---------|------------------|
| Public pages (11) | ✅ Home, Collections, Collection detail, Products, Product, Cart, Checkout, About, Contact, Lookbook, How to Buy | Same React routes |
| Header nav | Home · Collections · Products · Lookbook · About · Contact + cart | Same; **How to Buy** mobile menu + footer only |
| Hero / brand story defaults | ✅ Hardcoded copy + 2 image placeholders | `GET /api/settings/home` |
| New Arrivals | First 6 sample products, **no stock labels** | Up to 6 **featured** + backfill; no stock labels on home |
| Filters category/size/color | ✅ Client-side on sample `PRODUCTS` | API query params |
| Filter meta **Showing N products** | ✅ | Same copy |
| Price range slider | ❌ | Required |
| Search bar | UI only — **no filter logic** | API `search` param |
| Pagination | Static buttons (non-functional) | API-driven |
| Per-variant stock on detail | ❌ product-level badge only | Updates on size+color change |
| Product detail swatches | All 8 colors shown (static) | Only colors on product variants |
| Dynamic back link from collection | ✅ `← Back to Drift` etc. | Same |
| Cart / checkout / copy DM | ✅ `localStorage` key `mw-preview-cart` | Key `mashood_cart` |
| Copy order clipboard format | `Mashoodwear Order\n{name} \| {size} \| {color} \| qty {n} \| {price}\nTotal: {n} Toman` | Same |
| Checkout empty cart | "Your cart is empty." + **Go home** button | Same |
| About fire animation on value cards | ✅ Always-on flames/embers | Same |
| Lookbook | 3 placeholder slots in grid | Admin-uploaded images |
| Loading / error skeletons | ❌ | Required |
| Scroll section fade-in | ❌ | Required (`IntersectionObserver`) |
| Logo-bg watermark + scroll parallax | ✅ 4 marks; 2 hidden on mobile | Optional (see `look-and-feel.md` §11-A) |
| Admin panel | ❌ | Required |
| Instagram / Telegram URLs | Hardcoded in HTML | `site_settings` API |

**Sample data** (in-page `PRODUCTS`, `BRAND_COLLECTIONS`): see `design.md` §0.1.

---

> UI behavior only. Visual tokens → `look-and-feel.md`. Technical spec → `design.md`. Tasks → `tasks.md`. Project status → `design.md` §0.
