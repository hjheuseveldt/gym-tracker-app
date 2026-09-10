import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import handler from "./analyze.js";
import { resetLimitStateForTests } from "../_lib/xai.js";

const IMAGE_B64 = "A".repeat(40);

function mockReq(overrides = {}) {
  return {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.9" },
    socket: { remoteAddress: "127.0.0.1" },
    body: {
      mimeType: "image/jpeg",
      imageBase64: IMAGE_B64,
    },
    ...overrides,
  };
}

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end(s) {
      this.body = s == null ? "" : String(s);
    },
  };
}

function xaiOkPayload(usage) {
  const estimate = {
    food_name: "Oatmeal",
    serving_description: "1 bowl",
    calories: 300,
    protein: 10,
    carbs: 50,
    fat: 5,
    confidence: "high",
    notes: "ok",
  };
  return {
    choices: [{ message: { content: JSON.stringify(estimate) } }],
    usage,
  };
}

const origFetch = globalThis.fetch;
const origEnabled = process.env.XAI_ENABLED;
const origKey = process.env.XAI_API_KEY;
const origCap = process.env.XAI_FOOD_SCAN_DAILY_CAP;

beforeEach(() => {
  resetLimitStateForTests();
  process.env.XAI_ENABLED = "1";
  process.env.XAI_API_KEY = "test-key";
  delete process.env.XAI_FOOD_SCAN_DAILY_CAP;
});

afterEach(() => {
  globalThis.fetch = origFetch;
  if (origEnabled == null) delete process.env.XAI_ENABLED;
  else process.env.XAI_ENABLED = origEnabled;
  if (origKey == null) delete process.env.XAI_API_KEY;
  else process.env.XAI_API_KEY = origKey;
  if (origCap == null) delete process.env.XAI_FOOD_SCAN_DAILY_CAP;
  else process.env.XAI_FOOD_SCAN_DAILY_CAP = origCap;
  resetLimitStateForTests();
});

test("POST /api/food/analyze returns estimate plus usage and cost", async () => {
  let fetchCalls = 0;
  let xaiBody;
  globalThis.fetch = async (_url, init) => {
    fetchCalls += 1;
    xaiBody = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify(
          xaiOkPayload({
            prompt_tokens: 800,
            completion_tokens: 80,
            total_tokens: 880,
            prompt_tokens_details: { cached_tokens: 4 },
            completion_tokens_details: { reasoning_tokens: 0 },
          })
        ),
    };
  };

  const res = mockRes();
  await handler(mockReq(), res);
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.estimate.food_name, "Oatmeal");
  assert.equal(body.estimate.calories, 300);
  assert.deepEqual(body.usage, {
    prompt_tokens: 800,
    completion_tokens: 80,
    total_tokens: 880,
    cached_tokens: 4,
    reasoning_tokens: 0,
  });
  assert.equal(body.cost.usd, 0.0012);
  assert.equal(body.cost.model, "grok-4.3");
  assert.deepEqual(body.cost.rates, { inputPerMillion: 1.25, outputPerMillion: 2.5 });
  assert.equal(fetchCalls, 1);
  assert.equal(xaiBody.model, "grok-4.3");
  assert.equal(xaiBody.reasoning_effort, "none");
  assert.equal(xaiBody.max_tokens, 200);
  const imgPart = xaiBody.messages[1].content.find((p) => p.type === "image_url");
  assert.equal(imgPart.image_url.detail, "low");
  assert.doesNotMatch(res.body, /test-key|imageBase64/);
});

test("daily cap returns 429 with DAILY_CAP before calling xAI", async () => {
  process.env.XAI_FOOD_SCAN_DAILY_CAP = "2";
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(xaiOkPayload({ prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 })),
    };
  };

  const first = mockRes();
  await handler(mockReq(), first);
  const second = mockRes();
  await handler(mockReq(), second);
  const third = mockRes();
  await handler(mockReq(), third);

  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.equal(third.statusCode, 429);
  const body = JSON.parse(third.body);
  assert.equal(body.code, "DAILY_CAP");
  assert.match(body.error, /Daily meal scan limit reached/);
  assert.equal(fetchCalls, 2);
});
