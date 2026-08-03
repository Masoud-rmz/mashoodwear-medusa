import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  capQuantityToStock,
  isCheckoutEnabled,
  readCart,
  updateLineQuantity,
  writeCart,
} from "../../frontend/src/utils/cartStorage.js";

/** Minimal localStorage mock for Node tests. */
function setupLocalStorageMock() {
  /** @type {Record<string, string>} */
  const storage = {};
  globalThis.localStorage = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => {
      storage[key] = value;
    },
    removeItem: (key) => {
      delete storage[key];
    },
  };
  globalThis.window = {
    dispatchEvent: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

describe("cartStorage", () => {
  beforeEach(() => {
    setupLocalStorageMock();
    writeCart([]);
  });

  it("caps quantity to variant stock", () => {
    const result = capQuantityToStock(5, 2);
    assert.equal(result.quantity, 2);
    assert.equal(result.capped, true);
  });

  it("disables checkout when cart is empty", () => {
    assert.equal(isCheckoutEnabled(readCart()), false);
  });

  it("caps updateLineQuantity to variant stock", () => {
    writeCart([
      {
        productId: 1,
        quantity: 1,
        selectedSize: "M",
        selectedColor: "Black",
        name: "Test",
        price: 100,
        slug: "test",
        imageUrl: null,
        variantStock: 2,
      },
    ]);

    const { capped, cart } = updateLineQuantity(1, "M", "Black", 5);
    assert.equal(capped, true);
    assert.equal(cart[0].quantity, 2);
  });
});
