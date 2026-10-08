import { test, mock } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { armLaunchSplash, LAUNCH_HOLD_MS, LAUNCH_REMOVE_MS } from "./launchSplash.js";

function fakeDoc() {
  var el = {
    classList: {
      classes: {},
      add: function (name) {
        this.classes[name] = true;
      },
      contains: function (name) {
        return !!this.classes[name];
      },
    },
    parentNode: {
      removeChild: function (node) {
        node.removed = true;
        node.parentNode = null;
      },
    },
  };
  return {
    el: el,
    getElementById: function (id) {
      return id === "gt-launch" ? el : null;
    },
  };
}

function withTimers(fn) {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    fn();
  } finally {
    mock.timers.reset();
  }
}

test("boot keeps the same launch node and reveals the app once", function () {
  withTimers(function () {
    var doc = fakeDoc();
    var stop = armLaunchSplash(doc, true);
    assert.equal(doc.el.classList.contains("gt-splash-out"), false);
    mock.timers.tick(LAUNCH_HOLD_MS - 1);
    assert.equal(doc.el.classList.contains("gt-splash-out"), false);
    assert.equal(doc.el.removed, undefined);
    mock.timers.tick(1);
    assert.equal(doc.el.classList.contains("gt-splash-out"), true);
    assert.equal(doc.el.removed, undefined);
    mock.timers.tick(LAUNCH_REMOVE_MS - LAUNCH_HOLD_MS);
    assert.equal(doc.el.removed, true);
    stop();
  });
});

test("cleanup before the hold does not dismiss the launch node", function () {
  withTimers(function () {
    var doc = fakeDoc();
    var stop = armLaunchSplash(doc, true);
    stop();
    mock.timers.tick(LAUNCH_REMOVE_MS + 50);
    assert.equal(doc.el.removed, undefined);
    assert.equal(doc.el.classList.contains("gt-splash-out"), false);
  });
});

test("waiting for data does not start the splash exit", function () {
  withTimers(function () {
    var doc = fakeDoc();
    armLaunchSplash(doc, false);
    mock.timers.tick(LAUNCH_REMOVE_MS + 50);
    assert.equal(doc.el.classList.contains("gt-splash-out"), false);
    assert.equal(doc.el.removed, undefined);
  });
});

test("cold launch uses one static splash instead of a second React splash", function () {
  var html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  var app = fs.readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  assert.match(html, /id="gt-launch"/);
  assert.match(html, /\/icon-512\.png/);
  assert.equal((html.match(/id="gt-launch"/g) || []).length, 1);
  assert.doesNotMatch(app, /gt-splash/);
  assert.doesNotMatch(app, /IconDumbbellMark size=\{48\}/);
});
