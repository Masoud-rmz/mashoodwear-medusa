## ADDED Requirements

### Requirement: Admin brand collections CRUD API
Authenticated admins SHALL manage brand collections via:

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/collections` | List all (including inactive) with productCount |
| POST | `/api/admin/collections` | Create with cover image + `{ name, slug?, description?, displayOrder?, isActive?, productIds? }` |
| PUT | `/api/admin/collections/:id` | Update metadata, cover, productIds |
| DELETE | `/api/admin/collections/:id` | Delete collection, junction rows, cover file |

Per `doc/design.md` §4.8–4.9, §6.3.2.

#### Scenario: Add collection Drift
- **WHEN** admin creates collection "Drift" with cover image
- **THEN** collection appears in admin list and public `GET /api/collections` when active

#### Scenario: Assign products to collection
- **WHEN** admin sets `productIds: [1, 2, 3]` on collection edit
- **THEN** those products appear on `GET /api/collections/drift` and `GET /api/products?collection=drift`

#### Scenario: Assign from product form
- **WHEN** admin sets `collectionIds: [2]` on product save
- **THEN** product appears in collection id 2 on public collection detail

#### Scenario: Delete collection with products
- **WHEN** admin deletes collection that has assigned products
- **THEN** collection and junction rows are removed; products remain in catalog

### Requirement: Admin collections UI
Admin SHALL provide collections list and add/edit form per `doc/ui-behavior.md` §4.7.

#### Scenario: Collection form fields
- **WHEN** admin opens add/edit collection
- **THEN** form includes name, slug, description, display order, active toggle, cover upload, and product multi-select

#### Scenario: View on site
- **WHEN** admin saves active collection with slug `drift`
- **THEN** **View on site** opens `/collections/drift` in new tab

### Requirement: Product form collection assignment
Admin product create/edit SHALL include **Collections** multi-select syncing `collectionIds` with `product_collections` junction table.

#### Scenario: Product in multiple collections
- **WHEN** admin assigns one product to Drift and Urban Night
- **THEN** product appears on both collection detail pages
