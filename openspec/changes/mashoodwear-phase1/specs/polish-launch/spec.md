## ADDED Requirements

### Requirement: Accessibility baseline
All pages SHALL pass keyboard navigation: Tab order, Enter/Space activation, Escape to close mobile menu and filter bottom sheet.

#### Scenario: Mobile menu keyboard
- **WHEN** user opens hamburger menu and presses Escape
- **THEN** menu closes (same as home-page spec)

#### Scenario: Bottom sheet keyboard
- **WHEN** collection filter bottom sheet is open and user presses Escape
- **THEN** sheet closes

### Requirement: SEO metadata and crawl files
The site SHALL set dynamic `<title>` and meta description on home, collection, category, and product pages. **`sitemap.xml`** SHALL list active products only. **`robots.txt`** SHALL disallow `/admin` and `/api`.

#### Scenario: Product page meta
- **WHEN** user views a product detail page
- **THEN** document title and meta description include product name

#### Scenario: Sitemap excludes inactive
- **WHEN** crawler fetches `sitemap.xml`
- **THEN** only `active` products are listed; `inactive` products omitted

### Requirement: Security hardening before launch
Backend SHALL sanitize inputs against XSS/SQLi. Image uploads SHALL enforce 5 MB limit and MIME validation. DB indexes on `category_id`, `status`, `price`, `name` SHALL exist.

#### Scenario: Upload MIME rejection
- **WHEN** client uploads a file with disallowed MIME type
- **THEN** server rejects with appropriate error

#### Scenario: Admin paths blocked from crawlers
- **WHEN** crawler reads `robots.txt`
- **THEN** `/admin` and `/api` are disallowed

### Requirement: Visual and responsive QA
All pages SHALL pass `doc/look-and-feel.md` §16 checklist and manual responsive review at 375, 768, 1024, and 1440 px widths.

#### Scenario: Responsive layout pass
- **WHEN** each public and admin page is viewed at four breakpoints
- **THEN** layout remains usable with no horizontal overflow or clipped CTAs

### Requirement: E2E regression suite
Playwright (or equivalent) E2E tests SHALL cover E2E-D-01 through E2E-D-05 and pass before deploy.

#### Scenario: Full regression green
- **WHEN** E2E suite runs against staging environment
- **THEN** all five critical paths pass without failure

#### Scenario: Lighthouse spot-check
- **WHEN** Lighthouse runs on home and product pages
- **THEN** performance, accessibility, and SEO scores are reviewed and blockers addressed
