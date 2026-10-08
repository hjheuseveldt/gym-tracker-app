import { CalDayDoneCheck } from "./icons.jsx";
import { displayHabitNameOnDate } from "./onePercent.js";
import {
  habitDotColor,
  habitExistedOn,
  isHabitScheduledOn,
  completedHabitsOn,
  isAllTrackedHabitsComplete,
} from "./habitCalendar.js";

var C = {
  text: "#1A2332",
  muted: "#5C6570",
  border: "rgba(26,35,50,0.16)",
  accent: "#2EC4B6",
  accentDeep: "#14756C",
};

export var CAL_MODES = [
  { id: "habits", label: "Habits" },
  { id: "all", label: "All done" },
  { id: "workouts", label: "Workouts" },
  { id: "wake", label: "Wake" },
];

export function CalendarModeTabs(props) {
  var layer = props.layer;
  return (
    <div role="tablist" aria-label="Calendar view" style={{ display: "flex", gap: 6, padding: "0 14px 12px" }}>
      {CAL_MODES.map(function (mode) {
        var on = layer === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={on}
            className="gt-focus-ring"
            onClick={function () {
              props.onChange(mode.id);
            }}
            style={{
              flex: "1 1 0",
              minWidth: 0,
              minHeight: 44,
              padding: "8px 2px",
              borderRadius: 999,
              border: on ? "1px solid rgba(20,117,108,0.35)" : "1px solid " + C.border,
              background: on ? C.accentDeep : "#FFFFFF",
              color: on ? "#FFFFFF" : C.text,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

function habitDayAria(habits, comp, focusHistory, k, isFut, todayKey, viewingAll) {
  var bits = habits.map(function (h) {
    var name = displayHabitNameOnDate(h, focusHistory, k);
    if (!habitExistedOn(h, k)) return name + " was not tracked yet";
    if (!isHabitScheduledOn(h, k)) return name + " not scheduled";
    var done = !!(comp[h.id] && comp[h.id][k]);
    return name + (done ? " done" : " not done");
  });
  var when = isFut ? "Future day " : "";
  if (viewingAll) {
    var flag = isAllTrackedHabitsComplete(habits, comp, k, todayKey) ? "All tracked habits done. " : "Not every tracked habit done. ";
    return when + k + ". " + flag + bits.join(". ");
  }
  return when + k + ". " + bits.join(". ");
}

export function HabitDayCell(props) {
  var k = props.dateKey;
  var isFut = props.isFuture;
  var isT = props.isToday;
  var viewingAll = props.mode === "all";
  var habits = props.habits;
  var comp = props.comp;
  var doneHere = isFut ? [] : completedHabitsOn(habits, comp, k);
  var allDoneDay = !isFut && isAllTrackedHabitsComplete(habits, comp, k, props.todayKey);
  var habitFill = viewingAll && allDoneDay ? "linear-gradient(165deg,#3AD4C6 0%,#2EC4B6 45%,#1FA89C 100%)" : "#FFFFFF";
  var habitBorder = isT
    ? "2px solid " + (viewingAll && allDoneDay ? "#0F5C55" : C.accent)
    : viewingAll && allDoneDay
    ? "1px solid rgba(20,117,108,0.35)"
    : "1.5px solid " + C.border;
  return (
    <button
      type="button"
      className="gt-focus-ring"
      onClick={function () {
        props.onSelect(k);
      }}
      aria-label={habitDayAria(habits, comp, props.focusHistory, k, isFut, props.todayKey, viewingAll)}
      aria-pressed={viewingAll ? allDoneDay : undefined}
      style={{
        aspectRatio: "1",
        background: "transparent",
        border: "none",
        borderRadius: 12,
        position: "relative",
        cursor: "pointer",
        opacity: isFut ? 0.42 : 1,
        padding: 0,
        fontFamily: "'DM Sans',sans-serif",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        className={viewingAll && allDoneDay ? "gt-cal-glow" : undefined}
        style={{
          position: "absolute",
          inset: 1,
          borderRadius: 12,
          background: habitFill,
          border: habitBorder,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          padding: "2px 1px",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: isT ? 700 : 500, color: C.text, lineHeight: 1, position: "relative", zIndex: 3 }}>{props.day}</span>
        {!viewingAll && (
          <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "center", gap: 2, minHeight: 7, maxWidth: 36, position: "relative", zIndex: 3 }}>
            {doneHere.map(function (h) {
              return (
                <span
                  key={h.id}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: props.habitColors[h.id] || C.accent, flex: "0 0 auto" }}
                />
              );
            })}
          </span>
        )}
        {viewingAll && allDoneDay && (
          <span style={{ position: "absolute", top: 3, right: 3, display: "flex", lineHeight: 0, zIndex: 3 }}>
            <CalDayDoneCheck color="#0F5C55" size={9} />
          </span>
        )}
      </div>
    </button>
  );
}

export function ActivityHeatLegend(props) {
  var viewingWake = props.viewingWake;
  return (
    <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 9, color: C.muted, gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span>{viewingWake ? "Missed" : "Low"}</span>
        {props.legend.map(function (c2, i) {
          return <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: c2, border: "1px solid " + C.border }} />;
        })}
        <span>{viewingWake ? "Hit" : "High"}</span>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent }} />
          gym
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accentDeep }} />
          wake
        </span>
      </div>
    </div>
  );
}

export function HabitMonthLegend(props) {
  var habits = props.habits;
  var focusHistory = props.focusHistory;
  var habitColors = props.habitColors;
  if (props.mode === "all") {
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: "linear-gradient(165deg,#3AD4C6 0%,#1FA89C 100%)", border: "1px solid rgba(20,117,108,0.35)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>Every tracked habit done</span>
        </div>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.4 }}>
          A day counts when every habit you track now, that already existed and was scheduled that day, was completed. Habits added later do not block earlier days. A rest day does not block the day.
        </p>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 12 }}>
      {habits.length === 0 ? (
        <div style={{ fontSize: 12, color: C.muted }}>No habits tracked yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px" }}>
          {habits.map(function (h, i) {
            var name = displayHabitNameOnDate(h, focusHistory, props.todayKey);
            return (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: habitColors[h.id] || habitDotColor(i), flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              </div>
            );
          })}
        </div>
      )}
      <p style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.4 }}>
        A dot means that habit was completed. Tap a day to see details, including the 1% focus active then.
      </p>
    </div>
  );
}
