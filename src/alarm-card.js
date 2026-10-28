/*
 * Alarm Card for Home Assistant
 * https://github.com/juju35/ha-alarm-card
 *
 * Lovelace cards for alarm control panels (https://www.home-assistant.io/integrations/alarm_control_panel/):
 * Alarmo, Manual, and any other integration. The arm modes come from the entity's supported features, the
 * keypad from its code format, and Alarmo's extra attributes (open sensors, delays, who changed it) are used
 * when they are there.
 */

const VERSION = "__VERSION__";

const ICONS = {
  shield: "M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z",
  shield_off:
    "M1,4.27L2.28,3L21,21.72L19.73,23L17.08,20.35C15.65,21.62 13.9,22.53 12,23C6.84,21.74 3,16.55 3,11V6.27L1,4.27M12,1L21,5V11C21,13.28 20.34,15.5 19.26,17.42L5.23,3.39L12,1Z",
  shield_check: "M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z",
  shield_alert: "M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M11,7H13V13H11V7M11,15H13V17H11V15Z",
  home: "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
  away: "M12,2A3,3 0 0,1 15,5A3,3 0 0,1 12,8A3,3 0 0,1 9,5A3,3 0 0,1 12,2M10.5,9H13.5L16,15.5L14.5,16L13,13V22H11V17H10V22H8V13L6.5,16L5,15.5L7.5,9.5Z",
  night: "M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95Z",
  vacation: "M17,7H20V9H17V21H15V9H9V21H7V9H4V7H7V4A1,1 0 0,1 8,3H16A1,1 0 0,1 17,4V7M9,5V7H15V5H9Z",
  custom: "M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10Z",
  unlock: "M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10A2,2 0 0,1 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17Z",
  timer: "M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z",
  alert: "M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z",
  history:
    "M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3",
  user: "M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z",
  door: "M8,3C6.89,3 6,3.89 6,5V21H18V5C18,3.89 17.11,3 16,3H8M8,5H16V19H8V5M13,11V13H15V11H13Z",
  door_open: "M12,3C10.89,3 10,3.89 10,5H3V19H2V21H22V19H21V5C21,3.89 20.11,3 19,3H12M12,5H19V19H12V5M5,11H7V13H5V11Z",
  window: "M6,11H10V9H14V11H18V4H6V11M18,13H6V20H18V13M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2Z",
  window_open:
    "M6,8H10V6H14V8H18V4H6V8M18,10H6V15H18V10M6,20H18V17H6V20M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2Z",
  garage: "M22,9V20H20V11H4V20H2V9L12,5L22,9M19,12H5V14H19V12M19,18H5V20H19V18M19,15H5V17H19V15Z",
  motion:
    "M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z",
  smoke: "M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L15.5,18C14.97,18 14.5,18 12,18M17.3,14.8L8.5,6C9.03,6 9.5,6 12,6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  water: "M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z",
  sensor: "M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z",
  backspace:
    "M22,3H7C6.31,3 5.77,3.35 5.41,3.88L0,12L5.41,20.11C5.77,20.64 6.31,21 7,21H22A2,2 0 0,0 24,19V5A2,2 0 0,0 22,3M19,15.59L17.59,17L14,13.41L10.41,17L9,15.59L12.59,12L9,8.41L10.41,7L14,10.59L17.59,7L19,8.41L15.41,12",
  chevron_down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  // mdi:arrow-expand and mdi:arrow-collapse (mini card detail button)
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
};

const STRINGS = {
  en: {
    title: "Alarm",
    disarm: "Disarm",
    arm_home: "Home",
    arm_away: "Away",
    arm_night: "Night",
    arm_vacation: "Vacation",
    arm_custom_bypass: "Custom",
    cancel: "Cancel",
    ok: "OK",
    arm_anyway: "Arm anyway",
    code_for: "Code to {action}",
    code_placeholder: "Code",
    clear: "Clear",
    since: "for {d}",
    just_now: "just now",
    by: "by {name}",
    arming_in: "Armed in {d}",
    pending_in: "Alarm in {d}",
    open_sensors: "Open: {list}",
    open_confirm: "{list}: open. Arm {mode} anyway?",
    bypassed: "Bypassed: {list}",
    last_triggered: "Last triggered {when}",
    never_triggered: "Never triggered",
    sensors: "Sensors",
    all_closed: "All closed",
    n_open: "{n} open",
    open: "Open",
    closed: "Closed",
    detected: "Detected",
    clear_state: "Clear",
    alert: "Alert",
    ok_state: "OK",
    min: "min",
    h: "h",
    d: "d",
    no_alarm: "No alarm panel found.",
    unknown_entity: "Alarm panel not found",
    // States
    s_disarmed: "Disarmed",
    s_armed_home: "Armed home",
    s_armed_away: "Armed away",
    s_armed_night: "Armed night",
    s_armed_vacation: "Armed vacation",
    s_armed_custom_bypass: "Armed custom",
    s_arming: "Arming",
    s_disarming: "Disarming",
    s_pending: "Pending",
    s_triggered: "Triggered",
    s_unavailable: "Unavailable",
    s_unknown: "Unknown",
    // Editor
    entity: "Alarm panel",
    title_option: "Title (optional, defaults to the panel name)",
    modes: "Arm modes shown (all supported ones when empty)",
    sensors_option: "Sensors to display",
    show_logo: "Show logo",
    show_sensors: "Show sensors",
    show_info: "Show last trigger and who changed it",
    confirm_disarm: "Ask for confirmation before disarming",
    collapsed: "Fold the sensors by default",
    zoom: "Detail button",
    zoom_helper: "Button at the top right that switches the mini card to the full card and back",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    language: "Language",
    lang_auto: "Automatic",
    disarm_confirm: "Disarm the alarm?",
  },
  fr: {
    title: "Alarme",
    disarm: "Désarmer",
    arm_home: "Domicile",
    arm_away: "Absent",
    arm_night: "Nuit",
    arm_vacation: "Vacances",
    arm_custom_bypass: "Personnalisé",
    cancel: "Annuler",
    ok: "OK",
    arm_anyway: "Armer quand même",
    code_for: "Code pour {action}",
    code_placeholder: "Code",
    clear: "Effacer",
    since: "depuis {d}",
    just_now: "à l'instant",
    by: "par {name}",
    arming_in: "Armée dans {d}",
    pending_in: "Alarme dans {d}",
    open_sensors: "Ouvert : {list}",
    open_confirm: "{list} : ouvert. Armer en mode {mode} quand même ?",
    bypassed: "Exclus : {list}",
    last_triggered: "Dernier déclenchement {when}",
    never_triggered: "Jamais déclenchée",
    sensors: "Capteurs",
    all_closed: "Tout est fermé",
    n_open: "{n} ouvert(s)",
    open: "Ouvert",
    closed: "Fermé",
    detected: "Détecté",
    clear_state: "Rien",
    alert: "Alerte",
    ok_state: "OK",
    min: "min",
    h: "h",
    d: "j",
    no_alarm: "Aucune centrale d'alarme trouvée.",
    unknown_entity: "Centrale d'alarme introuvable",
    s_disarmed: "Désarmée",
    s_armed_home: "Armée domicile",
    s_armed_away: "Armée absent",
    s_armed_night: "Armée nuit",
    s_armed_vacation: "Armée vacances",
    s_armed_custom_bypass: "Armée personnalisé",
    s_arming: "Armement",
    s_disarming: "Désarmement",
    s_pending: "Entrée détectée",
    s_triggered: "Déclenchée",
    s_unavailable: "Indisponible",
    s_unknown: "Inconnu",
    entity: "Centrale d'alarme",
    title_option: "Titre (facultatif, nom de la centrale par défaut)",
    modes: "Modes affichés (tous ceux pris en charge si vide)",
    sensors_option: "Capteurs à afficher",
    show_logo: "Afficher le logo",
    show_sensors: "Afficher les capteurs",
    show_info: "Afficher le dernier déclenchement et l'auteur",
    confirm_disarm: "Demander confirmation avant de désarmer",
    collapsed: "Replier les capteurs par défaut",
    zoom: "Bouton de détail",
    zoom_helper: "Bouton en haut à droite qui passe la mini-carte en carte complète et inversement",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    language: "Langue",
    lang_auto: "Automatique",
    disarm_confirm: "Désarmer l'alarme ?",
  },
};

// Arm modes: [mode, supported feature bit, icon]. Order of the buttons.
const MODES = [
  ["arm_home", 1, ICONS.home],
  ["arm_away", 2, ICONS.away],
  ["arm_night", 4, ICONS.night],
  ["arm_vacation", 32, ICONS.vacation],
  ["arm_custom_bypass", 16, ICONS.custom],
];
const MODE_ICON = Object.fromEntries(MODES.map(([m, , i]) => [m, i]));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// Seconds → "45 s" / "1:05" countdown.
const fmtCountdown = (sec) => {
  const s = Math.max(0, Math.ceil(sec));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Seconds → "12 min", "3 h 05", "2 d" (units from the strings).
const fmtDuration = (sec, tr) => {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${Math.max(1, m)} ${tr("min")}`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h} ${tr("h")} ${String(m % 60).padStart(2, "0")}` : `${h} ${tr("h")}`;
  return `${Math.floor(h / 24)} ${tr("d")}`;
};

// Alarmo writes "2026-08-09 19:28:27" (local time, no zone): read it as local time.
const parseTime = (v) => {
  if (!v) return NaN;
  return Date.parse(/^\d{4}-\d\d-\d\d \d/.test(v) ? v.replace(" ", "T") : v);
};

const RTF = {};
const ago = (l, ms, now = Date.now()) => {
  if (!Number.isFinite(ms)) return null;
  const diff = (ms - now) / 1000;
  const rtf = (RTF[l] ??= new Intl.RelativeTimeFormat(l, { numeric: "auto" }));
  const abs = Math.abs(diff);
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
};

// State → color class: off (disarmed), the mode of an armed panel, wait (arming / pending), alarm, idle.
const stateClass = (state) => {
  const s = String(state || "");
  if (s === "disarmed") return "off";
  if (s === "triggered") return "alarm";
  if (/^(arming|pending|disarming)$/.test(s)) return "wait";
  if (s.startsWith("armed_")) return s.slice(6).replace("custom_bypass", "custom");
  return "idle";
};

const stateIcon = (state) => {
  const c = stateClass(state);
  if (c === "off") return ICONS.shield_off;
  if (c === "alarm") return ICONS.shield_alert;
  if (c === "wait") return ICONS.shield;
  if (c === "idle") return ICONS.shield_off;
  return ICONS.shield_check;
};

// Arm modes the panel supports, in button order, narrowed to `modes` when set.
const supportedModes = (stateObj, modes) => {
  const f = Number(stateObj?.attributes?.supported_features) || 0;
  const all = MODES.filter(([, bit]) => f & bit).map(([m]) => m);
  const wanted = (Array.isArray(modes) ? modes : []).map((m) => (m.startsWith("arm_") ? m : `arm_${m}`));
  return wanted.length ? wanted.filter((m) => all.includes(m)) : all;
};

// Seconds left of the exit (arming) or entry (pending) delay: Alarmo's `delay` from the last change, or the
// `expiration` attribute some integrations set ({ left, total } in seconds, total null when unknown). null
// when no delay is known.
const remaining = (stateObj, now = Date.now()) => {
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
const SENSOR_KIND = {
  door: ["opening", ICONS.door, ICONS.door_open],
  window: ["opening", ICONS.window, ICONS.window_open],
  garage_door: ["opening", ICONS.garage, ICONS.garage],
  opening: ["opening", ICONS.door, ICONS.door_open],
  motion: ["motion", ICONS.motion, ICONS.motion],
  occupancy: ["motion", ICONS.motion, ICONS.motion],
  presence: ["motion", ICONS.motion, ICONS.motion],
  smoke: ["problem", ICONS.smoke, ICONS.smoke],
  moisture: ["problem", ICONS.water, ICONS.water],
};

// `sensors` items: "binary_sensor.x" or { entity, name }.
const normalize = (items) =>
  (Array.isArray(items) ? items : [])
    .map((e) => (typeof e === "string" ? { entity: e } : e))
    .filter((e) => e?.entity);

// Alarmo's open_sensors / bypassed_sensors: { entity_id: state } or a list of entity ids.
const entityList = (v) => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.keys(v) : []);

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML (as in ha-presence-card): nodes whose tag is unchanged are
// kept, so keyboard focus, hover, the code input and CSS animations survive an update. Rows carry a data-key
// and are matched by it, other nodes by position.
const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
const patchChildren = (cur, next) => {
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
const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

// Card logo: a shield sending out radar waves, drawn in the accent color on a round tinted badge like the other
// ha-* cards.
const logo = () => `<div class="badge"><svg class="icon" viewBox="6 6 36 36" role="img" aria-label="Alarm">
  <path d="M24 8 11 13.5v9c0 8.3 5.5 15.4 13 17.5 7.5-2.1 13-9.2 13-17.5v-9Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
  <circle cx="24" cy="24" r="2.6"/>
  <path d="M20.3 20.3a5.2 5.2 0 0 0 0 7.4M27.7 20.3a5.2 5.2 0 0 1 0 7.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M17.2 17.2a9.6 9.6 0 0 0 0 13.6M30.8 17.2a9.6 9.6 0 0 1 0 13.6" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
</svg></div>`;

// Big state shield of the full card (and the small one of the mini card): pulses while a delay runs, flashes
// when the alarm goes off.
const shield = (state) => `<div class="shield ${stateClass(state)}">${svgIcon(stateIcon(state))}</div>`;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --al-accent: #e5484d; --al-off: var(--success-color, #43a047); --al-home: #f59f00; --al-away: var(--error-color, #db4437);
          --al-night: #7048e8; --al-vacation: #1098ad; --al-custom: #ae3ec9; --al-wait: var(--warning-color, #ffa600);
          --al-alarm: var(--error-color, #db4437); --al-idle: var(--disabled-text-color, #9e9e9e); }
  ha-card { overflow: hidden; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible, .btn:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .off { --c: var(--al-off); } .home { --c: var(--al-home); } .away { --c: var(--al-away); } .night { --c: var(--al-night); }
  .vacation { --c: var(--al-vacation); } .custom { --c: var(--al-custom); } .wait { --c: var(--al-wait); }
  .alarm { --c: var(--al-alarm); } .idle { --c: var(--al-idle); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--al-off)) 15%, transparent); color: var(--c, var(--al-off)); flex: none; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 0; }
  .badge { --c: var(--al-accent); width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge .icon { width: 24px; height: 24px; }
  .titles { flex: 1; min-width: 0; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: var(--al-wait); }
  .shield { flex: none; display: grid; place-items: center; border-radius: 50%; color: var(--c);
            background: color-mix(in srgb, var(--c) 14%, transparent); transition: color .4s ease, background .4s ease; }
  .shield.wait { animation: al-pulse 1.4s ease-in-out infinite; }
  .shield.alarm { animation: al-flash .7s steps(2, jump-none) infinite; }
  @keyframes al-pulse { 50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--c) 0%, transparent), 0 0 0 0 color-mix(in srgb, var(--c) 35%, transparent);
                              background: color-mix(in srgb, var(--c) 26%, transparent); } }
  @keyframes al-flash { from { background: color-mix(in srgb, var(--c) 14%, transparent); } to { background: var(--c); color: #fff; } }
  @media (prefers-reduced-motion: reduce) { .shield { animation: none !important; } }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .line { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  .line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .line .icon { width: 14px; height: 14px; }
  .alert-line { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--c, var(--al-wait)); min-width: 0; }
  .alert-line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .alert-line .icon { width: 14px; height: 14px; }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--al-wait)); transition: width 1s linear; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; cursor: pointer; font: inherit; font-size: 13px;
         font-weight: 500; padding: 6px 12px; border-radius: 18px; background: var(--secondary-background-color, rgba(127,127,127,.12));
         color: var(--primary-text-color); min-width: 0; }
  .btn:hover { background: color-mix(in srgb, var(--c, var(--al-accent)) 14%, var(--secondary-background-color, rgba(127,127,127,.12))); }
  .btn .icon { width: 18px; height: 18px; color: var(--c, var(--primary-text-color)); }
  .btn.primary { background: color-mix(in srgb, var(--c, var(--al-accent)) 16%, transparent); color: var(--c, var(--al-accent)); }
  .btn.primary:hover { background: color-mix(in srgb, var(--c, var(--al-accent)) 24%, transparent); }
  .btn.round { width: 36px; height: 36px; padding: 0; border-radius: 50%; }
  .btn.disabled { opacity: .45; cursor: default; }
  .pad { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 12px; border: 1px solid var(--divider-color, rgba(127,127,127,.25)); }
  .pad-title { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; }
  .pad-title .icon { width: 18px; height: 18px; color: var(--c, var(--al-accent)); }
  .pad input { font: inherit; font-size: 18px; letter-spacing: .3em; text-align: center; padding: 8px; border-radius: 10px; box-sizing: border-box; width: 100%;
               border: 1px solid var(--divider-color, rgba(127,127,127,.35)); background: transparent; color: var(--primary-text-color); }
  .dots { display: flex; justify-content: center; gap: 8px; min-height: 14px; align-items: center; }
  .dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--primary-text-color); }
  .dots .hint { font-size: 13px; color: var(--secondary-text-color); }
  .keys { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 260px; width: 100%; margin: 0 auto; }
  .keys .btn { height: 42px; font-size: 18px; font-weight: 400; border-radius: 12px; }
  .pad-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--al-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
`;

// In-card confirmation popup, as in the other ha-* cards: a backdrop over the card with a small dialog at
// the top of the card, so that it stays in view when the card is long.
const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 160px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal .msg { font-size: 14px; line-height: 1.4; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
`;

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// After the confirmation popup closes, clicks on the card are ignored for this long: the second click of a
// double click on OK would otherwise land on what lies under the button.
const CONFIRM_GUARD_MS = 400;

// Code pad actions are exempt from that guard: confirming a disarm opens the pad, and the first tap on a
// digit may well come within the guard window.
const PAD_ACTIONS = new Set(["key", "key_back", "pad_cancel", "pad_ok", "code_input"]);

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

class AlarmBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._toggled = new Set();
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    this.shadowRoot.addEventListener("input", (ev) => {
      if (ev.target?.dataset?.action === "code_input") {
        this._code = ev.target.value;
        this._update();
      }
    });
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if (ev.target?.dataset?.action === "code_input" && ev.key === "Enter") {
        ev.preventDefault();
        this._submitCode();
      } else if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
    // Escape closes the popup or the code pad (as Cancel), listened on the window while one is open.
    this._onKey = (ev) => {
      if (ev.key !== "Escape" || (!this._confirm && !this._pad)) return;
      ev.stopPropagation();
      if (this._confirm) this._closeConfirm();
      else this._closePad();
    };
    // A click elsewhere on the page closes the popup and the pad, and folds the sections back.
    this._onOutside = (ev) => {
      if (ev.composedPath().includes(this) || inDialog(ev)) return;
      if (!this._confirm && !this._pad && !this._toggled.size) return;
      this._confirm = null;
      this._pad = null;
      this._code = "";
      this._toggled = new Set();
      window.removeEventListener("keydown", this._onKey);
      this._update();
    };
  }

  // Durations move with the clock: a render check every second while a delay counts down (the signature
  // changes on the second), every minute otherwise (it only changes on the minute).
  connectedCallback() {
    this._startClock();
    document.addEventListener("click", this._onOutside, true);
    if (this._confirm || this._pad) window.addEventListener("keydown", this._onKey);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._timer = null;
    this._timerPeriod = null;
    document.removeEventListener("click", this._onOutside, true);
    window.removeEventListener("keydown", this._onKey);
  }

  // (Re)arm the render clock at the pace the current state needs. State changes themselves arrive through
  // `set hass`, which re-renders and brings the clock back here, so each pace switch follows the state.
  _startClock() {
    const period = this._hass && this._config && remaining(this._panel()) ? 1000 : 60000;
    if (this._timer && this._timerPeriod === period) return;
    clearInterval(this._timer);
    this._timerPeriod = period;
    this._timer = setInterval(() => {
      if (this._hass) this.hass = this._hass;
    }, period);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const sig = this._signature();
    if (sameSig(sig, this._sig)) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    if (config.sensors !== undefined && !Array.isArray(config.sensors)) throw new Error("sensors must be a list");
    this._config = { ...config };
    this._autoEntity = undefined;
    this._html = "";
    this._sig = null;
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _lang() {
    return lang(this._hass, this._config);
  }

  // Without a configured entity, the first alarm panel (alphabetically) is used; the scan of every state is
  // memoized, and redone only if the chosen entity disappears.
  _entityId() {
    if (this._config.entity) return this._config.entity;
    if (this._autoEntity && this._hass.states[this._autoEntity]) return this._autoEntity;
    this._autoEntity = Object.keys(this._hass.states)
      .filter((id) => id.startsWith("alarm_control_panel."))
      .sort()[0];
    return this._autoEntity;
  }

  _panel() {
    const id = this._entityId();
    return id ? this._hass.states[id] : undefined;
  }

  _sensors() {
    return normalize(this._config.sensors);
  }

  // What the render depends on: language, the panel, the sensors (configured, open and bypassed ones) and
  // the clock (second while a delay runs, minute otherwise).
  _signature() {
    const h = this._hass;
    const panel = this._panel();
    const now = Date.now();
    const sig = [h.language, h.locale?.language, h.entities, panel, remaining(panel) ? Math.floor(now / 1000) : Math.floor(now / 60000)];
    const a = panel?.attributes || {};
    for (const id of [...this._sensors().map((s) => s.entity), ...entityList(a.open_sensors), ...entityList(a.bypassed_sensors)]) sig.push(h.states[id]);
    return sig;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    if (this.isConnected) this._startClock();
    this._sig = sig ?? this._signature();
    let html = this._render();
    if (this._confirm) html = html.replace(/<ha-card([^>]*)>([\s\S]*)<\/ha-card>\s*$/, (_, _attrs, inner) => `<ha-card class="dialog-open">${inner}${this._confirmHtml()}</ha-card>`);
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
  }

  // ----- Actions -------------------------------------------------------------

  _onClick(ev) {
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!this._confirm && !PAD_ACTIONS.has(el?.dataset.action) && Date.now() - (this._confirmClosedAt ?? 0) < CONFIRM_GUARD_MS) {
      ev.stopPropagation();
      return;
    }
    // Popup open: only its buttons and the backdrop itself (outside the dialog) act.
    if (this._confirm) {
      ev.stopPropagation();
      const action = el?.dataset.action;
      if (action === "confirm_ok") {
        const { run } = this._confirm;
        this._closeConfirm();
        run();
      } else if (action === "confirm_cancel" || (action === "confirm_backdrop" && path[0] === el)) this._closeConfirm();
      return;
    }
    if (!el) return;
    ev.stopPropagation();
    const { action, entity, mode } = el.dataset;
    switch (action) {
      case "zoom":
        return this._toggleZoom?.(ev);
      case "mode":
        return this._request(mode);
      case "key":
        this._code = `${this._code || ""}${el.dataset.digit}`;
        return this._update();
      case "key_back":
        this._code = String(this._code || "").slice(0, -1);
        return this._update();
      case "pad_cancel":
        return this._closePad();
      case "pad_ok":
        return this._submitCode();
      case "code_input":
        return;
      case "toggle_section": {
        const k = el.dataset.section;
        this._toggled = new Set(this._toggled);
        if (this._toggled.has(k)) this._toggled.delete(k);
        else this._toggled.add(k);
        return this._update();
      }
      default:
        if (entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
    }
  }

  // Service call whose failure (wrong code, open sensors…) is already shown by Home Assistant as a toast.
  _call(domain, service, data) {
    return Promise.resolve(this._hass.callService(domain, service, data)).catch(() => {});
  }

  _needsCode(mode) {
    const a = this._panel()?.attributes || {};
    if (!a.code_format) return false;
    return mode === "disarm" || a.code_arm_required !== false;
  }

  _isAlarmo() {
    return this._hass.entities?.[this._entityId()]?.platform === "alarmo";
  }

  // Configured sensors that are open (or detecting): they would make the arming fail or trigger the alarm.
  _openSensors() {
    return this._sensors()
      .map((s) => this._hass.states[s.entity])
      .filter((s) => s?.state === "on");
  }

  _sensorName(id) {
    const item = this._sensors().find((s) => s.entity === id);
    return item?.name || this._hass.states[id]?.attributes?.friendly_name || id;
  }

  // Mode button: disarm (with confirmation when asked), or arm (warning first when sensors are open), with
  // the code pad first when the panel needs a code.
  _request(mode) {
    if (mode === "disarm") {
      const go = () => this._withCode(mode);
      if (this._config.confirm_disarm) return this._openConfirm({ text: this._t("disarm_confirm"), ok: this._t("disarm"), cls: "off", run: go });
      return go();
    }
    const open = this._openSensors();
    if (open.length)
      return this._openConfirm({
        text: this._t("open_confirm", { list: open.map((s) => this._sensorName(s.entity_id)).join(", "), mode: this._t(mode).toLowerCase() }),
        ok: this._t("arm_anyway"),
        cls: stateClass(`armed_${mode.slice(4)}`),
        run: () => this._withCode(mode, true),
      });
    return this._withCode(mode);
  }

  _withCode(mode, force = false) {
    if (!this._needsCode(mode)) return this._send(mode, undefined, force);
    this._pad = { mode, force };
    this._code = "";
    window.addEventListener("keydown", this._onKey);
    this._update();
    this.shadowRoot.querySelector?.(".pad input")?.focus();
  }

  _submitCode() {
    if (!this._pad || !this._code) return;
    const { mode, force } = this._pad;
    const code = this._code;
    this._closePad();
    this._send(mode, code, force);
  }

  _closePad() {
    this._pad = null;
    this._code = "";
    if (!this._confirm) window.removeEventListener("keydown", this._onKey);
    this._update();
  }

  // Arm or disarm. Arming over open sensors goes through Alarmo's own service with `force` (the standard
  // service would be refused); other integrations decide for themselves.
  _send(mode, code, force = false) {
    const entity_id = this._entityId();
    if (force && mode !== "disarm" && this._isAlarmo())
      return this._call("alarmo", "arm", { entity_id, mode: mode.slice(4), force: true, ...(code ? { code } : {}) });
    return this._call("alarm_control_panel", `alarm_${mode}`, { entity_id, ...(code ? { code } : {}) });
  }

  _openConfirm(confirm) {
    this._confirm = confirm;
    window.addEventListener("keydown", this._onKey);
    this._update();
    this.shadowRoot.querySelector?.(".modal .primary")?.focus();
  }

  _closeConfirm() {
    this._confirm = null;
    this._confirmClosedAt = Date.now();
    if (!this._pad) window.removeEventListener("keydown", this._onKey);
    this._update();
  }

  _confirmHtml() {
    const c = this._confirm;
    return `<style>${DIALOG_STYLE}</style><div class="backdrop" data-action="confirm_backdrop">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="msg">${esc(c.text)}</div>
        <div class="modal-actions">
          <button class="btn" data-action="confirm_cancel"><span>${esc(this._t("cancel"))}</span></button>
          <button class="btn primary ${c.cls || ""}" data-action="confirm_ok"><span>${esc(c.ok)}</span></button>
        </div>
      </div>
    </div>`;
  }

  // ----- Pieces ------------------------------------------------------------

  _stateText(st) {
    const k = `s_${st?.state}`;
    if (STRINGS[this._lang()][k]) return this._t(k);
    if (st && this._hass.formatEntityState) {
      try {
        return this._hass.formatEntityState(st);
      } catch (_e) {
        /* older Home Assistant */
      }
    }
    return String(st?.state ?? "");
  }

  // "for 2 h 05 · by Julien".
  _subtitle(st) {
    const tr = (k) => this._t(k);
    const bits = [];
    const since = (Date.now() - Date.parse(st.last_changed)) / 1000;
    if (Number.isFinite(since)) bits.push(since < 60 ? tr("just_now") : this._t("since", { d: fmtDuration(since, tr) }));
    const by = st.attributes?.changed_by;
    if (by && this._config.show_info !== false) bits.push(this._t("by", { name: by }));
    return bits.join(" · ");
  }

  _header(st) {
    const c = this._config;
    const cls = stateClass(st.state);
    return `
      <div class="header">
        ${c.show_logo !== false ? logo() : ""}
        <div class="titles">
          <div class="name">${esc(c.title || st.attributes?.friendly_name || this._t("title"))}</div>
          <div class="sub">${esc(this._subtitle(st))}</div>
        </div>
        <span class="chip clickable ${cls}" role="button" tabindex="0" data-entity="${esc(st.entity_id)}"><span class="dot"></span>${esc(this._stateText(st))}</span>
        ${this._zoomButton()}
      </div>`;
  }

  // Button at the far right of the header: only the mini card has one.
  _zoomButton() {
    return "";
  }

  // Delay countdown, open sensors reported by the panel, bypassed sensors: lines under the state.
  _lines(st, withBar) {
    const a = st.attributes || {};
    const out = [];
    const rem = remaining(st);
    if (rem) {
      const key = st.state === "pending" ? "pending_in" : "arming_in";
      out.push(`<div class="line">${svgIcon(ICONS.timer)}<span>${esc(this._t(key, { d: fmtCountdown(rem.left) }))}</span></div>`);
      if (withBar && rem.total) out.push(`<div class="bar ${stateClass(st.state)}"><div style="width:${((100 * rem.left) / rem.total).toFixed(1)}%"></div></div>`);
    }
    const open = entityList(a.open_sensors);
    if (open.length) {
      // Each name opens its own sensor's more-info: the names are spliced, already marked up, into the
      // escaped translated line through a placeholder no translation can contain.
      const names = open
        .map((id) => `<span class="clickable" role="button" tabindex="0" data-entity="${esc(id)}">${esc(this._sensorName(id))}</span>`)
        .join(", ");
      out.push(
        `<div class="alert-line ${st.state === "triggered" ? "alarm" : "wait"}">${svgIcon(ICONS.alert)}<span>${esc(this._t("open_sensors", { list: "\u0000" })).replace("\u0000", names)}</span></div>`
      );
    }
    const bypassed = entityList(a.bypassed_sensors);
    if (bypassed.length)
      out.push(`<div class="line">${svgIcon(ICONS.shield_off)}<span>${esc(this._t("bypassed", { list: bypassed.map((id) => this._sensorName(id)).join(", ") }))}</span></div>`);
    return out.join("");
  }

  // Mode buttons: the arm modes, and Disarm (Cancel while arming) when the panel is not disarmed.
  _modeButtons(st, round = false) {
    const modes = supportedModes(st, this._config.modes);
    const armedAs = st.state.startsWith("armed_") ? `arm_${st.state.slice(6)}` : null;
    const unavailable = /^(unavailable|unknown)$/.test(st.state);
    const btn = (mode, icon, label, cls, active) =>
      `<button class="btn ${round ? "round" : ""} ${cls} ${active ? "primary" : ""} ${unavailable ? "disabled" : ""}" ${
        unavailable ? "disabled" : ""
      } title="${esc(label)}" aria-pressed="${active}" data-key="${mode}" data-action="mode" data-mode="${mode}">${svgIcon(icon)}${round ? "" : `<span>${esc(label)}</span>`}</button>`;
    const list = [];
    if (st.state !== "disarmed")
      list.push(btn("disarm", ICONS.unlock, this._t(st.state === "arming" ? "cancel" : "disarm"), st.state === "triggered" ? "alarm" : "off", st.state === "triggered"));
    for (const m of modes) {
      if (round && armedAs === m) continue;
      list.push(btn(m, MODE_ICON[m], this._t(m), stateClass(`armed_${m.slice(4)}`), armedAs === m));
    }
    return list.join("");
  }

  // Code pad, opened by a mode button when the panel needs a code: digits for a number code, a field else.
  _padHtml(st) {
    const p = this._pad;
    if (!p) return "";
    const label = this._t(p.mode === "disarm" ? "disarm" : p.mode).toLowerCase();
    const cls = p.mode === "disarm" ? "off" : stateClass(`armed_${p.mode.slice(4)}`);
    const code = String(this._code || "");
    let body;
    if (st.attributes?.code_format === "number") {
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => `<button class="btn" data-action="key" data-key="k${k}" data-digit="${k}">${k}</button>`);
      body = `<div class="dots" aria-live="polite">${code ? "<i></i>".repeat(code.length) : `<span class="hint">${esc(this._t("code_placeholder"))}</span>`}</div>
        <div class="keys">${keys.join("")}
          <span></span><button class="btn" data-action="key" data-key="k0" data-digit="0">0</button>
          <button class="btn" data-action="key_back" title="${esc(this._t("clear"))}" aria-label="${esc(this._t("clear"))}">${svgIcon(ICONS.backspace)}</button>
        </div>`;
    } else {
      body = `<input type="password" autocomplete="off" data-action="code_input" placeholder="${esc(this._t("code_placeholder"))}">`;
    }
    return `<div class="pad ${cls}">
      <div class="pad-title">${svgIcon(p.mode === "disarm" ? ICONS.unlock : MODE_ICON[p.mode])}${esc(this._t("code_for", { action: label }))}</div>
      ${body}
      <div class="pad-actions">
        <button class="btn" data-action="pad_cancel"><span>${esc(this._t("cancel"))}</span></button>
        <button class="btn primary ${code ? "" : "disabled"}" data-action="pad_ok" ${code ? "" : "disabled"}><span>${esc(this._t("ok"))}</span></button>
      </div>
    </div>`;
  }

  _errorCard(key, extra = "") {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(extra ? `${this._t(key)}: ${extra}` : this._t(key))}</div></ha-card>`;
  }

  // Returns the panel state or an error card.
  _panelOrError() {
    const st = this._panel();
    if (st) return { st };
    return { error: this._config.entity ? this._errorCard("unknown_entity", this._config.entity) : this._errorCard("no_alarm") };
  }
}

// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------

const FULL_STYLE = `
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .hero { display: flex; align-items: center; gap: 14px; }
  .hero .shield { width: 72px; height: 72px; }
  .hero .shield .icon { width: 40px; height: 40px; }
  .state { font-size: 22px; font-weight: 400; line-height: 1.2; color: var(--c); }
  .modes { display: flex; flex-wrap: wrap; gap: 6px; }
  .modes .btn { flex: 1 1 auto; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title .chip { text-transform: none; letter-spacing: 0; }
  .section-title.toggle { cursor: pointer; user-select: none; }
  .section-title.toggle[aria-expanded="false"] { margin-bottom: 0; }
  .section-title .chevron { margin-left: auto; width: 16px; height: 16px; transition: transform .2s ease; }
  .section-title.toggle[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 6px; }
  .tile { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .icon { width: 20px; height: 20px; color: var(--c, var(--secondary-text-color)); }
  .tile .tx { min-width: 0; display: flex; flex-direction: column; }
  .tile .k { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile .v { font-size: 11px; color: var(--c, var(--secondary-text-color)); white-space: nowrap; }
  .tile.on { background: color-mix(in srgb, var(--c) 12%, var(--secondary-background-color, transparent)); }
`;

class AlarmCard extends AlarmBase {
  static getConfigElement() {
    return document.createElement("alarm-card-editor");
  }

  static getStubConfig(hass) {
    const id = hass && Object.keys(hass.states).find((e) => e.startsWith("alarm_control_panel."));
    return id ? { entity: id } : {};
  }

  getCardSize() {
    // HA may ask before setConfig: no config yet, answer the bare card's size.
    return this._config ? 5 + Math.ceil(this._sensors().length / 2) : 5;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _render() {
    const { st, error } = this._panelOrError();
    if (error) return error;
    const c = this._config;
    const parts = [this._hero(st)];
    if (c.show_controls !== false) parts.push(`<div class="modes">${this._modeButtons(st)}</div>`, this._padHtml(st));
    if (c.show_sensors !== false) parts.push(this._sensorSection());
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card>
        ${this._header(st)}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  _hero(st) {
    const cls = stateClass(st.state);
    const lines = [this._lines(st, true)];
    if (this._config.show_info !== false) {
      const last = parseTime(st.attributes?.last_triggered);
      if (Number.isFinite(last))
        lines.push(`<div class="line">${svgIcon(ICONS.history)}<span>${esc(this._t("last_triggered", { when: ago(this._lang(), last) }))}</span></div>`);
      else if ("last_triggered" in (st.attributes || {})) lines.push(`<div class="line">${svgIcon(ICONS.history)}<span>${esc(this._t("never_triggered"))}</span></div>`);
    }
    return `<div class="hero ${cls}">
      <div class="clickable" role="button" tabindex="0" data-entity="${esc(st.entity_id)}">${shield(st.state)}</div>
      <div class="info">
        <div class="state">${esc(this._stateText(st))}</div>
        ${lines.join("")}
      </div>
    </div>`;
  }

  _isCollapsed(key) {
    const def = this._config.collapsed === true;
    return this._toggled.has(key) ? !def : def;
  }

  _sensorSection() {
    const items = this._sensors();
    if (!items.length) return "";
    const tiles = items.map((item) => {
      const s = this._hass.states[item.entity];
      const [group, offIcon, onIcon] = SENSOR_KIND[s?.attributes?.device_class] || ["problem", ICONS.sensor, ICONS.sensor];
      const on = s?.state === "on";
      const unavailable = !s || /^(unavailable|unknown)$/.test(s.state);
      const value = unavailable
        ? this._stateText(s || { state: "unavailable" })
        : this._t(group === "opening" ? (on ? "open" : "closed") : group === "motion" ? (on ? "detected" : "clear_state") : on ? "alert" : "ok_state");
      const cls = unavailable ? "idle" : on ? (group === "motion" ? "home" : "away") : "off";
      return `<div class="tile clickable ${cls} ${on ? "on" : ""}" role="button" tabindex="0" data-key="${esc(item.entity)}" data-entity="${esc(item.entity)}">
        ${svgIcon(on ? onIcon : offIcon)}<div class="tx"><span class="k">${esc(this._sensorName(item.entity))}</span><span class="v">${esc(value)}</span></div>
      </div>`;
    });
    const open = this._openSensors().length;
    const closed = this._isCollapsed("sensors");
    return `<div>
      <div class="section-title toggle" data-action="toggle_section" data-section="sensors" aria-expanded="${!closed}">${svgIcon(ICONS.door)}${esc(this._t("sensors"))}
        <span class="chip ${open ? "away" : "off"}">${esc(open ? this._t("n_open", { n: open }) : this._t("all_closed"))}</span>${svgIcon(ICONS.chevron_down, "chevron")}</div>
      ${closed ? "" : `<div class="tiles">${tiles.join("")}</div>`}
    </div>`;
  }
}

// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------

const MINI_STYLE = `
  .header { padding: 12px; }
  .header.with-pad { padding-bottom: 0; }
  .header .titles { margin-block: -2px; }
  .header .badge, .header .shield { width: 32px; height: 32px; }
  .header .badge .icon, .header .shield .icon { width: 20px; height: 20px; }
  .sub .st { color: var(--c); font-weight: 500; }
  .sub .dot { margin-right: 4px; vertical-align: 1px; }
  .controls { display: flex; gap: 6px; flex: none; }
  .controls .btn.round { width: 32px; height: 32px; }
  .controls .btn .icon { width: 16px; height: 16px; }
  .pad-wrap { padding: 8px 12px 12px; }
`;

// The mini card is a full card drawn compact: its detail button (top right, `zoom: false` removes it) switches
// it to the full card's content and back, and a click anywhere else on the page brings the compact view back.
class AlarmMiniCard extends AlarmCard {
  constructor() {
    super();
    this._zoomed = false;
    this._onUnzoom = (ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !inDialog(ev)) this._setZoom(false);
    };
  }

  static getConfigElement() {
    return document.createElement("alarm-mini-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._onUnzoom, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._onUnzoom, true);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 };
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _setZoom(on) {
    this._zoomed = on;
    this._update();
  }

  // From the keyboard (Enter / Space: no click count), the focus stays on the button.
  _toggleZoom(ev) {
    this._setZoom(!this._zoomed);
    if (ev.detail === 0) this.shadowRoot.querySelector?.(".zoom")?.focus();
  }

  // Compact view: a single row, the state in color under the name (with the countdown, or the open sensor
  // when the alarm goes off), the round arm / disarm buttons and the detail button.
  _render() {
    if (this._zoomed) return super._render();
    const { st, error } = this._panelOrError();
    if (error) return error;
    const c = this._config;
    const cls = stateClass(st.state);
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card>
        <div class="header${this._pad ? " with-pad" : ""}">
          ${c.show_logo !== false ? logo() : `<div class="clickable" role="button" tabindex="0" data-entity="${esc(st.entity_id)}">${shield(st.state)}</div>`}
          <div class="titles">
            <div class="name">${esc(c.title || st.attributes?.friendly_name || this._t("title"))}</div>
            <div class="sub clickable" role="button" tabindex="0" data-entity="${esc(st.entity_id)}"><span class="st ${cls}"><span class="dot"></span>${esc(
              this._stateText(st)
            )}</span>${esc(this._miniDetail(st))}</div>
          </div>
          ${c.show_controls !== false ? `<div class="controls">${this._modeButtons(st, true)}</div>` : ""}
          ${this._zoomButton()}
        </div>
        ${this._pad ? `<div class="pad-wrap">${this._padHtml(st)}</div>` : ""}
      </ha-card>`;
  }

  // What follows the state: " · 30 s" during a delay, " · Kitchen window" for the open sensor while the
  // alarm goes off, else " · for 27 min".
  _miniDetail(st) {
    const rem = remaining(st);
    if (rem) return ` · ${fmtCountdown(rem.left)}`;
    const open = entityList(st.attributes?.open_sensors);
    if (open.length && /^(triggered|pending)$/.test(st.state)) return ` · ${open.map((id) => this._sensorName(id)).join(", ")}`;
    const since = (Date.now() - Date.parse(st.last_changed)) / 1000;
    if (!Number.isFinite(since)) return "";
    return ` · ${since < 60 ? this._t("just_now") : this._t("since", { d: fmtDuration(since, (k) => this._t(k)) })}`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

class AlarmEditorBase extends HTMLElement {
  static get toggles() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const entity = this._config.entity || AlarmCard.getStubConfig(this._hass).entity;
    const st = entity && this._hass.states[entity];
    const all = st ? supportedModes(st) : MODES.map(([m]) => m);
    return [
      { name: "entity", selector: { entity: { domain: "alarm_control_panel" } } },
      { name: "title", selector: { text: {} } },
      { name: "modes", selector: { select: { multiple: true, mode: "list", options: all.map((m) => ({ value: m, label: tr(m) })) } } },
      { name: "sensors", selector: { entity: { domain: "binary_sensor", multiple: true } } },
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: tr("lang_auto") },
              { value: "en", label: "English" },
              { value: "fr", label: "Français" },
            ],
          },
        },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    const toggles = this.constructor.toggles;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) =>
        t(this._hass, this._config, s.name === "title" ? "title_option" : s.name === "sensors" ? "sensors_option" : s.name);
      this._form.computeHelper = (s) => (s.name === "zoom" ? t(this._hass, this._config, "zoom_helper") : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        const defaults = Object.fromEntries(toggles);
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          const empty = v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length);
          if (empty || (k in defaults && v === defaults[k])) delete config[k];
        }
        // Sensors keep the names set in YAML.
        if (Array.isArray(config.sensors)) {
          const old = new Map(normalize(this._config.sensors).map((s) => [s.entity, s]));
          config.sensors = config.sensors.map((id) => (old.get(id)?.name ? old.get(id) : id));
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this._config, sensors: normalize(this._config.sensors).map((s) => s.entity) };
    for (const [name, def] of toggles) if (data[name] === undefined) data[name] = def;
    if (!data.entity) data.entity = AlarmCard.getStubConfig(this._hass).entity;
    this._form.hass = this._hass;
    // A new data or schema object re-renders the whole form: only on a config or language change.
    if (this._dataFor !== this._config) {
      this._dataFor = this._config;
      this._form.data = data;
    }
    const key = `${lang(this._hass, this._config)}|${data.entity}|${this._hass.states[data.entity]?.attributes?.supported_features}`;
    if (this._schemaFor !== key) {
      this._schemaFor = key;
      this._form.schema = this._schema();
    }
  }
}

class AlarmCardEditor extends AlarmEditorBase {
  static get toggles() {
    return [
      ["show_logo", true],
      ["show_controls", true],
      ["show_sensors", true],
      ["show_info", true],
      ["confirm_disarm", false],
      ["collapsed", false],
    ];
  }
}

class AlarmMiniCardEditor extends AlarmEditorBase {
  static get toggles() {
    return [
      ["show_logo", true],
      ["show_controls", true],
      ["show_info", true],
      ["confirm_disarm", false],
      ["zoom", true],
    ];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("alarm-card", AlarmCard);
define("alarm-mini-card", AlarmMiniCard);
define("alarm-card-editor", AlarmCardEditor);
define("alarm-mini-card-editor", AlarmMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "alarm-card",
    name: "Alarm Card",
    description: "Arm and disarm an alarm panel (Alarmo or any other): state, exit and entry delays, code pad, open sensors.",
  },
  {
    type: "alarm-mini-card",
    name: "Alarm Mini Card",
    description: "Compact alarm overview: state, countdown and one-tap arm / disarm buttons.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-alarm-card" });
}

console.info(
  `%c ALARM-CARD %c v${VERSION} `,
  "color: white; background: #e5484d; font-weight: 700;",
  "color: #e5484d; background: white; font-weight: 700;"
);
