import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  clearLegacyLocalCarts,
  clearStoredCartId,
  getStoredCartId,
  LEGACY_CART_STORAGE_KEY,
  LEGACY_CART_STORAGE_KEY_ALT,
  MEDUSA_CART_ID_KEY,
  resetLegacyCartClearFlagForTests,
  setStoredCartId,
} from "../../frontend/src/api/medusa/cartPersistence.js";

/** Minimal localStorage mock for Node tests. */
function setupLocalStorageMock() {
  /** @type {Record<string, string>} */
  const storage = {};
  globalThis.localStorage = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => {
      storage[key] = String(value);
    },
    removeItem: (key) => {
      delete storage[key];
    },
  };
}

describe("medusa cart persistence", () => {
  beforeEach(() => {
    setupLocalStorageMock();
    resetLegacyCartClearFlagForTests();
  });

  it("stores and clears medusa cart id", () => {
    setStoredCartId("cart_abc");
    assert.equal(getStoredCartId(), "cart_abc");
    clearStoredCartId();
    assert.equal(getStoredCartId(), null);
    assert.equal(localStorage.getItem(MEDUSA_CART_ID_KEY), null);
  });

  it("clears legacy mashood_cart keys once", () => {
    localStorage.setItem(
      LEGACY_CART_STORAGE_KEY,
      JSON.stringify([{ productId: 1 }])
    );
    localStorage.setItem(LEGACY_CART_STORAGE_KEY_ALT, "[]");

    clearLegacyLocalCarts();

    assert.equal(localStorage.getItem(LEGACY_CART_STORAGE_KEY), null);
    assert.equal(localStorage.getItem(LEGACY_CART_STORAGE_KEY_ALT), null);
  });
});
