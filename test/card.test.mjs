import assert from "node:assert/strict";
import { test } from "node:test";
import { arming, entities, sensors, states, triggered, withCode } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const al = load();
const PANEL = "alarm_control_panel.alarmo";

const makeHass = (overrides = {}) => {
  const calls = [];
  return { calls, entities, states: { ...states, ...overrides }, language: "en", callService: (...a) => calls.push(a) };
};

const newCard = (hass, config = {}, Cls = al.AlarmCard) => {
  const card = new Cls();
  card.setConfig({ entity: PANEL, sensors, ...config });
  card.hass = hass;
  return card;
};

// A click on an element of the card, as composedPath() would report it.
const click = (card, dataset, extra = []) => card._onClick({ composedPath: () => [{ dataset }, ...extra], stopPropagation() {} });
const plain = (calls) => JSON.parse(JSON.stringify(calls));

test("stateClass gives each state its color", () => {
  assert.equal(al.stateClass("disarmed"), "off");
  assert.equal(al.stateClass("armed_away"), "away");
  assert.equal(al.stateClass("armed_custom_bypass"), "custom");
  assert.equal(al.stateClass("arming"), "wait");
  assert.equal(al.stateClass("pending"), "wait");
  assert.equal(al.stateClass("triggered"), "alarm");
  assert.equal(al.stateClass("unavailable"), "idle");
});

test("arm modes follow the supported features and the modes option", () => {
  const st = { attributes: { supported_features: 11 } }; // home, away, trigger
  assert.deepEqual([...al.supportedModes(st)], ["arm_home", "arm_away"]);
  assert.deepEqual([...al.supportedModes(st, ["away", "night"])], ["arm_away"]);
  assert.deepEqual([...al.supportedModes({ attributes: { supported_features: 63 } })], ["arm_home", "arm_away", "arm_night", "arm_vacation", "arm_custom_bypass"]);
});

test("the delay counts down from Alarmo's delay attribute", () => {
  const now = Date.parse("2026-10-26T10:00:20Z");
  const st = { state: "arming", attributes: { delay: 60 }, last_changed: "2026-10-26T10:00:00Z" };
  assert.deepEqual({ ...al.remaining(st, now) }, { left: 40, total: 60 });
  assert.equal(al.remaining({ ...st, state: "armed_away" }, now), null);
  assert.equal(al.remaining({ ...st, attributes: {} }, now), null);
  assert.equal(al.fmtCountdown(40), "40 s");
  assert.equal(al.fmtCountdown(65.2), "1:06");
});

test("durations and Alarmo's local timestamps", () => {
  const tr = (k) => ({ min: "min", h: "h", d: "d" })[k];
  assert.equal(al.fmtDuration(30, tr), "1 min");
  assert.equal(al.fmtDuration(7500, tr), "2 h 05");
  assert.equal(al.fmtDuration(7200, tr), "2 h");
  assert.equal(al.fmtDuration(3 * 86400, tr), "3 d");
  assert.ok(Number.isFinite(al.parseTime("2026-08-09 19:28:27")));
  assert.deepEqual([...al.entityList({ "binary_sensor.a": "on" })], ["binary_sensor.a"]);
  assert.deepEqual([...al.entityList(null)], []);
});

test("a disarmed panel shows its state, arm buttons and the open sensor", () => {
  const card = newCard(makeHass());
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /Disarmed/);
  assert.match(html, /data-mode="arm_home"/);
  assert.match(html, /data-mode="arm_away"/);
  assert.doesNotMatch(html, /data-mode="arm_night"/);
  assert.doesNotMatch(html, /data-mode="disarm"/);
  assert.match(html, /1 open/);
  assert.match(html, /by Alex/);
});

test("arming with a sensor open asks first, then forces through Alarmo", () => {
  const hass = makeHass();
  const card = newCard(hass);
  click(card, { action: "mode", mode: "arm_away" });
  assert.equal(hass.calls.length, 0);
  assert.match(card.shadowRoot.innerHTML, /dialog-open/);
  assert.match(card.shadowRoot.innerHTML, /Kitchen window: open\. Arm away anyway\?/);
  click(card, { action: "confirm_ok" });
  assert.deepEqual(plain(hass.calls), [["alarmo", "arm", { entity_id: PANEL, mode: "away", force: true }]]);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /dialog-open/);
});

test("Cancel in the popup arms nothing", () => {
  const hass = makeHass();
  const card = newCard(hass);
  click(card, { action: "mode", mode: "arm_home" });
  click(card, { action: "confirm_cancel" });
  assert.equal(hass.calls.length, 0);
});

test("arming with everything closed calls the standard service", () => {
  const hass = makeHass({ "binary_sensor.kitchen_window": { ...states["binary_sensor.kitchen_window"], state: "off" } });
  const card = newCard(hass);
  click(card, { action: "mode", mode: "arm_home" });
  assert.deepEqual(plain(hass.calls), [["alarm_control_panel", "alarm_arm_home", { entity_id: PANEL }]]);
});

test("a panel with a number code opens the pad and sends the code", () => {
  const hass = makeHass(withCode);
  const card = newCard(hass);
  click(card, { action: "mode", mode: "disarm" });
  assert.equal(hass.calls.length, 0);
  assert.match(card.shadowRoot.innerHTML, /Code to disarm/);
  for (const d of ["1", "2", "3", "5"]) click(card, { action: "key", digit: d });
  click(card, { action: "key_back" });
  click(card, { action: "key", digit: "4" });
  click(card, { action: "pad_ok" });
  assert.deepEqual(plain(hass.calls), [["alarm_control_panel", "alarm_disarm", { entity_id: PANEL, code: "1234" }]]);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /Code to disarm/);
});

test("confirm_disarm asks before disarming", () => {
  const hass = makeHass(withCode);
  const card = newCard(hass, { confirm_disarm: true });
  click(card, { action: "mode", mode: "disarm" });
  assert.match(card.shadowRoot.innerHTML, /Disarm the alarm\?/);
  click(card, { action: "confirm_ok" });
  assert.match(card.shadowRoot.innerHTML, /Code to disarm/); // then the code
});

test("the code pad takes taps right after the confirm popup closes", () => {
  const hass = makeHass(withCode);
  const card = newCard(hass, { confirm_disarm: true });
  click(card, { action: "mode", mode: "disarm" });
  click(card, { action: "confirm_ok" });
  // All within CONFIRM_GUARD_MS of the popup closing: the guard must not swallow pad taps.
  for (const d of ["1", "2", "3", "4"]) click(card, { action: "key", digit: d });
  click(card, { action: "pad_ok" });
  assert.deepEqual(plain(hass.calls), [["alarm_control_panel", "alarm_disarm", { entity_id: PANEL, code: "1234" }]]);
});

test("arming shows the countdown and a Cancel button", () => {
  const card = newCard(makeHass(arming));
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /Armed in 4\d s/);
  assert.match(html, /class="bar wait"/);
  assert.match(html, /data-mode="disarm"[^>]*>.*Cancel/s);
});

test("a triggered panel names the open sensor", () => {
  const card = newCard(makeHass(triggered));
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /Triggered/);
  // Each open sensor name is its own more-info link.
  assert.match(html, /Open: <span[^>]*data-entity="binary_sensor\.kitchen_window"[^>]*>Kitchen window<\/span>/);
  assert.match(html, /class="shield alarm"/);
});

test("an unrelated state change does not rebuild the card", () => {
  const hass = makeHass();
  const card = newCard(hass);
  let renders = 0;
  const render = card._render.bind(card);
  card._render = () => {
    renders++;
    return render();
  };
  card.hass = { ...hass, states: { ...hass.states, "light.elsewhere": { state: "on", attributes: {} } } };
  assert.equal(renders, 0);
  card.hass = { ...hass, states: { ...hass.states, [PANEL]: { ...hass.states[PANEL], state: "armed_home" } } };
  assert.equal(renders, 1);
});

test("missing panels get a clear message", () => {
  const card = newCard(makeHass(), { entity: "alarm_control_panel.nope" });
  assert.match(card.shadowRoot.innerHTML, /Alarm panel not found: alarm_control_panel\.nope/);
  const empty = new al.AlarmCard();
  empty.setConfig({});
  empty.hass = { states: {}, entities: {}, language: "fr" };
  assert.match(empty.shadowRoot.innerHTML, /Aucune centrale/);
});

test("the mini card zooms to the full card and back", () => {
  const card = newCard(makeHass(), {}, al.AlarmMiniCard);
  assert.match(card.shadowRoot.innerHTML, /class="zoom"/);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="tiles"/);
  click(card, { action: "zoom" });
  assert.match(card.shadowRoot.innerHTML, /class="tiles"/);
  click(card, { action: "zoom" });
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="tiles"/);
  const noZoom = newCard(makeHass(), { zoom: false }, al.AlarmMiniCard);
  assert.doesNotMatch(noZoom.shadowRoot.innerHTML, /class="zoom"/);
});

test("the sensors section folds and unfolds", () => {
  const card = newCard(makeHass(), { collapsed: true });
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="tiles"/);
  click(card, { action: "toggle_section", section: "sensors" });
  assert.match(card.shadowRoot.innerHTML, /class="tiles"/);
});

test("the mini card fits on one row: state, countdown and buttons in the header", () => {
  const card = newCard(makeHass(arming), { language: "fr" }, al.AlarmMiniCard);
  const html = card.shadowRoot.innerHTML;
  assert.equal((html.match(/class="header"/g) || []).length, 1);
  assert.doesNotMatch(html, /class="content/);
  assert.match(html, /Armement<\/span> · 4\d s/);
  assert.match(html, /class="controls"/);
  const trig = newCard(makeHass(triggered), {}, al.AlarmMiniCard);
  assert.match(trig.shadowRoot.innerHTML, /Triggered<\/span> · Kitchen window/);
  const noLogo = newCard(makeHass(), { show_logo: false }, al.AlarmMiniCard);
  assert.match(noLogo.shadowRoot.innerHTML, /class="shield off"/);
});

test("French strings", () => {
  const card = newCard(makeHass(arming), { language: "fr" });
  assert.match(card.shadowRoot.innerHTML, /Armement/);
  assert.match(card.shadowRoot.innerHTML, /Armée dans/);
});

test("I18N parity: every language has exactly the English keys and placeholders", () => {
  const ph = (v) => [...String(v).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const en = al.STRINGS.en;
  for (const [l, strings] of Object.entries(al.STRINGS)) {
    assert.deepEqual(Object.keys(strings).sort(), Object.keys(en).sort(), `${l}: keys differ from en`);
    for (const k of Object.keys(en)) assert.deepEqual(ph(strings[k]), ph(en[k]), `${l}.${k}: placeholders differ from en`);
  }
  for (const l of ["en", "fr", "de", "es"]) assert.ok(al.STRINGS[l], `missing ${l}`);
});

test("German and Spanish strings, from the config or the HA locale", () => {
  const de = newCard(makeHass(arming), { language: "de" });
  assert.match(de.shadowRoot.innerHTML, /Wird scharf geschaltet/);
  assert.match(de.shadowRoot.innerHTML, /Scharf in/);
  const hass = { ...makeHass(arming), language: "es", locale: { language: "es-ES" } };
  const es = newCard(hass);
  assert.match(es.shadowRoot.innerHTML, /Armando/);
  assert.match(es.shadowRoot.innerHTML, /Armada en/);
});
