// The Alarm panel's sidebar badge, loaded on every page by the Alarm Card integration: the number of Alarmo sensors
// keeping the alarm from arming (open, watched in a mode, neither allowed open nor bypassed), in amber, like Home
// Assistant's own notifications count; red, with "!" when no sensor is to blame, while an Alarmo alarm is triggered.
// Off when the panel's "Sidebar badge" setting is off. The last value is kept by the browser, so the sidebar shows
// it at once.
var ALARM_BADGE_KEY = "alarm-card-badge";
var ALARM_BADGE_EVERY_MS = 15000;
// Alarmo's sensor settings change rarely: read again every minute (the states are followed every 15 seconds).
var ALARM_BADGE_CONFIG_MS = 60000;
var ALARM_BADGE_PATH = "alarm-panel";
var ALARM_BADGE_COLORS = { warn: "var(--warning-color, #ffa600)", alarm: "var(--error-color, #db4437)" };

function alarmBadgeSaved() {
  try {
    var v = JSON.parse(localStorage.getItem(ALARM_BADGE_KEY) || "null");
    return v && typeof v.text === "string" ? v : null;
  } catch (_err) {
    return null;
  }
}
window.__alarmBadge ??= alarmBadgeSaved();

// The Alarm item in Home Assistant's sidebar, or null until the sidebar is drawn (see ha-ent-one: the recent
// sidebar gives each item the id `sidebar-panel-<path>`; `[href]` and `[data-panel]` catch the older ones).
function alarmBadgeItem() {
  var ha = document.querySelector("home-assistant")?.shadowRoot;
  var sidebar = ha?.querySelector("home-assistant-main")?.shadowRoot?.querySelector("ha-sidebar")?.shadowRoot;
  if (!sidebar) return null;
  return (
    sidebar.querySelector(`#sidebar-panel-${ALARM_BADGE_PATH}`) ||
    sidebar.querySelector(`[href="/${ALARM_BADGE_PATH}"]`) ||
    sidebar.querySelector(`[data-panel="${ALARM_BADGE_PATH}"]`)
  );
}

function alarmBadgeSpan(badge, slot) {
  var el = document.createElement("span");
  el.className = "badge alarm-card-badge";
  el.slot = slot;
  el.dataset.key = `${badge.text}|${badge.level}`;
  el.textContent = badge.text;
  // The start badge (collapsed sidebar) is placed by Home Assistant's `ha-svg-icon + .badge` rule, but a custom
  // panel's icon is an <ha-icon>: that rule does not match and the badge would sit beside the icon, cut off. Placed
  // here over the icon like Home Assistant's own (top var(--ha-space-1), left 26px), out of the row's layout; the end
  // badge stays in flow. The sidebar's rules still show the right one by slot.
  var place = slot === "start" ? "position:absolute; top:var(--ha-space-1, 4px); left:26px; z-index:1; pointer-events:none; " : "";
  el.style.cssText = `${place}display:inline-flex; justify-content:center; min-width:18px; height:18px; box-sizing:border-box; padding:0 5px; align-items:center; border-radius:9px; font-size:11px; font-weight:500; line-height:1; color:#fff; background:${ALARM_BADGE_COLORS[badge.level]};`;
  return el;
}

// Mirrors Home Assistant's own badge: a span in the start slot (collapsed sidebar, over the icon) and one in the end
// slot (expanded); one span at the right on the older sidebar (an <a>). Unchanged, it writes nothing.
function alarmBadgeRedraw() {
  var item = alarmBadgeItem();
  if (!item) return false;
  var badge = window.__alarmBadge;
  var spans = item.querySelectorAll(":scope > .alarm-card-badge");
  if (!badge) {
    for (var b of spans) b.remove();
    return true;
  }
  var key = `${badge.text}|${badge.level}`;
  if (item.localName === "a") {
    var one = spans[0];
    if (one && one.dataset.key === key) return true;
    if (!one) {
      one = document.createElement("span");
      one.className = "alarm-card-badge";
      item.style.position = "relative";
      item.appendChild(one);
    }
    one.dataset.key = key;
    one.textContent = badge.text;
    one.style.cssText = `position:absolute; right:12px; top:50%; transform:translateY(-50%); min-width:18px; height:18px; box-sizing:border-box; padding:0 5px; display:inline-flex; align-items:center; justify-content:center; border-radius:9px; font-size:11px; font-weight:500; line-height:1; pointer-events:none; z-index:1; color:#fff; background:${ALARM_BADGE_COLORS[badge.level]};`;
    return true;
  }
  if (spans.length === 2 && spans[0].dataset.key === key) return true;
  for (var old of spans) old.remove();
  var icon = item.querySelector(':scope > ha-svg-icon[slot="start"]') || item.querySelector(':scope > ha-icon[slot="start"]');
  var start = alarmBadgeSpan(badge, "start");
  if (icon) item.insertBefore(start, icon.nextSibling);
  else item.appendChild(start);
  item.appendChild(alarmBadgeSpan(badge, "end"));
  return true;
}

function alarmBadgeRedrawSoon(tries = 20) {
  if (alarmBadgeRedraw() || tries <= 1) return;
  setTimeout(() => alarmBadgeRedrawSoon(tries - 1), 250);
}

function alarmBadgeObserve() {
  var item = alarmBadgeItem();
  var sidebar = item?.getRootNode();
  if (!sidebar) {
    setTimeout(alarmBadgeObserve, 500);
    return;
  }
  if (sidebar.__alarmBadgeObserved) return;
  sidebar.__alarmBadgeObserved = true;
  new MutationObserver(() => {
    if (window.__alarmBadgeRaf) return;
    window.__alarmBadgeRaf = requestAnimationFrame(() => {
      window.__alarmBadgeRaf = 0;
      alarmBadgeRedraw();
    });
  }).observe(sidebar, { childList: true, subtree: true });
}

function alarmBadgeSet(badge) {
  var key = badge ? `${badge.text}|${badge.level}` : "";
  var cur = window.__alarmBadge ? `${window.__alarmBadge.text}|${window.__alarmBadge.level}` : "";
  if (key === cur) return;
  window.__alarmBadge = badge;
  try {
    localStorage.setItem(ALARM_BADGE_KEY, JSON.stringify(badge));
  } catch (_err) {
    // drawn anyway, not kept
  }
  alarmBadgeRedraw();
}

// The badge from the states: the blocking sensors, and whether an Alarmo alarm is triggered.
function alarmBadgeOf(hass, sensors, entities) {
  var states = hass?.states || {};
  var open = ["on", "open", "unlocked", "opening", "detected"];
  var blocking = 0;
  for (var id in sensors) {
    var s = sensors[id];
    if (s.enabled === false || s.allow_open || s.auto_bypass || !(s.modes || []).length) continue;
    if (open.includes(states[id]?.state)) blocking++;
  }
  var triggered = (entities || []).some((e) => states[e.entity_id]?.state === "triggered");
  if (triggered) return { text: blocking ? String(blocking) : "!", level: "alarm" };
  if (blocking) return { text: blocking > 99 ? "99+" : String(blocking), level: "warn" };
  return null;
}

var alarmBadgeData = { at: 0, sensors: null, entities: null, enabled: false };

async function alarmBadgeFollow() {
  var hass = document.querySelector("home-assistant")?.hass;
  if (!hass?.user?.is_admin || document.hidden) return;
  if (Date.now() - alarmBadgeData.at > ALARM_BADGE_CONFIG_MS) {
    alarmBadgeData.at = Date.now();
    try {
      var settings = await hass.callWS({ type: "alarm_card/settings" });
      alarmBadgeData.enabled = settings.options?.sidebar_badge !== false && settings.alarmo;
      if (alarmBadgeData.enabled) {
        alarmBadgeData.sensors = await hass.callWS({ type: "alarmo/sensors" });
        alarmBadgeData.entities = await hass.callWS({ type: "alarmo/entities" });
      }
    } catch (_err) {
      alarmBadgeData.enabled = false;
    }
  }
  alarmBadgeSet(alarmBadgeData.enabled ? alarmBadgeOf(hass, alarmBadgeData.sensors || {}, alarmBadgeData.entities) : null);
}

if (!window.__alarmBadge_init) {
  window.__alarmBadge_init = true;
  alarmBadgeRedrawSoon();
  alarmBadgeObserve();
  setTimeout(alarmBadgeFollow, 3000);
  setInterval(alarmBadgeFollow, ALARM_BADGE_EVERY_MS);
  // The panel's settings saved: read them again now rather than within the minute.
  window.addEventListener("alarm-card-settings", () => {
    alarmBadgeData.at = 0;
    alarmBadgeFollow();
  });
}
