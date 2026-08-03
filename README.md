# Mashhoodwear × Medusa

Storefront fork of Mashhoodwear wired to the Medusa v2 backend (Iran Pack).

| Item | Path |
|------|------|
| This project (Vite UI + CMS Express) | `C:\Users\KASRA\Desktop\mashoodwear-medusa` |
| Original Mashhoodwear (untouched) | `C:\Users\KASRA\Desktop\mashoodwear` |
| Medusa backend (Iran Pack) | `F:\medusa-develop\my-medusa-store\apps\backend` |

## Why this repo exists

**UI testbed on Medusa:** exercise a ready-made storefront, find bugs, then reuse the same backend + learnings for a future custom client UI.

## Approach

**Path A:** Keep the existing React (Vite) storefront UI. Catalog, cart, checkout, and payment use Medusa Store API + Iran Pack (`pp_iran-bank_iran`). Instagram/Telegram DM is an optional fallback only.

**Admin (option الف):** Commerce admin is **only** Medusa Admin at `:9000/app`. Mashhoodwear `/admin` keeps brand CMS only and links out to Medusa Admin.

## Daily commands

Medusa is **not** an npm script in this repo. Print the reminder anytime with:

```bash
npm run notes:medusa
```

### 1. Medusa (required for commerce) — separate terminal

```bash
cd F:\medusa-develop\my-medusa-store\apps\backend
npm run dev
```

- Store API: `http://localhost:9000`
- Admin: `http://localhost:9000/app`

### 2. Optional CMS (pages / lookbook / settings)

```bash
cd C:\Users\KASRA\Desktop\mashoodwear-medusa
npm run db:up
npm run migrate          # first time / after schema change
npm run dev:cms-backend  # Express on :3001
```

Alias: `npm run dev:backend` (same as `dev:cms-backend`).

### 3. Storefront (Vite)

```bash
cd C:\Users\KASRA\Desktop\mashoodwear-medusa
# once: copy frontend/.env.example → frontend/.env and fill publishable key + region
npm run dev:frontend     # http://localhost:5173
```

Required env (see `frontend/.env.example`):

- `VITE_MEDUSA_BACKEND_URL=http://localhost:9000`
- `VITE_MEDUSA_PUBLISHABLE_KEY=pk_…`
- `VITE_MEDUSA_REGION_ID` (or default country `ir`)
- `VITE_MEDUSA_ADMIN_URL=http://localhost:9000/app`
- `VITE_COMMERCE_PROVIDER=medusa`

### Proxy note

Vite proxies **only** CMS paths to Express (`:3001`): `/api`, `/uploads`, `/sitemap.xml`.  
Medusa requests go **directly** to `:9000` via `VITE_MEDUSA_BACKEND_URL` (no Vite proxy).

## Tests

```bash
npm run test:unit                      # Medusa mappers/helpers + CMS unit (default)
npm run test:backend                   # same folder `tests/*.test.js` (no legacy catalog)
npm run test:legacy-express-catalog    # optional residual Express product/category routes
```

## Install (first time)

```bash
npm run install:all
```

## Docs (for humans + agents)

| Doc | Role |
|-----|------|
| `AGENTS.md` | **Start here for AI** — stack, decisions, hotspots; points to packs below |
| `doc/agent-priority/` | Numbered pack — storage priority (handshake, tasks, …) |
| `doc/ui-medusa-guides/` | Numbered pack — build / mount storefront UI on Medusa |
| `doc/PURPOSE.md` | Why testbed exists; what transfers to future custom UI |
| `doc/handshake-learnings.md` | Living bug/gotcha log — append every finding |
| `doc/implementation_plan.md` | Architecture |
| `doc/tasks-medusa.md` | Implementation checklist |
| `doc/admin-split.md` | Medusa Admin vs mashoodwear `/admin` |
| `doc/payment-smoke-checklist.md` | Manual smoke for C-03…C-08 (address → pay → result) |
| `doc/auth-otp.md` | Buyer OTP + account + saved addresses (C-09) — Medusa backend + Vite UI |

## Status

Phases **0–7** complete (catalog + cart + Iran address/shipping + bank payment + admin الف + DevOps polish).  
Phase **8:** **8.2 OTP**, **8.4 buyer account**, and **8.4b saved addresses** done (see `doc/auth-otp.md`); remaining optional: real bank gateway, order-status SMS, full CMS move.
