import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOrderCopyText } from "../../frontend/src/utils/orderCopy.js";

describe("buildOrderCopyText", () => {
  it("writes formatted order text with totals", () => {
    const text = buildOrderCopyText([
      {
        productId: 1,
        quantity: 2,
        selectedSize: "L",
        selectedColor: "Black",
        name: "Street Hoodie Black",
        price: 1850000,
        slug: "street-hoodie-black",
        imageUrl: null,
      },
    ]);

    assert.match(text, /Street Hoodie Black/);
    assert.match(text, /Size: L/);
    assert.match(text, /Color: Black/);
    assert.match(text, /Qty: 2/);
    assert.match(text, /Grand total: 3,700,000 Toman/);
  });
});
