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
