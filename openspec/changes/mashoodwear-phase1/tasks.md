## 1. Infrastructure (Phase 0)

> **Status:** Phase 0 scaffold complete. MySQL via `docker compose up -d` + `npm run migrate`.

- [ ] 1.0 Review `preview/full-site.html` against `doc/look-and-feel.md` `[optional]`
- [x] 1.1 Scaffold backend (Node.js + Express) `[first]`
- [x] 1.2 Scaffold frontend (React + Vite) `[first]`
- [x] 1.3 Connect MySQL `(after 1.1)`
- [x] 1.4 Run migrations: admins, categories, products, product_variants, product_images, collections, product_collections, pages, lookbook_images, site_settings `(after 1.3)`
- [x] 1.5 Env vars + HTTPS baseline
- [x] 1.6 Load fonts: Bebas Neue, Space Grotesk, Space Mono (`font-display: swap`)
- [x] 1.7 Define CSS color variables per `doc/look-and-feel.md`
- [x] 1.8 Auto test: `GET /api/health` returns DB connected
- [x] 1.9 **Phase complete:** server + DB up; frontend shell with brand tokens

## 2. Home page (Phase 1)

- [x] 2.1 Sticky header + nav + cart icon
- [x] 2.2 Image logo with hover zoom; fallback text **MASHHOOD**
- [x] 2.3 Mobile hamburger (closes on Escape) `(after 2.1)`
- [x] 2.4 Hero **minimal default** (black gradient, no video) `[first]`
- [x] 2.5 Two-column hero from `GET /api/settings/home`; mobile single column `(after 2.4)`
- [x] 2.6 Wire **New Arrivals** to `GET /api/products?featured=true&limit=6` `(after 1.4)`
- [x] 2.7 Prices: numbers only, Western commas, no `$`
- [x] 2.8 Brand story section + footer
- [x] 2.9 Product card skeletons while loading
- [x] 2.10 Empty state: icon + message + **Try again**
- [x] 2.11 Error state: message + refresh button
- [x] 2.12 Scroll fade-in (`IntersectionObserver`); off under `prefers-reduced-motion`
- [ ] 2.13 Manual test: 375 / 768 / 1024 / 1440 px
- [x] 2.14 E2E: open site → header, hero, new arrivals, footer visible `[first]`
- [ ] 2.15 **Phase complete:** all tests green

## 3. Products & filters (Phase 2)

- [x] 3.1 Products page grid at `/products` (3 / 2 / 1 columns)
- [x] 3.2 `GET /api/products` with category, size, color, price range, search, `collection`, pagination
- [x] 3.3 `GET /api/categories` for filter UI
- [x] 3.4 Stock labels on product cards
- [x] 3.5 Search bar (Enter or icon)
- [x] 3.6 Price range dual slider
- [x] 3.7 **Clear filters** button
- [x] 3.8 Pagination
- [x] 3.9 Mobile filters as **bottom sheet**
- [x] 3.10 Loading skeletons
- [x] 3.11 Empty: "No products match these filters" + clear button
- [x] 3.12 Error + retry
- [x] 3.13 Redirect `/collection` → `/products` (301)
- [x] 3.14 Auto test: combined filter (e.g. size L + Black) returns correct set
- [x] 3.15 E2E: filter size L → only L products shown — E2E-D-11 `[first]`
- [ ] 3.16 **Phase complete**

## 3-A. Brand collections (Phase 2-A)

- [ ] 3A.1 `GET /api/collections` and `GET /api/collections/:slug` `(after 1.4)`
- [ ] 3A.2 Collections list `/collections`
- [ ] 3A.3 Collection detail `/collections/:slug` with stock labels
- [ ] 3A.4 Admin collections CRUD + cover upload
- [ ] 3A.5 Admin collections UI + product multi-select
- [ ] 3A.6 `collectionIds` on product admin form
- [ ] 3A.7 Seed collections **Drift** + **Urban Night** (`doc/design.md` §4.8)
- [ ] 3A.8 E2E: E2E-D-08, E2E-D-09, E2E-D-10
- [ ] 3A.9 **Phase complete**

## 4. Product detail (Phase 3)

- [x] 4.1 Two-column layout + image gallery/zoom
- [x] 4.2 `GET /api/products/:slug` (public; admin keeps `:id`)
- [x] 4.3 Size buttons (S–2XL) + color swatches
- [x] 4.4 Stock states: `active` / `inactive` / `out_of_stock`
- [x] 4.5 **Add to Cart** with disable rules `(after 4.3, 4.4)`
- [x] 4.6 Success toast "Added to cart" (2–3s dismiss)
- [x] 4.7 404 product not found page
- [x] 4.8 Fetch error + retry
- [x] 4.9 Auto test: no size/color → button disabled
- [x] 4.10 Auto test: `out_of_stock` → "Sold out"
- [x] 4.11 E2E: select variants → add to cart → toast (part of E2E-D-01)
- [ ] 4.12 **Phase complete**

## 5. Cart (Phase 4)

- [ ] 5.1 `localStorage` cart: `{ productId, quantity, selectedSize, selectedColor }`
- [ ] 5.2 Cart page UI (lines, +/- , remove)
- [ ] 5.3 Client-side total from API prices
- [ ] 5.4 Append **Toman** on line totals and grand total
- [ ] 5.5 **Continue to Checkout** (disabled when empty)
- [ ] 5.6 Cap qty to stock; error message if exceeded
- [ ] 5.7 Empty cart state + **View Products**
- [ ] 5.8 Auto test: qty > stock capped
- [ ] 5.9 Auto test: remove all → checkout disabled
- [ ] 5.10 Manual: refresh preserves cart
- [ ] 5.11 E2E: qty 2 → total updates (part of E2E-D-01)
- [ ] 5.12 **Phase complete**

## 6. Checkout — Instagram + Telegram (Phase 5)

- [ ] 6.1 Checkout page with order summary + Toman totals
- [ ] 6.2 `GET /api/settings/checkout` for Instagram + Telegram URLs `(after 1.4)`
- [ ] 6.3 Primary **Complete Order on Instagram** button (new tab)
- [ ] 6.4 Secondary **Or order via Telegram** link
- [ ] 6.5 **Copy order details for DM** → clipboard + toast `[first]`
- [ ] 6.6 Formatted copy text (name, size, color, qty, unit price, total)
- [ ] 6.7 Loading state on Instagram button ("Opening Instagram…")
- [ ] 6.8 Empty cart guard + redirect message
- [ ] 6.9 Error: Instagram fail → Telegram + Contact links
- [ ] 6.10 Link to **How to Buy** page `(after section 9)`
- [ ] 6.11 Auto test: copy button writes correct text to clipboard
- [ ] 6.12 E2E: complete flow to Instagram — E2E-D-01
- [ ] 6.13 E2E: empty cart checkout blocked — E2E-D-04
- [ ] 6.14 **Phase complete**

## 7. Admin authentication (Phase 6)

- [ ] 7.1 Admin login form
- [ ] 7.2 `POST /api/admin/login` (bcrypt + JWT) `(after 1.4)`
- [ ] 7.3 JWT middleware on `/api/admin/*`
- [ ] 7.4 Token in sessionStorage + expiry (8h) + rate limit on failed logins
- [ ] 7.5 Error: "Wrong username or password" (keep field values)
- [ ] 7.6 Login button loading "Checking…"
- [ ] 7.7 Session expired message for bad/expired token
- [ ] 7.8 `POST /api/admin/change-password`
- [ ] 7.9 Never log passwords or tokens
- [ ] 7.10 Auto test: bad password → 401, no token
- [ ] 7.11 Auto test: admin route without token → 403
- [ ] 7.12 E2E: failed login — E2E-D-05
- [ ] 7.13 **Phase complete**

## 8. Admin products (Phase 7)

- [ ] 8.1 Dashboard shell + sidebar (Products, Categories, Collections, Pages, Home, Settings)
- [ ] 8.2 Product table + search + pagination + dashboard widgets
- [ ] 8.3 `GET/POST/PUT/DELETE /api/admin/products` + variant stock + images
- [ ] 8.4 Add/edit form: variant grid, featured, collections multi-select, slug, view-on-site — `doc/design.md` §6.9
- [ ] 8.5 Per-field error messages + status auto-sync
- [ ] 8.6 Delete confirmation dialog
- [ ] 8.7 Save loading + "Saved" toast
- [ ] 8.8 Empty: "No products yet — add one"
- [ ] 8.9 E2E: add product — E2E-D-02
- [ ] 8.10 E2E: edit variant stock — E2E-D-03, E2E-D-06
- [ ] 8.11 E2E: featured on home — E2E-D-07
- [ ] 8.12 **Phase complete**

## 9. Admin categories (Phase 8)

- [ ] 9.1 Category list UI (add, edit name/slug/order, delete)
- [ ] 9.2 `GET/POST/PUT/DELETE /api/admin/categories`
- [ ] 9.3 Block delete when category has any product
- [ ] 9.4 Auto test: delete blocked with active products
- [ ] 9.5 E2E: new category appears in products filters
- [ ] 9.6 **Phase complete**

## 10. Admin pages & settings (Phase 9)

- [ ] 10.1 Public routes: About, Contact, How to Buy, Lookbook
- [ ] 10.2 `GET /api/pages/:slug` + seed initial content
- [ ] 10.3 Admin page editor — Markdown + preview; Lookbook image CRUD
- [ ] 10.4 `PUT /api/admin/pages/:slug` + sanitize
- [ ] 10.5 Seed **How to Buy** content
- [ ] 10.6 Admin **Home** + **Settings** (checkout, hero video, logo, change password)
- [ ] 10.7 `GET /api/settings/home` + `GET /api/settings/checkout` + `GET/PUT /api/admin/settings`
- [ ] 10.8 Wire hero, footer, Contact links to settings URLs
- [ ] 10.9 Optional: hero video when enabled `(after 2.4)`
- [ ] 10.10 Manual: edit About → visible on public site
- [ ] 10.11 E2E: edit How to Buy → visible to customer
- [ ] 10.12 **Phase complete**

## 11. Polish, a11y, SEO, launch (Phase 10)

- [ ] 11.1 Run `doc/look-and-feel.md` §16 checklist on all pages
- [ ] 11.2 Keyboard a11y: Tab, Enter/Space, Escape (menu + bottom sheet)
- [ ] 11.3 Dynamic `<title>` and meta description (product, category, home)
- [ ] 11.4 `sitemap.xml` (active products only) + `robots.txt`
- [ ] 11.5 Backend input sanitization review (XSS/SQLi)
- [ ] 11.6 Upload limits: 5 MB, MIME check on images
- [ ] 11.7 DB indexes on category_id, status, price, name
- [ ] 11.8 Responsive manual pass all pages at 375/768/1024/1440
- [ ] 11.9 Lighthouse spot-check (performance, a11y, SEO)
- [ ] 11.10 E2E regression: E2E-D-01 through E2E-D-11 `[first]`
- [ ] 11.11 **Phase complete — ready to deploy**
