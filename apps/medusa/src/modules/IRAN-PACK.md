# Iran Pack — module layout

Planned custom modules under `apps/backend/src/modules/`:

| Directory | Purpose | Phase |
|-----------|---------|-------|
| `iran-bank-payment/` | Payment provider + bank adapters | 3 |
| `iran-store-config/` | Per-store Iran settings | 1+ |
| `iran-shipping/` | Shipping options + address validation | 4 |
| `phone-auth/` | Customer phone OTP (SMS.ir) + Auth provider | 8 / C-09 |

Register modules in `medusa-config.ts` as each phase lands. Phase 0 only fixes paths and adds the `modules` array scaffold.

## Money / Admin price display

| Piece | Location |
|-------|----------|
| IRT Admin currency map | `src/admin/lib/currencies.ts` + `src/admin/vite/iran-pack-currencies-plugin.ts` |
| Auto irt↔irr sync (1:10) | `src/subscribers/sync-iran-currency-prices.ts` + `src/workflows/hooks/sync-iran-prices-*.ts` |
| Backfill existing products | `npx medusa exec ./src/scripts/ensure-irt-prices.ts` |

## Phase 5 (go-live)

Hardening lives outside module folders:

| Piece | Location |
|-------|----------|
| Rate limit + security headers | `src/api/utils/` + `src/api/middlewares.ts` |
| Production CORS guard | `src/api/utils/cors-production.ts` (loaded from `medusa-config.ts`) |
| Ops checklist | `docs/phase-a-iran-pack/go-live-hardening.md` |
