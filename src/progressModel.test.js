import { test } from "node:test";
import assert from "node:assert/strict";
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
