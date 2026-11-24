// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { ICONS } from "./header.js";
import { MODES, MODE_ICON } from "./core.js";
import { STRINGS } from "./i18n/strings.js";

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: Home Assistant's full locale when it is the card's language (pt-BR keeps Brazilian formats),
// else the card's language. A bare "pt" is Home Assistant's European Portuguese: Intl reads it as Brazilian.
export const intlLang = (hass, config) => {
  const l = lang(hass, config);
  const full = config?.language ? "" : (hass && (hass.locale?.language || hass.language)) || "";
  const base = l.split("-")[0];
  let out = l;
  if (full && full.split("-")[0] === base && !(l === "sr" && /-Latn\b/.test(full))) out = full;
  return out === "pt" ? "pt-PT" : out;
};

// 12 / 24 h clock from the Home Assistant profile (time_format): "12", "24", "system" (the browser's own
// locale) or "language" (the card's language, the Intl default: undefined).
export const hour12Of = (hass) => {
  const tf = hass?.locale?.time_format;
  if (tf === "12") return true;
  if (tf === "24") return false;
  if (tf === "system") return new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12;
  return undefined;
};

export const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

export const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// Seconds → "45 s" / "1:05" countdown.
export const fmtCountdown = (sec) => {
  const s = Math.max(0, Math.ceil(sec));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Seconds → "12 min", "3 h 05", "2 d" (units from the strings).
export const fmtDuration = (sec, tr) => {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${Math.max(1, m)} ${tr("min")}`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h} ${tr("h")} ${String(m % 60).padStart(2, "0")}` : `${h} ${tr("h")}`;
  return `${Math.floor(h / 24)} ${tr("d")}`;
};

// Alarmo writes "2026-08-09 19:28:27" (local time, no zone): read it as local time.
export const parseTime = (v) => {
  if (!v) return NaN;
  return Date.parse(/^\d{4}-\d\d-\d\d \d/.test(v) ? v.replace(" ", "T") : v);
};

export const RTF = {};
export const ago = (l, ms, now = Date.now()) => {
  if (!Number.isFinite(ms)) return null;
  const diff = (ms - now) / 1000;
  const rtf = (RTF[l] ??= new Intl.RelativeTimeFormat(l, { numeric: "auto" }));
  const abs = Math.abs(diff);
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
};

// State → color class: off (disarmed), the mode of an armed panel, wait (arming / pending), alarm, idle.
export const stateClass = (state) => {
  const s = String(state || "");
  if (s === "disarmed") return "off";
  if (s === "triggered") return "alarm";
  if (/^(arming|pending|disarming)$/.test(s)) return "wait";
  // Only the known modes: the result goes unescaped into class attributes.
  const mode = s.startsWith("armed_") ? s.slice(6).replace("custom_bypass", "custom") : "";
  return /^(home|away|night|vacation|custom)$/.test(mode) ? mode : "idle";
};

// The `modes` option with the optional arm_ prefix added and duplicates removed ("away" and "arm_away" are one
// mode). Anything but a list is returned as is.
export const armModes = (modes) =>
  Array.isArray(modes) ? [...new Set(modes.map((m) => (String(m).startsWith("arm_") ? String(m) : `arm_${m}`)))] : modes;

// Arm modes the panel supports, in button order, narrowed to `modes` when set.
export const supportedModes = (stateObj, modes) => {
  const f = Number(stateObj?.attributes?.supported_features) || 0;
  const all = MODES.filter(([, bit]) => f & bit).map(([m]) => m);
  const wanted = Array.isArray(modes) ? armModes(modes) : [];
  return wanted.length ? wanted.filter((m) => all.includes(m)) : all;
};

// Seconds left of the exit (arming) or entry (pending) delay: Alarmo's `delay` from the last change, or the
// `expiration` attribute some integrations set ({ left, total } in seconds, total null when unknown). null
// when no delay is known.
export const remaining = (stateObj, now = Date.now()) => {
  if (!stateObj || !/^(arming|pending)$/.test(stateObj.state)) return null;
  const a = stateObj.attributes || {};
  const exp = parseTime(a.expiration);
  if (Number.isFinite(exp)) return { left: Math.max(0, (exp - now) / 1000), total: null };
  const delay = Number(a.delay);
  const start = Date.parse(stateObj.last_changed);
  if (!(delay > 0) || !Number.isFinite(start)) return null;
  return { left: Math.max(0, delay - (now - start) / 1000), total: delay };
};

// Sensor device class → [group, closed/clear icon, open/detected icon].
export const SENSOR_KIND = {
  door: ["opening", ICONS.door, ICONS.door_open],
  window: ["opening", ICONS.window, ICONS.window_open],
  garage_door: ["opening", ICONS.garage, ICONS.garage],
  opening: ["opening", ICONS.door, ICONS.door_open],
  motion: ["motion", ICONS.motion, ICONS.motion],
  occupancy: ["motion", ICONS.motion, ICONS.motion],
  presence: ["motion", ICONS.motion, ICONS.motion],
  smoke: ["problem", ICONS.smoke, ICONS.smoke_alert],
  moisture: ["problem", ICONS.water, ICONS.water],
};

// `sensors`, `cameras` and `buttons` items: "domain.x" or { entity, name }.
export const normalize = (items) =>
  (Array.isArray(items) ? items : [])
    .map((e) => (typeof e === "string" ? { entity: e } : e))
    .filter((e) => e?.entity);

// The `buttons` a tap acts on: [service domain, service] per entity domain. The ones that toggle show their state.
export const BUTTON_ACTIONS = {
  switch: ["homeassistant", "toggle"],
  light: ["homeassistant", "toggle"],
  fan: ["homeassistant", "toggle"],
  input_boolean: ["homeassistant", "toggle"],
  siren: ["homeassistant", "toggle"],
  button: ["button", "press"],
  input_button: ["input_button", "press"],
  script: ["script", "turn_on"],
  scene: ["scene", "turn_on"],
};
export const BUTTON_RUNS = new Set(["button", "input_button", "script", "scene"]);

// Alarmo's open_sensors / bypassed_sensors: { entity_id: state } or a list of entity ids.
// The panel used when the config names none: the first alarm_control_panel alphabetically. Shared by the
// card and the visual editor, so both show the same panel whatever the order of hass.states.
export const firstPanel = (hass) =>
  hass?.states
    ? Object.keys(hass.states)
        .filter((id) => id.startsWith("alarm_control_panel."))
        .sort()[0]
    : undefined;

export const entityList = (v) => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.keys(v) : []);

// The arm mode of an `alarmo_failed_to_arm` event: its `command` ("arm_away"), or its `mode` ("away"). null
// when it names no known mode (the result goes into class attributes).
export const failedMode = (d) => {
  const cmd = String(d?.command || "");
  const m = cmd.startsWith("arm_") ? cmd : d?.mode ? `arm_${String(d.mode).replace(/^armed_/, "")}` : "";
  const mode = m === "arm_custom" ? "arm_custom_bypass" : m;
  return MODE_ICON[mode] ? mode : null;
};

// An `alarmo_failed_to_arm` event is answered with the code just typed only this long after the card sent
// the arming: later, the code pad asks again.
export const FAILED_ARM_MS = 15000;

// The same refusal reaches every card showing the panel: one card only shows its popup. The card that sent
// the arming takes it (from another card that showed it first); else the first card to get it. Keyed on the
// event's time (`time_fired`), the last few kept.
export const failedClaims = new Map();
export const claimFailure = (key, card, mine) => {
  const other = failedClaims.get(key);
  if (other && other !== card) {
    if (!mine || other.mine) return false;
    if (other.card._confirm?.failKey === key) other.card._closeConfirm(false);
  }
  failedClaims.set(key, { card, mine });
  while (failedClaims.size > 20) failedClaims.delete(failedClaims.keys().next().value);
  return true;
};

// Activity: the panel's arm / disarm / trigger changes from the logbook, newest first. Entries are
// { when (s), state, context_user_id, context_name }.
export const ACTIVITY_STATES = /^(armed_\w+|disarmed|triggered)$/;
export const activityEntries = (list, count) =>
  (Array.isArray(list) ? list : [])
    .filter((e) => ACTIVITY_STATES.test(String(e?.state ?? "")) && Number.isFinite(Number(e.when)))
    .sort((a, b) => b.when - a.when)
    .slice(0, count);

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
export const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML (as in ha-presence-card): nodes whose tag is unchanged are
// kept, so keyboard focus, hover, the code input and CSS animations survive an update. Rows carry a data-key
// and are matched by it, other nodes by position.
export const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
export const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
export const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
export const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    if (o !== ref) cur.insertBefore(o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
// See .strut in BASE_STYLE: sizes the card in parents sized by their content.
export const STRUT = `<div class="strut" aria-hidden="true">${"<i></i>".repeat(10)}</div>`;
// The width of an element's whole text in fractional pixels, even while an ellipsis cuts it.
export const textWidth = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width || el.scrollWidth;
};

export const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

// Card logo: a shield sending out radar waves, drawn in the accent color on a round tinted badge like the other
// ha-* cards.
export const logo = (label) => `<div class="badge"><svg class="icon" viewBox="6 6 36 36" role="img" aria-label="${esc(label)}">
  <path d="M24 8 11 13.5v9c0 8.3 5.5 15.4 13 17.5 7.5-2.1 13-9.2 13-17.5v-9Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
  <circle cx="24" cy="24" r="2.6"/>
  <path d="M20.3 20.3a5.2 5.2 0 0 0 0 7.4M27.7 20.3a5.2 5.2 0 0 1 0 7.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M17.2 17.2a9.6 9.6 0 0 0 0 13.6M30.8 17.2a9.6 9.6 0 0 1 0 13.6" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
</svg></div>`;

// Big state shield of the full card (and the small one of the mini card): a frosted-glass shield emblem in the
// accent colour. A specular highlight glides across; while a delay runs a thin ring draws itself, when armed a
// soft "secured" halo breathes out, and when the alarm goes off the glow swells and shockwaves burst past the
// shield. Accent colours are set in CSS (WebKit/Safari-safe); the two gradients use literal white only. The
// gradient/clip ids carry `uid` (the card instance), so that they stay unique even outside a shadow root.
export const shield = (state, uid = 0) => `<div class="shield ${stateClass(state)}"><svg class="sc" viewBox="0 0 120 120" aria-hidden="true">
  <defs>
    <clipPath id="sc-clip-${uid}"><path d="M60 20 32 32v20c0 18.4 12 34.2 28 38.8 16-4.6 28-20.4 28-38.8V32Z"/></clipPath>
    <linearGradient id="sc-glass-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/></linearGradient>
    <linearGradient id="sc-gleam-${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <g transform="translate(60 56) scale(1.45) translate(-60 -56)"><g class="sc-glass">
    <path class="sc-tint" d="M60 20 32 32v20c0 18.4 12 34.2 28 38.8 16-4.6 28-20.4 28-38.8V32Z"/>
    <path class="sc-sheen" d="M60 20 32 32v20c0 18.4 12 34.2 28 38.8 16-4.6 28-20.4 28-38.8V32Z" fill="url(#sc-glass-${uid})"/>
    <g clip-path="url(#sc-clip-${uid})">
      <circle class="sc-secure" cx="60" cy="56" r="22"/>
      <circle class="sc-ringdraw" cx="60" cy="56" r="27" stroke-dasharray="170" pathLength="170" transform="rotate(-90 60 56)"/>
      <circle class="sc-guard g1" cx="60" cy="54" r="12"/>
      <circle class="sc-guard g2" cx="60" cy="54" r="21"/>
      <rect class="sc-gleam" x="40" y="14" width="16" height="92" fill="url(#sc-gleam-${uid})" transform="skewX(-16)"/>
    </g>
    <path class="sc-ring" d="M60 20 32 32v20c0 18.4 12 34.2 28 38.8 16-4.6 28-20.4 28-38.8V32Z"/>
    <path class="sc-highlight" d="M37 31 60 22l23 9"/>
    <path class="sc-lock-shackle" d="M54 58a6 6 0 0 1 12 0M58 58v-5a2 2 0 0 1 4 0v5"/>
    <rect class="sc-lock" x="52.5" y="57" width="15" height="12" rx="2.5"/>
  </g></g>
  <circle class="sc-shock s1" cx="60" cy="56" r="22"/>
  <circle class="sc-shock s2" cx="60" cy="56" r="22"/>
</svg></div>`;

// ---------------------------------------------------------------------------
// Illustrated header: a surveillance radar at the right of a 90 px banner, around the big state shield. The left
// of the banner stays calm: the card's text sits there. The radar is drawn in a 260 × 80 picture (the 10 px graduated
// strip under it is CSS, edge to edge); its colours follow the state through var(--c), set in CSS only (WebKit/Safari-safe).
// ---------------------------------------------------------------------------

// The badge's MDI icon for each state (Home Assistant's own alarm icons).
export const STATE_ICON = {
  off: ICONS.shield_off,
  home: ICONS.shield_home,
  away: ICONS.shield_lock,
  night: ICONS.shield_moon,
  vacation: ICONS.shield_airplane,
  custom: ICONS.security,
  wait: ICONS.shield_sync,
  alarm: ICONS.bell_ring,
  idle: ICONS.shield_off,
};

// Night picture: forced by illustration_theme, else Home Assistant's dark mode alone (a light theme keeps the day
// picture after sunset).
export const isNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

// The banner picture: a surveillance radar around the big state shield. Range rings, ticks and a crosshair; a sweep
// with a fading trail; four sensors (door, motion, window, siren) linked to the centre; a surveillance camera hanging
// at the top with its field of view, and a REC light. Drawn in a 260 × 80 picture anchored at the banner's right, its
// centre on the shield, clipped at the text's right edge (parts too close to the text are left out on narrow cards).
// Disarmed: grey and still, the camera looking down. Armed: in the state colour, the sweep turning, data flowing to the
// centre, each sensor pinging as the sweep passes it, the camera panning (infrared LEDs at night). Delay: amber, the
// sensors blinking in turn. Triggered: red, a fast sweep, the window sensor filled and pulsing.
export const AL_ICONS = {
  door: "M8,3C6.89,3 6,3.89 6,5V21H18V5C18,3.89 17.11,3 16,3H8M8,5H16V19H8V5M13,11V13H15V11H13Z",
  motion:
    "M10,0.2C9,0.2 8.2,1 8.2,2C8.2,3 9,3.8 10,3.8C11,3.8 11.8,3 11.8,2C11.8,1 11,0.2 10,0.2M15.67,1A7.33,7.33 0 0,0 23,8.33V7A6,6 0 0,1 17,1H15.67M18.33,1C18.33,3.58 20.42,5.67 23,5.67V4.33C21.16,4.33 19.67,2.84 19.67,1H18.33M21,1A2,2 0 0,0 23,3V1H21M7.92,4.03C7.75,4.03 7.58,4.06 7.42,4.11L2,5.8V11H3.8V7.33L5.91,6.67L2,22H3.8L6.67,13.89L9,17V22H10.8V15.59L8.31,11.05L9.04,8.18L10.12,10H15V8.2H11.38L9.38,4.87C9.08,4.37 8.54,4.03 7.92,4.03Z",
  window: "M4 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V4C2 2.9 2.9 2 4 2M4 4V11H11V4H4M4 20H11V13H4V20M20 20V13H13V20H20M20 4H13V11H20V4Z",
  siren:
    "M6,6.9L3.87,4.78L5.28,3.37L7.4,5.5L6,6.9M13,1V4H11V1H13M20.13,4.78L18,6.9L16.6,5.5L18.72,3.37L20.13,4.78M4.5,10.5V12.5H1.5V10.5H4.5M19.5,10.5H22.5V12.5H19.5V10.5M6,20H18A2,2 0 0,1 20,22H4A2,2 0 0,1 6,20M12,5A6,6 0 0,1 18,11V19H6V11A6,6 0 0,1 12,5Z",
};
export const AL_CX = 220;
export const AL_CY = 40;
// Each sensor: icon, position, and where the sweep reaches it (a fraction of a turn, clockwise from 3 o'clock).
export const AL_NODES = [
  ["door", 150, 16],
  ["motion", 142, 60],
  ["window", 108, 42],
  ["siren", 182, 69],
].map(([icon, x, y]) => ({ icon, x, y, turn: (((Math.atan2(y - AL_CY, x - AL_CX) * 180) / Math.PI + 360) % 360) / 360 }));
export const alPt = (r, deg) => `${(AL_CX + r * Math.cos((deg * Math.PI) / 180)).toFixed(1)} ${(AL_CY + r * Math.sin((deg * Math.PI) / 180)).toFixed(1)}`;
export const AL_TICKS = Array.from({ length: 36 }, (_, k) => `M${alPt(k % 3 ? 66 : 63, k * 10)}L${alPt(69, k * 10)}`).join("");
export const AL_TRAIL = Array.from(
  { length: 9 },
  (_, k) => `<path class="al-trail" style="opacity:${(0.42 * (1 - k / 9)).toFixed(2)}" d="M${AL_CX} ${AL_CY}L${alPt(70, -k * 5)}A70 70 0 0 0 ${alPt(70, -(k + 1) * 5)}Z"/>`,
).join("");

export const alarmRadar = (uid) => {
  const id = (n) => `al-${n}-${uid}`;
  const nodes = AL_NODES.map(
    (n) =>
      `<g class="al-node al-node-${n.icon}" style="--turn:${n.turn.toFixed(3)}"><circle class="al-node-ping" cx="${n.x}" cy="${n.y}" r="9"/><circle class="al-node-disc" cx="${n.x}" cy="${n.y}" r="6.2"/><path class="al-node-icon" transform="translate(${n.x - 3.6} ${n.y - 3.6}) scale(.3)" d="${AL_ICONS[n.icon]}"/></g>`,
  ).join("");
  const links = AL_NODES.map((n) => `<path class="al-link al-link-${n.icon}" d="M${n.x} ${n.y}L${AL_CX} ${AL_CY}"/>`).join("");
  return `<div class="al-grid" aria-hidden="true"></div><div class="al-scene" aria-hidden="true"><svg viewBox="0 0 260 80" focusable="false">
    <defs>
      <radialGradient id="${id("halo")}" cx="${AL_CX}" cy="${AL_CY}" r="70" gradientUnits="userSpaceOnUse"><stop class="al-rc" offset="0" stop-opacity=".22"/><stop class="al-rc" offset="1" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id("fov")}" x1="0" y1="0" x2="1" y2="0"><stop class="al-rc" offset="0" stop-opacity=".45"/><stop class="al-rc" offset="1" stop-opacity="0"/></linearGradient>
      <linearGradient id="${id("scan")}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="${id("fovclip")}"><path d="M102 10 172 2v62Z"/></clipPath>
    </defs>
    <circle class="al-halo" cx="${AL_CX}" cy="${AL_CY}" r="70" fill="url(#${id("halo")})"/>
    ${[18, 30, 42, 54].map((r) => `<circle class="al-ring" cx="${AL_CX}" cy="${AL_CY}" r="${r}"/>`).join("")}
    <path class="al-tick" d="${AL_TICKS}"/>
    <path class="al-cross" d="M${AL_CX - 70} ${AL_CY}H${AL_CX + 70}M${AL_CX} ${AL_CY - 70}V${AL_CY + 70}M${AL_CX - 49} ${AL_CY - 49}L${AL_CX + 49} ${AL_CY + 49}M${AL_CX - 49} ${AL_CY + 49}L${AL_CX + 49} ${AL_CY - 49}"/>
    <g class="al-sweep">${AL_TRAIL}<path class="al-sweep-line" d="M${AL_CX} ${AL_CY}H${AL_CX + 70}"/></g>
    <circle class="al-arc" cx="${AL_CX}" cy="${AL_CY}" r="75"/>
    <path class="al-hud" d="M${AL_CX - 66} 9v-5h7M${AL_CX - 66} 72v4h7"/>
    <rect class="al-scanline" x="112" y="0" width="148" height="1.2"/>
    <g class="al-rec"><circle class="al-rec-dot" cx="78" cy="74.6" r="1.3"/><text class="al-rec-text" x="80.6" y="76.4">REC</text></g>
    ${links}
    <g class="al-cam"><g class="al-cam-head">
      <g class="al-fov"><path d="M102 10 172 2v62Z" fill="url(#${id("fov")})"/><g clip-path="url(#${id("fovclip")})"><rect class="al-fov-scan" x="102" y="0" width="22" height="70" fill="url(#${id("scan")})"/></g><path class="al-fov-edge" d="M102 10 172 2M102 12 172 64"/></g>
      <g transform="translate(74 0) scale(1.5) translate(-70 0)">
        <rect class="al-cam-body" x="70.5" y="3.4" width="17" height="6.4" rx="2.8"/><rect class="al-cam-under" x="70.5" y="7.6" width="17" height="2.2" rx="1.1"/>
        <path class="al-cam-hood" d="M71.6 3.8c0-1.4.9-2.1 2.1-2.1h15.2c.8 0 1.2 1.2.5 1.7l-.9.7H71.6Z"/>
        <circle class="al-lens-o" cx="87" cy="6.6" r="2.8"/><circle class="al-lens" cx="87" cy="6.6" r="2.1"/><circle class="al-lens-g" cx="87.4" cy="6.1" r=".9"/><circle class="al-lens-w" cx="87.8" cy="5.7" r=".35"/>
        <circle class="al-cam-led" cx="74.4" cy="6" r=".85"/><g class="al-ir"><circle cx="87" cy="3.4" r=".4"/><circle cx="87" cy="9.8" r=".4"/><circle cx="84.2" cy="6.6" r=".4"/></g>
      </g>
    </g><rect class="al-mount" x="72.4" y="0" width="3.4" height="8" rx=".9"/><circle class="al-mount" cx="74.1" cy="8.4" r="2.2"/></g>
    ${nodes}
  </svg></div>`;
};

// The banner's colours and animations, day and night. Calm: a steady light while armed, a blinking one
// during a delay, a soft red pulse when the alarm goes off.
export const SCENE_STYLE = `
  .banner { position: relative; overflow: hidden; height: 90px; flex: none; color: #10283f; --al-scene-w: min(190px, 100cqw - 232px); --rc: #8ea3b8;
            background: linear-gradient(90deg, #f3f7fb 0%, #e9f0f7 45%, #dde7f1 100%); }
  .banner.dark { color: #fff; background: linear-gradient(90deg, #16233a 0%, #0f1a2e 45%, #0a1322 100%); --rc: #4f6582; }
  .banner:is(.home, .away, .night, .vacation, .custom, .wait, .alarm) { --rc: var(--c); }
  /* The ground strip: a graduated scale with a lit edge in the radar colour. */
  .al-ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px;
               background: repeating-linear-gradient(90deg, #cbd6e1 0 11px, #a3b4c5 11px 12px);
               box-shadow: inset 0 1px 0 color-mix(in srgb, var(--rc) 80%, transparent), 0 -3px 6px -2px color-mix(in srgb, var(--rc) 40%, transparent); }
  .dark .al-ground { background: repeating-linear-gradient(90deg, #15233a 0 11px, #2a4161 11px 12px); }
  /* A surveillance grid fading out towards the text. */
  .al-grid { position: absolute; inset: 0 0 10px 0; background-size: 12px 12px; background-position: right 0 top 0;
             background-image: linear-gradient(rgba(30,70,110,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(30,70,110,.09) 1px, transparent 1px);
             -webkit-mask-image: linear-gradient(90deg, transparent 35%, #000 80%); mask-image: linear-gradient(90deg, transparent 35%, #000 80%); }
  .dark .al-grid { background-image: linear-gradient(rgba(120,200,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(120,200,255,.07) 1px, transparent 1px); }
  /* The radar stops at the text's right edge; its picture keeps its scale (1 px per unit), its centre on the shield. */
  .al-scene { position: absolute; right: 0; bottom: 10px; height: 80px; width: calc(var(--al-scene-w) + 4px); overflow: hidden; }
  .al-scene svg { position: absolute; right: 0; bottom: 0; width: 260px; height: 80px; }
  .banner.has-zoom .al-scene { width: calc(var(--al-scene-w) + 30px); }
  .banner.has-zoom .al-scene svg { right: 16px; }
  /* Parts too close to the text on a narrow card are left out rather than cut. */
  @container al-card (max-width: 419px) { .banner:not(.has-zoom) :is(.al-cam, .al-rec) { display: none; } }
  @container al-card (max-width: 388px) { .banner:not(.has-zoom) :is(.al-node-window, .al-link-window) { display: none; } }
  @container al-card (max-width: 354px) { .banner:not(.has-zoom) :is(.al-node-motion, .al-link-motion) { display: none; } }
  @container al-card (max-width: 346px) { .banner:not(.has-zoom) :is(.al-node-door, .al-link-door) { display: none; } }
  @container al-card (max-width: 314px) { .banner:not(.has-zoom) :is(.al-node-siren, .al-link-siren) { display: none; } }
  @container al-card (max-width: 405px) { .banner.has-zoom :is(.al-cam, .al-rec) { display: none; } }
  @container al-card (max-width: 374px) { .banner.has-zoom :is(.al-node-window, .al-link-window) { display: none; } }
  @container al-card (max-width: 340px) { .banner.has-zoom :is(.al-node-motion, .al-link-motion) { display: none; } }
  @container al-card (max-width: 332px) { .banner.has-zoom :is(.al-node-door, .al-link-door) { display: none; } }
  @container al-card (max-width: 300px) { .banner.has-zoom :is(.al-node-siren, .al-link-siren) { display: none; } }
  /* The radar. */
  .al-rc { stop-color: var(--rc); }
  .al-halo { opacity: .6; } .banner.off .al-halo { opacity: 0; }
  .al-ring { fill: none; stroke: var(--rc); stroke-width: .6; opacity: .45; }
  .al-tick { stroke: var(--rc); stroke-width: .7; opacity: .5; }
  .al-cross { stroke: var(--rc); stroke-width: .4; opacity: .22; stroke-dasharray: 1.5 2.5; }
  .al-trail { fill: var(--rc); } .al-sweep-line { stroke: var(--rc); stroke-width: .8; opacity: .8; }
  .al-sweep, .al-arc { transform-box: view-box; transform-origin: 220px 40px; }
  .al-sweep { display: none; }
  .banner:is(.home, .away, .night, .vacation, .custom, .wait, .alarm) .al-sweep { display: inline; animation: al-spin 6s linear infinite; }
  .banner.wait .al-sweep { animation-duration: 2.6s; } .banner.alarm .al-sweep { animation-duration: 1.4s; }
  .al-arc { fill: none; stroke: var(--rc); stroke-width: 1; opacity: .35; stroke-dasharray: 14 6 3 6; }
  .banner:is(.home, .away, .night, .vacation, .custom, .wait, .alarm) .al-arc { animation: al-spin 24s linear infinite reverse; }
  .al-hud { fill: none; stroke: var(--rc); stroke-width: .9; opacity: .6; }
  .al-scanline { fill: var(--rc); opacity: 0; }
  .banner:is(.home, .away, .night, .vacation, .custom) .al-scanline { animation: al-scanline 4.5s linear infinite; }
  .al-rec-text { font: 700 4.6px/1 system-ui, sans-serif; fill: var(--rc); letter-spacing: .3px; } .al-rec-dot { fill: var(--rc); }
  .banner.off .al-rec { opacity: .5; } .banner:is(.home, .away, .night, .vacation, .custom, .wait, .alarm) .al-rec-dot { animation: al-blink 1.2s steps(2) infinite; }
  /* The sensors, each pinging as the sweep passes it. */
  .al-link { fill: none; stroke: var(--rc); stroke-width: .6; opacity: .35; stroke-dasharray: 2 2.5; }
  .banner:is(.home, .away, .night, .vacation, .custom, .wait, .alarm) .al-link { opacity: .6; animation: al-flow 1.2s linear infinite; }
  .al-node, .al-node-ping { transform-box: fill-box; transform-origin: center; }
  .al-node-ping { fill: none; stroke: var(--rc); stroke-width: .6; opacity: 0; }
  .al-node-disc { fill: rgba(255,255,255,.85); stroke: var(--rc); stroke-width: .9; } .dark .al-node-disc { fill: rgba(16,28,48,.9); }
  .al-node-icon { fill: var(--rc); }
  .banner:is(.home, .away, .night, .vacation, .custom) .al-node-ping { animation: al-ping 6s ease-out infinite; animation-delay: calc(var(--turn) * 6s); }
  .banner:is(.home, .away, .night, .vacation, .custom) .al-node-disc { animation: al-hit 6s ease-out infinite; animation-delay: calc(var(--turn) * 6s); }
  .banner.wait .al-node { animation: al-blink 1.2s ease-in-out infinite; }
  .banner.wait .al-node-motion { animation-delay: .3s; } .banner.wait .al-node-window { animation-delay: .6s; } .banner.wait .al-node-siren { animation-delay: .9s; }
  .banner.alarm .al-node-window .al-node-ping { animation: al-ping 1.1s ease-out infinite; }
  .banner.alarm .al-node-window .al-node-disc { fill: var(--rc); } .banner.alarm .al-node-window .al-node-icon { fill: #fff; }
  .banner.alarm::before { content: ""; position: absolute; inset: 0; animation: al-pulse 1.4s ease-in-out infinite;
                          background: radial-gradient(circle at calc(100% - 40px) 40px, color-mix(in srgb, var(--c) 35%, transparent), transparent 70%); }
  .banner.alarm.has-zoom::before { background: radial-gradient(circle at calc(100% - 56px) 40px, color-mix(in srgb, var(--c) 35%, transparent), transparent 70%); }
  /* The camera. */
  .al-cam-body { fill: #f6f8fa; stroke: #9aa6b4; stroke-width: .35; } .al-cam-under { fill: #d3dae2; }
  .al-cam-hood { fill: #e1e7ed; stroke: #9aa6b4; stroke-width: .35; }
  .dark .al-cam-body { fill: #a3adbf; stroke: none; } .dark .al-cam-under { fill: #76829a; } .dark .al-cam-hood { fill: #8a95a9; stroke: none; }
  .al-lens-o { fill: #2b3442; } .al-lens { fill: #1d2530; } .al-lens-g { fill: #5d7a99; } .al-lens-w { fill: #fff; opacity: .8; }
  .al-mount { fill: #56616f; } .dark .al-mount { fill: #7c889c; }
  .al-cam-led { fill: #43a047; }
  .banner:is(.home, .away, .night, .vacation, .custom, .wait, .alarm) .al-cam-led { fill: var(--rc); filter: drop-shadow(0 0 1.5px var(--rc)); }
  .banner.wait .al-cam-led, .banner.alarm .al-cam-led { animation: al-blink .8s ease-in-out infinite; }
  .al-ir { display: none; fill: #ff5a5f; } .banner.dark:is(.home, .away, .night, .vacation, .custom, .wait, .alarm) .al-ir { display: inline; }
  .al-cam-head { transform-box: view-box; transform-origin: 74.1px 8.4px; transform: rotate(38deg); }
  .banner:is(.home, .away, .night, .vacation, .custom) .al-cam-head { animation: al-pan 8s ease-in-out infinite alternate; }
  .banner.wait .al-cam-head { transform: rotate(14deg); }
  .banner.alarm .al-cam-head { animation: al-pan 1.6s ease-in-out infinite alternate; }
  .al-fov { display: none; } .banner:is(.home, .away, .night, .vacation, .custom, .wait, .alarm) .al-fov { display: inline; }
  .al-fov-edge { fill: none; stroke: var(--rc); stroke-width: .5; opacity: .6; }
  .al-fov-scan { animation: al-fov-scan 2.4s linear infinite; }
  @keyframes al-spin { to { transform: rotate(360deg); } }
  @keyframes al-flow { to { stroke-dashoffset: -9; } }
  @keyframes al-ping { 0% { opacity: .8; transform: scale(.7); } 30% { opacity: 0; transform: scale(1.5); } 100% { opacity: 0; } }
  @keyframes al-hit { 0% { filter: drop-shadow(0 0 3px var(--rc)); } 25%, 100% { filter: none; } }
  @keyframes al-pan { from { transform: rotate(6deg); } to { transform: rotate(22deg); } }
  @keyframes al-scanline { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: .22; } 90% { opacity: .15; } 100% { transform: translateY(80px); opacity: 0; } }
  @keyframes al-fov-scan { 0% { transform: translateX(-20px); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateX(70px); opacity: 0; } }
  @keyframes al-blink { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
  @keyframes al-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
  /* The big state shield stands at the radar's centre, at the right. */
  .banner .al-shield { position: absolute; top: 4px; right: 4px; width: 72px; height: 72px; z-index: 1; }
  .banner .al-shield .shield { width: 100%; height: 100%; }
  .banner.has-zoom .al-shield { right: 20px; }
  /* The text on the sky at the left: the round state icon, the title and the state. */
  .banner .htext { position: absolute; z-index: 2; left: 12px; top: 0; bottom: 10px; right: calc(var(--al-scene-w) + 4px);
                   display: flex; align-items: center; gap: 10px; padding: 0; min-width: 0; flex-wrap: nowrap; }
  .banner.has-zoom .htext { right: calc(var(--al-scene-w) + 30px); }
  /* Mini card: the picture beside the detail button. */
  .banner.has-zoom { --al-scene-w: min(190px, 100cqw - 228px); }
  .banner .htext .titles { container: al-titles / inline-size; flex: 1 1 0; align-self: stretch; min-width: 0; margin: 0; display: grid; grid-template-columns: minmax(0, 1fr); align-content: center; row-gap: 2px; }
  .banner .chip { box-sizing: border-box;
                  background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.dark .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .banner .chip .dot { width: 7px; height: 7px; }
  .banner .ibadge { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none; color: var(--c);
                    background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 22%, transparent); }
  .banner.dark .ibadge { color: color-mix(in srgb, var(--c) 72%, #ffffff); background: rgba(255,255,255,.12);
                         box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .banner .ibadge .icon { width: 24px; height: 24px; }
  .banner .name { color: inherit; }
  .banner .sub { color: #3d5670; font-size: 13px; line-height: 16px; }
  .banner.dark .sub { color: rgba(255,255,255,.8); }
  /* The mini card's expand / collapse button: a 24 px glass disc in the banner's top-right corner. */
  .banner .zoom { position: absolute; z-index: 3; top: 5px; right: 5px; margin: 0; width: 24px; height: 24px; color: #33506b;
                  background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
  .banner.dark .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner .zoom:hover { background: rgba(255,255,255,.75); }
  .banner.dark .zoom:hover { background: rgba(255,255,255,.22); }
  /* Narrower card: the radar gives its room to the text, the shield stays; narrower still, the plain background alone. */
  @container (max-width: 300px) {
    .al-scene { display: none; }
    .banner .htext { right: 78px; } .banner.has-zoom .htext { right: 98px; }
  }
  @container (max-width: 230px) {
    .banner .al-shield { display: none; }
    .banner .htext { right: 12px; } .banner.has-zoom .htext { right: 36px; }
  }
  /* Phone width: the title keeps its room, the state is already in the text. */
  @container (max-width: 180px) { .banner .ibadge { display: none; } }
  /* The status pill right after the title, its whole label on one line, while the title stays whole beside it
     (measured by the card, see _fitPill); otherwise on its own line under a one-line subtitle, and with its dot alone
     when even that does not fit the header. */
  .tline { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .tline > .name { flex: 0 1 auto; min-width: 0; }
  .tline > .chip { flex: none; max-width: none; }
  .tline > .chip .chip-text { white-space: nowrap; overflow: visible; }
  .banner .titles.below { display: grid; grid-template-columns: minmax(0, 1fr); align-content: center; }
  .banner .titles.below > .tline { display: contents; }
  .banner .titles.below > .tline > .chip { order: 3; justify-self: start; align-self: start; margin-top: 3px; }
  .banner .titles.below > .sub { order: 2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .banner .titles.dot-only > .tline { display: flex; }
  .banner .titles.dot-only > .tline > .chip { order: 0; margin-top: 0; align-self: center; padding: 4px; }
  .banner .titles.dot-only > .tline > .chip .chip-text { display: none; }
  /* Narrow card: a smaller icon; below 200 px, the pill keeps its dot alone. */
  @container (max-width: 300px) {
    .banner .htext { gap: 6px; }
    .banner .ibadge { width: 32px; height: 32px; }
    .banner .ibadge .icon { width: 20px; height: 20px; }
    /* Mini card: a smaller shield next to the detail button leaves the pill its whole label. */
    .banner.has-zoom .al-shield { width: 70px; height: 70px; top: 9px; }
  }
  @container al-card (max-width: 200px) { .banner .chip { padding: 4px; } .banner .chip .chip-text { display: none; } }
  @media (prefers-reduced-motion: reduce) { .banner, .banner * { animation: none !important; transition: none !important; } }
`;
