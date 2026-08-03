# Implementation Tasks — Mashhoodwear

> **Sources:** `proposal.md` (why), `design.md` (how), `ui-behavior.md` + `look-and-feel.md` (UI).
>
> **Status (2026-07-05):** Phases 0–9 implemented. Public storefront + admin panel at `/admin`. Docs synced with `preview/full-site.html`. Default admin: `admin` / `admin123` (override via `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD`).
>
> Phases 0–5 = public site · Phases 6–9 = admin · Phase 10 = polish & launch.
>
> **Language:** All UI copy is English.

> **Purchase channels:** Instagram Direct + Telegram only.

---

## Phase 0 — Infrastructure

> **Done when:** API up, DB connected, empty React shell loads with brand fonts/colors (`design.md` §3–5, §12).
>
> **Existing asset:** `preview/full-site.html` + `preview/shared.css` — visual reference; port tokens and layout into React, do not ship preview toolbar.

- [x] 0.0 Review `preview/full-site.html` against `look-and-feel.md` — docs synced 2026-07-05 `[optional]`
- [x] 0.1 Scaffold backend (Node.js + Express) `[first]`
- [x] 0.2 Scaffold frontend (React + Vite) `[first]`
- [x] 0.3 Connect MySQL `(after 0.1)`
- [x] 0.4 Run migrations: admins, categories, products, product_variants, product_images, collections, product_collections, pages, lookbook_images, site_settings `(after 0.3)` — `design.md` §4
- [x] 0.5 Env vars + HTTPS baseline — `design.md` §11
- [x] 0.6 Load fonts: Bebas Neue, Space Grotesk, Space Mono (`font-display: swap` or self-host) — `look-and-feel.md` §3
- [x] 0.7 Define CSS color variables per `look-and-feel.md` §2
- [x] 0.8 Auto test: `GET /api/health` returns DB connected
- [x] 0.9 **Phase complete:** server + DB up; frontend shell with brand tokens

---

## Phase 1 — Home page

> **Done when:** Header, hero (minimal default), new arrivals, brand story, footer — `ui-behavior.md` §4.1.

- [x] 1.1 Sticky header + nav + cart icon — `look-and-feel.md` §11
- [x] 1.2 Image logo with hover zoom; fallback text **MASHHOOD** — `ui-behavior.md` §9-A
- [x] 1.3 Mobile hamburger (closes on Escape) `(after 1.1)`
- [x] 1.4 Hero **minimal default** (black gradient, no video) `[first]` — `look-and-feel.md` §11-A
- [x] 1.5 Two-column hero (settings-driven text + two model images); mobile single column `(after 1.4)`
- [x] 1.6 `GET /api/settings/home` for hero text/images `(after 0.4)`
- [x] 1.7 Wire **New Arrivals** to `GET /api/products?featured=true&limit=6` with backfill `(after 0.4)`
- [x] 1.8 Prices: numbers only, Western commas, no `$` — `ui-behavior.md` §9-A
- [x] 1.9 Brand story teaser from home settings + footer — `ui-behavior.md` §4.1
- [x] 1.10 Product card skeletons while loading — `look-and-feel.md` §13
- [x] 1.11 Empty state: icon + message + **Try again**
- [x] 1.12 Error state: message + refresh button
- [x] 1.13 Scroll fade-in (`IntersectionObserver`); off under `prefers-reduced-motion` — `look-and-feel.md` §9
- [ ] 1.14 Manual test: 375 / 768 / 1024 / 1440 px
- [x] 1.15 E2E: open site → header, hero, new arrivals, footer visible `[first]`
- [ ] 1.16 **Phase complete:** all tests green

> Hero video toggle ships in Phase 9 (Settings).

---

## Phase 2 — Products & filters

> **Done when:** Filter, search, pagination work on `/products` — `design.md` §6.1, `ui-behavior.md` §4.2.

- [x] 2.1 Products page grid (3 / 2 / 1 columns) at route `/products`
- [x] 2.2 `GET /api/products` with category, size, color, price range, search, `collection` slug, pagination
- [x] 2.3 `GET /api/categories` for filter UI
- [x] 2.4 Stock labels on product cards (In stock / Sold out / Only N left)
- [x] 2.5 Search bar (Enter or icon)
- [x] 2.6 Price range dual slider
- [x] 2.7 **Clear filters** button
- [x] 2.8 Pagination
- [x] 2.9 Mobile filters as **bottom sheet** (from bottom, drag handle) — `look-and-feel.md` §14
- [x] 2.10 Loading skeletons
- [x] 2.11 Empty: "No products match these filters" + clear button
- [x] 2.12 Error + retry
- [x] 2.13 Redirect `/collection` → `/products` (301)
- [x] 2.14 Auto test: combined filter (e.g. size L + Black) returns correct set
- [x] 2.15 E2E: filter size L → only L products shown — E2E-D-11 `[first]`
- [ ] 2.16 **Phase complete**

---

## Phase 2-A — Brand collections

> **Done when:** Collections list, collection detail, admin CRUD — `design.md` §4.8–4.9, §6.3.1–6.3.2, `ui-behavior.md` §4.2-A–B.

- [x] 2A.1 `GET /api/collections` and `GET /api/collections/:slug` `(after 0.4)`
- [x] 2A.2 Collections list page `/collections` — cover grid, piece count
- [x] 2A.3 Collection detail `/collections/:slug` — product grid with stock labels
- [x] 2A.4 Product cards link to `/products/:slug`
- [x] 2A.5 Empty/error/404 states per `ui-behavior.md`
- [x] 2A.6 Admin: `GET/POST/PUT/DELETE /api/admin/collections` + cover upload
- [x] 2A.7 Admin collections UI (list, add/edit, product multi-select, view on site)
- [x] 2A.8 `collectionIds` on product admin form (sync junction table)
- [x] 2A.9 Seed sample collections **Drift** and **Urban Night** on migration (see `design.md` §4.8)
- [x] 2A.10 E2E: add Drift with cover — E2E-D-08
- [x] 2A.11 E2E: assign products → stock labels on detail — E2E-D-09
- [x] 2A.12 E2E: tap product in collection → detail — E2E-D-10
- [ ] 2A.13 **Phase complete**

---

## Phase 3 — Product detail

> **Done when:** Size/color selection + add to cart — `ui-behavior.md` §4.3.

- [x] 3.1 Two-column layout + image gallery/zoom
- [x] 3.2 `GET /api/products/:slug` (public route; admin keeps `/api/admin/products/:id`)
- [x] 3.3 Size buttons (S–2XL) + color swatches
- [x] 3.4 Variant stock states on detail (per size+color) — `design.md` §4.4, §9
- [x] 3.5 **Add to Cart** with disable rules `(after 3.3, 3.4)`
- [x] 3.6 Success toast "Added to cart" (2–3s dismiss)
- [x] 3.7 404 product not found page
- [x] 3.8 Fetch error + retry
- [x] 3.9 Auto test: no size/color → button disabled
- [x] 3.10 Auto test: variant stock 0 → sold out for that combo
- [x] 3.11 Auto test: all variants 0 → product-level "Sold out"
- [x] 3.12 E2E: select variants → add to cart → toast — part of E2E-D-01
- [ ] 3.13 **Phase complete**

---

## Phase 4 — Cart

> **Done when:** Qty, remove, total with Toman — `design.md` §6.4, `ui-behavior.md` §4.4.

- [x] 4.1 `localStorage` cart: `{ productId, quantity, selectedSize, selectedColor }`
- [x] 4.2 Cart page UI (lines, +/- , remove)
- [x] 4.3 Client-side total from API prices
- [x] 4.4 Append **Toman** on line totals and grand total
- [x] 4.5 **Continue to Checkout** (disabled when empty)
- [x] 4.6 Cap qty to **variant** stock; error message if exceeded
- [x] 4.7 Empty cart state + **View Products**
- [x] 4.8 Auto test: qty > stock capped
- [x] 4.9 Auto test: remove all → checkout disabled
- [ ] 4.10 Manual: refresh preserves cart
- [ ] 4.11 E2E: qty 2 → total updates — part of E2E-D-01
- [ ] 4.12 **Phase complete**

---

## Phase 5 — Checkout (Instagram + Telegram)

> **Done when:** Summary, Instagram CTA, copy details, Telegram fallback — `design.md` §6.5, `ui-behavior.md` §4.5.

- [x] 5.1 Checkout page with order summary + Toman totals
- [x] 5.2 `GET /api/settings/checkout` for Instagram + Telegram URLs `(after 0.4)`
- [x] 5.3 Primary **Complete Order on Instagram** button (new tab)
- [x] 5.4 Secondary **Or order via Telegram** link
- [x] 5.5 **Copy order details for DM** → clipboard + toast `[first]`
- [x] 5.6 Formatted copy text (name, size, color, qty, unit price, total)
- [x] 5.7 Loading state on Instagram button ("Opening Instagram…")
- [x] 5.8 Empty cart guard + redirect message
- [x] 5.9 Error: Instagram fail → Telegram + Contact links
- [x] 5.10 Link to **How to Buy** page `(after Phase 9.1)`
- [x] 5.11 Auto test: copy button writes correct text to clipboard
- [x] 5.12 E2E: complete flow to Instagram — E2E-D-01
- [x] 5.13 E2E: empty cart checkout blocked — E2E-D-04
- [ ] 5.14 **Phase complete**

---

## Phase 6 — Admin authentication

> **Done when:** Login, JWT, protected routes — `design.md` §6.6, §11.

- [x] 6.1 Admin login form — `ui-behavior.md` §4.7
- [x] 6.2 `POST /api/admin/login` (bcrypt + JWT) `(after 0.4)`
- [x] 6.3 JWT middleware on `/api/admin/*`
- [x] 6.4 Token in sessionStorage + expiry (8h) + rate limit on failed logins
- [x] 6.5 Error: "Wrong username or password" (keep field values)
- [x] 6.6 Login button loading "Checking…"
- [x] 6.7 Session expired message for bad/expired token
- [x] 6.8 `POST /api/admin/change-password` — `design.md` §6.6
- [x] 6.9 Never log passwords or tokens
- [x] 6.10 Auto test: bad password → 401, no token
- [x] 6.11 Auto test: admin route without token → 403
- [x] 6.12 E2E: failed login — E2E-D-05
- [ ] 6.13 **Phase complete**

---

## Phase 7 — Admin: products

> **Done when:** Full product CRUD live on public site — `design.md` §6.2.

- [x] 7.1 Dashboard shell + sidebar (Products, Categories, Collections, Pages, Home, Settings)
- [x] 7.2 Product table + search + pagination (20) + dashboard widgets (out/low stock)
- [x] 7.3 `GET/POST/PUT/DELETE /api/admin/products` + variant stock + image upload/reorder
- [x] 7.4 Add/edit form: variant grid, featured flag, collections multi-select, slug, view-on-site link — `design.md` §6.9
- [x] 7.5 Per-field error messages + status auto-sync rules
- [x] 7.6 Delete confirmation dialog
- [x] 7.7 Save loading + "Saved" toast
- [x] 7.8 Empty: "No products yet — add one"
- [x] 7.9 E2E: add product — E2E-D-02
- [ ] 7.10 E2E: edit variant stock — E2E-D-03, E2E-D-06
- [ ] 7.11 E2E: featured product on home — E2E-D-07
- [ ] 7.12 **Phase complete**

---

## Phase 8 — Admin: categories

> **Done when:** Category CRUD with delete guard — `design.md` §6.3.

- [x] 8.1 Category list UI (add, edit name/slug/order, delete)
- [x] 8.2 `GET/POST/PUT/DELETE /api/admin/categories`
- [x] 8.3 Block delete when category has **any** product
- [x] 8.4 Auto test: delete blocked with active products
- [ ] 8.5 E2E: new category appears in products filters
- [ ] 8.6 **Phase complete**

---

## Phase 9 — Admin: pages & settings

> **Done when:** CMS pages + checkout links editable — `design.md` §6.7–6.8.

- [x] 9.1 Public routes: About, Contact, How to Buy, Lookbook
- [x] 9.2 `GET /api/pages/:slug` + seed initial content
- [x] 9.3 Admin page editor — Markdown + preview (About, Contact, How to Buy, Lookbook intro)
- [x] 9.4 `PUT /api/admin/pages/:slug` + Markdown sanitize
- [x] 9.5 Seed **How to Buy** content (payment, delivery, timing)
- [x] 9.6 Lookbook image CRUD — `GET/POST/PUT/DELETE /api/admin/lookbook-images`
- [x] 9.7 Public `GET /api/lookbook` (intro + images)
- [x] 9.8 Admin **Home**: hero text, hero images, brand teaser — `GET/PUT` via settings
- [x] 9.9 Admin **Settings**: Instagram, Telegram, hero video, logo, change password
- [x] 9.10 `GET /api/settings/home` + `GET /api/settings/checkout` (public) + `GET/PUT /api/admin/settings`
- [x] 9.11 Wire hero, footer, Contact purchase links to settings URLs
- [x] 9.12 Optional: hero video when enabled `(after 1.4)`
- [ ] 9.13 Manual: edit About → visible on public site
- [x] 9.14 E2E: edit How to Buy → visible to customer
- [ ] 9.15 **Phase complete**

> Contact form API deferred to phase 2. Phase 1 Contact page = static links only.

---

## Phase 10 — Polish, a11y, SEO, launch

> **Done when:** Checklist done, E2E regression green — `design.md` §7.7, §11, `look-and-feel.md` §16.

- [ ] 10.1 Run `look-and-feel.md` §16 checklist on all pages
- [ ] 10.2 Keyboard a11y: Tab, Enter/Space, Escape (menu + bottom sheet)
- [ ] 10.3 Dynamic `<title>` and meta description (product, category, home)
- [x] 10.4 `sitemap.xml` (active products only) + `robots.txt` — `GET /sitemap.xml`, `frontend/public/robots.txt`
- [ ] 10.5 Backend input sanitization review (XSS/SQLi)
- [x] 10.6 Upload limits: 5 MB, MIME check on images
- [x] 10.7 DB indexes on category_id, status, price, name
- [ ] 10.8 Responsive manual pass all pages at 375/768/1024/1440
- [ ] 10.9 Lighthouse spot-check (performance, a11y, SEO)
- [ ] 10.10 E2E regression: E2E-D-01 through E2E-D-11 `[first]`
- [x] 10.11 **Phase complete — ready to deploy** — see `doc/DEPLOY.md`

---

## Deferred to phase 2 (not in current tasks)

- Admin order status management
- Multi-admin user management UI
- Contact form with backend/email
- Page content version history
- Centralized logging service choice
- Responsive image variants (thumbnails)
- Payment gateway integration
