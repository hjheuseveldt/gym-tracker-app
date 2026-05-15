import { useState, useRef, useEffect, useLayoutEffect } from "react";
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
  bg: "#FAF9F6",
  green: "#4CC774",
  gd: "#3AB860",
  gl: "#E8F9EE",
  gm: "#A8E6BC",
  text: "#1A2922",
  muted: "#526B60",
  border: "#D5E9DF",
  white: "#FFFFFF",
  red: "#F2E8E8",
  redT: "#9B4545",
};
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
  "#4FA8E0",
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
var AN = ["1 Ripple", "2 Sparks", "3 Confetti", "4 Starburst", "5 Bloom"];
var G = ["#4CC774", "#3AB860", "#A8E6BC", "#ffffff", "#B8F0CE", "#2EA653"];

function dk(d) {
  return d.toISOString().split("T")[0];
}
function today() {
  return dk(new Date());
}
function todayLocal() {
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
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

function aRipple(ctx, cx, cy, f) {
  var rings = [
    { s: 0, sp: 1.1, dc: 0.018, lw: 3, rgb: "76,199,116" },
    { s: 12, sp: 0.9, dc: 0.014, lw: 2, rgb: "58,184,96" },
    { s: 26, sp: 0.7, dc: 0.011, lw: 1.4, rgb: "168,230,188" },
  ];
  var alive = false;
  rings.forEach(function (r) {
    var ff = f - r.s;
    if (ff < 0) return;
    var a = Math.max(0, 1 - ff * r.dc);
    if (a <= 0) return;
    alive = true;
    ctx.beginPath();
    ctx.arc(cx, cy, ff * r.sp, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(" + r.rgb + "," + a + ")";
    ctx.lineWidth = r.lw;
    ctx.stroke();
  });
  return alive;
}
function aSparks(ctx, cx, cy, f, pts) {
  if (f === 0) {
    for (var i = 0; i < 38; i++) {
      var a = (i / 38) * Math.PI * 2 + (Math.random() - 0.5) * 0.15,
        sp = 0.8 + Math.random() * 1.5;
      pts.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        len: 7 + Math.random() * 11,
        al: 1,
        dc: 0.007 + Math.random() * 0.005,
        col: G[Math.floor(Math.random() * G.length)],
        lw: 1.3 + Math.random() * 1.2,
      });
    }
  }
  var alive = false;
  pts.forEach(function (p) {
    if (p.al <= 0) return;
    alive = true;
    var a = Math.atan2(p.vy, p.vx);
    ctx.save();
    ctx.globalAlpha = p.al;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - Math.cos(a) * p.len, p.y - Math.sin(a) * p.len);
    ctx.strokeStyle = p.col;
    ctx.lineWidth = p.lw;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.982;
    p.vy *= 0.982;
    p.al -= p.dc;
  });
  return alive;
}
function aConfetti(ctx, cx, cy, f, pts) {
  if (f === 0) {
    for (var i = 0; i < 50; i++) {
      var a = (i / 50) * Math.PI * 2 + (Math.random() - 0.5) * 0.22,
        sp = 0.6 + Math.random() * 1.2;
      pts.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r: 2 + Math.random() * 2.5,
        al: 1,
        dc: 0.005 + Math.random() * 0.004,
        gv: 0.016 + Math.random() * 0.012,
        col: G[Math.floor(Math.random() * G.length)],
      });
    }
  }
  var alive = false;
  pts.forEach(function (p) {
    if (p.al <= 0) return;
    alive = true;
    ctx.save();
    ctx.globalAlpha = p.al;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.col;
    ctx.fill();
    ctx.restore();
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gv;
    p.vx *= 0.99;
    p.al -= p.dc;
  });
  return alive;
}
function aStarburst(ctx, cx, cy, f) {
  var t = Math.min(f / 100, 1);
  if (t >= 1) return false;
  var al = t < 0.4 ? t / 0.4 : 1 - (t - 0.4) / 0.6;
  for (var i = 0; i < 8; i++) {
    var a = (i / 8) * Math.PI * 2,
      r = 30 * Math.sin(t * Math.PI * 0.9),
      tx = cx + Math.cos(a) * r,
      ty = cy + Math.sin(a) * r,
      w = (3 + 2 * Math.sin(t * Math.PI)) * (1 - t * 0.5);
    ctx.save();
    ctx.globalAlpha = al * 0.92;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = i % 2 === 0 ? "#4CC774" : "#A8E6BC";
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(tx, ty, w * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
  }
  return true;
}
function aBloom(ctx, cx, cy, f) {
  var t = Math.min(f / 120, 1);
  if (t >= 1) return false;
  var oR = 4 + 50 * Math.pow(t, 0.5),
    oA = t < 0.25 ? t / 0.25 : Math.pow(1 - (t - 0.25) / 0.75, 1.6);
  var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, oR);
  g.addColorStop(0, "rgba(76,199,116," + oA * 0.55 + ")");
  g.addColorStop(0.5, "rgba(76,199,116," + oA * 0.28 + ")");
  g.addColorStop(1, "rgba(76,199,116,0)");
  ctx.beginPath();
  ctx.arc(cx, cy, oR, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  return true;
}

function AnimCanvas(props) {
  var ref = useRef(null);
  useEffect(
    function () {
      var cv = ref.current;
      if (!cv) return;
      if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        props.onDone();
        return;
      }
      var ctx = cv.getContext("2d"),
        f = 0,
        raf,
        pts = [];
      function tick() {
        ctx.clearRect(0, 0, 390, 900);
        var alive = false;
        var at = props.animType;
        if (at === 1) alive = aRipple(ctx, props.ox, props.oy, f);
        else if (at === 2) alive = aSparks(ctx, props.ox, props.oy, f, pts);
        else if (at === 3) alive = aConfetti(ctx, props.ox, props.oy, f, pts);
        else if (at === 4) alive = aStarburst(ctx, props.ox, props.oy, f);
        else alive = aBloom(ctx, props.ox, props.oy, f);
        f++;
        if (alive) raf = requestAnimationFrame(tick);
        else props.onDone();
      }
      raf = requestAnimationFrame(tick);
      return function () {
        cancelAnimationFrame(raf);
      };
    },
    []
  );
  return (
    <canvas
      ref={ref}
      width={390}
      height={900}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 50 }}
    />
  );
}

function BarChart(props) {
  var data = props.data,
    mx = Math.max.apply(
      null,
      data.map(function (d) {
        return d.val;
      })
    ) || 1,
    h = props.height || 80;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: h }}>
      {data.map(function (d, i) {
        var pct = d.val / mx;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 600 }}>{d.val > 0 ? d.val : ""}</div>
            <div
              style={{
                width: "100%",
                borderRadius: "4px 4px 0 0",
                background: d.val > 0 ? C.green : C.border,
                height: Math.max(pct * (h - 18), d.val > 0 ? 3 : 1),
                transition: "height 0.5s",
              }}
            />
            <div style={{ fontSize: 8, color: C.muted, textAlign: "center" }}>{d.label}</div>
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
      gr.addColorStop(0, "rgba(76,199,116,0.25)");
      gr.addColorStop(1, "rgba(76,199,116,0)");
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
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.stroke();
      pts.forEach(function (p, i) {
        ctx.beginPath();
        ctx.arc(px(i), py(p.val), 3, 0, Math.PI * 2);
        ctx.fillStyle = C.white;
        ctx.fill();
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.fillStyle = C.muted;
      ctx.font = "10px sans-serif";
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
    sS = useState(init.sets || {});
  var bw = bS[0],
    setBw = bS[1],
    selM = mS[0],
    setSelM = mS[1],
    sets = sS[0],
    setSets = sS[1];
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
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(45,59,46,0.45)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
      <div style={{ background: C.bg, borderRadius: "28px 28px 0 0", padding: "24px 20px 48px", width: "100%", maxHeight: "88%", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 4 }}>Workout Log</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>How did {dayLabel} go?</div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Bodyweight (lbs)</div>
          <input
            type="number"
            value={bw}
            onChange={function (e) {
              setBw(e.target.value);
            }}
            placeholder="e.g. 183.5"
            step="0.5"
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1.5px solid " + C.border,
              borderRadius: 12,
              fontSize: 16,
              fontFamily: "'DM Sans',sans-serif",
              color: C.text,
              background: C.white,
              outline: "none",
            }}
          />
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
                    background: a ? C.green : C.white,
                    border: "1.5px solid " + (a ? C.green : C.border),
                    color: a ? C.white : C.text,
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
                  <div key={m} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.white, borderRadius: 12, padding: "10px 14px", border: "1.5px solid " + C.border }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        onClick={function () {
                          adj(m, -1);
                        }}
                        style={{ width: 32, height: 32, borderRadius: "50%", background: C.border, border: "none", fontSize: 18, cursor: "pointer", color: C.text }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: 18, fontWeight: 700, color: C.text, minWidth: 24, textAlign: "center" }}>{sets[m] || 0}</span>
                      <button
                        onClick={function () {
                          adj(m, 1);
                        }}
                        style={{ width: 32, height: 32, borderRadius: "50%", background: C.green, border: "none", fontSize: 18, cursor: "pointer", color: C.white }}
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
          onClick={function () {
            if (!bw.trim()) return;
            var s = {};
            muscles.forEach(function (m) {
              if (sets[m] > 0) s[m] = sets[m];
            });
            props.onSave({ bodyweight: parseFloat(bw), muscles: muscles, sets: s });
          }}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: 18,
            background: bw.trim() ? "linear-gradient(135deg," + C.green + "," + C.gd + ")" : C.border,
            border: "none",
            color: bw.trim() ? C.white : C.muted,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            marginBottom: 12,
          }}
        >
          Save Workout
        </button>
        <button onClick={props.onSkip} style={{ width: "100%", padding: "12px", borderRadius: 18, background: "none", border: "none", color: C.muted, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

function WkDetail(props) {
  var log = props.log,
    k = props.dateKey;
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(45,59,46,0.45)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
      <div style={{ background: C.bg, borderRadius: "28px 28px 0 0", padding: "24px 20px 48px", width: "100%", maxHeight: "75%", overflowY: "auto" }}>
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
        <div style={{ background: C.white, borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: "1.5px solid " + C.border }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Bodyweight</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>{log.bodyweight} lbs</div>
        </div>
        {log.muscles && log.muscles.length > 0 && (
          <div style={{ background: C.white, borderRadius: 14, padding: "12px 14px", border: "1.5px solid " + C.border }}>
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
                      <div style={{ height: "100%", width: Math.min(s / 20, 1) * 100 + "%", background: C.green, borderRadius: 99 }} />
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
      <button type="button" className="gt-focus-ring" onClick={() => props.onBack()} style={{ background: "none", border: "none", color: C.green, fontSize: 15, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", padding: "8px 0" }}>
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
        var col = cc(cyc.color || "#4CC774");
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.white, borderRadius: 14, padding: "10px 14px", marginBottom: 12 }}>
        <button
          type="button"
          className="gt-focus-ring"
          aria-label="Previous month"
          onClick={function () {
            cm === 0 ? (props.setCM(11), props.setCY(function (y) { return y - 1; })) : props.setCM(function (m) { return m - 1; });
          }}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.green, padding: "4px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}
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
          style={{ background: "none", border: "none", cursor: "pointer", color: C.green, padding: "4px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <IconChevronCal dir="right" />
        </button>
      </div>
      <div style={{ background: C.white, borderRadius: 18, padding: 14 }}>
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
            var col = cyc ? cc(cyc.color || "#4CC774") : null;
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
                  border: isT && !isDone ? "2px solid " + C.green : col && !isDone ? "2px solid " + col.border : "2px solid transparent",
                  opacity: isFut ? 0.28 : !sched ? 0.22 : 1,
                  position: "relative",
                  cursor: !cantUse ? "pointer" : "default",
                  transition: "background 0.2s",
                  padding: 0,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{ fontSize: 12, color: isDone ? C.white : C.text, fontWeight: isT ? 700 : 400 }}>{day}</span>
                {isDone && (
                  <span style={{ position: "absolute", bottom: 4, display: "flex", lineHeight: 0 }}>
                    <CalDayDoneCheck color={C.white} size={11} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 12, background: C.white, borderRadius: 14, padding: "12px 16px", display: "flex", justifyContent: "space-around" }}>
        {[
          { val: mDone, label: "This month" },
          { val: props.getStreak(h.id), label: "Streak" },
          { val: props.getRate(h.id) + "%", label: "All-time" },
        ].map(function (s, i) {
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.green, fontFamily: "'DM Serif Display',serif" }}>{s.val}</div>
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
    comp = props.comp;
  var rS = useState("1M");
  var range = rS[0],
    setRange = rS[1];
  var tk = today(),
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
  var latBw = bwPts.length ? bwPts[bwPts.length - 1].val : null,
    fstBw = bwPts.length > 1 ? bwPts[0].val : null;
  var bwChg = latBw && fstBw ? latBw - fstBw : null;
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
        <div style={{ margin: "0 16px", background: C.white, borderRadius: 14, padding: "18px", textAlign: "center", border: "1.5px solid " + C.border }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>No gym habit yet</div>
          <div style={{ fontSize: 12, color: C.muted }}>Add a habit using the Gym (dumbbell) icon to start tracking workouts.</div>
        </div>
      )}
      {gym && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { Icon: IFlame, val: gStr + " days", label: "Streak" },
              { Icon: IconKpiWorkout, val: allK.length, label: "Sessions" },
            ].map(function (s, i) {
              var GCardI = s.Icon;
              return (
                <div key={i} style={{ flex: 1, background: C.white, borderRadius: 14, padding: "12px", border: "1.5px solid " + C.border, textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", lineHeight: 0 }}>
                    <GCardI size={20} color={C.green} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginTop: 3 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{s.label}</div>
                </div>
              );
            })}
            <div style={{ flex: 1, background: C.white, borderRadius: 14, padding: "12px", border: "1.5px solid " + C.border, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", lineHeight: 0 }}>
                <IconUiScale size={20} color={C.green} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginTop: 3 }}>{latBw ? latBw + "lb" : "\u2013"}</div>
              {bwChg !== null && (
                <div style={{ fontSize: 10, color: bwChg < 0 ? C.green : C.redT, fontWeight: 600 }}>
                  {bwChg > 0 ? "+" : ""}
                  {bwChg.toFixed(1)} lb
                </div>
              )}
            </div>
          </div>
          <div style={{ background: C.white, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Weekly Volume</div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: C.green }} />
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
                <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{twS}</span>
                {lwS2 > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: twS >= lwS2 ? C.green : C.redT }}>{twS >= lwS2 ? "^" : "v"}{Math.abs(twS - lwS2)}</span>}
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
                        <span style={{ fontSize: 12, fontWeight: 700, color: tw > 0 ? C.green : C.muted }}>{tw > 0 ? tw : "\u2013"}</span>
                      </div>
                    </div>
                    <div style={{ position: "relative", height: 4, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: (lw / mx) * 100 + "%", background: C.gm, borderRadius: 99 }} />
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: (tw / mx) * 100 + "%", background: C.green, borderRadius: 99, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: C.white, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border }}>
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
                      style={{ padding: "3px 9px", borderRadius: 20, background: range === r ? C.green : C.border, border: "none", color: range === r ? C.white : C.muted, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
            {bwPts.length >= 2 ? <BwChart points={bwPts} /> : <div style={{ textAlign: "center", padding: "16px 0", color: C.muted, fontSize: 13 }}>Log 2+ sessions to see trend.</div>}
          </div>
          <div style={{ background: C.white, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Sets per Muscle - This Week</div>
            <BarChart
              data={MG.map(function (m) {
                return { label: m.slice(0, 3), val: wkM[m] || 0 };
              })}
              height={76}
            />
          </div>
          <div style={{ background: C.white, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Sets per Muscle - This Month</div>
            <BarChart
              data={MG.map(function (m) {
                return { label: m.slice(0, 3), val: moM[m] || 0 };
              })}
              height={76}
            />
          </div>
          <div style={{ background: C.white, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Recent Sessions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {allK
                .slice(-5)
                .reverse()
                .map(function (k) {
                  var l = wl[k],
                    p = k.split("-");
                  return (
                    <div key={k} style={{ display: "flex", gap: 10, alignItems: "center", paddingBottom: 7, borderBottom: "1px solid " + C.border }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: C.gl, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: C.gd, textTransform: "uppercase" }}>{MN[+p[1] - 1].slice(0, 3)}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.gd }}>{parseInt(p[2])}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{l.muscles ? l.muscles.join(", ") : "\u2013"}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {l.sets ? Object.values(l.sets).reduce(function (a, b) { return a + b; }, 0) : 0} sets - {l.bodyweight}lb
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
        <button onClick={openNew} style={{ width: 40, height: 40, borderRadius: "50%", background: C.green, border: "none", color: C.white, fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(76,199,116,0.4)", lineHeight: 1, fontWeight: 300 }}>
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px", background: C.white, borderRadius: 20, border: "1.5px dashed " + C.border }}>
            <div style={{ marginBottom: 10, display: "flex", justifyContent: "center", lineHeight: 0 }}>
              <IconUiChartTrend size={40} color={C.green} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>No cycles yet</div>
            <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 18 }}>Track bulk, cut, or recomp phases.</div>
            <button onClick={openNew} style={{ padding: "11px 24px", borderRadius: 99, background: "linear-gradient(135deg," + C.green + "," + C.gd + ")", border: "none", color: C.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              Add first cycle
            </button>
          </div>
        )}
        {cycles.map(function (cyc) {
          var col = cc(cyc.color || PAL[0]);
          var isA = tk >= cyc.start && tk <= cyc.end,
            isP = tk > cyc.end;
          return (
            <div key={cyc.id} style={{ background: C.white, borderRadius: 18, border: "1.5px solid " + (isA ? col.border : C.border), overflow: "hidden" }}>
              <div style={{ height: 4, background: col.bar, opacity: isP ? 0.4 : 1 }} />
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{cyc.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: col.bar, background: col.bg, border: "1px solid " + col.border, borderRadius: 99, padding: "1px 7px" }}>{cyc.type}</span>
                      {isA && <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.gl, border: "1px solid " + C.gm, borderRadius: 99, padding: "1px 7px" }}>Active</span>}
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
        <div style={{ position: "absolute", inset: 0, background: "rgba(45,59,46,0.4)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
          <div onClick={function (e) { e.stopPropagation(); }} style={{ background: C.bg, borderRadius: "28px 28px 0 0", padding: "22px 20px 48px", width: "100%", maxHeight: "92%", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 14px" }} />
            <div style={{ fontSize: 19, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 16 }}>{ed ? "Edit Cycle" : "New Cycle"}</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Name</div>
              <input value={fn} onChange={(e) => setFn(e.target.value)} placeholder="e.g. Winter Bulk 2026" style={{ width: "100%", padding: "11px 13px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.white, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Type</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {CT.map(function (t) {
                  var a = ft === t;
                  return (
                    <button key={t} onClick={() => setFt(t)} style={{ padding: "5px 12px", borderRadius: 20, background: a ? C.green : "transparent", border: "1.5px solid " + (a ? C.green : C.border), color: a ? C.white : C.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Color</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                {PAL.map(function (hex) {
                  var a = fco === hex;
                  return <button key={hex} type="button" onClick={() => setFco(hex)} style={{ width: 30, height: 30, borderRadius: "50%", background: hex, border: a ? "3px solid " + C.text : "3px solid transparent", cursor: "pointer", boxShadow: a ? "0 0 0 2px " + C.white + ",0 0 0 4px " + hex : "none" }} aria-label={hex} />;
                })}
                <div style={{ position: "relative", width: 30, height: 30 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)", border: "2px solid " + C.border, cursor: "pointer" }} />
                  <input type="color" value={fco} onChange={(e) => setFco(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", borderRadius: "50%" }} />
                </div>
              </div>
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: fco }} />
                <span style={{ fontSize: 11, color: C.muted }}>{fco}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Start</div>
                <input type="date" value={fs} onChange={(e) => setFs(e.target.value)} style={{ width: "100%", padding: "10px 9px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.white, outline: "none" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>End</div>
                <input type="date" value={fe} onChange={(e) => setFe(e.target.value)} style={{ width: "100%", padding: "10px 9px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.white, outline: "none" }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Daily Calories</div>
              <input type="number" value={fca} onChange={(e) => setFca(e.target.value)} placeholder="e.g. 3200" style={{ width: "100%", padding: "11px 13px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.white, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Supplements</div>
              <textarea value={fsu} onChange={(e) => setFsu(e.target.value)} placeholder="e.g. Creatine 5g, Whey 2x" rows={2} style={{ width: "100%", padding: "11px 13px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.white, outline: "none", resize: "none" }} />
            </div>
            <button onClick={save} style={{ width: "100%", padding: "14px", borderRadius: 16, background: fn.trim() && fs && fe ? "linear-gradient(135deg," + C.green + "," + C.gd + ")" : C.border, border: "none", color: fn.trim() && fs && fe ? C.white : C.muted, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
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
            <div key={h.id} style={{ background: C.white, borderRadius: 18, border: "1.5px solid " + C.border, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.gl, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <HabitIcon id={h.icon} size={24} color={C.green} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                  {DL.filter(function (_, idx) {
                    return h.scheduledDays.includes(idx);
                  }).join(" ")}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <button onClick={() => moveUp(i)} style={{ width: 24, height: 20, borderRadius: 5, background: i === 0 ? C.border : C.gl, border: "none", color: i === 0 ? C.muted : C.gd, fontSize: 11, cursor: i === 0 ? "default" : "pointer" }}>
                  ^
                </button>
                <button onClick={() => moveDown(i)} style={{ width: 24, height: 20, borderRadius: 5, background: i === habits.length - 1 ? C.border : C.gl, border: "none", color: i === habits.length - 1 ? C.muted : C.gd, fontSize: 11, cursor: i === habits.length - 1 ? "default" : "pointer" }}>
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
        <div style={{ position: "absolute", inset: 0, background: "rgba(45,59,46,0.4)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, borderRadius: "28px 28px 0 0", padding: "22px 20px 48px", width: "100%", maxHeight: "88%", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 14px" }} />
            <div style={{ fontSize: 19, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 16 }}>Edit Habit</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Icon</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {HABIT_ICON_ORDER.map(function (hid) {
                  return (
                    <button key={hid} type="button" onClick={() => setIconEdit(hid)} style={{ width: 40, height: 40, borderRadius: 11, background: iconEdit === hid ? C.gl : C.white, border: "2px solid " + (iconEdit === hid ? C.green : C.border), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <HabitIcon id={hid} size={22} color={iconEdit === hid ? C.green : C.muted} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Name</div>
              <input value={fn} onChange={(e) => setFn(e.target.value)} style={{ width: "100%", padding: "12px 13px", border: "1.5px solid " + C.border, borderRadius: 11, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.white, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Schedule</div>
              <div style={{ display: "flex", gap: 4 }}>
                {DL.map(function (label, i) {
                  var a = fd2.includes(i);
                  return (
                    <button key={i} type="button" onClick={() => togD(i)} style={{ flex: 1, height: 36, borderRadius: 9, background: a ? C.green : C.white, border: "1.5px solid " + (a ? C.green : C.border), color: a ? C.white : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={save} style={{ width: "100%", padding: "14px", borderRadius: 16, background: fn.trim() && fd2.length ? "linear-gradient(135deg," + C.green + "," + C.gd + ")" : C.border, border: "none", color: fn.trim() && fd2.length ? C.white : C.muted, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
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
  if (s >= 85) return "#4CC774";
  if (s >= 70) return "#E5B53C";
  return "#E05050";
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
  if (hrs <= 2) return "#4CC774";
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
  if (s >= 70 && s < 85) return "#3D2F00";
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
  var circ = 2 * Math.PI * r;
  var score = props.score;
  var pct = score != null ? Math.max(0, Math.min(100, score)) / 100 : 0;
  var col = scoreColor(score);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"}
          style={{ transition: "stroke-dashoffset 0.7s ease, stroke 0.4s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 44, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>
          {score != null ? score : "\u2013"}
        </div>
        <div style={{ fontSize: 10, color: col, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 5 }}>
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
        var col = scoreColor(val);
        var pct = val != null ? Math.max(0, Math.min(100, val)) / 100 : 0;
        return (
          <div key={item.k} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 52, background: C.bg, borderRadius: 6, position: "relative", overflow: "hidden", border: "1px solid " + C.border }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: pct * 100 + "%", background: col, transition: "height 0.6s ease, background 0.4s ease" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: val != null && pct > 0.55 ? C.white : C.text, transition: "color 0.4s" }}>
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
          <stop offset="0%" stopColor={C.green} stopOpacity={0.32} />
          <stop offset="100%" stopColor={C.green} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#spark-gr)" />
      <path d={pathD} stroke={C.green} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
    <div style={{ background: C.white, borderRadius: 14, padding: 12, border: "1.5px solid " + C.border }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={function () { props.onMonthChange(-1); }} style={{ background: "none", border: "none", fontSize: 18, color: C.green, cursor: "pointer", padding: 2 }}>{"<"}</button>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 15, color: C.text, fontWeight: 600 }}>
          {MN[month]} {year}
        </div>
        <button onClick={function () { props.onMonthChange(1); }} style={{ background: "none", border: "none", fontSize: 18, color: C.green, cursor: "pointer", padding: 2 }}>{">"}</button>
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
          var col = hasScore ? scoreColor(data.score) : null;
          var txt = hasScore ? scoreTextOn(data.score) : C.text;
          var isSel = k === selected;
          var isT = k === todayKey;
          var isFut = k > todayKey;
          var border = isSel
            ? "2.5px solid " + C.text
            : hasScore
            ? "1.5px solid transparent"
            : "1.5px solid " + C.border;
          var shadow = isT && !isSel ? "inset 0 0 0 2px " + C.green : "none";
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
                background: hasScore ? col : "transparent",
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
  { k: "deep_sleep_duration", label: "Deep", color: "#3D4F7A" },
  { k: "rem_sleep_duration", label: "REM", color: "#9060E0" },
  { k: "light_sleep_duration", label: "Light", color: "#6DD994" },
  { k: "awake_time", label: "Awake", color: "#E07840" },
];

function SleepDayDetail(props) {
  var day = props.day,
    data = props.data;
  if (!data) {
    return (
      <div style={{ background: C.white, borderRadius: 14, padding: "18px 14px", border: "1.5px dashed " + C.border, textAlign: "center" }}>
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
    <div style={{ background: C.white, borderRadius: 14, padding: "14px", border: "1.5px solid " + C.border, display: "flex", flexDirection: "column", gap: 12 }}>
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
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'DM Serif Display',serif", color: scoreColor(data.score), lineHeight: 1 }}>{data.score}</div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>score</div>
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
          onClick={fetchData}
          disabled={loading}
          aria-label="Refresh from Oura"
          style={{ width: 36, height: 36, borderRadius: "50%", background: loading ? C.border : C.gl, border: "none", color: C.green, fontSize: 17, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
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
          <ScoreRing score={current ? current.score : null} size={140} />
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
        <div style={{ background: C.white, borderRadius: 11, padding: "8px 6px", border: "1.5px solid " + C.border }}>
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

function AddFoodSheet(props) {
  var food = props.food;
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
      setQty(1);
    },
    [food && food.food_id]
  );
  function bump(d) {
    var v = +(qty + d).toFixed(2);
    if (v < 0.25) v = 0.25;
    setQty(v);
  }
  if (!portalHost) return null;
  var p = parseFsDesc(food.food_description) || { serving: "serving", calories: 0, fat: null, carbs: null, protein: null };
  return createPortal(
    <div
      onClick={props.onCancel}
      role="presentation"
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(45,59,46,0.42)",
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
          background: C.bg,
          width: "100%",
          maxWidth: "min(336px, 100%)",
          borderRadius: 20,
          padding: "16px 16px 18px",
          animation: "slideUp 0.24s cubic-bezier(0.34,1.56,0.64,1) both",
          fontFamily: "'DM Sans',sans-serif",
          maxHeight: "calc(100% - 24px)",
          overflowY: "auto",
          boxShadow: "0 16px 36px rgba(45,59,46,0.18)",
          border: "1.5px solid " + C.border,
          flexShrink: 0,
        }}
      >
        <div id="add-food-sheet-title" style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1.25 }}>{food.food_name}</div>
        {food.brand_name && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{food.brand_name}</div>}
        <div style={{ marginTop: 10, padding: "9px 12px", background: C.white, borderRadius: 12, border: "1px solid " + C.border, fontSize: 11, color: C.muted }}>
          Per <span style={{ color: C.text, fontWeight: 600 }}>{p.serving}</span> {"\u00B7"} <span style={{ color: C.text, fontWeight: 600 }}>{Math.round(p.calories)} cal</span>
          {p.protein != null && <span> {"\u00B7"} P {p.protein}g</span>}
          {p.carbs != null && <span> {"\u00B7"} C {p.carbs}g</span>}
          {p.fat != null && <span> {"\u00B7"} F {p.fat}g</span>}
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.55, marginTop: 14, marginBottom: 6 }}>Servings</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={function () { bump(-0.5); }} style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid " + C.border, background: C.white, fontSize: 18, fontWeight: 700, color: C.text, cursor: "pointer" }}>{"\u2212"}</button>
          <input
            type="number"
            step="0.25"
            min="0.25"
            value={qty}
            onChange={function (e) {
              var v = +e.target.value;
              if (isNaN(v) || v < 0) v = 0;
              setQty(v);
            }}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: "1.5px solid " + C.border, fontSize: 17, fontWeight: 700, textAlign: "center", color: C.text, outline: "none", fontFamily: "'DM Sans',sans-serif", background: C.white }}
          />
          <button onClick={function () { bump(0.5); }} style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid " + C.border, background: C.white, fontSize: 18, fontWeight: 700, color: C.text, cursor: "pointer" }}>+</button>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 8, textAlign: "center" }}>
          = <span style={{ color: C.text, fontWeight: 700 }}>{Math.round(p.calories * qty)} cal</span>
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 17 }}>
          <button onClick={props.onCancel} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid " + C.border, background: C.white, fontSize: 13, fontWeight: 700, color: C.muted, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
          <button
            onClick={function () { props.onConfirm(qty); }}
            disabled={!qty}
            style={{ flex: 1.4, padding: "11px", borderRadius: 12, border: "none", background: "linear-gradient(135deg," + C.green + "," + C.gd + ")", color: C.white, fontSize: 13, fontWeight: 700, cursor: qty ? "pointer" : "default", opacity: qty ? 1 : 0.6, fontFamily: "'DM Sans',sans-serif", boxShadow: "0 5px 14px rgba(76,199,116,0.28)" }}
          >
            Add to log
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
        background: C.white,
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
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 99, background: rel === "Today" ? C.green : C.gl, color: rel === "Today" ? C.white : C.gd, letterSpacing: 0.4 }}>
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
        background: C.white,
        borderRadius: 18,
        padding: 14,
        paddingTop: 18,
        border: "1.5px solid " + C.border,
        boxShadow: "0 8px 22px rgba(45,59,46,0.10)",
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
          style={{ width: 32, height: 32, borderRadius: 10, background: "transparent", border: "none", color: C.green, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
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
          style={{ width: 32, height: 32, borderRadius: 10, background: "transparent", border: "none", color: C.green, fontSize: 18, cursor: nextMonthDisabled ? "default" : "pointer", opacity: nextMonthDisabled ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
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
          if (!isSel && isT) border = "2px solid " + C.green;
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
                background: isSel ? "linear-gradient(135deg," + C.green + "," + C.gd + ")" : hasLog && !isT ? C.gl : "transparent",
                color: isSel ? C.white : C.text,
                cursor: isFut ? "default" : "pointer",
                opacity: isFut ? 0.28 : 1,
                fontSize: 13,
                fontWeight: isSel || isT ? 700 : 600,
                position: "relative",
                fontFamily: "'DM Sans',sans-serif",
                padding: 0,
                boxShadow: isSel ? "0 4px 12px rgba(76,199,116,0.4)" : "none",
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
                    background: isSel ? C.white : C.gd,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      {date !== tk && (
        <button
          onClick={function () { props.onSelect(tk); }}
          style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 12, background: C.gl, color: C.gd, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.2 }}
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
        fetch("/api/fatsecret/proxy?method=foods.search&max_results=10&search_expression=" + encodeURIComponent(trimmed))
          .then(function (r) {
            return r.json().then(function (data) {
              if (!r.ok) throw new Error((data && data.error) || "Search failed (" + r.status + ")");
              return data;
            });
          })
          .then(function (data) {
            if (aborted) return;
            var foods = data && data.foods && data.foods.food;
            if (!foods) {
              setResults([]);
            } else {
              if (!Array.isArray(foods)) foods = [foods];
              setResults(foods);
            }
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
    var mul = function (n) { return n == null ? null : Math.round(n * servings * 10) / 10; };
    var row = {
      log_date: selDate,
      food_id: String(food.food_id),
      food_name: food.food_name,
      brand_name: food.brand_name || null,
      serving_description: p.serving,
      servings: servings,
      calories: mul(p.calories) || 0,
      protein: mul(p.protein),
      carbs: mul(p.carbs),
      fat: mul(p.fat),
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
          background: "linear-gradient(135deg," + C.green + "," + C.gd + ")",
          borderRadius: 24,
          color: C.white,
          boxShadow: "0 8px 24px rgba(76,199,116,0.25)",
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
        <input
          value={q}
          onChange={function (e) { setQ(e.target.value); }}
          placeholder="Search food (e.g. chicken breast)"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1.5px solid " + C.border,
            background: C.white,
            fontSize: 14,
            fontFamily: "'DM Sans',sans-serif",
            color: C.text,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {(q.trim() || searching) && (
          <div style={{ marginTop: 8, background: C.white, borderRadius: 14, border: "1.5px solid " + C.border, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
            {searching && <div style={{ padding: "12px 14px", fontSize: 13, color: C.muted }}>Searching{"\u2026"}</div>}
            {!searching && results.length === 0 && q.trim() && <div style={{ padding: "12px 14px", fontSize: 13, color: C.muted }}>No results.</div>}
            {results.map(function (f, i) {
              var p = parseFsDesc(f.food_description) || { calories: 0, serving: "" };
              return (
                <button
                  key={f.food_id}
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
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      {Math.round(p.calories)} cal {"\u00B7"} per {p.serving || "serving"}
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
          <div style={{ padding: "28px 20px", background: C.white, borderRadius: 16, border: "1.5px dashed " + C.border, textAlign: "center" }}>
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", lineHeight: 0 }}>
              <IconUiBowl size={36} color={C.green} />
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>{emptyLbl}</div>
          </div>
        )}
        {entries.map(function (e) {
          return (
            <div
              key={e.id}
              style={{
                background: C.white,
                borderRadius: 14,
                padding: "12px 14px",
                border: "1px solid " + C.border,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
                animation: "slideUp 0.22s ease both",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {e.food_name}
                  {e.brand_name && <span style={{ color: C.muted, fontWeight: 500 }}> {"\u00B7"} {e.brand_name}</span>}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  {e.servings} {"\u00D7"} {e.serving_description || "serving"} {"\u00B7"} <span style={{ color: C.text, fontWeight: 600 }}>{Math.round(Number(e.calories) || 0)} cal</span>
                </div>
              </div>
              <button
                onClick={function () { delEntry(e.id); }}
                aria-label="Remove"
                style={{ width: 30, height: 30, borderRadius: 10, background: C.bg, border: "1px solid " + C.border, cursor: "pointer", color: C.muted, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
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
          <button onClick={function () { setError(null); }} style={{ background: "transparent", border: "none", color: C.redT, fontSize: 14, cursor: "pointer", padding: 0 }}>{"\u00D7"}</button>
        </div>
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
  var settleMs = props.settleMs || 500;
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

  var cpS = useState(midBlock * L);
  var centerPos = cpS[0],
    setCenterPos = cpS[1];

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
    setCenterPos(pos);
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
      supressUntilRef.current = Date.now() + 80;
      recompute();
    } else if (idx >= totalLen - L) {
      c.scrollLeft -= midBlock * L * w;
      supressUntilRef.current = Date.now() + 80;
      recompute();
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
      if (Date.now() < supressUntilRef.current) return;
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(function () {
        rafRef.current = null;
        recompute();
      });
      if (teleTimerRef.current) clearTimeout(teleTimerRef.current);
      teleTimerRef.current = setTimeout(maybeTeleport, 160);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(fireSettle, settleMs);
    }
    c.addEventListener("scroll", onScroll, { passive: true });
    return function () {
      c.removeEventListener("scroll", onScroll);
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
        var isCenter = dist < 0.5;
        var opacity = isCenter ? 1 : Math.max(0.32, 1 - t * 0.65);
        var TabIcon = item.tab.Icon;
        return (
          <button
            type="button"
            className="gt-focus-ring"
            key={item.key}
            onClick={function () { onSelect(item.tab.id); }}
            style={{
              flexShrink: 0,
              scrollSnapAlign: "center",
              scrollSnapStop: "normal",
              width: 78,
              height: 68,
              padding: "10px 6px",
              background: isCenter ? C.green : "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              borderRadius: 18,
              opacity: opacity,
              transition: "background 0.18s ease, opacity 0.12s ease",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            <div style={{ transform: "scale(1.35)", lineHeight: 0 }}>
              <TabIcon color={isCenter ? C.white : C.muted} />
            </div>
            <span style={{ fontSize: 11, fontWeight: isCenter ? 700 : 600, color: isCenter ? C.white : C.muted, whiteSpace: "nowrap" }}>{item.tab.label}</span>
          </button>
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
function cellColorForLayer(layer, k, ctx) {
  if (layer === "sleep") {
    var s = ctx.sleep[k];
    if (!s || s.score == null) return null;
    if (s.score >= 85) return "rgba(76,199,116,0.58)";
    if (s.score >= 75) return "rgba(108,217,148,0.44)";
    if (s.score >= 65) return "rgba(229,181,60,0.38)";
    return "rgba(224,80,80,0.32)";
  }
  if (layer === "workouts") {
    var sets = setsTotalOn(ctx.wl, k);
    if (sets === 0) return null;
    if (sets >= 20) return "rgba(76,199,116,0.66)";
    if (sets >= 12) return "rgba(108,217,148,0.50)";
    if (sets >= 6) return "rgba(168,230,188,0.65)";
    return "rgba(232,249,238,0.95)";
  }
  if (layer === "habits") {
    var hd = habitsDoneOn(ctx.habits, ctx.comp, k);
    if (hd.total === 0) return null;
    var p = hd.pct;
    if (p === 1) return "rgba(76,199,116,0.62)";
    if (p >= 0.66) return "rgba(108,217,148,0.46)";
    if (p >= 0.33) return "rgba(168,230,188,0.55)";
    if (p > 0) return "rgba(232,249,238,0.95)";
    return null;
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
  sleep: ["rgba(224,80,80,0.32)", "rgba(229,181,60,0.38)", "rgba(108,217,148,0.44)", "rgba(76,199,116,0.58)"],
  workouts: ["rgba(232,249,238,0.95)", "rgba(168,230,188,0.65)", "rgba(108,217,148,0.50)", "rgba(76,199,116,0.66)"],
  habits: ["rgba(232,249,238,0.95)", "rgba(168,230,188,0.55)", "rgba(108,217,148,0.46)", "rgba(76,199,116,0.62)"],
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
  var layS = useState("sleep");
  var layer = layS[0],
    setLayer = layS[1];
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
  var habitPctSum = 0,
    habitPctDays = 0,
    perfectCount = 0;
  for (var di = 1; di <= days; di++) {
    var dKey = ck(di);
    if (dKey > tk) break;
    var hd0 = habitsDoneOn(habits, comp, dKey);
    if (hd0.total > 0) {
      habitPctSum += hd0.pct;
      habitPctDays++;
    }
    if (isPerfectDay(habits, comp, sleep, dKey, tk)) perfectCount++;
  }
  var habitPct = habitPctDays ? Math.round((habitPctSum / habitPctDays) * 100) : null;

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
    { id: "habits", label: "Habits", Icon: IconKpiHabit },
  ];

  var kpis = [
    { val: monthWorkouts, label: "Workouts", Icon: IconKpiWorkout },
    { val: avgSleep != null ? avgSleep : "\u2013", label: "Avg sleep", Icon: IconKpiSleep },
    { val: habitPct != null ? habitPct + "%" : "\u2013", label: "Habits", Icon: IconKpiHabit },
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
            <div key={i} style={{ background: C.white, borderRadius: 14, padding: "10px 6px", border: "1.5px solid " + C.border, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", lineHeight: 0 }}>
                <KpiI size={17} color={C.green} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginTop: 6, lineHeight: 1 }}>{k2.val}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 3, letterSpacing: 0.3 }}>{k2.label}</div>
            </div>
          );
        })}
      </div>

      {visibleCycs.length > 0 && (
        <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          {visibleCycs.map(function (cyc) {
            var col = cc(cyc.color || PAL[0]);
            var isA = tk >= cyc.start && tk <= cyc.end;
            return (
              <div key={cyc.id} style={{ background: col.bg, border: "1.5px solid " + col.border, borderRadius: 12, padding: "7px 11px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.bar, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: col.text, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cyc.name}</span>
                    <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 500 }}>{"\u00B7 " + cyc.type}</span>
                    {isA && <span style={{ fontSize: 8, fontWeight: 700, color: C.green, background: C.gl, border: "1px solid " + C.gm, borderRadius: 99, padding: "1px 6px" }}>Active</span>}
                  </div>
                  <div style={{ fontSize: 10, color: col.text, opacity: 0.7 }}>
                    {fmtDS(cyc.start)} {"\u2192"} {fmtDS(cyc.end)}{cyc.calories ? " \u00B7 " + cyc.calories + " kcal" : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ margin: "0 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.white, borderRadius: 14, padding: "8px 8px", border: "1.5px solid " + C.border }}>
        <button
          type="button"
          className="gt-focus-ring"
          aria-label="Previous month"
          onClick={function () { changeMonth(-1); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.green, padding: "4px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}
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
          style={{ background: "none", border: "none", cursor: "pointer", color: C.green, padding: "4px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}
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
                background: active ? C.green : C.white,
                border: "1.5px solid " + (active ? C.green : C.border),
                color: active ? C.white : C.muted,
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
                <LayI size={15} color={active ? C.white : C.muted} />
              </span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ margin: "0 14px", background: C.white, borderRadius: 18, padding: 14, border: "1.5px solid " + C.border }}>
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
            var tint = cycleTintFor(cycles, k);
            var perfect = !isFut && isPerfectDay(habits, comp, sleep, k, tk);
            var hasWk = !!wl[k];
            var hasSl = !!(sleep[k] && sleep[k].score != null);
            var hdInner = habitsDoneOn(habits, comp, k);
            var hasHa = hdInner.total > 0 && hdInner.done > 0;
            var ringBorder = isT
              ? "2px solid " + C.green
              : perfect
              ? "2px solid #E5B53C"
              : heat
              ? "1px solid rgba(45,59,46,0.06)"
              : "1.5px solid " + C.border;
            return (
              <div
                key={i}
                onClick={function () {
                  setSelDay(k);
                }}
                style={{
                  aspectRatio: "1",
                  background: tint || "transparent",
                  borderRadius: 12,
                  position: "relative",
                  cursor: "pointer",
                  opacity: isFut ? 0.42 : 1,
                  transition: "transform 0.12s ease",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 3,
                    borderRadius: "50%",
                    background: heat || "transparent",
                    border: ringBorder,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: perfect ? "0 0 0 1px rgba(229,181,60,0.30), 0 2px 8px rgba(229,181,60,0.35)" : "none",
                    transition: "background 0.3s ease, border-color 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: isT ? 700 : 500, color: C.text }}>{day}</span>
                </div>
                {!isFut && (hasWk || hasSl || hasHa) && (
                  <div style={{ position: "absolute", bottom: 2, left: 0, right: 0, display: "flex", gap: 2, justifyContent: "center", pointerEvents: "none" }}>
                    {hasWk && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#4FA8E0" }} />}
                    {hasSl && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#9060E0" }} />}
                    {hasHa && <div style={{ width: 3, height: 3, borderRadius: "50%", background: C.green }} />}
                  </div>
                )}
                {perfect && (
                  <div style={{ position: "absolute", top: 0, right: 1, lineHeight: 0, pointerEvents: "none" }}>
                    <IconKpiStar size={11} color="#E5B53C" />
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
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4FA8E0" }} />
              wk
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#9060E0" }} />
              sleep
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
              habits
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

  var dayLabel = k === tk ? "Today" : new Date(k + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div
      style={{ position: "absolute", inset: 0, background: "rgba(45,59,46,0.45)", display: "flex", alignItems: "flex-end", zIndex: 200, animation: "fadeIn 0.18s ease both" }}
      onClick={props.onClose}
    >
      <div
        onClick={function (e) {
          e.stopPropagation();
        }}
        style={{ background: C.bg, borderRadius: "28px 28px 0 0", padding: "20px 18px 44px", width: "100%", maxHeight: "85%", overflowY: "auto", animation: "slideUp 0.24s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{dayLabel}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>{fmtDS(k)}</div>
            {perfect && (
              <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "linear-gradient(135deg,#FFD27A,#E5B53C)", color: "#3D2F00", fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>
                <IconKpiStar size={12} color="#3D2F00" />
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

        <div style={{ background: C.white, borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: "1.5px solid " + C.border }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Sleep</div>
            <span style={{ display: "flex", lineHeight: 0 }}>
              <IconKpiSleep size={20} color={C.green} />
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

        <div style={{ background: C.white, borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: "1.5px solid " + C.border }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Workout</div>
            <span style={{ display: "flex", lineHeight: 0 }}>
              <IconKpiWorkout size={20} color={C.green} />
            </span>
          </div>
          {l ? (
            <div>
              <div style={{ display: "flex", gap: 18, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Bodyweight</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>
                    {l.bodyweight}
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}> lb</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Total sets</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.green, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>{totalSets}</div>
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
                          <div style={{ height: "100%", width: Math.min(sm / 20, 1) * 100 + "%", background: C.green, borderRadius: 99 }} />
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

        <div style={{ background: C.white, borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: "1.5px solid " + C.border }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Habits {hd.total > 0 ? "(" + hd.done + "/" + hd.total + ")" : ""}
            </div>
            <span style={{ display: "flex", lineHeight: 0 }}>
              <IconKpiHabit size={20} color={C.green} />
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
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: done ? C.green : "transparent", border: done ? "none" : "2px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {done && (
                        <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                          <path d="M4 10.5L8.5 15L16 6" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
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

        <div style={{ background: C.white, borderRadius: 14, padding: "12px 14px", border: "1.5px solid " + C.border }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Calories</div>
            <span style={{ display: "flex", lineHeight: 0 }}>
              <IFlame size={20} color={C.green} />
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
                  <span style={{ fontSize: 10, color: calTotal <= cyc.calories ? C.green : C.redT, fontWeight: 700, marginLeft: "auto" }}>
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
        return { d: k, muscles: logs[k].muscles, sets: logs[k].sets, bw: logs[k].bodyweight };
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
            color: hl.loading ? C.muted : C.green,
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
          <div style={{ background: C.white, border: "1.5px dashed " + C.border, borderRadius: 14, padding: "14px 14px", textAlign: "center" }}>
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
                ? { bg: "#E8F9EE", bd: "#A8E6BC", fg: "#2C7142" }
                : c2.kind === "fix"
                ? { bg: "#FCE9E9", bd: "#F2C4C4", fg: "#9A4040" }
                : { bg: "#FFF5E1", bd: "#F2DDA8", fg: "#7A5A0F" };
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
            <button onClick={clearChat} style={{ background: "none", border: "none", fontSize: 11, color: C.muted, cursor: "pointer", padding: 0 }}>
              Clear
            </button>
          )}
        </div>

        <div ref={chatScrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "2px 14px 6px" }}>
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
                    background: isUser ? C.green : C.white,
                    color: isUser ? C.white : C.text,
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

        <div style={{ flexShrink: 0, padding: "0 14px 96px" }}>
          {!streaming && msgs.length < 6 && (
            <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 6 }} className="tabstrip">
              {quickPrompts.map(function (qp, i) {
                return (
                  <button
                    key={i}
                    onClick={function () { sendMessage(qp); }}
                    style={{
                      flexShrink: 0,
                      background: C.white,
                      border: "1.5px solid " + C.border,
                      borderRadius: 99,
                      padding: "5px 11px",
                      fontSize: 11,
                      color: C.muted,
                      cursor: "pointer",
                      fontFamily: "'DM Sans',sans-serif",
                      whiteSpace: "nowrap",
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
            <textarea
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
              style={{
                flex: 1,
                resize: "none",
                padding: "10px 12px",
                border: "1.5px solid " + C.border,
                borderRadius: 18,
                fontSize: 13,
                fontFamily: "'DM Sans',sans-serif",
                color: C.text,
                background: C.white,
                outline: "none",
                maxHeight: 80,
                lineHeight: 1.4,
              }}
            />
            <button
              onClick={function () { sendMessage(inp); }}
              disabled={!inp.trim() || streaming}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: inp.trim() && !streaming ? C.green : C.border,
                border: "none",
                color: inp.trim() && !streaming ? C.white : C.muted,
                fontSize: 16,
                cursor: inp.trim() && !streaming ? "pointer" : "default",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: inp.trim() && !streaming ? "0 4px 12px rgba(76,199,116,0.4)" : "none",
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
  var h4b = useState(null);
  var tabSwipeAnim = h4b[0],
    setTabSwipeAnim = h4b[1];
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
  var h14 = useState([]);
  var anims = h14[0],
    setAnims = h14[1];
  var h15 = useState(1);
  var animT = h15[0],
    setAnimT = h15[1];
  var h16 = useState(false);
  var showAP = h16[0],
    setShowAP = h16[1];
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
  var h23 = useState(tk);
  var selDay = h23[0],
    setSelDay = h23[1];
  var phoneRef = useRef(null),
    scrollRef = useRef(null),
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
  function switchTab(id, swipeDir) {
    if (swipeDir === 1 || swipeDir === -1) {
      setTabSwipeAnim(swipeDir);
    } else {
      setTabSwipeAnim(null);
    }
    setTab(id);
    setSelHabit(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }

  swipeNavRef.current.tab = tab;
  swipeNavRef.current.blocked = !!(tabsExp || showAdd || pendGym);
  swipeNavRef.current.go = switchTab;

  useEffect(
    function () {
      if (!booted) return;
      var el = scrollRef.current;
      if (!el) return;
      var sx = 0,
        sy = 0,
        st = 0,
        armed = false;
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
        st = Date.now();
        armed = true;
      }
      function onEnd(e) {
        if (!armed) return;
        armed = false;
        var r = swipeNavRef.current;
        if (r.blocked) return;
        var touch = e.changedTouches[0];
        if (!touch) return;
        var dx = touch.clientX - sx;
        var dy = touch.clientY - sy;
        if (Date.now() - st > 850) return;
        if (Math.abs(dx) < 64) return;
        if (Math.abs(dx) < Math.abs(dy) * 1.25) return;
        var L = APP_NAV_TABS.length;
        var idx = APP_NAV_TABS.findIndex(function (x) {
          return x.id === r.tab;
        });
        if (idx < 0) return;
        var n = dx < 0 ? (idx + 1) % L : (idx - 1 + L) % L;
        r.go(APP_NAV_TABS[n].id, dx < 0 ? 1 : -1);
      }
      function onCancel() {
        armed = false;
      }
      el.addEventListener("touchstart", onStart, { passive: true });
      el.addEventListener("touchend", onEnd, { passive: true });
      el.addEventListener("touchcancel", onCancel, { passive: true });
      return function () {
        el.removeEventListener("touchstart", onStart);
        el.removeEventListener("touchend", onEnd);
        el.removeEventListener("touchcancel", onCancel);
      };
    },
    [booted]
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
      if (btn && phoneRef.current) {
        var br = btn.getBoundingClientRect(),
          pr = phoneRef.current.getBoundingClientRect();
        var ox = br.left + br.width / 2 - pr.left,
          oy = br.top + br.height / 2 - pr.top;
        setAnims(function (a) {
          return a.concat([{ id: Date.now() + Math.random(), ox: ox, oy: oy }]);
        });
      }
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
      }, 3050);
      var hab = habits.find(function (h) {
        return h.id === id;
      });
      if (hab && hab.icon === ICON_GYM) {
        var capturedDay = k;
        setTimeout(function () {
          setPendGym({ id: id, day: capturedDay });
        }, 2900);
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
        <style>{"body{background:#dce8de;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media (max-width:480px),(display-mode:standalone){body{background:" + C.bg + ";display:block;min-height:100vh;}}@keyframes pulseDot{0%,100%{opacity:0.35;transform:scale(0.9)}50%{opacity:1;transform:scale(1.1)}}"}</style>
        <div style={{ width: compact ? "100vw" : 390, height: compact ? "100dvh" : 844, background: C.bg, borderRadius: compact ? 0 : 48, overflow: "hidden", boxShadow: compact ? "none" : "0 30px 80px rgba(0,0,0,0.22),0 0 0 10px #1a1a1a,0 0 0 12px #2a2a2a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", color: C.text }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }} aria-hidden="true">
            <IconDumbbellMark size={52} color={C.green} />
          </div>
          <div style={{ fontSize: 14, color: C.muted, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>GymTrack</div>
          <div style={{ marginTop: 18, display: "flex", gap: 6 }}>
            {[0, 1, 2].map(function (i) {
              return (
                <div
                  key={i}
                  className="boot-pulse"
                  style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, animation: "pulseDot 1.1s ease-in-out infinite", animationDelay: i * 0.15 + "s" }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>
        {
          "@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}body{background:#dce8de;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media (max-width:480px),(display-mode:standalone){body{background:" + C.bg + ";display:block;min-height:100vh;}}@keyframes checkPop{0%{transform:scale(0.3);opacity:0}45%{transform:scale(1.35)}65%{transform:scale(0.88)}82%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes gtTabInFromRight{from{opacity:0.86;transform:translate3d(22px,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}@keyframes gtTabInFromLeft{from{opacity:0.86;transform:translate3d(-22px,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}@keyframes cardGlow{0%{box-shadow:0 2px 10px rgba(45,59,46,0.06)}40%{box-shadow:0 0 0 4px rgba(76,199,116,0.25)}100%{box-shadow:0 2px 16px rgba(76,199,116,0.18)}}@media (prefers-reduced-motion:reduce){.gt-tab-swipe-pane{animation:none!important}}.hab{animation:slideUp 0.32s ease both;}.hab:nth-child(1){animation-delay:0.04s}.hab:nth-child(2){animation-delay:0.08s}.hab:nth-child(3){animation-delay:0.12s}.hab:nth-child(4){animation-delay:0.16s}.hab:nth-child(5){animation-delay:0.20s}.chk{transition:transform 0.15s ease;}.chk:active{transform:scale(0.82)!important;}.tb{transition:all 0.2s ease;}.glow{animation:cardGlow 1.0s ease forwards;}.tabstrip::-webkit-scrollbar{display:none;}.tabstrip{scrollbar-width:none;-ms-overflow-style:none;}"
        }
      </style>
      <div
        ref={phoneRef}
        style={{
          width: compact ? "100vw" : 390,
          height: compact ? "100dvh" : 844,
          background: C.bg,
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
        {anims.map(function (a) {
          return (
            <AnimCanvas
              key={a.id}
              ox={a.ox}
              oy={a.oy}
              animType={animT}
              onDone={function () {
                setAnims(function (x) {
                  return x.filter(function (v) {
                    return v.id !== a.id;
                  });
                });
              }}
            />
          );
        })}
        {pendGym && (
          <GymQ
            day={pendGym.day || tk}
            initial={logs[pendGym.day || tk]}
            onSave={function (data) {
              var d = (pendGym && pendGym.day) || tk;
              setLogs(function (p) {
                var n = Object.assign({}, p);
                n[d] = data;
                return n;
              });
              D.fireAndForget(D.upsertWorkoutLog(d, data), "gymq-save");
              setPendGym(null);
            }}
            onSkip={function () {
              setPendGym(null);
            }}
          />
        )}
        {!compact && (
          <div style={{ height: 50, background: C.bg, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 28px 8px", position: "relative", zIndex: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>9:41</span>
            <div style={{ width: 120, height: 32, background: "#1a1a1a", borderRadius: 20, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 0 }} />
            <div style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 11, color: C.text }}>
              <span>{"\u2026"}</span>
              <span>WiFi</span>
              <span>100%</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", position: "relative", zIndex: 1 }}>
          <div
            key={tab}
            className="gt-tab-swipe-pane"
            style={{
              minHeight: "100%",
              animation:
                tabSwipeAnim === 1
                  ? "gtTabInFromRight 0.36s cubic-bezier(0.22, 1, 0.36, 1) both"
                  : tabSwipeAnim === -1
                  ? "gtTabInFromLeft 0.355s cubic-bezier(0.22, 1, 0.36, 1) both"
                  : undefined,
            }}
          >
          {tab === "home" && !selHabit && (
            <div style={{ paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px 4px" }}>
                <div ref={dayStripRef} className="tabstrip summary-strip" style={{ flex: 1, display: "flex", gap: 5, overflowX: "auto", scrollSnapType: "x mandatory", padding: "4px 2px" }}>
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
                          border: isSel ? "1.5px solid " + C.green : isT ? "1.5px solid " + C.gm : "1.5px solid " + C.border,
                          background: isSel ? C.green : C.white,
                          color: isSel ? C.white : C.text,
                          cursor: "pointer",
                          fontFamily: "'DM Sans',sans-serif",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                          boxShadow: isSel ? "0 4px 12px rgba(76,199,116,0.35)" : "none",
                          transition: "background 0.18s ease,border-color 0.18s ease",
                        }}
                      >
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", opacity: 0.75 }}>{DL[dow]}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>{d.getDate()}</span>
                        <span style={{ height: 5, marginTop: 1, display: "flex", alignItems: "center" }}>
                          {hasAny && <span style={{ width: 5, height: 5, borderRadius: "50%", background: isSel ? C.white : (isPerfect ? C.green : C.gm) }} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="gt-focus-ring"
                  onClick={function () { if (dateInputRef.current) { try { dateInputRef.current.showPicker(); } catch (e) { dateInputRef.current.click(); } } }}
                  style={{ flex: "0 0 auto", width: 36, height: 36, borderRadius: 11, background: C.white, border: "1.5px solid " + C.border, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}
                  aria-label="Pick a date"
                >
                  <ICal color={C.text} />
                </button>
                <input
                  ref={dateInputRef}
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
                  <button type="button" className="gt-focus-ring" onClick={function () { selectDay(tk); scrollStripToEnd(); }} style={{ padding: "5px 11px", borderRadius: 99, background: C.gl, border: "1.5px solid " + C.gm, color: C.gd, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    Jump to today
                  </button>
                )}
              </div>
              {habits.length > 0 && (
                <div style={{ padding: "0 22px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{selIsToday ? "Today\u2019s Progress" : "Progress"}</span>
                    <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>
                      {selDoneC}/{selH.length}
                    </span>
                  </div>
                  <div style={{ height: 5, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: selPct + "%", background: "linear-gradient(90deg," + C.gd + "," + C.green + ")", borderRadius: 99, transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
                  </div>
                </div>
              )}
              {habits.length > 0 && (
                <div style={{ padding: "0 14px 12px" }}>
                  <button onClick={() => setShowAP((p) => !p)} type="button" className="gt-focus-ring tb" style={{ width: "100%", padding: "8px 12px", background: C.white, border: "1.5px solid " + C.border, borderRadius: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted }}>
                    <span>
                      Animation: <strong style={{ color: C.green }}>{AN[animT - 1]}</strong>
                    </span>
                    <span>{showAP ? "^" : "v"}</span>
                  </button>
                  {showAP && (
                    <div style={{ marginTop: 5, background: C.white, borderRadius: 12, border: "1.5px solid " + C.border, overflow: "hidden" }}>
                      {AN.map(function (name, i) {
                        return (
                          <button
                            type="button"
                            className="gt-focus-ring"
                            key={i}
                            onClick={function () {
                              setAnimT(i + 1);
                              setShowAP(false);
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              background: animT === i + 1 ? C.gl : "transparent",
                              border: "none",
                              borderBottom: i < 4 ? "1px solid " + C.border : "none",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "'DM Sans',sans-serif",
                              fontSize: 13,
                              color: animT === i + 1 ? C.gd : C.text,
                              fontWeight: animT === i + 1 ? 700 : 400,
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                            }}
                          >
                            {animT === i + 1 && <span style={{ color: C.green }}>v</span>}
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {selH.length === 0 && habits.length === 0 && (
                <div style={{ margin: "16px 14px 0", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px", background: C.white, borderRadius: 22, border: "1.5px dashed " + C.border }}>
                  <div style={{ marginBottom: 14, display: "flex", justifyContent: "center", lineHeight: 0 }} aria-hidden="true">
                    <IconSprout size={52} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 6, textAlign: "center" }}>No habits yet</div>
                  <div style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>Tap + to add your first habit.</div>
                  <button type="button" className="gt-focus-ring" onClick={() => setShowAdd(true)} style={{ padding: "11px 24px", borderRadius: 99, background: "linear-gradient(135deg," + C.green + "," + C.gd + ")", border: "none", color: C.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    Add your first habit
                  </button>
                </div>
              )}
              {selH.length === 0 && habits.length > 0 && (
                <div style={{ margin: "10px 14px 0", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px", background: C.white, borderRadius: 18, border: "1.5px dashed " + C.border }}>
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
                    pop = justChk[habit.id];
                  return (
                    <div key={habit.id} className={"hab" + (pop ? " glow" : "")} style={{ background: done ? C.gl : C.white, borderRadius: 18, padding: "14px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: done ? "0 2px 14px rgba(76,199,116,0.16)" : "0 2px 9px rgba(45,59,46,0.05)", border: "1.5px solid " + (done ? C.gm : C.border), transition: "background 0.4s ease,border-color 0.4s ease" }}>
                      <button type="button" aria-pressed={done} aria-label={(done ? "Unmark " : "Mark ") + habit.name + " for " + selDay} className="chk gt-focus-ring" onClick={function (e) { toggleHabit(habit.id, e.currentTarget); }} style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, border: done ? "none" : "2px solid " + C.border, background: done ? C.green : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: done ? "0 4px 12px rgba(76,199,116,0.45)" : "none", transition: "all 0.32s cubic-bezier(0.34,1.56,0.64,1)" }}>
                        {done && (
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: pop ? "checkPop 0.8s cubic-bezier(0.34,1.56,0.64,1) both" : "none" }}>
                            <path d="M4 10.5L8.5 15L16 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
                          background: done ? C.white : C.gl,
                          border: "1.5px solid " + (done ? C.gm : C.border),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          lineHeight: 1,
                          boxShadow: done ? "0 1px 4px rgba(45,59,46,0.06)" : "none",
                        }}
                      >
                        <HabitIcon id={habit.icon} size={22} color={done ? C.gd : C.green} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: done ? C.gd : C.text, letterSpacing: 0.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{habit.name}</div>
                        <div style={{ marginTop: 7 }}>
                          <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                            {wd.map(function (d, i) {
                              var dow = d.getDay(),
                                k = dk(d),
                                sc = habit.scheduledDays.includes(dow),
                                dn = !!(comp[habit.id] && comp[habit.id][k]),
                                fut = k > tk,
                                ist = k === tk;
                              var bg = !sc ? C.border : dn ? C.green : ist ? C.gm : fut ? C.border : C.redT + "AA";
                              return <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: bg, opacity: !sc ? 0.3 : 1, transition: "background 0.4s" }} />;
                            })}
                          </div>
                          <div style={{ display: "flex", gap: 2 }}>
                            {DL.map(function (l, i) {
                              return (
                                <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 7, color: i === todayDOW ? C.green : C.muted, fontWeight: i === todayDOW ? 700 : 400 }}>
                                  {l}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 44 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: done ? C.gd : C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>{streak}</div>
                        <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>streak</div>
                        <div style={{ fontSize: 9, color: C.muted }}>
                          {wp.c}/{wp.t} wk
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selDoneC === selH.length && selH.length > 0 && (
                <div style={{ margin: "16px 14px 0", background: "linear-gradient(135deg," + C.green + "," + C.gd + ")", borderRadius: 18, padding: "16px 18px", textAlign: "center" }}>
                  <div style={{ marginBottom: 6, display: "flex", justifyContent: "center", lineHeight: 0 }} aria-hidden="true">
                    <IconSprout size={34} color={C.white} />
                  </div>
                  <div style={{ fontSize: 14, color: C.white, fontFamily: "'DM Serif Display',serif", lineHeight: 1.4 }}>
                    All done for {selIsToday ? "today" : selDate.toLocaleDateString("en-US", { weekday: "long" })}.
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.82)", marginTop: 3 }}>Every action is a vote for the person you want to become.</div>
                </div>
              )}
            </div>
          )}
          {tab === "calendar" && (
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
          {tab === "coach" && <CoachTab habits={habits} comp={comp} logs={logs} sleep={sleep} cycles={cycles} />}
          {tab === "gainz" && <GainzTab wl={logs} gym={gym} comp={comp} />}
          {tab === "cycles" && <CyclesTab cycles={cycles} setCycles={setCycles} />}
          {tab === "sleep" && <SleepTab sleep={sleep} setSleep={setSleep} />}
          {tab === "calories" && <CalorieTab portalRoot={phoneRef} />}
          {tab === "settings" && <SettingsTab habits={habits} setHabits={setHabits} />}
          </div>
        </div>
        <div aria-hidden style={{ height: 80, flexShrink: 0, background: C.bg }} />
        {tabsExp && (
          <div
            onClick={() => closePicker(true)}
            style={{ position: "absolute", inset: 0, background: "rgba(45,59,46,0.18)", zIndex: 9, animation: "fadeIn 0.18s ease both" }}
          />
        )}
        <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
          {!tabsExp ? (
            (function () {
              var curTab = APP_NAV_TABS.find(function (t) { return t.id === tab; }) || APP_NAV_TABS[0];
              var CurI = curTab.Icon;
              return (
                <button
                  type="button"
                  className="gt-focus-ring"
                  onClick={() => setTabsExp(true)}
                  style={{
                    pointerEvents: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    background: "linear-gradient(135deg," + C.green + "," + C.gd + ")",
                    border: "none",
                    borderRadius: 99,
                    padding: "12px 22px 12px 18px",
                    boxShadow: "0 8px 24px rgba(76,199,116,0.45),0 0 0 4px rgba(255,255,255,0.55)",
                    cursor: "pointer",
                    color: C.white,
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                  }}
                  aria-label="Open tab switcher"
                >
                  <CurI color={C.white} />
                  <span>{curTab.label}</span>
                </button>
              );
            })()
          ) : (
            <div
              style={{
                pointerEvents: "auto",
                width: 290,
                background: C.white,
                borderRadius: 32,
                padding: "8px 0",
                boxShadow: "0 14px 36px rgba(45,59,46,0.28)",
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
          <div style={{ position: "absolute", inset: 0, background: "rgba(45,59,46,0.35)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, borderRadius: "28px 28px 0 0", padding: "22px 20px 48px", width: "100%", maxHeight: "88%", overflowY: "auto" }}>
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
                        className="gt-focus-ring"
                        onClick={() => setNewIconId(hid)}
                        aria-label={"Icon " + hid}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 11,
                          background: newIconId === hid ? C.gl : C.white,
                          border: "2px solid " + (newIconId === hid ? C.green : C.border),
                          cursor: "pointer",
                          opacity: hid === ICON_GYM && gym ? 0.4 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <HabitIcon id={hid} size={22} color={newIconId === hid ? C.green : C.muted} />
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
                  style={{ width: "100%", padding: "12px 13px", border: "1.5px solid " + C.border, borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.white, outline: "none", boxSizing: "border-box" }}
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
                      <button key={i} type="button" className="gt-focus-ring" onClick={() => togNewDay(i)} aria-pressed={a} style={{ flex: 1, height: 36, borderRadius: 9, background: a ? C.green : C.white, border: "1.5px solid " + (a ? C.green : C.border), color: a ? C.white : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6, textAlign: "center" }}>
                  {newDays.length === 7 ? "Every day" : newDays.length === 0 ? "Pick at least one day" : newDays.map(function (d) { return DL[d]; }).join(", ")}
                </div>
              </div>
              <button type="button" className="gt-focus-ring" onClick={addHabit} style={{ width: "100%", padding: "14px", borderRadius: 16, background: newName.trim() && newDays.length && !(newIconId === ICON_GYM && gym) ? "linear-gradient(135deg," + C.green + "," + C.gd + ")" : C.border, border: "none", color: newName.trim() && newDays.length && !(newIconId === ICON_GYM && gym) ? C.white : C.muted, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                Add Habit
              </button>
              <button type="button" className="gt-focus-ring" onClick={() => setShowAdd(false)} style={{ width: "100%", padding: "11px", borderRadius: 16, background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
