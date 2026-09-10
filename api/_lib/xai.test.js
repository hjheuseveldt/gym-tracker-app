import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeUsage,
  estimateXaiCost,
  foodScanDailyCap,
  dailyCapOrThrow,
  rateLimitOrThrow,
  xaiErrorStatus,
  resetLimitStateForTests,
  GROK_43_RATES,
  DEFAULT_FOOD_SCAN_DAILY_CAP,
} from "./xai.js";

beforeEach(() => {
  resetLimitStateForTests();
  delete process.env.XAI_FOOD_SCAN_DAILY_CAP;
});

test("normalizeUsage maps prompt/completion/total and nested cached/reasoning", () => {
  const usage = normalizeUsage({
    prompt_tokens: 1200,
    completion_tokens: 40,
    total_tokens: 1240,
    prompt_tokens_details: { cached_tokens: 18 },
    completion_tokens_details: { reasoning_tokens: 0 },
  });
  assert.deepEqual(usage, {
    prompt_tokens: 1200,
    completion_tokens: 40,
    total_tokens: 1240,
    cached_tokens: 18,
    reasoning_tokens: 0,
  });
});

test("normalizeUsage fills total_tokens when missing", () => {
  const usage = normalizeUsage({ prompt_tokens: 10, completion_tokens: 5 });
  assert.equal(usage.total_tokens, 15);
});

test("normalizeUsage returns null for empty objects", () => {
  assert.equal(normalizeUsage(null), null);
  assert.equal(normalizeUsage({}), null);
});

test("estimateXaiCost uses grok-4.3 short-context rates", () => {
  const cost = estimateXaiCost(
    { prompt_tokens: 800, completion_tokens: 80, total_tokens: 880 },
    { model: "grok-4.3" }
  );
  // 800 * 1.25 / 1e6 + 80 * 2.5 / 1e6 = 0.0012
  assert.equal(cost.usd, 0.0012);
  assert.equal(cost.model, "grok-4.3");
  assert.deepEqual(cost.rates, {
    inputPerMillion: GROK_43_RATES.inputPerMillion,
    outputPerMillion: GROK_43_RATES.outputPerMillion,
  });
  assert.equal("$" + cost.usd.toFixed(4), "$0.0012");
});

test("foodScanDailyCap defaults to 40 and parses env", () => {
  assert.equal(foodScanDailyCap(), DEFAULT_FOOD_SCAN_DAILY_CAP);
  process.env.XAI_FOOD_SCAN_DAILY_CAP = "12";
  assert.equal(foodScanDailyCap(), 12);
  process.env.XAI_FOOD_SCAN_DAILY_CAP = "0";
  assert.equal(foodScanDailyCap(), DEFAULT_FOOD_SCAN_DAILY_CAP);
  process.env.XAI_FOOD_SCAN_DAILY_CAP = "nope";
  assert.equal(foodScanDailyCap(), DEFAULT_FOOD_SCAN_DAILY_CAP);
});

test("dailyCapOrThrow allows max then 429 DAILY_CAP", () => {
  dailyCapOrThrow("ip", 2);
  dailyCapOrThrow("ip", 2);
  assert.throws(
    () => dailyCapOrThrow("ip", 2),
    (err) => err.code === "DAILY_CAP" && err.status === 429
  );
  assert.equal(xaiErrorStatus({ code: "DAILY_CAP", status: 429 }), 429);
});

test("dailyCapOrThrow is per UTC day", () => {
  const day1 = Date.parse("2026-09-10T23:00:00.000Z");
  const day2 = Date.parse("2026-09-11T00:00:00.000Z");
  dailyCapOrThrow("ip", 1, day1);
  assert.throws(() => dailyCapOrThrow("ip", 1, day1), (err) => err.code === "DAILY_CAP");
  dailyCapOrThrow("ip", 1, day2);
});

test("per-minute rate limit still trips independently", () => {
  rateLimitOrThrow("food:ip", 2, 60_000);
  rateLimitOrThrow("food:ip", 2, 60_000);
  assert.throws(
    () => rateLimitOrThrow("food:ip", 2, 60_000),
    (err) => err.code === "RATE_LIMIT" && err.status === 429
  );
});
