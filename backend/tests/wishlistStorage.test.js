import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

/**
 * Node unit tests for wishlist pure helpers — use a memory store stand-in.
 */

const memory = { value: null };

globalThis.localStorage = {
  getItem(key) {
    return key === "mashood_wishlist" ? memory.value : null;
  },
  setItem(key, value) {
    if (key === "mashood_wishlist") {
      memory.value = value;
    }
  },
};

globalThis.window = {
  dispatchEvent() {},
};

const {
  readWishlist,
  toggleWishlistEntry,
  removeWishlistEntry,
  writeWishlist,
} = await import("../../frontend/src/utils/wishlistStorage.js");

describe("wishlistStorage", () => {
  beforeEach(() => {
    memory.value = null;
  });

  it("toggles product into and out of wishlist", () => {
    const added = toggleWishlistEntry({
      id: "prod_1",
      slug: "tee",
      name: "Tee",
      price: 1000,
    });
    assert.equal(added.length, 1);
    assert.equal(readWishlist()[0].slug, "tee");

    const removed = toggleWishlistEntry({ id: "prod_1", slug: "tee" });
    assert.equal(removed.length, 0);
  });

  it("removes by id", () => {
    writeWishlist([
      { id: "a", slug: "a" },
      { id: "b", slug: "b" },
    ]);
    const next = removeWishlistEntry("a");
    assert.deepEqual(next.map((e) => e.id), ["b"]);
  });
});
