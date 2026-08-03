/**
 * Unit tests for Medusa catalog filter helpers (no live API).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyClientSideProductFilters,
  productHasFeaturedTag,
} from "../../frontend/src/api/medusa/catalogFilters.js";

describe("productHasFeaturedTag", () => {
  it("matches featured and new-arrivals tags", () => {
    assert.equal(
      productHasFeaturedTag({ tags: [{ value: "Featured" }] }),
      true
    );
    assert.equal(
      productHasFeaturedTag({ tags: [{ value: "new-arrivals" }] }),
      true
    );
  });

  it("returns false without matching tags", () => {
    assert.equal(productHasFeaturedTag({ tags: [{ value: "sale" }] }), false);
    assert.equal(productHasFeaturedTag({ tags: [] }), false);
    assert.equal(productHasFeaturedTag({}), false);
  });
});

describe("applyClientSideProductFilters", () => {
  const items = [
    {
      id: "1",
      slug: "tee",
      name: "Tee",
      price: 100,
      imageUrl: null,
      variants: [
        { size: "M", color: "Black", stock: 2 },
        { size: "L", color: "Black", stock: 1 },
      ],
      totalStock: 3,
      stockLabel: "In stock",
    },
    {
      id: "2",
      slug: "hoodie",
      name: "Hoodie",
      price: 250,
      imageUrl: null,
      variants: [{ size: "L", color: "White", stock: 4 }],
      totalStock: 4,
      stockLabel: "In stock",
    },
  ];

  it("filters by size L", () => {
    const filtered = applyClientSideProductFilters(items, { size: "L" });
    assert.equal(filtered.length, 2);
  });

  it("filters by color Black", () => {
    const filtered = applyClientSideProductFilters(items, { color: "Black" });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].slug, "tee");
  });

  it("filters by price range", () => {
    const filtered = applyClientSideProductFilters(items, {
      minPrice: 150,
      maxPrice: 300,
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].slug, "hoodie");
  });
});
