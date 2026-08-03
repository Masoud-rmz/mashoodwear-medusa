import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapCartMoneySummary,
  mapCartPromotions,
  mapPromotionErrorMessage,
} from "../../frontend/src/api/medusa/promotionHelpers.js";

describe("promotionHelpers", () => {
  it("maps promotion codes from cart", () => {
    const promotions = mapCartPromotions({
      promotions: [
        { id: "promo_1", code: "SAVE10" },
        { id: "promo_2", code: "  " },
      ],
    });
    assert.deepEqual(promotions, [{ id: "promo_1", code: "SAVE10" }]);
  });

  it("maps money summary with discount", () => {
    const summary = mapCartMoneySummary({
      item_subtotal: 1000000,
      discount_total: 100000,
      shipping_total: 50000,
      tax_total: 90000,
      gift_card_total: 0,
      total: 1040000,
      promotions: [{ id: "p1", code: "SAVE10" }],
    });
    assert.equal(summary.itemSubtotal, 1000000);
    assert.equal(summary.discountTotal, 100000);
    assert.equal(summary.shippingTotal, 50000);
    assert.equal(summary.taxTotal, 90000);
    assert.equal(summary.giftCardTotal, 0);
    assert.equal(summary.total, 1040000);
    assert.equal(summary.promotions[0].code, "SAVE10");
  });

  it("includes tax and gift card in fallback total math", () => {
    const summary = mapCartMoneySummary({
      item_subtotal: 1000,
      discount_total: 100,
      shipping_total: 50,
      tax_total: 80,
      gift_card_total: 20,
    });
    assert.equal(summary.taxTotal, 80);
    assert.equal(summary.giftCardTotal, 20);
    assert.equal(summary.total, 1010);
  });

  it("falls back to item total when cart totals missing", () => {
    const summary = mapCartMoneySummary(null, 420000);
    assert.equal(summary.itemSubtotal, 420000);
    assert.equal(summary.total, 420000);
    assert.equal(summary.discountTotal, 0);
  });

  it("maps invalid promo errors to Persian copy", () => {
    assert.match(
      mapPromotionErrorMessage({ message: "Promotion code not found" }),
      /معتبر نیست/
    );
  });
});
