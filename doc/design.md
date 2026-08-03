# Technical Design — Mashhoodwear E-commerce

> **Source:** `proposal.md` (what & why) · **Companion docs:** `ui-behavior.md` (user flows), `look-and-feel.md` (visual system), `tasks.md` (implementation phases).
>
> **Language:** The public site and admin panel UI are **English only** (copy, labels, error messages, SEO text).

> **Purchase channels:** **Instagram Direct** and **Telegram** only. No WhatsApp, SMS, or other checkout integrations in phase 1.

---

## 0. Project status

| Layer | State | Notes |
|-------|-------|-------|
| **Docs** (`doc/`) | Ready | Synced with `preview/full-site.html` (2026-07-05) |
| **UI preview** | Done | `preview/full-site.html` — static SPA shell; `preview/client/` — per-page exports via `build-client-preview.py` |
| **Production code** | Phases 0–9 done | Public storefront + admin at `/admin`; see `tasks.md` |
| **Admin UI** | Built | Not in HTML preview; spec in `ui-behavior.md` §4.7 |

**Preview reference:** `preview/full-site.html` is the visual/interaction reference for the public storefront. It uses sample data (`PRODUCTS`, `BRAND_COLLECTIONS` in-page) and `localStorage` key `mw-preview-cart`. Production uses API data and key `mashood_cart`.

**Preview toolbar (dev only):** Sticky bar at top with page tabs — offsets header to `top: 40px` and hero to `min-height: calc(100vh - 104px)`. Remove in production; React app has no toolbar.

**Preview implements:** all 11 public pages, header/footer nav, hero defaults, New Arrivals (first 6 products), brand story teaser, filters (category/size/color — client-side), filter meta line, cart, checkout, copy-to-clipboard, About fire animation, mobile bottom sheet, logo-bg parallax, collection detail with dynamic back link.

**Preview does not implement (build in React / already in prod):** price-range filter, search logic, working pagination, loading skeletons, fetch error states, per-variant stock on product detail, product-specific color swatches, featured-product logic on home, admin panel, hero video, image logo from settings.

**Public product URLs:** frontend route `/products/:slug`. Public API `GET /api/products/:slug` (admin CRUD keeps numeric `:id`).

### 0.1 Preview sample data (`full-site.html`)

Nine in-page products (`PRODUCTS` array) and two brand collections (`BRAND_COLLECTIONS`):

| # | Name | Category | Price (Toman) | Stock | Colors (sample) |
|---|------|----------|---------------|-------|-----------------|
| 1 | Street Hoodie Black | hoodies | 2,450,000 | 8 | Black, Gray |
| 2 | Oversized Tee White | t-shirts | 890,000 | 2 | White |
| 3 | Cargo Pants Brown | pants | 1,750,000 | 5 | Brown, Black |
| 4 | Crop Hoodie Cream | crop | 1,120,000 | 0 | Cream, White |
| 5 | Graphic Tee Blue | t-shirts | 980,000 | 12 | Blue, Black |
| 6 | Wide Leg Pants Gray | pants | 1,620,000 | 3 | Gray, Black |
| 7 | Pastel Crop Top | crop | 760,000 | 6 | Pastel Green, White |
| 8 | Logo Sticker Pack | stickers | 120,000 | 15 | White, Black |
| 9 | Tiffany Script Hoodie | hoodies | 2,680,000 | 1 | Tiffany Green, Black |

| Collection | Slug | Products (by #) | Description |
|------------|------|-----------------|-------------|
| Drift | `drift` | 1, 2, 5 | Late-night streets, muted tones, pieces built to move. |
| Urban Night | `urban-night` | 3, 6, 9 | City lights, heavy fabrics, limited run. |

**Default social URLs in preview HTML** (production reads `site_settings`):

- Instagram: `https://www.instagram.com/mashood.wear`
- Telegram: `https://t.me/lilhosseini`

**Stock label logic** (preview JS + production API): `Sold out` (0) · `Only N left` (1–3) · `In stock` (4+).

---

## 1. Overview

Mashhoodwear is a single-brand streetwear storefront. Customers browse products, filter by category/size/color/price, add items to a cart, and complete orders via **Instagram Direct** (primary) or **Telegram** (secondary). There is no online payment or customer accounts in phase 1.

**Phase 1 delivers:** product catalog, brand collections (e.g. Drift), cart, checkout redirect, admin panel (products with per-variant stock, categories, brand collections, CMS pages, home content, site settings).

**Phase 2 (planned, not phase 1):** order tracking, admin order status, contact form backend, payment gateway placeholder.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  Public React SPA   │    │  Admin React SPA (/admin)   │ │
│  │  cart → localStorage│    │  JWT in sessionStorage      │ │
│  └──────────┬──────────┘    └──────────────┬──────────────┘ │
└─────────────┼──────────────────────────────┼────────────────┘
              │         HTTPS / JSON           │
┌─────────────▼──────────────────────────────▼────────────────┐
│                   Node.js + Express API                      │
│  /api/products  /api/categories  /api/collections  /api/pages  /api/settings  │
│  /api/admin/*   (JWT protected)                              │
└─────────────┬──────────────────────────────┬────────────────┘
              │                              │
     ┌────────▼────────┐            ┌────────▼────────┐
     │     MySQL       │            │  File storage   │
     │  products, etc. │            │  /uploads/*     │
     └─────────────────┘            └─────────────────┘
```

**Key decisions:**

| Topic | Choice | Why |
|-------|--------|-----|
| Customer auth | None in phase 1 | Checkout happens on Instagram/Telegram |
| Cart storage | `localStorage` on client | Simpler; no server session |
| Admin auth | JWT (bcrypt passwords) | Small admin team; no OAuth complexity |
| Image storage | Server filesystem | Low cost; CDN migration later |
| Rendering | React SPA + REST API | Dynamic catalog; admin-managed content |

---

## 3. Project Structure

```
mashoodwear/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app entry
│   │   ├── config.js             # env vars (DB, JWT, upload paths)
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT verification
│   │   │   └── upload.js         # multer image upload
│   │   ├── routes/
│   │   │   ├── products.js
│   │   │   ├── categories.js
│   │   │   ├── collections.js
│   │   │   ├── pages.js
│   │   │   ├── settings.js
│   │   │   └── admin/
│   │   │       ├── auth.js
│   │   │       ├── products.js
│   │   │       ├── categories.js
│   │   │       ├── collections.js
│   │   │       ├── pages.js
│   │   │       ├── lookbook-images.js
│   │   │       └── settings.js
│   │   ├── services/             # business logic
│   │   └── db/
│   │       ├── pool.js
│   │       └── migrations/
│   ├── uploads/                  # product images (not in git)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                # Home, Collections, CollectionDetail, Products, Product, Cart, Checkout, Lookbook, About, Contact
│   │   ├── admin/                # Dashboard, Products, Categories, Collections, Pages, Home, Settings
│   │   ├── components/
│   │   ├── hooks/                # useCart (localStorage)
│   │   ├── api/                  # fetch wrappers
│   │   └── styles/               # CSS variables from look-and-feel.md
│   └── package.json
├── doc/                          # this documentation
└── tests/
    ├── backend/
    └── e2e/
```

**Environment variables (backend):**

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API port | `3001` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_NAME` | Database name | `mashoodwear` |
| `DB_USER` / `DB_PASS` | Credentials | — |
| `JWT_SECRET` | Signing key | random 32+ chars |
| `JWT_EXPIRES_IN` | Token TTL | `8h` |
| `UPLOAD_DIR` | Image directory | `./uploads` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:5173` |

---

## 4. Database Schema

### 4.1 `admins`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO | |
| `username` | VARCHAR(50) UNIQUE | |
| `password_hash` | VARCHAR(255) | bcrypt |
| `created_at` | TIMESTAMP | |

### 4.2 `categories`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO | |
| `name` | VARCHAR(100) | e.g. T-Shirts, Hoodies |
| `slug` | VARCHAR(100) UNIQUE | URL-safe |
| `display_order` | INT DEFAULT 0 | Menu/filter sort |
| `created_at` | TIMESTAMP | |

**Seed categories (phase 1):** T-Shirts, Hoodies, Pants, Crop, Stickers.

**Seed product colors (phase 1):** Black, White, Gray, Cream, Brown, Blue, Pastel Green, Tiffany Green — stored in product `colors` JSON and used in product filters and variant pickers.

### 4.3 `products`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO | |
| `name` | VARCHAR(100) | |
| `slug` | VARCHAR(120) UNIQUE | |
| `description` | TEXT NULL | max 1000 chars |
| `price` | DECIMAL(12,2) | > 0, stored in Toman |
| `category_id` | INT FK → categories | |
| `sizes` | JSON | e.g. `["S","M","L","XL","2XL"]` |
| `colors` | JSON | e.g. `["Black","Gray"]` |
| `status` | ENUM | `active`, `inactive`, `out_of_stock` |
| `is_featured` | BOOLEAN DEFAULT false | Show in New Arrivals when true |
| `featured_order` | INT NULL | Sort among featured (lower first); NULL sorts last |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Indexes:** `category_id`, `status`, `price`, `name`, `is_featured`, `featured_order` (for search/filter/home).

**Derived stock:** No `stock` column on `products`. Total stock = sum of `product_variants.stock` for display in admin list.

### 4.4 `product_variants`

Per size/color inventory — source of truth for add-to-cart and qty caps.

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO | |
| `product_id` | INT FK → products | CASCADE delete |
| `size` | VARCHAR(10) | Must be in product `sizes` JSON |
| `color` | VARCHAR(30) | Must be in product `colors` JSON |
| `stock` | INT DEFAULT 0 | >= 0 |

**Unique:** `(product_id, size, color)`.

On product save, admin MUST provide one row per `size × color` combination (stock may be 0).

### 4.5 `product_images`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO | |
| `product_id` | INT FK → products | CASCADE delete |
| `file_path` | VARCHAR(500) | relative to uploads |
| `display_order` | INT DEFAULT 0 | Gallery order |
| `created_at` | TIMESTAMP | |

Max 5 images per product.

### 4.6 `pages`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO | |
| `slug` | VARCHAR(50) UNIQUE | `about`, `contact`, `how-to-buy`, `lookbook` |
| `title` | VARCHAR(200) | Page heading |
| `content` | TEXT | **Markdown** (sanitized to safe HTML on render) |
| `updated_at` | TIMESTAMP | |

No version history in phase 1.

**Seed page `about` (phase 1):** `title` = `About Mashood`; `content` = default Markdown in `ui-behavior.md` §4.6 (tagline, Our Values, Our Approach, For My Homies in the Hood). Admin may edit via **Pages → About** without redeploy.

**Lookbook** also uses `lookbook_images` (§4.7) for the image grid; `pages.content` holds optional intro Markdown above the grid.

### 4.7 `lookbook_images`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO | |
| `file_path` | VARCHAR(500) | relative to uploads |
| `caption` | VARCHAR(200) NULL | optional alt/caption text |
| `display_order` | INT DEFAULT 0 | Grid order |
| `created_at` | TIMESTAMP | |

Max 12 images. jpg/png/webp, max 5 MB each.

### 4.8 `collections` (brand drops)

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO | |
| `name` | VARCHAR(100) | e.g. Drift |
| `slug` | VARCHAR(100) UNIQUE | URL-safe, e.g. `drift` |
| `cover_image_path` | VARCHAR(500) | Cover image for collection card |
| `description` | TEXT NULL | Optional short Markdown |
| `display_order` | INT DEFAULT 0 | Grid sort on `/collections` |
| `is_active` | BOOLEAN DEFAULT true | Hidden from public when false |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Seed (phase 1):** two sample collections with cover placeholders (products optional at seed time):

| Name | Slug | Description (seed) |
|------|------|-------------------|
| Drift | `drift` | Late-night streets, muted tones, pieces built to move. |
| Urban Night | `urban-night` | City lights, heavy fabrics, limited run. |

Matches sample data in `preview/full-site.html`.

**Delete rule:** Deleting a collection removes junction rows and cover image file only — products are never deleted.

### 4.9 `product_collections` (junction)

Many-to-many link between products and brand collections.

| Column | Type | Notes |
|--------|------|-------|
| `product_id` | INT FK → products | CASCADE delete |
| `collection_id` | INT FK → collections | CASCADE delete |

**Unique:** `(product_id, collection_id)`.

A product may belong to zero or more collections. A product with no collection still appears on `/products` only.

### 4.10 `site_settings`

Key-value store for editable site config (single row per key).

| Column | Type | Notes |
|--------|------|-------|
| `key` | VARCHAR(100) PK | |
| `value` | TEXT | |
| `updated_at` | TIMESTAMP | |

**Required keys:**

| Key | Purpose | Example value |
|-----|---------|---------------|
| `instagram_direct_url` | Primary checkout link | `https://www.instagram.com/mashood.wear` |
| `telegram_username` | Secondary checkout | `lilhosseini` (no @) |
| `hero_video_enabled` | Hero video toggle | `false` |
| `hero_video_url` | Optional hero video | URL or empty |
| `logo_url` | Header/footer logo | `/uploads/logo.png` |
| `hero_eyebrow` | Optional small line above headline | `Independent streetwear` (empty = hidden) |
| `hero_headline` | Hero main headline | `FROM THE STREETS, FOR THE FEW` |
| `hero_subtitle` | Hero subtitle | `Designed by hand. Inspired by the streets. Every piece tells a story — yours to wear.` |
| `hero_image_1_url` | Hero right column image 1 | `/uploads/hero-1.jpg` or empty |
| `hero_image_2_url` | Hero right column image 2 | `/uploads/hero-2.jpg` or empty |
| `brand_story_teaser` | Home brand-story teaser | `BUILT DIFFERENT.` |

**Social/checkout link source of truth:** `instagram_direct_url` and `telegram_username` in `site_settings` only. Header, footer, hero CTA, checkout, and Contact page purchase links all read from Settings — never duplicated in CMS body.

---

## 5. Core Components

| Component | One-line | Does | Does not |
|-----------|----------|------|----------|
| **Public Frontend** | Customer-facing SPA | Products, brand collections, cart, checkout, content pages, lookbook | Payment, order tracking |
| **Admin Frontend** | Management UI at `/admin` | Products, categories, brand collections, pages, home content, site settings | Orders (phase 2), shipping, reports |
| **API (Backend)** | REST layer | CRUD for catalog, collections, pages, settings; admin JWT auth | Payment, email/SMS |
| **Database** | MySQL | Products, categories, collections, admins, pages, settings | Binary image blobs |
| **File storage** | Server disk | Product images, logo | — |

---

## 6. Backend Behavior

### 6.1 Products (public)

**`GET /api/products`**

Query params: `category`, `size`, `color`, `minPrice`, `maxPrice`, `search`, `collection` (brand collection slug), `page` (default 1), `limit` (default 12), `featured` (boolean — when `true`, only `is_featured` products, sorted by `featured_order` then `updated_at` desc).

- Returns only `active` and `out_of_stock` products (`inactive` hidden).
- Each item includes `variants: [{ size, color, stock }]`, `totalStock` (sum of variant stocks), and `stockLabel` derived for cards: `In stock` | `Sold out` (totalStock 0) | `Only N left` (totalStock 1–3).
- Response: `{ ok: true, items: [...], total, page, limit }`.

**`GET /api/products/:slug`**

- `:slug` = product URL slug (e.g. `street-hoodie-black`), not numeric id.
- Returns product with `id`, `slug`, images array, and `variants` array.
- `404` if slug not found or product `inactive`.

**`GET /api/settings/home`** — public home content subset:

```json
{
  "ok": true,
  "heroEyebrow": "Independent streetwear",
  "heroHeadline": "FROM THE STREETS, FOR THE FEW",
  "heroSubtitle": "Designed by hand. Inspired by the streets. Every piece tells a story — yours to wear.",
  "heroImage1Url": "/uploads/hero-1.jpg",
  "heroImage2Url": "/uploads/hero-2.jpg",
  "brandStoryTeaser": "BUILT DIFFERENT.",
  "heroVideoEnabled": false,
  "heroVideoUrl": ""
}
```

**New Arrivals on home:** `GET /api/products?featured=true&limit=6`. If fewer than 4 featured products exist, backfill with most recently updated `active` products (never `inactive`).

### 6.2 Products (admin)

All require `Authorization: Bearer <token>`.

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/products` | List all statuses; supports `search`, `page`, `limit` (default 20) |
| POST | `/api/admin/products` | Create (multipart: images + JSON fields including `variants`, optional `collectionIds`) |
| PUT | `/api/admin/products/:id` | Update (images optional; optional `collectionIds` syncs junction table) |
| DELETE | `/api/admin/products/:id` | Delete product, variants, and image files |

Images: `multipart/form-data`, jpg/png/webp, max 5 MB each, 1–5 images on create.

**Image update rules (edit):**
- Existing images: reorder via `imageOrder: [id, ...]`; delete via `removeImageIds: [id]`.
- New uploads append until total ≤ 5.
- At least 1 image must remain after save.
- On delete product, all image files removed from disk.

**Slug:** auto-generated from `name` on create (URL-safe, unique). Admin may edit slug on create/edit; `400` if duplicate.

**Variants payload:** `variants: [{ size, color, stock }, ...]` — must cover every `size × color` pair exactly once.

### 6.3 Categories

**`GET /api/categories`** — public list sorted by `display_order`.

**Admin:**

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/categories` | List |
| POST | `/api/admin/categories` | Create `{ name, slug?, displayOrder }` |
| PUT | `/api/admin/categories/:id` | Update name, slug, display_order |
| DELETE | `/api/admin/categories/:id` | Delete if no products reference category |

Delete rule: if category has **any** product (any status) → `400` with message: *"Move or remove products in this category first."*

### 6.3.1 Brand collections (public)

**`GET /api/collections`**

- Returns only `is_active = true` collections sorted by `display_order`.
- Response: `{ ok: true, items: [{ id, name, slug, coverImageUrl, productCount }] }`.
- `productCount` = count of `active` and `out_of_stock` products linked via `product_collections`.

**`GET /api/collections/:slug`**

- Returns collection metadata + `products[]` (same shape as `GET /api/products` items, including `totalStock` and `stockLabel`).
- `404` if slug not found or collection inactive.

### 6.3.2 Brand collections (admin)

All require `Authorization: Bearer <token>`.

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/collections` | List all (including inactive) with `productCount` |
| POST | `/api/admin/collections` | Create — multipart: `coverImage` + JSON `{ name, slug?, description?, displayOrder?, isActive?, productIds? }` |
| PUT | `/api/admin/collections/:id` | Update metadata, cover image, `productIds` (replaces junction rows for this collection) |
| DELETE | `/api/admin/collections/:id` | Delete collection, junction rows, and cover image file |

**Cover image:** jpg/png/webp, max 5 MB. Required on create; optional replace on edit.

**Slug:** auto-generated from `name` on create (URL-safe, unique). Admin may edit; `400` if duplicate.

**Product assignment:** `productIds: number[]` on collection create/edit, or `collectionIds: number[]` on product create/edit — both sync the same `product_collections` junction table.

**Delete:** Unlike categories, collection delete is **never blocked** by linked products — junction rows are removed; products remain.

### 6.4 Cart (client-side only)

- No cart API in phase 1.
- Structure in `localStorage` key `mashood_cart`:

```json
[
  { "productId": 1, "quantity": 2, "selectedSize": "L", "selectedColor": "Black" }
]
```

- Totals computed client-side from product prices fetched via API.
- On add-to-cart and qty change, re-fetch product and cap qty to **selected variant** `stock` (matching `selectedSize` + `selectedColor`).
- If selected variant stock is 0 → treat as sold out for that combination.

### 6.5 Checkout

- No order record sent to backend in phase 1.
- Checkout page reads `GET /api/settings/checkout`:

```json
{
  "ok": true,
  "instagramDirectUrl": "https://www.instagram.com/mashood.wear",
  "telegramUsername": "lilhosseini"
}
```

**Primary CTA (Instagram):** opens `instagramDirectUrl` in new tab.

**Secondary CTA (Telegram):** `https://t.me/{telegramUsername}` — smaller link below primary. These are the only two purchase channels.

**Copy order details button:** builds plain-text summary in clipboard (product names, size, color, qty, unit price, total). See `ui-behavior.md` §4.5.

Link to **How to Buy** page (`/how-to-buy`) for payment/shipping FAQ.

### 6.6 Admin authentication

**`POST /api/admin/login`**

Body: `{ "username", "password" }` → `{ "ok": true, "token": "..." }` or `401`.

- Passwords: bcrypt hashed in DB.
- JWT expiry: 8 hours (configurable).
- Failed login rate limit: 5 attempts / 15 minutes per IP.

All `/api/admin/*` except login require valid JWT.

**Token storage (frontend):** JWT stored in `sessionStorage` key `mashood_admin_token` — survives page refresh within the same tab; cleared on tab close or **Log out**. No `localStorage` for tokens.

**`POST /api/admin/change-password`** (authenticated)

Body: `{ "currentPassword", "newPassword" }` → `{ "ok": true }` or `400`/`401`.

- `newPassword` min 8 chars.
- On success, invalidate current token; admin must log in again.

### 6.7 Content pages

**`GET /api/pages/:slug`** — public. Slugs: `about`, `contact`, `how-to-buy`, `lookbook`.

**`PUT /api/admin/pages/:slug`** — admin updates `{ title, content }`.

**How to Buy** content covers: what happens after Instagram DM, offline payment (card transfer), delivery timeframe, shipping coordination.

**Lookbook** — `pages` row (slug `lookbook`) for intro Markdown + **`lookbook_images`** table for the image grid. Public `GET /api/lookbook` returns `{ title, content, images: [{ url, caption, displayOrder }] }`.

**Contact (phase 1):** CMS body for email and free text only. Instagram/Telegram purchase links rendered by frontend from `GET /api/settings/checkout` — not typed into Contact textarea.

### 6.8 Site settings (admin)

**`GET /api/settings/checkout`** — public subset (Instagram + Telegram only).

**`GET /api/admin/settings`** — all settings for admin form.

**`PUT /api/admin/settings`** — update keys (validate URLs/usernames). Supports multipart for `logo`, `hero_image_1`, `hero_image_2` uploads.

**Lookbook images (admin):**

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/lookbook-images` | List |
| POST | `/api/admin/lookbook-images` | Upload image (multipart) + optional caption |
| PUT | `/api/admin/lookbook-images/:id` | Update caption and/or `displayOrder` |
| DELETE | `/api/admin/lookbook-images/:id` | Delete image file |

### 6.9 Product form validation

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | yes | 3–100 chars |
| `slug` | string | no on create | auto from name; 3–120 chars, unique |
| `price` | number | yes | > 0, max 2 decimal places |
| `description` | string | no | max 1000 chars |
| `categoryId` | id | yes | must exist |
| `sizes` | string[] | yes | min 1; each max 10 chars |
| `colors` | string[] | yes | min 1; each max 30 chars |
| `variants` | array | yes | one entry per size×color; each `stock` >= 0 |
| `images` | files | yes on create | 1–5 images, jpg/png/webp, max 5 MB each |
| `status` | enum | yes | `active`, `inactive`, `out_of_stock` |
| `isFeatured` | boolean | no | default false |
| `featuredOrder` | integer | no | used when `isFeatured` true |
| `collectionIds` | number[] | no | must reference existing collections; syncs `product_collections` |

**Status sync (server-side on save):**
- If `status` is not `inactive` and **all** variant stocks = 0 → auto-set `out_of_stock`.
- If `status` is `out_of_stock` and **any** variant stock > 0 → auto-set `active` (admin may override to `inactive` explicitly).
- Admin-set `inactive` is never auto-changed by stock.

Validation errors: `400` with per-field messages, not a generic blob.

### 6.10 Health check

**`GET /api/health`** → `{ "ok": true, "db": "connected" }` for monitoring.

---

## 7. UI Behavior (summary)

Full user-facing spec: `ui-behavior.md`. Highlights:

| Page | Key elements |
|------|--------------|
| Home | Sticky header, hero (minimal default), new arrivals (no stock labels on cards), brand story, footer |
| Collections | Brand drop grid (cover image, name, piece count) |
| Collection detail | `/collections/:slug` — collection title, product grid with stock labels |
| Products | Grid, filters (sidebar desktop / bottom sheet mobile), search, pagination |
| Product detail | `/products/:slug` — gallery, size/color pickers, per-variant stock, add to cart |
| Cart | Line items, qty +/- , total with "Toman" label |
| Checkout | Order summary, Instagram CTA, copy details, Telegram fallback |
| Lookbook | CMS content page |
| About / Contact / How to Buy | CMS pages |
| Admin | Login, dashboard, products, categories, collections, pages, home, settings |

**Navigation (header):** Home · Collections · Products · Lookbook · About · Contact · cart icon. **Order on Instagram** is in the hero and checkout only. Mobile hamburger also links **How to Buy** (not in desktop header).

**Footer (public):** three columns — brand (logo + tagline), **Shop** (Collections, Products, Lookbook, How to Buy), **Info** (About, Contact). Bottom bar: copyright + Instagram/Telegram links from Settings. Email optional in Contact CMS only (not required in footer).

**Legacy redirect:** `/collection` → `301` redirect to `/products`.

**Price display:** numbers only with Western thousand separators (e.g. `1,250,000`). No `$` or currency symbols. Cart and checkout append the word **Toman** next to totals. Optional on product cards.

**Product card stock labels (Collections detail + Products grid):** `In stock` | `Sold out` | `Only N left` (when totalStock 1–3) — product-level, not per variant.

**Layout:** LTR (`lang="en"`, `dir="ltr"`).

---

## 8. Processes (step-by-step)

### Process 1: Browse and add to cart

1. User opens home → taps Collections or Products.
2. From Collections, taps Drift → sees products with stock labels → opens product detail.
3. Or on Products, applies size filter "L".
4. Opens product detail → selects size L, color Black.
5. Taps **Add to Cart** → toast "Added to cart".
6. Opens cart from header icon.

**Errors:** out of stock → button disabled, label "Sold out". Network error → "Can't reach the server — try again." Cart unchanged.

### Process 2: Checkout via Instagram

1. User taps **Continue to Checkout** from cart.
2. Reviews summary on checkout page.
3. Optionally taps **Copy order details for DM**.
4. Taps **Complete Order on Instagram** → new tab to Instagram Direct.
5. Pastes order details in DM if copied.

**Errors:** Instagram link fails → message + Telegram link + Contact page link.

### Process 3: Admin adds product

1. Admin logs in at `/admin`.
2. Products → **Add New Product**.
3. Fills form, uploads image, saves.
4. Product appears in admin list and public catalog (`active`).

---

## 9. States

### Product status

| Status | System | Public UI |
|--------|--------|-----------|
| `active` | At least one variant stock > 0 | Full display; per-variant stock on detail |
| `inactive` | Admin-hidden | Not shown (admin only) |
| `out_of_stock` | All variant stocks = 0 | Shown with "Sold out", button disabled |

### Cart (client)

| State | Meaning |
|-------|---------|
| `empty` | No items |
| `has_items` | One or more items |

### Admin session

| State | Meaning |
|-------|---------|
| `logged_out` | No valid token in sessionStorage |
| `logged_in` | Valid JWT in sessionStorage |

---

## 10. Error messages (user-facing, English)

| Situation | User message |
|-----------|--------------|
| Server unreachable | "Can't reach the server — try again later." |
| Product out of stock | "This item is sold out." |
| Admin form incomplete | "Fill in all required fields." |
| Invalid image format | "Image must be JPG, PNG, or WebP." |
| JWT expired | "Session expired — please log in again." |
| DB save failure | "Couldn't save — please try again." |
| Empty cart checkout | "Your cart is empty." |
| Qty exceeds stock | "Requested quantity exceeds available stock." |
| Variant sold out | "This size and color is sold out." |
| Bad admin credentials | "Wrong username or password." |
| Wrong current password | "Current password is wrong." |
| Category delete blocked | "Move or remove products in this category first." |

---

## 11. Security

- Validate and sanitize all inputs (XSS, SQL injection).
- Never log passwords or JWT tokens.
- All `/api/admin/*` routes require JWT (except login).
- Images stored outside public web root; served via controlled `/uploads/` route or static middleware with path validation.
- File upload: MIME check, 5 MB limit, unique filenames.
- HTTPS in production.
- `robots.txt` disallows `/admin` and `/api`.

---

## 12. Technology stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React (Vite) | Component reuse, SPA routing |
| Backend | Node.js + Express | Fast iteration, large ecosystem |
| Database | MySQL | Relational catalog data |
| Auth | JWT + bcrypt | Simple admin sessions |
| File storage | Local filesystem | Phase 1 simplicity |
| E2E tests | Playwright (recommended) | Browser automation |

---

## 13. Intentional omissions (phase 1)

| Omitted | Why | Phase 2? |
|---------|-----|----------|
| Redux for cart | `localStorage` + React context is enough | Maybe |
| Payment gateway | Offline via Instagram/Telegram | Yes |
| Order tracking in admin | Manual via DMs for now | Yes |
| Customer accounts | Not needed for DM checkout | Maybe |
| Contact form API | Static contact page sufficient | Yes |
| CDN for images | Cost/control tradeoff | Yes when traffic grows |
| OAuth for admin | Few admins; JWT is enough | Unlikely |

---

## 14. Technical risks and mitigation

| Area | Risk | Severity | Mitigation |
|------|------|----------|------------|
| Image upload | Malicious/oversized files | High | MIME check, 5 MB cap, unique names, outside web root |
| localStorage cart | Lost on clear browser | Medium | Accept for phase 1; copy-details button helps recovery |
| Instagram/Telegram links | Link breaks or changes | Medium | Editable in admin Settings; Telegram as fallback |
| Admin auth | Weak password / brute force | High | bcrypt, rate limit, HTTPS |
| DB performance | Slow filters at scale | Medium | Indexes on category, price, name; pagination |

---

## 15. E2E scenarios

**Precondition:** Site running; user/admin has internet.

| ID | Scenario | Expected result |
|----|----------|-----------------|
| **E2E-D-01** | Browse and buy | Product added to cart → checkout → Instagram Direct opens |
| **E2E-D-02** | Admin adds product | Product in admin list and public catalog |
| **E2E-D-03** | Admin edits product | Price/stock change visible on public site |
| **E2E-D-04** | Checkout with empty cart | Blocked; "Your cart is empty." shown |
| **E2E-D-05** | Admin login failure | Error shown; no dashboard access |
| **E2E-D-06** | Admin sets variant stock to 0 | That size/color shows sold out on product page |
| **E2E-D-07** | Admin marks product featured | Product appears in New Arrivals on home |
| **E2E-D-08** | Admin adds collection Drift with cover | Drift card visible on `/collections` |
| **E2E-D-09** | Admin assigns products to Drift | Products with stock labels on `/collections/drift` |
| **E2E-D-10** | Customer taps product in collection | Product detail page opens |
| **E2E-D-11** | Nav Products + filters | Filters work after Collection→Products rename |

(`proposal.md` uses `E2E-P-*` for the same flows — treat as aliases.)

---

## 16. Open items (non-blocking)

- Page content versioning (history) — defer to phase 2 if needed.
- Logging backend (file vs service) — decide at deploy time.
- Responsive image variants (thumbnails) — one size OK for phase 1.
- Contact form with email relay — phase 2.
- Multi-admin user management UI — phase 2; phase 1 supports change-password only.
- WYSIWYG CMS editor — phase 2; phase 1 uses Markdown + Lookbook image upload.

---

> This document is the implementation source of truth. Changes must be reflected here and in dependent docs (`ui-behavior.md`, `tasks.md`).
