// The launch screen is the #gt-launch node in index.html. It stays in the
// document across the data boot so its intro animation is not replayed.
export var LAUNCH_HOLD_MS = 1200;
export var LAUNCH_REMOVE_MS = 4400;

export function armLaunchSplash(doc, booted) {
  if (!booted || !doc || typeof doc.getElementById !== "function") return function () {};
  var launch = doc.getElementById("gt-launch");
  if (!launch) return function () {};
  var t1 = setTimeout(function () {
    launch.classList.add("gt-splash-out");
  }, LAUNCH_HOLD_MS);
  var t2 = setTimeout(function () {
    if (launch.parentNode) launch.parentNode.removeChild(launch);
  }, LAUNCH_REMOVE_MS);
  return function () {
    clearTimeout(t1);
    clearTimeout(t2);
  };
}
