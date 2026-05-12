import { useState, useRef, useEffect } from "react";

var C = {
  bg: "#FAF9F6",
  green: "#6DD994",
  gd: "#4CC774",
  gl: "#E8F9EE",
  gm: "#A8E6BC",
  text: "#2D3B2E",
  muted: "#7A8F7C",
  border: "#E2EDE4",
  white: "#FFFFFF",
  red: "#F2C4C4",
  redT: "#B85C5C",
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
var G = ["#6DD994", "#4CC774", "#A8E6BC", "#ffffff", "#B8F0CE", "#3AB860"];

function dk(d) {
  return d.toISOString().split("T")[0];
}
function today() {
  return dk(new Date());
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

var HABITS = [
  { id: 1, name: "Morning Walk", emoji: "\uD83D\uDEB6", scheduledDays: [0, 1, 2, 3, 4, 5, 6] },
  { id: 2, name: "Read 20 Pages", emoji: "\uD83D\uDCD6", scheduledDays: [1, 2, 3, 4, 5] },
  { id: 3, name: "Gym", emoji: "\uD83D\uDCAA", scheduledDays: [1, 2, 3, 4, 5] },
  { id: 4, name: "Meditate", emoji: "\uD83E\uDDD8", scheduledDays: [1, 3, 5] },
];
var CYCLES = [
  {
    id: 1,
    name: "Winter Bulk",
    type: "Bulk",
    color: "#4FA8E0",
    start: "2025-11-12",
    end: "2026-01-31",
    calories: 3400,
    supplements: "Creatine 5g, Whey 2x, Vitamin D",
  },
  {
    id: 2,
    name: "Spring Cut",
    type: "Cut",
    color: "#E05050",
    start: "2026-02-01",
    end: "2026-04-30",
    calories: 2300,
    supplements: "Creatine 5g, Whey 1x, Fish Oil, Caffeine",
  },
  {
    id: 3,
    name: "Summer Lean",
    type: "Maintain",
    color: "#40B870",
    start: "2026-05-01",
    end: "2026-07-31",
    calories: 2800,
    supplements: "Creatine 5g, Whey 1x, Vitamin D, Fish Oil",
  },
];

function genData() {
  function add(base, n) {
    var d = new Date(base);
    d.setDate(d.getDate() + n);
    return d;
  }
  var START = new Date("2025-11-12"),
    TODAY = new Date();
  var seed = 42;
  function rnd() {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 4294967295;
  }
  function p(x) {
    return rnd() < x;
  }
  function ri(a, b) {
    return a + Math.round(rnd() * (b - a));
  }
  function bw(k) {
    var t = (new Date(k) - START) / ((TODAY - START) || 1),
      base;
    if (t < 0.3) base = 191 + (t * (195 - 191)) / 0.3;
    else if (t < 0.55) base = 195 - (t - 0.3) * ((195 - 182) / 0.25);
    else base = 182 + (t - 0.55) * ((183.5 - 182) / 0.45);
    return Math.round((base + (rnd() - 0.5) * 0.8) * 2) / 2;
  }
  var SP = [
    { muscles: ["Chest", "Triceps", "Shoulders"], sets: { Chest: 15, Triceps: 9, Shoulders: 9 } },
    { muscles: ["Back", "Biceps"], sets: { Back: 15, Biceps: 12 } },
    { muscles: ["Legs", "Core"], sets: { Legs: 18, Core: 6 } },
    { muscles: ["Chest", "Triceps"], sets: { Chest: 12, Triceps: 9 } },
    { muscles: ["Back", "Biceps", "Core"], sets: { Back: 12, Biceps: 9, Core: 6 } },
    { muscles: ["Legs"], sets: { Legs: 20 } },
    { muscles: ["Shoulders", "Biceps", "Triceps"], sets: { Shoulders: 12, Biceps: 9, Triceps: 9 } },
    { muscles: ["Chest", "Back"], sets: { Chest: 12, Back: 12 } },
  ];
  var si = 0,
    comp = { 1: {}, 2: {}, 3: {}, 4: {} },
    logs = {};
  for (var i = 0; i < 180; i++) {
    var d = add(START, i),
      k = dk(d),
      dow = d.getDay();
    if (k > dk(TODAY)) break;
    if (p(dow === 0 || dow === 6 ? 0.78 : 0.88)) comp[1][k] = true;
    if (dow >= 1 && dow <= 5 && p(0.78)) comp[2][k] = true;
    if (dow >= 1 && dow <= 5) {
      var deload = Math.floor(i / 7) % 6 === 5;
      if (p(deload ? 0.2 : i < 30 ? 0.72 : i < 90 ? 0.82 : 0.88)) {
        comp[3][k] = true;
        var sp = SP[si % SP.length];
        si++;
        var s = {};
        Object.keys(sp.sets).forEach(function (m) {
          s[m] = sp.sets[m] + ri(-2, 3);
        });
        logs[k] = { bodyweight: bw(k), muscles: sp.muscles, sets: s };
      }
    }
    if ((dow === 1 || dow === 3 || dow === 5) && p(0.65)) comp[4][k] = true;
  }
  var t = dk(TODAY);
  [1, 2, 3, 4].forEach(function (id) {
    delete comp[id][t];
  });
  return { comp: comp, logs: logs };
}
var MD = genData();
var COMP = MD.comp,
  LOGS = MD.logs;

function aRipple(ctx, cx, cy, f) {
  var rings = [
    { s: 0, sp: 1.1, dc: 0.018, lw: 3, rgb: "109,217,148" },
    { s: 12, sp: 0.9, dc: 0.014, lw: 2, rgb: "76,199,116" },
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
    ctx.strokeStyle = i % 2 === 0 ? "#6DD994" : "#A8E6BC";
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
  g.addColorStop(0, "rgba(109,217,148," + oA * 0.55 + ")");
  g.addColorStop(0.5, "rgba(76,199,116," + oA * 0.28 + ")");
  g.addColorStop(1, "rgba(109,217,148,0)");
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

function IToday(props) {
  var c = props.color || C.muted;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" fill={c} stroke="none" />
      <line x1="12" y1="3" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="3" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21" y2="12" />
    </svg>
  );
}
function ICal(props) {
  var c = props.color || C.muted;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <rect x="7" y="13" width="3" height="3" rx="0.5" fill={c} stroke="none" />
      <rect x="14" y="13" width="3" height="3" rx="0.5" fill={c} stroke="none" />
    </svg>
  );
}
function IGainz(props) {
  var c = props.color || C.muted;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="10" width="2.5" height="4" rx="1" />
      <rect x="4.5" y="8" width="2" height="8" rx="1" />
      <line x1="6.5" y1="12" x2="17.5" y2="12" />
      <rect x="17.5" y="8" width="2" height="8" rx="1" />
      <rect x="19.5" y="10" width="2.5" height="4" rx="1" />
    </svg>
  );
}
function ICycles(props) {
  var c = props.color || C.muted;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,17 9,11 13,15 21,7" />
      <polyline points="16,7 21,7 21,12" />
    </svg>
  );
}
function ISettings(props) {
  var c = props.color || C.muted;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
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
      gr.addColorStop(0, "rgba(109,217,148,0.25)");
      gr.addColorStop(1, "rgba(109,217,148,0)");
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
  var bS = useState(""),
    mS = useState({}),
    sS = useState({});
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
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(45,59,46,0.45)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
      <div style={{ background: C.bg, borderRadius: "28px 28px 0 0", padding: "24px 20px 48px", width: "100%", maxHeight: "88%", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 4 }}>Workout Log</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>How did today go?</div>
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
  var isGym = h.emoji === "\uD83D\uDCAA";
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
    <div style={{ padding: "0 16px 100px", position: "relative" }}>
      {detK && wl[detK] && <WkDetail log={wl[detK]} dateKey={detK} onClose={() => setDetK(null)} />}
      <button onClick={() => props.onBack()} style={{ background: "none", border: "none", color: C.green, fontSize: 15, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", padding: "8px 0" }}>
        Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 14px" }}>
        <span style={{ fontSize: 32 }}>{h.emoji}</span>
        <div>
          <div style={{ fontSize: 21, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>{h.name}</div>
          <div style={{ fontSize: 12, color: C.muted }}>Tap days to toggle</div>
        </div>
      </div>
      {activeCycs.map(function (cyc) {
        var col = cc(cyc.color || "#6DD994");
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
          onClick={function () {
            cm === 0 ? (props.setCM(11), props.setCY(function (y) { return y - 1; })) : props.setCM(function (m) { return m - 1; });
          }}
          style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.green }}
        >
          {"<"}
        </button>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 17, color: C.text, fontWeight: 600 }}>
          {MN[cm]} {cy}
        </div>
        <button
          onClick={function () {
            cm === 11 ? (props.setCM(0), props.setCY(function (y) { return y + 1; })) : props.setCM(function (m) { return m + 1; });
          }}
          style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.green }}
        >
          {">"}
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
            var k = day ? ck(day) : null;
            var isDone = day && !!done[k],
              isT = day && k === tk,
              isFut = day && k > tk,
              sched = day && isSched(day);
            var hasLog = isGym && isDone && !!wl[k];
            var cyc = isGym && day ? cycleAt(cycles, k) : null;
            var col = cyc ? cc(cyc.color || "#6DD994") : null;
            var canTog = day && !isFut && sched;
            var capK = k,
              capLog = hasLog,
              capTog = canTog;
            return (
              <div
                key={i}
                onClick={function () {
                  if (!capTog) return;
                  if (capLog) {
                    setDetK(capK);
                    return;
                  }
                  props.onToggle(h.id, capK);
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
                  opacity: !day ? 0 : isFut ? 0.28 : !sched ? 0.22 : 1,
                  position: "relative",
                  cursor: canTog ? "pointer" : "default",
                  transition: "background 0.2s",
                }}
              >
                {day && <span style={{ fontSize: 12, color: isDone ? C.white : C.text, fontWeight: isT ? 700 : 400 }}>{day}</span>}
                {isDone && <span style={{ fontSize: 8, position: "absolute", bottom: 3, color: C.white }}>v</span>}
              </div>
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
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "16px 24px 14px" }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Gainz</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>Your Progress</div>
      </div>
      {!gym && (
        <div style={{ margin: "0 16px", background: C.white, borderRadius: 14, padding: "18px", textAlign: "center", border: "1.5px solid " + C.border }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>No gym habit yet</div>
          <div style={{ fontSize: 12, color: C.muted }}>Add a habit with the emoji to start tracking.</div>
        </div>
      )}
      {gym && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { icon: "\uD83D\uDD25", val: gStr + " days", label: "Streak" },
              { icon: "\uD83C\uDFCB", val: allK.length, label: "Sessions" },
            ].map(function (s, i) {
              return (
                <div key={i} style={{ flex: 1, background: C.white, borderRadius: 14, padding: "12px", border: "1.5px solid " + C.border, textAlign: "center" }}>
                  <div style={{ fontSize: 20 }}>{s.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginTop: 3 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{s.label}</div>
                </div>
              );
            })}
            <div style={{ flex: 1, background: C.white, borderRadius: 14, padding: "12px", border: "1.5px solid " + C.border, textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{"\u2696"}</div>
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
    setSf(false);
  }
  var tk = today(),
    active = cycleAt(cycles, tk);
  return (
    <div style={{ paddingBottom: 100, position: "relative" }}>
      <div style={{ padding: "16px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Cycles</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>My Cycles</div>
        </div>
        <button onClick={openNew} style={{ width: 40, height: 40, borderRadius: "50%", background: C.green, border: "none", color: C.white, fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(109,217,148,0.4)", lineHeight: 1, fontWeight: 300 }}>
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
            <div style={{ fontSize: 36, marginBottom: 10 }}>{"\uD83D\uDCC8"}</div>
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
                        setCycles(function (p) {
                          return p.filter(function (c) {
                            return c.id !== cyc.id;
                          });
                        });
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
    feS = useState("\u2B50"),
    fdS = useState([0, 1, 2, 3, 4, 5, 6]);
  var fn = fnS[0],
    setFn = fnS[1],
    fe = feS[0],
    setFe = feS[1],
    fd2 = fdS[0],
    setFd = fdS[1];
  function openEdit(h) {
    setEd(h.id);
    setFn(h.name);
    setFe(h.emoji);
    setFd(h.scheduledDays.slice());
  }
  function save() {
    if (!fn.trim() || !fd2.length) return;
    setHabits(function (p) {
      return p.map(function (h) {
        return h.id === ed ? Object.assign({}, h, { name: fn.trim(), emoji: fe, scheduledDays: fd2 }) : h;
      });
    });
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
      return n;
    });
  }
  var emojiPick = ["\u2B50", "\uD83C\uDFC3", "\uD83D\uDCD6", "\uD83D\uDCA7", "\uD83E\uDDD8", "\uD83D\uDCAA", "\uD83C\uDFAF", "\uD83C\uDF31", "\u270D", "\uD83C\uDFB8", "\uD83E\uDDE0", "\uD83C\uDF05", "\uD83E\uDD57", "\uD83D\uDECC", "\uD83D\uDEB4"];
  return (
    <div style={{ paddingBottom: 100, position: "relative" }}>
      <div style={{ padding: "16px 24px 18px" }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Settings</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>My Habits</div>
      </div>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {habits.length === 0 && <div style={{ textAlign: "center", padding: "36px 20px", color: C.muted, fontSize: 13 }}>No habits yet.</div>}
        {habits.map(function (h, i) {
          return (
            <div key={h.id} style={{ background: C.white, borderRadius: 18, border: "1.5px solid " + C.border, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.gl, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{h.emoji}</div>
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
                {emojiPick.map(function (em) {
                  return (
                    <button key={em} type="button" onClick={() => setFe(em)} style={{ width: 40, height: 40, borderRadius: 11, fontSize: 19, background: fe === em ? C.gl : C.white, border: "2px solid " + (fe === em ? C.green : C.border), cursor: "pointer" }}>
                      {em}
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
                setHabits(function (p) {
                  return p.filter(function (h) {
                    return h.id !== ed;
                  });
                });
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

export default function App() {
  var tk = today(),
    todayDOW = new Date().getDay(),
    wd = weekDates();
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
  var h10 = useState("\u2B50");
  var newEmoji = h10[0],
    setNewEmoji = h10[1];
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
  var phoneRef = useRef(null),
    scrollRef = useRef(null);
  var gym = habits.find(function (h) {
    return h.emoji === "\uD83D\uDCAA";
  });

  function isComp(id) {
    return !!(comp[id] && comp[id][tk]);
  }
  function switchTab(id) {
    setTab(id);
    setSelHabit(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }

  function toggleHabit(id, btn) {
    var was = comp[id] && comp[id][tk];
    setComp(function (p) {
      var n = Object.assign({}, p);
      n[id] = Object.assign({}, p[id] || {});
      n[id][tk] = !was;
      return n;
    });
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
      if (hab && hab.emoji === "\uD83D\uDCAA")
        setTimeout(function () {
          setPendGym(id);
        }, 2900);
    } else {
      setSortRdy(function (p) {
        var n = Object.assign({}, p);
        delete n[id];
        return n;
      });
    }
  }
  function toggleDate(hid, k) {
    setComp(function (p) {
      var n = Object.assign({}, p);
      n[hid] = Object.assign({}, p[hid] || {});
      if (n[hid][k]) delete n[hid][k];
      else n[hid][k] = true;
      return n;
    });
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
    if (newEmoji === "\uD83D\uDCAA" && gym) return;
    var id = Date.now();
    setHabits(function (p) {
      return p.concat([{ id: id, name: newName.trim(), emoji: newEmoji, scheduledDays: newDays }]);
    });
    setComp(function (p) {
      var n = Object.assign({}, p);
      n[id] = {};
      return n;
    });
    setNewName("");
    setNewEmoji("\u2B50");
    setNewDays([0, 1, 2, 3, 4, 5, 6]);
    setShowAdd(false);
  }

  var todayH = habits
    .filter(function (h) {
      return h.scheduledDays.includes(todayDOW);
    })
    .sort(function (a, b) {
      return (sortRdy[a.id] ? 1 : 0) - (sortRdy[b.id] ? 1 : 0);
    });
  var doneC = todayH.filter(function (h) {
    return isComp(h.id);
  }).length;
  var pct = todayH.length > 0 ? (doneC / todayH.length) * 100 : 0;
  var TABS = [
    { id: "home", label: "Today", Icon: IToday },
    { id: "calendar", label: "Calendar", Icon: ICal },
    { id: "gainz", label: "Gainz", Icon: IGainz },
    { id: "cycles", label: "Cycles", Icon: ICycles },
    { id: "settings", label: "Settings", Icon: ISettings },
  ];
  var newEmojiPick = ["\u2B50", "\uD83C\uDFC3", "\uD83D\uDCD6", "\uD83D\uDCA7", "\uD83E\uDDD8", "\uD83D\uDCAA", "\uD83C\uDFAF", "\uD83C\uDF31", "\u270D", "\uD83C\uDFB8", "\uD83E\uDDE0", "\uD83C\uDF05", "\uD83E\uDD57", "\uD83D\uDECC", "\uD83D\uDEB4"];

  return (
    <div>
      <style>
        {
          "@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}body{background:#dce8de;display:flex;justify-content:center;align-items:center;min-height:100vh;}@keyframes checkPop{0%{transform:scale(0.3);opacity:0}45%{transform:scale(1.35)}65%{transform:scale(0.88)}82%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes cardGlow{0%{box-shadow:0 2px 10px rgba(45,59,46,0.06)}40%{box-shadow:0 0 0 4px rgba(109,217,148,0.25)}100%{box-shadow:0 2px 16px rgba(109,217,148,0.18)}}.hab{animation:slideUp 0.32s ease both;}.hab:nth-child(1){animation-delay:0.04s}.hab:nth-child(2){animation-delay:0.08s}.hab:nth-child(3){animation-delay:0.12s}.hab:nth-child(4){animation-delay:0.16s}.hab:nth-child(5){animation-delay:0.20s}.chk{transition:transform 0.15s ease;}.chk:active{transform:scale(0.82)!important;}.tb{transition:all 0.2s ease;}.glow{animation:cardGlow 1.0s ease forwards;}"
        }
      </style>
      <div
        ref={phoneRef}
        style={{
          width: 390,
          height: 844,
          background: C.bg,
          borderRadius: 48,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.22),0 0 0 10px #1a1a1a,0 0 0 12px #2a2a2a",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Sans',sans-serif",
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
            onSave={function (data) {
              setLogs(function (p) {
                var n = Object.assign({}, p);
                n[tk] = data;
                return n;
              });
              setPendGym(null);
            }}
            onSkip={function () {
              setPendGym(null);
            }}
          />
        )}
        <div style={{ height: 50, background: C.bg, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 28px 8px", position: "relative", zIndex: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>9:41</span>
          <div style={{ width: 120, height: 32, background: "#1a1a1a", borderRadius: 20, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 0 }} />
          <div style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 11, color: C.text }}>
            <span>{"\u2026"}</span>
            <span>WiFi</span>
            <span>100%</span>
          </div>
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1 }}>
          {tab === "home" && !selHabit && (
            <div style={{ paddingBottom: 100 }}>
              <div style={{ padding: "14px 22px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>{new Date().toLocaleDateString("en-US", { weekday: "long" })}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1.1 }}>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}</div>
                </div>
                <button className="chk" onClick={() => setShowAdd(true)} style={{ width: 40, height: 40, borderRadius: "50%", background: C.green, border: "none", color: C.white, fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(109,217,148,0.4)", lineHeight: 1, fontWeight: 300 }}>
                  +
                </button>
              </div>
              {habits.length > 0 && (
                <div style={{ padding: "0 22px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Today&apos;s Progress</span>
                    <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>
                      {doneC}/{todayH.length}
                    </span>
                  </div>
                  <div style={{ height: 5, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg," + C.gd + "," + C.green + ")", borderRadius: 99, transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
                  </div>
                </div>
              )}
              {habits.length > 0 && (
                <div style={{ padding: "0 14px 12px" }}>
                  <button onClick={() => setShowAP((p) => !p)} style={{ width: "100%", padding: "8px 12px", background: C.white, border: "1.5px solid " + C.border, borderRadius: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted }}>
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
              {todayH.length === 0 && (
                <div style={{ margin: "16px 14px 0", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px", background: C.white, borderRadius: 22, border: "1.5px dashed " + C.border }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>{"\uD83C\uDF31"}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 6, textAlign: "center" }}>No habits yet</div>
                  <div style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>Tap + to add your first habit.</div>
                  <button onClick={() => setShowAdd(true)} style={{ padding: "11px 24px", borderRadius: 99, background: "linear-gradient(135deg," + C.green + "," + C.gd + ")", border: "none", color: C.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    Add your first habit
                  </button>
                </div>
              )}
              <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 9 }}>
                {todayH.map(function (habit) {
                  var done = isComp(habit.id),
                    streak = getStreak(habit.id),
                    wp = getWP(habit.id),
                    pop = justChk[habit.id];
                  return (
                    <div key={habit.id} className={"hab" + (pop ? " glow" : "")} style={{ background: done ? C.gl : C.white, borderRadius: 18, padding: "13px 14px", display: "flex", alignItems: "center", gap: 11, boxShadow: done ? "0 2px 14px rgba(109,217,148,0.16)" : "0 2px 9px rgba(45,59,46,0.05)", border: "1.5px solid " + (done ? C.gm : C.border), transition: "background 0.4s ease,border-color 0.4s ease" }}>
                      <button className="chk" onClick={function (e) { toggleHabit(habit.id, e.currentTarget); }} style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, border: done ? "none" : "2px solid " + C.border, background: done ? C.green : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: done ? "0 4px 12px rgba(109,217,148,0.45)" : "none", transition: "all 0.32s cubic-bezier(0.34,1.56,0.64,1)" }}>
                        {done && (
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: pop ? "checkPop 0.8s cubic-bezier(0.34,1.56,0.64,1) both" : "none" }}>
                            <path d="M4 10.5L8.5 15L16 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: done ? C.gd : C.text, display: "flex", alignItems: "center", gap: 5 }}>
                          <span>{habit.emoji}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{habit.name}</span>
                        </div>
                        <div style={{ marginTop: 7 }}>
                          <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                            {wd.map(function (d, i) {
                              var dow = d.getDay(),
                                k = dk(d),
                                sc = habit.scheduledDays.includes(dow),
                                dn = !!(comp[habit.id] && comp[habit.id][k]),
                                fut = k > tk,
                                ist = k === tk;
                              var bg = !sc ? C.border : dn ? C.green : ist ? C.gm : fut ? C.border : "#F2C4C4";
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
              {doneC === todayH.length && todayH.length > 0 && (
                <div style={{ margin: "16px 14px 0", background: "linear-gradient(135deg," + C.green + "," + C.gd + ")", borderRadius: 18, padding: "14px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{"\uD83C\uDF31"}</div>
                  <div style={{ fontSize: 14, color: C.white, fontFamily: "'DM Serif Display',serif", lineHeight: 1.4 }}>All done for today.</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.82)", marginTop: 3 }}>Every action is a vote for the person you want to become.</div>
                </div>
              )}
            </div>
          )}
          {tab === "calendar" && !selHabit && (
            <div style={{ padding: "14px 0 100px" }}>
              <div style={{ padding: "0 22px 14px" }}>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Calendar</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>My Habits</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "0 14px" }}>
                {habits.length === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px", background: C.white, borderRadius: 20, border: "1.5px dashed " + C.border }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>{"\uD83D\uDCC5"}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>No habits yet</div>
                    <div style={{ fontSize: 13, color: C.muted, textAlign: "center" }}>Add habits from the Today tab.</div>
                  </div>
                )}
                {habits.map(function (h, i) {
                  return (
                    <button
                      key={h.id}
                      className="hab"
                      onClick={function () {
                        setSelHabit(h);
                        setCalM(new Date().getMonth());
                        setCalY(new Date().getFullYear());
                      }}
                      style={{ background: C.white, borderRadius: 18, padding: "14px 16px", border: "1.5px solid " + C.border, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", width: "100%", animationDelay: i * 0.07 + "s" }}
                    >
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: C.gl, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{h.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{h.name}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          {DL.filter(function (_, idx) {
                            return h.scheduledDays.includes(idx);
                          }).join(" ")}{" "}
                          - {getStreak(h.id)} day streak
                        </div>
                      </div>
                      <span style={{ color: C.border, fontSize: 18 }}>{">"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {tab === "calendar" && selHabit && (
            <div style={{ padding: "14px 0" }}>
              <CalView habit={selHabit} comp={comp} calYear={calY} calMonth={calM} todayKey={tk} setCM={setCalM} setCY={setCalY} onBack={() => setSelHabit(null)} getStreak={getStreak} getRate={getRate} wl={logs} cycles={cycles} onToggle={toggleDate} />
            </div>
          )}
          {tab === "gainz" && <GainzTab wl={logs} gym={gym} comp={comp} />}
          {tab === "cycles" && <CyclesTab cycles={cycles} setCycles={setCycles} />}
          {tab === "settings" && <SettingsTab habits={habits} setHabits={setHabits} />}
        </div>
        <div style={{ position: "sticky", bottom: 0, background: C.white, borderTop: "1px solid " + C.border, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "7px 0 22px", zIndex: 10 }}>
          {TABS.map(function (t) {
            var a = tab === t.id;
            return (
              <button key={t.id} className="tb" onClick={() => switchTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transform: a ? "scale(1.06)" : "scale(1)", padding: "0 2px" }}>
                <t.Icon color={a ? C.green : C.muted} />
                <span style={{ fontSize: 9, fontWeight: a ? 700 : 500, color: a ? C.green : C.muted, fontFamily: "'DM Sans',sans-serif" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
        {showAdd && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(45,59,46,0.35)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, borderRadius: "28px 28px 0 0", padding: "22px 20px 48px", width: "100%", maxHeight: "88%", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 18px" }} />
              <div style={{ fontSize: 19, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif", marginBottom: 18 }}>New Habit</div>
              {gym && newEmoji === "\uD83D\uDCAA" && <div style={{ background: C.red, borderRadius: 9, padding: "7px 11px", marginBottom: 10, fontSize: 12, color: C.redT, fontWeight: 600 }}>You already have a gym habit.</div>}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>Icon</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {newEmojiPick.map(function (e) {
                    return (
                      <button key={e} type="button" onClick={() => setNewEmoji(e)} style={{ width: 40, height: 40, borderRadius: 11, fontSize: 19, background: newEmoji === e ? C.gl : C.white, border: "2px solid " + (newEmoji === e ? C.green : C.border), cursor: "pointer", opacity: e === "\uD83D\uDCAA" && gym ? 0.4 : 1 }}>
                        {e}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>Name</div>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addHabit(); }} placeholder="e.g. Journal for 5 minutes" style={{ width: "100%", padding: "12px 13px", border: "1.5px solid " + C.border, borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: C.text, background: C.white, outline: "none" }} />
              </div>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>Schedule</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {DL.map(function (label, i) {
                    var a = newDays.includes(i);
                    return (
                      <button key={i} type="button" onClick={() => togNewDay(i)} style={{ flex: 1, height: 36, borderRadius: 9, background: a ? C.green : C.white, border: "1.5px solid " + (a ? C.green : C.border), color: a ? C.white : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6, textAlign: "center" }}>
                  {newDays.length === 7 ? "Every day" : newDays.length === 0 ? "Pick at least one day" : newDays.map(function (d) { return DL[d]; }).join(", ")}
                </div>
              </div>
              <button onClick={addHabit} style={{ width: "100%", padding: "14px", borderRadius: 16, background: newName.trim() && newDays.length && !(newEmoji === "\uD83D\uDCAA" && gym) ? "linear-gradient(135deg," + C.green + "," + C.gd + ")" : C.border, border: "none", color: newName.trim() && newDays.length && !(newEmoji === "\uD83D\uDCAA" && gym) ? C.white : C.muted, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                Add Habit
              </button>
              <button onClick={() => setShowAdd(false)} style={{ width: "100%", padding: "11px", borderRadius: 16, background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
