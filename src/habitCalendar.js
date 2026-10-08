import { displayHabitNameOnDate } from "./onePercent.js";

/** Stable dot colors for tracked habits, in list order. Dark enough to read on white. */
export var HABIT_DOT_COLORS = [
  "#14756C",
  "#C45C26",
  "#2F4FA8",
  "#9B3D6A",
  "#8A6A12",
  "#2F6F8F",
  "#5C4B8A",
  "#2E6B45",
  "#B3473E",
  "#6B5344",
  "#0E6E73",
  "#8A4B2F",
];

export function habitDotColor(index) {
  var n = HABIT_DOT_COLORS.length;
  var i = Math.abs(Math.floor(Number(index)) || 0) % n;
  return HABIT_DOT_COLORS[i];
}

export function formatDateKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function createdOnFromTimestamp(iso) {
  if (iso == null || iso === "") return null;
  var d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return formatDateKey(d);
}

export function habitExistedOn(habit, dateKey) {
  if (!habit) return false;
  var created = habit.createdOn;
  if (created == null || created === "") return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(created))) return true;
  return String(created) <= dateKey;
}

export function isHabitScheduledOn(habit, dateKey) {
  if (!habit || !dateKey) return false;
  var dow = new Date(dateKey + "T00:00:00").getDay();
  if (isNaN(dow)) return false;
  var days = habit.scheduledDays;
  if (!Array.isArray(days)) return true;
  return days.map(Number).indexOf(dow) >= 0;
}

export function isHabitDueOn(habit, dateKey) {
  return habitExistedOn(habit, dateKey) && isHabitScheduledOn(habit, dateKey);
}

export function dueHabitsOn(habits, dateKey) {
  return (habits || []).filter(function (h) {
    return isHabitDueOn(h, dateKey);
  });
}

export function isHabitCompletedOn(habit, comp, dateKey) {
  if (!habit || !comp) return false;
  var row = comp[habit.id];
  return !!(row && row[dateKey]);
}

export function completedHabitsOn(habits, comp, dateKey) {
  return (habits || []).filter(function (h) {
    return isHabitCompletedOn(h, comp, dateKey);
  });
}

/**
 * A day is all-complete when every currently tracked habit that already
 * existed and was scheduled that day is completed. Habits added later do not
 * block earlier days. A habit with no scheduledDays is treated as daily.
 * Days with nothing due, and future days, are not all-complete.
 * month indexes passed to the counters are 0-based, matching Date#getMonth.
 */
export function isAllTrackedHabitsComplete(habits, comp, dateKey, todayKey) {
  if (!dateKey || !todayKey || dateKey > todayKey) return false;
  var due = dueHabitsOn(habits, dateKey);
  if (!due.length) return false;
  return due.every(function (h) {
    return isHabitCompletedOn(h, comp, dateKey);
  });
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function monthDateKey(year, monthIndex, day) {
  return year + "-" + String(monthIndex + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

export function countAllCompleteDaysInMonth(habits, comp, year, monthIndex, todayKey) {
  var n = 0;
  var last = daysInMonth(year, monthIndex);
  for (var d = 1; d <= last; d++) {
    var k = monthDateKey(year, monthIndex, d);
    if (isAllTrackedHabitsComplete(habits, comp, k, todayKey)) n++;
  }
  return n;
}

export function countCompletionsInMonth(habits, comp, year, monthIndex, todayKey) {
  var prefix = year + "-" + String(monthIndex + 1).padStart(2, "0");
  var n = 0;
  (habits || []).forEach(function (h) {
    var row = (comp && comp[h.id]) || {};
    Object.keys(row).forEach(function (k) {
      if (row[k] && k.indexOf(prefix) === 0 && (!todayKey || k <= todayKey)) n++;
    });
  });
  return n;
}

export function allCompleteStreak(habits, comp, todayKey) {
  if (!todayKey) return 0;
  var anchor = new Date(todayKey + "T12:00:00");
  if (isNaN(anchor.getTime())) return 0;
  var str = 0;
  for (var i = 0; i < 800; i++) {
    var d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    var k = formatDateKey(d);
    if (k > todayKey) continue;
    var due = dueHabitsOn(habits, k);
    if (!due.length) continue;
    if (isAllTrackedHabitsComplete(habits, comp, k, todayKey)) str++;
    else if (k < todayKey) break;
  }
  return str;
}

/**
 * future: after today.
 * done: a completion exists (shown even on a rest day so the check-in stays visible).
 * untracked: before the habit's createdOn day — not a miss.
 * rest: existed, not scheduled, not completed.
 * miss: existed, scheduled, not completed.
 */
export function habitDayStatus(habit, comp, dateKey, todayKey) {
  if (!habit || !dateKey) return "untracked";
  if (todayKey && dateKey > todayKey) return "future";
  if (isHabitCompletedOn(habit, comp, dateKey)) return "done";
  if (!habitExistedOn(habit, dateKey)) return "untracked";
  if (!isHabitScheduledOn(habit, dateKey)) return "rest";
  return "miss";
}

export function countHabitCompletionsInMonth(habit, comp, year, monthIndex, todayKey) {
  if (!habit) return 0;
  var prefix = year + "-" + String(monthIndex + 1).padStart(2, "0");
  var row = (comp && comp[habit.id]) || {};
  var n = 0;
  Object.keys(row).forEach(function (k) {
    if (row[k] && k.indexOf(prefix) === 0 && (!todayKey || k <= todayKey)) n++;
  });
  return n;
}

/** Scheduled days in the month up to today that the habit already existed. */
export function habitMonthScheduledStats(habit, comp, year, monthIndex, todayKey) {
  var done = 0;
  var due = 0;
  if (!habit) return { done: 0, due: 0, missed: 0, rate: null };
  var last = daysInMonth(year, monthIndex);
  for (var d = 1; d <= last; d++) {
    var k = monthDateKey(year, monthIndex, d);
    if (todayKey && k > todayKey) break;
    if (!isHabitDueOn(habit, k)) continue;
    due++;
    if (isHabitCompletedOn(habit, comp, k)) done++;
  }
  return {
    done: done,
    due: due,
    missed: due - done,
    rate: due ? done / due : null,
  };
}

/**
 * Current streak of scheduled completions. Rest days and days before the
 * habit existed are skipped. An unfinished today does not break the streak.
 */
export function habitCompletionStreak(habit, comp, todayKey) {
  if (!habit || !todayKey) return 0;
  var anchor = new Date(todayKey + "T12:00:00");
  if (isNaN(anchor.getTime())) return 0;
  var str = 0;
  for (var i = 0; i < 800; i++) {
    var d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    var k = formatDateKey(d);
    if (k > todayKey) continue;
    if (!habitExistedOn(habit, k)) break;
    if (!isHabitScheduledOn(habit, k)) continue;
    if (isHabitCompletedOn(habit, comp, k)) str++;
    else if (k < todayKey) break;
  }
  return str;
}

export function formatCompletionRate(rate) {
  if (rate == null || !isFinite(rate)) return "\u2013";
  return Math.round(rate * 100) + "%";
}

export function habitCalendarViewId(habitId) {
  return "habit:" + Number(habitId);
}

export function parseHabitViewId(id) {
  if (typeof id !== "string" || id.indexOf("habit:") !== 0) return null;
  var rest = id.slice("habit:".length);
  if (!/^\d+$/.test(rest)) return null;
  return Number(rest);
}

export function calendarViewOptions(habits, focusHistory, todayKey) {
  var list = habits || [];
  var overview = [
    { id: "habits", label: "Habits", group: "Overview", hint: "All habits" },
    { id: "all", label: "All done", group: "Overview", hint: "Every scheduled habit" },
  ];
  var habitViews = list.map(function (h, i) {
    return {
      id: habitCalendarViewId(h.id),
      habitId: Number(h.id),
      label: displayHabitNameOnDate(h, focusHistory, todayKey),
      group: "Habits",
      color: habitDotColor(i),
    };
  });
  var activity = [
    { id: "workouts", label: "Workouts", group: "Activity" },
    { id: "wake", label: "Wake", group: "Activity" },
  ];
  return overview.concat(habitViews, activity);
}

var FIXED_CAL_VIEWS = { habits: true, all: true, workouts: true, wake: true };

export function resolveCalendarView(id, habits) {
  if (FIXED_CAL_VIEWS[id]) return id;
  var hid = parseHabitViewId(id);
  if (hid == null) return "habits";
  var exists = (habits || []).some(function (h) {
    return Number(h.id) === hid;
  });
  return exists ? habitCalendarViewId(hid) : "habits";
}

export var CAL_VIEW_STORAGE_KEY = "brickbybrick.calendarView";

export function readStoredCalendarView(storage) {
  try {
    if (!storage || !storage.getItem) return "";
    return storage.getItem(CAL_VIEW_STORAGE_KEY) || "";
  } catch (e) {
    return "";
  }
}

export function writeStoredCalendarView(storage, id) {
  try {
    if (storage && storage.setItem) storage.setItem(CAL_VIEW_STORAGE_KEY, id);
  } catch (e) {
    /* private mode or a full quota should not break the calendar */
  }
}
