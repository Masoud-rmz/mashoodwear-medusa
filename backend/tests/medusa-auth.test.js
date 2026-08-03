/**
 * Unit tests for auth message map + order row mapper.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { messageForAuthError } from "../../frontend/src/api/medusa/authMessages.js";
import {
  formatCustomerAddressLabel,
  mapCustomerAddressRow,
  mapCustomerAddressToFormValues,
  mapOrderToAccountRow,
} from "../../frontend/src/api/medusa/accountMappers.js";

test("messageForAuthError returns Persian copy for known codes", () => {
  assert.match(messageForAuthError("phone_invalid"), /موبایل/);
  assert.match(messageForAuthError("otp_expired"), /منقضی/);
  assert.match(messageForAuthError("unknown_code"), /ناموفق|ورود/);
});

test("mapOrderToAccountRow flattens Medusa order", () => {
  const row = mapOrderToAccountRow({
    id: "order_1",
    display_id: 42,
    status: "completed",
    created_at: "2026-01-01T00:00:00.000Z",
    total: 150000,
    currency_code: "irt",
    items: [{ quantity: 2 }, { quantity: 1 }],
  });

  assert.equal(row.displayId, 42);
  assert.equal(row.itemCount, 3);
  assert.equal(row.total, 150000);
  assert.equal(row.currencyCode, "IRT");
});

test("mapCustomerAddressRow + form values + label", () => {
  const row = mapCustomerAddressRow({
    id: "caddr_1",
    address_name: "خانه",
    first_name: "Ali",
    last_name: "Karimi",
    phone: "09121234567",
    province: "Tehran",
    city: "Tehran",
    address_1: "Valiasr St",
    postal_code: "1234567890",
    country_code: "ir",
    is_default_shipping: true,
  });

  assert.equal(row.id, "caddr_1");
  assert.equal(row.isDefaultShipping, true);
  assert.match(formatCustomerAddressLabel(row), /خانه/);

  const form = mapCustomerAddressToFormValues({
    first_name: "Ali",
    last_name: "Karimi",
    phone: "09121234567",
    province: "Tehran",
    city: "Tehran",
    address_1: "Valiasr St",
    postal_code: "1234567890",
  });
  assert.equal(form.country_code, undefined);
  assert.equal(form.postal_code, "1234567890");
  assert.equal(form.province, "Tehran");
});
