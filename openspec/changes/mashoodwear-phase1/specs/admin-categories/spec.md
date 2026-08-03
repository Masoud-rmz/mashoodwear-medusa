## ADDED Requirements

### Requirement: Admin category CRUD API
Authenticated admins SHALL manage categories via:

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/categories` | List |
| POST | `/api/admin/categories` | Create `{ name, slug?, displayOrder }` |
| PUT | `/api/admin/categories/:id` | Update name, slug, display_order |
| DELETE | `/api/admin/categories/:id` | Delete if no products reference category |

#### Scenario: Add category
- **WHEN** admin adds category "Jackets" with display order
- **THEN** category appears in admin list and public `GET /api/categories`

#### Scenario: Reorder category
- **WHEN** admin changes `display_order`
- **THEN** public category filter order updates

### Requirement: Category delete guard
DELETE SHALL return `400` with message *"Move or remove products in this category first."* when category contains **any** product (any status).

#### Scenario: Delete blocked
- **WHEN** admin attempts to delete category that has products
- **THEN** API returns `400` and category is not deleted

#### Scenario: Delete allowed
- **WHEN** category has no products
- **THEN** category is deleted

### Requirement: Admin category UI
Admin SHALL provide category list with add, edit name/slug/order, and delete actions.

#### Scenario: Create from UI
- **WHEN** admin creates a new category
- **THEN** it appears in collection filters after save
