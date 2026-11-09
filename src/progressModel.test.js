import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  latestBodyweights,
  buildTimeline,
  formatWeightDelta,
  formatWeightLb,
  storagePathForDate,
  chronologicalPair,
  coverSourceRect,
  scrollLeftForToday,
  latestPhoto,
  captureOutputSize,
  progressFramePlan,
  progressCameraConstraints,
  progressCameraFallbackConstraints,
  progressCameraBoost,
  PROGRESS_PHOTO_JPEG_QUALITY,
  PROGRESS_PHOTO_MAX_EDGE,
  PROGRESS_PHOTO_MIME,
} from "./progressModel.js";

test("latest weigh-in on a day wins", function () {
  var rows = latestBodyweights([
    { log_date: "2026-10-01", bodyweight: 180, updated_at: "2026-10-01T08:00:00Z" },
    { log_date: "2026-10-01", bodyweight: 181.2, updated_at: "2026-10-01T21:00:00Z" },
    { log_date: "2026-09-30", bodyweight: "179.5", updated_at: "2026-09-30T12:00:00Z" },
    { log_date: "2026-10-02", bodyweight: null, updated_at: "2026-10-02T12:00:00Z" },
    { log_date: "bad", bodyweight: 10, updated_at: "2026-10-03T12:00:00Z" },
  ]);
  assert.deepEqual(rows, [
    { day: "2026-09-30", weight: 179.5 },
    { day: "2026-10-01", weight: 181.2 },
  ]);
});

test("timeline is oldest to newest, includes today, and flags photo days", function () {
  var points = buildTimeline(
    [{ log_date: "2026-10-02", bodyweight: 180, updated_at: "a" }],
    [{ photo_date: "2026-10-01", storage_path: "days/2026-10-01-1.jpg" }],
    "2026-10-03"
  );
  assert.deepEqual(
    points.map(function (point) {
      return [point.date, point.weight, point.hasPhoto, point.isToday];
    }),
    [
      ["2026-10-01", null, true, false],
      ["2026-10-02", 180, false, false],
      ["2026-10-03", null, false, true],
    ]
  );
});

test("weight change matches the signed pound example", function () {
  assert.equal(formatWeightDelta(190.4, 182), "-8.4 lb");
  assert.equal(formatWeightDelta(180, 181.25), "+1.3 lb");
  assert.equal(formatWeightDelta(180, null), null);
  assert.equal(formatWeightLb(182), "182 lb");
  assert.equal(formatWeightLb(182.36), "182.4 lb");
});

test("storage paths stay inside the days folder", function () {
  assert.equal(storagePathForDate("2026-10-27", 42), "days/2026-10-27-42.jpg");
  assert.throws(function () {
    storagePathForDate("../secret", 1);
  });
  assert.throws(function () {
    storagePathForDate("2026-10-27", "1/../x");
  });
});

test("compare orders the two days chronologically", function () {
  var pair = chronologicalPair(
    { date: "2026-10-20", weight: 180 },
    { date: "2026-10-01", weight: 188.4 }
  );
  assert.equal(pair.earlier.date, "2026-10-01");
  assert.equal(pair.later.date, "2026-10-20");
  assert.equal(formatWeightDelta(pair.earlier.weight, pair.later.weight), "-8.4 lb");
});

test("cover crop centers a wider camera frame", function () {
  var rect = coverSourceRect(2000, 1000, 300, 400);
  assert.ok(rect);
  assert.equal(rect.sy, 0);
  assert.ok(rect.sx > 0);
  assert.equal(rect.sh, 1000);
});

test("today parks at the right edge", function () {
  assert.equal(scrollLeftForToday(800, 64, 390, 2000), 474);
  assert.equal(scrollLeftForToday(0, 64, 390, 200), 0);
});

test("latest photo is the newest dated row", function () {
  var photo = latestPhoto([
    { photo_date: "2026-10-02", storage_path: "days/b.jpg" },
    { photo_date: "2026-09-01", storage_path: "days/a.jpg" },
  ]);
  assert.equal(photo.photo_date, "2026-10-02");
});

test("progress capture keeps native pixels until the long edge hits 3840", function () {
  assert.equal(PROGRESS_PHOTO_MAX_EDGE, 3840);
  assert.deepEqual(captureOutputSize(1920, 1080), { width: 1920, height: 1080 });
  assert.deepEqual(captureOutputSize(5000, 3000), { width: 3840, height: 2304 });
});

test("a 12MP portrait preview is saved near 3840px as JPEG 0.92", function () {
  var plan = progressFramePlan(3024, 4032, 390, 844);
  assert.ok(plan);
  assert.equal(plan.mime, "image/jpeg");
  assert.equal(PROGRESS_PHOTO_MIME, "image/jpeg");
  assert.equal(plan.quality, 0.92);
  assert.equal(PROGRESS_PHOTO_JPEG_QUALITY, 0.92);
  assert.equal(plan.size.height, 3840);
  assert.notEqual(plan.size.width, 390);
  assert.notEqual(plan.size.height, 844);
  assert.ok(Math.abs(plan.size.width / plan.size.height - 390 / 844) < 0.01);
});

test("a smaller camera crop is not upscaled", function () {
  var plan = progressFramePlan(1280, 720, 390, 700);
  assert.ok(plan);
  assert.equal(plan.size.height, 720);
  assert.ok(plan.size.width < 720);
  assert.equal(progressFramePlan(0, 720, 390, 700), null);
});

test("camera constraints ask for a 12MP still and fall back without audio", function () {
  var rear = progressCameraConstraints("environment");
  assert.equal(rear.audio, false);
  assert.equal(rear.video.facingMode.ideal, "environment");
  assert.equal(rear.video.width.ideal, 4032);
  assert.equal(rear.video.height.ideal, 3024);
  var front = progressCameraConstraints("user");
  assert.equal(front.video.facingMode.ideal, "user");
  assert.deepEqual(progressCameraFallbackConstraints(), { audio: false, video: true });
});

test("camera boost uses the sensor max without exceeding 4032 on an edge", function () {
  assert.deepEqual(progressCameraBoost({ width: { max: 8000 }, height: { max: 6000 } }), {
    width: { ideal: 4032 },
    height: { ideal: 3024 },
  });
  assert.deepEqual(progressCameraBoost({ width: { max: 3840 }, height: { max: 2160 } }), {
    width: { ideal: 3840 },
    height: { ideal: 2160 },
  });
  assert.deepEqual(progressCameraBoost({ width: { max: 1920 }, height: { max: 1080 } }), {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  });
  assert.equal(progressCameraBoost(null), null);
  assert.equal(progressCameraBoost({ width: {}, height: { max: 1080 } }), null);
});

test("bucket limit migration raises progress-photos to 15 MiB and leaves objects alone", function () {
  var dir = new URL("../supabase/migrations/", import.meta.url);
  var names = readdirSync(dir).filter(function (name) {
    return name.endsWith(".sql");
  });
  var original = readFileSync(new URL("20261027120000_progress_photos.sql", dir), "utf8");
  assert.match(original, /8388608/);
  var raised = names.filter(function (name) {
    return name !== "20261027120000_progress_photos.sql" && /progress photo|progress-photos/i.test(readFileSync(new URL(name, dir), "utf8"));
  });
  assert.equal(raised.length, 1);
  var sql = readFileSync(new URL(raised[0], dir), "utf8");
  assert.match(sql, /file_size_limit\s*=\s*15728640/);
  assert.match(sql, /progress-photos/);
  assert.doesNotMatch(sql, /storage\.objects/i);
  assert.doesNotMatch(sql, /progress_photos/i);
  assert.doesNotMatch(sql, /delete\s+from/i);
});
