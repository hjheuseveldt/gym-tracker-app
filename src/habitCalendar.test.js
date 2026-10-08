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
  habitDayStatus,
  countHabitCompletionsInMonth,
  habitMonthScheduledStats,
  habitCompletionStreak,
  formatCompletionRate,
  calendarViewOptions,
  parseHabitViewId,
  resolveCalendarView,
  readStoredCalendarView,
  writeStoredCalendarView,
  CAL_VIEW_STORAGE_KEY,
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

test("habit day status distinguishes future, untracked, rest, done, and miss", () => {
  var comp = { 6: { "2026-10-06": true }, 3: { "2026-10-03": true } };
  assert.equal(habitDayStatus(wake, comp, "2026-10-09", "2026-10-08"), "future");
  assert.equal(habitDayStatus(wake, comp, "2026-10-04", "2026-10-08"), "untracked");
  assert.equal(habitDayStatus(wake, comp, "2026-10-05", "2026-10-08"), "miss");
  assert.equal(habitDayStatus(wake, comp, "2026-10-06", "2026-10-08"), "done");
  assert.equal(habitDayStatus(gym, comp, "2026-10-04", "2026-10-08"), "rest");
  assert.equal(habitDayStatus(gym, comp, "2026-10-03", "2026-10-08"), "done");
  assert.equal(habitDayStatus(gym, {}, "2026-10-05", "2026-10-08"), "miss");
});

test("per-habit month stats count completions, rate, and streak without punishing rest days or days before tracking", () => {
  var comp = mark([3], ["2026-10-03", "2026-10-05", "2026-10-06", "2026-10-07"]);
  comp[6] = { "2026-10-06": true, "2026-10-07": true };
  assert.equal(countHabitCompletionsInMonth(gym, comp, 2026, 9, "2026-10-08"), 4);
  var gymStats = habitMonthScheduledStats(gym, comp, 2026, 9, "2026-10-08");
  assert.deepEqual(gymStats, { done: 4, due: 7, missed: 3, rate: 4 / 7 });
  assert.equal(habitCompletionStreak(gym, comp, "2026-10-08"), 4);
  assert.equal(formatCompletionRate(gymStats.rate), "57%");
  assert.equal(formatCompletionRate(null), "\u2013");

  var wakeStats = habitMonthScheduledStats(wake, comp, 2026, 9, "2026-10-08");
  assert.equal(wakeStats.due, 4);
  assert.equal(wakeStats.done, 2);
  assert.equal(wakeStats.missed, 2);
  assert.equal(habitCompletionStreak(wake, comp, "2026-10-08"), 2);
  assert.equal(habitCompletionStreak(wake, comp, "2026-10-05"), 0);
});

test("calendar views keep the combined calendar and add one view per current habit", () => {
  var history = [
    { habitId: 5, focus: "No Caffeine", startedOn: "1970-01-01" },
    { habitId: 5, focus: "Three chapters of BoM", startedOn: "2026-10-01" },
  ];
  var oneNamed = Object.assign({}, one, { name: "1%: Three chapters of BoM" });
  var views = calendarViewOptions([oneNamed, talk, gym, wake], history, "2026-10-08");
  assert.deepEqual(
    views.map(function (v) {
      return v.id;
    }),
    ["habits", "all", "habit:5", "habit:4", "habit:3", "habit:6", "workouts", "wake"]
  );
  assert.equal(views[0].label, "Habits");
  assert.equal(views[0].group, "Overview");
  assert.equal(views[2].label, "1%: Three chapters of BoM");
  assert.equal(views[2].group, "Habits");
  assert.equal(views[2].color, habitDotColor(0));
  assert.equal(views[3].color, habitDotColor(1));
  assert.equal(views[views.length - 1].group, "Activity");
  assert.equal(views[views.length - 1].label, "Wake");
  assert.equal(parseHabitViewId("habit:5"), 5);
  assert.equal(parseHabitViewId("habits"), null);
  assert.equal(parseHabitViewId("habit:nope"), null);
});

test("stored calendar view falls back when the habit is gone", () => {
  var store = {
    bag: {},
    getItem: function (k) {
      return Object.prototype.hasOwnProperty.call(this.bag, k) ? this.bag[k] : null;
    },
    setItem: function (k, v) {
      this.bag[k] = String(v);
    },
  };
  writeStoredCalendarView(store, "habit:3");
  assert.equal(store.bag[CAL_VIEW_STORAGE_KEY], "habit:3");
  assert.equal(readStoredCalendarView(store), "habit:3");
  assert.equal(resolveCalendarView("habit:3", tracked), "habit:3");
  assert.equal(resolveCalendarView("habit:99", tracked), "habits");
  assert.equal(resolveCalendarView("nope", tracked), "habits");
  assert.equal(resolveCalendarView("wake", tracked), "wake");
  assert.equal(readStoredCalendarView(null), "");
});
