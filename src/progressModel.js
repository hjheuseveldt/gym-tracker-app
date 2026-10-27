/** Pure helpers for the Progress tab. Weight rows come from workout_logs. */

var MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

var DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value) {
  return DATE_KEY.test(String(value || ""));
}

export function storagePathForDate(date, stamp) {
  if (!isDateKey(date)) throw new Error("Invalid photo date");
  var n = String(stamp == null ? "" : stamp);
  if (!/^[0-9]+$/.test(n)) throw new Error("Invalid photo stamp");
  return "days/" + date + "-" + n + ".jpg";
}

/** One bodyweight per calendar day. Duplicate days keep the latest updated_at, then created_at. */
export function latestBodyweights(rows) {
  var best = new Map();
  (rows || []).forEach(function (row, index) {
    if (!row) return;
    var day = String(row.log_date || row.date || "");
    if (!isDateKey(day)) return;
    if (row.bodyweight == null || row.bodyweight === "") return;
    var weight = Number(row.bodyweight);
    if (!Number.isFinite(weight)) return;
    var stamp = String(row.updated_at || row.created_at || "");
    var prev = best.get(day);
    var newer = !prev || stamp > prev.stamp || (stamp === prev.stamp && index >= prev.index);
    if (newer) best.set(day, { day: day, weight: weight, stamp: stamp, index: index });
  });
  return Array.from(best.values())
    .map(function (row) {
      return { day: row.day, weight: row.weight };
    })
    .sort(function (a, b) {
      if (a.day < b.day) return -1;
      if (a.day > b.day) return 1;
      return 0;
    });
}

export function weightRowsFromLogs(logs) {
  return Object.keys(logs || {}).map(function (day) {
    var row = logs[day] || {};
    return {
      log_date: day,
      bodyweight: row.bodyweight,
      updated_at: row.updated_at || row.created_at || "",
    };
  });
}

/**
 * Oldest → newest marks. Weigh-in days and photo days are included.
 * Today is always present so the strip can open with today at the right end.
 */
export function buildTimeline(weightRows, photoRows, todayKey) {
  var weights = {};
  latestBodyweights(weightRows).forEach(function (row) {
    weights[row.day] = row.weight;
  });
  var photos = {};
  (photoRows || []).forEach(function (photo) {
    if (!photo || !isDateKey(photo.photo_date)) return;
    photos[photo.photo_date] = photo;
  });
  var days = {};
  Object.keys(weights).forEach(function (day) {
    days[day] = true;
  });
  Object.keys(photos).forEach(function (day) {
    days[day] = true;
  });
  if (isDateKey(todayKey)) days[todayKey] = true;
  return Object.keys(days)
    .sort()
    .map(function (day) {
      var hasWeight = Object.prototype.hasOwnProperty.call(weights, day);
      return {
        date: day,
        weight: hasWeight ? weights[day] : null,
        hasPhoto: !!photos[day],
        photo: photos[day] || null,
        isToday: day === todayKey,
      };
    });
}

export function latestPhoto(photos) {
  var rows = (photos || []).filter(function (photo) {
    return photo && isDateKey(photo.photo_date) && photo.storage_path;
  });
  rows.sort(function (a, b) {
    if (a.photo_date < b.photo_date) return -1;
    if (a.photo_date > b.photo_date) return 1;
    return 0;
  });
  return rows.length ? rows[rows.length - 1] : null;
}

export function formatWeightNumber(weight) {
  if (weight == null || weight === "") return null;
  var value = Number(weight);
  if (!Number.isFinite(value)) return null;
  var rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
}

export function formatWeightLb(weight) {
  var n = formatWeightNumber(weight);
  return n == null ? null : n + " lb";
}

/** Signed change from the earlier day to the later day, e.g. "-8.4 lb". */
export function formatWeightDelta(earlier, later) {
  if (earlier == null || later == null || earlier === "" || later === "") return null;
  var a = Number(earlier);
  var b = Number(later);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  var delta = Math.round((b - a) * 10) / 10;
  var sign = delta > 0 ? "+" : "";
  return sign + delta.toFixed(1) + " lb";
}

export function formatLongDate(key) {
  if (!isDateKey(key)) return "";
  var parts = key.split("-");
  var date = new Date(key + "T12:00:00");
  return WEEKDAYS[date.getDay()] + " " + MONTHS[Number(parts[1]) - 1] + " " + parseInt(parts[2], 10) + ", " + parts[0];
}

export function formatShortDate(key) {
  if (!isDateKey(key)) return "";
  var parts = key.split("-");
  return parseInt(parts[1], 10) + "/" + parseInt(parts[2], 10);
}

export function chronologicalPair(a, b) {
  if (!a) return { earlier: null, later: b || null };
  if (!b) return { earlier: a, later: null };
  return a.date <= b.date ? { earlier: a, later: b } : { earlier: b, later: a };
}

/** Source rectangle for object-fit: cover, so the saved frame matches the preview. */
export function coverSourceRect(srcW, srcH, destW, destH) {
  if (!(srcW > 0) || !(srcH > 0) || !(destW > 0) || !(destH > 0)) return null;
  var srcAspect = srcW / srcH;
  var destAspect = destW / destH;
  if (srcAspect > destAspect) {
    var sw = srcH * destAspect;
    return { sx: (srcW - sw) / 2, sy: 0, sw: sw, sh: srcH };
  }
  var sh = srcW / destAspect;
  return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh: sh };
}

export function captureOutputSize(viewW, viewH, maxEdge) {
  var max = maxEdge > 0 ? maxEdge : 1600;
  var width = viewW;
  var height = viewH;
  var edge = Math.max(width, height);
  if (edge > max) {
    var scale = max / edge;
    width *= scale;
    height *= scale;
  }
  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

/** Scroll offset that parks today's column against the right edge of the strip. */
export function scrollLeftForToday(todayOffsetLeft, todayWidth, clientWidth, scrollWidth) {
  var max = Math.max(0, scrollWidth - clientWidth);
  var left = todayOffsetLeft + todayWidth - clientWidth;
  if (left < 0) return 0;
  if (left > max) return max;
  return left;
}
