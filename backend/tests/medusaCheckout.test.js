import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildIranAddressPayload,
  extractCartTotals,
  mapShippingOption,
} from "../../frontend/src/api/medusa/checkoutHelpers.js";
import {
  mapIranAddressFieldErrors,
  messageForCheckoutError,
  messageForIranAddressField,
} from "../../frontend/src/api/medusa/checkoutMessages.js";

describe("checkout address payload", () => {
  it("normalizes postal digits and forces country ir", () => {
    const payload = buildIranAddressPayload({
      first_name: " علی ",
      last_name: "رضایی",
      address_1: "ولیعصر ۱۲",
      city: "تهران",
      province: "Tehran",
      postal_code: "12345-67890",
      phone: "09121234567",
      country_code: "us",
    });

    assert.equal(payload.country_code, "ir");
    assert.equal(payload.postal_code, "1234567890");
    assert.equal(payload.first_name, "علی");
  });
});

describe("checkout error messages", () => {
  it("maps field codes to Persian", () => {
    assert.match(messageForIranAddressField("iran_postal_code_invalid"), /۱۰/);
    const fields = mapIranAddressFieldErrors({
      phone: "iran_phone_invalid",
      province: "iran_province_invalid",
    });
    assert.ok(fields.phone.includes("موبایل"));
    assert.ok(fields.province.includes("استان"));
  });

  it("maps top-level checkout errors", () => {
    assert.ok(messageForCheckoutError("network_error").includes("سرور"));
    assert.ok(messageForCheckoutError("shipping_unavailable").includes("ارسال"));
  });
});

describe("checkout totals and shipping map", () => {
  it("extracts item/shipping/tax/grand totals", () => {
    const totals = extractCartTotals({
      item_subtotal: 1000,
      shipping_total: 200,
      tax_total: 90,
      discount_total: 50,
      gift_card_total: 10,
      total: 1230,
    });
    assert.equal(totals.itemTotal, 1000);
    assert.equal(totals.shippingTotal, 200);
    assert.equal(totals.taxTotal, 90);
    assert.equal(totals.discountTotal, 50);
    assert.equal(totals.giftCardTotal, 10);
    assert.equal(totals.grandTotal, 1230);
  });

  it("maps shipping option amount from calculated_price", () => {
    const option = mapShippingOption({
      id: "so_1",
      name: "ارسال عادی (ایران)",
      calculated_price: { calculated_amount: 150000 },
    });
    assert.equal(option.id, "so_1");
    assert.equal(option.amount, 150000);
  });
});
