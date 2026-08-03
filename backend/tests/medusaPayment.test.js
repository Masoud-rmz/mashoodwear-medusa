import { describe, it } from "node:test";

import assert from "node:assert/strict";

import {

  IRAN_BANK_PROVIDER_ID,

  buildIranBankReturnUrl,

  extractIranBankSessionData,

  extractOrderDisplay,

  findIranBankPaymentSession,

  mapGatewayResultToUiStatus,

} from "../../frontend/src/api/medusa/paymentHelpers.js";

import {

  messageForPaymentError,

  messageForPaymentStatus,

} from "../../frontend/src/api/medusa/paymentMessages.js";



describe("Iran bank payment helpers", () => {

  it("finds Iran bank session by provider id", () => {

    const session = findIranBankPaymentSession({

      payment_sessions: [

        { provider_id: "pp_system_default", data: {} },

        {

          provider_id: IRAN_BANK_PROVIDER_ID,

          data: { redirect_url: "http://localhost:9000/store/iran-bank/stub/pay" },

        },

      ],

    });

    assert.equal(session.provider_id, IRAN_BANK_PROVIDER_ID);

  });



  it("extracts redirect_url, amount_irr, and ref", () => {

    const data = extractIranBankSessionData({

      data: {

        redirect_url: "http://example.com/pay",

        amount_irr: 250000,

        ref: "stub_abc",

      },

    });

    assert.equal(data.redirectUrl, "http://example.com/pay");

    assert.equal(data.amountIrr, 250000);

    assert.equal(data.ref, "stub_abc");

  });



  it("maps gateway result query to UI status", () => {

    assert.equal(mapGatewayResultToUiStatus("success"), "pending_payment");

    assert.equal(mapGatewayResultToUiStatus("fail"), "failed");

    assert.equal(mapGatewayResultToUiStatus("failed"), "failed");

    assert.equal(mapGatewayResultToUiStatus(null), "pending_payment");

  });



  it("builds return URL with optional cart_id", () => {

    const url = buildIranBankReturnUrl("http://localhost:5173", {

      cartId: "cart_123",

    });

    assert.equal(

      url,

      "http://localhost:5173/order/result?cart_id=cart_123"

    );

  });



  it("extracts order display fields", () => {

    const display = extractOrderDisplay({

      id: "order_1",

      display_id: 42,

      total: 90000,

    });

    assert.equal(display.orderId, "order_1");

    assert.equal(display.displayId, 42);

    assert.equal(display.total, 90000);

  });

});



describe("payment status messages", () => {

  it("maps paid / failed / pending to Persian", () => {

    assert.ok(messageForPaymentStatus("paid").includes("موفقیت"));

    assert.ok(messageForPaymentStatus("failed").includes("ناموفق"));

    assert.ok(messageForPaymentStatus("pending_payment").includes("تأیید"));

  });



  it("maps payment error codes", () => {

    assert.ok(messageForPaymentError("redirect_unavailable").includes("درگاه"));

    assert.ok(messageForPaymentError("cart_missing").includes("سبد"));

    assert.ok(messageForPaymentError("config_incomplete").includes("آماده"));

  });

});


