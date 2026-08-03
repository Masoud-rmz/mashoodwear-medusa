import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractCartLineOptions,
  extractCartLineUnitPrice,
  mapMedusaCartLineItem,
  mapMedusaCartToLineItems,
  sumCartLineQuantities,
} from "../../frontend/src/api/medusa/cartMappers.js";

describe("medusa cart mappers", () => {
  it("extracts size/color from variant_option_values", () => {
    const options = extractCartLineOptions({
      variant_option_values: { Size: "L", Color: "Olive" },
    });
    assert.equal(options.size, "L");
    assert.equal(options.color, "Olive");
  });

  it("falls back to variant_title split", () => {
    const options = extractCartLineOptions({
      variant_title: "M / Black",
    });
    assert.equal(options.size, "M");
    assert.equal(options.color, "Black");
  });

  it("maps unit price and line item ids", () => {
    const line = mapMedusaCartLineItem({
      id: "li_1",
      product_id: "prod_1",
      product_title: "Drift Tee",
      product_handle: "drift-tee",
      thumbnail: "https://example.com/a.jpg",
      quantity: 2,
      unit_price: 450000,
      variant_id: "variant_1",
      variant_option_values: { Size: "M", Color: "Black" },
    });

    assert.equal(line.lineItemId, "li_1");
    assert.equal(line.variantId, "variant_1");
    assert.equal(line.slug, "drift-tee");
    assert.equal(line.price, 450000);
    assert.equal(line.quantity, 2);
    assert.equal(line.selectedSize, "M");
    assert.equal(line.selectedColor, "Black");
  });

  it("derives unit price from subtotal when unit_price missing", () => {
    assert.equal(
      extractCartLineUnitPrice({ subtotal: 900000, quantity: 2 }),
      450000
    );
  });

  it("filters empty quantities and sums badge count", () => {
    const items = mapMedusaCartToLineItems({
      items: [
        {
          id: "li_1",
          product_id: "p1",
          product_title: "A",
          product_handle: "a",
          quantity: 2,
          unit_price: 100,
          variant_id: "v1",
        },
        {
          id: "li_2",
          product_id: "p2",
          product_title: "B",
          product_handle: "b",
          quantity: 0,
          unit_price: 100,
          variant_id: "v2",
        },
      ],
    });

    assert.equal(items.length, 1);
    assert.equal(sumCartLineQuantities(items), 2);
  });
});
