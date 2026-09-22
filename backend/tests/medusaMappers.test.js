/**
 * Unit tests for Medusa → Mashhoodwear product mappers.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMedusaAssetUrl } from "../../frontend/src/api/medusa/assetUrl.js";
import {
  buildStockLabel,
  extractProductAttributes,
  extractVariantOptions,
  extractVariantPrice,
  mapMedusaCollection,
  mapMedusaProductToDetail,
  mapMedusaProductToItem,
  mapMedusaVariant,
} from "../../frontend/src/api/medusa/mappers.js";

describe("buildStockLabel", () => {
  it("marks zero as sold out", () => {
    assert.equal(buildStockLabel(0), "Sold out");
  });

  it("uses low-stock wording", () => {
    assert.equal(buildStockLabel(2), "Only 2 left");
  });

  it("marks available stock", () => {
    assert.equal(buildStockLabel(10), "In stock");
  });
});

describe("extractVariantOptions", () => {
  it("reads Size and Color option titles", () => {
    const result = extractVariantOptions({
      options: [
        { value: "M", option: { title: "Size" } },
        { value: "Black", option: { title: "Color" } },
      ],
    });
    assert.deepEqual(result, {
      size: "M",
      color: "Black",
      height: "",
      hasColorOption: true,
      hasSizeOption: true,
      hasHeightOption: false,
      extraOptions: {},
    });
  });

  it("reads Height / قد option titles", () => {
    const result = extractVariantOptions({
      options: [
        { value: "M", option: { title: "Size" } },
        { value: "180", option: { title: "قد" } },
        { value: "Black", option: { title: "Color" } },
      ],
    });
    assert.equal(result.size, "M");
    assert.equal(result.height, "180");
    assert.equal(result.color, "Black");
    assert.equal(result.hasHeightOption, true);
  });

  it("falls back to variant title for size-only products", () => {
    const result = extractVariantOptions({
      title: "L",
      options: [{ value: "L", option: { title: "Size" } }],
    });
    assert.equal(result.size, "L");
    assert.equal(result.color, "Default");
    assert.equal(result.hasColorOption, false);
    assert.equal(result.hasSizeOption, true);
  });

  it("resolves titles via product option id map when nested option missing", () => {
    const optionTitleById = new Map([
      ["opt_size", "Size"],
      ["opt_color", "رنگ"],
    ]);
    const result = extractVariantOptions(
      {
        options: [
          { value: "XL", option_id: "opt_size" },
          { value: "کرم", option_id: "opt_color" },
        ],
      },
      optionTitleById
    );
    assert.equal(result.size, "XL");
    assert.equal(result.color, "کرم");
    assert.equal(result.hasColorOption, true);
  });

  it("maps unlabeled two-option variants as size then color", () => {
    const result = extractVariantOptions({
      options: [{ value: "S" }, { value: "Navy" }],
    });
    assert.equal(result.size, "S");
    assert.equal(result.color, "Navy");
    assert.equal(result.hasColorOption, true);
  });

  it("inherits fallback color for size-only variants under multi-color product", () => {
    const result = extractVariantOptions(
      {
        title: "M",
        options: [{ value: "M", option: { title: "Size" } }],
      },
      undefined,
      {
        productColorValues: ["blue", "red", "White"],
        fallbackColor: "White",
      }
    );
    assert.equal(result.size, "M");
    assert.equal(result.color, "White");
    assert.equal(result.hasColorOption, true);
  });

  it("parses size/color from variant title", () => {
    const result = extractVariantOptions({
      title: "S / Black",
      options: [],
    });
    assert.equal(result.size, "S");
    assert.equal(result.color, "Black");
    assert.equal(result.hasColorOption, true);
  });

  it("parses size/height/color from three-part variant title", () => {
    const result = extractVariantOptions({
      title: "M / 180 / Black",
      options: [],
    });
    assert.equal(result.size, "M");
    assert.equal(result.height, "180");
    assert.equal(result.color, "Black");
    assert.equal(result.hasHeightOption, true);
    assert.equal(result.hasColorOption, true);
  });

  it("uses product option kinds so Size+قد are not treated as Size+Color", () => {
    const result = extractVariantOptions(
      {
        title: "L / 175",
        options: [{ value: "L" }, { value: "175" }],
      },
      undefined,
      { productOptionKinds: ["size", "height"] }
    );
    assert.equal(result.size, "L");
    assert.equal(result.height, "175");
    assert.equal(result.hasHeightOption, true);
    assert.equal(result.hasColorOption, false);
    assert.equal(result.color, "Default");
  });
});

describe("extractVariantPrice", () => {
  it("falls back to prices[] when calculated_price missing", () => {
    assert.equal(
      extractVariantPrice({
        prices: [{ amount: 520000, currency_code: "irt" }],
      }),
      520000
    );
  });

  it("prefers calculated_amount over prices[]", () => {
    assert.equal(
      extractVariantPrice({
        calculated_price: { calculated_amount: 100 },
        prices: [{ amount: 999 }],
      }),
      100
    );
  });
});

describe("mapMedusaProduct color facets", () => {
  it("exposes product.option colors even when some variants lack color link", () => {
    const detail = mapMedusaProductToDetail({
      id: "prod_1",
      title: "Sweatshirt",
      handle: "sweatshirt",
      options: [
        {
          id: "opt_size",
          title: "Size",
          values: [{ value: "M" }],
        },
        {
          id: "opt_color",
          title: "Color",
          values: [{ value: "blue" }, { value: "White" }],
        },
      ],
      variants: [
        {
          id: "v1",
          title: "M",
          manage_inventory: true,
          inventory_quantity: 3,
          options: [
            {
              value: "M",
              option_id: "opt_size",
              option: { title: "Size" },
            },
          ],
          calculated_price: { calculated_amount: 100 },
        },
      ],
    });
    assert.equal(detail.hasColorOptions, true);
    assert.ok(detail.colors.includes("White"));
    assert.ok(detail.colors.includes("blue"));
    assert.equal(detail.variants[0].color, "White");
  });
});

describe("mapMedusaVariant + product item", () => {
  it("prefixes root-relative Medusa file URLs with the backend origin", () => {
    const item = mapMedusaProductToItem({
      id: "prod_img",
      title: "Local file",
      handle: "local-file",
      thumbnail: "/static/tee.jpg",
      images: [{ url: "/static/tee.jpg" }],
      variants: [],
    });
    assert.equal(item.imageUrl, "http://localhost:9000/static/tee.jpg");
  });

  it("rewrites loopback Medusa file URLs onto the public storefront origin", () => {
    assert.equal(
      resolveMedusaAssetUrl(
        "http://localhost:9000/static/tee.jpg",
        "https://mashoodwear.ir",
      ),
      "https://mashoodwear.ir/static/tee.jpg",
    );
  });

  const sampleProduct = {
    id: "prod_1",
    title: "Demo Tee",
    handle: "demo-tee",
    thumbnail: "https://example.com/tee.png",
    description: "Soft cotton",
    images: [{ url: "https://example.com/tee.png" }],
    variants: [
      {
        id: "variant_1",
        title: "M",
        manage_inventory: true,
        inventory_quantity: 2,
        options: [{ value: "M", option: { title: "Size" } }],
        calculated_price: {
          calculated_amount: 450000,
          currency_code: "irt",
        },
      },
      {
        id: "variant_2",
        title: "L",
        manage_inventory: true,
        inventory_quantity: 0,
        options: [{ value: "L", option: { title: "Size" } }],
        calculated_price: {
          calculated_amount: 450000,
          currency_code: "irt",
        },
      },
    ],
  };

  it("maps IRT price and variant id", () => {
    const variant = mapMedusaVariant(sampleProduct.variants[0]);
    assert.equal(variant.variantId, "variant_1");
    assert.equal(variant.price, 450000);
    assert.equal(variant.stock, 2);
    assert.equal(extractVariantPrice(sampleProduct.variants[0]), 450000);
  });

  it("maps list item with stock label", () => {
    const item = mapMedusaProductToItem(sampleProduct);
    assert.equal(item.slug, "demo-tee");
    assert.equal(item.price, 450000);
    assert.equal(item.totalStock, 2);
    assert.equal(item.stockLabel, "Only 2 left");
    assert.equal(item.variants[0].variantId, "variant_1");
  });

  it("maps detail with published status when stock remains", () => {
    const detail = mapMedusaProductToDetail(sampleProduct);
    assert.equal(detail.status, "published");
    assert.equal(detail.description, "Soft cotton");
    assert.ok(detail.images.includes("https://example.com/tee.png"));
  });

  it("marks detail out_of_stock when all variants empty", () => {
    const empty = {
      ...sampleProduct,
      variants: sampleProduct.variants.map((variant) => ({
        ...variant,
        inventory_quantity: 0,
      })),
    };
    const detail = mapMedusaProductToDetail(empty);
    assert.equal(detail.status, "out_of_stock");
    assert.equal(detail.stockLabel, "Sold out");
  });

  it("maps Admin ویژگی‌ها physical attributes onto detail", () => {
    const detail = mapMedusaProductToDetail({
      ...sampleProduct,
      height: 32,
      width: 666.32,
      length: 23,
      weight: 3,
    });
    assert.deepEqual(detail.attributes, {
      height: 32,
      width: 666.32,
      length: 23,
      weight: 3,
      hsCode: "",
      midCode: "",
      originCountry: "",
    });
  });

  it("exposes per-variant physical attributes and price range", () => {
    const detail = mapMedusaProductToDetail({
      ...sampleProduct,
      variants: [
        {
          ...sampleProduct.variants[0],
          height: 10,
          calculated_price: { calculated_amount: 400000 },
        },
        {
          ...sampleProduct.variants[1],
          height: 20,
          inventory_quantity: 2,
          calculated_price: { calculated_amount: 550000 },
        },
      ],
    });
    assert.equal(detail.price, 400000);
    assert.equal(detail.priceMax, 550000);
    assert.equal(detail.variants[0].attributes.height, 10);
    assert.equal(detail.variants[1].attributes.height, 20);
    assert.ok(detail.sizes.includes("M"));
    assert.ok(detail.sizes.includes("L"));
  });
});

describe("extractProductAttributes", () => {
  it("falls back to first variant when product fields empty", () => {
    const attrs = extractProductAttributes({
      variants: [{ height: 10, width: 20, length: 30, weight: 1 }],
    });
    assert.equal(attrs.height, 10);
    assert.equal(attrs.width, 20);
    assert.equal(attrs.length, 30);
    assert.equal(attrs.weight, 1);
  });
});

describe("mapMedusaCollection", () => {
  it("maps cover from metadata.cover_image_url", () => {
    const item = mapMedusaCollection(
      {
        id: "pcol_1",
        title: "Drift",
        handle: "drift",
        metadata: {
          cover_image_url: "https://example.com/drift-cover.jpg",
          description: "Street drop",
        },
      },
      3
    );
    assert.equal(item.id, "pcol_1");
    assert.equal(item.name, "Drift");
    assert.equal(item.slug, "drift");
    assert.equal(item.coverImageUrl, "https://example.com/drift-cover.jpg");
    assert.equal(item.description, "Street drop");
    assert.equal(item.productCount, 3);
  });

  it("falls back to thumbnail when metadata cover missing", () => {
    const item = mapMedusaCollection({
      id: "pcol_2",
      title: "Urban Night",
      handle: "urban-night",
      thumbnail: "https://example.com/urban.jpg",
      metadata: null,
    });
    assert.equal(item.coverImageUrl, "https://example.com/urban.jpg");
    assert.equal(item.description, "");
  });
});
