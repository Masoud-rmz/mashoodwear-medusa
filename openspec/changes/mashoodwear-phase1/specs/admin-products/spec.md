## ADDED Requirements

### Requirement: Admin product CRUD API
Authenticated admins SHALL manage products via:

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/products` | List all statuses; supports `search`, `page`, `limit` (default 20) |
| POST | `/api/admin/products` | Create (multipart: images + JSON including `variants`) |
| PUT | `/api/admin/products/:id` | Update (image reorder/delete rules per `doc/design.md` §6.2) |
| DELETE | `/api/admin/products/:id` | Delete product, variants, and image files |

#### Scenario: Create product (E2E-D-02)
- **WHEN** admin creates a product with status `active`, at least one image, and variant rows for each size×color
- **THEN** product appears in admin list and public `GET /api/products`

#### Scenario: Update variant stock (E2E-D-03, E2E-D-06)
- **WHEN** admin sets a variant's stock to 0
- **THEN** that size+color shows sold out on public product detail; other variants unchanged

#### Scenario: Featured product on home (E2E-D-07)
- **WHEN** admin enables `isFeatured` on a product
- **THEN** product can appear in `GET /api/products?featured=true&limit=6` on home

#### Scenario: Delete product
- **WHEN** admin confirms delete
- **THEN** product, variants, and associated image files are removed; product no longer in public catalog

### Requirement: Product form validation
Validation SHALL enforce rules in `doc/design.md` §6.9 including per-variant stock grid. Errors return `400` with per-field messages.

#### Scenario: Missing required fields
- **WHEN** admin submits form without name, category, or complete variant grid
- **THEN** response is `400` with field-specific errors; UI shows "Fill in all required fields."

#### Scenario: Invalid image format
- **WHEN** admin uploads a non-jpg/png/webp file or file over 5 MB
- **THEN** error "Image must be JPG, PNG, or WebP." or size limit message is shown

#### Scenario: Image count limits
- **WHEN** admin uploads more than 5 images or zero on create
- **THEN** validation rejects the submission

### Requirement: Admin product UI
Dashboard SHALL include sidebar (Products, Categories, Pages, Home, Settings), searchable paginated product table, variant stock grid on add/edit form, featured flag, slug field, image reorder/delete, view-on-site link, delete confirmation, save loading, and "Saved" toast.

#### Scenario: Empty product list
- **WHEN** no products exist
- **THEN** admin sees "No products yet — add one"

#### Scenario: Delete confirmation
- **WHEN** admin clicks delete on a product
- **THEN** confirmation dialog appears before permanent deletion
