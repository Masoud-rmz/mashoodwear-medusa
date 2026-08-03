## ADDED Requirements

### Requirement: Product detail page shows full product information
The product detail page SHALL use a two-column layout with image gallery/zoom, name, price, description, size buttons (S–2XL), color swatches, and stock-aware add-to-cart per `doc/ui-behavior.md` §4.3.

#### Scenario: Product loaded successfully
- **WHEN** user navigates to a valid product URL
- **THEN** product images, name, price (Western commas, no `$`), description, sizes, and colors are displayed

#### Scenario: Image gallery
- **WHEN** product has multiple images
- **THEN** user can browse gallery and zoom primary image

### Requirement: Single product API returns images and variants
**`GET /api/products/:slug`** SHALL return the product with `id`, `slug`, `images` array and `variants: [{ size, color, stock }]`. Returns `404` if slug not found or `inactive`. Admin CRUD continues to use numeric `:id`.

#### Scenario: Valid product fetch
- **WHEN** `GET /api/products/:slug` is called for an active product
- **THEN** response includes product fields and ordered image URLs

#### Scenario: Inactive product hidden
- **WHEN** product status is `inactive`
- **THEN** `GET /api/products/:slug` returns `404`

### Requirement: Variant selection gates add to cart
**Add to Cart** SHALL remain disabled until both size and color are selected. Stock label and button SHALL reflect **selected variant** stock.

#### Scenario: Missing variant selection
- **WHEN** user has not selected size or color
- **THEN** **Add to Cart** button is disabled

#### Scenario: Selected variant sold out (E2E-D-06)
- **WHEN** selected size+color variant has stock 0
- **THEN** button shows sold out for that combination; message "This size and color is sold out."

#### Scenario: All variants sold out
- **WHEN** product status is `out_of_stock`
- **THEN** button shows "Sold out" and is disabled

#### Scenario: Successful add to cart
- **WHEN** user selects an in-stock variant and taps **Add to Cart**
- **THEN** item is added to cart and toast "Added to cart" appears for 2–3 seconds

### Requirement: Product not found and error pages
Invalid product IDs SHALL show a 404 page. Fetch failures SHALL show retry UI.

#### Scenario: Unknown product slug
- **WHEN** user opens `/products/non-existent-slug`
- **THEN** 404 product not found page is shown

#### Scenario: Network error on product fetch
- **WHEN** API is unreachable
- **THEN** error message and retry button appear; cart is unchanged
