# iran-shipping

Iran Pack shipping helpers and address validation.

**Phase:** 4 (shipping options + Iran address validation in API)

**Responsibilities:**
- Iran address validation (`validateIranAddress`) for `country_code=ir`
- Middleware on cart/customer address routes (`src/api/middlewares.ts`)
- Standalone validation endpoint: `POST /store/iran/validate-address`
- Seed: `ارسال عادی (ایران)` / `ارسال سریع (ایران)` shipping options

See [design.md](../../../../docs/phase-a-iran-pack/design.md) and [tasks.md](../../../../docs/phase-a-iran-pack/tasks.md) فاز ۴.
