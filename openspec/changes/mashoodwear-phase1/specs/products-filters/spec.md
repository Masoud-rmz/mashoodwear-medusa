## ADDED Requirements

### Requirement: Products page displays filterable product grid
The products page (`/products`) SHALL show products in a responsive grid (3 / 2 / 1 columns) with filters for category, size, color, and price range, plus search and pagination per `doc/ui-behavior.md` §4.2.

#### Scenario: Grid layout by viewport
- **WHEN** user views products at 1440px, 768px, and 375px widths
- **THEN** grid shows 3, 2, and 1 columns respectively

#### Scenario: Combined filters
- **WHEN** user selects size L and color Black and applies filters
- **THEN** only products matching both criteria are shown

#### Scenario: Product cards show stock label
- **WHEN** products are listed on `/products`
- **THEN** each card shows a stock label: In stock, Sold out, or Only N left (when totalStock 1–3)

### Requirement: Public products API supports query parameters
**`GET /api/products`** SHALL accept `category`, `size`, `color`, `minPrice`, `maxPrice`, `search`, `collection` (brand collection slug), `page` (default 1), and `limit` (default 12). Response SHALL be `{ ok: true, items: [...], total, page, limit }` with only `active` and `out_of_stock` products.

#### Scenario: Filter by size returns correct set
- **WHEN** `GET /api/products?size=L` is called
- **THEN** all returned items include size L in their sizes array

#### Scenario: Filter by brand collection slug
- **WHEN** `GET /api/products?collection=drift` is called
- **THEN** only products assigned to collection `drift` are returned

#### Scenario: Inactive products hidden
- **WHEN** a product has status `inactive`
- **THEN** it does not appear in public `GET /api/products` results

### Requirement: Categories API feeds filters
**`GET /api/categories`** SHALL return categories sorted by `display_order` for filter UI.

#### Scenario: Categories list
- **WHEN** `GET /api/categories` is called
- **THEN** response includes seed categories (T-Shirts, Hoodies, Pants, Crop, Stickers) when seeded

### Requirement: Mobile filters use bottom sheet
On mobile viewports, filters SHALL open as a bottom sheet with drag handle per `doc/look-and-feel.md` §14.

#### Scenario: Mobile filter panel
- **WHEN** user taps Filters on mobile
- **THEN** filter controls slide up from bottom as a sheet, not a sidebar

### Requirement: Products empty and error states
When no products match filters, UI SHALL show "No products match these filters" with **Clear filters**. Network errors SHALL show retry option.

#### Scenario: No matching products
- **WHEN** filters exclude all products
- **THEN** empty message and clear-filters button appear

#### Scenario: Clear filters resets view
- **WHEN** user taps **Clear filters**
- **THEN** all filter selections reset and full catalog (paginated) reloads

### Requirement: Legacy collection URL redirects
**`/collection`** SHALL redirect with HTTP 301 to **`/products`**.

#### Scenario: Old bookmark
- **WHEN** user opens `/collection`
- **THEN** browser lands on `/products`
