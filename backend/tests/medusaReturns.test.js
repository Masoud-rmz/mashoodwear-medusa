import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapReturnErrorMessage } from "../../frontend/src/api/medusa/returnsHelpers.js";

describe("returns helpers", () => {
  it("maps shipping option errors", () => {
    assert.match(
      mapReturnErrorMessage({ message: "No shipping option" }),
      /ارسال مرجوعی/
    );
  });
});
