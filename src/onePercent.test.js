import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ICON_ONE_PERCENT,
  ONE_PERCENT_DEFAULT_FOCUS,
  ONE_PERCENT_HISTORY_ORIGIN,
  ALL_SCHEDULED_DAYS,
  formatOnePercentTitle,
  parseFocusFromName,
  isOnePercentHabit,
  ensureOnePercentHabit,
  resolveFocusForDate,
  displayHabitNameOnDate,
  applyFocusChange,
} from "./onePercent.js";

test("formatOnePercentTitle prefixes 1%: and trims focus", () => {
  assert.equal(formatOnePercentTitle("No Caffeine"), "1%: No Caffeine");
  assert.equal(formatOnePercentTitle("  Meditation  "), "1%: Meditation");
  assert.equal(formatOnePercentTitle(""), "1%: " + ONE_PERCENT_DEFAULT_FOCUS);
  assert.equal(formatOnePercentTitle(null), "1%: " + ONE_PERCENT_DEFAULT_FOCUS);
});

test("parseFocusFromName reads current focus from title", () => {
  assert.equal(parseFocusFromName("1%: No Caffeine"), "No Caffeine");
  assert.equal(parseFocusFromName("1%:Meditation"), "Meditation");
  assert.equal(parseFocusFromName("1% :  Cold showers"), "Cold showers");
  assert.equal(parseFocusFromName(""), ONE_PERCENT_DEFAULT_FOCUS);
});

test("isOnePercentHabit matches reserved spark icon", () => {
  assert.equal(isOnePercentHabit({ id: 5, icon: ICON_ONE_PERCENT, name: "1%: No Caffeine" }), true);
  assert.equal(isOnePercentHabit({ id: 3, icon: "gym", name: "Gym" }), false);
  assert.equal(isOnePercentHabit({ id: 4, icon: "wake", name: "Wake 5–5:30" }), false);
});

test("ensureOnePercentHabit seeds default 1% when missing and keeps gym/wake", () => {
  var gym = { id: 3, name: "Gym", icon: "gym", scheduledDays: [1, 2, 3, 4, 5] };
  var wake = { id: 4, name: "Wake 5–5:30", icon: "wake", scheduledDays: [0, 1, 2, 3, 4, 5, 6] };
  var out = ensureOnePercentHabit([gym, wake]);
  assert.equal(out.habits.length, 3);
  assert.equal(out.habits[0].id, 3);
  assert.equal(out.habits[1].id, 4);
  assert.ok(out.seeded);
  assert.equal(out.seeded.id, 5);
  assert.equal(out.seeded.icon, ICON_ONE_PERCENT);
  assert.equal(out.seeded.name, "1%: No Caffeine");
  assert.deepEqual(out.seeded.scheduledDays, ALL_SCHEDULED_DAYS);
  assert.equal(out.historySeed.focus, ONE_PERCENT_DEFAULT_FOCUS);
  assert.equal(out.historySeed.startedOn, ONE_PERCENT_HISTORY_ORIGIN);
  assert.equal(out.historySeed.habitId, 5);
});

test("ensureOnePercentHabit does not create a second row or change id", () => {
  var existing = {
    id: 9,
    name: "1%: No Caffeine",
    icon: ICON_ONE_PERCENT,
    scheduledDays: [0, 1, 2, 3, 4, 5, 6],
  };
  var out = ensureOnePercentHabit([{ id: 3, name: "Gym", icon: "gym", scheduledDays: [1, 2, 3, 4, 5] }, existing]);
  assert.equal(out.seeded, null);
  assert.equal(out.habits.length, 2);
  var found = out.habits.find(isOnePercentHabit);
  assert.equal(found.id, 9);
  assert.equal(found.name, "1%: No Caffeine");
});

test("ensureOnePercentHabit restores everyday schedule without changing id", () => {
  var existing = {
    id: 5,
    name: "1%: No Caffeine",
    icon: ICON_ONE_PERCENT,
    scheduledDays: [1, 2, 3],
  };
  var out = ensureOnePercentHabit([existing]);
  assert.equal(out.seeded, null);
  assert.equal(out.habits[0].id, 5);
  assert.deepEqual(out.habits[0].scheduledDays, ALL_SCHEDULED_DAYS);
  assert.equal(out.repaired, true);
});

test("applyFocusChange keeps the same habit id and appends a history period", () => {
  var habit = {
    id: 5,
    name: "1%: No Caffeine",
    icon: ICON_ONE_PERCENT,
    scheduledDays: ALL_SCHEDULED_DAYS.slice(),
  };
  var history = [{ habitId: 5, focus: "No Caffeine", startedOn: ONE_PERCENT_HISTORY_ORIGIN }];
  var out = applyFocusChange(habit, history, "Meditation", "2026-09-21");
  assert.equal(out.changed, true);
  assert.equal(out.habit.id, 5);
  assert.equal(out.habit.name, "1%: Meditation");
  assert.equal(history.length, 1);
  assert.equal(out.history.length, 2);
  assert.equal(out.history[1].focus, "Meditation");
  assert.equal(out.history[1].startedOn, "2026-09-21");
  assert.equal(out.history[1].habitId, 5);
});

test("applyFocusChange on the same day updates that period instead of appending", () => {
  var habit = {
    id: 5,
    name: "1%: Meditation",
    icon: ICON_ONE_PERCENT,
    scheduledDays: ALL_SCHEDULED_DAYS.slice(),
  };
  var history = [
    { habitId: 5, focus: "No Caffeine", startedOn: ONE_PERCENT_HISTORY_ORIGIN },
    { habitId: 5, focus: "Meditation", startedOn: "2026-09-21" },
  ];
  var out = applyFocusChange(habit, history, "Journaling", "2026-09-21");
  assert.equal(out.history.length, 2);
  assert.equal(out.history[1].focus, "Journaling");
  assert.equal(out.habit.id, 5);
  assert.equal(out.habit.name, "1%: Journaling");
});

test("historical calendar labels use the focus that was active then", () => {
  var habit = {
    id: 5,
    name: "1%: Journaling",
    icon: ICON_ONE_PERCENT,
    scheduledDays: ALL_SCHEDULED_DAYS.slice(),
  };
  var history = [
    { habitId: 5, focus: "No Caffeine", startedOn: ONE_PERCENT_HISTORY_ORIGIN },
    { habitId: 5, focus: "Meditation", startedOn: "2026-09-10" },
    { habitId: 5, focus: "Journaling", startedOn: "2026-09-21" },
  ];
  assert.equal(resolveFocusForDate(history, 5, "2026-09-01"), "No Caffeine");
  assert.equal(resolveFocusForDate(history, 5, "2026-09-10"), "Meditation");
  assert.equal(resolveFocusForDate(history, 5, "2026-09-20"), "Meditation");
  assert.equal(resolveFocusForDate(history, 5, "2026-09-21"), "Journaling");
  assert.equal(displayHabitNameOnDate(habit, history, "2026-09-01"), "1%: No Caffeine");
  assert.equal(displayHabitNameOnDate(habit, history, "2026-09-20"), "1%: Meditation");
  assert.equal(displayHabitNameOnDate(habit, history, "2026-09-21"), "1%: Journaling");
});

test("displayHabitNameOnDate leaves gym and wake names unchanged", () => {
  var gym = { id: 3, name: "Gym", icon: "gym", scheduledDays: [1, 2, 3, 4, 5] };
  assert.equal(displayHabitNameOnDate(gym, [], "2026-09-21"), "Gym");
});
