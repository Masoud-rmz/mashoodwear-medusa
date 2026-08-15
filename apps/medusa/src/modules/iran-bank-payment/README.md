# iran-bank-payment

Iran Pack payment module — direct bank IPG integration.

**Phase:** 3 (stub adapter in `adapters/stub/`)

**Provider ID:** `pp_iran-bank_iran`

**Responsibilities:**
- Medusa Payment Provider (`initiate` / `authorize`)
- Bank Transaction API client (`transaction-client.ts`)
- Per-bank adapters under `adapters/<bank-code>/`

**Stub routes:**
- `GET /store/iran-bank/stub/pay?ref=...&result=success|fail`
- `GET|POST /store/iran-bank/stub/callback`

**Smoke script:** `npx medusa exec ./src/scripts/phase-3-smoke.ts`

See [design.md §5ج](../../../../docs/phase-a-iran-pack/design.md) for structure.
