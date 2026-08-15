# Phone Auth (Iran Pack)

Customer authentication by Iranian mobile + OTP (SMS.ir VERIFY) and optional password via `emailpass` synthetic email.

**Full storefront guide (Persian):**  
`C:\Users\KASRA\Desktop\mashoodwear-medusa\doc\auth-otp.md`

## Location

This module lives in **Medusa** (`my-medusa-store`), not in the Vite/Express CMS repo.

| Piece | Path |
|-------|------|
| Provider | `src/modules/phone-auth/` |
| Store API | `src/api/store/iran/auth/` |
| Config | `medusa-config.ts` → Auth providers + `authMethodsPerActor.customer` |

## Env

| Variable | Role |
|----------|------|
| `PHONE_AUTH_JWT_SECRET` | Sign OTP hashes (fallback: `JWT_SECRET`) |
| `SMS_IR_API_KEY` | SMS.ir API key (server only) |
| `SMS_IR_TEMPLATE_ID` | VERIFY template id (parameter `Code`) |
| `SMS_IR_STUB` | `1` to force stub (log OTP, no HTTP) |

Without API key / template id, stub mode is automatic.

## Store routes (preferred by Vite storefront)

| Method | Path |
|--------|------|
| POST | `/store/iran/auth/otp/send` |
| POST | `/store/iran/auth/register` |
| POST | `/store/iran/auth/login/password` |
| POST | `/store/iran/auth/login/otp` |

Responses use `{ ok, … }` with Persian `message` and stable `error` codes. UI never sees `@phone.local`.

## Admin Vite cache

If `/app` fails with missing `.vite/deps/*.js`, delete `node_modules/.vite` and restart `npm run dev`.
