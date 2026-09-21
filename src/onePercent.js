export var ICON_ONE_PERCENT = "spark";
export var ONE_PERCENT_DEFAULT_FOCUS = "No Caffeine";
export var ONE_PERCENT_HISTORY_ORIGIN = "1970-01-01";
export var ALL_SCHEDULED_DAYS = [0, 1, 2, 3, 4, 5, 6];
export var DEFAULT_ONE_PERCENT_ID = 5;

export function formatOnePercentTitle(focus) {
  var f = String(focus == null ? "" : focus).trim();
  if (!f) f = ONE_PERCENT_DEFAULT_FOCUS;
  return "1%: " + f;
}

export function parseFocusFromName(name) {
  var s = String(name == null ? "" : name).trim();
  var m = s.match(/^1%\s*:\s*(.*)$/i);
  if (m) {
    var f = String(m[1] || "").trim();
    return f || ONE_PERCENT_DEFAULT_FOCUS;
  }
  return s || ONE_PERCENT_DEFAULT_FOCUS;
}

export function isOnePercentHabit(h) {
  return !!(h && h.icon === ICON_ONE_PERCENT);
}

function cloneDays(days) {
  return (Array.isArray(days) ? days : ALL_SCHEDULED_DAYS).map(Number);
}

function daysAreAll(days) {
  var have = {};
  cloneDays(days).forEach(function (d) {
    have[d] = true;
  });
  return ALL_SCHEDULED_DAYS.every(function (d) {
    return !!have[d];
  });
}

function nextHabitId(habits, preferred) {
  var used = {};
  (habits || []).forEach(function (h) {
    used[Number(h.id)] = true;
  });
  var id = preferred;
  while (used[id]) id++;
  return id;
}

export function defaultOnePercentHabit(id) {
  return {
    id: id == null ? DEFAULT_ONE_PERCENT_ID : id,
    name: formatOnePercentTitle(ONE_PERCENT_DEFAULT_FOCUS),
    icon: ICON_ONE_PERCENT,
    scheduledDays: ALL_SCHEDULED_DAYS.slice(),
  };
}

export function ensureOnePercentHabit(habits) {
  var list = Array.isArray(habits) ? habits.slice() : [];
  var idx = list.findIndex(isOnePercentHabit);
  if (idx >= 0) {
    var found = list[idx];
    var repaired = false;
    var next = Object.assign({}, found);
    if (!daysAreAll(found.scheduledDays)) {
      next.scheduledDays = ALL_SCHEDULED_DAYS.slice();
      repaired = true;
    } else {
      next.scheduledDays = cloneDays(found.scheduledDays);
    }
    if (found.icon !== ICON_ONE_PERCENT) {
      next.icon = ICON_ONE_PERCENT;
      repaired = true;
    }
    var focus = parseFocusFromName(found.name);
    var titled = formatOnePercentTitle(focus);
    if (found.name !== titled) {
      next.name = titled;
      repaired = true;
    }
    list[idx] = next;
    return {
      habits: list,
      seeded: null,
      repaired: repaired,
      historySeed: null,
    };
  }
  var id = nextHabitId(list, DEFAULT_ONE_PERCENT_ID);
  var seeded = defaultOnePercentHabit(id);
  return {
    habits: list.concat([seeded]),
    seeded: seeded,
    repaired: false,
    historySeed: {
      habitId: seeded.id,
      focus: ONE_PERCENT_DEFAULT_FOCUS,
      startedOn: ONE_PERCENT_HISTORY_ORIGIN,
    },
  };
}

export function resolveFocusForDate(history, habitId, dateKey) {
  var hid = Number(habitId);
  var rows = (history || []).filter(function (r) {
    return Number(r.habitId) === hid && r.startedOn && r.startedOn <= dateKey;
  });
  if (!rows.length) return null;
  rows.sort(function (a, b) {
    if (a.startedOn < b.startedOn) return -1;
    if (a.startedOn > b.startedOn) return 1;
    return 0;
  });
  return rows[rows.length - 1].focus;
}

export function displayHabitNameOnDate(habit, history, dateKey) {
  if (!isOnePercentHabit(habit)) return habit && habit.name ? habit.name : "";
  var fromHistory = resolveFocusForDate(history, habit.id, dateKey);
  var focus = fromHistory || parseFocusFromName(habit.name);
  return formatOnePercentTitle(focus);
}

export function applyFocusChange(habit, history, newFocus, todayKey) {
  var focus = String(newFocus == null ? "" : newFocus).trim() || ONE_PERCENT_DEFAULT_FOCUS;
  var current = parseFocusFromName(habit && habit.name);
  var hist = (history || []).map(function (r) {
    return Object.assign({}, r);
  });
  var updated = Object.assign({}, habit, {
    id: habit.id,
    name: formatOnePercentTitle(focus),
    icon: ICON_ONE_PERCENT,
    scheduledDays: ALL_SCHEDULED_DAYS.slice(),
  });
  if (current === focus) {
    return { habit: updated, history: hist, changed: false };
  }
  var sameDay = -1;
  for (var i = hist.length - 1; i >= 0; i--) {
    if (Number(hist[i].habitId) === Number(habit.id) && hist[i].startedOn === todayKey) {
      sameDay = i;
      break;
    }
  }
  if (sameDay >= 0) {
    hist[sameDay] = Object.assign({}, hist[sameDay], { focus: focus });
  } else {
    if (!hist.some(function (r) { return Number(r.habitId) === Number(habit.id); })) {
      hist.push({ habitId: habit.id, focus: current, startedOn: ONE_PERCENT_HISTORY_ORIGIN });
    }
    hist.push({ habitId: habit.id, focus: focus, startedOn: todayKey });
  }
  return { habit: updated, history: hist, changed: true };
}
