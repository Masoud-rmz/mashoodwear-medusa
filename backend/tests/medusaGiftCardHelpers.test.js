import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapCartGiftCards,
  mapGiftCardErrorMessage,
} from "../../frontend/src/api/medusa/giftCardHelpers.js";

describe("giftCardHelpers", () => {
  it("maps gift cards from cart", () => {
    const cards = mapCartGiftCards({
      gift_cards: [
        { id: "gc_1", code: "GIFT100" },
        { id: "gc_2", code: "  " },
      ],
    });
    assert.deepEqual(cards, [{ id: "gc_1", code: "GIFT100" }]);
  });

  it("maps invalid gift card errors to Persian", () => {
    assert.match(
      mapGiftCardErrorMessage({ message: "Gift card not found" }),
      /معتبر نیست/
    );
  });
});
