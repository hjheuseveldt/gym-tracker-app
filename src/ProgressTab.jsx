import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconUiCamera } from "./icons.jsx";
import { supaReady } from "./supabase.js";
import { loadProgressPhotos, saveProgressPhoto, signProgressPhoto } from "./progressData.js";
import {
  buildTimeline,
  captureOutputSize,
  chronologicalPair,
  coverSourceRect,
  formatLongDate,
  formatShortDate,
  formatWeightDelta,
  formatWeightLb,
  formatWeightNumber,
  latestBodyweights,
  latestPhoto,
  scrollLeftForToday,
  weightRowsFromLogs,
} from "./progressModel.js";

var SERIF = "'DM Serif Display',serif";
var SANS = "'DM Sans',sans-serif";
var ACCENT = "#2EC4B6";
var DEEP = "#14756C";
var TEXT = "#1A2332";
var MUTED = "#5C6570";
var RED = "#C23B44";
var CTA = "linear-gradient(165deg,#3AD4C6 0%,#2EC4B6 45%,#1FA89C 100%)";

function stopStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach(function (track) {
    track.stop();
  });
}

function usePortalHost(portalRoot) {
  var hostState = useState(null);
  var host = hostState[0],
    setHost = hostState[1];
  useLayoutEffect(
    function () {
      var next = portalRoot && portalRoot.current ? portalRoot.current : null;
      setHost(function (prev) {
        return prev === next ? prev : next;
      });
    },
    [portalRoot]
  );
  return host;
}

function useSignedUrl(path) {
  var urlState = useState("");
  var url = urlState[0],
    setUrl = urlState[1];
  var errState = useState("");
  var error = errState[0],
    setError = errState[1];
  var loadState = useState(false);
  var loading = loadState[0],
    setLoading = loadState[1];
  var nonceState = useState(0);
  var nonce = nonceState[0],
    setNonce = nonceState[1];
  var tries = useRef(0);

  useEffect(
    function () {
      tries.current = 0;
    },
    [path]
  );

  useEffect(
    function () {
      var cancelled = false;
      if (!path) {
        setUrl("");
        setError("");
        setLoading(false);
        return undefined;
      }
      setLoading(true);
      setError("");
      signProgressPhoto(path)
        .then(function (signed) {
          if (cancelled) return;
          setUrl(signed);
          setLoading(false);
        })
        .catch(function (e) {
          if (cancelled) return;
          setUrl("");
          setError(e && e.message ? e.message : "Could not open the photo.");
          setLoading(false);
        });
      return function () {
        cancelled = true;
      };
    },
    [path, nonce]
  );

  return {
    url: url,
    error: error,
    loading: loading,
    retry: function () {
      if (tries.current >= 2) return;
      tries.current += 1;
      setNonce(function (n) {
        return n + 1;
      });
    },
  };
}

function weightFor(logs, date) {
  var found = latestBodyweights(weightRowsFromLogs(logs)).find(function (row) {
    return row.day === date;
  });
  return found ? found.weight : null;
}

function deltaInk(text) {
  if (!text || text.charAt(0) === "0") return MUTED;
  if (text.charAt(0) === "-") return RED;
  return DEEP;
}

function shell(children) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 120,
        background: "#F7FFFC",
        display: "flex",
        flexDirection: "column",
        fontFamily: SANS,
        color: TEXT,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {children}
    </div>
  );
}

function TextButton(props) {
  return (
    <button
      type="button"
      className="gt-focus-ring gt-min-tap"
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        border: "none",
        background: "transparent",
        color: props.color || DEEP,
        fontFamily: SANS,
        fontSize: 14,
        fontWeight: 700,
        cursor: props.disabled ? "default" : "pointer",
        opacity: props.disabled ? 0.45 : 1,
        padding: "10px 12px",
      }}
    >
      {props.children}
    </button>
  );
}

function PrimaryButton(props) {
  return (
    <button
      type="button"
      className="gt-focus-ring"
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        flex: props.flex ? 1 : undefined,
        width: props.block ? "100%" : undefined,
        minHeight: 48,
        border: "none",
        borderRadius: 16,
        background: props.disabled ? "rgba(26,35,50,0.16)" : CTA,
        color: props.disabled ? MUTED : "#FFFFFF",
        fontFamily: SANS,
        fontSize: 15,
        fontWeight: 700,
        cursor: props.disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {props.children}
    </button>
  );
}

function SecondaryButton(props) {
  return (
    <button
      type="button"
      className="gt-focus-ring"
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        flex: 1,
        minHeight: 48,
        borderRadius: 16,
        border: "1.5px solid rgba(20,117,108,0.4)",
        background: "#FFFFFF",
        color: DEEP,
        fontFamily: SANS,
        fontSize: 15,
        fontWeight: 700,
        cursor: props.disabled ? "default" : "pointer",
        opacity: props.disabled ? 0.45 : 1,
      }}
    >
      {props.children}
    </button>
  );
}

function PrivatePhoto(props) {
  var signed = props.signed;
  var frame = {
    width: "100%",
    height: "100%",
    background: "#E8F8F5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: signed.error ? RED : MUTED,
    fontSize: 13,
    textAlign: "center",
    padding: 12,
  };
  if (signed.loading) return <div style={frame}>Loading photo…</div>;
  if (signed.error || !signed.url) return <div style={frame}>{signed.error || "Photo unavailable."}</div>;
  return (
    <img
      src={signed.url}
      alt={props.alt || ""}
      draggable={false}
      referrerPolicy="no-referrer"
      onContextMenu={function (event) {
        event.preventDefault();
      }}
      onError={function () {
        signed.retry();
      }}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        WebkitTouchCallout: "none",
        userSelect: "none",
      }}
    />
  );
}

function FlipIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={DEEP} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 7H4v4" />
      <path d="M4 11a8 8 0 0 1 13.5-4.5L20 8" />
      <path d="M16 17h4v-4" />
      <path d="M20 13a8 8 0 0 1-13.5 4.5L4 16" />
    </svg>
  );
}

function CameraSheet(props) {
  var facingState = useState("user");
  var facing = facingState[0],
    setFacing = facingState[1];
  var errState = useState("");
  var camError = errState[0],
    setCamError = errState[1];
  var readyState = useState(false);
  var ready = readyState[0],
    setReady = readyState[1];
  var shotState = useState(null);
  var shot = shotState[0],
    setShot = shotState[1];
  var confirmState = useState(false);
  var confirm = confirmState[0],
    setConfirm = confirmState[1];
  var savingState = useState(false);
  var saving = savingState[0],
    setSaving = savingState[1];
  var saveErrState = useState("");
  var saveErr = saveErrState[0],
    setSaveErr = saveErrState[1];
  var videoRef = useRef(null);
  var frameRef = useRef(null);
  var streamRef = useRef(null);
  var shotUrlRef = useRef("");

  useEffect(function () {
    return function () {
      stopStream(streamRef.current);
      streamRef.current = null;
      if (shotUrlRef.current) URL.revokeObjectURL(shotUrlRef.current);
    };
  }, []);

  useEffect(
    function () {
      if (shot) return undefined;
      var cancelled = false;
      var active = null;
      setReady(false);
      setCamError("");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCamError("This browser can't open the camera here.");
        return undefined;
      }
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 1600 },
          },
        })
        .catch(function () {
          if (cancelled || !navigator.mediaDevices) throw new Error("camera");
          return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        })
        .then(function (stream) {
          if (cancelled) {
            stopStream(stream);
            return;
          }
          active = stream;
          stopStream(streamRef.current);
          streamRef.current = stream;
          var video = videoRef.current;
          if (!video) return;
          video.srcObject = stream;
          var play = video.play();
          if (play && typeof play.catch === "function") play.catch(function () {});
        })
        .catch(function (e) {
          if (cancelled) return;
          var denied = e && (e.name === "NotAllowedError" || e.name === "PermissionDeniedError");
          setCamError(denied ? "Camera permission is blocked. Allow the camera for this site, then try again." : "Could not open the camera.");
        });
      return function () {
        cancelled = true;
        stopStream(active);
        if (streamRef.current === active) streamRef.current = null;
      };
    },
    [facing, shot]
  );

  function forgetShot() {
    if (shotUrlRef.current) URL.revokeObjectURL(shotUrlRef.current);
    shotUrlRef.current = "";
    setShot(null);
  }

  function close() {
    if (saving) return;
    props.onClose();
  }

  function shutter() {
    var video = videoRef.current;
    var frame = frameRef.current;
    if (!video || !frame || !video.videoWidth) return;
    var crop = coverSourceRect(video.videoWidth, video.videoHeight, frame.clientWidth, frame.clientHeight);
    var size = captureOutputSize(frame.clientWidth, frame.clientHeight, 1600);
    if (!crop) return;
    var canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, size.width, size.height);
    canvas.toBlob(
      function (blob) {
        if (!blob) {
          setCamError("Could not capture the photo.");
          return;
        }
        if (shotUrlRef.current) URL.revokeObjectURL(shotUrlRef.current);
        shotUrlRef.current = URL.createObjectURL(blob);
        setShot({ blob: blob, url: shotUrlRef.current });
        setSaveErr("");
        stopStream(streamRef.current);
        streamRef.current = null;
      },
      "image/jpeg",
      0.86
    );
  }

  function commit() {
    if (!shot || saving) return;
    setSaving(true);
    setSaveErr("");
    saveProgressPhoto(props.date, shot.blob, props.previousPath)
      .then(function (row) {
        setSaving(false);
        props.onSaved(row);
      })
      .catch(function (e) {
        setSaving(false);
        setConfirm(false);
        setSaveErr(e && e.message ? e.message : "Could not save the photo.");
      });
  }

  return shell(
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px 0" }}>
        <TextButton onClick={close} disabled={saving}>
          Close
        </TextButton>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700 }}>{shot ? "Use this photo?" : "Take picture"}</div>
        {shot ? (
          <span style={{ width: 64 }} />
        ) : (
          <button type="button" className="gt-focus-ring gt-min-tap" aria-label="Switch camera" onClick={function () { setFacing(function (current) { return current === "user" ? "environment" : "user"; }); }} style={{ width: 44, height: 44, borderRadius: 12, border: "1.5px solid rgba(26,35,50,0.16)", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <FlipIcon />
          </button>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: "10px 16px", display: "flex" }}>
        <div ref={frameRef} style={{ position: "relative", flex: 1, borderRadius: 22, overflow: "hidden", background: "#1A2332" }}>
          {shot ? (
            <img src={shot.url} alt="Captured progress photo preview" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              disablePictureInPicture
              onLoadedMetadata={function () { setReady(true); }}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", background: "#1A2332" }}
            />
          )}
          {!shot && props.ghostUrl ? (
            <img
              src={props.ghostUrl}
              alt=""
              aria-hidden="true"
              draggable={false}
              referrerPolicy="no-referrer"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.28, pointerEvents: "none" }}
            />
          ) : null}
          {camError ? (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", color: "#FFFFFF", fontSize: 14, lineHeight: 1.45, background: "rgba(26,35,50,0.72)" }}>
              {camError}
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ padding: "4px 16px 18px" }}>
        {saveErr ? <div style={{ color: RED, fontSize: 13, fontWeight: 600, marginBottom: 8, textAlign: "center" }}>{saveErr}</div> : null}
        {confirm ? (
          <div className="gt-card" style={{ borderRadius: 18, padding: "14px 14px 12px" }}>
            <div style={{ fontFamily: SERIF, fontSize: 18, marginBottom: 6 }}>Replace this photo?</div>
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.45, marginBottom: 12 }}>
              {formatLongDate(props.date)} already has one. The new picture overwrites it and is not saved to your camera roll.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <SecondaryButton disabled={saving} onClick={function () { setConfirm(false); }}>
                Cancel
              </SecondaryButton>
              <PrimaryButton flex disabled={saving} onClick={commit}>
                {saving ? "Saving…" : "Replace"}
              </PrimaryButton>
            </div>
          </div>
        ) : shot ? (
          <div style={{ display: "flex", gap: 8 }}>
            <SecondaryButton disabled={saving} onClick={forgetShot}>
              Retake
            </SecondaryButton>
            <PrimaryButton flex disabled={saving} onClick={function () { if (props.replacing) setConfirm(true); else commit(); }}>
              {saving ? "Saving…" : "Use Photo"}
            </PrimaryButton>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              className="gt-focus-ring"
              aria-label="Take photo"
              disabled={!ready || !!camError}
              onClick={shutter}
              style={{
                width: 74,
                height: 74,
                borderRadius: "50%",
                border: "4px solid #FFFFFF",
                background: ready && !camError ? ACCENT : "rgba(26,35,50,0.2)",
                boxShadow: "0 0 0 3px " + DEEP,
                cursor: ready && !camError ? "pointer" : "default",
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

function PhotoDetail(props) {
  var weight = formatWeightLb(props.weight);
  return shell(
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px 0" }}>
        <TextButton onClick={props.onBack}>Back</TextButton>
        <div style={{ fontFamily: SERIF, fontSize: 20 }}>Photo</div>
        <span style={{ width: 64 }} />
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: "8px 16px", display: "flex" }}>
        <div className="gt-card" style={{ flex: 1, borderRadius: 22, overflow: "hidden" }}>
          <PrivatePhoto signed={props.signed} alt={"Progress photo " + formatLongDate(props.date)} />
        </div>
      </div>
      <div style={{ padding: "4px 18px 16px" }}>
        <div style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>{formatLongDate(props.date)}</div>
        <div style={{ fontFamily: SERIF, fontSize: 28, lineHeight: 1.15, margin: "2px 0 12px" }}>{weight || "No weigh-in"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <SecondaryButton onClick={props.onRetake}>Retake</SecondaryButton>
          <PrimaryButton flex disabled={!props.canCompare} onClick={props.onCompare}>
            Compare
          </PrimaryButton>
        </div>
        {!props.canCompare ? (
          <div style={{ fontSize: 12, color: MUTED, marginTop: 8, textAlign: "center" }}>Add another photo day to compare.</div>
        ) : null}
      </div>
    </>
  );
}

function ComparePicker(props) {
  return shell(
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px 8px" }}>
        <TextButton onClick={props.onBack}>Back</TextButton>
        <div style={{ fontFamily: SERIF, fontSize: 20 }}>Compare with</div>
        <span style={{ width: 64 }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        {props.choices.map(function (choice) {
          return (
            <button
              key={choice.date}
              type="button"
              className="gt-card gt-focus-ring"
              onClick={function () { props.onPick(choice.date); }}
              style={{
                textAlign: "left",
                borderRadius: 16,
                padding: "14px 14px",
                cursor: "pointer",
                fontFamily: SANS,
                color: TEXT,
                minHeight: 44,
              }}
            >
              <div style={{ fontWeight: 700 }}>{formatLongDate(choice.date)}</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{formatWeightLb(choice.weight) || "No weigh-in"}</div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function CompareView(props) {
  var pair = chronologicalPair(
    { date: props.left.date, weight: props.left.weight, signed: props.left.signed },
    { date: props.right.date, weight: props.right.weight, signed: props.right.signed }
  );
  var delta = formatWeightDelta(pair.earlier && pair.earlier.weight, pair.later && pair.later.weight);
  return shell(
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px 4px" }}>
        <TextButton onClick={props.onBack}>Back</TextButton>
        <div style={{ fontFamily: SERIF, fontSize: 20 }}>Compare</div>
        <span style={{ width: 64 }} />
      </div>
      <div style={{ textAlign: "center", padding: "4px 16px 8px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: MUTED }}>Weight change</div>
        <div style={{ fontFamily: SERIF, fontSize: 32, color: deltaInk(delta), lineHeight: 1.15 }}>{delta || "—"}</div>
        {!delta ? <div style={{ fontSize: 12, color: MUTED }}>Both days need a logged weigh-in.</div> : null}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 8, padding: "0 12px 16px" }}>
        {[pair.earlier, pair.later].map(function (side) {
          if (!side) return null;
          return (
            <div key={side.date} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="gt-card" style={{ flex: 1, minHeight: 0, borderRadius: 18, overflow: "hidden" }}>
                <PrivatePhoto signed={side.signed} alt={"Progress photo " + formatLongDate(side.date)} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{formatShortDate(side.date)}</div>
              <div style={{ fontFamily: SERIF, fontSize: 18, lineHeight: 1 }}>{formatWeightLb(side.weight) || "No weigh-in"}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Timeline(props) {
  var stripRef = useRef(null);
  var pinned = useRef(true);
  var writing = useRef(false);

  useLayoutEffect(
    function () {
      if (!pinned.current) return;
      var el = stripRef.current;
      if (!el) return;
      var todayEl = el.querySelector("[data-progress-today]");
      writing.current = true;
      el.scrollLeft = todayEl
        ? scrollLeftForToday(todayEl.offsetLeft, todayEl.offsetWidth, el.clientWidth, el.scrollWidth)
        : el.scrollWidth;
      writing.current = false;
    },
    [props.pointKey]
  );

  return (
    <div
      ref={stripRef}
      className="tabstrip"
      data-no-tab-swipe
      role="list"
      aria-label="Bodyweight timeline"
      onScroll={function () {
        if (writing.current) return;
        pinned.current = false;
      }}
      style={{
        display: "flex",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflowX: "auto",
        overflowY: "hidden",
        padding: "12px 8px 8px",
        touchAction: "pan-x",
        overscrollBehaviorX: "contain",
      }}
    >
      {props.points.map(function (point, index) {
        var last = index === props.points.length - 1;
        var weight = formatWeightNumber(point.weight);
        var dot = point.hasPhoto ? 18 : point.weight != null ? 9 : 12;
        var column = (
          <>
            <span style={{ fontSize: 10, fontWeight: 700, color: point.isToday ? DEEP : MUTED, height: 14 }}>
              {point.isToday ? "Today" : formatShortDate(point.date)}
            </span>
            <span style={{ position: "relative", height: 28, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "50%",
                  height: 2,
                  background: "rgba(46,196,182,0.45)",
                  left: index === 0 ? "50%" : 0,
                  right: last ? "50%" : 0,
                  transform: "translateY(-50%)",
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: "50%",
                  position: "relative",
                  boxSizing: "border-box",
                  background: point.hasPhoto ? ACCENT : point.weight != null ? DEEP : "#FFFFFF",
                  border: point.hasPhoto ? "3px solid #FFFFFF" : point.weight != null ? "none" : "2px solid " + DEEP,
                  boxShadow: point.hasPhoto ? "0 0 0 2px " + DEEP : "none",
                }}
              />
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: TEXT, minHeight: 16, marginTop: 2 }}>
              {weight != null ? weight + " lb" : ""}
            </span>
          </>
        );
        var shared = {
          width: 72,
          flex: "0 0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "transparent",
          fontFamily: SANS,
          padding: 0,
        };
        if (point.hasPhoto) {
          return (
            <div key={point.date} role="listitem" data-progress-today={point.isToday ? "" : undefined} style={shared}>
              <button
                type="button"
                className="gt-focus-ring"
                aria-label={"Open photo for " + formatLongDate(point.date) + (weight != null ? ", " + weight + " pounds" : "")}
                onClick={function () { props.onOpen(point.date); }}
                style={{ border: "none", cursor: "pointer", color: TEXT, background: "transparent", fontFamily: SANS, minHeight: 72, width: "100%", padding: 0, display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                {column}
              </button>
            </div>
          );
        }
        return (
          <div key={point.date} role="listitem" data-progress-today={point.isToday ? "" : undefined} style={shared}>
            {column}
          </div>
        );
      })}
    </div>
  );
}

export function ProgressTab(props) {
  var logs = props.logs || {};
  var todayKey = props.todayKey;
  var photosState = useState([]);
  var photos = photosState[0],
    setPhotos = photosState[1];
  var statusState = useState(function () {
    return supaReady() ? "loading" : "off";
  });
  var status = statusState[0],
    setStatus = statusState[1];
  var errState = useState("");
  var loadError = errState[0],
    setLoadError = errState[1];
  var modeState = useState("page");
  var mode = modeState[0],
    setMode = modeState[1];
  var dayState = useState(null);
  var activeDate = dayState[0],
    setActiveDate = dayState[1];
  var compareState = useState(null);
  var compareDate = compareState[0],
    setCompareDate = compareState[1];
  var cameraState = useState(null);
  var cameraDate = cameraState[0],
    setCameraDate = cameraState[1];
  var pageErrorState = useState("");
  var pageError = pageErrorState[0],
    setPageError = pageErrorState[1];

  useEffect(function () {
    if (!supaReady()) return undefined;
    var cancelled = false;
    loadProgressPhotos()
      .then(function (rows) {
        if (cancelled) return;
        setPhotos(rows || []);
        setStatus("ready");
      })
      .catch(function (e) {
        if (cancelled) return;
        setLoadError(e && e.message ? e.message : "Could not load photos.");
        setStatus("error");
      });
    return function () {
      cancelled = true;
    };
  }, []);

  useEffect(
    function () {
      function onKey(event) {
        if (event.key !== "Escape") return;
        if (cameraDate) {
          setCameraDate(null);
          return;
        }
        if (mode === "compare") setMode("detail");
        else if (mode === "pick") setMode("detail");
        else if (mode === "detail") setMode("page");
      }
      window.addEventListener("keydown", onKey);
      return function () {
        window.removeEventListener("keydown", onKey);
      };
    },
    [cameraDate, mode]
  );

  var points = buildTimeline(weightRowsFromLogs(logs), photos, todayKey);
  var pointKey = points
    .map(function (point) {
      return point.date + ":" + (point.hasPhoto ? "1" : "0") + ":" + (point.weight == null ? "" : point.weight);
    })
    .join("|");
  var activePhoto = photos.find(function (photo) {
    return photo.photo_date === activeDate;
  });
  var comparePhoto = photos.find(function (photo) {
    return photo.photo_date === compareDate;
  });
  var cameraPhoto = photos.find(function (photo) {
    return photo.photo_date === cameraDate;
  });
  var ghost = latestPhoto(photos);
  var detailSigned = useSignedUrl(activePhoto && mode !== "page" ? activePhoto.storage_path : "");
  var compareSigned = useSignedUrl(comparePhoto && mode === "compare" ? comparePhoto.storage_path : "");
  var ghostSigned = useSignedUrl(cameraDate && ghost ? ghost.storage_path : "");
  var host = usePortalHost(props.portalRoot);

  function place(node) {
    if (!node) return null;
    if (host) return createPortal(node, host);
    return node;
  }

  function remember(row) {
    setPhotos(function (prev) {
      var next = prev.filter(function (photo) {
        return photo.photo_date !== row.photo_date;
      });
      next.push(row);
      next.sort(function (a, b) {
        if (a.photo_date < b.photo_date) return -1;
        if (a.photo_date > b.photo_date) return 1;
        return 0;
      });
      return next;
    });
    setStatus("ready");
    setCameraDate(null);
  }

  function openCamera(date) {
    setPageError("");
    if (!supaReady()) {
      setPageError("Supabase isn't configured.");
      return;
    }
    setCameraDate(date);
  }

  var choices = photos
    .filter(function (photo) {
      return photo.photo_date !== activeDate;
    })
    .map(function (photo) {
      return { date: photo.photo_date, weight: weightFor(logs, photo.photo_date) };
    })
    .reverse();

  return (
    <div style={{ padding: "16px 14px 8px", fontFamily: SANS, color: TEXT, minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
      <div style={{ padding: "0 8px 12px" }}>
        <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>Body</div>
        <div style={{ fontSize: 26, fontWeight: 700, fontFamily: SERIF, lineHeight: 1.1 }}>Progress</div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 4, lineHeight: 1.4 }}>Bodyweight comes from your logged workouts.</div>
      </div>
      <PrimaryButton block onClick={function () { openCamera(todayKey); }}>
        <IconUiCamera color="#FFFFFF" size={18} />
        Take Picture
      </PrimaryButton>
      {pageError ? <div style={{ color: RED, fontSize: 13, fontWeight: 600, marginTop: 8 }}>{pageError}</div> : null}
      <div className="gt-card" data-no-tab-swipe style={{ borderRadius: 18, marginTop: 14, overflow: "hidden", minWidth: 0, maxWidth: "100%" }}>
        {status === "loading" ? <div style={{ padding: "18px 16px", color: MUTED, fontSize: 13 }}>Loading…</div> : null}
        {status === "error" ? <div style={{ padding: "18px 16px", color: RED, fontSize: 13 }}>{loadError}</div> : null}
        {status !== "loading" ? <Timeline points={points} pointKey={pointKey} onOpen={function (date) { setActiveDate(date); setCompareDate(null); setMode("detail"); }} /> : null}
        <div style={{ display: "flex", gap: 14, padding: "4px 14px 12px", fontSize: 11, color: MUTED, fontWeight: 600 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: DEEP }} />
            Weigh-in
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: ACCENT, boxShadow: "0 0 0 2px " + DEEP }} />
            Photo
          </span>
        </div>
      </div>
      {place(
        cameraDate ? (
          <CameraSheet
            date={cameraDate}
            replacing={!!cameraPhoto}
            previousPath={cameraPhoto ? cameraPhoto.storage_path : ""}
            ghostUrl={ghostSigned.url}
            onClose={function () { setCameraDate(null); }}
            onSaved={remember}
          />
        ) : null
      )}
      {place(
        mode === "detail" && activeDate && !cameraDate ? (
          <PhotoDetail
            date={activeDate}
            weight={weightFor(logs, activeDate)}
            signed={detailSigned}
            canCompare={photos.length > 1}
            onBack={function () { setMode("page"); }}
            onRetake={function () { openCamera(activeDate); }}
            onCompare={function () { setMode("pick"); }}
          />
        ) : null
      )}
      {place(
        mode === "pick" && !cameraDate ? (
          <ComparePicker
            choices={choices}
            onBack={function () { setMode("detail"); }}
            onPick={function (date) {
              setCompareDate(date);
              setMode("compare");
            }}
          />
        ) : null
      )}
      {place(
        mode === "compare" && activePhoto && comparePhoto && !cameraDate ? (
          <CompareView
            left={{ date: activeDate, weight: weightFor(logs, activeDate), signed: detailSigned }}
            right={{ date: compareDate, weight: weightFor(logs, compareDate), signed: compareSigned }}
            onBack={function () { setMode("detail"); }}
          />
        ) : null
      )}
    </div>
  );
}
