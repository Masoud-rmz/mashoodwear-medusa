/**
 * Print how to start Medusa (Iran Pack) for local storefront work.
 * purpose --- Medusa lives outside this repo; remind operators not to look for npm run medusa here ---
 */
const medusaBackendPath =
  process.env.MEDUSA_BACKEND_PATH ||
  "F:\\medusa-develop\\my-medusa-store\\apps\\backend";

console.log(`
Medusa (Iran Pack) runs outside this repo — start it in a separate terminal:

  cd ${medusaBackendPath}
  npm run dev

  Store API:  http://localhost:9000
  Admin UI:   http://localhost:9000/app

Then in this repo:
  npm run db:up && npm run dev:cms-backend   # optional CMS (:3001)
  npm run dev:frontend                      # Vite storefront (:5173)
`);
