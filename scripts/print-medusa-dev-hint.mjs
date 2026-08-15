/**
 * Print how to start the full local stack (Medusa lives in apps/medusa).
 * purpose --- one cloneable monorepo; remind operators of the three-terminal flow ---
 */
console.log(`
Mashhoodwear monorepo — local stack

  1) Databases (once):
     npm run db:up

  2) Medusa Iran Pack (commerce :9000):
     npm run dev:medusa
     Store API:  http://localhost:9000
     Admin UI:   http://localhost:9000/app

  3) CMS Express (optional :3001):
     npm run migrate:cms   # first time
     npm run dev:cms

  4) Vite storefront (:5173):
     npm run dev:frontend

Env templates:
  apps/medusa/.env.example  → apps/medusa/.env
  frontend/.env.example     → frontend/.env
  backend/.env.example      → backend/.env
`);
