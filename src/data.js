import { supabase, supaReady } from "./supabase.js";
import { normalizeHabitIcon, toDbHabitIcon } from "./icons.jsx";

// Row <-> client shape converters

function rowToHabit(r) {
  return {
    id: Number(r.id),
    name: r.name,
    icon: normalizeHabitIcon(r.emoji),
    scheduledDays: Array.isArray(r.scheduled_days) ? r.scheduled_days.map(Number) : [0, 1, 2, 3, 4, 5, 6],
    _sort: typeof r.sort_order === "number" ? r.sort_order : 0,
  };
}

function habitToRow(h, sortIndex) {
  return {
    id: h.id,
    name: h.name,
    emoji: toDbHabitIcon(h.icon),
    scheduled_days: h.scheduledDays,
    sort_order: typeof sortIndex === "number" ? sortIndex : h._sort || 0,
  };
}

function rowToCycle(r) {
  return {
    id: Number(r.id),
    name: r.name,
    type: r.type,
    color: r.color,
    start: r.start_date,
    end: r.end_date,
    calories: r.kcal_target == null ? 0 : r.kcal_target,
    supplements: r.supplements || "",
  };
}

function cycleToRow(c) {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    color: c.color || "#6DD994",
    start_date: c.start,
    end_date: c.end,
    kcal_target: c.calories ? Number(c.calories) : null,
    supplements: c.supplements ? c.supplements : null,
  };
}

function shapeCompletions(rows) {
  var out = {};
  rows.forEach(function (r) {
    var hid = Number(r.habit_id);
    if (!out[hid]) out[hid] = {};
    out[hid][r.completion_date] = true;
  });
  return out;
}

function shapeOneWorkoutLogRow(r) {
  return {
    bodyweight: r.bodyweight == null ? null : Number(r.bodyweight),
    muscles: Array.isArray(r.muscles) ? r.muscles : [],
    sets: r.sets || {},
    cardio_minutes:
      r.cardio_minutes == null || r.cardio_minutes === ""
        ? null
        : Math.max(0, Math.round(Number(r.cardio_minutes))),
  };
}

function shapeLogs(rows) {
  var out = {};
  rows.forEach(function (r) {
    out[r.log_date] = shapeOneWorkoutLogRow(r);
  });
  return out;
}

// Bulk load on app boot. Returns { habits, comp, logs, cycles } or null when Supabase isn't ready.
export async function loadAll() {
  if (!supaReady()) return null;
  var results = await Promise.all([
    supabase.from("habits").select("*").order("sort_order", { ascending: true }),
    supabase.from("habit_completions").select("habit_id,completion_date"),
    supabase.from("workout_logs").select("*"),
    supabase.from("cycles").select("*").order("start_date", { ascending: true }),
  ]);
  var habitsRes = results[0],
    compRes = results[1],
    logsRes = results[2],
    cyclesRes = results[3];
  var err = habitsRes.error || compRes.error || logsRes.error || cyclesRes.error;
  if (err) throw new Error(err.message || "Supabase load failed");
  return {
    habits: (habitsRes.data || []).map(rowToHabit),
    comp: shapeCompletions(compRes.data || []),
    logs: shapeLogs(logsRes.data || []),
    cycles: (cyclesRes.data || []).map(rowToCycle),
  };
}

// Habit CRUD

export async function upsertHabit(h, sortIndex) {
  if (!supaReady()) return;
  var row = habitToRow(h, sortIndex);
  var res = await supabase.from("habits").upsert(row, { onConflict: "id" });
  if (res.error) throw new Error(res.error.message);
}

export async function deleteHabit(id) {
  if (!supaReady()) return;
  var res = await supabase.from("habits").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

export async function reorderHabits(habits) {
  if (!supaReady()) return;
  // Bulk update sort_order in a single upsert.
  var rows = habits.map(function (h, i) {
    return habitToRow(h, i);
  });
  var res = await supabase.from("habits").upsert(rows, { onConflict: "id" });
  if (res.error) throw new Error(res.error.message);
}

// Completion CRUD

export async function setCompletion(habitId, date, done) {
  if (!supaReady()) return;
  if (done) {
    var ins = await supabase.from("habit_completions").upsert({ habit_id: habitId, completion_date: date }, { onConflict: "habit_id,completion_date" });
    if (ins.error) throw new Error(ins.error.message);
  } else {
    var del = await supabase.from("habit_completions").delete().eq("habit_id", habitId).eq("completion_date", date);
    if (del.error) throw new Error(del.error.message);
  }
}

// Workout log CRUD

/** Upsert workout for a local calendar date; returns shaped client log or throws. */
export async function upsertWorkoutLog(date, data) {
  if (!supaReady()) throw new Error("Supabase isn't configured.");
  var row = {
    log_date: date,
    bodyweight: data.bodyweight == null ? null : Number(data.bodyweight),
    muscles: Array.isArray(data.muscles) ? data.muscles : [],
    sets: data.sets || {},
    cardio_minutes: data.cardio_minutes == null ? null : Math.max(0, Math.round(Number(data.cardio_minutes))),
  };
  var res = await supabase.from("workout_logs").upsert(row, { onConflict: "log_date" }).select().single();
  if (res.error) throw new Error(res.error.message);
  if (res.data) return shapeOneWorkoutLogRow(res.data);
  return shapeOneWorkoutLogRow(Object.assign({ log_date: date }, row));
}

export async function deleteWorkoutLog(date) {
  if (!supaReady()) return;
  var res = await supabase.from("workout_logs").delete().eq("log_date", date);
  if (res.error) throw new Error(res.error.message);
}

// Cycle CRUD

export async function upsertCycle(c) {
  if (!supaReady()) return;
  var res = await supabase.from("cycles").upsert(cycleToRow(c), { onConflict: "id" });
  if (res.error) throw new Error(res.error.message);
}

export async function deleteCycle(id) {
  if (!supaReady()) return;
  var res = await supabase.from("cycles").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

/** Sanitize substring for Postgres ILIKE (wildcards stripped). */
function safeIlikeFragment(s) {
  return String(s || "")
    .replace(/\\/g, "")
    .replace(/%/g, "")
    .replace(/_/g, "")
    .trim();
}

/** Insert or replace a user-defined food (food_id usually `custom:` + UUID). */
export async function upsertCustomFood(payload) {
  if (!supaReady()) throw new Error("Supabase isn't configured.");
  var row = {
    food_id: String(payload.food_id),
    food_name: payload.food_name,
    calories: Number(payload.calories),
    protein: payload.protein == null ? 0 : Number(payload.protein),
    carbs: payload.carbs == null ? 0 : Number(payload.carbs),
    fat: payload.fat == null ? 0 : Number(payload.fat),
  };
  var res = await supabase.from("custom_foods").upsert(row, { onConflict: "food_id" });
  if (res.error) throw new Error(res.error.message);
}

/** Calories tab search — newest customs first name match. */
export async function searchCustomFoods(nameFragment) {
  if (!supaReady()) return { data: [], error: null };
  var frag = safeIlikeFragment(nameFragment);
  if (!frag) return { data: [], error: null };
  return supabase.from("custom_foods").select("*").ilike("food_name", "%" + frag + "%").order("created_at", { ascending: false }).limit(30);
}

// Convenience: log a write failure to the console without breaking the UI.
export function fireAndForget(promise, label) {
  if (!promise || typeof promise.then !== "function") return;
  promise.catch(function (e) {
    console.error("[data] " + (label || "write") + " failed:", e && e.message ? e.message : e);
  });
}
