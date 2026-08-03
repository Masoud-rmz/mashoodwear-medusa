## ADDED Requirements

### Requirement: Home page shows brand entry experience
The home page SHALL display a sticky header, minimal hero (black base with subtle maroon fade, no video), new arrivals section, brand story teaser, and footer per `doc/ui-behavior.md` §4.1.

#### Scenario: First visit impression
- **WHEN** a customer opens the site URL
- **THEN** header with image logo (hover zoom), nav (Home · Collections · Products · Lookbook · About · Contact), and cart icon are visible

#### Scenario: Hero minimal default
- **WHEN** hero video is disabled in settings (default)
- **THEN** hero shows black base with subtle faded maroon overlay, two-column layout (text left, two model image slots side by side); no autoplay video

#### Scenario: Hero content from settings
- **WHEN** home page loads
- **THEN** hero eyebrow (optional), headline, subtitle, and model images come from `GET /api/settings/home` (with documented defaults if unset; eyebrow hidden when empty)

#### Scenario: New arrivals featured products
- **WHEN** home page loads and featured products exist
- **THEN** up to 6 products from `GET /api/products?featured=true&limit=6` display; backfill with newest active products if fewer than 4 featured

### Requirement: Header logo and mobile navigation
The header SHALL use an **image logo** with hover zoom in/out (`scale(1)` → `scale(1.08)` on hover); fallback text **MASHHOOD** if image fails to load. Mobile SHALL use a hamburger menu that closes on Escape.

#### Scenario: Logo fallback
- **WHEN** no logo is configured in site settings
- **THEN** header displays text **MASHHOOD** instead of a broken image

#### Scenario: Mobile menu accessibility
- **WHEN** user opens hamburger menu on viewport ≤768px and presses Escape
- **THEN** menu closes and focus returns appropriately

### Requirement: Loading, empty, and error states on home
Product sections SHALL show skeleton cards while loading. Empty and error states SHALL offer recovery actions.

#### Scenario: Loading skeletons
- **WHEN** new arrivals are fetching
- **THEN** skeleton product cards appear until data loads

#### Scenario: Empty catalog
- **WHEN** no products are returned
- **THEN** message "Nothing to show right now — check back soon" and **Try again** button appear

#### Scenario: Fetch error
- **WHEN** API request fails
- **THEN** message "Couldn't load data — refresh the page" and refresh button appear

### Requirement: Scroll animations respect reduced motion
Section fade-in on scroll SHALL use `IntersectionObserver` and SHALL be disabled when `prefers-reduced-motion: reduce`.

#### Scenario: Reduced motion preference
- **WHEN** user has `prefers-reduced-motion: reduce`
- **THEN** no scroll fade-in animations run
