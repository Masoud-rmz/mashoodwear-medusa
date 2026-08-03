## Why

Mashhoodwear sells streetwear primarily through Instagram, but customers must scroll posts, hunt sizes/prices in comments, and DM to buy. There is no central catalog to browse, filter, and compare. The team also repeats the same stock and pricing questions. Phase 1 delivers a full English storefront with Instagram Direct checkout (Telegram fallback) and an admin panel — without online payment or order tracking yet.

## What Changes

- Scaffold **Node.js + Express** backend and **React + Vite** frontend with MySQL
- Public site: home, brand collections, products with filters, product detail, cart (`localStorage`), checkout via Instagram/Telegram
- Admin panel: JWT auth (sessionStorage), product CRUD with per-variant stock, featured flag, and collection assignment, category CRUD, brand collections CRUD (cover image, product links), CMS pages (Markdown), Lookbook image gallery, Home content, site settings (checkout links, hero video, logo, change password)
- Brand visual system from `doc/look-and-feel.md` (Bebas Neue, Space Grotesk, Space Mono; dark streetwear palette)
- E2E paths E2E-D-01 through E2E-D-11 as acceptance criteria

## Capabilities

### New Capabilities

- `infrastructure`: Backend/frontend scaffold, MySQL migrations, env config, health check, brand CSS tokens
- `home-page`: Sticky header, minimal hero, new arrivals, brand story, footer
- `products-filters`: Products grid (`/products`) with category/size/color/price filters, search, pagination, stock labels on cards
- `brand-collections`: Collections list and collection detail pages with product grids
- `admin-brand-collections`: Admin CRUD for brand collections with cover image and product assignment
- `product-detail`: Image gallery, size/color selection, stock states, add to cart
- `cart`: Client-side cart persistence, quantity controls, Toman totals
- `checkout`: Order summary, Instagram Direct CTA, copy order details, Telegram fallback
- `admin-auth`: bcrypt login, JWT middleware, rate limiting, protected routes
- `admin-products`: Product CRUD with variant stock grid, featured flag, collection assignment, image reorder
- `admin-categories`: Category CRUD with delete guard when any product exists
- `admin-pages-settings`: CMS Markdown pages, Lookbook images, Home content, checkout/settings, change password
- `polish-launch`: a11y, SEO (sitemap/robots/meta), security review, E2E regression

### Modified Capabilities

_None — greenfield project._

## Impact

- New codebase under `backend/`, `frontend/`, `tests/` per `doc/design.md` §3
- MySQL schema: `admins`, `categories`, `products`, `product_variants`, `product_images`, `collections`, `product_collections`, `pages`, `lookbook_images`, `site_settings`
- No breaking changes — first release
- Deferred to phase 2: payment gateway, order tracking, contact form API, page version history

## Source Documents

| OpenSpec artifact | Source in `doc/` |
|-------------------|------------------|
| Full UI behavior | `ui-behavior.md` |
| Visual system | `look-and-feel.md` |
| API & schema detail | `design.md` |
| Business context | `proposal.md` |
