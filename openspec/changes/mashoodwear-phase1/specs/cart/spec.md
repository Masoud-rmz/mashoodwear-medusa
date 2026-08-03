## ADDED Requirements

### Requirement: Cart persists in localStorage
The cart SHALL be stored client-side under key `mashood_cart` as an array of `{ productId, quantity, selectedSize, selectedColor }`. No server cart API in phase 1.

#### Scenario: Cart survives page refresh
- **WHEN** user adds items and refreshes the browser
- **THEN** cart contents are restored from `localStorage`

#### Scenario: Cart item structure
- **WHEN** user adds a product with size L and color Black, quantity 2
- **THEN** cart entry contains `productId`, `quantity: 2`, `selectedSize: "L"`, `selectedColor: "Black"`

### Requirement: Cart page shows line items and totals
The cart page SHALL list each line with image, name, size, color, unit price, quantity controls (+/−), remove action, and **Toman** on line and grand totals.

#### Scenario: Quantity update
- **WHEN** user increases quantity from 1 to 2
- **THEN** line total and grand total update immediately

#### Scenario: Remove item
- **WHEN** user removes the last item
- **THEN** cart shows empty state with **View Products** link

### Requirement: Stock caps quantity in cart
Quantity SHALL not exceed **selected variant** stock (matching `selectedSize` + `selectedColor`). Exceeding stock SHALL show "Requested quantity exceeds available stock."

#### Scenario: Quantity capped to variant stock
- **WHEN** user sets quantity greater than the selected variant's stock
- **THEN** quantity is capped to variant maximum and error message is shown

### Requirement: Checkout entry is gated
**Continue to Checkout** SHALL be disabled when cart is empty.

#### Scenario: Empty cart checkout blocked
- **WHEN** cart has no items and user navigates to checkout
- **THEN** message "Your cart is empty." is shown and checkout actions are blocked (E2E-D-04)

#### Scenario: Non-empty cart proceeds
- **WHEN** cart has at least one item
- **THEN** **Continue to Checkout** navigates to checkout page enabled
