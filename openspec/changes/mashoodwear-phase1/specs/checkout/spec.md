## ADDED Requirements

### Requirement: Checkout displays order summary with Toman totals
The checkout page SHALL show all cart line items with size, color, quantity, unit price, and grand total labeled in **Toman** per `doc/ui-behavior.md` §4.5.

#### Scenario: Order summary visible
- **WHEN** user arrives at checkout with items in cart
- **THEN** full order summary with Toman totals is displayed

### Requirement: Checkout settings API provides purchase channel URLs
**`GET /api/settings/checkout`** SHALL return `{ ok: true, instagramDirectUrl, telegramUsername }` for public checkout. These are the only two purchase channels in phase 1.

#### Scenario: Settings loaded
- **WHEN** checkout page loads
- **THEN** Instagram and Telegram URLs from admin settings are available to CTAs

### Requirement: Primary CTA opens Instagram Direct
**Complete Order on Instagram** SHALL open `instagramDirectUrl` in a new tab. Button SHALL show loading state "Opening Instagram…" while navigating.

#### Scenario: Instagram checkout (E2E-D-01)
- **WHEN** user taps **Complete Order on Instagram**
- **THEN** Instagram Direct opens in a new browser tab

### Requirement: Secondary Telegram fallback
A secondary link **Or order via Telegram** SHALL open `https://t.me/{telegramUsername}`.

#### Scenario: Telegram fallback link
- **WHEN** user taps Telegram link
- **THEN** Telegram chat with configured username opens in new tab

### Requirement: Copy order details for DM
**Copy order details for DM** SHALL write formatted plain text (product name, size, color, qty, unit price, line total, grand total) to clipboard and show success toast.

#### Scenario: Clipboard copy
- **WHEN** user taps **Copy order details for DM**
- **THEN** clipboard contains correctly formatted order text and confirmation toast appears

### Requirement: Checkout error handling
If Instagram link fails, UI SHALL show error with Telegram and Contact page links. Empty cart SHALL redirect with "Your cart is empty."

#### Scenario: Instagram link failure
- **WHEN** Instagram URL is invalid or blocked
- **THEN** error message appears with Telegram and Contact alternatives

#### Scenario: How to Buy link
- **WHEN** How to Buy page exists (phase 9)
- **THEN** checkout includes link to `/how-to-buy` for payment/delivery FAQ
