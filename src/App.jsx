import { useState, useRef, useEffect, useLayoutEffect, useId } from "react";
import { createPortal } from "react-dom";
import { supabase, supaReady } from "./supabase.js";
import * as D from "./data.js";
import {
  IToday,
  ICal,
  IGainz,
  ICycles,
  ISettings,
  ISleep,
  IFlame,
  ICoach,
  IconKpiSleep,
  IconKpiWorkout,
  IconKpiHabit,
  IconKpiStar,
  IconSprout,
  IconDumbbellMark,
  CalDayDoneCheck,
  IconChevronCal,
  HabitIcon,
  ICON_GYM,
  HABIT_ICON_ORDER,
  IconUiScale,
  IconUiChartTrend,
  IconUiBowl,
  IconUiSparkles,
  IconUiAlert,
  IconUiEye,
} from "./icons.jsx";

var APP_NAV_TABS = [
  { id: "home", label: "Today", Icon: IToday },
  { id: "calendar", label: "Calendar", Icon: ICal },
  { id: "coach", label: "Coach", Icon: ICoach },
  { id: "gainz", label: "Gainz", Icon: IGainz },
  { id: "cycles", label: "Cycles", Icon: ICycles },
  { id: "sleep", label: "Sleep", Icon: ISleep },
  { id: "calories", label: "Calories", Icon: IFlame },
  { id: "settings", label: "Settings", Icon: ISettings },
];

var C = {
  bg: "#0B0E14",
  sheet: "#141824",
  /** Completed / habit-positive semantic (was green): navy bases + chrome text. */
  green: "#222836",
  gd: "#D4D8E0",
  gl: "rgba(200,204,212,0.12)",
  gm: "rgba(200,204,212,0.48)",
  accent: "#C8CCD4",
  accentDeep: "#9EA4AF",
  /** Selected chips / pressed toggles — lighter navy fill + silver rim (not violet CTA wash). */
  selFill: "#222836",
  selBorder: "rgba(212,216,224,0.52)",
  selText: "#E8EAEF",
  gradCTA: "linear-gradient(165deg,#2A3040 0%,#1A1F2E 55%,#121620 100%)",
  gradSuccess: "linear-gradient(165deg,#323A4C 0%,#222836 50%,#161B28 100%)",
  shadowCTA: "0 8px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px rgba(200,204,212,0.38)",
  shadowCTASoft: "0 4px 16px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(200,204,212,0.32)",
  shadowGlow: "0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(212,216,224,0.22)",
  text: "#F5F5F7",
  muted: "#8E8E93",
  border: "rgba(200,204,212,0.4)",
  panel: "rgba(255,255,255,0.055)",
  panelHi: "rgba(255,255,255,0.09)",
  white: "#F5F5F7",
  red: "rgba(255,95,105,0.16)",
  redT: "#FF848C",
  scrim: "rgba(8,10,16,0.65)",
  scrimMed: "rgba(8,10,16,0.54)",
  scrimSoft: "rgba(8,10,16,0.44)",
  scrimTint: "rgba(8,10,16,0.3)",
  onAccent: "#E8EAEF",
};
/** First outset box-shadow vs remainder (comma before inset). Used when clip-path would hide outward glow on shimmer pills/tabs. */
function splitFirstOutShadowLayer(boxShadowFull) {
  var re = /,\s*(?=inset\b)/,
    ix = boxShadowFull.search(re);
  if (ix === -1) return { outset: "", rest: boxShadowFull.trim() };
  return {
    outset: boxShadowFull.slice(0, ix).trim(),
    rest: boxShadowFull.slice(ix + 1).trim(),
  };
}
var DL = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
var MN = [
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
var MG = ["Biceps", "Triceps", "Chest", "Shoulders", "Back", "Legs", "Core"];
var CT = ["Bulk", "Cut", "Maintain", "Recomp", "Custom"];
var PAL = [
  "#C8CCD4",
  "#E05050",
  "#40B870",
  "#9060E0",
  "#D4A020",
  "#E07840",
  "#C060A0",
  "#50B8C0",
  "#8080C0",
  "#A0A040",
];

/** Local calendar date YYYY-MM-DD (do not use UTC / toISOString — breaks timezones behind UTC). */
function dk(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function today() {
  return dk(new Date());
}
function todayLocal() {
  return today();
}
function addDays(ymd, n) {
  var d = new Date(ymd + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function dayDiff(a, b) {
  var da = new Date(a + "T00:00:00");
  var db = new Date(b + "T00:00:00");
  return Math.round((da - db) / 86400000);
}
function dim(y, m) {
  return new Date(y, m + 1, 0).getDate();
}
function fd(y, m) {
  return new Date(y, m, 1).getDay();
}
function weekDates() {
  var t = new Date(),
    dow = t.getDay();
  return Array.from({ length: 7 }, function (_, i) {
    var d = new Date(t);
    d.setDate(t.getDate() - dow + i);
    return d;
  });
}
function fmtD(k) {
  var p = k.split("-");
  return MN[+p[1] - 1].slice(0, 3) + " " + parseInt(p[2]);
}
function fmtDS(k) {
  var p = k.split("-");
  return MN[+p[1] - 1].slice(0, 3) + " " + parseInt(p[2]) + ", " + p[0];
}
function cycleAt(cycles, k) {
  for (var i = 0; i < cycles.length; i++) {
    if (k >= cycles[i].start && k <= cycles[i].end) return cycles[i];
  }
  return null;
}
function cc(hex) {
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return {
    bar: hex,
    bg: "rgba(" + r + "," + g + "," + b + ",0.09)",
    border: "rgba(" + r + "," + g + "," + b + ",0.38)",
    text: hex,
  };
}

var HABITS = [];
var CYCLES = [];
var COMP = {};
var LOGS = {};
var DEFAULT_GYM_HABIT = { id: 3, name: "Gym", icon: ICON_GYM, scheduledDays: [1, 2, 3, 4, 5] };


function BarChart(props) {
  var data = props.data,
    mx = Math.max.apply(
      null,
      data.map(function (d) {
        return d.val;
      })
    ) || 1,
    h = props.height || 88,
    cap = 26;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: h }}>
      {data.map(function (d, i) {
        var pct = d.val / mx;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, lineHeight: 1.2, minHeight: 14 }}>{d.val > 0 ? d.val : ""}</div>
            <div
              style={{
                width: "100%",
                borderRadius: "4px 4px 0 0",
                background: d.val > 0 ? "linear-gradient(180deg,#D8DCE4 0%,#9EA4AF 100%)" : C.border,
                height: Math.max(pct * (h - cap), d.val > 0 ? 4 : 2),
                transition: "height 0.5s",
              }}
            />
            <div style={{ fontSize: 11, color: C.muted, textAlign: "center", lineHeight: 1.2 }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}
function BwChart(props) {
  var ref = useRef(null),
    pts = props.points;
  useEffect(
    function () {
      var cv = ref.current;
      if (!cv || pts.length < 2) return;
      var ctx = cv.getContext("2d"),
        W = cv.width,
        H = cv.height;
      ctx.clearRect(0, 0, W, H);
      var vals = pts.map(function (p) {
          return p.val;
        }),
        mn = Math.min.apply(null, vals),
        mx = Math.max.apply(null, vals);
      var pd = 20,
        rng = mx - mn || 1;
      function px(i) {
        return pd + (i / (pts.length - 1)) * (W - pd * 2);
      }
      function py(v) {
        return H - pd - ((v - mn) / rng) * (H - pd * 2);
      }
      var gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, "rgba(200,204,212,0.28)");
      gr.addColorStop(1, "rgba(200,204,212,0)");
      ctx.beginPath();
      ctx.moveTo(px(0), py(pts[0].val));
      for (var i = 1; i < pts.length; i++) ctx.lineTo(px(i), py(pts[i].val));
      ctx.lineTo(px(pts.length - 1), H);
      ctx.lineTo(px(0), H);
      ctx.closePath();
      ctx.fillStyle = gr;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px(0), py(pts[0].val));
      for (var j = 1; j < pts.length; j++) ctx.lineTo(px(j), py(pts[j].val));
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.stroke();
      pts.forEach(function (p, i) {
        ctx.beginPath();
        ctx.arc(px(i), py(p.val), 3, 0, Math.PI * 2);
        ctx.fillStyle = C.white;
        ctx.fill();
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.fillStyle = C.muted;
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(mx.toFixed(1), 2, pd + 4);
      ctx.fillText(mn.toFixed(1), 2, H - pd + 4);
    },
    [pts]
  );
  return <canvas ref={ref} width={342} height={110} style={{ display: "block" }} />;
}

function GymQ(props) {
  var init = props.initial || {};
  var bS = useState(init.bodyweight == null ? "" : String(init.bodyweight)),
    mS = useState(function () {
      var m = {};
      (Array.isArray(init.muscles) ? init.muscles : []).forEach(function (mg) { m[mg] = true; });
      return m;
    }),
    sS = useState(init.sets || {}),
    cmS = useState(init.cardio_minutes != null && init.cardio_minutes !== "" ? String(init.cardio_minutes) : "");
  var bw = bS[0],
    setBw = bS[1],
    selM = mS[0],
    setSelM = mS[1],
    sets = sS[0],
    setSets = sS[1],
    cardio = cmS[0],
    setCardio = cmS[1];
  function adjCardio(d5) {
    setCardio(function (prev) {
      var parsed = parseGymCardioMinutesInput(prev || "");
      var base = parsed.ok ? parsed.n : 0;
      var n = Math.max(0, Math.min(300, base + d5));
      return String(n);
    });
  }
  function togM(m) {
    setSelM(function (p) {
      var n = Object.assign({}, p);
      n[m] = !n[m];
      if (!n[m])
        setSets(function (s) {
          var ns = Object.assign({}, s);
          delete ns[m];
          return ns;
        });
      else
        setSets(function (s) {
          var ns = Object.assign({}, s);
          ns[m] = ns[m] || 0;
          return ns;
        });
      return n;
    });
  }
  function adj(m, d) {
    setSets(function (s) {
      var n = Object.assign({}, s);
      n[m] = Math.max(0, Math.min(20, (n[m] || 0) + d));
      return n;
    });
  }
  var muscles = Object.keys(selM).filter(function (m) {
    return selM[m];
  });
  var dayKey = props.day || today();
  var isLogToday = dayKey === today();
  var dayLabel = isLogToday ? "today" : new Date(dayKey + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  var cardioParsed = parseGymCardioMinutesInput(cardio);
  var canSaveGym = !!bw.trim() && cardioParsed.ok;
  var cardioFieldErr = cardio.trim() && !cardioParsed.ok ? cardioParsed.error : null;
  var saving = !!props.saving;
  var saveError = props.saveError || null;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.scrim, display: "flex", alignItems: "flex-end", zIndex: 200 }}>
      <div
        style={{
          background: "linear-gradient(180deg," + C.sheet + "," + C.bg + ")",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: "28px 28px 0 0",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          padding: "24px 20px 48px",
          width: "100%",
          maxHeight: "88%",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 4 }}>Workout Log</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>How did {dayLabel} go?</div>
        {saveError && (
          <div style={{ marginBottom: 14, padding: "10px 12px", background: C.red, borderRadius: 12, fontSize: 12, color: C.redT, fontWeight: 600, lineHeight: 1.45 }}>
            {saveError}
          </div>
        )}
        <div style={{ marginBottom: 18 }}>
          <label htmlFor="gymq-bw" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, display: "block" }}>
            Bodyweight (lbs)
          </label>
          <input
            id="gymq-bw"
            type="number"
            value={bw}
            onChange={function (e) {
              setBw(e.target.value);
            }}
            placeholder="e.g. 183.5"
            step="0.5"
            className="gt-input"
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1.5px solid " + C.border,
              borderRadius: 12,
              fontSize: 16,
              fontFamily: "'DM Sans',sans-serif",
              color: C.text,
              background: C.panel,
              outline: "none",
            }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label htmlFor="gymq-cardio" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, display: "block" }}>
            Cardio (minutes)
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              id="gymq-cardio"
              type="number"
              inputMode="numeric"
              min={0}
              max={300}
              step={1}
              value={cardio}
              onChange={function (e) {
                setCardio(e.target.value);
              }}
              placeholder="0–300"
              className="gt-input"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "12px 14px",
                border: "1.5px solid " + (cardioFieldErr ? C.redT : C.border),
                borderRadius: 12,
                fontSize: 16,
                fontFamily: "'DM Sans',sans-serif",
                color: C.text,
                background: C.panel,
                outline: "none",
              }}
            />
            <button
              type="button"
              className="gt-focus-ring gt-min-tap"
              aria-label="Decrease cardio by 5 minutes"
              onClick={function () {
                adjCardio(-5);
              }}
              style={{ width: 44, height: 44, borderRadius: "50%", background: C.border, border: "none", fontSize: 18, cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              -
            </button>
            <button
              type="button"
              className="gt-focus-ring gt-min-tap"
              aria-label="Increase cardio by 5 minutes"
              onClick={function () {
                adjCardio(5);
              }}
              style={{ width: 44, height: 44, borderRadius: "50%", background: C.gradCTA, border: "none", fontSize: 18, cursor: "pointer", color: C.onAccent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              +
            </button>
          </div>
          {!cardio.trim() ? (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Required. Use <strong style={{ fontWeight: 700, color: C.text }}>0</strong> if you did no cardio.</div>
          ) : cardioFieldErr ? (
            <div style={{ fontSize: 11, color: C.redT, marginTop: 6, fontWeight: 600 }}>{cardioFieldErr}</div>
          ) : null}
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Muscle Groups</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MG.map(function (m) {
              var a = selM[m];
              return (
                <button
                  key={m}
                  onClick={function () {
                    togM(m);
                  }}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    background: a ? C.selFill : C.panel,
                    border: "1.5px solid " + (a ? C.selBorder : C.border),
                    color: a ? C.selText : C.text,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
        {muscles.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Sets</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {muscles.map(function (m) {
                return (
                  <div key={m} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, borderRadius: 12, padding: "10px 14px", border: "1.5px solid " + C.border }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        type="button"
                        className="gt-focus-ring gt-min-tap"
                        aria-label={"Decrease sets for " + m}
                        onClick={function () {
                          adj(m, -1);
                        }}
                        style={{ width: 44, height: 44, borderRadius: "50%", background: C.border, border: "none", fontSize: 20, cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: 18, fontWeight: 700, color: C.text, minWidth: 24, textAlign: "center" }}>{sets[m] || 0}</span>
                      <button
                        type="button"
                        className="gt-focus-ring gt-min-tap"
                        aria-label={"Increase sets for " + m}
                        onClick={function () {
                          adj(m, 1);
                        }}
                        style={{ width: 44, height: 44, borderRadius: "50%", background: C.gradCTA, border: "none", fontSize: 20, cursor: "pointer", color: C.onAccent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <button
          type="button"
          disabled={!canSaveGym || saving}
          onClick={function () {
            if (!canSaveGym || saving) return;
            var s = {};
            muscles.forEach(function (m) {
              if (sets[m] > 0) s[m] = sets[m];
            });
            props.onSave({ bodyweight: parseFloat(bw), muscles: muscles, sets: s, cardio_minutes: cardioParsed.n });
          }}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: 18,
            background: canSaveGym && !saving ? C.gradCTA : C.border,
            border: "none",
            color: canSaveGym && !saving ? C.onAccent : C.muted,
            fontSize: 16,
            fontWeight: 700,
            cursor: canSaveGym && !saving ? "pointer" : "default",
            fontFamily: "'DM Sans',sans-serif",
            marginBottom: 12,
            opacity: saving ? 0.75 : 1,
          }}
        >
          {saving ? "Saving\u2026" : "Save Workout"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={props.onSkip}
          style={{ width: "100%", padding: "12px", borderRadius: 18, background: "none", border: "none", color: C.muted, fontSize: 13, cursor: saving ? "default" : "pointer", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.45 }}
        >
          Skip for now
          <span style={{ display: "block", fontSize: 11, fontWeight: 500, marginTop: 4, opacity: 0.85 }}>Keeps gym checked; sets and weight are not saved until you log a workout.</span>
        </button>
      </div>
    </div>
  );
}

function WkDetail(props) {
  var log = props.log,
    k = props.dateKey;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.scrim, display: "flex", alignItems: "flex-end", zIndex: 200 }}>
      <div
        style={{
          background: "linear-gradient(180deg," + C.sheet + "," + C.bg + ")",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: "28px 28px 0 0",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          padding: "24px 20px 48px",
          width: "100%",
          maxHeight: "75%",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>{fmtD(k)}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Workout session</div>
          </div>
          <button onClick={props.onClose} style={{ background: "none", border: "none", fontSize: 22, color: C.muted, cursor: "pointer" }}>
            x
          </button>
        </div>
        <div style={{ background: C.panel, borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: "1.5px solid " + C.border }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Bodyweight</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>{log.bodyweight} lbs</div>
        </div>
        {cardioMinutesOnLog(log) > 0 ? (
          <div style={{ background: C.panel, borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: "1.5px solid " + C.border }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Cardio</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>{cardioMinutesOnLog(log)} min</div>
          </div>
        ) : null}
        {log.muscles && log.muscles.length > 0 && (
          <div style={{ background: C.panel, borderRadius: 14, padding: "12px 14px", border: "1.5px solid " + C.border }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 10 }}>Muscles</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {log.muscles.map(function (m) {
                var s = log.sets && log.sets[m] ? log.sets[m] : 0;
                return (
                  <div key={m}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m}</span>
                      <span style={{ fontSize: 13, color: C.muted }}>{s} sets</span>
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: Math.min(s / 20, 1) * 100 + "%", background: "linear-gradient(90deg," + C.accentDeep + "," + C.accent + ")", borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CalView(props) {
  var h = props.habit,
    comp = props.comp,
    cy = props.calYear,
    cm = props.calMonth,
    tk = props.todayKey;
  var wl = props.wl || {},
    cycles = props.cycles || [];
  var isGym = h.icon === ICON_GYM;
  var dkS = useState(null);
  var detK = dkS[0],
    setDetK = dkS[1];
  var done = comp[h.id] || {};
  var days = dim(cy, cm),
    first = fd(cy, cm);
  var cells = Array.from({ length: first }, function () {
    return null;
  }).concat(
    Array.from({ length: days }, function (_, i) {
      return i + 1;
    })
  );
  function ck(d) {
    return cy + "-" + String(cm + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }
  function isSched(d) {
    return h.scheduledDays.includes(new Date(cy, cm, d).getDay());
  }
  var prefix = cy + "-" + String(cm + 1).padStart(2, "0");
  var mDone = Object.keys(done).filter(function (k) {
    return k.startsWith(prefix) && done[k];
  }).length;
  var activeCycs = isGym
    ? cycles.filter(function (c) {
        return c.start <= prefix + "-31" && c.end >= prefix + "-01";
      })
    : [];
  return (
    <div style={{ padding: "0 16px 16px", position: "relative" }}>
      {detK && wl[detK] && <WkDetail log={wl[detK]} dateKey={detK} onClose={() => setDetK(null)} />}
      <button type="button" className="gt-focus-ring" onClick={() => props.onBack()} style={{ background: "none", border: "none", color: C.accent, fontSize: 15, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", padding: "8px 0" }}>
        Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 14px" }}>
        <span style={{ display: "flex", alignItems: "center" }}>
          <HabitIcon id={h.icon} size={36} color={C.text} />
        </span>
        <div>
          <div style={{ fontSize: 21, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>{h.name}</div>
          <div style={{ fontSize: 12, color: C.muted }}>Tap days to toggle</div>
        </div>
      </div>
      {activeCycs.map(function (cyc) {
        var col = cc(cyc.color || PAL[0]);
        return (
          <div key={cyc.id} style={{ background: col.bg, border: "1.5px solid " + col.border, borderRadius: 12, padding: "8px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.bar, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: col.text }}>
                {cyc.name} ({cyc.type})
              </div>
              <div style={{ fontSize: 10, color: col.text, opacity: 0.7 }}>
                {fmtDS(cyc.start)} to {fmtDS(cyc.end)} - {cyc.calories} kcal
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, borderRadius: 14, padding: "10px 14px", marginBottom: 12 }}>
        <button
          type="button"
          className="gt-focus-ring"
          aria-label="Previous month"
          onClick={function () {
            cm === 0 ? (props.setCM(11), props.setCY(function (y) { return y - 1; })) : props.setCM(function (m) { return m - 1; });
          }}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, padding: "4px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <IconChevronCal dir="left" />
        </button>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 17, color: C.text, fontWeight: 600 }}>
          {MN[cm]} {cy}
        </div>
        <button
          type="button"
          className="gt-focus-ring"
          aria-label="Next month"
          onClick={function () {
            cm === 11 ? (props.setCM(0), props.setCY(function (y) { return y + 1; })) : props.setCM(function (m) { return m + 1; });
          }}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, padding: "4px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <IconChevronCal dir="right" />
        </button>
      </div>
      <div style={{ background: C.panel, borderRadius: 18, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
          {DL.map(function (d) {
            return (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: C.muted }}>
                {d}
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
          {cells.map(function (day, i) {
            if (!day) return <div key={i} style={{ aspectRatio: "1" }} aria-hidden="true" />;
            var k = ck(day),
              isDone = !!done[k],
              isT = k === tk,
              isFut = k > tk,
              sched = isSched(day);
            var hasLog = isGym && isDone && !!wl[k];
            var cyc = isGym ? cycleAt(cycles, k) : null;
            var col = cyc ? cc(cyc.color || PAL[0]) : null;
            var cantUse = isFut || !sched;
            return (
              <button
                key={k + "-" + i}
                type="button"
                disabled={cantUse}
                className="gt-focus-ring"
                aria-pressed={cantUse ? undefined : isDone}
                aria-label={
                  !sched ? h.name + " not scheduled — " + k : isFut ? h.name + " — " + k + " (future)" : hasLog ? "Workout log " + k : (isDone ? "Unmark " + h.name + " " + k : "Mark " + h.name + " done " + k)
                }
                onClick={function () {
                  if (cantUse) return;
                  if (hasLog) {
                    setDetK(k);
                    return;
                  }
                  props.onToggle(h.id, k);
                }}
                style={{
                  aspectRatio: "1",
                  borderRadius: "50%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isDone ? C.green : isT ? C.gl : col ? col.bg : "transparent",
                  border: isT && !isDone ? "2px solid " + C.accent : col && !isDone ? "2px solid " + col.border : "2px solid transparent",
                  opacity: isFut ? 0.28 : !sched ? 0.22 : 1,
                  position: "relative",
                  cursor: !cantUse ? "pointer" : "default",
                  transition: "background 0.2s",
                  padding: 0,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{ fontSize: 12, color: isDone ? C.onAccent : C.text, fontWeight: isT ? 700 : 400 }}>{day}</span>
                {isDone && (
                  <span style={{ position: "absolute", bottom: 4, display: "flex", lineHeight: 0 }}>
                    <CalDayDoneCheck color={C.onAccent} size={11} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 12, background: C.panel, borderRadius: 14, padding: "12px 16px", display: "flex", justifyContent: "space-around" }}>
        {[
          { val: mDone, label: "This month" },
          { val: props.getStreak(h.id), label: "Streak" },
          { val: props.getRate(h.id) + "%", label: "All-time" },
        ].map(function (s, i) {
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.accent, fontFamily: "'DM Serif Display',serif" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GainzTab(props) {
  var wl = props.wl,
    gym = props.gym,
    comp = props.comp,
    cycles = props.cycles || [];
  var todayKey = props.todayKey != null ? props.todayKey : today();
  var rS = useState("1M");
  var range = rS[0],
    setRange = rS[1];
  var tk = todayKey,
    allK = Object.keys(wl).sort();
  var cutoff = new Date();
  if (range === "1M") cutoff.setMonth(cutoff.getMonth() - 1);
  else if (range === "3M") cutoff.setMonth(cutoff.getMonth() - 3);
  else cutoff = new Date("2000-01-01");
  var ck2 = dk(cutoff);
  var bwPts = allK
    .filter(function (k) {
      return k >= ck2 && wl[k].bodyweight;
    })
    .map(function (k) {
      var p = k.split("-");
      return { val: wl[k].bodyweight, label: parseInt(p[2]) + "/" + parseInt(p[1]) };
    });
  var wd = weekDates(),
    ws = dk(wd[0]),
    mp = tk.slice(0, 7);
  var wkM = {},
    moM = {};
  MG.forEach(function (m) {
    wkM[m] = 0;
    moM[m] = 0;
  });
  allK.forEach(function (k) {
    var l = wl[k];
    if (!l.muscles) return;
    l.muscles.forEach(function (m) {
      if (k >= ws) wkM[m] = (wkM[m] || 0) + (l.sets && l.sets[m] ? l.sets[m] : 0);
      if (k.startsWith(mp)) moM[m] = (moM[m] || 0) + (l.sets && l.sets[m] ? l.sets[m] : 0);
    });
  });
  var lwS = new Date(wd[0]);
  lwS.setDate(lwS.getDate() - 7);
  var lwSk = dk(lwS),
    lwEk = dk(new Date(wd[0].getTime() - 86400000));
  var twS = 0,
    lwS2 = 0,
    twMS = {},
    lwMS = {};
  MG.forEach(function (m) {
    twMS[m] = 0;
    lwMS[m] = 0;
  });
  allK.forEach(function (k) {
    var l = wl[k];
    if (!l.sets) return;
    var tot = Object.values(l.sets).reduce(function (a, b) {
      return a + b;
    }, 0);
    if (k >= ws) {
      twS += tot;
      Object.keys(l.sets).forEach(function (m) {
        twMS[m] = (twMS[m] || 0) + l.sets[m];
      });
    } else if (k >= lwSk && k <= lwEk) {
      lwS2 += tot;
      Object.keys(l.sets).forEach(function (m) {
        lwMS[m] = (lwMS[m] || 0) + l.sets[m];
      });
    }
  });
  var twCm = 0,
    lwCm = 0,
    moCm = 0;
  allK.forEach(function (k) {
    var cv = cardioMinutesOnLog(wl[k]);
    if (k >= ws) twCm += cv;
    if (k.startsWith(mp)) moCm += cv;
    if (k >= lwSk && k <= lwEk) lwCm += cv;
  });
  var gDone = gym && comp[gym.id] ? comp[gym.id] : {},
    gStr = 0,
    todayD = new Date();
  for (var i = 0; i < 365; i++) {
    var d = new Date(todayD);
    d.setDate(todayD.getDate() - i);
    var kk = dk(d);
    if (gym && !gym.scheduledDays.includes(d.getDay())) continue;
    if (gDone[kk]) gStr++;
    else if (i > 0) break;
  }
  var bwKeysAll = allK.filter(function (k) {
    return wl[k] && wl[k].bodyweight != null && wl[k].bodyweight !== "";
  });
  var latBw = bwKeysAll.length ? wl[bwKeysAll[bwKeysAll.length - 1]].bodyweight : null;
  var latBwKey = bwKeysAll.length ? bwKeysAll[bwKeysAll.length - 1] : null;
  var bwMoChg = null;
  if (latBwKey != null && latBw != null) {
    var latD3 = new Date(latBwKey + "T12:00:00");
    var winStartD3 = new Date(latD3);
    winStartD3.setDate(winStartD3.getDate() - 30);
    var winStartK3 = dk(winStartD3);
    var inWinBw = bwKeysAll.filter(function (k) {
      return k >= winStartK3 && k <= latBwKey;
    });
    if (inWinBw.length >= 2) {
      bwMoChg = latBw - wl[inWinBw[0]].bodyweight;
    }
  }
  var activeCycGw = cycleAt(cycles, todayKey);
  var bwSummaryCol = bwDeltaColorForCycle(bwMoChg, activeCycGw);
  var mwd = MG.filter(function (m) {
    return twMS[m] > 0 || lwMS[m] > 0;
  });
  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ padding: "16px 24px 14px" }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Gainz</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>Your Progress</div>
      </div>
      {!gym && (
        <div style={{ margin: "0 16px", background: C.panel, borderRadius: 14, padding: "18px", textAlign: "center", border: "1.5px solid " + C.border }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>No gym habit yet</div>
          <div style={{ fontSize: 12, color: C.muted }}>Add a habit using the Gym (dumbbell) icon to start tracking workouts.</div>
        </div>
      )}
      {gym && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {[
              { Icon: IFlame, val: gStr + " days", label: "Streak" },
              { Icon: IconKpiWorkout, val: allK.length, label: "Sessions" },
            ].map(function (s, i) {
              var GCardI = s.Icon;
              return (
                <div key={i} style={{ background: C.panel, borderRadius: 14, padding: "12px", border: "1.5px solid " + C.border, textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", lineHeight: 0 }}>
                    <GCardI size={20} color={C.accent} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginTop: 3 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{s.label}</div>
                </div>
              );
            })}
            <div style={{ background: C.panel, borderRadius: 14, padding: "12px", border: "1.5px solid " + C.border, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", lineHeight: 0 }}>
                <IconUiScale size={20} color={C.accent} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginTop: 3 }}>
                {latBw != null ? latBw + " lb" : "\u2013"}
              </div>
              {bwMoChg !== null && (
                <div>
                  <div style={{ fontSize: 10, color: bwSummaryCol, fontWeight: 600 }}>
                    {bwMoChg > 0 ? "+" : ""}
                    {bwMoChg.toFixed(1)} lb
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginTop: 2, lineHeight: 1.2 }}>since last month</div>
                </div>
              )}
            </div>
            <div
              style={{
                background: C.panel,
                borderRadius: 14,
                padding: "12px",
                border: "1.5px solid " + C.border,
                textAlign: "center",
                gridColumn: "2 / 3",
                justifySelf: "stretch",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", lineHeight: 0 }}>
                <HabitIcon id="run" size={20} color={C.accent} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginTop: 3 }}>
                {twCm}
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}> min</span>
              </div>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginTop: 2, lineHeight: 1.2 }}>Cardio · this week</div>
              {moCm > 0 && (
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginTop: 4, lineHeight: 1.2 }}>
                  {moCm} min this month
                </div>
              )}
            </div>
          </div>
          <div style={{ background: C.panel, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Weekly Volume</div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: C.accent }} />
                  <span style={{ fontSize: 10, color: C.muted }}>This wk</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: C.border }} />
                  <span style={{ fontSize: 10, color: C.muted }}>Last wk</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid " + C.border }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Total sets</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>{lwS2}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{twS}</span>
                {lwS2 > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: twS >= lwS2 ? C.accent : C.redT }}>{twS >= lwS2 ? "^" : "v"}{Math.abs(twS - lwS2)}</span>}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid " + C.border }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Cardio (minutes)</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>{lwCm}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{twCm}</span>
                {lwCm > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: twCm >= lwCm ? C.accent : C.redT }}>
                    {twCm >= lwCm ? "^" : "v"}
                    {Math.abs(twCm - lwCm)}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {mwd.length === 0 && <div style={{ textAlign: "center", color: C.muted, fontSize: 12, padding: "6px 0" }}>No sets logged yet.</div>}
              {mwd.map(function (m) {
                var tw = twMS[m] || 0,
                  lw = lwMS[m] || 0,
                  mx = Math.max(tw, lw, 1);
                return (
                  <div key={m}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{m}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 11, color: C.muted }}>{lw > 0 ? lw : ""}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: tw > 0 ? C.accent : C.muted }}>{tw > 0 ? tw : "\u2013"}</span>
                      </div>
                    </div>
                    <div style={{ position: "relative", height: 4, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: (lw / mx) * 100 + "%", background: C.gm, borderRadius: 99 }} />
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: (tw / mx) * 100 + "%", background: "linear-gradient(90deg," + C.accentDeep + "," + C.accent + ")", borderRadius: 99, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: C.panel, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Bodyweight</div>
              <div style={{ display: "flex", gap: 4 }}>
                {["1M", "3M", "All"].map(function (r) {
                  return (
                    <button
                      key={r}
                      onClick={function () {
                        setRange(r);
                      }}
                      style={{ padding: "3px 9px", borderRadius: 20, background: range === r ? C.selFill : C.border, border: range === r ? "1px solid " + C.selBorder : "none", color: range === r ? C.selText : C.muted, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
            {bwPts.length >= 2 ? <BwChart points={bwPts} /> : <div style={{ textAlign: "center", padding: "16px 0", color: C.muted, fontSize: 13 }}>Log 2+ sessions to see trend.</div>}
          </div>
          <div style={{ background: C.panel, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Sets per Muscle - This Week</div>
            <BarChart
              data={MG.map(function (m) {
                return { label: m.slice(0, 3), val: wkM[m] || 0 };
              })}
              height={76}
            />
          </div>
          <div style={{ background: C.panel, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Sets per Muscle - This Month</div>
            <BarChart
              data={MG.map(function (m) {
                return { label: m.slice(0, 3), val: moM[m] || 0 };
              })}
              height={76}
            />
          </div>
          <div style={{ background: C.panel, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Recent Sessions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {allK
                .slice(-5)
                .reverse()
                .map(function (k) {
                  var l = wl[k],
                    p = k.split("-"),
                    cm = cardioMinutesOnLog(l),
                    st = l.sets ? Object.values(l.sets).reduce(function (a, b) { return a + b; }, 0) : 0;
                  return (
                    <div key={k} style={{ display: "flex", gap: 10, alignItems: "center", paddingBottom: 7, borderBottom: "1px solid " + C.border }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: C.gl, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: C.gd, textTransform: "uppercase" }}>{MN[+p[1] - 1].slice(0, 3)}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.gd }}>{parseInt(p[2])}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{l.muscles ? l.muscles.join(", ") : "\u2013"}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {st} sets · {l.bodyweight} lb
                          {cm > 0 ? " \u00B7 " + cm + " min cardio" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CyclesTab(props) {
  var cycles = props.cycles,
    setCycles = props.setCycles;
  var sfS = useState(false);
  var sf = sfS[0],
    setSf = sfS[1];
  var edS = useState(null);
  var ed = edS[0],
    setEd = edS[1];
  var fnS = useState(""),
    ftS = useState("Bulk"),
    fsS = useState(""),
    feS = useState(""),
    fcaS = useState(""),
    fsuS = useState(""),
    fcoS = useState(PAL[0]);
  var fn = fnS[0],
    setFn = fnS[1],
    ft = ftS[0],
    setFt = ftS[1],
    fs = fsS[0],
    setFs = fsS[1],
    fe = feS[0],
    setFe = feS[1];
  var fca = fcaS[0],
    setFca = fcaS[1],
    fsu = fsuS[0],
    setFsu = fsuS[1],
    fco = fcoS[0],
    setFco = fcoS[1];
  function openNew() {
    setEd(null);
    setFn("");
    setFt("Bulk");
    setFs("");
    setFe("");
    setFca("");
    setFsu("");
    setFco(PAL[0]);
    setSf(true);
  }
  function openEdit(c) {
    setEd(c.id);
    setFn(c.name);
    setFt(c.type);
    setFs(c.start);
    setFe(c.end);
    setFca(String(c.calories));
    setFsu(c.supplements || "");
    setFco(c.color || PAL[0]);
    setSf(true);
  }
  function save() {
    if (!fn.trim() || !fs || !fe) return;
    var e = { id: ed || Date.now(), name: fn.trim(), type: ft, color: fco, start: fs, end: fe, calories: parseInt(fca, 10) || 0, supplements: fsu.trim() };
    setCycles(function (p) {
      if (ed) return p.map(function (c) { return c.id === ed ? e : c; });
      return p.concat([e]).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
    });
    D.fireAndForget(D.upsertCycle(e), "saveCycle");
    setSf(false);
  }
  var tk = today(),
    active = cycleAt(cycles, tk);
  return (
    <div style={{ paddingBottom: 16, position: "relative" }}>
      <div style={{ padding: "16px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Cycles</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>My Cycles</div>
        </div>
        <button onClick={openNew} style={{ width: 40, height: 40, borderRadius: "50%", background: C.gradCTA, border: "none", color: C.onAccent, fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: C.shadowCTASoft, lineHeight: 1, fontWeight: 300 }}>
          +
        </button>
      </div>
      {active &&
        (function () {
          var col = cc(active.color || PAL[0]);
          return (
            <div style={{ margin: "0 16px 12px", background: col.bg, border: "1.5px solid " + col.border, borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: col.text, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Active Now</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: col.text, marginBottom: 2 }}>{active.name}</div>
              <div style={{ fontSize: 12, color: col.text, opacity: 0.8 }}>
                {active.type} - {active.calories} kcal/day
              </div>
              {active.supplements && <div style={{ fontSize: 11, color: col.text, opacity: 0.7, marginTop: 3 }}>{active.supplements}</div>}
            </div>
          );
        })()}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {cycles.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px", background: C.panel, borderRadius: 20, border: "1.5px dashed " + C.border }}>
            <div style={{ marginBottom: 10, display: "flex", justifyContent: "center", lineHeight: 0 }}>
              <IconUiChartTrend size={40} color={C.accent} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>No cycles yet</div>
            <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 18 }}>Track bulk, cut, or recomp phases.</div>
            <button onClick={openNew} style={{ padding: "11px 24px", borderRadius: 99, background: C.gradCTA, border: "none", color: C.onAccent, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              Add first cycle
            </button>
          </div>
        )}
        {cycles.map(function (cyc) {
          var col = cc(cyc.color || PAL[0]);
          var isA = tk >= cyc.start && tk <= cyc.end,
            isP = tk > cyc.end;
          return (
            <div key={cyc.id} style={{ background: C.panel, borderRadius: 18, border: "1.5px solid " + (isA ? col.border : C.border), overflow: "hidden" }}>
              <div style={{ height: 4, background: col.bar, opacity: isP ? 0.4 : 1 }} />
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{cyc.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: col.bar, background: col.bg, border: "1px solid " + col.border, borderRadius: 99, padding: "1px 7px" }}>{cyc.type}</span>
                      {isA && <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, background: C.gl, border: "1px solid " + C.gm, borderRadius: 99, padding: "1px 7px" }}>Active</span>}
                      {isP && <span style={{ fontSize: 10, color: C.muted, background: C.border, borderRadius: 99, padding: "1px 7px" }}>Past</span>}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {fmtDS(cyc.start)} to {fmtDS(cyc.end)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => openEdit(cyc)} style={{ padding: "4px 10px", borderRadius: 8, background: C.gl, border: "none", color: C.gd, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Edit
                    </button>
                    <button
                      onClick={function () {
                        var delId = cyc.id;
                        setCycles(function (p) {
                          return p.filter(function (c) {
                            return c.id !== delId;
                          });
                        });
                        D.fireAndForget(D.deleteCycle(delId), "deleteCycle");
                      }}
                      style={{ padding: "4px 10px", borderRadius: 8, background: C.red, border: "none", color: C.redT, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                    >
                      Del
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 1 }}>Calories</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>{cyc.calories ? cyc.calories.toLocaleString() : "\u2013"}</div>
                    <div style={{ fontSize: 9, color: C.muted }}>kcal/day</div>
                  </div>
                  {cyc.supplements && (
                    <div style={{ flex: 2, background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 1 }}>Supplements</div>
                      <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4 }}>{cyc.supplements}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {sf && (
        <div style={{ position: "absolute", inset: 0, background: C.scrimMed, display: "flex", alignItems: "flex-end", zIndex: 200 }}>
          <div onClick={function (e) { e.stopPropagation(); }} style={{ background: "linear-gradient(180deg," + C.sheet + "," + C.bg + ")", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: "28px 28px 0 0", borderTop: "1px solid rgba(255,255,255,0.12)", padding: "22px 20px 48px", width: "100%", maxHeight: "92%", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 14px" }} />
            <div style={{ fontSize: 19, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 16 }}>{ed ? "Edit Cycle" : "New Cycle"}</div>
            <div style={{ marginBottom: 14 }}>
              <label htmlFor="cycle-name-input" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "block" }}>
                Name
              </label>
              <input id="cycle-name-input" value={fn} onChange={(e) => setFn(e.target.value)} placeholder="e.g. Winter Bulk 2026" className="gt-input" style={{ width: "100%", padding: "11px 13px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.panel, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div id="cycle-type-label" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                Type
              </div>
              <div role="group" aria-labelledby="cycle-type-label" style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {CT.map(function (t) {
                  var a = ft === t;
                  return (
                    <button key={t} type="button" className="gt-focus-ring" aria-pressed={a} onClick={() => setFt(t)} style={{ padding: "8px 14px", borderRadius: 20, background: a ? C.selFill : "transparent", border: "1.5px solid " + (a ? C.selBorder : C.border), color: a ? C.selText : C.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", minHeight: 44 }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div id="cycle-color-label" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                Color
              </div>
              <div role="group" aria-labelledby="cycle-color-label" style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                {PAL.map(function (hex) {
                  var a = fco === hex;
                  return (
                    <button
                      key={hex}
                      type="button"
                      className="gt-focus-ring gt-min-tap"
                      onClick={() => setFco(hex)}
                      aria-label={"Cycle color " + hex}
                      aria-pressed={a}
                      style={{
                        width: 44,
                        height: 44,
                        flexShrink: 0,
                        borderRadius: 12,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: hex,
                          border: a ? "3px solid " + C.text : "3px solid transparent",
                          boxSizing: "border-box",
                          boxShadow: a ? "0 0 0 2px rgba(255,255,255,0.88),0 0 0 4px " + hex : "none",
                        }}
                      />
                    </button>
                  );
                })}
                <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span aria-hidden style={{ width: 28, height: 28, borderRadius: "50%", background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)", border: "2px solid " + C.border, pointerEvents: "none" }} />
                  <input type="color" value={fco} onChange={(e) => setFco(e.target.value)} aria-label="Custom cycle color" className="gt-min-tap" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", borderRadius: 12 }} />
                </div>
              </div>
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: fco }} />
                <span style={{ fontSize: 11, color: C.muted }}>{fco}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="cycle-start" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "block" }}>
                  Start
                </label>
                <input id="cycle-start" type="date" value={fs} onChange={(e) => setFs(e.target.value)} className="gt-input" style={{ width: "100%", padding: "10px 9px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.panel, outline: "none" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="cycle-end" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "block" }}>
                  End
                </label>
                <input id="cycle-end" type="date" value={fe} onChange={(e) => setFe(e.target.value)} className="gt-input" style={{ width: "100%", padding: "10px 9px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.panel, outline: "none" }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label htmlFor="cycle-calories" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "block" }}>
                Daily Calories
              </label>
              <input id="cycle-calories" type="number" value={fca} onChange={(e) => setFca(e.target.value)} placeholder="e.g. 3200" className="gt-input" style={{ width: "100%", padding: "11px 13px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.panel, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="cycle-supplements" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "block" }}>
                Supplements
              </label>
              <textarea id="cycle-supplements" value={fsu} onChange={(e) => setFsu(e.target.value)} placeholder="e.g. Creatine 5g, Whey 2x" rows={2} className="gt-input" style={{ width: "100%", padding: "11px 13px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.panel, outline: "none", resize: "none" }} />
            </div>
            <button onClick={save} style={{ width: "100%", padding: "14px", borderRadius: 16, background: fn.trim() && fs && fe ? C.gradCTA : C.border, border: "none", color: fn.trim() && fs && fe ? C.onAccent : C.muted, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
              {ed ? "Save Changes" : "Add Cycle"}
            </button>
            <button onClick={() => setSf(false)} style={{ width: "100%", padding: "11px", borderRadius: 16, background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab(props) {
  var habits = props.habits,
    setHabits = props.setHabits;
  var edS = useState(null);
  var ed = edS[0],
    setEd = edS[1];
  var fnS = useState(""),
    iconS = useState("star"),
    fdS = useState([0, 1, 2, 3, 4, 5, 6]);
  var fn = fnS[0],
    setFn = fnS[1],
    iconEdit = iconS[0],
    setIconEdit = iconS[1],
    fd2 = fdS[0],
    setFd = fdS[1];
  function openEdit(h) {
    setEd(h.id);
    setFn(h.name);
    setIconEdit(h.icon);
    setFd(h.scheduledDays.slice());
  }
  function save() {
    if (!fn.trim() || !fd2.length) return;
    var idx = habits.findIndex(function (h) { return h.id === ed; });
    var updated = Object.assign({}, habits[idx] || {}, { id: ed, name: fn.trim(), icon: iconEdit, scheduledDays: fd2 });
    setHabits(function (p) {
      return p.map(function (h) {
        return h.id === ed ? Object.assign({}, h, { name: fn.trim(), icon: iconEdit, scheduledDays: fd2 }) : h;
      });
    });
    D.fireAndForget(D.upsertHabit(updated, idx < 0 ? 0 : idx), "editHabit");
    setEd(null);
  }
  function togD(d) {
    setFd(function (p) {
      return p.includes(d) ? p.filter(function (x) { return x !== d; }) : p.concat([d]).sort(function (a, b) { return a - b; });
    });
  }
  function moveUp(i) {
    if (i === 0) return;
    setHabits(function (p) {
      var n = p.slice(),
        tmp = n[i];
      n[i] = n[i - 1];
      n[i - 1] = tmp;
      D.fireAndForget(D.reorderHabits(n), "moveUp");
      return n;
    });
  }
  function moveDown(i) {
    setHabits(function (p) {
      if (i >= p.length - 1) return p;
      var n = p.slice(),
        tmp = n[i];
      n[i] = n[i + 1];
      n[i + 1] = tmp;
      D.fireAndForget(D.reorderHabits(n), "moveDown");
      return n;
    });
  }
  return (
    <div style={{ paddingBottom: 16, position: "relative" }}>
      <div style={{ padding: "16px 24px 18px" }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Settings</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>My Habits</div>
      </div>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {habits.length === 0 && <div style={{ textAlign: "center", padding: "36px 20px", color: C.muted, fontSize: 13 }}>No habits yet.</div>}
        {habits.map(function (h, i) {
          return (
            <div key={h.id} style={{ background: C.panel, borderRadius: 18, border: "1.5px solid " + C.border, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.gl, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <HabitIcon id={h.icon} size={24} color={C.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                  {DL.filter(function (_, idx) {
                    return h.scheduledDays.includes(idx);
                  }).join(" ")}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  type="button"
                  className="gt-focus-ring gt-min-tap"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  aria-label={"Move " + h.name + " up"}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: i === 0 ? C.border : C.gl,
                    border: "none",
                    color: i === 0 ? C.muted : C.gd,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: i === 0 ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ^
                </button>
                <button
                  type="button"
                  className="gt-focus-ring gt-min-tap"
                  onClick={() => moveDown(i)}
                  disabled={i === habits.length - 1}
                  aria-label={"Move " + h.name + " down"}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: i === habits.length - 1 ? C.border : C.gl,
                    border: "none",
                    color: i === habits.length - 1 ? C.muted : C.gd,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: i === habits.length - 1 ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  v
                </button>
              </div>
              <button onClick={() => openEdit(h)} style={{ padding: "6px 12px", borderRadius: 9, background: C.gl, border: "none", color: C.gd, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Edit
              </button>
            </div>
          );
        })}
      </div>
      {ed && (
        <div style={{ position: "absolute", inset: 0, background: C.scrimMed, display: "flex", alignItems: "flex-end", zIndex: 200 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(180deg," + C.sheet + "," + C.bg + ")", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: "28px 28px 0 0", borderTop: "1px solid rgba(255,255,255,0.12)", padding: "22px 20px 48px", width: "100%", maxHeight: "88%", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 14px" }} />
            <div style={{ fontSize: 19, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 16 }}>Edit Habit</div>
            <div style={{ marginBottom: 16 }}>
              <div id="habit-edit-icon-label" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                Icon
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} aria-labelledby="habit-edit-icon-label">
                {HABIT_ICON_ORDER.map(function (hid) {
                  return (
                    <button
                      key={hid}
                      type="button"
                      className="gt-focus-ring gt-min-tap"
                      onClick={() => setIconEdit(hid)}
                      aria-label={"Icon " + hid}
                      aria-pressed={iconEdit === hid}
                      style={{ width: 44, height: 44, borderRadius: 11, background: iconEdit === hid ? C.gl : C.panel, border: "2px solid " + (iconEdit === hid ? C.accent : C.border), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    >
                      <HabitIcon id={hid} size={22} color={iconEdit === hid ? C.accent : C.muted} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="habit-edit-name" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "block" }}>
                Name
              </label>
              <input id="habit-edit-name" value={fn} onChange={(e) => setFn(e.target.value)} className="gt-input" style={{ width: "100%", padding: "12px 13px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.panel, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <div id="habit-edit-schedule-label" style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                Schedule
              </div>
              <div style={{ display: "flex", gap: 4 }} role="group" aria-labelledby="habit-edit-schedule-label">
                {DL.map(function (label, i) {
                  var a = fd2.includes(i);
                  return (
                    <button key={i} type="button" className="gt-focus-ring" onClick={() => togD(i)} aria-pressed={a} style={{ flex: 1, minHeight: 44, padding: "8px 4px", borderRadius: 9, background: a ? C.selFill : C.panel, border: "1.5px solid " + (a ? C.selBorder : C.border), color: a ? C.selText : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={save} style={{ width: "100%", padding: "14px", borderRadius: 16, background: fn.trim() && fd2.length ? C.gradCTA : C.border, border: "none", color: fn.trim() && fd2.length ? C.onAccent : C.muted, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
              Save Changes
            </button>
            <button
              onClick={function () {
                var delId = ed;
                setHabits(function (p) {
                  return p.filter(function (h) {
                    return h.id !== delId;
                  });
                });
                D.fireAndForget(D.deleteHabit(delId), "deleteHabit");
                setEd(null);
              }}
              style={{ width: "100%", padding: "12px", borderRadius: 16, background: C.red, border: "none", color: C.redT, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}
            >
              Delete Habit
            </button>
            <button onClick={() => setEd(null)} style={{ width: "100%", padding: "11px", borderRadius: 16, background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function scoreColor(s) {
  if (s == null) return C.muted;
  if (s >= 85) return "#E8EAEF";
  if (s >= 70) return "#B8C0CC";
  return "#E05050";
}
/** Dark fills for charts/bars — pair with scoreTextOnFill for contrast (not light silver on silver). */
function scoreFill(s) {
  if (s == null) return null;
  if (s >= 85) return "#222836";
  if (s >= 70) return "#1E2633";
  return "rgba(224,80,80,0.38)";
}
function scoreTextOnFill(s) {
  if (s == null) return C.muted;
  if (s >= 85) return "#E8EAEF";
  if (s >= 70) return "#D4D8E0";
  return "#FFFFFF";
}
/** Muted label on scoreFill pill (e.g. "score" caption). */
function scoreCaptionOnFill(s) {
  if (s == null) return C.muted;
  if (s >= 85) return "#B8C0CC";
  if (s >= 70) return "#C8CCD4";
  return "#FF848C";
}
function computeSleepDebt(sleep, anchorKey) {
  if (!anchorKey) return null;
  var TARGET_SEC = 8 * 3600;
  var WINDOW = 7;
  var anchor = new Date(anchorKey + "T00:00:00");
  if (isNaN(anchor.getTime())) return null;
  var debtSec = 0;
  var anyData = false;
  for (var i = 0; i < WINDOW; i++) {
    var d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    var k = dk(d);
    var rec = sleep[k];
    if (rec && rec.total_sleep_duration != null) {
      anyData = true;
      debtSec += Math.max(0, TARGET_SEC - rec.total_sleep_duration);
    }
  }
  return anyData ? debtSec / 3600 : null;
}
function debtColor(hrs) {
  if (hrs == null) return C.border;
  if (hrs <= 2) return "#2A3548";
  if (hrs <= 5) return "#E5B53C";
  return "#E05050";
}

function SleepDebtBadge(props) {
  var hrs = props.hours;
  var size = props.size || 52;
  var hasData = hrs != null;
  var rounded = hasData ? Math.round(hrs) : null;
  var isZero = hasData && rounded === 0;
  var col = debtColor(hasData ? rounded : null);
  var textColor = hasData ? C.white : C.muted;
  var shadow = "0 6px 16px rgba(0,0,0,0.18)";
  return (
    <div
      title={hasData ? rounded + " hr sleep debt (last 7 days)" : "No sleep debt data"}
      style={{
        position: "absolute",
        bottom: 2,
        right: 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: col,
        border: "3px solid " + C.bg,
        outline: isZero ? "2px solid #E5B53C" : "none",
        outlineOffset: isZero ? "1px" : "0",
        boxShadow: shadow,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: textColor,
        fontFamily: "'DM Sans',sans-serif",
        transition: "background 0.3s ease, outline 0.3s ease",
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>
        {hasData ? rounded : "\u2013"}
      </div>
      <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", marginTop: 2, opacity: 0.9 }}>
        {hasData ? "hr debt" : "no data"}
      </div>
    </div>
  );
}
function scoreLabel(s) {
  if (s == null) return "No data";
  if (s >= 85) return "Optimal";
  if (s >= 70) return "Good";
  return "Pay attention";
}
function scoreTextOn(s) {
  if (s == null) return C.text;
  if (s >= 70 && s < 85) return "#D4D8E0";
  return C.white;
}
function fmtDur(secs) {
  if (secs == null) return "\u2013";
  var h = Math.floor(secs / 3600);
  var m = Math.round((secs % 3600) / 60);
  if (m === 60) {
    h += 1;
    m = 0;
  }
  return h + "h " + String(m).padStart(2, "0") + "m";
}
function fmtTimeISO(iso) {
  if (!iso) return "\u2013";
  var d = new Date(iso);
  if (isNaN(d.getTime())) return "\u2013";
  var h = d.getHours();
  var m = String(d.getMinutes()).padStart(2, "0");
  var ap = h >= 12 ? "PM" : "AM";
  var h12 = h % 12 || 12;
  return h12 + ":" + m + " " + ap;
}

function ScoreRing(props) {
  var size = props.size || 140;
  var stroke = 12;
  var r = (size - stroke) / 2;
  var cx = size / 2,
    cy = size / 2;
  var circ = 2 * Math.PI * r;
  var score = props.score;
  var pct = score != null ? Math.max(0, Math.min(100, score)) / 100 : 0;
  var col = scoreColor(score);
  var shimmerSvg = !!props.shimmer && pct > 0;
  var gradIdRaw = useId();
  var baseId = "_sr_" + gradIdRaw.replace(/\W/g, "_");
  var gradId = baseId + "_g";
  var maskId = baseId + "_m";
  var reduceMotionSvg =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        {shimmerSvg ? (
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={cx - r * 1.15}
              y1={cy}
              x2={cx + r * 1.15}
              y2={cy}
              gradientTransform={reduceMotionSvg ? "rotate(52 " + cx + " " + cy + ")" : undefined}
            >
              <stop offset="30%" stopColor={col} stopOpacity={1} />
              <stop offset="42%" stopColor="rgba(255,255,255,0.48)" />
              <stop offset="48%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="54%" stopColor="rgba(240,243,247,0.52)" />
              <stop offset="62%" stopColor={col} stopOpacity={1} />
              {!reduceMotionSvg ? (
                <animateTransform
                  attributeName="gradientTransform"
                  attributeType="XML"
                  type="rotate"
                  from={"0 " + cx + " " + cy}
                  to={"360 " + cx + " " + cy}
                  dur="5.25s"
                  repeatCount="indefinite"
                />
              ) : null}
            </linearGradient>
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <rect x="0" y="0" width={size} height={size} fill="black" />
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="white"
                strokeWidth={stroke}
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct)}
                strokeLinecap="round"
                transform={"rotate(-90 " + cx + " " + cy + ")"}
              />
            </mask>
          </defs>
        ) : null}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform={"rotate(-90 " + cx + " " + cy + ")"}
          style={{ transition: "stroke-dashoffset 0.7s ease, stroke 0.4s ease" }}
        />
        {shimmerSvg ? (
          <rect x="0" y="0" width={size} height={size} fill={"url(#" + gradId + ")"} mask={"url(#" + maskId + ")"} opacity={0.48} />
        ) : null}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 44, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>
          {score != null ? score : "\u2013"}
        </div>
        <div style={{ fontSize: 10, color: score != null ? scoreTextOnFill(score) : C.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 5 }}>
          {scoreLabel(score)}
        </div>
      </div>
    </div>
  );
}

var CONTRIB_KEYS = [
  { k: "total_sleep", label: "Total" },
  { k: "rem_sleep", label: "REM" },
  { k: "deep_sleep", label: "Deep" },
  { k: "efficiency", label: "Eff" },
  { k: "restfulness", label: "Rest" },
  { k: "latency", label: "Latency" },
  { k: "timing", label: "Timing" },
];

function ContributorBars(props) {
  var contributors = props.contributors;
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {CONTRIB_KEYS.map(function (item) {
        var val = contributors ? contributors[item.k] : null;
        var fillCol = scoreFill(val);
        var txtCol = val != null ? scoreTextOnFill(val) : C.muted;
        var pct = val != null ? Math.max(0, Math.min(100, val)) / 100 : 0;
        return (
          <div key={item.k} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 52, background: C.bg, borderRadius: 6, position: "relative", overflow: "hidden", border: "1px solid " + C.border }}>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: pct * 100 + "%",
                  background: fillCol || "transparent",
                  transition: "height 0.6s ease, background 0.4s ease",
                }}
              />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: txtCol, transition: "color 0.4s" }}>
                {val != null ? val : "\u2013"}
              </div>
            </div>
            <div style={{ fontSize: 8, color: C.muted, fontWeight: 600, marginTop: 4, letterSpacing: 0.2 }}>{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function Sparkline(props) {
  var data = props.data;
  var w = props.width || 328;
  var h = props.height || 42;
  var filledIdx = [];
  data.forEach(function (d, i) {
    if (d.score != null) filledIdx.push(i);
  });
  if (filledIdx.length < 2) {
    return (
      <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 11 }}>
        Need 2+ scored nights to draw trend
      </div>
    );
  }
  var scores = filledIdx.map(function (i) { return data[i].score; });
  var mn = Math.max(0, Math.min.apply(null, scores) - 6);
  var mx = Math.min(100, Math.max.apply(null, scores) + 6);
  var rng = mx - mn || 1;
  var pad = 8;
  function px(i) { return pad + (i / (data.length - 1)) * (w - pad * 2); }
  function py(s) { return h - pad - ((s - mn) / rng) * (h - pad * 2); }
  var pts = filledIdx.map(function (i) {
    return { x: px(i), y: py(data[i].score), score: data[i].score };
  });
  var pathD = pts
    .map(function (p, i) { return (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1); })
    .join(" ");
  var areaD = pathD + " L" + pts[pts.length - 1].x.toFixed(1) + "," + h + " L" + pts[0].x.toFixed(1) + "," + h + " Z";
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id="spark-gr" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity={0.34} />
          <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#spark-gr)" />
      <path d={pathD} stroke={C.accent} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(function (p, i) {
        return <circle key={i} cx={p.x} cy={p.y} r={2.8} fill={C.white} stroke={scoreColor(p.score)} strokeWidth={1.8} />;
      })}
    </svg>
  );
}

function SleepCalendar(props) {
  var year = props.year,
    month = props.month,
    sleep = props.sleep,
    selected = props.selected,
    todayKey = props.todayKey;
  var days = dim(year, month);
  var first = fd(year, month);
  var cells = Array.from({ length: first }, function () { return null; }).concat(
    Array.from({ length: days }, function (_, i) { return i + 1; })
  );
  function dKey(d) {
    return year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }
  return (
    <div style={{ background: C.panel, borderRadius: 14, padding: 12, border: "1.5px solid " + C.border }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={function () { props.onMonthChange(-1); }} style={{ background: "none", border: "none", fontSize: 18, color: C.accent, cursor: "pointer", padding: 2 }}>{"<"}</button>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 15, color: C.text, fontWeight: 600 }}>
          {MN[month]} {year}
        </div>
        <button onClick={function () { props.onMonthChange(1); }} style={{ background: "none", border: "none", fontSize: 18, color: C.accent, cursor: "pointer", padding: 2 }}>{">"}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {DL.map(function (d) {
          return <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.muted, fontWeight: 600 }}>{d}</div>;
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {cells.map(function (day, i) {
          if (!day) return <div key={i} />;
          var k = dKey(day);
          var data = sleep[k];
          var hasScore = data && data.score != null;
          var fillBg = hasScore ? scoreFill(data.score) : "transparent";
          var txt = hasScore ? scoreTextOnFill(data.score) : C.muted;
          var isSel = k === selected;
          var isT = k === todayKey;
          var isFut = k > todayKey;
          var chromeBorder = hasScore && !isSel ? "1px solid rgba(212,216,224,0.35)" : "1.5px solid transparent";
          var border =
            isSel ? "2px solid rgba(232,236,243,0.65)" : hasScore ? chromeBorder : "1.5px solid " + C.border;
          var shadow = isT && !isSel ? "inset 0 0 0 2px " + C.accent : "none";
          return (
            <button
              key={i}
              type="button"
              onClick={function () { if (!isFut) props.onSelect(k); }}
              disabled={isFut}
              style={{
                aspectRatio: "1",
                borderRadius: 9,
                border: border,
                background: fillBg,
                boxShadow: shadow,
                color: txt,
                cursor: isFut ? "default" : "pointer",
                opacity: isFut ? 0.28 : 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                fontFamily: "'DM Sans',sans-serif",
                lineHeight: 1,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: isT || isSel ? 700 : 600, color: txt }}>{day}</div>
              {hasScore && (
                <div style={{ fontSize: 9, fontWeight: 700, color: txt, opacity: 0.92, marginTop: 2 }}>{data.score}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

var STAGE_DEFS = [
  { k: "deep_sleep_duration", label: "Deep", color: "#1E2633" },
  { k: "rem_sleep_duration", label: "REM", color: "#4A5564" },
  { k: "light_sleep_duration", label: "Light", color: "#8E96A4" },
  { k: "awake_time", label: "Awake", color: "#C17A3A" },
];

function SleepDayDetail(props) {
  var day = props.day,
    data = props.data;
  if (!data) {
    return (
      <div style={{ background: C.panel, borderRadius: 14, padding: "18px 14px", border: "1.5px dashed " + C.border, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>{fmtDS(day)}</div>
        <div style={{ fontSize: 13, color: C.muted }}>No Oura data for this day</div>
      </div>
    );
  }
  var totalStages = STAGE_DEFS.reduce(function (a, s) { return a + (data[s.k] || 0); }, 0);
  var stats = [
    { label: "Avg HR", val: data.average_heart_rate, unit: "bpm" },
    { label: "Min HR", val: data.lowest_heart_rate, unit: "bpm" },
    { label: "Avg HRV", val: data.average_hrv, unit: "ms" },
    { label: "Breath", val: data.average_breath != null ? data.average_breath.toFixed(1) : null, unit: "br/m" },
    { label: "Efficiency", val: data.efficiency, unit: "%" },
    { label: "Latency", val: data.latency != null ? Math.round(data.latency / 60) : null, unit: "min" },
  ];
  return (
    <div style={{ background: C.panel, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>{fmtDS(day)}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginTop: 2 }}>
            {fmtDur(data.total_sleep_duration)}
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginLeft: 5 }}>asleep</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {fmtTimeISO(data.bedtime_start)} {"\u2192"} {fmtTimeISO(data.bedtime_end)}
            {data.time_in_bed != null && (
              <span>{" \u00B7 "}in bed {fmtDur(data.time_in_bed)}</span>
            )}
          </div>
        </div>
        {data.score != null && (
          <div
            style={{
              textAlign: "right",
              flexShrink: 0,
              minWidth: 72,
              background: scoreFill(data.score),
              border: "1px solid rgba(212,216,224,0.35)",
              borderRadius: 12,
              padding: "8px 12px",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'DM Serif Display',serif", color: scoreTextOnFill(data.score), lineHeight: 1 }}>{data.score}</div>
            <div style={{ fontSize: 10, color: scoreCaptionOnFill(data.score), fontWeight: 600 }}>score</div>
          </div>
        )}
      </div>
      {totalStages > 0 && (
        <div>
          <div style={{ height: 9, background: C.border, borderRadius: 99, overflow: "hidden", display: "flex" }}>
            {STAGE_DEFS.map(function (s) {
              var v = data[s.k] || 0;
              if (v <= 0) return null;
              return <div key={s.k} title={s.label + " " + fmtDur(v)} style={{ width: (v / totalStages) * 100 + "%", background: s.color }} />;
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>
            {STAGE_DEFS.map(function (s) {
              var v = data[s.k] || 0;
              return (
                <div key={s.k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 11, color: C.text, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{fmtDur(v)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
        {stats.map(function (s) {
          return (
            <div key={s.label} style={{ background: C.bg, borderRadius: 9, padding: "8px 9px" }}>
              <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1.1, marginTop: 2 }}>
                {s.val != null ? s.val : "\u2013"}
                {s.val != null && <span style={{ fontSize: 9, color: C.muted, fontWeight: 500, marginLeft: 3 }}>{s.unit}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {data.contributors && (
        <div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 }}>Contributors</div>
          <ContributorBars contributors={data.contributors} />
        </div>
      )}
    </div>
  );
}

function pickLatestKey(sleep, fallback) {
  var withScore = Object.keys(sleep)
    .filter(function (k) { return sleep[k] && sleep[k].score != null; })
    .sort();
  return withScore.length ? withScore[withScore.length - 1] : fallback;
}

function SleepTab(props) {
  var sleep = props.sleep,
    setSleep = props.setSleep;
  var tk = today();

  var loadingS = useState(false);
  var loading = loadingS[0],
    setLoading = loadingS[1];
  var errorS = useState(null);
  var error = errorS[0],
    setError = errorS[1];
  var selS = useState(pickLatestKey(sleep, tk));
  var selected = selS[0],
    setSelected = selS[1];
  var now = new Date();
  var calYS = useState(now.getFullYear());
  var calY = calYS[0],
    setCalY = calYS[1];
  var calMS = useState(now.getMonth());
  var calM = calMS[0],
    setCalM = calMS[1];

  function changeMonth(dir) {
    var m = calM + dir,
      y = calY;
    if (m < 0) { m = 11; y--; }
    else if (m > 11) { m = 0; y++; }
    setCalM(m);
    setCalY(y);
  }

  function fetchData() {
    setLoading(true);
    setError(null);
    var endD = new Date();
    var startD = new Date();
    startD.setDate(startD.getDate() - 7);
    var startStr = dk(startD),
      endStr = dk(endD);
    function ouraUrl(endpoint, params) {
      var qs = new URLSearchParams(Object.assign({ endpoint: endpoint }, params || {}));
      return "/api/oura/proxy?" + qs.toString();
    }
    var u1 = ouraUrl("v2/usercollection/daily_sleep", { start_date: startStr, end_date: endStr });
    var u2 = ouraUrl("v2/usercollection/sleep", { start_date: startStr, end_date: endStr });
    Promise.all([fetch(u1), fetch(u2)])
      .then(function (rs) {
        if (!rs[0].ok) throw new Error("daily_sleep " + rs[0].status);
        if (!rs[1].ok) throw new Error("sleep " + rs[1].status);
        return Promise.all([rs[0].json(), rs[1].json()]);
      })
      .then(function (jsons) {
        var ds = jsons[0],
          slp = jsons[1];
        var merged = Object.assign({}, sleep);
        (ds.data || []).forEach(function (item) {
          merged[item.day] = Object.assign({}, merged[item.day] || {}, {
            score: item.score,
            contributors: item.contributors,
          });
        });
        (slp.data || [])
          .filter(function (it) { return it.type === "long_sleep"; })
          .forEach(function (item) {
            merged[item.day] = Object.assign({}, merged[item.day] || {}, {
              bedtime_start: item.bedtime_start,
              bedtime_end: item.bedtime_end,
              total_sleep_duration: item.total_sleep_duration,
              time_in_bed: item.time_in_bed,
              rem_sleep_duration: item.rem_sleep_duration,
              deep_sleep_duration: item.deep_sleep_duration,
              light_sleep_duration: item.light_sleep_duration,
              awake_time: item.awake_time,
              efficiency: item.efficiency,
              latency: item.latency,
              average_heart_rate: item.average_heart_rate,
              lowest_heart_rate: item.lowest_heart_rate,
              average_hrv: item.average_hrv,
              average_breath: item.average_breath,
              restless_periods: item.restless_periods,
            });
          });
        setSleep(merged);
        var latest = pickLatestKey(merged, tk);
        setSelected(latest);
        setLoading(false);
      })
      .catch(function (err) {
        setError(String(err.message || err));
        setLoading(false);
      });
  }

  useEffect(function () {
    fetchData();
  }, []);

  var current = sleep[selected];
  var sparkData = Array.from({ length: 7 }, function (_, i) {
    var d = new Date();
    d.setDate(d.getDate() - (6 - i));
    var k = dk(d);
    return { day: k, score: sleep[k] ? sleep[k].score : null };
  });
  var titleText = selected === tk ? "Last Night" : fmtDS(selected);

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ padding: "16px 22px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Sleep</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1.1 }}>{titleText}</div>
        </div>
        <button
          type="button"
          className="gt-focus-ring gt-min-tap"
          onClick={fetchData}
          disabled={loading}
          aria-label="Refresh from Oura"
          style={{ width: 44, height: 44, borderRadius: "50%", background: loading ? C.border : C.gl, border: "none", color: C.accent, fontSize: 17, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}
        >
          {loading ? "\u2026" : "\u21BB"}
        </button>
      </div>

      {error && (
        <div style={{ margin: "0 16px 8px", padding: "8px 12px", background: C.red, borderRadius: 10, fontSize: 11, color: C.redT, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ padding: "2px 16px 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: 140, height: 140 }}>
          <ScoreRing score={current ? current.score : null} size={140} shimmer={true} />
          <SleepDebtBadge hours={computeSleepDebt(sleep, selected)} />
        </div>
      </div>

      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Contributors</div>
        <ContributorBars contributors={current ? current.contributors : null} />
      </div>

      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Last 7 Days</div>
          <div style={{ fontSize: 9, color: C.muted }}>score trend</div>
        </div>
        <div style={{ background: C.panel, borderRadius: 11, padding: "8px 6px", border: "1.5px solid " + C.border }}>
          <Sparkline data={sparkData} width={328} height={42} />
        </div>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <SleepCalendar
          year={calY}
          month={calM}
          sleep={sleep}
          selected={selected}
          todayKey={tk}
          onSelect={setSelected}
          onMonthChange={changeMonth}
        />
        <SleepDayDetail day={selected} data={current} />
      </div>
    </div>
  );
}

/** Friendlier banner when PostgREST reports custom_foods missing from schema cache. */
function friendlyCustomFoodsDbError(err) {
  var msg = typeof err === "string" ? err : err && err.message ? String(err.message) : "";
  if (!msg) return "Something went wrong saving custom food.";
  if (/custom_foods/i.test(msg) && (/schema cache|PGRST205|could not find|not find/i.test(msg))) {
    return "Custom foods aren't set up yet. In Supabase -> SQL Editor, run supabase/migrations/20260520130100_custom_foods.sql (see docs/DATABASE_CUSTOM_FOODS.md), then refresh this page.";
  }
  return msg;
}

function parseFsDesc(desc) {
  if (!desc) return null;
  var m = desc.match(/Per\s+([^-]+?)\s*-\s*Calories:\s*([\d.]+)\s*kcal(?:\s*\|\s*Fat:\s*([\d.]+)\s*g)?(?:\s*\|\s*Carbs:\s*([\d.]+)\s*g)?(?:\s*\|\s*Protein:\s*([\d.]+)\s*g)?/i);
  if (!m) return null;
  return {
    serving: m[1].trim(),
    calories: +m[2],
    fat: m[3] != null ? +m[3] : null,
    carbs: m[4] != null ? +m[4] : null,
    protein: m[5] != null ? +m[5] : null,
  };
}

/** Per-serving macros derived from a stored food_log row (for rescaling on edit & search rebuild). */
function perServingMacrosFromLogRow(row) {
  var s = Math.max(0.25, Number(row.servings) || 0.25);
  return {
    serving: row.serving_description || "serving",
    calories: (Number(row.calories) || 0) / s,
    protein: row.protein != null ? (Number(row.protein) || 0) / s : null,
    carbs: row.carbs != null ? (Number(row.carbs) || 0) / s : null,
    fat: row.fat != null ? (Number(row.fat) || 0) / s : null,
  };
}
function foodDescriptionFromPerServing(p) {
  var cal = Math.round(p.calories * 10) / 10;
  var parts = ["Per " + p.serving + " - Calories: " + cal + " kcal"];
  if (p.fat != null) parts.push("Fat: " + (Math.round(p.fat * 10) / 10) + " g");
  if (p.carbs != null) parts.push("Carbs: " + (Math.round(p.carbs * 10) / 10) + " g");
  if (p.protein != null) parts.push("Protein: " + (Math.round(p.protein * 10) / 10) + " g");
  return parts.join(" | ");
}
/** FatSecret-shaped object from DB row for AddFoodSheet / logFood. */
function foodFromLogRow(row) {
  var ps = perServingMacrosFromLogRow(row);
  return {
    food_id: String(row.food_id),
    food_name: row.food_name,
    brand_name: row.brand_name || null,
    food_description: foodDescriptionFromPerServing(ps),
    __fromLog: true,
    __isCustom: isCustomFoodId(row.food_id),
    __lastServings: row.servings,
  };
}
function isCustomFoodId(id) {
  return String(id).indexOf("custom:") === 0;
}
function newCustomFoodId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return "custom:" + crypto.randomUUID();
  return "custom:" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 14);
}
/** FatSecret-shaped item from custom_foods table row */
function foodFromCustomRow(row) {
  return {
    food_id: row.food_id,
    food_name: row.food_name,
    brand_name: null,
    food_description: foodDescriptionFromPerServing({
      serving: "serving",
      calories: Number(row.calories),
      protein: Number(row.protein),
      carbs: Number(row.carbs),
      fat: Number(row.fat),
    }),
    __isCustom: true,
    __fromLog: false,
  };
}
function scaleMacrosPerServing(p, servings) {
  var mul = function (n) {
    return n == null ? null : Math.round(n * servings * 10) / 10;
  };
  return {
    calories: mul(p.calories) || 0,
    protein: mul(p.protein),
    carbs: mul(p.carbs),
    fat: mul(p.fat),
  };
}

/** Gainz summary: color signed delta (lb) from active cycle type. */
function bwDeltaColorForCycle(deltaLb, activeCycle) {
  if (deltaLb == null || Math.abs(deltaLb) < 0.05) return C.muted;
  if (!activeCycle || !activeCycle.type) return C.muted;
  var t = activeCycle.type;
  if (t === "Bulk") return deltaLb > 0 ? C.accent : C.redT;
  if (t === "Cut") return deltaLb < 0 ? C.accent : C.redT;
  if (t === "Maintain" || t === "Recomp" || t === "Custom") {
    if (Math.abs(deltaLb) <= 1) return C.muted;
    return C.muted;
  }
  return C.muted;
}

function AddFoodSheet(props) {
  var food = props.food;
  var isCustom = !!(food && (food.__isCustom || isCustomFoodId(food.food_id)));
  var portalRootRef = props.portalRoot;
  var hostS = useState(function () {
    return portalRootRef && portalRootRef.current;
  });
  var portalHost = hostS[0],
    setPortalHost = hostS[1];
  useLayoutEffect(
    function () {
      var el = portalRootRef && portalRootRef.current;
      setPortalHost(function (prev) {
        var next = el || null;
        return Object.is(prev, next) ? prev : next;
      });
    },
    [portalRootRef, food && food.food_id]
  );
  var qS = useState(1);
  var qty = qS[0],
    setQty = qS[1];
  useEffect(
    function () {
      setQty(isCustom ? 1 : 1);
    },
    [food && food.food_id, isCustom]
  );
  function bump(d) {
    if (isCustom) {
      var ci = Math.max(1, Math.round(Number(qty) || 1) + (d >= 1 ? 1 : -1));
      setQty(ci);
      return;
    }
    var v = +(qty + d).toFixed(2);
    if (v < 0.25) v = 0.25;
    setQty(v);
  }
  if (!portalHost) return null;
  var p = parseFsDesc(food.food_description) || { serving: "serving", calories: 0, fat: null, carbs: null, protein: null };
  var qEff = isCustom ? Math.max(1, Math.round(Number(qty) || 1)) : Math.max(0.25, Number(qty) || 0.25);
  return createPortal(
    <div
      onClick={props.onCancel}
      role="presentation"
      style={{
        position: "absolute",
        inset: 0,
        background: C.scrimSoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingRight: "max(12px, env(safe-area-inset-right))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        paddingLeft: "max(12px, env(safe-area-inset-left))",
        boxSizing: "border-box",
        zIndex: 240,
        animation: "fadeIn 0.18s ease both",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-food-sheet-title"
        onClick={function (e) { e.stopPropagation(); }}
        style={{
          background: "linear-gradient(180deg," + C.sheet + "," + C.bg + ")",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          width: "100%",
          maxWidth: "min(336px, 100%)",
          borderRadius: 20,
          padding: "16px 16px 18px",
          animation: "slideUp 0.24s cubic-bezier(0.34,1.56,0.64,1) both",
          fontFamily: "'DM Sans',sans-serif",
          maxHeight: "calc(100% - 24px)",
          overflowY: "auto",
          boxShadow: "0 16px 42px rgba(0,0,0,0.55)",
          border: "1.5px solid " + C.border,
          flexShrink: 0,
        }}
      >
        <div id="add-food-sheet-title" style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1.25 }}>{food.food_name}</div>
        {food.brand_name && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{food.brand_name}</div>}
        <div style={{ marginTop: 10, padding: "9px 12px", background: C.panel, borderRadius: 12, border: "1px solid " + C.border, fontSize: 11, color: C.muted }}>
          Per <span style={{ color: C.text, fontWeight: 600 }}>{p.serving}</span> {"\u00B7"} <span style={{ color: C.text, fontWeight: 600 }}>{Math.round(p.calories)} cal</span>
          {p.protein != null && <span> {"\u00B7"} P {p.protein}g</span>}
          {p.carbs != null && <span> {"\u00B7"} C {p.carbs}g</span>}
          {p.fat != null && <span> {"\u00B7"} F {p.fat}g</span>}
        </div>
        <label htmlFor="add-food-servings-qty" style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.55, marginTop: 14, marginBottom: 6, display: "block" }}>
          Servings
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" className="gt-focus-ring gt-min-tap" onClick={function () { bump(isCustom ? -1 : -0.5); }} aria-label="Decrease servings" style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid " + C.border, background: C.panel, fontSize: 20, fontWeight: 700, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {"\u2212"}
          </button>
          <input
            id="add-food-servings-qty"
            type="number"
            step={isCustom ? 1 : 0.25}
            min={isCustom ? 1 : 0.25}
            value={qty}
            onChange={function (e) {
              var v = +e.target.value;
              if (isCustom) {
                if (isNaN(v) || v < 1) setQty(1);
                else setQty(Math.floor(v));
                return;
              }
              if (isNaN(v) || v < 0) v = 0;
              setQty(v);
            }}
            aria-label="Number of servings"
            className="gt-input"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: "1.5px solid " + C.border, fontSize: 17, fontWeight: 700, textAlign: "center", color: C.text, outline: "none", fontFamily: "'DM Sans',sans-serif", background: C.panel }}
          />
          <button type="button" className="gt-focus-ring gt-min-tap" onClick={function () { bump(isCustom ? 1 : 0.5); }} aria-label="Increase servings" style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid " + C.border, background: C.panel, fontSize: 20, fontWeight: 700, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            +
          </button>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 8, textAlign: "center" }}>
          = <span style={{ color: C.text, fontWeight: 700 }}>{Math.round(p.calories * qEff)} cal</span>
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 17 }}>
          <button onClick={props.onCancel} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid " + C.border, background: C.panel, fontSize: 13, fontWeight: 700, color: C.muted, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
          <button
            onClick={function () {
              var nv = qty;
              if (isCustom) nv = Math.max(1, Math.round(Number(qty) || 0));
              else nv = Math.max(0.25, +(Number(qty) || 0.25));
              props.onConfirm(nv);
            }}
            disabled={isCustom ? !(Number(qty) >= 1 && !isNaN(Number(qty))) : !(Number(qty) >= 0.25)}
            style={{
              flex: 1.4,
              padding: "11px",
              borderRadius: 12,
              border: "none",
              background: C.gradCTA,
              color: C.onAccent,
              fontSize: 13,
              fontWeight: 700,
              cursor: isCustom ? (Number(qty) >= 1 ? "pointer" : "default") : Number(qty) >= 0.25 ? "pointer" : "default",
              opacity: isCustom ? (Number(qty) >= 1 ? 1 : 0.6) : Number(qty) >= 0.25 ? 1 : 0.6,
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: C.shadowCTASoft,
            }}
          >
            Add to log
          </button>
        </div>
      </div>
    </div>,
    portalHost
  );
}

function CustomFoodSheet(props) {
  var portalRootRef = props.portalRoot;
  var hostS = useState(function () {
    return portalRootRef && portalRootRef.current;
  });
  var portalHost = hostS[0],
    setPortalHost = hostS[1];
  useLayoutEffect(
    function () {
      var el = portalRootRef && portalRootRef.current;
      setPortalHost(function (prev) {
        var next = el || null;
        return Object.is(prev, next) ? prev : next;
      });
    },
    [portalRootRef]
  );
  var nmS = useState(""),
    calS = useState(""),
    pS = useState(""),
    carbS = useState(""),
    fatS = useState("");
  var nm = nmS[0],
    setNm = nmS[1];
  var calStr = calS[0],
    setCalStr = calS[1];
  var pStr = pS[0],
    setPStr = pS[1];
  var carbStr = carbS[0],
    setCarbStr = carbS[1];
  var fatStr = fatS[0],
    setFatStr = fatS[1];

  function parseNut(x) {
    var n = parseFloat(String(x).trim());
    return Number.isFinite(n) ? n : NaN;
  }
  function validForm() {
    if (!nm.trim()) return null;
    var cal = parseNut(calStr);
    var prot = parseNut(pStr);
    var crb = parseNut(carbStr);
    var ft = parseNut(fatStr);
    if (!(cal > 0)) return null;
    if (!Number.isFinite(prot) || prot < 0) return null;
    if (!Number.isFinite(crb) || crb < 0) return null;
    if (!Number.isFinite(ft) || ft < 0) return null;
    return { nm: nm.trim(), cal: cal, prot: prot, crb: crb, ft: ft };
  }
  function save() {
    var v = validForm();
    if (!v || !portalHost) return;
    var food_id = newCustomFoodId();
    var rowPayload = {
      food_id: food_id,
      food_name: v.nm,
      calories: v.cal,
      protein: v.prot,
      carbs: v.crb,
      fat: v.ft,
    };
    D.upsertCustomFood(rowPayload)
      .then(function () {
        props.onCreated(foodFromCustomRow(rowPayload));
        props.onClose();
      })
      .catch(function (err) {
        props.onSaveError(friendlyCustomFoodsDbError(err));
      });
  }

  if (!portalHost) return null;

  var vNow = validForm();
  var canSave = !!vNow;
  var inputStyle = {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1.5px solid " + C.border,
    fontSize: 15,
    fontFamily: "'DM Sans',sans-serif",
    color: C.text,
    outline: "none",
    boxSizing: "border-box",
    background: C.panel,
  };
  var labelStyle = {
    fontSize: 11,
    color: C.muted,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    display: "block",
  };

  return createPortal(
    <div
      onClick={props.onClose}
      role="presentation"
      style={{
        position: "absolute",
        inset: 0,
        background: C.scrimSoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingRight: "max(12px, env(safe-area-inset-right))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        paddingLeft: "max(12px, env(safe-area-inset-left))",
        boxSizing: "border-box",
        zIndex: 245,
        animation: "fadeIn 0.18s ease both",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-food-sheet-title"
        onClick={function (e) {
          e.stopPropagation();
        }}
        style={{
          background: "linear-gradient(180deg," + C.sheet + "," + C.bg + ")",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          width: "100%",
          maxWidth: "min(336px, 100%)",
          borderRadius: 20,
          padding: "16px 16px 18px",
          animation: "slideUp 0.24s cubic-bezier(0.34,1.56,0.64,1) both",
          fontFamily: "'DM Sans',sans-serif",
          maxHeight: "calc(100% - 24px)",
          overflowY: "auto",
          boxShadow: "0 16px 42px rgba(0,0,0,0.55)",
          border: "1.5px solid " + C.border,
          flexShrink: 0,
        }}
      >
        <div id="custom-food-sheet-title" style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1.25 }}>
          Custom food
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Values below are per 1 serving.</div>
        <div style={{ marginTop: 14 }}>
          <label htmlFor="cf-name" style={labelStyle}>
            Food name
          </label>
          <input
            id="cf-name"
            value={nm}
            onChange={function (e) {
              setNm(e.target.value);
            }}
            className="gt-input"
            placeholder="e.g. Mom's casserole"
            style={inputStyle}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label htmlFor="cf-cal" style={labelStyle}>
            Calories
          </label>
          <input
            id="cf-cal"
            type="number"
            inputMode="decimal"
            min={1}
            value={calStr}
            onChange={function (e) {
              setCalStr(e.target.value);
            }}
            className="gt-input"
            placeholder="Greater than 0"
            style={inputStyle}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ ...labelStyle, marginBottom: 8 }}>Macronutrients (per serving)</div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>Protein, carbs, and fat in grams (&ge; 0 each).</div>
          <label htmlFor="cf-p" style={{ ...labelStyle, marginTop: 8 }}>
            Protein (g)
          </label>
          <input id="cf-p" type="number" inputMode="decimal" min={0} step="any" value={pStr} onChange={function (e) { setPStr(e.target.value); }} className="gt-input" placeholder="0" style={inputStyle} />
          <label htmlFor="cf-c" style={{ ...labelStyle, marginTop: 10 }}>
            Carbs (g)
          </label>
          <input id="cf-c" type="number" inputMode="decimal" min={0} step="any" value={carbStr} onChange={function (e) { setCarbStr(e.target.value); }} className="gt-input" placeholder="0" style={inputStyle} />
          <label htmlFor="cf-f" style={{ ...labelStyle, marginTop: 10 }}>
            Fat (g)
          </label>
          <input id="cf-f" type="number" inputMode="decimal" min={0} step="any" value={fatStr} onChange={function (e) { setFatStr(e.target.value); }} className="gt-input" placeholder="0" style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 17 }}>
          <button onClick={props.onClose} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid " + C.border, background: C.panel, fontSize: 13, fontWeight: 700, color: C.muted, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            style={{
              flex: 1.4,
              padding: "11px",
              borderRadius: 12,
              border: "none",
              background: canSave ? C.gradCTA : C.border,
              color: canSave ? C.onAccent : C.muted,
              fontSize: 13,
              fontWeight: 700,
              cursor: canSave ? "pointer" : "default",
              opacity: canSave ? 1 : 0.62,
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: canSave ? C.shadowCTASoft : "none",
            }}
          >
            Save food
          </button>
        </div>
      </div>
    </div>,
    portalHost
  );
}

function DayNav(props) {
  var date = props.date;
  var open = props.calOpen;
  var d = new Date(date + "T00:00:00");
  var WDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var wd = WDAYS[d.getDay()];
  var monDay = MN[d.getMonth()].slice(0, 3) + " " + d.getDate();
  var year = d.getFullYear();
  var curY = new Date().getFullYear();
  var label = wd + ", " + monDay + (year !== curY ? ", " + year : "");
  var diff = dayDiff(todayLocal(), date);
  var rel = diff === 0 ? "Today" : diff === 1 ? "Yesterday" : null;
  var nextDisabled = diff <= 0;
  return (
    <div
      style={{
        margin: "0 16px 0",
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: C.panel,
        borderRadius: 16,
        padding: 6,
        border: "1px solid " + C.border,
        position: "relative",
        zIndex: 2,
      }}
    >
      <button
        onClick={props.onPrev}
        aria-label="Previous day"
        style={{ width: 38, height: 44, borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}
      >
        {"\u2039"}
      </button>
      <button
        onClick={props.onToggleCal}
        aria-label="Pick a date"
        aria-expanded={open ? "true" : "false"}
        style={{ flex: 1, padding: "4px 6px", borderRadius: 12, border: "none", background: open ? C.gl : "transparent", cursor: "pointer", textAlign: "center", fontFamily: "'DM Sans',sans-serif", transition: "background 0.16s ease" }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
          <span>{label}</span>
          {rel && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 99, background: rel === "Today" ? C.selFill : C.gl, color: rel === "Today" ? C.selText : C.accent, border: rel === "Today" ? "1px solid " + C.selBorder : "none", letterSpacing: 0.4 }}>
              {rel.toUpperCase()}
            </span>
          )}
          <span style={{ fontSize: 10, color: C.muted, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s ease", display: "inline-block", marginLeft: 2 }}>
            {"\u25BE"}
          </span>
        </div>
      </button>
      <button
        onClick={props.onNext}
        disabled={nextDisabled}
        aria-label="Next day"
        style={{ width: 38, height: 44, borderRadius: 12, border: "none", background: "transparent", cursor: nextDisabled ? "default" : "pointer", opacity: nextDisabled ? 0.3 : 1, fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}
      >
        {"\u203A"}
      </button>
    </div>
  );
}

function CalCalendar(props) {
  var date = props.date;
  var daysWithLogs = props.daysWithLogs || new Set();
  var tk = todayLocal();
  var parts = date.split("-");
  var yS = useState(+parts[0]);
  var mS = useState(+parts[1] - 1);
  var yy = yS[0],
    setYY = yS[1];
  var mm = mS[0],
    setMM = mS[1];

  function gotoMonth(delta) {
    var nm = mm + delta;
    var ny = yy;
    if (nm < 0) { nm = 11; ny -= 1; }
    if (nm > 11) { nm = 0; ny += 1; }
    var firstOfNext = ny + "-" + String(nm + 1).padStart(2, "0") + "-01";
    if (delta > 0 && firstOfNext > tk) return;
    setMM(nm);
    setYY(ny);
  }
  function dKey(d) {
    return yy + "-" + String(mm + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }
  var days = dim(yy, mm);
  var first = fd(yy, mm);
  var cells = Array.from({ length: first }, function () { return null; }).concat(
    Array.from({ length: days }, function (_, i) { return i + 1; })
  );
  var firstOfNext = (mm === 11 ? yy + 1 : yy) + "-" + String(mm === 11 ? 1 : mm + 2).padStart(2, "0") + "-01";
  var nextMonthDisabled = firstOfNext > tk;

  return (
    <div
      style={{
        margin: "-8px 16px 14px",
        background: C.panel,
        borderRadius: 18,
        padding: 14,
        paddingTop: 18,
        border: "1.5px solid " + C.border,
        boxShadow: "0 9px 26px rgba(0,0,0,0.45)",
        animation: "slideUp 0.18s ease both",
        position: "relative",
        zIndex: 1,
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button
          onClick={function () { gotoMonth(-1); }}
          aria-label="Previous month"
          style={{ width: 32, height: 32, borderRadius: 10, background: "transparent", border: "none", color: C.accent, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
        >
          {"\u2039"}
        </button>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, color: C.text, fontWeight: 600 }}>
          {MN[mm]} {yy}
        </div>
        <button
          onClick={function () { gotoMonth(1); }}
          disabled={nextMonthDisabled}
          aria-label="Next month"
          style={{ width: 32, height: 32, borderRadius: 10, background: "transparent", border: "none", color: C.accent, fontSize: 18, cursor: nextMonthDisabled ? "default" : "pointer", opacity: nextMonthDisabled ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
        >
          {"\u203A"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {DL.map(function (d) {
          return <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.4, padding: "4px 0" }}>{d}</div>;
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map(function (day, i) {
          if (!day) return <div key={i} />;
          var k = dKey(day);
          var isSel = k === date;
          var isT = k === tk;
          var isFut = k > tk;
          var hasLog = daysWithLogs.has(k);
          var border = "none";
          if (!isSel && isT) border = "2px solid " + C.accent;
          else if (!isSel && !hasLog) border = "1px solid " + C.border;
          else if (!isSel && hasLog) border = "1px solid " + C.gm;
          return (
            <button
              key={i}
              type="button"
              onClick={function () { if (!isFut) props.onSelect(k); }}
              disabled={isFut}
              style={{
                aspectRatio: "1",
                borderRadius: 10,
                border: border,
                background: isSel ? C.gradCTA : hasLog && !isT ? C.gl : "transparent",
                color: isSel ? C.onAccent : C.text,
                cursor: isFut ? "default" : "pointer",
                opacity: isFut ? 0.28 : 1,
                fontSize: 13,
                fontWeight: isSel || isT ? 700 : 600,
                position: "relative",
                fontFamily: "'DM Sans',sans-serif",
                padding: 0,
                boxShadow: isSel ? C.shadowCTASoft : "none",
                transition: "transform 0.12s ease",
              }}
            >
              {day}
              {hasLog && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: 99,
                    background: isSel ? C.onAccent : C.gd,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      {date !== tk && (
        <button
          type="button"
          className="gt-focus-ring gt-min-tap"
          onClick={function () { props.onSelect(tk); }}
          style={{ marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 12, background: C.gl, color: C.gd, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.2, minHeight: 44 }}
        >
          Jump to today
        </button>
      )}
    </div>
  );
}

function CalorieTab(props) {
  var dS = useState(todayLocal());
  var selDate = dS[0],
    setSelDate = dS[1];
  var eS = useState([]);
  var entries = eS[0],
    setEntries = eS[1];
  var lS = useState(true);
  var loading = lS[0],
    setLoading = lS[1];
  var errS = useState(null);
  var error = errS[0],
    setError = errS[1];
  var qS = useState("");
  var q = qS[0],
    setQ = qS[1];
  var rS = useState([]);
  var results = rS[0],
    setResults = rS[1];
  var sS = useState(false);
  var searching = sS[0],
    setSearching = sS[1];
  var pS = useState(null);
  var pending = pS[0],
    setPending = pS[1];
  var cS = useState(false);
  var showCal = cS[0],
    setShowCal = cS[1];
  var dwlS = useState(new Set());
  var daysWithLogs = dwlS[0],
    setDaysWithLogs = dwlS[1];
  var cfsS = useState(false);
  var customFoodOpen = cfsS[0],
    setCustomFoodOpen = cfsS[1];

  useEffect(
    function () {
      if (!supaReady()) {
        setError("Supabase isn't configured \u2014 set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setEntries([]);
      var aborted = false;
      supabase
        .from("food_log")
        .select("*")
        .eq("log_date", selDate)
        .order("created_at", { ascending: false })
        .then(function (res) {
          if (aborted) return;
          if (res.error) setError(res.error.message);
          else setEntries(res.data || []);
          setLoading(false);
        });
      return function () {
        aborted = true;
      };
    },
    [selDate]
  );

  useEffect(
    function () {
      if (!supaReady() || !showCal) return;
      supabase
        .from("food_log")
        .select("log_date")
        .then(function (res) {
          if (res.error) return;
          var s = new Set();
          (res.data || []).forEach(function (r) { s.add(r.log_date); });
          setDaysWithLogs(s);
        });
    },
    [showCal]
  );

  useEffect(
    function () {
      if (loading) return;
      setDaysWithLogs(function (prev) {
        var has = prev.has(selDate);
        var should = entries.length > 0;
        if (has === should) return prev;
        var next = new Set(prev);
        if (should) next.add(selDate);
        else next.delete(selDate);
        return next;
      });
    },
    [entries, loading, selDate]
  );

  useEffect(
    function () {
      var trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      var aborted = false;
      var to = setTimeout(function () {
        var fsP = fetch("/api/fatsecret/proxy?method=foods.search&max_results=10&search_expression=" + encodeURIComponent(trimmed)).then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok) throw new Error((data && data.error) || "Search failed (" + r.status + ")");
            return data;
          });
        });
        var logP = supaReady()
          ? supabase
              .from("food_log")
              .select("food_id, food_name, brand_name, serving_description, calories, protein, carbs, fat, servings, created_at")
              .ilike("food_name", "%" + trimmed + "%")
              .order("created_at", { ascending: false })
              .limit(80)
          : Promise.resolve({ data: [], error: null });
        var cfP = supaReady() ? D.searchCustomFoods(trimmed) : Promise.resolve({ data: [], error: null });

        Promise.all([fsP, logP, cfP])
          .then(function (triple) {
            if (aborted) return;
            var data = triple[0];
            var logRes = triple[1];
            var cfRes = triple[2];
            var foods = data && data.foods && data.foods.food;
            if (!foods) foods = [];
            else if (!Array.isArray(foods)) foods = [foods];

            var merged = [],
              seen = {};
            var customRows = cfRes.error ? [] : cfRes.data || [];
            customRows.forEach(function (r) {
              var fid = String(r.food_id);
              if (seen[fid]) return;
              seen[fid] = true;
              merged.push(foodFromCustomRow(r));
            });

            var loggedById = {};
            if (!logRes.error && logRes.data) {
              (logRes.data || []).forEach(function (row) {
                var fid = String(row.food_id);
                if (!loggedById[fid]) loggedById[fid] = row;
              });
            }
            Object.keys(loggedById).forEach(function (fid) {
              if (seen[fid]) return;
              seen[fid] = true;
              merged.push(foodFromLogRow(loggedById[fid]));
            });
            foods.forEach(function (f) {
              var id = String(f.food_id);
              if (seen[id]) return;
              seen[id] = true;
              merged.push(Object.assign({}, f, { __fromLog: false }));
            });
            setResults(merged);
            setSearching(false);
          })
          .catch(function (e) {
            if (aborted) return;
            setError(e.message || String(e));
            setResults([]);
            setSearching(false);
          });
      }, 280);
      return function () {
        aborted = true;
        clearTimeout(to);
      };
    },
    [q]
  );

  function logFood(food, servings) {
    var p = parseFsDesc(food.food_description) || { serving: "serving", calories: 0, fat: null, carbs: null, protein: null };
    var sm = scaleMacrosPerServing(p, servings);
    var ic = !!(food.__isCustom || isCustomFoodId(food.food_id));
    var srvDesc = ic ? "serving" : p.serving;
    var row = {
      log_date: selDate,
      food_id: String(food.food_id),
      food_name: food.food_name,
      brand_name: food.brand_name || null,
      serving_description: srvDesc,
      servings: servings,
      calories: sm.calories,
      protein: sm.protein,
      carbs: sm.carbs,
      fat: sm.fat,
    };
    supabase
      .from("food_log")
      .insert(row)
      .select()
      .single()
      .then(function (res) {
        if (res.error) {
          setError(res.error.message);
          return;
        }
        setEntries(function (prev) { return [res.data].concat(prev); });
        setPending(null);
        setQ("");
        setResults([]);
      });
  }

  function updateEntryServings(entry, newServings) {
    var ic = isCustomFoodId(entry.food_id);
    var s = ic ? Math.max(1, Math.round(Number(newServings) || 1)) : Math.max(0.25, +newServings);
    if (!ic && !Number.isFinite(s)) return;
    var ps = perServingMacrosFromLogRow(entry);
    var sm = scaleMacrosPerServing(
      { calories: ps.calories, protein: ps.protein, carbs: ps.carbs, fat: ps.fat },
      s
    );
    supabase
      .from("food_log")
      .update({
        servings: s,
        calories: sm.calories,
        protein: sm.protein,
        carbs: sm.carbs,
        fat: sm.fat,
        serving_description: ps.serving,
      })
      .eq("id", entry.id)
      .select()
      .single()
      .then(function (res) {
        if (res.error) {
          setError(res.error.message);
          return;
        }
        setEntries(function (prev) {
          return prev.map(function (e) {
            return e.id === entry.id ? res.data : e;
          });
        });
      });
  }

  function delEntry(id) {
    supabase
      .from("food_log")
      .delete()
      .eq("id", id)
      .then(function (res) {
        if (res.error) {
          setError(res.error.message);
          return;
        }
        setEntries(function (prev) { return prev.filter(function (e) { return e.id !== id; }); });
      });
  }

  var totalCal = entries.reduce(function (s, e) { return s + (Number(e.calories) || 0); }, 0);
  var totalP = entries.reduce(function (s, e) { return s + (Number(e.protein) || 0); }, 0);
  var totalC = entries.reduce(function (s, e) { return s + (Number(e.carbs) || 0); }, 0);
  var totalF = entries.reduce(function (s, e) { return s + (Number(e.fat) || 0); }, 0);

  var diffSel = dayDiff(todayLocal(), selDate);
  var totalLbl = diffSel === 0 ? "Total today" : diffSel === 1 ? "Total yesterday" : diffSel === -1 ? "Total tomorrow" : "Total " + MN[+selDate.split("-")[1] - 1].slice(0, 3) + " " + parseInt(selDate.split("-")[2]);
  var emptyLbl = diffSel === 0 ? "Nothing logged yet today." : diffSel === 1 ? "Nothing was logged yesterday." : "Nothing logged on this day.";

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ padding: "16px 24px 14px" }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Calories</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>Daily Intake</div>
      </div>

      <DayNav
        date={selDate}
        calOpen={showCal}
        onPrev={function () {
          setSelDate(addDays(selDate, -1));
          setShowCal(false);
        }}
        onNext={function () {
          if (dayDiff(todayLocal(), selDate) > 0) {
            setSelDate(addDays(selDate, 1));
            setShowCal(false);
          }
        }}
        onToggleCal={function () { setShowCal(function (v) { return !v; }); }}
      />
      {showCal && (
        <CalCalendar
          date={selDate}
          daysWithLogs={daysWithLogs}
          onSelect={function (k) {
            setSelDate(k);
            setShowCal(false);
          }}
        />
      )}
      {!showCal && <div style={{ height: 14 }} />}

      <div
        style={{
          margin: "0 16px 14px",
          padding: "20px 22px",
          background: C.gradCTA,
          borderRadius: 24,
          color: C.onAccent,
          boxShadow: C.shadowCTA,
          animation: "slideUp 0.32s ease both",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7, opacity: 0.9, textTransform: "uppercase" }}>{totalLbl}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>{Math.round(totalCal).toLocaleString()}</div>
          <div style={{ fontSize: 16, opacity: 0.9 }}>cal</div>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 12, opacity: 0.95 }}>
          <div><span style={{ fontWeight: 700 }}>{Math.round(totalP)}g</span> protein</div>
          <div><span style={{ fontWeight: 700 }}>{Math.round(totalC)}g</span> carbs</div>
          <div><span style={{ fontWeight: 700 }}>{Math.round(totalF)}g</span> fat</div>
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 8 }}>{entries.length} {entries.length === 1 ? "item" : "items"} logged</div>
      </div>

      <div style={{ margin: "0 16px 14px" }}>
        <label htmlFor="calorie-food-search" className="gt-sr-only">
          Search food
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            id="calorie-food-search"
            value={q}
            onChange={function (e) {
              setQ(e.target.value);
            }}
            placeholder="Search food (e.g. chicken breast)"
            className="gt-input"
            style={{
              flex: 1,
              minWidth: 0,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1.5px solid " + C.border,
              background: C.panel,
              fontSize: 14,
              fontFamily: "'DM Sans',sans-serif",
              color: C.text,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            aria-label="Add custom food"
            className="gt-focus-ring gt-min-tap"
            onClick={function () {
              setCustomFoodOpen(true);
            }}
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 14,
              border: "none",
              cursor: "pointer",
              fontSize: 26,
              fontWeight: 300,
              lineHeight: 1,
              fontFamily: "'DM Sans',sans-serif",
              color: C.onAccent,
              background: C.gradCTA,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: C.shadowCTASoft,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            +
          </button>
        </div>
        {(q.trim() || searching) && (
          <div style={{ marginTop: 8, background: C.panel, borderRadius: 14, border: "1.5px solid " + C.border, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
            {searching && <div style={{ padding: "12px 14px", fontSize: 13, color: C.muted }}>Searching{"\u2026"}</div>}
            {!searching && results.length === 0 && q.trim() && <div style={{ padding: "12px 14px", fontSize: 13, color: C.muted }}>No results.</div>}
            {results.map(function (f, i) {
              var p = parseFsDesc(f.food_description) || { calories: 0, serving: "" };
              var custItem = !!(f.__isCustom || isCustomFoodId(f.food_id));
              return (
                <button
                  key={String(f.food_id) + "-r-" + i}
                  onClick={function () { setPending(f); }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 14px",
                    background: "transparent",
                    border: "none",
                    borderTop: i === 0 ? "none" : "1px solid " + C.border,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {f.food_name}
                      {f.brand_name && <span style={{ color: C.muted, fontWeight: 500 }}> {"\u00B7"} {f.brand_name}</span>}
                      {custItem && (
                        <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: C.accent, textTransform: "uppercase", letterSpacing: 0.35 }}>Your food</span>
                      )}
                      {f.__fromLog && !custItem && (
                        <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: C.gd, textTransform: "uppercase", letterSpacing: 0.35 }}>Logged before</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      {Math.round(p.calories)} cal {"\u00B7"} per {custItem ? "serving" : p.serving || "serving"}
                      {f.__lastServings != null && f.__fromLog && <span>{' \u00B7 last '} {f.__lastServings} sv</span>}
                    </div>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: 10, background: C.gl, color: C.gd, fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>+</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, padding: "6px 4px 10px" }}>Log</div>
        {loading && <div style={{ padding: "18px 14px", fontSize: 13, color: C.muted, textAlign: "center" }}>Loading{"\u2026"}</div>}
        {!loading && entries.length === 0 && (
          <div style={{ padding: "28px 20px", background: C.panel, borderRadius: 16, border: "1.5px dashed " + C.border, textAlign: "center" }}>
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", lineHeight: 0 }}>
              <IconUiBowl size={36} color={C.accent} />
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>{emptyLbl}</div>
          </div>
        )}
        {entries.map(function (e) {
          var ic = isCustomFoodId(e.food_id);
          var pVal = e.protein != null ? Math.round(Number(e.protein) || 0) : null;
          var cVal = e.carbs != null ? Math.round(Number(e.carbs) || 0) : null;
          var fVal = e.fat != null ? Math.round(Number(e.fat) || 0) : null;
          var macroParts = [];
          if (pVal != null) macroParts.push(pVal + "g P");
          if (cVal != null) macroParts.push(cVal + "g C");
          if (fVal != null) macroParts.push(fVal + "g F");
          var macroStr = macroParts.join(" \u00B7 ");
          return (
            <div
              key={e.id}
              style={{
                background: C.panel,
                borderRadius: 14,
                padding: "12px 14px",
                border: "1px solid " + C.border,
                marginBottom: 8,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                animation: "slideUp 0.22s ease both",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {e.food_name}
                  {e.brand_name && <span style={{ color: C.muted, fontWeight: 500 }}> {"\u00B7"} {e.brand_name}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="gt-focus-ring gt-min-tap"
                    aria-label="Decrease servings"
                    onClick={function () {
                      var cur = +(Number(e.servings) || 0);
                      if (ic) updateEntryServings(e, Math.max(1, Math.round(cur || 1) - 1));
                      else updateEntryServings(e, Math.max(0.25, cur - 0.5));
                    }}
                    style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid " + C.border, background: C.panel, fontSize: 20, fontWeight: 700, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    {"\u2212"}
                  </button>
                  <input
                    type="number"
                    step={ic ? 1 : 0.25}
                    min={ic ? 1 : 0.25}
                    value={ic ? Math.round(Number(e.servings) || 1) : e.servings}
                    aria-label="Servings"
                    className="gt-input"
                    onChange={function (ev) {
                      updateEntryServings(e, ev.target.value);
                    }}
                    style={{ width: 72, padding: "8px 6px", borderRadius: 12, border: "1.5px solid " + C.border, fontSize: 15, fontWeight: 700, textAlign: "center", color: C.text, outline: "none", fontFamily: "'DM Sans',sans-serif", background: C.panel, flexShrink: 0 }}
                  />
                  <button
                    type="button"
                    className="gt-focus-ring gt-min-tap"
                    aria-label="Increase servings"
                    onClick={function () {
                      var cur = +(Number(e.servings) || 0);
                      if (ic) updateEntryServings(e, Math.round(cur || 1) + 1);
                      else updateEntryServings(e, cur + 0.5);
                    }}
                    style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid " + C.border, background: C.panel, fontSize: 20, fontWeight: 700, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>
                    {(ic ? Math.round(Number(e.servings) || 1) : e.servings) + " × " + (e.serving_description || "serving")}
                  </span>
                </div>
                <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.35 }}>
                  {macroStr && <span style={{ color: C.muted }}>{macroStr + " \u00B7 "}</span>}
                  <span style={{ color: C.text, fontWeight: 700 }}>{Math.round(Number(e.calories) || 0)} cal</span>
                </div>
              </div>
              <button
                type="button"
                className="gt-focus-ring gt-min-tap"
                onClick={function () { delEntry(e.id); }}
                aria-label={"Remove " + e.food_name + " from log"}
                style={{ width: 44, height: 44, borderRadius: 12, background: C.bg, border: "1px solid " + C.border, cursor: "pointer", color: C.muted, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0, marginTop: 2 }}
              >
                {"\u00D7"}
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ margin: "12px 16px 0", padding: "10px 14px", background: C.red, color: C.redT, borderRadius: 12, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            className="gt-focus-ring gt-min-tap"
            onClick={function () { setError(null); }}
            aria-label="Dismiss error"
            style={{ background: "transparent", border: "none", color: C.redT, fontSize: 18, cursor: "pointer", minWidth: 44, minHeight: 44, margin: "-8px -6px -8px 0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            {"\u00D7"}
          </button>
        </div>
      )}

      {customFoodOpen && (
        <CustomFoodSheet
          portalRoot={props.portalRoot}
          onClose={function () {
            setCustomFoodOpen(false);
          }}
          onCreated={function (food) {
            setPending(food);
          }}
          onSaveError={function (msg) {
            setError(msg);
          }}
        />
      )}

      {pending && (
        <AddFoodSheet
          portalRoot={props.portalRoot}
          food={pending}
          onCancel={function () { setPending(null); }}
          onConfirm={function (s) { logFood(pending, s); }}
        />
      )}
    </div>
  );
}

function TabPicker(props) {
  var tabs = props.tabs;
  var activeId = props.activeId;
  var onSelect = props.onSelect;
  var onCenterChange = props.onCenterChange;
  var onSettle = props.onSettle;
  var settleMs = props.settleMs != null ? props.settleMs : 100;
  var REPEAT = 5;
  var L = tabs.length;
  var midBlock = Math.floor(REPEAT / 2);
  var totalLen = L * REPEAT;
  var looped = [];
  for (var r = 0; r < REPEAT; r++) {
    for (var i = 0; i < L; i++) looped.push({ tab: tabs[i], key: r + "-" + i, logical: i });
  }

  var ref = useRef(null);
  var itemWRef = useRef(0);
  var rafRef = useRef(null);
  var teleTimerRef = useRef(null);
  var settleTimerRef = useRef(null);
  var supressUntilRef = useRef(0);
  var lastLogicalRef = useRef(-1);
  var lastSettledRef = useRef(null);
  var lastScrollPosRef = useRef(null);

  var cpS = useState(midBlock * L);
  var centerPos = cpS[0],
    setCenterPos = cpS[1];
  var hiS = useState(midBlock * L);
  var highlightPhysIdx = hiS[0],
    setHighlightPhysIdx = hiS[1];

  function reportCenter(pos) {
    var rounded = ((Math.round(pos) % L) + L) % L;
    if (rounded !== lastLogicalRef.current) {
      lastLogicalRef.current = rounded;
      if (onCenterChange) onCenterChange(tabs[rounded].id);
    }
  }

  function measureItemW() {
    var c = ref.current;
    if (!c) return 0;
    var a = c.children[0],
      b = c.children[1];
    if (!a || !b) return 0;
    return b.offsetLeft - a.offsetLeft;
  }
  function recompute() {
    var c = ref.current;
    if (!c) return;
    var first = c.children[0];
    if (!first) return;
    var firstCenter = first.offsetLeft + first.offsetWidth / 2;
    var w = itemWRef.current || measureItemW();
    if (!w) return;
    var pos = (c.scrollLeft + c.clientWidth / 2 - firstCenter) / w;
    /* Skip highlight/center updates while scroll position stabilizes after loop teleport */
    if (Date.now() < supressUntilRef.current) return;
    lastScrollPosRef.current = pos;
    /* Nearest-slot highlight (avoids dir-based ceil/floor snapping past the teleport edge). */
    var hi = Math.round(pos);
    if (hi < 0) hi = 0;
    else if (hi >= totalLen) hi = totalLen - 1;
    /* Integer center aligns opacity ring with green pill and stays stable vs float drift. */
    setCenterPos(hi);
    setHighlightPhysIdx(hi);
    reportCenter(pos);
  }
  function maybeTeleport() {
    var c = ref.current;
    if (!c) return;
    var w = itemWRef.current || measureItemW();
    if (!w) return;
    var first = c.children[0];
    var firstCenter = first.offsetLeft + first.offsetWidth / 2;
    var pos = (c.scrollLeft + c.clientWidth / 2 - firstCenter) / w;
    var idx = Math.round(pos);
    if (idx < L) {
      c.scrollLeft += midBlock * L * w;
      recompute();
      supressUntilRef.current = Date.now() + 120;
    } else if (idx >= totalLen - L) {
      c.scrollLeft -= midBlock * L * w;
      recompute();
      supressUntilRef.current = Date.now() + 120;
    }
  }

  useEffect(function () {
    var c = ref.current;
    if (!c) return;
    var rafId = requestAnimationFrame(function () {
      itemWRef.current = measureItemW();
      var actIdx = tabs.findIndex(function (t) { return t.id === activeId; });
      if (actIdx < 0) actIdx = 0;
      var physIdx = midBlock * L + actIdx;
      var btn = c.children[physIdx];
      if (btn) {
        c.scrollLeft = btn.offsetLeft + btn.offsetWidth / 2 - c.clientWidth / 2;
      }
      setCenterPos(physIdx);
      setHighlightPhysIdx(physIdx);
      lastScrollPosRef.current = physIdx;
      lastLogicalRef.current = actIdx;
      lastSettledRef.current = tabs[actIdx].id;
    });
    return function () {
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(function () {
    var c = ref.current;
    if (!c) return;
    function fireSettle() {
      var w = itemWRef.current || measureItemW();
      if (!w) return;
      var first = c.children[0];
      if (!first) return;
      var firstCenter = first.offsetLeft + first.offsetWidth / 2;
      var pos = (c.scrollLeft + c.clientWidth / 2 - firstCenter) / w;
      var rounded = ((Math.round(pos) % L) + L) % L;
      var id = tabs[rounded].id;
      if (id !== lastSettledRef.current) {
        lastSettledRef.current = id;
        if (onSettle) onSettle(id);
      }
    }
    function onScroll() {
      var sup = Date.now() < supressUntilRef.current;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(function () {
          rafRef.current = null;
          recompute();
        });
      }
      if (!sup) {
        if (teleTimerRef.current) clearTimeout(teleTimerRef.current);
        teleTimerRef.current = setTimeout(maybeTeleport, 160);
      }
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(fireSettle, settleMs);
    }
    function onScrollEnd() {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
      requestAnimationFrame(function () {
        recompute();
        fireSettle();
      });
    }
    c.addEventListener("scroll", onScroll, { passive: true });
    c.addEventListener("scrollend", onScrollEnd, { passive: true });
    return function () {
      c.removeEventListener("scroll", onScroll);
      c.removeEventListener("scrollend", onScrollEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (teleTimerRef.current) clearTimeout(teleTimerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="tabstrip"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        overflowX: "auto",
        overflowY: "hidden",
        touchAction: "pan-x",
        overscrollBehaviorX: "contain",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        padding: "0 103px",
        maskImage: "linear-gradient(to right, transparent 0, #000 14%, #000 86%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 14%, #000 86%, transparent 100%)",
      }}
    >
      {looped.map(function (item, idx) {
        var dist = Math.abs(idx - centerPos);
        var t = Math.min(1, dist);
        var isCenter = idx === highlightPhysIdx;
        var opacity = isCenter ? 1 : Math.max(0.32, 1 - t * 0.65);
        var TabIcon = item.tab.Icon;
        var centerTabShadowFull =
          "0 0 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(200,204,212,0.25)";
        var tabShimmerSplit = isCenter ? splitFirstOutShadowLayer(centerTabShadowFull) : null;
        return (
          <div
            key={item.key}
            style={{
              flexShrink: 0,
              scrollSnapAlign: "center",
              scrollSnapStop: "normal",
              filter: tabShimmerSplit && tabShimmerSplit.outset ? "drop-shadow(" + tabShimmerSplit.outset + ")" : undefined,
            }}
          >
            <button
              type="button"
              className={"gt-focus-ring" + (isCenter ? " gt-shimmer gt-shimmer-tab" : "")}
              onClick={function () { onSelect(item.tab.id); }}
              style={{
                width: 78,
                height: 68,
                padding: "10px 6px",
                background: isCenter
                  ? "linear-gradient(160deg,rgba(255,255,255,0.16) 0%,rgba(34,40,54,0.92) 40%,rgba(26,31,46,0.96) 100%)"
                  : "transparent",
                border: isCenter ? "1px solid rgba(212,216,224,0.45)" : "1px solid transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderRadius: 18,
                opacity: opacity,
                transition: "opacity 0.08s ease, box-shadow 0.12s ease, background 0.12s ease",
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: isCenter ? (tabShimmerSplit ? tabShimmerSplit.rest : centerTabShadowFull) : "none",
              }}
            >
              <div style={{ transform: "scale(1.35)", lineHeight: 0 }}>
                <TabIcon color={isCenter ? C.accent : C.muted} />
              </div>
              <span style={{ fontSize: 11, fontWeight: isCenter ? 700 : 600, color: isCenter ? C.selText : C.muted, whiteSpace: "nowrap" }}>{item.tab.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function setsTotalOn(wl, k) {
  var l = wl[k];
  if (!l || !l.sets) return 0;
  var t = 0;
  for (var m in l.sets) t += l.sets[m] || 0;
  return t;
}
/** Whole cardio minutes from a workout log row; legacy/missing cardio_minutes → 0. */
function cardioMinutesOnLog(log) {
  if (!log || log.cardio_minutes == null || log.cardio_minutes === "") return 0;
  var n = Number(log.cardio_minutes);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}
/** True when workout_logs row has saved bodyweight, sets, or cardio (not habit-check only). */
function workoutLogHasDetails(log) {
  if (!log) return false;
  if (log.bodyweight != null && log.bodyweight !== "" && Number.isFinite(Number(log.bodyweight))) return true;
  if (cardioMinutesOnLog(log) > 0) return true;
  if (log.sets) {
    for (var m in log.sets) {
      if ((log.sets[m] || 0) > 0) return true;
    }
  }
  return false;
}
function parseGymCardioMinutesInput(s) {
  var t = (s || "").trim();
  if (!t) return { ok: false, error: "Enter minutes (use 0 for no cardio)." };
  var n = parseInt(t, 10);
  if (!Number.isFinite(n) || String(n) !== t) return { ok: false, error: "Use whole numbers only (0–300)." };
  if (n < 0 || n > 300) return { ok: false, error: "Cardio must be between 0 and 300 minutes." };
  return { ok: true, n: n };
}
function scheduledHabitsOn(habits, k) {
  var dow = new Date(k + "T00:00:00").getDay();
  return habits.filter(function (h) {
    return h.scheduledDays.includes(dow);
  });
}
function habitsDoneOn(habits, comp, k) {
  var sch = scheduledHabitsOn(habits, k);
  if (!sch.length) return { done: 0, total: 0, pct: null };
  var done = 0;
  sch.forEach(function (h) {
    if (comp[h.id] && comp[h.id][k]) done++;
  });
  return { done: done, total: sch.length, pct: done / sch.length };
}
function isPerfectDay(habits, comp, sleep, k, tk) {
  if (k > tk) return false;
  var s = sleep[k];
  if (!s || s.score == null || s.score < 80) return false;
  var hd = habitsDoneOn(habits, comp, k);
  if (hd.total === 0) return false;
  return hd.done === hd.total;
}
function gymStreakScheduled(gym, comp, todayKey) {
  if (!gym) return null;
  var done = comp[gym.id] || {};
  var anchor = new Date(todayKey + "T12:00:00");
  if (isNaN(anchor.getTime())) return null;
  var str = 0;
  for (var i = 0; i < 800; i++) {
    var d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    var k = dk(d);
    if (k > todayKey) continue;
    if (!gym.scheduledDays.includes(d.getDay())) continue;
    if (done[k]) str++;
    else if (i > 0) break;
  }
  return str;
}
function cellColorForLayer(layer, k, ctx) {
  if (layer === "sleep") {
    var s = ctx.sleep[k];
    if (!s || s.score == null) return null;
    if (s.score >= 85) return "rgba(210,214,222,0.50)";
    if (s.score >= 75) return "rgba(190,196,208,0.40)";
    if (s.score >= 65) return "rgba(229,181,60,0.40)";
    return "rgba(224,80,80,0.36)";
  }
  if (layer === "workouts") {
    var sets = setsTotalOn(ctx.wl, k);
    if (sets === 0) return null;
    if (sets >= 20) return "linear-gradient(165deg,#2A3040 0%,#1A1F2E 55%,#121620 100%)";
    if (sets >= 12) return "linear-gradient(165deg,rgba(42,48,64,0.82) 0%,rgba(26,31,46,0.78) 100%)";
    if (sets >= 6) return "linear-gradient(165deg,rgba(42,48,64,0.6) 0%,rgba(26,31,46,0.55) 100%)";
    return "linear-gradient(165deg,rgba(42,48,64,0.38) 0%,rgba(26,31,46,0.32) 100%)";
  }
  return null;
}
function cycleTintFor(cycles, k) {
  for (var i = 0; i < cycles.length; i++) {
    if (k >= cycles[i].start && k <= cycles[i].end) {
      var c = cycles[i].color || PAL[0];
      var r = parseInt(c.slice(1, 3), 16),
        g = parseInt(c.slice(3, 5), 16),
        b = parseInt(c.slice(5, 7), 16);
      return "rgba(" + r + "," + g + "," + b + ",0.10)";
    }
  }
  return null;
}

var LAYER_LEGENDS = {
  sleep: ["rgba(224,80,80,0.36)", "rgba(229,181,60,0.40)", "rgba(190,196,208,0.40)", "rgba(210,214,222,0.50)"],
  workouts: ["rgba(42,48,64,0.38)", "rgba(42,48,64,0.6)", "rgba(42,48,64,0.82)", "#1A1F2E"],
};

function UnifiedCalendar(props) {
  var habits = props.habits,
    comp = props.comp,
    wl = props.wl,
    sleep = props.sleep,
    cycles = props.cycles,
    tk = props.todayKey;
  var cy = props.calY,
    cm = props.calM;
  var layS = useState("workouts");
  var layer = layS[0],
    setLayer = layS[1];
  useEffect(
    function () {
      if (layer === "habits") setLayer("workouts");
    },
    [layer]
  );
  var dS = useState(null);
  var selDay = dS[0],
    setSelDay = dS[1];

  var first = fd(cy, cm),
    days = dim(cy, cm);
  var cells = Array.from({ length: first }, function () {
    return null;
  }).concat(
    Array.from({ length: days }, function (_, i) {
      return i + 1;
    })
  );
  var prefix = cy + "-" + String(cm + 1).padStart(2, "0");
  function ck(d) {
    return prefix + "-" + String(d).padStart(2, "0");
  }
  var monthEnd = prefix + "-" + String(days).padStart(2, "0");
  var ctx = { habits: habits, comp: comp, wl: wl, sleep: sleep };

  var visibleCycs = cycles.filter(function (c) {
    return c.start <= monthEnd && c.end >= prefix + "-01";
  });

  var monthWorkouts = 0;
  Object.keys(wl).forEach(function (kk) {
    if (kk.indexOf(prefix) === 0) monthWorkouts++;
  });
  var sleepScores = [];
  Object.keys(sleep).forEach(function (kk) {
    if (kk.indexOf(prefix) === 0 && sleep[kk].score != null) sleepScores.push(sleep[kk].score);
  });
  var avgSleep = sleepScores.length
    ? Math.round(
        sleepScores.reduce(function (a, b) {
          return a + b;
        }, 0) / sleepScores.length
      )
    : null;
  var perfectCount = 0;
  for (var di = 1; di <= days; di++) {
    var dKey = ck(di);
    if (dKey > tk) break;
    if (isPerfectDay(habits, comp, sleep, dKey, tk)) perfectCount++;
  }
  var gymHabit = habits.find(function (h) {
    return h.icon === ICON_GYM;
  });
  var gymStreak = gymStreakScheduled(gymHabit, comp, tk);

  function changeMonth(dir) {
    var m = cm + dir,
      y = cy;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    props.setCM(m);
    props.setCY(y);
  }

  var layerPills = [
    { id: "sleep", label: "Sleep", Icon: IconKpiSleep },
    { id: "workouts", label: "Workouts", Icon: IconKpiWorkout },
  ];

  var kpis = [
    { val: monthWorkouts, label: "Workouts", Icon: IconKpiWorkout },
    { val: avgSleep != null ? avgSleep : "\u2013", label: "Avg sleep", Icon: IconKpiSleep },
    { val: gymStreak != null ? gymStreak : "\u2013", label: "Gym streak", Icon: IconDumbbellMark },
    { val: perfectCount, label: "Perfect", Icon: IconKpiStar },
  ];

  var legend = LAYER_LEGENDS[layer] || LAYER_LEGENDS.sleep;

  return (
    <div style={{ padding: "14px 0 16px", position: "relative" }}>
      {selDay && (
        <DaySummarySheet
          dayKey={selDay}
          habits={habits}
          comp={comp}
          wl={wl}
          sleep={sleep}
          cycles={cycles}
          tk={tk}
          onClose={function () {
            setSelDay(null);
          }}
        />
      )}
      <div style={{ padding: "0 22px 12px" }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Calendar</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>Daily Dashboard</div>
      </div>

      <div style={{ padding: "0 14px 12px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {kpis.map(function (k2, i) {
          var KpiI = k2.Icon;
          return (
            <div key={i} style={{ background: C.panel, borderRadius: 14, padding: "10px 6px", border: "1.5px solid " + C.border, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", lineHeight: 0 }}>
                <KpiI size={17} color={C.accent} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginTop: 6, lineHeight: 1 }}>{k2.val}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 3, letterSpacing: 0.3 }}>{k2.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ margin: "0 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, borderRadius: 14, padding: "8px 8px", border: "1.5px solid " + C.border }}>
        <button
          type="button"
          className="gt-focus-ring"
          aria-label="Previous month"
          onClick={function () { changeMonth(-1); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, padding: "4px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <IconChevronCal dir="left" />
        </button>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, color: C.text, fontWeight: 600 }}>
          {MN[cm]} {cy}
        </div>
        <button
          type="button"
          className="gt-focus-ring"
          aria-label="Next month"
          onClick={function () { changeMonth(1); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, padding: "4px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <IconChevronCal dir="right" />
        </button>
      </div>

      <div style={{ padding: "0 14px 10px", display: "flex", gap: 6 }}>
        {layerPills.map(function (p) {
          var active = p.id === layer;
          var LayI = p.Icon;
          return (
            <button
              type="button"
              className="gt-focus-ring"
              key={p.id}
              onClick={function () { setLayer(p.id); }}
              style={{
                flex: 1,
                padding: "8px 6px",
                borderRadius: 99,
                background: active ? C.selFill : C.panel,
                border: "1.5px solid " + (active ? C.selBorder : C.border),
                color: active ? C.selText : C.muted,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                transition: "all 0.18s ease",
              }}
            >
              <span style={{ display: "flex", alignItems: "center" }}>
                <LayI size={15} color={active ? C.selText : C.muted} />
              </span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ margin: "0 14px", background: C.panel, borderRadius: 18, padding: 14, border: "1.5px solid " + C.border }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
          {DL.map(function (d) {
            return (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: C.muted }}>
                {d}
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {cells.map(function (day, i) {
            if (!day) return <div key={i} />;
            var k = ck(day);
            var isFut = k > tk;
            var isT = k === tk;
            var heat = !isFut ? cellColorForLayer(layer, k, ctx) : null;
            var perfect = !isFut && isPerfectDay(habits, comp, sleep, k, tk);
            var hasWk = !!wl[k];
            var hasSl = !!(sleep[k] && sleep[k].score != null);
            var wkGlow = layer === "workouts" && heat;
            var ringBorder = isT
              ? "2px solid " + C.accent
              : wkGlow
              ? "1px solid rgba(200,204,212,0.42)"
              : heat
              ? "1px solid rgba(255,255,255,0.08)"
              : "1.5px solid " + C.border;
            return (
              <div
                key={i}
                onClick={function () {
                  setSelDay(k);
                }}
                style={{
                  aspectRatio: "1",
                  background: "transparent",
                  borderRadius: 12,
                  position: "relative",
                  cursor: "pointer",
                  opacity: isFut ? 0.42 : 1,
                  transition: "transform 0.12s ease",
                }}
              >
                <div
                  className={wkGlow ? "gt-cal-glow" : undefined}
                  style={{
                    position: "absolute",
                    inset: 3,
                    borderRadius: "50%",
                    background: heat || "transparent",
                    border: ringBorder,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "none",
                    transition: "background 0.3s ease, border-color 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: isT ? 700 : 500, color: C.text, position: "relative", zIndex: 3 }}>{day}</span>
                </div>
                {!isFut && (hasWk || hasSl) && (
                  <div style={{ position: "absolute", bottom: 2, left: 0, right: 0, display: "flex", gap: 2, justifyContent: "center", pointerEvents: "none" }}>
                    {hasWk && <div style={{ width: 3, height: 3, borderRadius: "50%", background: C.accent }} />}
                    {hasSl && <div style={{ width: 3, height: 3, borderRadius: "50%", background: C.accentDeep }} />}
                  </div>
                )}
                {perfect && (
                  <div style={{ position: "absolute", top: 0, right: 1, lineHeight: 0, pointerEvents: "none" }}>
                    <IconKpiStar size={11} color="#F5C518" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 9, color: C.muted, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span>Low</span>
            {legend.map(function (c2, i) {
              return <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: c2, border: "1px solid " + C.border }} />;
            })}
            <span>High</span>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent }} />
              gym
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accentDeep }} />
              sleep
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DaySummarySheet(props) {
  var k = props.dayKey,
    habits = props.habits,
    comp = props.comp,
    wl = props.wl,
    sleep = props.sleep,
    cycles = props.cycles,
    tk = props.tk;
  var calS = useState({ loading: false, data: null, error: null });
  var calState = calS[0],
    setCalState = calS[1];

  useEffect(
    function () {
      if (!supaReady()) {
        setCalState({ loading: false, data: null, error: null });
        return;
      }
      var aborted = false;
      setCalState({ loading: true, data: null, error: null });
      supabase
        .from("food_log")
        .select("*")
        .eq("log_date", k)
        .order("created_at", { ascending: false })
        .then(function (res) {
          if (aborted) return;
          if (res.error) setCalState({ loading: false, data: null, error: res.error.message });
          else setCalState({ loading: false, data: res.data || [], error: null });
        });
      return function () {
        aborted = true;
      };
    },
    [k]
  );

  var s = sleep[k];
  var l = wl[k];
  var cyc = cycleAt(cycles, k);
  var col = cyc ? cc(cyc.color || PAL[0]) : null;
  var hd = habitsDoneOn(habits, comp, k);
  var perfect = isPerfectDay(habits, comp, sleep, k, tk);
  var sched = scheduledHabitsOn(habits, k);

  var calData = calState.data;
  var sumNum = function (e, key) {
    return Number(e[key]) || 0;
  };
  var calTotal = calData
    ? calData.reduce(function (a, e) {
        return a + sumNum(e, "calories");
      }, 0)
    : 0;
  var pTot = calData
    ? calData.reduce(function (a, e) {
        return a + sumNum(e, "protein");
      }, 0)
    : 0;
  var cTot = calData
    ? calData.reduce(function (a, e) {
        return a + sumNum(e, "carbs");
      }, 0)
    : 0;
  var fTot = calData
    ? calData.reduce(function (a, e) {
        return a + sumNum(e, "fat");
      }, 0)
    : 0;

  var totalSets = l && l.sets
    ? Object.values(l.sets).reduce(function (a, b) {
        return a + b;
      }, 0)
    : 0;
  var cardioDisp =
    l && l.cardio_minutes != null && l.cardio_minutes !== "" && Number.isFinite(Number(l.cardio_minutes))
      ? Math.max(0, Math.round(Number(l.cardio_minutes)))
      : null;

  var dayLabel = k === tk ? "Today" : new Date(k + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div
      style={{ position: "absolute", inset: 0, background: C.scrim, display: "flex", alignItems: "flex-end", zIndex: 200, animation: "fadeIn 0.18s ease both" }}
      onClick={props.onClose}
    >
      <div
        onClick={function (e) {
          e.stopPropagation();
        }}
        style={{ background: "linear-gradient(180deg," + C.sheet + "," + C.bg + ")", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: "28px 28px 0 0", borderTop: "1px solid rgba(255,255,255,0.12)", padding: "20px 18px 44px", width: "100%", maxHeight: "85%", overflowY: "auto", animation: "slideUp 0.24s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{dayLabel}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>{fmtDS(k)}</div>
            {perfect && (
              <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "rgba(245,207,94,0.14)", color: "#F2D884", fontSize: 10, fontWeight: 700, letterSpacing: 0.3, border: "1px solid rgba(245,207,94,0.35)" }}>
                <IconKpiStar size={12} color="#E5C848" />
                <span>Perfect day</span>
              </div>
            )}
          </div>
          <button onClick={props.onClose} style={{ background: "none", border: "none", fontSize: 22, color: C.muted, cursor: "pointer", padding: 0, lineHeight: 1 }}>
            {"\u00D7"}
          </button>
        </div>

        {cyc && col && (
          <div style={{ background: col.bg, border: "1.5px solid " + col.border, borderRadius: 12, padding: "9px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.bar, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: col.text }}>
                {cyc.name} <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 500 }}>{"\u00B7 " + cyc.type}</span>
              </div>
              <div style={{ fontSize: 10, color: col.text, opacity: 0.75 }}>
                {cyc.calories ? cyc.calories + " kcal target" : "No kcal target"}
                {cyc.supplements ? " \u00B7 " + cyc.supplements : ""}
              </div>
            </div>
          </div>
        )}

        <div style={{ background: C.panel, borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: "1.5px solid " + C.border }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Sleep</div>
            <span style={{ display: "flex", lineHeight: 0 }}>
              <IconKpiSleep size={20} color={C.accent} />
            </span>
          </div>
          {s && s.score != null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <ScoreRing score={s.score} size={66} />
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                <div>
                  <div style={{ color: C.muted, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Total</div>
                  <div style={{ fontWeight: 700, color: C.text }}>{fmtDur(s.total_sleep_duration)}</div>
                </div>
                <div>
                  <div style={{ color: C.muted, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>REM</div>
                  <div style={{ fontWeight: 700, color: C.text }}>{fmtDur(s.rem_sleep_duration)}</div>
                </div>
                <div>
                  <div style={{ color: C.muted, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Deep</div>
                  <div style={{ fontWeight: 700, color: C.text }}>{fmtDur(s.deep_sleep_duration)}</div>
                </div>
                <div>
                  <div style={{ color: C.muted, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Avg HR</div>
                  <div style={{ fontWeight: 700, color: C.text }}>{s.average_heart_rate != null ? s.average_heart_rate + " bpm" : "\u2013"}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.muted }}>No sleep data for this day.</div>
          )}
        </div>

        <div style={{ background: C.panel, borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: "1.5px solid " + C.border }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Workout</div>
            <span style={{ display: "flex", lineHeight: 0 }}>
              <IconKpiWorkout size={20} color={C.accent} />
            </span>
          </div>
          {l ? (
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Bodyweight</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>
                    {l.bodyweight}
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}> lb</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Total sets</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.accent, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>{totalSets}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Cardio</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>
                    {cardioDisp != null ? (
                      <>
                        {cardioDisp}
                        <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}> min</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>{"\u2014"}</span>
                    )}
                  </div>
                </div>
              </div>
              {l.muscles && l.muscles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {l.muscles.map(function (m) {
                    var sm = l.sets && l.sets[m] ? l.sets[m] : 0;
                    return (
                      <div key={m}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{m}</span>
                          <span style={{ fontSize: 11, color: C.muted }}>{sm} sets</span>
                        </div>
                        <div style={{ height: 3, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: Math.min(sm / 20, 1) * 100 + "%", background: "linear-gradient(90deg," + C.accentDeep + "," + C.accent + ")", borderRadius: 99 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.muted }}>No workout logged.</div>
          )}
        </div>

        <div style={{ background: C.panel, borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: "1.5px solid " + C.border }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Habits {hd.total > 0 ? "(" + hd.done + "/" + hd.total + ")" : ""}
            </div>
            <span style={{ display: "flex", lineHeight: 0 }}>
              <IconKpiHabit size={20} color={C.accent} />
            </span>
          </div>
          {sched.length === 0 ? (
            <div style={{ fontSize: 12, color: C.muted }}>No habits scheduled this day.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {sched.map(function (h) {
                var done = !!(comp[h.id] && comp[h.id][k]);
                return (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: done ? C.green : "transparent", border: done ? "2px solid rgba(212,216,224,0.5)" : "2px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {done && (
                        <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                          <path d="M4 10.5L8.5 15L16 6" stroke={C.onAccent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{ display: "flex", alignItems: "center" }}>
                      <HabitIcon id={h.icon} size={18} color={C.text} />
                    </span>
                    <span style={{ fontSize: 13, color: done ? C.gd : C.text, fontWeight: done ? 700 : 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ background: C.panel, borderRadius: 14, padding: "12px 14px", border: "1.5px solid " + C.border }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Calories</div>
            <span style={{ display: "flex", lineHeight: 0 }}>
              <IFlame size={20} color={C.accent} />
            </span>
          </div>
          {!supaReady() ? (
            <div style={{ fontSize: 12, color: C.muted }}>Supabase not configured.</div>
          ) : calState.loading ? (
            <div style={{ fontSize: 12, color: C.muted }}>Loading{"\u2026"}</div>
          ) : calState.error ? (
            <div style={{ fontSize: 12, color: C.redT }}>{calState.error}</div>
          ) : !calData || calData.length === 0 ? (
            <div style={{ fontSize: 12, color: C.muted }}>Nothing logged.</div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>{Math.round(calTotal).toLocaleString()}</span>
                <span style={{ fontSize: 12, color: C.muted }}>kcal</span>
                {cyc && cyc.calories ? (
                  <span style={{ fontSize: 10, color: calTotal <= cyc.calories ? C.accent : C.redT, fontWeight: 700, marginLeft: "auto" }}>
                    {calTotal <= cyc.calories ? "\u2193" : "\u2191"} {Math.abs(Math.round(calTotal - cyc.calories))} vs target
                  </span>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 11, color: C.text, alignItems: "center" }}>
                <div>
                  <strong>{Math.round(pTot)}g</strong> <span style={{ color: C.muted }}>P</span>
                </div>
                <div>
                  <strong>{Math.round(cTot)}g</strong> <span style={{ color: C.muted }}>C</span>
                </div>
                <div>
                  <strong>{Math.round(fTot)}g</strong> <span style={{ color: C.muted }}>F</span>
                </div>
                <div style={{ marginLeft: "auto", color: C.muted, fontSize: 10 }}>
                  {calData.length} {calData.length === 1 ? "item" : "items"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildCoachContext(habits, comp, logs, sleep, cycles, calByDay) {
  var tk = today();
  var days30 = [];
  for (var i = 29; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    days30.push(dk(d));
  }
  var days7 = days30.slice(-7);

  var sets30 = {};
  MG.forEach(function (m) {
    sets30[m] = 0;
  });
  var bw30 = [];
  var workouts = [];
  days30.forEach(function (k) {
    var l = logs[k];
    if (!l) return;
    workouts.push(k);
    if (l.bodyweight) bw30.push({ d: k, bw: l.bodyweight });
    if (l.sets)
      Object.keys(l.sets).forEach(function (m) {
        sets30[m] = (sets30[m] || 0) + (l.sets[m] || 0);
      });
  });

  var sleep7 = days7.map(function (k) {
    var s = sleep[k];
    if (!s) return { d: k };
    return {
      d: k,
      score: s.score == null ? null : s.score,
      total_sleep_min: s.total_sleep_duration ? Math.round(s.total_sleep_duration / 60) : null,
      rem_min: s.rem_sleep_duration ? Math.round(s.rem_sleep_duration / 60) : null,
      deep_min: s.deep_sleep_duration ? Math.round(s.deep_sleep_duration / 60) : null,
      hr: s.average_heart_rate == null ? null : s.average_heart_rate,
      hrv: s.average_hrv == null ? null : s.average_hrv,
    };
  });
  var sleep30Scores = days30
    .map(function (k) {
      return sleep[k] && sleep[k].score;
    })
    .filter(function (s) {
      return s != null;
    });

  var habitsSummary = habits.map(function (h) {
    var done7 = 0,
      sched7 = 0;
    days7.forEach(function (k) {
      var dow = new Date(k + "T00:00:00").getDay();
      if (h.scheduledDays.includes(dow)) {
        sched7++;
        if (comp[h.id] && comp[h.id][k]) done7++;
      }
    });
    return { name: h.name, icon: h.icon, scheduled_days: h.scheduledDays, done_7d: done7, scheduled_7d: sched7 };
  });

  var activeCyc = cycleAt(cycles, tk);
  var cal14 = days30.slice(-14).map(function (k) {
    var c = (calByDay || {})[k];
    return c ? { d: k, kcal: c.kcal, protein: c.protein, carbs: c.carbs, fat: c.fat } : { d: k, kcal: null };
  });

  return {
    today: tk,
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
    workouts_30d: {
      sessions: workouts.length,
      sets_per_muscle: sets30,
      bodyweight_log: bw30,
      most_recent: workouts.slice(-3).map(function (k) {
        var log = logs[k];
        var mr = { d: k, muscles: log.muscles, sets: log.sets, bw: log.bodyweight };
        var cardioM = cardioMinutesOnLog(log);
        if (cardioM > 0) mr.cardio_minutes = cardioM;
        return mr;
      }),
    },
    sleep_7d: sleep7,
    sleep_30d_avg_score: sleep30Scores.length
      ? Math.round(
          sleep30Scores.reduce(function (a, b) {
            return a + b;
          }, 0) / sleep30Scores.length
        )
      : null,
    habits_7d: habitsSummary,
    active_cycle: activeCyc
      ? {
          name: activeCyc.name,
          type: activeCyc.type,
          start: activeCyc.start,
          end: activeCyc.end,
          kcal_target: activeCyc.calories,
          supplements: activeCyc.supplements || null,
        }
      : null,
    calories_14d: cal14,
  };
}

function analyzeCoachSignals(ctx) {
  var sigs = [];
  var s7 = (ctx.sleep_7d || []).filter(function (x) {
    return x.score != null;
  });
  if (s7.length >= 3) {
    var avg7 = Math.round(
      s7.reduce(function (a, b) {
        return a + b.score;
      }, 0) / s7.length
    );
    sigs.push({ type: "sleep_7d_avg", value: avg7, label: avg7 < 70 ? "low" : avg7 < 80 ? "moderate" : "good" });
    if (ctx.sleep_30d_avg_score && avg7 < ctx.sleep_30d_avg_score - 5) {
      sigs.push({ type: "sleep_declining", recent_avg: avg7, monthly_avg: ctx.sleep_30d_avg_score });
    }
    var lastN = s7.slice(-3);
    if (lastN.length === 3 && lastN.every(function (n) { return n.score < 70; })) {
      sigs.push({ type: "sleep_3_bad_nights", scores: lastN.map(function (n) { return n.score; }) });
    }
  } else if (s7.length === 0) {
    sigs.push({ type: "sleep_missing" });
  }

  var w = ctx.workouts_30d;
  if (w) {
    var sessionsPerWeek = Math.round((w.sessions / 30) * 7 * 10) / 10;
    sigs.push({ type: "workout_frequency", sessions_per_week: sessionsPerWeek, sessions_30d: w.sessions });
    var spm = w.sets_per_muscle || {};
    var entries = Object.keys(spm)
      .map(function (m) {
        return { m: m, v: spm[m] };
      })
      .filter(function (e) {
        return e.v > 0;
      });
    if (entries.length >= 2) {
      entries.sort(function (a, b) {
        return b.v - a.v;
      });
      var top = entries[0],
        bot = entries[entries.length - 1];
      if (top.v >= bot.v * 2 && bot.v > 0) {
        sigs.push({ type: "muscle_imbalance", over: top.m, over_sets: top.v, under: bot.m, under_sets: bot.v });
      }
    }
    var missing = MG.filter(function (m) {
      return !spm[m] || spm[m] === 0;
    });
    if (missing.length && w.sessions > 0) sigs.push({ type: "missing_muscles_30d", missing: missing });
    var bw = w.bodyweight_log || [];
    if (bw.length >= 2) {
      var first = bw[0].bw,
        last = bw[bw.length - 1].bw;
      sigs.push({ type: "bodyweight_change_30d", from: first, to: last, delta: Math.round((last - first) * 10) / 10 });
    }
  }

  (ctx.habits_7d || []).forEach(function (h) {
    if (h.scheduled_7d === 0) return;
    var pct = Math.round((h.done_7d / h.scheduled_7d) * 100);
    if (pct === 100) sigs.push({ type: "habit_perfect", name: h.name, scheduled: h.scheduled_7d });
    else if (pct < 50) sigs.push({ type: "habit_lagging", name: h.name, done: h.done_7d, scheduled: h.scheduled_7d, pct: pct });
  });

  if (ctx.active_cycle) sigs.push({ type: "active_cycle", cycle: ctx.active_cycle });
  var c14 = (ctx.calories_14d || []).filter(function (c) {
    return c.kcal != null;
  });
  if (c14.length >= 3 && ctx.active_cycle && ctx.active_cycle.kcal_target) {
    var target = ctx.active_cycle.kcal_target;
    var over = c14.filter(function (c) {
      return c.kcal > target + 100;
    }).length;
    var under = c14.filter(function (c) {
      return c.kcal < target - 200;
    }).length;
    sigs.push({ type: "calorie_compliance_14d", days_logged: c14.length, days_over_target: over, days_under_target: under, target: target });
  } else if (c14.length === 0) {
    sigs.push({ type: "calories_missing" });
  }

  return sigs;
}

function hashJson(obj) {
  var s = JSON.stringify(obj);
  var h = 5381;
  for (var i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function fmtAgo(ts) {
  if (!ts) return "never";
  var s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return s + "s ago";
  if (s < 3600) return Math.round(s / 60) + "m ago";
  if (s < 86400) return Math.round(s / 3600) + "h ago";
  return Math.round(s / 86400) + "d ago";
}

function streamCoachChat(payload, onDelta, onDone, onError) {
  fetch("/api/coach/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(function (r) {
      if (!r.ok || !r.body) {
        return r
          .text()
          .catch(function () {
            return "";
          })
          .then(function (t) {
            var msg = t;
            try {
              var j = JSON.parse(t);
              if (j && j.error) msg = j.error;
            } catch (_e) {}
            onError(msg || "HTTP " + r.status);
          });
      }
      var reader = r.body.getReader();
      var decoder = new TextDecoder();
      var buf = "";
      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) {
            onDone();
            return;
          }
          buf += decoder.decode(chunk.value, { stream: true });
          var idx;
          while ((idx = buf.indexOf("\n\n")) !== -1) {
            var evt = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            var lines = evt.split("\n");
            var dataLine = null;
            for (var i2 = 0; i2 < lines.length; i2++) {
              if (lines[i2].indexOf("data:") === 0) {
                dataLine = lines[i2];
                break;
              }
            }
            if (!dataLine) continue;
            var json = dataLine.slice(5).trim();
            if (!json || json === "[DONE]") continue;
            try {
              var parsed = JSON.parse(json);
              if (parsed.type === "content_block_delta" && parsed.delta && parsed.delta.type === "text_delta") {
                onDelta(parsed.delta.text || "");
              } else if (parsed.type === "error") {
                onError((parsed.error && parsed.error.message) || "stream error");
              }
            } catch (_e) {}
          }
          return pump();
        });
      }
      return pump();
    })
    .catch(function (e) {
      onError(String((e && e.message) || e));
    });
}

function CoachTab(props) {
  var habits = props.habits,
    comp = props.comp,
    logs = props.logs,
    sleep = props.sleep,
    cycles = props.cycles;

  var calS = useState({});
  var calByDay = calS[0],
    setCalByDay = calS[1];
  var calLoadedS = useState(false);
  var calLoaded = calLoadedS[0],
    setCalLoaded = calLoadedS[1];

  useEffect(function () {
    if (!supaReady()) {
      setCalLoaded(true);
      return;
    }
    var start = new Date();
    start.setDate(start.getDate() - 29);
    supabase
      .from("food_log")
      .select("log_date, calories, protein, carbs, fat")
      .gte("log_date", dk(start))
      .then(function (res) {
        if (res.error) {
          setCalLoaded(true);
          return;
        }
        var map = {};
        (res.data || []).forEach(function (r) {
          if (!map[r.log_date]) map[r.log_date] = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
          map[r.log_date].kcal += Number(r.calories) || 0;
          map[r.log_date].protein += Number(r.protein) || 0;
          map[r.log_date].carbs += Number(r.carbs) || 0;
          map[r.log_date].fat += Number(r.fat) || 0;
        });
        setCalByDay(map);
        setCalLoaded(true);
      });
  }, []);

  var ctx = buildCoachContext(habits, comp, logs, sleep, cycles, calByDay);
  var signals = analyzeCoachSignals(ctx);
  var ctxHash = hashJson({ s: signals, w: ctx.workouts_30d.sessions, c: ctx.active_cycle && ctx.active_cycle.name });

  var hlS = useState(function () {
    try {
      var raw = localStorage.getItem("coachHighlights");
      if (!raw) return { loading: false, items: [], hash: null, ts: null, error: null };
      var p = JSON.parse(raw);
      return { loading: false, items: p.items || [], hash: p.hash || null, ts: p.ts || null, error: null };
    } catch (_e) {
      return { loading: false, items: [], hash: null, ts: null, error: null };
    }
  });
  var hl = hlS[0],
    setHl = hlS[1];

  function fetchHighlights(force) {
    if (!calLoaded) return;
    if (hl.loading) return;
    if (!force && hl.hash === ctxHash && hl.items.length) return;
    setHl(function (p) {
      return Object.assign({}, p, { loading: true, error: null });
    });
    fetch("/api/coach/highlights", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signals: signals, context: ctx }),
    })
      .then(function (r) {
        return r.text().then(function (txt) {
          var d = null;
          try {
            d = JSON.parse(txt);
          } catch (_e) {}
          if (!r.ok) throw new Error((d && d.error) || txt || "HTTP " + r.status);
          return d || {};
        });
      })
      .then(function (d) {
        var items = d.highlights || [];
        var rec = { loading: false, items: items, hash: ctxHash, ts: Date.now(), error: null };
        setHl(rec);
        try {
          localStorage.setItem("coachHighlights", JSON.stringify({ items: items, hash: ctxHash, ts: rec.ts }));
        } catch (_e) {}
      })
      .catch(function (e) {
        setHl(function (p) {
          return Object.assign({}, p, { loading: false, error: String((e && e.message) || e) });
        });
      });
  }

  useEffect(
    function () {
      fetchHighlights(false);
    },
    [calLoaded, ctxHash]
  );

  var msgsS = useState(function () {
    try {
      var raw = localStorage.getItem("coachChat");
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (_e) {}
    return [];
  });
  var msgs = msgsS[0],
    setMsgs = msgsS[1];
  var inS = useState("");
  var inp = inS[0],
    setInp = inS[1];
  var streamS = useState(false);
  var streaming = streamS[0],
    setStreaming = streamS[1];
  var errS = useState(null);
  var err = errS[0],
    setErr = errS[1];
  var chatScrollRef = useRef(null);

  useEffect(
    function () {
      try {
        localStorage.setItem("coachChat", JSON.stringify(msgs));
      } catch (_e) {}
    },
    [msgs]
  );

  useEffect(
    function () {
      if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    },
    [msgs, streaming]
  );

  function sendMessage(text) {
    var t = (text || "").trim();
    if (!t || streaming) return;
    setErr(null);
    var historyForApi = msgs.map(function (m) {
      return { role: m.role, content: m.content };
    });
    historyForApi.push({ role: "user", content: t });
    var nextLocal = msgs.concat([{ role: "user", content: t }, { role: "assistant", content: "", streaming: true }]);
    setMsgs(nextLocal);
    setInp("");
    setStreaming(true);

    streamCoachChat(
      { messages: historyForApi, context: ctx },
      function (delta) {
        setMsgs(function (p) {
          if (!p.length) return p;
          var n = p.slice();
          var last = n[n.length - 1];
          n[n.length - 1] = Object.assign({}, last, { content: (last.content || "") + delta });
          return n;
        });
      },
      function () {
        setMsgs(function (p) {
          if (!p.length) return p;
          var n = p.slice();
          var last = n[n.length - 1];
          n[n.length - 1] = Object.assign({}, last, { streaming: false });
          return n;
        });
        setStreaming(false);
      },
      function (e) {
        setErr(e);
        setMsgs(function (p) {
          if (!p.length) return p;
          var n = p.slice();
          if (n[n.length - 1] && n[n.length - 1].streaming && !n[n.length - 1].content) n.pop();
          else if (n[n.length - 1]) n[n.length - 1] = Object.assign({}, n[n.length - 1], { streaming: false });
          return n;
        });
        setStreaming(false);
      }
    );
  }

  function clearChat() {
    setMsgs([]);
    try {
      localStorage.removeItem("coachChat");
    } catch (_e) {}
  }

  var quickPrompts = ["Plan tomorrow's lift", "Why was my sleep low?", "Am I eating enough?", "What's lagging this week?"];
  var keyMsgPattern = /NO_KEY|ANTHROPIC_API_KEY|not set/;
  function renderErr(e) {
    if (!e) return null;
    if (keyMsgPattern.test(e)) return "Add ANTHROPIC_API_KEY to .env.local (then restart dev server) to enable Coach.";
    return e;
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ padding: "12px 22px 6px", flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Coach</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>Insight & Chat</div>
      </div>

      <div style={{ padding: "0 14px 4px", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.5 }}>
          HIGHLIGHTS {"\u00B7"} {fmtAgo(hl.ts)}
        </div>
        <button
          onClick={function () { fetchHighlights(true); }}
          disabled={hl.loading || !calLoaded}
          style={{
            background: "none",
            border: "1.5px solid " + C.border,
            borderRadius: 99,
            padding: "3px 11px",
            fontSize: 11,
            fontWeight: 600,
            color: hl.loading ? C.muted : C.accent,
            cursor: hl.loading ? "default" : "pointer",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {hl.loading ? "\u2026" : "\u21BB Refresh"}
        </button>
      </div>

      <div style={{ flex: "0 0 38%", minHeight: 0, overflowY: "auto", padding: "0 14px 6px" }}>
        {hl.error && (
          <div style={{ background: C.red, color: C.redT, padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
            {renderErr(hl.error)}
          </div>
        )}
        {!hl.items.length && !hl.loading && !hl.error && (
          <div style={{ background: C.panel, border: "1.5px dashed " + C.border, borderRadius: 14, padding: "14px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: C.text, fontWeight: 600, marginBottom: 4 }}>No highlights yet</div>
            <div style={{ fontSize: 11, color: C.muted }}>Log a few workouts and sleep nights, then tap Refresh.</div>
          </div>
        )}
        {hl.loading && !hl.items.length && (
          <div style={{ fontSize: 12, color: C.muted, padding: "12px 0", textAlign: "center" }}>Analyzing your data{"\u2026"}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {hl.items.map(function (c2, i) {
            var kindCol =
              c2.kind === "win"
                ? { bg: "rgba(200,204,212,0.12)", bd: "rgba(212,216,224,0.48)", fg: "#E8EAEF" }
                : c2.kind === "fix"
                ? { bg: "rgba(255,95,105,0.12)", bd: "rgba(255,132,140,0.45)", fg: "#FFADB2" }
                : { bg: "rgba(229,181,60,0.12)", bd: "rgba(245,207,94,0.42)", fg: "#F2D884" };
            var KindIco = c2.kind === "win" ? IconUiSparkles : c2.kind === "fix" ? IconUiAlert : IconUiEye;
            return (
              <div key={i} style={{ background: kindCol.bg, borderLeft: "3px solid " + kindCol.bd, borderRadius: 10, padding: "8px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <KindIco size={14} color={kindCol.fg} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: kindCol.fg, textTransform: "uppercase", letterSpacing: 0.5 }}>{c2.kind}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{"\u00B7 " + c2.title}</span>
                </div>
                <div style={{ fontSize: 11, color: C.text, lineHeight: 1.45 }}>{c2.body}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height: 1, background: C.border, flexShrink: 0, margin: "4px 0 0" }} />

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flexShrink: 0, padding: "8px 14px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.5 }}>CHAT</div>
          {msgs.length > 0 && (
            <button type="button" className="gt-focus-ring gt-min-tap" onClick={clearChat} style={{ background: "none", border: "none", fontSize: 12, color: C.muted, cursor: "pointer", padding: "10px 12px", margin: "-6px -10px -6px 0", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
              Clear
            </button>
          )}
        </div>

        <div ref={chatScrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "2px 14px 6px" }}>
          <div aria-live="polite" aria-atomic="false">
            {msgs.length === 0 && (
              <div style={{ padding: "14px 12px", color: C.muted, fontSize: 12, textAlign: "center", lineHeight: 1.5 }}>
                Ask anything about your training, sleep, or nutrition.
                <br />
                The coach reads your data live.
              </div>
            )}
            {msgs.map(function (m, i) {
              var isUser = m.role === "user";
              return (
                <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 7 }}>
                  <div
                    style={{
                      maxWidth: "84%",
                      padding: "8px 12px",
                      borderRadius: 14,
                      background: isUser ? C.gradCTA : C.panel,
                      color: isUser ? C.onAccent : C.text,
                      border: isUser ? "none" : "1.5px solid " + C.border,
                      fontSize: 13,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                    }}
                  >
                    {m.content || (m.streaming ? "\u2026" : "")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flexShrink: 0, padding: "0 14px 96px" }}>
          {!streaming && msgs.length < 6 && (
            <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 6 }} className="tabstrip">
              {quickPrompts.map(function (qp, i) {
                return (
                  <button
                    key={i}
                    type="button"
                    className="gt-focus-ring"
                    onClick={function () { sendMessage(qp); }}
                    style={{
                      flexShrink: 0,
                      background: C.panel,
                      border: "1.5px solid " + C.border,
                      borderRadius: 99,
                      padding: "10px 14px",
                      minHeight: 44,
                      fontSize: 12,
                      color: C.muted,
                      cursor: "pointer",
                      fontFamily: "'DM Sans',sans-serif",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {qp}
                  </button>
                );
              })}
            </div>
          )}
          {err && (
            <div style={{ background: C.red, color: C.redT, padding: "6px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
              {renderErr(err)}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
            <label htmlFor="coach-chat-input" className="gt-sr-only">
              Message coach
            </label>
            <textarea
              id="coach-chat-input"
              value={inp}
              onChange={function (e) { setInp(e.target.value); }}
              onKeyDown={function (e) {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inp);
                }
              }}
              placeholder={streaming ? "Thinking\u2026" : "Ask the coach\u2026"}
              rows={1}
              disabled={streaming}
              className="gt-input"
              style={{
                flex: 1,
                resize: "none",
                padding: "10px 12px",
                border: "1.5px solid " + C.border,
                borderRadius: 18,
                fontSize: 13,
                fontFamily: "'DM Sans',sans-serif",
                color: C.text,
                background: C.panel,
                outline: "none",
                maxHeight: 80,
                lineHeight: 1.4,
              }}
            />
            <button
              type="button"
              className="gt-focus-ring gt-min-tap"
              onClick={function () { sendMessage(inp); }}
              disabled={!inp.trim() || streaming}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: inp.trim() && !streaming ? C.gradCTA : C.border,
                border: "none",
                color: inp.trim() && !streaming ? C.onAccent : C.muted,
                fontSize: 17,
                cursor: inp.trim() && !streaming ? "pointer" : "default",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: inp.trim() && !streaming ? C.shadowCTASoft : "none",
                fontWeight: 700,
              }}
              aria-label="Send"
            >
              {streaming ? "\u2026" : "\u2191"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function useCompactLayout() {
  function compute() {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(max-width: 480px)").matches || window.matchMedia("(display-mode: standalone)").matches;
  }
  var s = useState(compute);
  var compact = s[0],
    setCompact = s[1];
  useEffect(function () {
    if (typeof window === "undefined" || !window.matchMedia) return;
    var mq1 = window.matchMedia("(max-width: 480px)");
    var mq2 = window.matchMedia("(display-mode: standalone)");
    var handler = function () {
      setCompact(mq1.matches || mq2.matches);
    };
    if (mq1.addEventListener) {
      mq1.addEventListener("change", handler);
      mq2.addEventListener("change", handler);
    } else {
      mq1.addListener(handler);
      mq2.addListener(handler);
    }
    return function () {
      if (mq1.removeEventListener) {
        mq1.removeEventListener("change", handler);
        mq2.removeEventListener("change", handler);
      } else {
        mq1.removeListener(handler);
        mq2.removeListener(handler);
      }
    };
  }, []);
  return compact;
}

export default function App() {
  var tk = today(),
    todayDOW = new Date().getDay(),
    wd = weekDates();
  var compact = useCompactLayout();
  var h1 = useState(HABITS);
  var habits = h1[0],
    setHabits = h1[1];
  var h2 = useState(COMP);
  var comp = h2[0],
    setComp = h2[1];
  var h3 = useState(LOGS);
  var logs = h3[0],
    setLogs = h3[1];
  var h4 = useState("home");
  var tab = h4[0],
    setTab = h4[1];
  var hVwSwipe = useState(0);
  var viewportSwipeW = hVwSwipe[0],
    setViewportSwipeW = hVwSwipe[1];
  var h5 = useState(null);
  var selHabit = h5[0],
    setSelHabit = h5[1];
  var h6 = useState(new Date().getMonth());
  var calM = h6[0],
    setCalM = h6[1];
  var h7 = useState(new Date().getFullYear());
  var calY = h7[0],
    setCalY = h7[1];
  var h8 = useState(false);
  var showAdd = h8[0],
    setShowAdd = h8[1];
  var h9 = useState("");
  var newName = h9[0],
    setNewName = h9[1];
  var h10 = useState("star");
  var newIconId = h10[0],
    setNewIconId = h10[1];
  var h11 = useState([0, 1, 2, 3, 4, 5, 6]);
  var newDays = h11[0],
    setNewDays = h11[1];
  var h12 = useState({});
  var justChk = h12[0],
    setJustChk = h12[1];
  var h13 = useState({});
  var sortRdy = h13[0],
    setSortRdy = h13[1];
  var h17 = useState(null);
  var pendGym = h17[0],
    setPendGym = h17[1];
  var h18 = useState(CYCLES);
  var cycles = h18[0],
    setCycles = h18[1];
  var h19 = useState({});
  var sleep = h19[0],
    setSleep = h19[1];
  var h20 = useState(false);
  var tabsExp = h20[0],
    setTabsExp = h20[1];
  var h21 = useState(false);
  var booted = h21[0],
    setBooted = h21[1];
  var h22 = useState(null);
  var bootErr = h22[0],
    setBootErr = h22[1];
  var hSplash = useState(false);
  var splashOut = hSplash[0],
    setSplashOut = hSplash[1];
  var hSplashDone = useState(false);
  var splashDone = hSplashDone[0],
    setSplashDone = hSplashDone[1];
  var h23 = useState(tk);
  var selDay = h23[0],
    setSelDay = h23[1];
  var hGymErr = useState(null);
  var gymSaveErr = hGymErr[0],
    setGymSaveErr = hGymErr[1];
  var hGymSav = useState(false);
  var gymSaving = hGymSav[0],
    setGymSaving = hGymSav[1];
  var phoneRef = useRef(null),
    scrollRef = useRef(null),
    tabSwipeRowRef = useRef(null),
    swipeInteractRef = useRef(false),
    pendingTabRef = useRef(null),
    dayStripRef = useRef(null),
    dateInputRef = useRef(null),
    swipeNavRef = useRef({ tab: "home", blocked: false, go: function () {} });

  useEffect(function () {
    if (!supaReady()) {
      setHabits([DEFAULT_GYM_HABIT]);
      setBooted(true);
      return;
    }
    D.loadAll()
      .then(function (data) {
        if (!data) {
          setHabits([DEFAULT_GYM_HABIT]);
          setBooted(true);
          return;
        }
        var isFresh = data.habits.length === 0 && data.cycles.length === 0 && Object.keys(data.logs).length === 0;
        if (isFresh) {
          setHabits([DEFAULT_GYM_HABIT]);
          D.fireAndForget(D.upsertHabit(DEFAULT_GYM_HABIT, 0), "seed-gym");
        } else {
          setHabits(data.habits);
        }
        setComp(data.comp);
        setLogs(data.logs);
        setCycles(data.cycles);
        setBooted(true);
      })
      .catch(function (e) {
        console.error("[boot] loadAll failed:", e);
        setBootErr(String(e && e.message ? e.message : e));
        setHabits([DEFAULT_GYM_HABIT]);
        setBooted(true);
      });
  }, []);

  useEffect(function () {
    if (!booted || splashOut) return;
    var t1 = setTimeout(function () { setSplashOut(true); }, 1200);
    var t2 = setTimeout(function () { setSplashDone(true); }, 4400);
    return function () { clearTimeout(t1); clearTimeout(t2); };
  }, [booted]);

  function scrollStripToEnd() {
    var el = dayStripRef.current;
    if (!el) return;
    window.requestAnimationFrame(function () {
      el.scrollLeft = el.scrollWidth;
    });
  }
  useEffect(function () {
    if (!booted || tab !== "home") return;
    scrollStripToEnd();
  }, [booted, tab]);

  function closePicker(commit) {
    if (commit) {
      var pid = pendingTabRef.current;
      if (pid && pid !== tab) switchTab(pid);
    }
    pendingTabRef.current = null;
    setTabsExp(false);
  }
  var gym = habits.find(function (h) {
    return h.icon === ICON_GYM;
  });

  function isComp(id) {
    return !!(comp[id] && comp[id][tk]);
  }
  function isCompOn(id, k) {
    return !!(comp[id] && comp[id][k]);
  }
  function isToday(k) {
    return k === tk;
  }
  function switchTab(id) {
    setTab(id);
    setSelHabit(null);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      scrollRef.current.scrollLeft = 0;
    }
  }

  useLayoutEffect(
    function () {
      if (!booted) return;
      var el = scrollRef.current;
      if (!el) return;
      el.scrollLeft = 0;
    },
    [booted, tab]
  );

  useLayoutEffect(
    function () {
      if (!booted) return;
      var sr = scrollRef.current;
      var row = tabSwipeRowRef.current;
      if (!sr || !row) return;
      if (swipeInteractRef.current) return;
      var w = sr.clientWidth;
      if (!w) return;
      row.style.transition = "none";
      row.style.transform = "translate3d(" + -w + "px,0,0)";
      sr.scrollLeft = 0;
    },
    [booted, tab, viewportSwipeW]
  );

  useEffect(
    function () {
      if (!booted || typeof ResizeObserver === "undefined") return;
      var sr = scrollRef.current;
      if (!sr) return;
      function measure() {
        var w = sr.clientWidth;
        if (w) setViewportSwipeW(w);
      }
      measure();
      var ro = new ResizeObserver(function () {
        measure();
      });
      ro.observe(sr);
      return function () {
        ro.disconnect();
      };
    },
    [booted]
  );

  swipeNavRef.current.tab = tab;
  swipeNavRef.current.blocked = !!(tabsExp || showAdd || pendGym);
  swipeNavRef.current.go = switchTab;

  useEffect(
    function () {
      if (!booted) return;
      var el = scrollRef.current;
      if (!el) return;
      var prefersReduce =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var sx = 0,
        sy = 0,
        armed = false;
      var axisLock = 0;
      var AXIS_MIN = 14;
      var AXIS_RATIO = 1.22;
      var lockHorizX = null;
      var lastXm = 0,
        lastTm = 0,
        vx = 0;
      var COMMIT_FRAC = 0.26;
      var V_COMMIT = 0.42;
      var SNAP_CSS = "transform 0.34s cubic-bezier(0.32, 0.72, 0.25, 1)";

      function rowW() {
        return el.clientWidth || viewportSwipeW || 0;
      }
      function setRowTx(txPx, transitionCss) {
        if (!tabSwipeRowRef.current) return;
        var nd = tabSwipeRowRef.current;
        nd.style.transition = transitionCss || "none";
        nd.style.transform = "translate3d(" + txPx + "px,0,0)";
      }
      function finishSwipeInteract() {
        swipeInteractRef.current = false;
      }
      function onStart(e) {
        var r = swipeNavRef.current;
        if (r.blocked) return;
        var target = e.target;
        if (target && target.closest) {
          if (target.closest(".tabstrip, .summary-strip")) return;
          if (target.closest("input, textarea, select, [data-no-tab-swipe]")) return;
        }
        var touch = e.touches[0];
        if (!touch) return;
        sx = touch.clientX;
        sy = touch.clientY;
        armed = true;
        axisLock = 0;
        lockHorizX = null;
        vx = 0;
        lastXm = sx;
        lastTm = Date.now();
      }
      function onMove(e) {
        if (!armed) return;
        var r = swipeNavRef.current;
        if (r.blocked) return;
        var touch = e.touches[0];
        if (!touch) return;
        var dx = touch.clientX - sx;
        var dy = touch.clientY - sy;
        var adx = Math.abs(dx);
        var ady = Math.abs(dy);
        var now = Date.now();
        if (axisLock === 0 && Math.max(adx, ady) >= AXIS_MIN) {
          if (adx > ady * AXIS_RATIO) {
            axisLock = 1;
            lockHorizX = touch.clientX;
            vx = 0;
            swipeInteractRef.current = true;
            lastXm = touch.clientX;
            lastTm = now;
          } else if (ady > adx * AXIS_RATIO) {
            axisLock = 2;
          }
        }
        if (axisLock === 1 && lockHorizX != null) {
          e.preventDefault();
          if (el.scrollLeft) el.scrollLeft = 0;
          var w = rowW();
          if (!w) return;
          var delta = touch.clientX - lockHorizX;
          var txRaw = -w + delta;
          var txClamp = txRaw;
          if (txRaw > 0) txClamp = Math.min(txRaw * 0.22, w * 0.06);
          else if (txRaw < -2 * w) txClamp = -2 * w + (txRaw + 2 * w) * 0.22;
          if (txClamp > 0) txClamp = 0;
          if (txClamp < -2 * w) txClamp = -2 * w;
          setRowTx(txClamp, "none");
          var dt = now - lastTm;
          if (dt > 0) {
            vx = (touch.clientX - lastXm) / dt;
          }
          lastXm = touch.clientX;
          lastTm = now;
        }
      }
      function animateTo(txTarget, done) {
        var wSnap = rowW();
        if (!wSnap || !tabSwipeRowRef.current) {
          finishSwipeInteract();
          if (done) done();
          return;
        }
        if (prefersReduce) {
          setRowTx(txTarget, "none");
          finishSwipeInteract();
          if (done) done();
          return;
        }
        swipeInteractRef.current = true;
        var nd = tabSwipeRowRef.current;
        var settled = false;
        function finalize() {
          if (settled) return;
          settled = true;
          window.clearTimeout(failSafe);
          nd.removeEventListener("transitionend", ended);
          finishSwipeInteract();
          if (done) done();
        }
        function ended(ev) {
          if (ev && ev.propertyName && ev.propertyName !== "transform") return;
          finalize();
        }
        var failSafe = window.setTimeout(finalize, 420);
        nd.addEventListener("transitionend", ended);
        setRowTx(txTarget, SNAP_CSS);
      }
      function onEnd(e) {
        if (!armed) return;
        armed = false;
        var locked = axisLock;
        axisLock = 0;
        el.scrollLeft = 0;
        var touch = e.changedTouches[0];
        var r = swipeNavRef.current;
        if (!touch || r.blocked) {
          lockHorizX = null;
          if (locked === 1) animateTo(-rowW(), null);
          else swipeInteractRef.current && finishSwipeInteract();
          return;
        }
        if (locked === 2) {
          lockHorizX = null;
          swipeInteractRef.current && finishSwipeInteract();
          var wRest = rowW();
          if (wRest && tabSwipeRowRef.current) setRowTx(-wRest, "none");
          return;
        }
        if (locked !== 1 || lockHorizX == null) {
          swipeInteractRef.current && finishSwipeInteract();
          lockHorizX = null;
          var wIdle = rowW();
          if (wIdle && tabSwipeRowRef.current) setRowTx(-wIdle, "none");
          return;
        }
        var w = rowW();
        if (!w) {
          finishSwipeInteract();
          lockHorizX = null;
          return;
        }
        var delta = touch.clientX - lockHorizX;
        var L = APP_NAV_TABS.length;
        var idx = APP_NAV_TABS.findIndex(function (x) {
          return x.id === r.tab;
        });
        if (idx < 0) idx = 0;
        var commitNext = delta < -COMMIT_FRAC * w || vx < -V_COMMIT;
        var commitPrev = delta > COMMIT_FRAC * w || vx > V_COMMIT;
        lockHorizX = null;

        if (commitNext && commitPrev) {
          if (Math.abs(delta) < 4) {
            commitNext = commitPrev = false;
          } else if (delta > 0) commitNext = false;
          else commitPrev = false;
        }
        if (commitNext) {
          swipeInteractRef.current = true;
          var nid = APP_NAV_TABS[(idx + 1) % L].id;
          animateTo(-2 * w, function () {
            r.go(nid);
          });
          return;
        }
        if (commitPrev) {
          swipeInteractRef.current = true;
          var pid = APP_NAV_TABS[(idx - 1 + L) % L].id;
          animateTo(0, function () {
            r.go(pid);
          });
          return;
        }
        swipeInteractRef.current = true;
        animateTo(-w, null);
      }
      function onCancel() {
        armed = false;
        axisLock = 0;
        lockHorizX = null;
        el.scrollLeft = 0;
        animateTo(-rowW(), null);
      }
      el.addEventListener("touchstart", onStart, { passive: true });
      el.addEventListener("touchmove", onMove, { passive: false });
      el.addEventListener("touchend", onEnd, { passive: true });
      el.addEventListener("touchcancel", onCancel, { passive: true });
      return function () {
        el.removeEventListener("touchstart", onStart);
        el.removeEventListener("touchmove", onMove);
        el.removeEventListener("touchend", onEnd);
        el.removeEventListener("touchcancel", onCancel);
      };
    },
    [booted, viewportSwipeW]
  );

  function toggleHabit(id, btn) {
    var k = selDay;
    var was = comp[id] && comp[id][k];
    setComp(function (p) {
      var n = Object.assign({}, p);
      n[id] = Object.assign({}, p[id] || {});
      n[id][k] = !was;
      return n;
    });
    D.fireAndForget(D.setCompletion(id, k, !was), "toggleHabit");
    if (!was) {
      setJustChk(function (p) {
        var n = Object.assign({}, p);
        n[id] = true;
        return n;
      });
      setTimeout(function () {
        setJustChk(function (p) {
          var n = Object.assign({}, p);
          delete n[id];
          return n;
        });
      }, 900);
      setTimeout(function () {
        setSortRdy(function (p) {
          var n = Object.assign({}, p);
          n[id] = true;
          return n;
        });
      }, 1200);
      var hab = habits.find(function (h) {
        return h.id === id;
      });
      if (hab && hab.icon === ICON_GYM) {
        var capturedDay = k;
        setTimeout(function () {
          setGymSaveErr(null);
          setPendGym({ id: id, day: capturedDay });
        }, 800);
      }
    } else {
      setSortRdy(function (p) {
        var n = Object.assign({}, p);
        delete n[id];
        return n;
      });
    }
  }
  function toggleDate(hid, k) {
    var was = !!(comp[hid] && comp[hid][k]);
    setComp(function (p) {
      var n = Object.assign({}, p);
      n[hid] = Object.assign({}, p[hid] || {});
      if (n[hid][k]) delete n[hid][k];
      else n[hid][k] = true;
      return n;
    });
    D.fireAndForget(D.setCompletion(hid, k, !was), "toggleDate");
  }

  function getStreak(id) {
    var done = comp[id] || {},
      hab = habits.find(function (h) {
        return h.id === id;
      });
    var str = 0,
      t = new Date();
    for (var i = 0; i < 365; i++) {
      var d = new Date(t);
      d.setDate(t.getDate() - i);
      var k = dk(d);
      if (hab && !hab.scheduledDays.includes(d.getDay())) continue;
      if (done[k]) str++;
      else if (i > 0) break;
    }
    return str;
  }
  function getRate(id) {
    var done = comp[id] || {},
      keys = Object.keys(done).filter(function (k) {
        return done[k];
      });
    if (!keys.length) return 0;
    var e = keys.sort()[0],
      days = Math.max(1, Math.round((new Date() - new Date(e)) / 86400000) + 1);
    return Math.round((keys.length / days) * 100);
  }
  function getWP(id) {
    var done = comp[id] || {},
      hab = habits.find(function (h) {
        return h.id === id;
      });
    var c = 0,
      t = 0;
    wd.forEach(function (d) {
      var k = dk(d);
      if (!hab || !hab.scheduledDays.includes(d.getDay())) return;
      if (k > tk) return;
      t++;
      if (done[k]) c++;
    });
    return { c: c, t: t };
  }
  function togNewDay(d) {
    setNewDays(function (p) {
      return p.includes(d) ? p.filter(function (x) { return x !== d; }) : p.concat([d]).sort(function (a, b) { return a - b; });
    });
  }
  function addHabit() {
    if (!newName.trim() || !newDays.length) return;
    if (newIconId === ICON_GYM && gym) return;
    var id = Date.now();
    var newH = { id: id, name: newName.trim(), icon: newIconId, scheduledDays: newDays };
    var sortIdx = habits.length;
    setHabits(function (p) {
      return p.concat([newH]);
    });
    setComp(function (p) {
      var n = Object.assign({}, p);
      n[id] = {};
      return n;
    });
    D.fireAndForget(D.upsertHabit(newH, sortIdx), "addHabit");
    setNewName("");
    setNewIconId("star");
    setNewDays([0, 1, 2, 3, 4, 5, 6]);
    setShowAdd(false);
  }

  var selDate = new Date(selDay + "T00:00:00");
  var selDOW = selDate.getDay();
  var selIsToday = selDay === tk;
  var selH = habits
    .filter(function (h) {
      return h.scheduledDays.includes(selDOW);
    })
    .sort(function (a, b) {
      return (selIsToday ? (sortRdy[a.id] ? 1 : 0) - (sortRdy[b.id] ? 1 : 0) : 0);
    });
  var selDoneC = selH.filter(function (h) {
    return isCompOn(h.id, selDay);
  }).length;
  var selPct = selH.length > 0 ? (selDoneC / selH.length) * 100 : 0;
  var dayStrip = (function () {
    var out = [];
    var t = new Date(tk + "T00:00:00");
    for (var i = 13; i >= 0; i--) {
      var d = new Date(t);
      d.setDate(t.getDate() - i);
      out.push(d);
    }
    return out;
  })();
  function selectDay(k) {
    setSelDay(k);
    setSortRdy({});
  }

  if (!booted) {
    return (
      <div>
        <style>{"body{background:#0b0e14;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media (max-width:480px),(display-mode:standalone){body{background:transparent;display:block;min-height:100vh;}}"}</style>
        <div className={"gt-splash gt-page-bg"} style={{ fontFamily: "'DM Sans',sans-serif" }}>
          <div className="gt-splash-logo">
            <div className="gt-splash-ring" aria-hidden="true">
              <IconDumbbellMark size={48} color={C.accent} />
            </div>
          </div>
          <div className="gt-splash-text">GymTrack</div>
        </div>
      </div>
    );
  }
  var navSwipeIdx = APP_NAV_TABS.findIndex(function (x) {
    return x.id === tab;
  });
  if (navSwipeIdx < 0) navSwipeIdx = 0;
  var LNavTabs = APP_NAV_TABS.length;
  var navPrevId = APP_NAV_TABS[(navSwipeIdx - 1 + LNavTabs) % LNavTabs].id;
  var navNextId = APP_NAV_TABS[(navSwipeIdx + 1) % LNavTabs].id;

  function renderMainNavPane(paneTab) {
    return (
      <div
        key={"gt-nav-pane-" + paneTab}
        className="gt-tab-swipe-pane"
        style={{
          flex: "1 1 0",
          minWidth: 0,
          minHeight: "100%",
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          boxSizing: "border-box",
          position: "relative",
          paddingBottom: 100,
        }}
      >
          {paneTab === "home" && !selHabit && (
            <div style={{ paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px 4px" }}>
                <div ref={paneTab === tab ? dayStripRef : null} className="tabstrip summary-strip" style={{ flex: 1, display: "flex", gap: 5, overflowX: "auto", scrollSnapType: "x mandatory", padding: "4px 2px" }}>
                  {dayStrip.map(function (d) {
                    var k = dk(d);
                    var isSel = k === selDay;
                    var isT = k === tk;
                    var dow = d.getDay();
                    var sched = habits.filter(function (h) { return h.scheduledDays.includes(dow); });
                    var done = sched.filter(function (h) { return !!(comp[h.id] && comp[h.id][k]); }).length;
                    var hasAny = done > 0;
                    var isPerfect = sched.length > 0 && done === sched.length;
                    return (
                      <button
                        type="button"
                        className="gt-focus-ring tb"
                        key={k}
                        onClick={function () { selectDay(k); }}
                        style={{
                          flex: "0 0 auto",
                          scrollSnapAlign: "end",
                          minWidth: 44,
                          padding: "6px 0 5px",
                          borderRadius: 12,
                          border: isSel ? "1.5px solid rgba(212,216,224,0.55)" : isT ? "1.5px solid " + C.gm : "1.5px solid " + C.border,
                          background: isSel ? C.gradCTA : C.panel,
                          color: isSel ? C.onAccent : C.text,
                          cursor: "pointer",
                          fontFamily: "'DM Sans',sans-serif",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                          boxShadow: isSel ? C.shadowCTASoft : "none",
                          transition: "background 0.18s ease,border-color 0.18s ease",
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.35, textTransform: "uppercase", opacity: isSel ? 0.95 : 0.75 }}>{DL[dow]}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>{d.getDate()}</span>
                        <span style={{ height: 5, marginTop: 1, display: "flex", alignItems: "center" }}>
                          {hasAny && <span style={{ width: 5, height: 5, borderRadius: "50%", background: isSel ? C.onAccent : isPerfect ? C.gd : C.gm }} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="gt-focus-ring gt-min-tap"
                  onClick={function () { if (dateInputRef.current) { try { dateInputRef.current.showPicker(); } catch (e) { dateInputRef.current.click(); } } }}
                  style={{ flex: "0 0 auto", width: 44, height: 44, borderRadius: 12, background: C.panel, border: "1.5px solid " + C.border, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}
                  aria-label="Pick a date"
                >
                  <ICal color={C.text} />
                </button>
                <input
                  ref={paneTab === tab ? dateInputRef : null}
                  type="date"
                  value={selDay}
                  max={tk}
                  onChange={function (e) { if (e.target.value) selectDay(e.target.value); }}
                  style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
                />
              </div>
              <div style={{ padding: "6px 22px 10px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>
                    {selIsToday ? "Today" : selDate.toLocaleDateString("en-US", { weekday: "long" })}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1.1 }}>
                    {selDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                  </div>
                </div>
                {!selIsToday && (
                  <button type="button" className="gt-focus-ring gt-min-tap" onClick={function () { selectDay(tk); scrollStripToEnd(); }} style={{ padding: "10px 16px", borderRadius: 99, background: C.gl, border: "1.5px solid " + C.gm, color: C.gd, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", minHeight: 44 }}>
                    Jump to today
                  </button>
                )}
              </div>
              {habits.length > 0 && (
                <div style={{ padding: "0 22px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{selIsToday ? "Today\u2019s Progress" : "Progress"}</span>
                    <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>
                      {selDoneC}/{selH.length}
                    </span>
                  </div>
                  <div style={{ height: 5, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: selPct + "%", background: "linear-gradient(90deg," + C.accentDeep + "," + C.accent + ")", borderRadius: 99, transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
                  </div>
                </div>
              )}
              {selH.length === 0 && habits.length === 0 && (
                <div style={{ margin: "16px 14px 0", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px", background: C.panel, borderRadius: 22, border: "1.5px dashed " + C.border }}>
                  <div style={{ marginBottom: 14, display: "flex", justifyContent: "center", lineHeight: 0 }} aria-hidden="true">
                    <IconSprout size={52} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 6, textAlign: "center" }}>No habits yet</div>
                  <div style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>Tap + to add your first habit.</div>
                  <button type="button" className="gt-focus-ring" onClick={() => setShowAdd(true)} style={{ padding: "11px 24px", borderRadius: 99, background: C.gradCTA, border: "none", color: C.onAccent, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    Add your first habit
                  </button>
                </div>
              )}
              {selH.length === 0 && habits.length > 0 && (
                <div style={{ margin: "10px 14px 0", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px", background: C.panel, borderRadius: 18, border: "1.5px dashed " + C.border }}>
                  <div style={{ marginBottom: 10, opacity: 0.65 }} aria-hidden="true">
                    <ICal color={C.muted} />
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 1.5 }}>
                    No habits scheduled for {selIsToday ? "today" : selDate.toLocaleDateString("en-US", { weekday: "long" })}.
                  </div>
                </div>
              )}
              <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 9 }}>
                {selH.map(function (habit) {
                  var done = isCompOn(habit.id, selDay),
                    streak = getStreak(habit.id),
                    wp = getWP(habit.id),
                    pop = justChk[habit.id],
                    gymOrphan = gym && habit.id === gym.id && done && !workoutLogHasDetails(logs[selDay]);
                  return (
                    <div key={habit.id} className={"hab" + (pop ? " glow" : "")} style={{ background: done ? C.gl : C.panel, borderRadius: 18, padding: "14px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: done ? "0 2px 18px rgba(0,0,0,0.35), 0 0 0 1px rgba(200,204,212,0.2)" : "0 3px 12px rgba(0,0,0,0.22)", border: "1.5px solid " + (done ? C.gm : C.border), transition: "background 0.4s ease,border-color 0.4s ease" }}>
                      <button type="button" aria-pressed={done} aria-label={(done ? "Unmark " : "Mark ") + habit.name + " for " + selDay} className={"chk gt-focus-ring" + (pop ? " chk-celebrate" : "") + (habit.icon === ICON_GYM ? " gt-shimmer gt-shimmer-ring" : "")} onClick={function (e) { toggleHabit(habit.id, e.currentTarget); }} style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, border: done ? "2px solid rgba(212,216,224,0.55)" : "2px solid " + C.border, background: done ? C.green : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: done ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 14px rgba(0,0,0,0.38)" : "none", transition: "all 0.32s cubic-bezier(0.34,1.56,0.64,1)" }}>
                        {done && (
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: pop ? "checkPop 0.8s cubic-bezier(0.34,1.56,0.64,1) both" : "none" }}>
                            <path d="M4 10.5L8.5 15L16 6" stroke={C.onAccent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div
                        aria-hidden="true"
                        style={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          borderRadius: 13,
                          background: done ? C.panelHi : C.gl,
                          border: "1.5px solid " + (done ? C.gm : C.border),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          lineHeight: 1,
                          boxShadow: done ? "0 1px 4px rgba(0,0,0,0.25)" : "none",
                        }}
                      >
                        <HabitIcon id={habit.icon} size={22} color={done ? C.gd : C.accent} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: done ? C.gd : C.text, letterSpacing: 0.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{habit.name}</div>
                        {gymOrphan && (
                          <button
                            type="button"
                            className="gt-focus-ring"
                            onClick={function (e) {
                              e.stopPropagation();
                              setGymSaveErr(null);
                              setPendGym({ id: habit.id, day: selDay });
                            }}
                            style={{
                              marginTop: 6,
                              padding: "5px 10px",
                              borderRadius: 8,
                              border: "1px solid " + C.gm,
                              background: C.panel,
                              color: C.gd,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "'DM Sans',sans-serif",
                            }}
                          >
                            Add workout details
                          </button>
                        )}
                        <div style={{ marginTop: 7 }}>
                          <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                            {wd.map(function (d, i) {
                              var dow = d.getDay(),
                                k = dk(d),
                                sc = habit.scheduledDays.includes(dow),
                                dn = !!(comp[habit.id] && comp[habit.id][k]),
                                fut = k > tk,
                                ist = k === tk,
                                missed = sc && !dn && !fut && !ist;
                              var bg;
                              if (!sc) bg = C.border;
                              else if (dn) bg = C.green;
                              else if (fut) bg = C.border;
                              else if (ist) bg = C.gm;
                              else bg = "repeating-linear-gradient(45deg," + C.redT + " 0," + C.redT + " 2px,transparent 2px,transparent 5px)";
                              return (
                                <div
                                  key={i}
                                  title={missed ? "Scheduled, missed" : !sc ? "Rest day" : dn ? "Done" : fut ? "Upcoming" : ist ? "Today" : ""}
                                  style={{ flex: 1, height: 5, borderRadius: 99, background: bg, opacity: !sc ? 0.3 : 1, transition: "background 0.4s", boxShadow: missed ? "inset 0 -1px 0 rgba(155,69,69,0.45)" : "none" }}
                                />
                              );
                            })}
                          </div>
                          <div style={{ display: "flex", gap: 2 }}>
                            {DL.map(function (l, i) {
                              return (
                                <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: i === todayDOW ? C.accent : C.muted, fontWeight: i === todayDOW ? 700 : 400 }}>
                                  {l}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 44 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: done ? C.gd : C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>{streak}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>streak</div>
                        <div style={{ fontSize: 10, color: C.muted }}>
                          {wp.c}/{wp.t} wk
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selDoneC === selH.length && selH.length > 0 && (
                <div style={{ margin: "16px 14px 0", background: C.gradSuccess, borderRadius: 18, padding: "16px 18px", textAlign: "center", border: "1px solid rgba(212,216,224,0.35)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                  <div style={{ marginBottom: 6, display: "flex", justifyContent: "center", lineHeight: 0 }} aria-hidden="true">
                    <IconSprout size={34} color={C.accent} />
                  </div>
                  <div style={{ fontSize: 14, color: C.onAccent, fontFamily: "'DM Serif Display',serif", lineHeight: 1.4 }}>
                    All done for {selIsToday ? "today" : selDate.toLocaleDateString("en-US", { weekday: "long" })}.
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(232,234,239,0.78)", marginTop: 3 }}>Every action is a vote for the person you want to become.</div>
                </div>
              )}
            </div>
          )}
          {paneTab === "calendar" && (
            <UnifiedCalendar
              habits={habits}
              comp={comp}
              wl={logs}
              sleep={sleep}
              cycles={cycles}
              todayKey={tk}
              calY={calY}
              calM={calM}
              setCM={setCalM}
              setCY={setCalY}
            />
          )}
          {paneTab === "coach" && <CoachTab habits={habits} comp={comp} logs={logs} sleep={sleep} cycles={cycles} />}
          {paneTab === "gainz" && <GainzTab wl={logs} gym={gym} comp={comp} cycles={cycles} todayKey={tk} />}
          {paneTab === "cycles" && <CyclesTab cycles={cycles} setCycles={setCycles} />}
          {paneTab === "sleep" && <SleepTab sleep={sleep} setSleep={setSleep} />}
          {paneTab === "calories" && <CalorieTab portalRoot={phoneRef} />}
          {paneTab === "settings" && (
            <SettingsTab
              habits={habits}
              setHabits={setHabits}
            />
          )}
      </div>
    );
  }
  return (
    <div>
      <style>
        {
          "@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}body{background:#0b0e14;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media (max-width:480px),(display-mode:standalone){body{background:transparent;display:block;min-height:100vh;}}@keyframes checkPop{0%{transform:scale(0.3);opacity:0}45%{transform:scale(1.35)}65%{transform:scale(0.88)}82%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes cardGlow{0%{box-shadow:0 3px 14px rgba(0,0,0,0.22)}40%{box-shadow:0 0 0 4px rgba(200,204,212,0.32)}100%{box-shadow:0 5px 22px rgba(0,0,0,0.35),0 0 0 1px rgba(212,216,224,0.22)}}.hab{animation:slideUp 0.32s ease both;}.hab:nth-child(1){animation-delay:0.04s}.hab:nth-child(2){animation-delay:0.08s}.hab:nth-child(3){animation-delay:0.12s}.hab:nth-child(4){animation-delay:0.16s}.hab:nth-child(5){animation-delay:0.20s}.chk{transition:transform 0.15s ease;}.chk:active{transform:scale(0.82)!important;}@keyframes chkCelebrate{0%{box-shadow:0 0 0 0 rgba(200,204,212,0.55)}35%{transform:scale(1.22);box-shadow:0 0 0 7px rgba(200,204,212,0.45)}65%{transform:scale(0.95);box-shadow:0 0 0 3px rgba(200,204,212,0.2)}100%{transform:scale(1);box-shadow:0 0 0 0 rgba(200,204,212,0)}}.chk-celebrate{animation:chkCelebrate 0.4s cubic-bezier(0.34,1.56,0.64,1) both;}.tb{transition:all 0.2s ease;}.glow{animation:cardGlow 1.0s ease forwards;}.tabstrip::-webkit-scrollbar{display:none;}.tabstrip{scrollbar-width:none;-ms-overflow-style:none;}"
        }
      </style>
      <div
        ref={phoneRef}
        className="gt-page-bg"
        style={{
          width: compact ? "100%" : 390,
          maxWidth: compact ? "100%" : undefined,
          height: compact ? "100dvh" : 844,
          borderRadius: compact ? 0 : 48,
          overflow: "hidden",
          boxShadow: compact ? "none" : "0 30px 80px rgba(0,0,0,0.22),0 0 0 10px #1a1a1a,0 0 0 12px #2a2a2a",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Sans',sans-serif",
          paddingTop: compact ? "env(safe-area-inset-top)" : 0,
          paddingBottom: compact ? "env(safe-area-inset-bottom)" : 0,
        }}
      >
        {pendGym && (
          <GymQ
            day={pendGym.day || tk}
            initial={logs[pendGym.day || tk]}
            saving={gymSaving}
            saveError={gymSaveErr}
            onSave={function (data) {
              var d = (pendGym && pendGym.day) || tk;
              setGymSaving(true);
              setGymSaveErr(null);
              D.upsertWorkoutLog(d, data)
                .then(function (saved) {
                  setLogs(function (p) {
                    var n = Object.assign({}, p);
                    n[d] = saved;
                    return n;
                  });
                  setPendGym(null);
                  setGymSaving(false);
                })
                .catch(function (e) {
                  setGymSaveErr(String(e && e.message ? e.message : e));
                  setGymSaving(false);
                });
            }}
            onSkip={function () {
              // Policy (b): habit completion stays; workout_logs only written on Save Workout or "Add workout details".
              setPendGym(null);
              setGymSaveErr(null);
              setGymSaving(false);
            }}
          />
        )}
        {!compact && (
          <div style={{ height: 50, background: "transparent", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 28px 8px", position: "relative", zIndex: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>9:41</span>
            <div style={{ width: 120, height: 32, background: "#1a1a1a", borderRadius: 20, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 0 }} />
            <div style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 11, color: C.text }}>
              <span>{"\u2026"}</span>
              <span>WiFi</span>
              <span>100%</span>
            </div>
          </div>
        )}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            width: "100%",
            overflowX: "hidden",
            overflowY: "auto",
            overscrollBehaviorX: "none",
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            ref={tabSwipeRowRef}
            style={{
              display: "flex",
              flexDirection: "row",
              width: "300%",
              minHeight: "100%",
              willChange: "transform",
              transition: "none",
            }}
          >
            {renderMainNavPane(navPrevId)}
            {renderMainNavPane(tab)}
            {renderMainNavPane(navNextId)}
          </div>
        </div>
        {tabsExp && (
          <div
            onClick={() => closePicker(true)}
            style={{ position: "absolute", inset: 0, background: C.scrimTint, zIndex: 9, animation: "fadeIn 0.18s ease both" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            bottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
            left: "50%",
            transform: "translateX(-50%)",
            width: "max-content",
            maxWidth: "min(290px, calc(100vw - 24px))",
            zIndex: 10,
            pointerEvents: "none",
            background: "none",
            border: "none",
            boxShadow: "none",
          }}
        >
          {!tabsExp ? (
            (function () {
              var curTab = APP_NAV_TABS.find(function (t) { return t.id === tab; }) || APP_NAV_TABS[0];
              var CurI = curTab.Icon;
              var launcherShadowFull =
                C.shadowCTA + ", inset 0 1px 0 rgba(255,255,255,0.16)";
              return (
                <button
                  type="button"
                  className="gt-focus-ring gt-shimmer gt-shimmer-pill"
                  onClick={() => setTabsExp(true)}
                  style={{
                    pointerEvents: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    background: C.gradCTA,
                    border: "1px solid rgba(212,216,224,0.42)",
                    borderRadius: 99,
                    padding: "12px 22px 12px 18px",
                    boxShadow: launcherShadowFull,
                    cursor: "pointer",
                    color: C.onAccent,
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                  }}
                  aria-label="Open tab switcher"
                >
                  <CurI color={C.onAccent} />
                  <span>{curTab.label}</span>
                </button>
              );
            })()
          ) : (
            <div
              className="gt-glass-strong"
              style={{
                pointerEvents: "auto",
                width: "min(290px, calc(100vw - 24px))",
                borderRadius: 32,
                padding: "8px 0",
                boxShadow: "0 14px 44px rgba(0,0,0,0.55)",
                border: "1.5px solid " + C.border,
                animation: "slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
                overflow: "hidden",
              }}
            >
              <TabPicker
                tabs={APP_NAV_TABS}
                activeId={tab}
                onCenterChange={function (id) {
                  pendingTabRef.current = id;
                }}
                onSettle={function (id) {
                  pendingTabRef.current = id;
                  switchTab(id);
                }}
                onSelect={function (id) {
                  pendingTabRef.current = id;
                  closePicker(true);
                }}
              />
            </div>
          )}
        </div>
        {showAdd && (
          <div style={{ position: "absolute", inset: 0, background: C.scrimMed, display: "flex", alignItems: "flex-end", zIndex: 100 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(180deg," + C.sheet + " 0%, " + C.bg + " 100%)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderTop: "1px solid rgba(255,255,255,0.12)", borderRadius: "28px 28px 0 0", padding: "22px 20px 48px", width: "100%", maxHeight: "88%", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 18px" }} />
              <div style={{ fontSize: 19, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 18 }}>New Habit</div>
              {gym && newIconId === ICON_GYM && <div style={{ background: C.red, borderRadius: 9, padding: "7px 11px", marginBottom: 10, fontSize: 12, color: C.redT, fontWeight: 600 }}>You already have a gym habit.</div>}
              <div style={{ marginBottom: 16 }}>
                <div id="habit-icon-label" style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Icon
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} aria-labelledby="habit-icon-label">
                  {HABIT_ICON_ORDER.map(function (hid) {
                    return (
                      <button
                        key={hid}
                        type="button"
                        className="gt-focus-ring gt-min-tap"
                        onClick={() => setNewIconId(hid)}
                        aria-label={"Icon " + hid}
                        aria-pressed={newIconId === hid}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 11,
                          background: newIconId === hid ? C.gl : C.panel,
                          border: "2px solid " + (newIconId === hid ? C.accent : C.border),
                          cursor: "pointer",
                          opacity: hid === ICON_GYM && gym ? 0.4 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          padding: 0,
                        }}
                      >
                        <HabitIcon id={hid} size={22} color={newIconId === hid ? C.accent : C.muted} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="habit-new-name" style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 7, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Name
                </label>
                <input
                  id="habit-new-name"
                  autoComplete="off"
                  value={newName}
                  className="gt-input"
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addHabit(); }}
                  placeholder="e.g. Journal for 5 minutes"
                  style={{ width: "100%", padding: "12px 13px", border: "1.5px solid " + C.border, borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.panel, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: 22 }}>
                <div id="habit-schedule-label" style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Schedule
                </div>
                <div style={{ display: "flex", gap: 4 }} role="group" aria-labelledby="habit-schedule-label">
                  {DL.map(function (label, i) {
                    var a = newDays.includes(i);
                    return (
                      <button key={i} type="button" className="gt-focus-ring" onClick={() => togNewDay(i)} aria-pressed={a} style={{ flex: 1, minHeight: 44, padding: "8px 4px", borderRadius: 9, background: a ? C.selFill : C.panel, border: "1.5px solid " + (a ? C.selBorder : C.border), color: a ? C.selText : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6, textAlign: "center" }}>
                  {newDays.length === 7 ? "Every day" : newDays.length === 0 ? "Pick at least one day" : newDays.map(function (d) { return DL[d]; }).join(", ")}
                </div>
              </div>
              <button type="button" className="gt-focus-ring" onClick={addHabit} style={{ width: "100%", padding: "14px", borderRadius: 16, background: newName.trim() && newDays.length && !(newIconId === ICON_GYM && gym) ? C.gradCTA : C.border, border: "none", color: newName.trim() && newDays.length && !(newIconId === ICON_GYM && gym) ? C.onAccent : C.muted, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                Add Habit
              </button>
              <button type="button" className="gt-focus-ring" onClick={() => setShowAdd(false)} style={{ width: "100%", padding: "11px", borderRadius: 16, background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      {!splashDone && (
        <div className={"gt-splash gt-page-bg" + (splashOut ? " gt-splash-out" : "")} style={{ fontFamily: "'DM Sans',sans-serif" }}>
          <div className="gt-splash-logo">
            <div className="gt-splash-ring" aria-hidden="true">
              <IconDumbbellMark size={48} color={C.accent} />
            </div>
          </div>
          <div className="gt-splash-text">GymTrack</div>
        </div>
      )}
    </div>
  );
}
