/**
 * Validates the one overall session score returned by Grok.
 * Grok generates the score; UNSEEN validates and stores it.
 * No local rubric weights, points conversion, daily caps or ranks.
 */

export function validateSessionScore(score) {
  if (typeof score !== "number" || !Number.isInteger(score)) {
    throw new TypeError("Session score must be an integer.");
  }

  if (score < 0 || score > 100) {
    throw new RangeError("Session score must be between 0 and 100.");
  }

  return score;
}
