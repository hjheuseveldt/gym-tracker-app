var DEF_PRI = "#4CC774";
var DEF = DEF_PRI;

export var ICON_GYM = "gym";

export var HABIT_ICON_ORDER = ["star", "run", "book", "water", "calm", "gym", "target", "plant", "write", "music", "mind", "dawn", "food", "rest", "bike"];

var LEGACY_EMOJI = {
  "\u2B50": "star",
  "\uD83C\uDFC3": "run",
  "\uD83D\uDCD6": "book",
  "\uD83D\uDCA7": "water",
  "\uD83E\uDDD8": "calm",
  "\uD83D\uDCAA": "gym",
  "\uD83C\uDFAF": "target",
  "\uD83C\uDF31": "plant",
  "\u270D": "write",
  "\uD83C\uDFB8": "music",
  "\uD83E\uDDE0": "mind",
  "\uD83C\uDF05": "dawn",
  "\uD83E\uDD57": "food",
  "\uD83D\uDECC": "rest",
  "\uD83D\uDEB4": "bike",
};

export function normalizeHabitIcon(raw) {
  if (!raw || typeof raw !== "string") return "star";
  if (LEGACY_EMOJI[raw]) return LEGACY_EMOJI[raw];
  if (HABIT_ICON_ORDER.indexOf(raw) >= 0) return raw;
  return "star";
}

export function toDbHabitIcon(iconId) {
  var id = iconId && HABIT_ICON_ORDER.indexOf(iconId) >= 0 ? iconId : "star";
  return id;
}

function svgProps(size, color, aria) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": aria !== false,
  };
}

export function HabitIcon(props) {
  var id = normalizeHabitIcon(props.id),
    s = props.size || 22,
    c = props.color || DEF,
    p = svgProps(s, c);
  switch (id) {
    case "run":
      return (
        <svg {...p}>
          <circle cx="9" cy="5" r="2.2" />
          <path d="M9 8v3l-3 6M9 11h4l2 3M14 8l2-1 3 2M5 20l3-6" />
        </svg>
      );
    case "book":
      return (
        <svg {...p}>
          <path d="M5 5a2 2 0 012-2h6v20H7a2 2 0 00-2-2V5zM13 3h6a2 2 0 012 2v13a2 2 0 01-2 2h-6" />
        </svg>
      );
    case "water":
      return (
        <svg {...p}>
          <path d="M12 3s4 5.5 4 9.2C16 15.3 14.5 17 12 17s-4-1.7-4-4.8C8 8.5 12 3 12 3z" />
        </svg>
      );
    case "calm":
      return (
        <svg {...p}>
          <circle cx="12" cy="6" r="2" />
          <path d="M8 11h8v2l-2 8h-4l-2-8v-2zM10 11V9M14 11V9" />
        </svg>
      );
    case "gym":
      return (
        <svg {...p}>
          <path d="M4 13h16" />
          <rect x="2" y="9" width="5" height="8" rx="1.25" />
          <rect x="17" y="9" width="5" height="8" rx="1.25" />
        </svg>
      );
    case "target":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1.5" fill={c} stroke="none" />
        </svg>
      );
    case "plant":
      return (
        <svg {...p}>
          <path d="M12 22V13" />
          <path d="M12 13c3-8 11-11 11-11s-3 8-11 12" />
          <path d="M12 13C9 5 1 2 1 2s3 8 11 11" />
        </svg>
      );
    case "write":
      return (
        <svg {...p}>
          <path d="M4 20h4l10.5-10.5a2.2 2.2 0 000-3L17 4.5a2.2 2.2 0 00-3 0L4 15v5z" />
          <path d="M13 6l5 5" />
        </svg>
      );
    case "music":
      return (
        <svg {...p}>
          <path d="M8 18V5l10-2v13" />
          <circle cx="8" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case "mind":
      return (
        <svg {...p}>
          <path d="M12 5a3 3 0 013 3c0 1.5-.8 2.3-1.2 2.7a2 2 0 00-.8 1.6V14M9 8a3 3 0 00-3 3c0 1.2.6 2 1 2.4a2 2 0 01.7 1.5V18" />
          <path d="M12 18a2 2 0 104 0 2 2 0 00-4 0zM8 18a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "dawn":
      return (
        <svg {...p}>
          <path d="M3 18h18M8 18a4 4 0 018 0M12 10V5M8 8l-2-2M16 8l2-2M5 12H3M21 12h-2" />
        </svg>
      );
    case "food":
      return (
        <svg {...p}>
          <path d="M12 5c2 0 3.5 2 3.5 4.5S14 14 12 14s-3.5-2.5-3.5-4.5S10 5 12 5z" />
          <path d="M8 20h8M10 14v5M14 14v5" />
        </svg>
      );
    case "rest":
      return (
        <svg {...p}>
          <rect x="3" y="10" width="18" height="7" rx="2" />
          <path d="M5 10V8a2 2 0 012-2h10a2 2 0 012 2v2" />
          <path d="M8 14h.01M12 14h.01M16 14h.01" />
        </svg>
      );
    case "bike":
      return (
        <svg {...p}>
          <circle cx="7" cy="16" r="3.2" />
          <circle cx="17" cy="16" r="3.2" />
          <path d="M10 16l4-10 3 4M14 6h2M10 16h7" />
        </svg>
      );
    case "star":
    default:
      return (
        <svg {...p} strokeWidth={1.55}>
          <path d="M12 2.5l2.4 7.2h7.7l-6.2 4.7 2.4 7.1L12 16.6l-6.3 4.9 2.4-7.1-6.2-4.7h7.7z" />
        </svg>
      );
  }
}

export function IToday(props) {
  var c = props.color || DEF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" fill={c} stroke="none" />
      <line x1="12" y1="3" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="3" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21" y2="12" />
    </svg>
  );
}

export function ICal(props) {
  var c = props.color || DEF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <rect x="7" y="13" width="3" height="3" rx="0.5" fill={c} stroke="none" />
      <rect x="14" y="13" width="3" height="3" rx="0.5" fill={c} stroke="none" />
    </svg>
  );
}

export function IGainz(props) {
  var c = props.color || DEF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="10" width="2.5" height="4" rx="1" />
      <rect x="4.5" y="8" width="2" height="8" rx="1" />
      <line x1="6.5" y1="12" x2="17.5" y2="12" />
      <rect x="17.5" y="8" width="2" height="8" rx="1" />
      <rect x="19.5" y="10" width="2.5" height="4" rx="1" />
    </svg>
  );
}

export function ICycles(props) {
  var c = props.color || DEF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3,17 9,11 13,15 21,7" />
      <polyline points="16,7 21,7 21,12" />
    </svg>
  );
}

export function ISettings(props) {
  var c = props.color || DEF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function ISleep(props) {
  var c = props.color || DEF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 14.2A8 8 0 0 1 9.8 3.5a8 8 0 1 0 10.7 10.7z" />
      <path d="M15 4h4l-4 4h4" />
    </svg>
  );
}

export function IFlame(props) {
  var c = props.color || DEF;
  var sz = props.size || 22;
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5c1.2 2.4 3.2 3.6 4.4 5.6 1.6 2.6 1.7 5.9-.4 8.3a6.5 6.5 0 0 1-9.8-.2c-1.9-2.3-1.8-5.4-.1-7.7 1-1.4 2.2-2 2.7-3.2.5 1.6 1.6 2.5 2.7 2.8.4-2 0-3.7.5-5.6z" />
      <path d="M12 20a3 3 0 0 0 3-3c0-1.2-.8-1.9-1.6-2.6-.6-.5-1-1-1.4-1.9-.3.9-.7 1.4-1.4 1.9C9.8 15.1 9 15.8 9 17a3 3 0 0 0 3 3z" />
    </svg>
  );
}

export function ICoach(props) {
  var c = props.color || DEF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 21l2.1-5.3A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M8.5 11.2l1.4 1.4 1.4-1.4M13.7 11.2l1.4 1.4 1.4-1.4" />
    </svg>
  );
}

export function IconKpiSleep(props) {
  var c = props.color || DEF,
    s = props.size || 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 14.2A8 8 0 0 1 9.8 3.5a8 8 0 1 0 10.7 10.7z" />
      <path d="M15 4h4l-4 4h4" />
    </svg>
  );
}

export function IconKpiWorkout(props) {
  var c = props.color || DEF,
    s = props.size || 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 13h16" />
      <rect x="2" y="9" width="5" height="8" rx="1.25" />
      <rect x="17" y="9" width="5" height="8" rx="1.25" />
    </svg>
  );
}

export function IconKpiHabit(props) {
  var c = props.color || DEF,
    s = props.size || 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M8.5 12.2l2.5 2.5 6-7" />
    </svg>
  );
}

export function IconKpiStar(props) {
  var c = props.color || DEF,
    s = props.size || 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.55" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5l2.4 7.2h7.7l-6.2 4.7 2.4 7.1L12 16.6l-6.3 4.9 2.4-7.1-6.2-4.7h7.7z" />
    </svg>
  );
}

export function IconSprout(props) {
  var c = props.color || DEF_PRI,
    s = props.size || 44;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22V13" />
      <path d="M12 13c3-8 11-11 11-11s-3 8-11 12" />
      <path d="M12 13C9 5 1 2 1 2s3 8 11 11" />
    </svg>
  );
}

export function IconDumbbellMark(props) {
  var c = props.color || DEF_PRI,
    s = props.size || 40;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <rect x="2" y="8" width="5" height="8" rx="1.5" />
      <rect x="17" y="8" width="5" height="8" rx="1.5" />
    </svg>
  );
}

export function CalDayDoneCheck(props) {
  var c = props.color || "#ffffff",
    s = props.size || 11;
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10l4 5 8-9" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronCal(props) {
  var c = props.color || DEF_PRI,
    dir = props.dir === "right" ? "right" : "left",
    sx = dir === "right" ? { transform: "scaleX(-1)" } : undefined;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={sx}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function IconUiScale(props) {
  var c = props.color || DEF_PRI,
    s = props.size || 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4h10M5 20h14M7 4l-2 16M17 4l2 16M9 13h6" />
    </svg>
  );
}

export function IconUiChartTrend(props) {
  var c = props.color || DEF_PRI,
    s = props.size || 36;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19h16M5 15l4-5 4 3 6-8" />
      <path d="M17 9v4h4" />
    </svg>
  );
}

export function IconUiBowl(props) {
  var c = props.color || DEF_PRI,
    s = props.size || 30;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11c2 5 5 8 8 8s6-3 8-8H4z" />
      <path d="M8 6c1.5-1 3.5-1.5 4-1.5s2.5.5 4 1.5M12 5V3" />
    </svg>
  );
}

export function IconUiSparkles(props) {
  var c = props.color || DEF_PRI,
    s = props.size || 14;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3v4M12 17v4M5 12H3M21 12h-2" />
      <path d="M7 7l1.5 1.5M15.5 15.5L17 17M17 7l-1.5 1.5M8.5 15.5L7 17" />
    </svg>
  );
}

export function IconUiAlert(props) {
  var c = props.color || "#9A4040",
    s = props.size || 14;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9L2.8 18a1.5 1.5 0 001.3 2.2h16.8a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-2.6 0z" />
    </svg>
  );
}

export function IconUiEye(props) {
  var c = props.color || "#7A5A0F",
    s = props.size || 14;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}
