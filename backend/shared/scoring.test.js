import assert from "node:assert/strict";
import test from "node:test";

import { validateSessionScore } from "./scoring.js";

test("accepts a valid overall session score", () => {
  assert.equal(validateSessionScore(82), 82);
});

test("accepts the lower and upper score boundaries", () => {
  assert.equal(validateSessionScore(0), 0);
  assert.equal(validateSessionScore(100), 100);
});

test("rejects scores outside the 0-100 range", () => {
  assert.throws(() => validateSessionScore(-1), RangeError);
  assert.throws(() => validateSessionScore(101), RangeError);
});

test("rejects non-integer scores", () => {
  assert.throws(() => validateSessionScore(82.5), TypeError);
});

test("rejects strings and missing values", () => {
  assert.throws(() => validateSessionScore("82"), TypeError);
  assert.throws(() => validateSessionScore(null), TypeError);
  assert.throws(() => validateSessionScore(undefined), TypeError);
});
