import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAddToCartState } from "../../frontend/src/utils/variantSelection.js";

describe("getAddToCartState", () => {
  const variants = [
    { size: "M", color: "Black", stock: 5 },
    { size: "L", color: "Black", stock: 0 },
  ];

  it("disables button when size and color are not selected", () => {
    const state = getAddToCartState({
      productStatus: "active",
      variants,
      selectedSize: null,
      selectedColor: null,
    });

    assert.equal(state.disabled, true);
    assert.equal(state.label, "ابتدا سایز را انتخاب کنید");
  });

  it("shows Sold out for out_of_stock product status", () => {
    const state = getAddToCartState({
      productStatus: "out_of_stock",
      variants,
      selectedSize: "M",
      selectedColor: "Black",
    });

    assert.equal(state.disabled, true);
    assert.equal(state.label, "Sold out");
  });

  it("shows sold out message for zero-stock variant", () => {
    const state = getAddToCartState({
      productStatus: "active",
      variants,
      selectedSize: "L",
      selectedColor: "Black",
    });

    assert.equal(state.disabled, true);
    assert.equal(state.label, "این ترکیب موجود نیست");
  });

  it("shows Sold out when all variants have zero stock but status is active", () => {
    const state = getAddToCartState({
      productStatus: "active",
      variants: [
        { size: "M", color: "Black", stock: 0 },
        { size: "L", color: "Black", stock: 0 },
      ],
      selectedSize: null,
      selectedColor: null,
    });

    assert.equal(state.disabled, true);
    assert.equal(state.label, "Sold out");
  });

  it("enables add to cart for in-stock variant", () => {
    const state = getAddToCartState({
      productStatus: "active",
      variants,
      selectedSize: "M",
      selectedColor: "Black",
    });

    assert.equal(state.disabled, false);
    assert.equal(state.label, "Add to Cart");
    assert.equal(state.stockLabel, "In stock");
  });

  it("allows size-only products without picking a color UI value", () => {
    const state = getAddToCartState({
      productStatus: "active",
      variants: [{ size: "M", color: "Default", stock: 3 }],
      selectedSize: "M",
      selectedColor: null,
      hasColorOptions: false,
    });

    assert.equal(state.disabled, false);
    assert.equal(state.label, "Add to Cart");
  });
});
