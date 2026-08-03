## ADDED Requirements

### Requirement: Collections list page
The public site SHALL provide `/collections` showing active brand collections in a responsive grid per `doc/ui-behavior.md` §4.2-A and `doc/look-and-feel.md` §8-A.

#### Scenario: Collection card content
- **WHEN** user views `/collections`
- **THEN** each card shows cover image, collection name, and optional "N pieces" subtitle

#### Scenario: Navigate to collection detail
- **WHEN** user taps collection card for slug `drift`
- **THEN** user navigates to `/collections/drift`

#### Scenario: Empty collections list
- **WHEN** no active collections exist
- **THEN** UI shows "No collections yet — check back soon"

### Requirement: Collection detail page
**`/collections/:slug`** SHALL show collection name, optional description, and a product grid of assigned products only per `doc/ui-behavior.md` §4.2-B.

#### Scenario: Products with stock labels
- **WHEN** user views `/collections/drift` with assigned products
- **THEN** each product card shows image, name, price, and stock label (In stock / Sold out / Only N left)

#### Scenario: Open product from collection
- **WHEN** user taps a product card on collection detail
- **THEN** user navigates to `/products/:slug` product detail page

#### Scenario: Empty collection
- **WHEN** collection has no assigned products
- **THEN** UI shows "No pieces in this collection yet" with link to Products

#### Scenario: Inactive or missing collection
- **WHEN** slug does not exist or collection is inactive
- **THEN** 404 with "Collection not found" and link back to Collections

### Requirement: Public collections API
**`GET /api/collections`** SHALL return active collections sorted by `display_order` with `{ id, name, slug, coverImageUrl, productCount }`.

**`GET /api/collections/:slug`** SHALL return collection metadata and `products[]` matching public product list shape including `totalStock` and `stockLabel`.

#### Scenario: List active only
- **WHEN** admin sets collection `is_active` to false
- **THEN** collection does not appear in `GET /api/collections` or public `/collections/:slug`

#### Scenario: Product count
- **WHEN** collection Drift has 3 active or out_of_stock products assigned
- **THEN** `productCount` is 3 on list and detail responses

#### Scenario: Seed collections
- **WHEN** database migrations run on fresh install
- **THEN** seed data includes collections **Drift** (`drift`) and **Urban Night** (`urban-night`) per `doc/design.md` §4.8
