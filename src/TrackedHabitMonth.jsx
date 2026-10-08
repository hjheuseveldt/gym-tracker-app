import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalDayDoneCheck, IconKpiStar } from "./icons.jsx";
import { displayHabitNameOnDate } from "./onePercent.js";
import {
  habitDotColor,
  habitDayStatus,
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

var POPOVER_OK = typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype;

var DAY_STATUS_LABEL = {
  done: "Completed",
  miss: "Missed",
  rest: "Not scheduled",
  untracked: "Not tracked yet",
  future: "Upcoming",
};

function statusLabel(status) {
  return DAY_STATUS_LABEL[status] || "Day";
}

function groupCalendarViews(options) {
  var groups = [];
  (options || []).forEach(function (opt) {
    var last = groups[groups.length - 1];
    if (!last || last.name !== opt.group) groups.push({ name: opt.group, items: [opt] });
    else last.items.push(opt);
  });
  return groups;
}

function placeCalendarMenu(button, panel) {
  if (!button || !panel) return;
  var rect = button.getBoundingClientRect();
  var gap = 6;
  var viewportH = window.innerHeight;
  var viewportW = window.innerWidth;
  var width = Math.min(rect.width, viewportW - 16);
  var left = rect.left;
  if (left + width > viewportW - 8) left = Math.max(8, viewportW - 8 - width);
  var spaceBelow = viewportH - rect.bottom - gap - 8;
  var spaceAbove = rect.top - gap - 8;
  var openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  var maxH = Math.max(160, Math.min(480, openUp ? spaceAbove : spaceBelow));
  panel.style.width = width + "px";
  panel.style.left = left + "px";
  panel.style.right = "auto";
  panel.style.maxHeight = maxH + "px";
  if (openUp) {
    panel.style.top = "auto";
    panel.style.bottom = viewportH - rect.top + gap + "px";
  } else {
    panel.style.bottom = "auto";
    panel.style.top = rect.bottom + gap + "px";
  }
}

function ChevronDown(props) {
  return (
    <svg
      className={"gt-cal-chevron" + (props.open ? " is-open" : "")}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={C.muted}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CalendarViewChoices(props) {
  var groups = groupCalendarViews(props.options);
  return groups.map(function (group) {
    return (
      <div key={group.name} role="group" aria-label={group.name}>
        <div className="gt-cal-view-heading">{group.name}</div>
        {group.items.map(function (opt) {
          var selected = opt.id === props.value;
          return (
            <button
              key={opt.id}
              type="button"
              data-cal-option={opt.id}
              aria-current={selected ? "true" : undefined}
              className="gt-focus-ring gt-cal-view-option"
              onClick={function () {
                props.onChoose(opt.id);
              }}
            >
              {opt.color ? (
                <span className="gt-cal-view-dot" style={{ background: opt.color }} />
              ) : (
                <span className="gt-cal-view-dot gt-cal-view-dot-empty" />
              )}
              <span className="gt-cal-view-option-copy">
                <span className="gt-cal-view-option-label">{opt.label}</span>
                {opt.hint ? <span className="gt-cal-view-option-hint">{opt.hint}</span> : null}
              </span>
              {selected ? <CalDayDoneCheck color={C.accentDeep} size={14} /> : <span className="gt-cal-view-check-spacer" />}
            </button>
          );
        })}
      </div>
    );
  });
}

export function CalendarViewMenu(props) {
  var options = props.options || [];
  var value = props.value;
  var menuId = "cal-view-" + useId().replace(/:/g, "");
  var btnRef = useRef(null);
  var panelRef = useRef(null);
  var openS = useState(false);
  var open = openS[0];
  var setOpen = openS[1];
  var current = options[0] || { id: "habits", label: "Habits" };
  options.forEach(function (opt) {
    if (opt.id === value) current = opt;
  });

  useLayoutEffect(
    function () {
      if (!POPOVER_OK) return;
      var btn = btnRef.current;
      var panel = panelRef.current;
      if (btn) {
        btn.setAttribute("popovertarget", menuId);
        btn.setAttribute("popovertargetaction", "toggle");
      }
      if (panel) panel.setAttribute("popover", "auto");
    },
    [menuId]
  );

  useEffect(
    function () {
      var panel = panelRef.current;
      if (!panel || !POPOVER_OK) return undefined;
      function onToggle(e) {
        var next = e.newState === "open";
        if (next) placeCalendarMenu(btnRef.current, panel);
        setOpen(next);
      }
      panel.addEventListener("toggle", onToggle);
      return function () {
        panel.removeEventListener("toggle", onToggle);
      };
    },
    [setOpen]
  );

  useLayoutEffect(
    function () {
      if (!open) return undefined;
      placeCalendarMenu(btnRef.current, panelRef.current);
      function onReflow() {
        placeCalendarMenu(btnRef.current, panelRef.current);
      }
      window.addEventListener("resize", onReflow);
      window.addEventListener("scroll", onReflow, true);
      return function () {
        window.removeEventListener("resize", onReflow);
        window.removeEventListener("scroll", onReflow, true);
      };
    },
    [open, options.length]
  );

  useEffect(
    function () {
      if (!open || !panelRef.current) return undefined;
      var currentBtn = panelRef.current.querySelector("[aria-current='true']");
      if (currentBtn && currentBtn.focus) currentBtn.focus();
      return undefined;
    },
    [open]
  );

  useEffect(
    function () {
      if (POPOVER_OK || !open) return undefined;
      function onKey(e) {
        if (e.key !== "Escape") return;
        setOpen(false);
        if (btnRef.current) btnRef.current.focus();
      }
      document.addEventListener("keydown", onKey);
      return function () {
        document.removeEventListener("keydown", onKey);
      };
    },
    [open, setOpen]
  );

  function onPanelKeyDown(e) {
    var keys = { ArrowDown: true, ArrowUp: true, Home: true, End: true };
    if (!keys[e.key] || !panelRef.current) return;
    var buttons = panelRef.current.querySelectorAll("button[data-cal-option]");
    if (!buttons.length) return;
    e.preventDefault();
    var list = Array.prototype.slice.call(buttons);
    var i = list.indexOf(document.activeElement);
    if (e.key === "Home") i = 0;
    else if (e.key === "End") i = list.length - 1;
    else if (e.key === "ArrowDown") i = i < 0 ? 0 : (i + 1) % list.length;
    else i = i <= 0 ? list.length - 1 : i - 1;
    list[i].focus();
  }

  function choose(id) {
    if (POPOVER_OK && panelRef.current && panelRef.current.hidePopover) panelRef.current.hidePopover();
    else setOpen(false);
    props.onChange(id);
  }

  function onTriggerKeyDown(e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    if (POPOVER_OK && panelRef.current && panelRef.current.showPopover) panelRef.current.showPopover();
    else setOpen(true);
  }

  var choices = <CalendarViewChoices options={options} value={value} onChoose={choose} />;
  var panel = (
    <div
      id={menuId}
      ref={panelRef}
      popover={POPOVER_OK ? "auto" : undefined}
      className={"gt-card-elevated gt-cal-view-menu" + (POPOVER_OK ? "" : " is-portal")}
      role="group"
      aria-label="Calendar views"
      onKeyDown={onPanelKeyDown}
    >
      {choices}
    </div>
  );

  return (
    <div className="gt-cal-view-wrap">
      <button
        ref={btnRef}
        type="button"
        className="gt-focus-ring gt-card-elevated gt-cal-view-trigger"
        data-cal-trigger="view"
        aria-label={"Calendar view, " + current.label}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={
          POPOVER_OK
            ? undefined
            : function () {
                setOpen(function (v) {
                  return !v;
                });
              }
        }
        onKeyDown={onTriggerKeyDown}
      >
        {current.color ? <span className="gt-cal-view-dot" style={{ background: current.color }} /> : null}
        <span className="gt-cal-view-label">{current.label}</span>
        <ChevronDown open={open} />
      </button>
      {POPOVER_OK
        ? panel
        : open
          ? createPortal(
              <div>
                <button
                  type="button"
                  className="gt-cal-view-backdrop"
                  aria-label="Close calendar views"
                  onClick={function () {
                    setOpen(false);
                  }}
                />
                {panel}
              </div>,
              document.body
            )
          : null}
    </div>
  );
}

function DayStatusMark(props) {
  var status = props.status;
  if (status === "done") return <CalDayDoneCheck color={props.color || C.accentDeep} size={11} />;
  if (status === "miss") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M2 2l6 6M8 2L2 8" stroke={C.muted} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (status === "rest") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M2 5h6" stroke={C.muted} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (status === "untracked") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5" r="3.2" fill="none" stroke={C.muted} strokeWidth="1.2" strokeDasharray="2 1.4" />
      </svg>
    );
  }
  return <span style={{ width: 10, height: 10, display: "block" }} />;
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

export function ActivityHeatDay(props) {
  var isFut = props.isFuture;
  var isT = props.isToday;
  var bits = [props.dateKey || "Day"];
  if (props.hasWorkout) bits.push("workout");
  if (props.hasWake) bits.push("early wake");
  if (props.perfect) bits.push("perfect day");
  return (
    <button
      type="button"
      className="gt-focus-ring"
      onClick={function () {
        props.onSelect();
      }}
      aria-label={bits.join(", ")}
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
        className={props.glow ? "gt-cal-glow" : undefined}
        style={{
          position: "absolute",
          inset: 3,
          borderRadius: "50%",
          background: props.heat || "transparent",
          border: props.ringBorder,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "none",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: isT ? 700 : 500, color: C.text, position: "relative", zIndex: 3 }}>{props.day}</span>
      </div>
      {!isFut && (props.hasWorkout || props.hasWake) && (
        <div style={{ position: "absolute", bottom: 2, left: 0, right: 0, display: "flex", gap: 2, justifyContent: "center", pointerEvents: "none" }}>
          {props.hasWorkout && <div style={{ width: 3, height: 3, borderRadius: "50%", background: C.accent }} />}
          {props.hasWake && <div style={{ width: 3, height: 3, borderRadius: "50%", background: C.accentDeep }} />}
        </div>
      )}
      {props.perfect && (
        <div style={{ position: "absolute", top: 0, right: 1, lineHeight: 0, pointerEvents: "none" }}>
          <IconKpiStar size={11} color="#F5C518" />
        </div>
      )}
    </button>
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

export function SingleHabitDayCell(props) {
  var k = props.dateKey;
  var habit = props.habit;
  var status = habitDayStatus(habit, props.comp, k, props.todayKey);
  var name = displayHabitNameOnDate(habit, props.focusHistory, k);
  var color = props.color || C.accentDeep;
  var isT = props.isToday;
  var label = name + ", " + statusLabel(status).toLowerCase() + ", " + k;
  var border = isT
    ? "2px solid " + C.accent
    : status === "untracked"
      ? "1.5px dashed rgba(26,35,50,0.28)"
      : status === "done"
        ? "1.5px solid " + color
        : "1.5px solid " + C.border;
  var fill = status === "done" ? color + "22" : "#FFFFFF";
  return (
    <button
      type="button"
      className="gt-focus-ring"
      onClick={function () {
        props.onSelect(k);
      }}
      aria-label={label}
      title={label}
      aria-pressed={status === "done" ? true : status === "miss" ? false : undefined}
      style={{
        aspectRatio: "1",
        background: "transparent",
        border: "none",
        borderRadius: 12,
        position: "relative",
        cursor: "pointer",
        opacity: status === "future" ? 0.42 : 1,
        padding: 0,
        fontFamily: "'DM Sans',sans-serif",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 1,
          borderRadius: 12,
          background: fill,
          border: border,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          padding: "2px 1px",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: isT ? 700 : 500, color: C.text, lineHeight: 1 }}>{props.day}</span>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 11, lineHeight: 0 }}>
          <DayStatusMark status={status} color={color} />
        </span>
      </div>
    </button>
  );
}

function LegendMarkRow(props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
      <span style={{ width: 14, display: "flex", justifyContent: "center", flexShrink: 0, lineHeight: 0 }}>
        <DayStatusMark status={props.status} color={props.color} />
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{statusLabel(props.status)}</span>
    </div>
  );
}

export function SingleHabitLegend(props) {
  var color = props.color || C.accentDeep;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px" }}>
        <LegendMarkRow status="done" color={color} />
        <LegendMarkRow status="miss" color={color} />
        <LegendMarkRow status="rest" color={color} />
        <LegendMarkRow status="untracked" color={color} />
      </div>
      <p style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.4 }}>
        {props.isOnePercent
          ? "A check is a completion on a scheduled day. Days before this habit was added are not misses. Each day keeps the 1% focus that was active then — tap a day to see it."
          : "A check is a completion on a scheduled day. A dash is a rest day. Days before this habit was added are not misses. Tap a day for details."}
      </p>
    </div>
  );
}
