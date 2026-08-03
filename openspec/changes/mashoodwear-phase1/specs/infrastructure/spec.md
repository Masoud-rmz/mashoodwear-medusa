## ADDED Requirements

### Requirement: Backend and frontend scaffold exist
The project SHALL include a Node.js + Express backend under `backend/` and a React + Vite frontend under `frontend/` with scripts to run each in development.

#### Scenario: Backend starts
- **WHEN** developer runs the backend start command with valid env vars
- **THEN** Express listens on configured `PORT` and responds to HTTP requests

#### Scenario: Frontend shell loads
- **WHEN** developer runs the frontend dev server
- **THEN** an empty React shell loads in the browser with brand fonts and CSS variables applied

### Requirement: MySQL schema is migrated
The backend SHALL run migrations creating tables: `admins`, `categories`, `products`, `product_variants`, `product_images`, `pages`, `lookbook_images`, `site_settings` per `doc/design.md` §4.

#### Scenario: Fresh database migration
- **WHEN** migrations run against an empty MySQL database
- **THEN** all tables exist with indexes on `products.category_id`, `products.status`, `products.price`, `products.name`, `products.is_featured`, and unique `(product_id, size, color)` on `product_variants`

### Requirement: Health check reports database status
**`GET /api/health`** SHALL return `{ "ok": true, "db": "connected" }` when MySQL is reachable.

#### Scenario: Healthy API
- **WHEN** `GET /api/health` is called with DB connected
- **THEN** response status is `200` with `ok: true` and `db: "connected"`

#### Scenario: Database unreachable
- **WHEN** `GET /api/health` is called and MySQL is down
- **THEN** response indicates failure (`ok: false` or non-200) so monitoring can alert

### Requirement: Brand design tokens are loaded
The frontend SHALL load Bebas Neue, Space Grotesk, and Space Mono (with `font-display: swap`) and define CSS color variables from `doc/look-and-feel.md` §2–3.

#### Scenario: Fonts and colors available
- **WHEN** the frontend shell renders
- **THEN** typography and color variables match the look-and-feel spec (dark background, accent colors)
