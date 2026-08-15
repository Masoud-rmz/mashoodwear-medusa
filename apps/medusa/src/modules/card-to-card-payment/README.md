# card-to-card-payment

Offline card transfer payment for Mashoodwear storefront.

**Provider ID:** `pp_card-to-card_card-to-card`

## Buyer flow

1. Buyer selects card-to-card, sees admin card number, and taps **ثبت سفارش**.
2. Cart completes with an **authorized** (not yet captured) payment → order is created.
3. Buyer sends the transfer receipt on Instagram/Telegram (with register number).
4. Tracking code is **not** shown yet.

## Admin manual approval (Medusa Admin)

1. Open **Orders** → the new order.
2. Verify the receipt from Instagram/Telegram.
3. **Capture payment** (تأیید / دریافت وجه) on the order payment.
4. After capture, storefront shows `display_id` as **کد پیگیری** on Account / order detail.

The provider authorizes immediately so the cart can complete; capture stays a manual staff action.
