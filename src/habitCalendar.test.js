import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HABIT_DOT_COLORS,
  habitDotColor,
  createdOnFromTimestamp,
  habitExistedOn,
  isHabitScheduledOn,
  isHabitDueOn,
  dueHabitsOn,
  completedHabitsOn,
  isAllTrackedHabitsComplete,
  countAllCompleteDaysInMonth,
  countCompletionsInMonth,
  allCompleteStreak,
} from "./habitCalendar.js";

var gym = { id: 3, name: "Gym", icon: "gym", scheduledDays: [1, 2, 3, 4, 5, 6], createdOn: "2026-05-12" };
var talk = { id: 4, name: "GC Talk", icon: "dawn", scheduledDays: [0, 1, 2, 3, 4, 5, 6], createdOn: "2026-08-10" };
var one = { id: 5, name: "1%: Three chapters of BoM", icon: "spark", scheduledDays: [0, 1, 2, 3, 4, 5, 6], createdOn: "2026-09-21" };
var wake = { id: 6, name: "Wake before 6:30AM", icon: "wake", scheduledDays: [0, 1, 2, 3, 4, 5, 6], createdOn: "2026-10-05" };
var tracked = [one, talk, gym, wake];

function mark(ids, dates) {
  var comp = {};
  ids.forEach(function (id) {
    comp[id] = {};
    dates.forEach(function (d) {
      comp[id][d] = true;
    });
  });
  return comp;
}

test("habit dots stay distinct and stable by list index", () => {
  assert.equal(habitDotColor(0), HABIT_DOT_COLORS[0]);
  assert.equal(habitDotColor(1), HABIT_DOT_COLORS[1]);
  assert.notEqual(habitDotColor(0), habitDotColor(1));
  assert.equal(habitDotColor(HABIT_DOT_COLORS.length), HABIT_DOT_COLORS[0]);
});

test("createdOnFromTimestamp uses the local calendar day", () => {
  var iso = "2026-10-05T15:00:00.000Z";
  var d = new Date(iso);
  var expected =
    d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  assert.equal(createdOnFromTimestamp(iso), expected);
  assert.equal(createdOnFromTimestamp(""), null);
  assert.equal(createdOnFromTimestamp("not-a-date"), null);
});

test("a habit does not exist before its createdOn day", () => {
  assert.equal(habitExistedOn(wake, "2026-10-04"), false);
  assert.equal(habitExistedOn(wake, "2026-10-05"), true);
  assert.equal(habitExistedOn({ id: 1, name: "Legacy" }, "2020-01-01"), true);
});

test("schedule is respected and a missing schedule is daily", () => {
  assert.equal(isHabitScheduledOn(gym, "2026-10-04"), false);
  assert.equal(isHabitScheduledOn(gym, "2026-10-05"), true);
  assert.equal(isHabitScheduledOn({ id: 9, name: "Daily" }, "2026-10-04"), true);
  assert.equal(isHabitDueOn(wake, "2026-10-04"), false);
  assert.equal(isHabitDueOn(gym, "2026-10-04"), false);
  assert.equal(isHabitDueOn(gym, "2026-10-05"), true);
});

test("all-complete ignores habits that did not exist yet and habits not due", () => {
  var day = "2026-10-04";
  var comp = mark([3, 4, 5], [day]);
  var due = dueHabitsOn(tracked, day).map(function (h) {
    return h.id;
  });
  assert.deepEqual(due, [5, 4]);
  assert.equal(isAllTrackedHabitsComplete(tracked, comp, day, "2026-10-08"), true);

  var missingOne = mark([4], [day]);
  assert.equal(isAllTrackedHabitsComplete(tracked, missingOne, day, "2026-10-08"), false);
});

test("wake does not block days before it was tracked", () => {
  var day = "2026-10-04";
  var comp = mark([3, 4, 5], [day]);
  assert.equal(isAllTrackedHabitsComplete(tracked, comp, day, "2026-10-08"), true);
  var afterWake = "2026-10-05";
  assert.equal(isAllTrackedHabitsComplete(tracked, comp, afterWake, "2026-10-08"), false);
  [3, 4, 5, 6].forEach(function (id) {
    if (!comp[id]) comp[id] = {};
    comp[id][afterWake] = true;
  });
  assert.equal(isAllTrackedHabitsComplete(tracked, comp, afterWake, "2026-10-08"), true);
  delete comp[6][afterWake];
  assert.equal(isAllTrackedHabitsComplete(tracked, comp, afterWake, "2026-10-08"), false);
});

test("a day with no due habits and a future day are not all-complete", () => {
  var onlyGym = [gym];
  assert.equal(isAllTrackedHabitsComplete(onlyGym, mark([3], ["2026-10-04"]), "2026-10-04", "2026-10-08"), false);
  assert.equal(isAllTrackedHabitsComplete(tracked, mark([3, 4, 5, 6], ["2026-10-09"]), "2026-10-09", "2026-10-08"), false);
});

test("completed habits on a day are the tracked ones with a completion", () => {
  var comp = { 3: { "2026-10-06": true }, 4: {}, 5: { "2026-10-06": true }, 9: { "2026-10-06": true } };
  var ids = completedHabitsOn(tracked, comp, "2026-10-06").map(function (h) {
    return h.id;
  });
  assert.deepEqual(ids, [5, 3]);
});

test("month counts and streak skip rest days and do not break on an unfinished today", () => {
  var habits = [talk];
  var comp = mark([4], ["2026-10-06", "2026-10-07"]);
  assert.equal(countCompletionsInMonth(habits, comp, 2026, 9, "2026-10-08"), 2);
  assert.equal(countAllCompleteDaysInMonth(habits, comp, 2026, 9, "2026-10-08"), 2);
  assert.equal(allCompleteStreak(habits, comp, "2026-10-08"), 2);

  comp[4]["2026-10-08"] = true;
  assert.equal(allCompleteStreak(habits, comp, "2026-10-08"), 3);

  var gymOnly = [gym];
  var gymComp = mark([3], ["2026-10-03", "2026-10-05", "2026-10-06", "2026-10-07"]);
  assert.equal(allCompleteStreak(gymOnly, gymComp, "2026-10-08"), 4);
});
