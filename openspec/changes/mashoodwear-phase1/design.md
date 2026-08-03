## Context

Mashhoodwear is a single-brand streetwear storefront. Phase 1 customers browse products, add to cart, and complete orders via **Instagram Direct** (primary) or **Telegram** (secondary). There is no online payment, customer accounts, or server-side cart. The Mashhoodwear team manages catalog and content through a JWT-protected admin panel.

Full API, schema, and stack details: `doc/design.md`. UI flows: `doc/ui-behavior.md`. Visual tokens: `doc/look-and-feel.md`.

## Goals / Non-Goals

**Goals:**

- React SPA + Express REST API + MySQL catalog
- Client-side cart in `localStorage` key `mashood_cart`
- Admin JWT auth (bcrypt, 8h expiry, sessionStorage, rate-limited login, change password)
- Per-variant stock, featured products, Home content, Lookbook images in admin
- Instagram/Telegram checkout links editable in admin Settings (single source of truth)
- English-only UI copy, LTR layout
- E2E coverage for E2E-D-01 through E2E-D-11

**Non-Goals (phase 1):**

- Online payment, discount codes, shipping calculator
- Customer accounts or server-side orders
- Contact form backend (static Contact page only)
- Admin order status management
- CDN, responsive image variants, page version history

## Decisions

### Decision 1: React SPA + REST, no SSR

**Choice:** Vite + React frontend; Express JSON API.

**Rationale:** Dynamic admin-managed catalog; team familiar with JS stack; faster iteration than SSR for phase 1.

**Alternative considered:** Next.js SSR — rejected; SEO handled via meta tags + sitemap for phase 1 scale.

### Decision 2: Cart in localStorage only

**Choice:** No cart API; structure `[{ productId, quantity, selectedSize, selectedColor }]`.

**Rationale:** No customer auth; checkout happens off-site via DM. Simpler ops.

**Tradeoff:** Cart lost if browser storage cleared — mitigated by "Copy order details" on checkout.

### Decision 3: Checkout redirect, not order API

**Choice:** Checkout page reads `GET /api/settings/checkout`; no order record persisted.

**Rationale:** Sales finalized manually in Instagram/Telegram DMs. Architecture leaves room for order API in phase 2.

### Decision 4: Image storage on server filesystem

**Choice:** Multer uploads to `backend/uploads/`; max 5 MB, jpg/png/webp, 1–5 images per product.

**Rationale:** Low cost and complexity for phase 1. CDN migration documented as phase 2.

### Decision 5: CMS pages as DB rows, not files

**Choice:** `pages` table with slugs `about`, `contact`, `how-to-buy`, `lookbook`.

**Rationale:** Admin can edit without redeploy. Lookbook is a CMS page, not a separate gallery table.

## Directory Layout

```
mashoodwear/
├── backend/src/          # Express API (routes, services, db, middleware) — not started
├── frontend/src/         # React SPA (pages, admin, components, hooks) — not started
├── preview/              # Static UI preview (full-site.html, shared.css, client/ exports)
├── doc/                  # Source-of-truth docs (proposal, design, ui-behavior, tasks)
├── openspec/             # OpenSpec change tracking
└── tests/                # backend unit + Playwright E2E — not started
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `3001`) |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` | MySQL connection |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Admin auth (`8h`) |
| `UPLOAD_DIR` | Image storage path |
| `CORS_ORIGIN` | Frontend origin |

## Security Notes

- All `/api/admin/*` except login require JWT
- bcrypt passwords; never log passwords or tokens
- Input sanitization; MIME check on uploads; HTTPS in production
- `robots.txt` disallows `/admin` and `/api`

## E2E Acceptance

| ID | Scenario |
|----|----------|
| E2E-D-01 | Browse → cart → checkout → Instagram opens |
| E2E-D-02 | Admin adds product → visible on public site |
| E2E-D-03 | Admin edits variant stock/price → live on product page |
| E2E-D-04 | Empty cart checkout blocked |
| E2E-D-05 | Failed admin login → no dashboard access |
| E2E-D-06 | Variant stock 0 → that size/color sold out |
| E2E-D-07 | Featured product → appears in New Arrivals |
| E2E-D-08 | Admin adds collection Drift → visible on `/collections` |
| E2E-D-09 | Products assigned to collection → stock labels on detail |
| E2E-D-10 | Tap product in collection → product detail opens |
| E2E-D-11 | Products page filters work (size L, etc.) |

## Risks

| Risk | Mitigation |
|------|------------|
| Stale stock on site | Per-variant stock in admin + validation on add-to-cart |
| Broken Instagram link | Editable in Settings; Telegram fallback |
| Weak admin password | bcrypt, rate limit (5/15min), HTTPS |
| Malicious uploads | MIME check, 5 MB cap, unique filenames |
