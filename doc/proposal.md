# Project Proposal: Mashhoodwear E-commerce

> **Status (2026-07-05):** Phases 0–9 complete. Docs synced with `preview/full-site.html`. See `doc/design.md` §0 and `doc/tasks.md`.

---

## §1. Short Introduction

**Mashhoodwear** is a storefront for an independent streetwear brand with a distinct identity. Customers browse products, filter by category/size/color/price, add items to a cart, and finalize orders via **Instagram Direct** on the Mashhoodwear page (with **Telegram** as a secondary option). Online payment and order tracking are not in the site yet, but the architecture leaves room for them later.

Born from the streets — where identity, taste, and path differ for everyone. We don't design for the masses or chase fleeting trends. Every piece is handmade, inspired by street culture, friendship, music, and real life. Clothing isn't just coverage; it's how you show who you are and which culture you belong to.

**Site language:** English only (UI copy, messages, SEO).

**Purchase channels:** Instagram Direct (primary) and Telegram (secondary). No WhatsApp, phone orders, or other checkout paths in phase 1.

**Brand social handles:** Instagram [@mashood.wear](https://www.instagram.com/mashood.wear) · Telegram [@lilhosseini](https://t.me/lilhosseini)

---

## §2. Core Problem

Reza, 25, wants clothes with character and quality. He's tired of generic market fashion and found Mashhoodwear on Instagram — but every purchase means scrolling posts, hunting size/price in comments, and DMing to buy. There's no central place to see everything, compare, and choose easily.

The Mashhoodwear team also spends hours answering the same questions about stock, price, and sizes. Many customers drop off because buying is too friction-heavy.

---

## §3. Target Users

| Role | Wants | Phase 1 priority |
|------|-------|------------------|
| Style-conscious customer (Reza) | Browse, filter, pick fast, order without confusion | **High** |
| Mashhoodwear sales team | Manage products, update stock/prices, save time | High |
| Site admin | Manage content pages, categories, site settings | Medium |

---

## §4. Value & Main Deliverable

**Phase 1 output:** A complete storefront that:

- Shows all Mashhoodwear products with categories and filters
- Lets users browse brand collections (e.g. Drift) and see pieces with stock status
- Lets users add products to a cart
- At checkout, redirects to Mashhoodwear Instagram Direct (Telegram as backup) to finalize the order
- Provides an admin panel to manage products, categories, brand collections, content pages, and checkout links
- Leaves clear extension points for payment, tracking, discounts, and reports

**User benefit:** No more digging through Instagram posts and comments. Everything in one place — pick easily, reach the seller in one click.

**Team benefit:** More sales, simpler ops, more time for creative work.

---

## §5. High-Level Capabilities

### Home & discovery

- **What:** First page users see.
- **Does:** Featured/new products, brand collections entry, categories, simple search entry.
- **Does not:** AI recommendations (later phase).
- **Risk if skipped:** Users bounce — they don't feel they're in the right place.

### Brand collections

- **What:** Curated drops (e.g. Drift) with cover image and assigned products.
- **Does:** Collections list page, collection detail with product grid and stock labels, admin CRUD with image upload and product assignment.
- **Does not:** Separate checkout per collection — same cart flow.
- **Risk if skipped:** Brand story and limited drops are hard to showcase; customers only see a flat catalog.

### Product list & detail

- **What:** Full catalog (**Products** page) with filters (size, color, price, category) and product pages.
- **Does:** Quality images, price, description, stock, Add to Cart.
- **Does not:** User reviews (later phase).
- **Risk if skipped:** Users can't find the right product — core value lost.

### Cart & checkout

- **What:** Selected items, totals, order completion flow.
- **Does:** Line items, total price, Complete Order on Instagram, copy order details for DM.
- **Does not:** Online payment, shipping calculator, discount codes (reserved for later).
- **Risk if skipped:** Users can't finish — the site is useless.

### Admin panel

- **What:** Private area for the Mashhoodwear team.
- **Does (phase 1):** CRUD products (per-variant stock, featured flag, collection assignment), CRUD categories, CRUD brand collections (name, cover image, product links), edit CMS pages (Markdown), Lookbook image gallery, edit home hero/teaser content, checkout links (Instagram/Telegram), optional hero video, logo upload, change admin password.
- **Does not (phase 1):** Order status management, advanced reports, shipping management — **phase 2**.
- **Risk if skipped:** Site goes stale; wrong stock/prices erode trust.

---

## §6. Constraints & Deliberate Exclusions

- **No online payment** — final step via Instagram Direct.
- **No order tracking in phase 1** — placeholder for phase 2.
- **No discount codes or automated email/SMS** in phase 1.
- **No advanced analytics or shipping management** in phase 1.
- **No native mobile app** — responsive web only.
- **Language:** English only across the public site and admin UI.
- **Single brand** — no multi-vendor marketplace.

---

## §7. Risks & Assumptions

| Area | Risk | Severity | If it happens |
|------|------|----------|---------------|
| Product discovery | Stale or wrong stock on site | High | Customer orders unavailable item — bad experience, lost trust |
| Cart & checkout | Broken Instagram Direct link | High | Sale never completes — revenue stops |
| Admin panel | Team doesn't use it | Medium | Outdated catalog; users leave |
| Instagram | Direct link policy changes | Low | Fall back to Telegram (editable in admin Settings) |
| Assumption | Target customers will use the site | — | If false, project value collapses |

---

## §8. Critical E2E Paths

| # | E2E path | Role | Success |
|---|----------|------|---------|
| **E2E-D-01** | Discover and buy a product | Customer | Item in cart → checkout → Instagram Direct opens |
| **E2E-D-02** | Add new product | Sales team | Product visible on public site |
| **E2E-D-03** | Edit stock and price | Sales team | Variant stock / price change visible on product page |
| **E2E-D-04** | Checkout with empty cart | Customer | Blocked with empty-cart message |
| **E2E-D-05** | Admin login failure | Admin | Error shown; no dashboard access |
| **E2E-D-06** | Variant stock zero | Sales team | That size/color sold out on product page |
| **E2E-D-07** | Featured product | Sales team | Product appears in New Arrivals on home |
| **E2E-D-08** | Add brand collection | Sales team | Collection card visible on `/collections` |
| **E2E-D-09** | Assign products to collection | Sales team | Products with stock labels on `/collections/:slug` |
| **E2E-D-10** | Open product from collection | Customer | Product detail page opens |
| **E2E-D-11** | Products page filters | Customer | Filters work on renamed Products page |

(Same IDs as `design.md` §15. Former `E2E-P-*` labels are aliases.)

---

> **Note:** This proposal covers **what** and **why**. Architecture, database, and API details are in `design.md` (see §0 for current project status). UI behavior is in `ui-behavior.md`. Visual system is in `look-and-feel.md`. Implementation tasks are in `tasks.md`. UI preview: `preview/full-site.html`.
