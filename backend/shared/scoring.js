/**
 * UNSEEN assessment scoring and learner progression.
 *
 * Grok may suggest rubric ratings and cite evidence, but it never chooses points or rank.
 * This module validates ratings and calculates those values deterministically in our backend.
 */

export const RUBRIC_WEIGHTS = Object.freeze({
  conceptualAccuracy: 30,
  reasoning: 25,
  practicalApplication: 25,
  interviewExplanation: 20,
});

export const POINTS_POLICY = Object.freeze({
  pointsPerTenScore: 1,
  maxPointsPerAssessment: 10,
  maxPointsPerUtcDay: 20,
});

// Only tiers already discussed for the first release are defined here.
// Higher tiers can be added after the progression rules are agreed.
export const RANK_THRESHOLDS = Object.freeze([
  Object.freeze({ id: "learner", label: "Learner", minPoints: 0 }),
  Object.freeze({ id: "amateur", label: "Amateur", minPoints: 100 }),
  Object.freeze({ id: "veteran", label: "Veteran", minPoints: 500 }),
]);

const RUBRIC_KEYS = Object.keys(RUBRIC_WEIGHTS);

/**
 * Rejects malformed model output before it can affect an official assessment.
 * Each rubric dimension must be an integer from 0 through 5.
 */
export function validateRubric(rubric) {
  if (!rubric || typeof rubric !== "object" || Array.isArray(rubric)) {
    throw new TypeError("Rubric must be an object.");
  }

  for (const key of RUBRIC_KEYS) {
    const rating = rubric[key];
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      throw new RangeError(`Rubric dimension "${key}" must be an integer from 0 to 5.`);
    }
  }

  return Object.fromEntries(RUBRIC_KEYS.map((key) => [key, rubric[key]]));
}

/**
 * Converts four 0-5 ratings into a weighted integer score from 0 to 100.
 */
export function calculateAssessmentScore(rubric) {
  const validated = validateRubric(rubric);

  const breakdown = Object.fromEntries(
    RUBRIC_KEYS.map((key) => [
      key,
      {
        rating: validated[key],
        earned: validated[key] * (RUBRIC_WEIGHTS[key] / 5),
        possible: RUBRIC_WEIGHTS[key],
      },
    ])
  );

  const totalScore = RUBRIC_KEYS.reduce(
    (total, key) => total + breakdown[key].earned,
    0
  );

  return {
    rubric: validated,
    breakdown,
    totalScore,
    maxScore: 100,
  };
}

/**
 * Calculates the session's base points from its final assessment score.
 * This is the initial product policy and is intentionally kept configurable.
 */
export function calculateBasePoints(score) {
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new RangeError("Assessment score must be an integer from 0 to 100.");
  }

  return Math.min(
    POINTS_POLICY.maxPointsPerAssessment,
    Math.floor(score / 10) * POINTS_POLICY.pointsPerTenScore
  );
}

/**
 * Applies the UTC daily cap. The caller must read the user's daily points item
 * and use a conditional DynamoDB transaction when recording this award.
 */
export function calculateAwardablePoints(score, pointsAlreadyAwardedToday = 0) {
  if (
    !Number.isInteger(pointsAlreadyAwardedToday) ||
    pointsAlreadyAwardedToday < 0
  ) {
    throw new RangeError("Daily points already awarded must be a non-negative integer.");
  }

  const basePoints = calculateBasePoints(score);
  const remainingDailyAllowance = Math.max(
    0,
    POINTS_POLICY.maxPointsPerUtcDay - pointsAlreadyAwardedToday
  );
  const awardedPoints = Math.min(basePoints, remainingDailyAllowance);

  return {
    basePoints,
    awardedPoints,
    pointsAlreadyAwardedToday,
    pointsRemainingToday: remainingDailyAllowance - awardedPoints,
    dailyCap: POINTS_POLICY.maxPointsPerUtcDay,
  };
}

/** Returns the highest rank threshold reached by a learner's lifetime points. */
export function getRankForPoints(totalPoints) {
  if (!Number.isInteger(totalPoints) || totalPoints < 0) {
    throw new RangeError("Total points must be a non-negative integer.");
  }

  let currentRank = RANK_THRESHOLDS[0];
  for (const rank of RANK_THRESHOLDS) {
    if (totalPoints >= rank.minPoints) currentRank = rank;
  }

  const nextRank =
    RANK_THRESHOLDS.find((rank) => rank.minPoints > totalPoints) ?? null;

  return {
    ...currentRank,
    totalPoints,
    nextRank,
    pointsToNextRank: nextRank ? nextRank.minPoints - totalPoints : null,
  };
}
