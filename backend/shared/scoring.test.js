import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAssessmentScore,
  calculateAwardablePoints,
  calculateBasePoints,
  getRankForPoints,
  validateRubric,
} from "./scoring.js";

const perfectRubric = {
  conceptualAccuracy: 5,
  reasoning: 5,
  practicalApplication: 5,
  interviewExplanation: 5,
};

test("a perfect rubric produces 100", () => {
  assert.equal(calculateAssessmentScore(perfectRubric).totalScore, 100);
});

test("a zero rubric produces zero", () => {
  assert.equal(
    calculateAssessmentScore({
      conceptualAccuracy: 0,
      reasoning: 0,
      practicalApplication: 0,
      interviewExplanation: 0,
    }).totalScore,
    0
  );
});

test("weighted rubric uses the agreed 30/25/25/20 weights", () => {
  const result = calculateAssessmentScore({
    conceptualAccuracy: 5,
    reasoning: 4,
    practicalApplication: 3,
    interviewExplanation: 2,
  });
  assert.equal(result.totalScore, 73);
});

test("invalid ratings are rejected", () => {
  assert.throws(
    () => validateRubric({ ...perfectRubric, reasoning: 6 }),
    RangeError
  );
  assert.throws(
    () => validateRubric({ ...perfectRubric, reasoning: 2.5 }),
    RangeError
  );
});

test("base points are one point per ten score, capped at ten", () => {
  assert.equal(calculateBasePoints(82), 8);
  assert.equal(calculateBasePoints(9), 0);
  assert.equal(calculateBasePoints(100), 10);
});

test("daily points cap limits awards without changing the score", () => {
  assert.deepEqual(calculateAwardablePoints(82, 18), {
    basePoints: 8,
    awardedPoints: 2,
    pointsAlreadyAwardedToday: 18,
    pointsRemainingToday: 0,
    dailyCap: 20,
  });
});

test("no additional points are awarded after the daily cap", () => {
  assert.equal(calculateAwardablePoints(100, 20).awardedPoints, 0);
});

test("rank boundaries are inclusive at 100 and 500 points", () => {
  assert.equal(getRankForPoints(99).label, "Learner");
  assert.equal(getRankForPoints(100).label, "Amateur");
  assert.equal(getRankForPoints(499).label, "Amateur");
  assert.equal(getRankForPoints(500).label, "Veteran");
});

test("rank result reports distance to the next tier", () => {
  assert.equal(getRankForPoints(82).pointsToNextRank, 18);
  assert.equal(getRankForPoints(500).nextRank, null);
});

test("invalid total points are rejected", () => {
  assert.throws(() => getRankForPoints(-1), RangeError);
  assert.throws(() => getRankForPoints(1.5), RangeError);
});
