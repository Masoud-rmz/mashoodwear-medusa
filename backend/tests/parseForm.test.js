import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseStoredStringArray } from "../src/utils/parseForm.js";

describe("parseStoredStringArray", () => {
  it("parses JSON array strings", () => {
    assert.deepEqual(parseStoredStringArray('["S","M","L"]'), ["S", "M", "L"]);
  });

  it("parses legacy comma-separated values", () => {
    assert.deepEqual(parseStoredStringArray("S,M,L,XL,2XL"), ["S", "M", "L", "XL", "2XL"]);
  });

  it("returns arrays as-is", () => {
    assert.deepEqual(parseStoredStringArray(["Black", "White"]), ["Black", "White"]);
  });
});
