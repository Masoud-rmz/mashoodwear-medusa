# Mashhoodwear × Medusa — Agent Quick Reference

## Storage priority (chat alone is not enough)

Mashhoodwear here is a **test mannequin**. What must survive for the next customer UI is the **API contract + bug list**, not necessarily the brand look.

| Rank | Where | Role |
|------|--------|------|
| 1 | `AGENTS.md` (this file) | First thing the Agent should read |
| 2 | `.cursor/rules/*.mdc` with `alwaysApply` | Applied every chat in this workspace |
| 3 | `doc/handshake-learnings.md` | Living bug/discovery log — **most important for the next UI** |
| 4 | `doc/PURPOSE.md` + `doc/tasks-medusa.md` | Testbed goal + progress |
| 5 | AI learning docs (`medusa-ui-testbed-then-custom-storefront.md`) | General knowledge + link to this repo |

**Human pack (storage priority, numbered):** `doc/agent-priority/` — which docs matter for knowledge persistence.  
**UI mount pack (build storefront on Medusa):** `doc/ui-medusa-guides/` — curated reading order + copies of guides (checklist, API contract, OTP, payment smoke, …). Sync: `npm run sync:ui-medusa-guides`.  
**Rule:** If a finding only lives in chat, the next session starts from zero. Append learnings to `handshake-learnings.md` in the same session.  
**End of every meaningful session:** update ranks 3–4 (and 1–2 if needed), then run `npm run sync:agent-priority` and (if guides changed) `npm run sync:ui-medusa-guides`.

## Why this repo exists

This is a **Medusa storefront testbed**, not the final customer UI.

1. Wire a **ready-made UI** (Mashhoodwear Vite) to Medusa v2 + Iran Pack.
2. Exercise real buyer flows (catalog → cart → Iran address → shipping → payment).
3. Log bugs and API gotchas.
4. Later: build a **custom client UI** and mount it on the same Medusa backend using lessons from this repo.

Original Mashhoodwear at `C:\Users\KASRA\Desktop\mashoodwear` must stay **untouched**.

## Read next (after this file)

**One folder for UI + Medusa mount:** open [`doc/ui-medusa-guides/README.md`](doc/ui-medusa-guides/README.md) (numbered copies + reading order). Canonical sources:

| Doc | Role |
|-----|------|
| `doc/PURPOSE.md` | Goal, non-goals, what transfers to future UIs |
| `doc/handshake-learnings.md` | Living bug/gotcha log — update when something breaks |
| `doc/tasks-medusa.md` | Checklist / progress |
| `doc/implementation_plan.md` | Architecture + scope (Path A + payment + admin الف) |
| `doc/admin-split.md` | Medusa Admin vs mashoodwear `/admin` |
| `doc/auth-otp.md` | Buyer OTP + account + saved addresses (C-09) — lives on Medusa, UI in this repo |
| `doc/storefront-feature-checklist.md` | From-scratch storefront checklist: pages, buttons, keys, tax, promos, auth |
| `doc/storefront-extras-guide.md` | Agent/playbook for categories, wishlist, gift cards, returns, tax, password reset |
| `doc/payment-smoke-checklist.md` | Smoke path C-03…C-08 (Iran bank) |
| `F:\medusa-develop\my-medusa-store\docs\phase-a-iran-pack\storefront-api-contract.md` | Store API contract (C-01…C-09) |
| `C:\Users\KASRA\Desktop\AI learning docs\05-Web-Development\medusa-ui-testbed-then-custom-storefront.md` | Cross-repo learning note |

## Stack map

| Piece | Where | Port |
|-------|--------|------|
| Buyer UI (this repo) | `frontend/` Vite + React | `5173` |
| CMS only (pages, lookbook, settings) | `backend/` Express + MySQL | `3001` |
| Commerce API + Admin | `F:\medusa-develop\my-medusa-store\apps\backend` | `9000` / `/app` |
| Publishable key / region | `frontend/.env` | — |

## Locked decisions

- **Medusa meaning:** always the Iranized backend at `F:\medusa-develop\my-medusa-store\apps\backend` (Iran Pack), not vanilla Medusa Cloud/starter alone.
- **Path A:** keep Mashhoodwear Vite UI; do not rewrite to Next.js here.
- **Admin الف:** commerce only in Medusa Admin (`:9000/app`). Do **not** rebuild orders/inventory/payment admin inside Vite `/admin`.
- **Payment:** Iran Pack `pp_iran-bank_iran` is the main checkout path; DM Instagram/Telegram is optional fallback only.
- **Adapter pattern:** map Medusa → existing UI shapes in `frontend/src/api/medusa/` so pages stay stable.
- **Buyer auth (C-09):** OTP + password live on Medusa (`phone-auth` + `/store/iran/auth/*`); Vite only calls those APIs. Saved addresses use `/store/customers/me/addresses` (visible in Medusa Admin → Customers). Guide: `doc/auth-otp.md`.

## Code hotspots

- `frontend/src/api/medusa/client.js` — SDK + env flags
- `frontend/src/api/medusa/mappers.js` — product/variant mapping
- `frontend/src/api/medusa/catalog.js` — Store catalog reads (list, filters, detail, related)
- `frontend/src/api/medusa/catalogFilters.js` — pure size/color/price + featured-tag helpers
- `frontend/src/api/medusa/cart.js` — Cart API (ensure/add/update/remove) + in-memory cache
- `frontend/src/api/medusa/cartMappers.js` — Medusa cart line → `CartLineItem`
- `frontend/src/api/medusa/cartPersistence.js` — `mashood_medusa_cart_id` + legacy cart clear
- `frontend/src/api/medusa/checkout.js` — C-03/C-04 validate-address, cart address, shipping methods
- `frontend/src/api/medusa/checkoutHelpers.js` / `checkoutMessages.js` — pure helpers + Persian errors
- `frontend/src/api/medusa/payment.js` — C-05…C-07 payment collection/session + complete cart (no verify in React)
- `frontend/src/api/medusa/paymentHelpers.js` / `paymentMessages.js` — redirect/status mapping + Persian copy
- `frontend/src/api/medusa/auth.js` — Iran Pack OTP/password auth (`/store/iran/auth/*`)
- `frontend/src/api/medusa/customer.js` / `customerAuth.js` / `accountMappers.js` — me/orders/addresses + JWT persistence
- `frontend/src/pages/LoginPage.jsx` / `AccountPage.jsx` / `components/account/AccountAddressesPanel.jsx` — buyer login + account + saved addresses
- `frontend/src/pages/CheckoutPage.jsx` — Iran address + shipping; reuse saved addresses when logged in; DM fallback only
- `frontend/src/pages/PaymentPage.jsx` — Iran bank pay step (`/checkout/payment`)
- `frontend/src/pages/OrderResultPage.jsx` — gateway return + paid/failed/pending (`/order/result`)
- `frontend/src/api/client.js` — facade (`VITE_COMMERCE_PROVIDER=medusa`); CMS fallback for collections
- `frontend/src/hooks/useCart.js` — Medusa sync (or localStorage fallback)
- `frontend/src/admin/AdminApp.jsx` — Path A: products/categories → deprecate stub; CMS routes kept
- `frontend/src/admin/pages/CommerceMovedToMedusaPage.jsx` — link to Medusa Admin for catalog CRUD
- `frontend/src/admin/pages/DashboardPage.jsx` — CMS dashboard + Medusa Admin CTA
- `frontend/src/api/medusa/promotionHelpers.js` — map cart promotions + discount totals + Persian errors
- `frontend/src/components/cart/PromoCodeForm.jsx` — apply/remove Medusa promo codes on Cart
- `frontend/src/components/cart/GiftCodeForm.jsx` — Loyalty gift card redeem on Cart
- `frontend/src/pages/OrderDetailPage.jsx` — order detail + return request panel
- `frontend/src/pages/WishlistPage.jsx` / `hooks/useWishlist.js` — local wishlist
- `frontend/src/pages/CategoriesPage.jsx` / `CategoryDetailPage.jsx` — category PLP
- Mapper/filter/cart/checkout/payment/gift/wishlist/returns tests: `backend/tests/medusa*.test.js`
- Smoke: `doc/payment-smoke-checklist.md` (C-03…C-08) · auth: `doc/auth-otp.md` (C-09)
- Storefront feature checklist: `doc/storefront-feature-checklist.md`
- Admin split: `doc/admin-split.md` · optional export: `npm run export:products-for-medusa`

## Agent rules for this repo

1. Prefer fixing/extending the **adapter + Store API usage** over redesigning Mashhoodwear branding.
2. Never copy payment **verify** logic into React — only call Medusa APIs.
3. When you hit a Medusa/Iran Pack bug or surprising API behavior, append it to `doc/handshake-learnings.md` (date, symptom, root cause, fix, transferable note).
4. Do not modify `C:\Users\KASRA\Desktop\mashoodwear`.
5. After meaningful progress, tick items in `doc/tasks-medusa.md`.
6. Keep modules focused; English comments explain *why*.
7. Do not treat chat history as the archive — persist to ranks 1–4 above.
8. After meaningful work in a session: update `handshake-learnings.md` / `tasks-medusa.md` as needed, then run `npm run sync:agent-priority` and `npm run sync:ui-medusa-guides` so both packs stay current.

## Dev smoke

```bash
# Reminder (Medusa is outside this repo)
npm run notes:medusa

# Medusa
cd F:\medusa-develop\my-medusa-store\apps\backend
npm run dev

# This storefront
cd C:\Users\KASRA\Desktop\mashoodwear-medusa
npm run dev:frontend
# optional CMS:
npm run db:up && npm run dev:cms-backend
```

Open `http://localhost:5173/products`, login `/login`, account `/account`, Admin `http://localhost:9000/app`.

Buyer OTP/account guide: [`doc/auth-otp.md`](doc/auth-otp.md) (backend under `my-medusa-store`).

Default tests: `npm run test:unit`. Residual Express catalog: `npm run test:legacy-express-catalog`.
