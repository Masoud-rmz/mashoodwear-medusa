import test from "node:test";
import assert from "node:assert/strict";
import { parseRouteId, requireRouteId } from "../src/utils/parseRouteId.js";

test("parseRouteId rejects invalid ids", () => {
  assert.equal(parseRouteId(undefined), null);
  assert.equal(parseRouteId("undefined"), null);
  assert.equal(parseRouteId("new"), null);
  assert.equal(parseRouteId("0"), null);
  assert.equal(parseRouteId("-1"), null);
  assert.equal(parseRouteId("1.5"), null);
  assert.equal(parseRouteId("42"), 42);
});

test("requireRouteId writes 400 for invalid ids", () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  assert.equal(requireRouteId(response, "undefined"), null);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "invalid_id");
});
