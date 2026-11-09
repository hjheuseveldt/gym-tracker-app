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

/** Saved progress JPEGs. The shutter reads these so the preview crop and the file match. */
export var PROGRESS_PHOTO_MAX_EDGE = 3840;
export var PROGRESS_PHOTO_JPEG_QUALITY = 0.92;
export var PROGRESS_PHOTO_MIME = "image/jpeg";
/** Preferred still size. `ideal` lets the browser pick a smaller mode when the sensor cannot match. */
export var PROGRESS_CAMERA_IDEAL_WIDTH = 4032;
export var PROGRESS_CAMERA_IDEAL_HEIGHT = 3024;

export function progressCameraConstraints(facing) {
  var mode = facing === "environment" ? "environment" : "user";
  return {
    audio: false,
    video: {
      facingMode: { ideal: mode },
      width: { ideal: PROGRESS_CAMERA_IDEAL_WIDTH },
      height: { ideal: PROGRESS_CAMERA_IDEAL_HEIGHT },
    },
  };
}

/** Last resort when the high-resolution request is rejected. No audio, no file is written. */
export function progressCameraFallbackConstraints() {
  return { audio: false, video: true };
}

function positiveCameraEdge(value) {
  var n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Ask an open track for its largest mode, capped at the ideal still size.
 * Returns null when the browser does not report capabilities.
 */
export function progressCameraBoost(capabilities) {
  var widthMax = positiveCameraEdge(capabilities && capabilities.width && capabilities.width.max);
  var heightMax = positiveCameraEdge(capabilities && capabilities.height && capabilities.height.max);
  if (!(widthMax > 0) || !(heightMax > 0)) return null;
  var cap = Math.max(PROGRESS_CAMERA_IDEAL_WIDTH, PROGRESS_CAMERA_IDEAL_HEIGHT);
  var scale = Math.min(1, cap / widthMax, cap / heightMax);
  return {
    width: { ideal: Math.max(1, Math.round(widthMax * scale)) },
    height: { ideal: Math.max(1, Math.round(heightMax * scale)) },
  };
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

/**
 * Output pixels for a capture. Never upscales.
 * The long edge is capped at `maxEdge` (default 3840) so a camera frame is not
 * reduced to the CSS size of the preview.
 */
export function captureOutputSize(sourceW, sourceH, maxEdge) {
  var max = maxEdge > 0 ? maxEdge : PROGRESS_PHOTO_MAX_EDGE;
  var width = sourceW;
  var height = sourceH;
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

/**
 * Crop and encode plan for one shutter press.
 * The crop matches the preview; the saved size uses camera pixels, not CSS pixels.
 */
export function progressFramePlan(videoWidth, videoHeight, frameWidth, frameHeight) {
  var crop = coverSourceRect(videoWidth, videoHeight, frameWidth, frameHeight);
  if (!crop) return null;
  return {
    crop: crop,
    size: captureOutputSize(crop.sw, crop.sh, PROGRESS_PHOTO_MAX_EDGE),
    mime: PROGRESS_PHOTO_MIME,
    quality: PROGRESS_PHOTO_JPEG_QUALITY,
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
