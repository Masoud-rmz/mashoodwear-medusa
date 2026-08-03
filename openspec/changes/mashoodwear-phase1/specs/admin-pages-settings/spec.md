## ADDED Requirements

### Requirement: CMS pages are publicly readable
**`GET /api/pages/:slug`** SHALL serve public Markdown content (rendered to safe HTML) for slugs: `about`, `contact`, `how-to-buy`, `lookbook`. Frontend SHALL expose matching routes.

#### Scenario: About page
- **WHEN** user navigates to `/about`
- **THEN** page title and CMS content from API are rendered

#### Scenario: Contact page (phase 1)
- **WHEN** user navigates to `/contact`
- **THEN** CMS body and auto-rendered Instagram/Telegram links from Settings display; no contact form submission

#### Scenario: How to Buy seeded content
- **WHEN** database is seeded
- **THEN** How to Buy page includes: (1) add to cart → checkout, (2) Instagram or copy DM, (3) bank transfer after confirmation, (4) delivery 3–7 business days within Iran — per `doc/ui-behavior.md` §4.6

### Requirement: Lookbook public API
**`GET /api/lookbook`** SHALL return intro content from `pages` (slug `lookbook`) plus `images` array from `lookbook_images`.

#### Scenario: Lookbook grid
- **WHEN** user navigates to `/lookbook`
- **THEN** intro Markdown and uploaded lookbook images display in grid order

### Requirement: Admin can edit CMS pages
**`PUT /api/admin/pages/:slug`** SHALL accept `{ title, content }` (Markdown). Admin UI SHALL provide Markdown editors with preview for About, Contact, How to Buy, and Lookbook intro.

#### Scenario: Edit About from admin
- **WHEN** admin updates About page content and saves
- **THEN** public `/about` reflects new content without redeploy

### Requirement: Admin manages Lookbook images
Authenticated admins SHALL CRUD lookbook images via `/api/admin/lookbook-images` (max 12, jpg/png/webp, 5 MB).

#### Scenario: Upload lookbook image
- **WHEN** admin uploads an image with optional caption
- **THEN** image appears on public `/lookbook` grid

### Requirement: Admin Home content
Admin **Home** section SHALL edit via settings keys: `hero_eyebrow` (optional), `hero_headline`, `hero_subtitle`, `hero_image_1_url`, `hero_image_2_url`, `brand_story_teaser`. **`GET /api/settings/home`** exposes public subset.

#### Scenario: Hero text live on save
- **WHEN** admin updates hero headline and saves
- **THEN** public home hero shows new headline without redeploy

### Requirement: Site settings manage checkout and branding
Admin Settings SHALL edit: `instagram_direct_url`, `telegram_username`, `hero_video_enabled`, `hero_video_url`, `logo_url`. These URLs are the **only** source for purchase links site-wide (hero, checkout, footer, Contact).

**`GET /api/admin/settings`** returns all keys. **`PUT /api/admin/settings`** validates URLs/usernames and accepts logo/hero image uploads.

#### Scenario: Checkout URLs wired to UI
- **WHEN** admin updates Instagram Direct URL
- **THEN** hero **Order on Instagram** and checkout primary CTA use new URL

#### Scenario: Change admin password
- **WHEN** admin submits valid current and new password via Settings
- **THEN** password updates and admin is redirected to login

### Requirement: Public checkout settings subset
**`GET /api/settings/checkout`** SHALL expose only `instagramDirectUrl` and `telegramUsername` — no admin-only keys.

#### Scenario: Public settings isolation
- **WHEN** unauthenticated client calls `GET /api/settings/checkout`
- **THEN** response contains checkout URLs only, not hero video or internal admin config
