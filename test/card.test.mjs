import assert from "node:assert/strict";
import { test } from "node:test";
import { armedAway, arming, entities, sensors, states, triggered, withCode } from "../scripts/mock-states.mjs";
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
  // Unknown armed_* states never reach a class attribute as is.
  assert.equal(al.stateClass("armed_x\" onclick=\"y"), "idle");
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

test("forcing Custom bypass through Alarmo sends its custom mode", () => {
  const hass = makeHass({ [PANEL]: { ...states[PANEL], attributes: { ...states[PANEL].attributes, supported_features: 63 } } });
  const card = newCard(hass);
  click(card, { action: "mode", mode: "arm_custom_bypass" });
  click(card, { action: "confirm_ok" });
  assert.deepEqual(plain(hass.calls), [["alarmo", "arm", { entity_id: PANEL, mode: "custom", force: true }]]);
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

test("a panel without a code asks before disarming by default, on the full and the mini card", () => {
  for (const Cls of [al.AlarmCard, al.AlarmMiniCard]) {
    const hass = makeHass(armedAway);
    const card = newCard(hass, {}, Cls);
    click(card, { action: "mode", mode: "disarm" });
    assert.equal(hass.calls.length, 0, `${Cls.name}: disarmed without confirmation`);
    assert.match(card.shadowRoot.innerHTML, /Disarm the alarm\?/);
    click(card, { action: "confirm_ok" });
    assert.deepEqual(plain(hass.calls), [["alarm_control_panel", "alarm_disarm", { entity_id: PANEL }]]);
  }
});

test("confirm_disarm: false disarms a panel without a code at once", () => {
  for (const Cls of [al.AlarmCard, al.AlarmMiniCard]) {
    const hass = makeHass(armedAway);
    const card = newCard(hass, { confirm_disarm: false }, Cls);
    click(card, { action: "mode", mode: "disarm" });
    assert.doesNotMatch(card.shadowRoot.innerHTML, /Disarm the alarm\?/);
    assert.deepEqual(plain(hass.calls), [["alarm_control_panel", "alarm_disarm", { entity_id: PANEL }]]);
  }
});

test("a panel with a code asks for the code, without an extra confirmation by default", () => {
  for (const Cls of [al.AlarmCard, al.AlarmMiniCard]) {
    const card = newCard(makeHass(withCode), {}, Cls);
    click(card, { action: "mode", mode: "disarm" });
    assert.doesNotMatch(card.shadowRoot.innerHTML, /Disarm the alarm\?/);
    assert.match(card.shadowRoot.innerHTML, /Code to disarm/);
  }
});

test("the editor's confirm_disarm default follows the panel's code", () => {
  const toggle = (editor) => editor._form.data.confirm_disarm;
  for (const Editor of [al.AlarmCardEditor, al.AlarmMiniCardEditor]) {
    assert.equal(toggle(newEditor(makeHass(), { entity: PANEL }, Editor)), true);
    assert.equal(toggle(newEditor(makeHass(withCode), { entity: PANEL }, Editor)), false);
    assert.equal(toggle(newEditor(makeHass(), { entity: PANEL, confirm_disarm: false }, Editor)), false);
  }
  for (const [l, strings] of Object.entries(al.STRINGS)) assert.ok(strings.confirm_disarm_helper, `${l}.confirm_disarm_helper: missing`);
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
  assert.match(html, /Armed in [34]\d s/);
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

test("sensors Alarmo reports as unavailable are listed apart, not as open", () => {
  // Alarmo puts unavailable sensors (or ones deleted/renamed since its setup) in open_sensors: they block
  // arming, but calling them "open" is wrong.
  const st = { ...states[PANEL], attributes: { ...states[PANEL].attributes, open_sensors: { "binary_sensor.gone": "unavailable", "binary_sensor.kitchen_window": "on" } } };
  const html = newCard(makeHass({ [PANEL]: st })).shadowRoot.innerHTML;
  assert.match(html, /Open: <span[^>]*data-entity="binary_sensor\.kitchen_window"[^>]*>Kitchen window<\/span><\/span>/);
  assert.match(html, /Unavailable: <span[^>]*data-entity="binary_sensor\.gone"[^>]*>binary_sensor\.gone<\/span>/);
  assert.doesNotMatch(html, /Open: [^<]*<span[^>]*data-entity="binary_sensor\.gone"/);
  assert.doesNotMatch(html, /Kitchen window<\/span>, <span[^>]*binary_sensor\.gone/);
});

test("a list-shaped open_sensors uses the live state to tell unavailable from open", () => {
  const st = { ...states[PANEL], attributes: { ...states[PANEL].attributes, open_sensors: ["binary_sensor.kitchen_window", "binary_sensor.gone"] } };
  const html = newCard(makeHass({ [PANEL]: st })).shadowRoot.innerHTML;
  assert.match(html, /Open: <span[^>]*data-entity="binary_sensor\.kitchen_window"/);
  assert.match(html, /Unavailable: <span[^>]*data-entity="binary_sensor\.gone"/);
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
  assert.match(html, /Armement<\/span> · [34]\d s/);
  assert.match(html, /class="controls"/);
  const trig = newCard(makeHass(triggered), {}, al.AlarmMiniCard);
  assert.match(trig.shadowRoot.innerHTML, /Triggered<\/span> · Kitchen window/);
  const noLogo = newCard(makeHass(), { show_logo: false }, al.AlarmMiniCard);
  assert.match(noLogo.shadowRoot.innerHTML, /class="shield off"/);
});

test("the mini card keeps the full card's header icon size (40 px)", () => {
  const html = newCard(makeHass(), {}, al.AlarmMiniCard).shadowRoot.innerHTML;
  assert.doesNotMatch(html, /\.header \.(badge|shield)[^{]*\{[^}]*\b32px/);
  assert.match(html, /\.header \.shield \{ width: 40px; height: 40px; \}/);
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
    for (const k of Object.keys(en)) {
      assert.deepEqual(ph(strings[k]), ph(en[k]), `${l}.${k}: placeholders differ from en`);
      assert.ok(String(strings[k]).trim(), `${l}.${k}: empty value`);
    }
  }
  for (const l of ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"]) assert.ok(al.STRINGS[l], `missing ${l}`);
});

test("I18N: Serbian Cyrillic has no Latin letters and Serbian Latin no Cyrillic (placeholders and units aside)", () => {
  const units = new Set(["min", "h", "d"]);
  const strip = (v) => String(v).replace(/\{\w+\}/g, "");
  for (const [k, v] of Object.entries(al.STRINGS.sr))
    if (!units.has(k)) assert.doesNotMatch(strip(v), /[A-Za-z]/, `sr.${k}: Latin letter in ${JSON.stringify(v)}`);
  for (const [k, v] of Object.entries(al.STRINGS["sr-Latn"])) assert.doesNotMatch(strip(v), /[\u0400-\u04FF]/, `sr-Latn.${k}: Cyrillic letter in ${JSON.stringify(v)}`);
});

test("I18N: the full HA language when known, else the part before the dash, else English", () => {
  const render = (language, config = {}) => newCard({ ...makeHass(arming), language, locale: { language } }, config).shadowRoot.innerHTML;
  assert.match(render("fr-FR"), /Armement/);
  assert.match(render("sr-Latn"), /Aktiviranje u toku/);
  assert.match(render("sr"), /Активирање у току/);
  assert.match(render("it-IT"), /In attivazione/);
  assert.match(render("nl-BE"), /Schakelt in/);
  assert.match(render("pt"), /A armar/);
  // Brazilian Portuguese falls back to European Portuguese (assumed).
  assert.match(render("pt-BR"), /A armar/);
  assert.match(render("pl-PL"), /Uzbrajanie/);
  assert.match(render("ro-RO"), /Se armează/);
  assert.match(render("da-DK"), /Tilkobler/);
  assert.match(render("sv-SE"), /Larmar på/);
  assert.match(render("bg-BG"), /Включване/);
  assert.match(render("ru-RU"), /Постановка на охрану/);
  assert.match(render("uk-UA"), /Постановка на охорону/);
  assert.match(render("hu-HU"), /Élesítés/);
  assert.match(render("sk-SK"), /Zabezpečuje sa/);
  assert.match(render("cs-CZ"), /Zajišťování/);
  assert.match(render("sl-SI"), /Vklapljanje/);
  assert.match(render("lv-LV"), /Ieslēdzas/);
  assert.match(render("el-GR"), /Όπλιση/);
  assert.match(render("ja"), /Arming/);
  // The card's language option still wins over Home Assistant's.
  assert.match(render("sr-Latn", { language: "fr" }), /Armement/);
});

test("I18N: Intl gets pt-PT for Home Assistant's pt, keeps pt-BR, and follows the language option", () => {
  const h = (language) => ({ language, locale: { language } });
  assert.equal(al.intlLang(h("pt"), {}), "pt-PT");
  assert.equal(al.intlLang(h("pt-BR"), {}), "pt-BR");
  assert.equal(al.intlLang(h("fr-CA"), {}), "fr-CA");
  assert.equal(al.intlLang(h("ja"), {}), "en");
  assert.equal(al.intlLang(h("sr-Latn"), {}), "sr-Latn");
  assert.equal(al.intlLang(h("en"), { language: "pt" }), "pt-PT");
  assert.equal(al.intlLang(h("pt-BR"), { language: "pt" }), "pt-PT");
  assert.equal(al.intlLang(h("pt"), { language: "fr" }), "fr");
  // European wording ("dentro de"), not the Brazilian "em 3 horas".
  assert.equal(al.ago(al.intlLang(h("pt"), {}), 3 * 3600000, 0), "dentro de 3 horas");
});

test("I18N: the editor offers every language of the card, Serbian, Italian, Dutch, Portuguese, Polish and the 12 later languages included", () => {
  const editor = new al.AlarmCardEditor();
  editor._hass = makeHass();
  editor._config = { entity: PANEL };
  const options = editor._schema().find((s) => s.name === "language").selector.select.options;
  const values = options.map((o) => o.value).filter(Boolean);
  assert.deepEqual([...values].sort(), Object.keys(al.STRINGS).sort());
  assert.equal(options.find((o) => o.value === "sr").label, "Српски");
  assert.equal(options.find((o) => o.value === "sr-Latn").label, "Srpski (latinica)");
  assert.equal(options.find((o) => o.value === "it").label, "Italiano");
  assert.equal(options.find((o) => o.value === "nl").label, "Nederlands");
  assert.equal(options.find((o) => o.value === "pt").label, "Português (Portugal)");
  assert.equal(options.find((o) => o.value === "pl").label, "Polski");
  assert.equal(options.find((o) => o.value === "ro").label, "Română");
  assert.equal(options.find((o) => o.value === "da").label, "Dansk");
  assert.equal(options.find((o) => o.value === "sv").label, "Svenska");
  assert.equal(options.find((o) => o.value === "bg").label, "Български");
  assert.equal(options.find((o) => o.value === "ru").label, "Русский");
  assert.equal(options.find((o) => o.value === "uk").label, "Українська");
  assert.equal(options.find((o) => o.value === "hu").label, "Magyar");
  assert.equal(options.find((o) => o.value === "sk").label, "Slovenčina");
  assert.equal(options.find((o) => o.value === "cs").label, "Čeština");
  assert.equal(options.find((o) => o.value === "sl").label, "Slovenščina");
  assert.equal(options.find((o) => o.value === "lv").label, "Latviešu");
  assert.equal(options.find((o) => o.value === "el").label, "Ελληνικά");
});

test("I18N: every editor toggle has a label in every language", () => {
  for (const Editor of [al.AlarmCardEditor, al.AlarmMiniCardEditor])
    for (const [name] of Editor.toggles)
      for (const [l, strings] of Object.entries(al.STRINGS)) assert.ok(strings[name], `${l}.${name}: missing editor label`);
});

test("Mini card editor offers the zoomed view's sensor options", () => {
  const names = al.AlarmMiniCardEditor.toggles.map(([n]) => n);
  for (const n of ["show_sensors", "collapsed"]) assert.ok(names.includes(n), `${n}: missing from the mini card editor`);
});

test("German and Spanish strings, from the config or the HA locale", () => {
  const de = newCard(makeHass(arming), { language: "de" });
  assert.match(de.shadowRoot.innerHTML, /Wird aktiviert/);
  assert.match(de.shadowRoot.innerHTML, /Aktiviert in/);
  const hass = { ...makeHass(arming), language: "es", locale: { language: "es-ES" } };
  const es = newCard(hass);
  assert.match(es.shadowRoot.innerHTML, /Armando/);
  assert.match(es.shadowRoot.innerHTML, /Armada en/);
});

test("without an entity, the editor shows the panel the card controls", () => {
  // Inserted out of alphabetical order: the card picks the first one alphabetically.
  const panel = (features) => ({ state: "disarmed", attributes: { supported_features: features } });
  const hass = {
    ...makeHass(),
    states: { "alarm_control_panel.zone": panel(2), "alarm_control_panel.maison": panel(5) }, // away / home + night
  };
  const card = newCard(hass, { entity: undefined, sensors: [] });
  assert.equal(card._entityId(), "alarm_control_panel.maison");
  assert.equal(al.AlarmCard.getStubConfig(hass).entity, "alarm_control_panel.maison");
  for (const Editor of [al.AlarmCardEditor, al.AlarmMiniCardEditor]) {
    const editor = new Editor();
    editor._hass = hass;
    editor._config = {};
    const modes = editor._schema().find((s) => s.name === "modes").selector.select.options.map((o) => o.value);
    assert.deepEqual([...modes], ["arm_home", "arm_night"]);
  }
});

test("the stub config has no entity when there is no alarm panel", () => {
  assert.deepEqual({ ...al.AlarmCard.getStubConfig({ states: { "light.a": { state: "on" } } }) }, {});
  assert.deepEqual({ ...al.AlarmCard.getStubConfig(undefined) }, {});
});

test("a mode listed twice (with and without arm_) shows one button", () => {
  const st = { attributes: { supported_features: 11 } }; // home, away, trigger
  assert.deepEqual([...al.supportedModes(st, ["away", "home", "arm_away"])], ["arm_away", "arm_home"]);
  const card = newCard(makeHass(), { modes: ["away", "home", "arm_away"] });
  assert.equal(card.shadowRoot.innerHTML.match(/data-mode="arm_away"/g).length, 1);
  assert.equal(card.shadowRoot.innerHTML.match(/data-mode="arm_home"/g).length, 1);
});

// The editor's ha-form, replaced by a plain object: _render then only sets its data and schema.
const newEditor = (hass, config, Editor = al.AlarmCardEditor) => {
  const editor = new Editor();
  editor._form = {};
  editor._hass = hass;
  editor.setConfig(config);
  return editor;
};

test("the editor checks the modes written without the arm_ prefix (README example)", () => {
  for (const Editor of [al.AlarmCardEditor, al.AlarmMiniCardEditor]) {
    const editor = newEditor(makeHass(), { entity: PANEL, modes: ["away", "home"] }, Editor);
    const options = editor._form.schema.find((s) => s.name === "modes").selector.select.options.map((o) => o.value);
    assert.deepEqual([...editor._form.data.modes], ["arm_away", "arm_home"]);
    for (const m of editor._form.data.modes) assert.ok(options.includes(m), `${m}: not an option of the editor`);
    // Mixed or repeated entries are folded into one checkbox each.
    const mixed = newEditor(makeHass(), { entity: PANEL, modes: ["arm_away", "away", "home"] }, Editor);
    assert.deepEqual([...mixed._form.data.modes], ["arm_away", "arm_home"]);
  }
});

test("the editor leaves a config without modes (or with an invalid one) as is", () => {
  const none = newEditor(makeHass(), { entity: PANEL });
  assert.equal(none._form.data.modes, undefined);
  const str = newEditor(makeHass(), { entity: PANEL, modes: "away" });
  assert.equal(str._form.data.modes, "away");
});

test("the sensors section header is a keyboard button (Tab, then Enter or Space)", () => {
  const card = newCard(makeHass());
  const header = card.shadowRoot.innerHTML.match(/<div class="section-title toggle"[^>]*>/)[0];
  assert.match(header, /role="button"/);
  assert.match(header, /tabindex="0"/);
  assert.match(header, /aria-expanded="true"/);
  // The re-render after the toggle keeps the header (and its keyboard attributes) in place.
  click(card, { action: "toggle_section", section: "sensors" });
  const folded = card.shadowRoot.innerHTML.match(/<div class="section-title toggle"[^>]*>/)[0];
  assert.match(folded, /role="button" tabindex="0"/);
  assert.match(folded, /aria-expanded="false"/);
});

test("smoke detectors show a smoke detector icon, with its alert variant when smoke is detected", () => {
  const SMOKE = "M12 4C16.41 4 20 7.59 20 12S16.41 20";
  const SMOKE_ALERT = "M10 4C14.4 4 18 7.6 18 12S14.4 20";
  const tile = (html) => html.match(/data-entity="binary_sensor\.kitchen_smoke">([\s\S]*?)<\/div>\s*<\/div>/)[1];
  const ok = tile(newCard(makeHass()).shadowRoot.innerHTML);
  assert.ok(ok.includes(SMOKE), "mdi:smoke-detector-variant when clear");
  assert.ok(!ok.includes("M12,0A12,12") && !ok.includes("L15.5,18C14.97"), "no barred circle");
  const smoke = { ...states["binary_sensor.kitchen_smoke"], state: "on" };
  assert.ok(tile(newCard(makeHass({ "binary_sensor.kitchen_smoke": smoke })).shadowRoot.innerHTML).includes(SMOKE_ALERT));
  // An unavailable detector keeps the plain icon.
  const gone = { ...smoke, state: "unavailable" };
  assert.ok(tile(newCard(makeHass({ "binary_sensor.kitchen_smoke": gone })).shadowRoot.innerHTML).includes(SMOKE));
});

test("the mock panel's last trigger is relative to now, so the screenshots do not change from day to day", () => {
  const last = states[PANEL].attributes.last_triggered;
  // Alarmo's format: local time, "YYYY-MM-DD HH:MM:SS".
  assert.match(last, /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
  const days = (Date.now() - al.parseTime(last)) / 86400e3;
  assert.ok(Math.abs(days - 83) < 0.01, `last_triggered is ${days.toFixed(2)} days ago`);
  assert.match(newCard(makeHass()).shadowRoot.innerHTML, /Last triggered 83 days ago/);
});

// A key typed on a physical keyboard, as the window listener receives it while the pad is open.
const key = (card, k, target = { localName: "body", getAttribute: () => null }, extra = {}) => {
  const ev = { key: k, composedPath: () => [target], preventDefault() {}, stopPropagation() {}, ...extra };
  card._onKey(ev);
  return ev;
};

test("the number pad takes the physical keyboard: digits, Backspace and Enter", () => {
  const hass = makeHass(withCode);
  const card = newCard(hass);
  click(card, { action: "mode", mode: "disarm" });
  for (const d of ["1", "2", "3", "9"]) key(card, d);
  key(card, "Backspace");
  key(card, "4");
  assert.match(card.shadowRoot.innerHTML, /(<i><\/i>){4}/);
  key(card, "Enter");
  assert.deepEqual(plain(hass.calls), [["alarm_control_panel", "alarm_disarm", { entity_id: PANEL, code: "1234" }]]);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /Code to disarm/);
});

test("the number pad leaves other fields, shortcuts and focused buttons alone", () => {
  const hass = makeHass(withCode);
  const card = newCard(hass);
  // Pad closed: digits do nothing.
  key(card, "1");
  assert.equal(card._code, undefined);
  click(card, { action: "mode", mode: "disarm" });
  // Typing in a field elsewhere on the page (HA search, another card) does not feed the pad.
  key(card, "5", { localName: "input", getAttribute: () => null });
  key(card, "5", { localName: "div", isContentEditable: true, getAttribute: () => null });
  // Ctrl+1 and the like are shortcuts, not digits.
  key(card, "6", undefined, { ctrlKey: true });
  assert.equal(card._code, "");
  key(card, "1");
  // Enter on a focused button clicks that button (Cancel here): the pad must not submit on top of it.
  key(card, "Enter", { localName: "button", getAttribute: () => null });
  assert.equal(hass.calls.length, 0);
  assert.equal(card._code, "1");
  // Enter without a code sends nothing.
  key(card, "Backspace");
  key(card, "Enter");
  assert.equal(hass.calls.length, 0);
});

test("a text code (password field) is not fed by the window listener: the field types itself", () => {
  const p = withCode[PANEL];
  const hass = makeHass({ [PANEL]: { ...p, attributes: { ...p.attributes, code_format: "text" } } });
  const card = newCard(hass);
  click(card, { action: "mode", mode: "disarm" });
  key(card, "1");
  assert.equal(card._code, "");
});

test("I18N: Serbian says triggered (okidanje / Uzbuna), not armed (aktiviran), and counts without agreement", () => {
  for (const l of ["sr", "sr-Latn"]) {
    const s = al.STRINGS[l];
    for (const k of ["s_triggered", "last_triggered", "never_triggered"]) assert.doesNotMatch(s[k], /активиран|aktiviran/i, `${l}.${k}: ${s[k]}`);
    assert.match(s.n_open, /: \{n\}$/, `${l}.n_open: ${s.n_open}`);
  }
  const card = newCard(makeHass(armedAway), { language: "sr-Latn" });
  assert.match(card.shadowRoot.innerHTML, /Poslednje okidanje pre 83 dana/);
  for (const n of [1, 2, 5, 21, 22]) assert.equal(al.STRINGS["sr-Latn"].n_open.replace("{n}", n), `Otvoreno: ${n}`);
});

test("I18N: Dutch subtitle reads as a duration (al 2 u 05), not a clock time (sinds 2 u 05)", () => {
  const card = newCard(makeHass(), { language: "nl" });
  assert.match(card.shadowRoot.innerHTML, /al 2 u 05/);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /sinds/);
});

test("the focus the card moves itself (code pad, confirm popup, detail button) never scrolls the page", () => {
  const spy = (card) => {
    const seen = [];
    card.shadowRoot.querySelector = (sel) => ({ focus: (opts) => seen.push([sel, opts]) });
    return seen;
  };
  const pad = newCard(makeHass(withCode));
  const padSeen = spy(pad);
  click(pad, { action: "mode", mode: "disarm" });
  const confirm = newCard(makeHass(), { confirm_disarm: true });
  const confirmSeen = spy(confirm);
  click(confirm, { action: "mode", mode: "disarm" });
  const mini = newCard(makeHass(), {}, al.AlarmMiniCard);
  const miniSeen = spy(mini);
  mini._toggleZoom({ detail: 0 });
  for (const seen of [padSeen, confirmSeen, miniSeen]) {
    assert.ok(seen.length, "the card moved the focus");
    for (const [sel, opts] of seen) assert.equal(opts?.preventScroll, true, `${sel}: focus() without preventScroll`);
  }
});

// ----- Activity (logbook) ---------------------------------------------------

const tick = () => new Promise((r) => setImmediate(r));
const LOGBOOK = (now = Date.now()) => [
  { when: (now - 3 * 3600000) / 1000, state: "armed_away", entity_id: PANEL, context_user_id: "u-alex" },
  { when: (now - 2 * 3600000) / 1000, state: "arming", entity_id: PANEL },
  { when: (now - 1 * 3600000) / 1000, state: "disarmed", entity_id: PANEL, context_user_id: "u-other", context_name: "Morning routine" },
  { when: (now - 90 * 60000) / 1000, state: "triggered", entity_id: PANEL },
];
const activityHass = (list = LOGBOOK(), extra = {}) => {
  const hass = makeHass({ "person.alex": { entity_id: "person.alex", state: "home", attributes: { friendly_name: "Alex", user_id: "u-alex" } }, ...extra });
  hass.ws = [];
  hass.callWS = (msg) => {
    hass.ws.push(msg);
    return Promise.resolve(msg.type === "logbook/get_events" ? list : []);
  };
  return hass;
};

test("Activity: off by default, no logbook request", () => {
  const hass = activityHass();
  const card = newCard(hass);
  assert.equal(hass.ws.length, 0);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /Activity/);
});

test("Activity: arm / disarm / trigger changes from the logbook, newest first, with who did it", async () => {
  const hass = activityHass();
  const card = newCard(hass, { show_activity: true });
  assert.equal(hass.ws.length, 1);
  const msg = hass.ws[0];
  assert.equal(msg.type, "logbook/get_events");
  assert.deepEqual([...msg.entity_ids], [PANEL]);
  assert.ok(Math.abs(Date.now() - 24 * 3600000 - Date.parse(msg.start_time)) < 5000, "24 h window by default");
  await tick();
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /Activity/);
  // The intermediate "arming" step is left out.
  assert.doesNotMatch(html, /class="act-state">Arming</);
  const states = [...html.matchAll(/class="act-state">([^<]+)</g)].map((m) => m[1]);
  // The panel's own last change (disarmed, 2 h 05 ago) is missing from the mock logbook: it is added in its place.
  assert.deepEqual(states, ["Disarmed", "Triggered", "Disarmed", "Armed away"]);
  // A person's user resolves to the person's name; an unknown user falls back to the context's name.
  assert.match(html, /by Alex/);
  assert.match(html, /by Morning routine/);
  assert.match(html, /class="act-time" title="[^"]+">1 hour ago</);
});

test("Activity: count and period options, and no refetch while nothing changes", async () => {
  const hass = activityHass();
  const card = newCard(hass, { show_activity: true, activity_count: 2, activity_hours: 168 });
  assert.ok(Math.abs(Date.now() - 168 * 3600000 - Date.parse(hass.ws[0].start_time)) < 5000);
  await tick();
  assert.equal([...card.shadowRoot.innerHTML.matchAll(/class="act-state"/g)].length, 2);
  card.hass = { ...hass };
  assert.equal(hass.ws.length, 1);
  // A new panel state fetches again.
  card.hass = { ...hass, states: { ...hass.states, [PANEL]: { ...states[PANEL], state: "armed_home", last_changed: new Date().toISOString() } } };
  assert.equal(hass.ws.length, 2);
});

test("Activity: an empty period says so", async () => {
  const hass = activityHass([]);
  const card = newCard(hass, { show_activity: true, activity_hours: 1 });
  await tick();
  // Last change 2 h 05 ago: out of a 1 h window.
  assert.match(card.shadowRoot.innerHTML, /No activity/);
  assert.equal(al.STRINGS.fr.no_activity, "Aucune activité");
});

test("Activity: an administrator's user list names users without a person", async () => {
  const hass = activityHass([{ when: Date.now() / 1000 - 600, state: "armed_night", context_user_id: "u-bob" }]);
  hass.user = { id: "u-admin", name: "Admin", is_admin: true };
  const ws = hass.callWS;
  hass.callWS = (msg) => (msg.type === "config/auth/list" ? (hass.ws.push(msg), Promise.resolve([{ id: "u-bob", name: "Bob" }])) : ws(msg));
  const card = newCard(hass, { show_activity: true });
  await tick();
  await tick();
  assert.ok(hass.ws.some((m) => m.type === "config/auth/list"));
  assert.match(card.shadowRoot.innerHTML, /by Bob/);
});

test("Activity: the editor offers the toggle, and the count and period once it is on", () => {
  for (const Editor of [al.AlarmCardEditor, al.AlarmMiniCardEditor]) assert.ok(Editor.toggles.some(([n, d]) => n === "show_activity" && d === false));
  const editor = new al.AlarmCardEditor();
  editor._hass = makeHass();
  const names = (s) => s.flatMap((x) => (x.schema ? names(x.schema) : [x.name]));
  editor._config = { entity: PANEL };
  assert.ok(!names(editor._schema()).includes("activity_count"));
  editor._config = { entity: PANEL, show_activity: true };
  assert.ok(names(editor._schema()).includes("activity_count"));
  assert.ok(names(editor._schema()).includes("activity_hours"));
  for (const k of ["activity_count", "activity_hours"]) for (const [l, s] of Object.entries(al.STRINGS)) assert.ok(s[k], `${l}.${k}`);
});

// ----- Alarmo: alarmo_failed_to_arm ------------------------------------------

const closed = { "binary_sensor.kitchen_window": { ...states["binary_sensor.kitchen_window"], state: "off" } };
const eventHass = (overrides = closed) => {
  const hass = makeHass(overrides);
  hass.subs = [];
  hass.unsubs = 0;
  hass.user = { id: "u-alex", name: "Alex" };
  hass.connection = {
    subscribeEvents: (cb, type) => {
      hass.subs.push({ cb, type });
      return Promise.resolve(() => hass.unsubs++);
    },
  };
  return hass;
};
const connected = (hass, config = {}, Cls = al.AlarmCard) => {
  const card = new Cls();
  card.isConnected = true;
  card.setConfig({ entity: PANEL, sensors, ...config });
  card.hass = hass;
  card.connectedCallback();
  return card;
};
const failed = (hass, data, context = {}) => hass.subs.at(-1).cb({ event_type: "alarmo_failed_to_arm", data, context });
const FAIL = { command: "arm_away", reason: "open_sensors", sensors: ["binary_sensor.kitchen_window", "binary_sensor.front_door"], area_id: "1" };

test("Alarmo: subscribes once to alarmo_failed_to_arm, and unsubscribes when removed", async () => {
  const hass = eventHass();
  const card = connected(hass);
  card.hass = { ...hass, states: { ...hass.states } };
  assert.equal(hass.subs.length, 1);
  assert.equal(hass.subs[0].type, "alarmo_failed_to_arm");
  card.disconnectedCallback();
  await tick();
  assert.equal(hass.unsubs, 1);
});

test("Alarmo: no subscription for another integration's panel", () => {
  const hass = eventHass();
  hass.entities = { ...entities, [PANEL]: { entity_id: PANEL, platform: "manual" } };
  connected(hass);
  assert.equal(hass.subs.length, 0);
});

test("Alarmo: arming refused over open sensors shows them in the popup, Arm anyway forces it", () => {
  const hass = eventHass();
  const card = connected(hass);
  click(card, { action: "mode", mode: "arm_away" });
  assert.deepEqual(plain(hass.calls), [["alarm_control_panel", "alarm_arm_away", { entity_id: PANEL }]]);
  failed(hass, FAIL, { user_id: "u-alex" });
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /dialog-open/);
  assert.match(html, /Kitchen window, Front door: open\. Arm away anyway\?/);
  assert.match(html, /Arm anyway/);
  click(card, { action: "confirm_ok" });
  assert.deepEqual(plain(hass.calls.slice(1)), [["alarmo", "arm", { entity_id: PANEL, mode: "away", force: true }]]);
});

test("Alarmo: Arm anyway reuses the code just typed", () => {
  const hass = eventHass({ ...withCode, ...closed });
  const card = connected(hass);
  click(card, { action: "mode", mode: "arm_away" });
  for (const d of ["1", "2", "3", "4"]) click(card, { action: "key", digit: d });
  click(card, { action: "pad_ok" });
  failed(hass, FAIL);
  click(card, { action: "confirm_ok" });
  assert.deepEqual(plain(hass.calls.at(-1)), ["alarmo", "arm", { entity_id: PANEL, mode: "away", force: true, code: "1234" }]);
});

test("Alarmo: events for another panel, another user, another reason, or not ours are ignored", () => {
  const hass = eventHass();
  const card = connected(hass);
  failed(hass, FAIL); // no entity_id and the card did not arm
  failed(hass, { ...FAIL, entity_id: "alarm_control_panel.other" });
  failed(hass, { ...FAIL, entity_id: PANEL }, { user_id: "u-someone-else" });
  failed(hass, { ...FAIL, entity_id: PANEL, reason: "not_allowed" });
  failed(hass, { ...FAIL, entity_id: PANEL, command: "arm_x\" onclick=\"y" });
  assert.doesNotMatch(card.shadowRoot.innerHTML, /dialog-open/);
  // Named panel, same user (armed from elsewhere): the popup shows, and Arm anyway asks nothing more.
  failed(hass, { ...FAIL, entity_id: PANEL, command: "arm_night" }, { user_id: "u-alex" });
  assert.match(card.shadowRoot.innerHTML, /Arm night anyway\?/);
});

test("Alarmo: the mini card listens too", () => {
  const hass = eventHass();
  const card = connected(hass, {}, al.AlarmMiniCard);
  click(card, { action: "mode", mode: "arm_home" });
  failed(hass, { ...FAIL, command: "arm_home" });
  assert.match(card.shadowRoot.innerHTML, /Arm home anyway\?/);
});

test("number pad: the live region reads how many digits were typed (translated), the dots are hidden from screen readers", () => {
  const card = newCard(makeHass(withCode), { language: "fr" });
  click(card, { action: "mode", mode: "disarm" });
  const live = () => card.shadowRoot.innerHTML.match(/<div class="dots" aria-live="polite">([\s\S]*?)<\/div>/)[1];
  assert.doesNotMatch(live(), /class="vh"/);
  for (const d of ["1", "2", "3"]) click(card, { action: "key", digit: d });
  assert.match(live(), /<span class="vh">Chiffres saisis : 3<\/span>/);
  assert.equal((live().match(/<i aria-hidden="true"><\/i>/g) || []).length, 3);
  click(card, { action: "key_back" });
  assert.match(live(), /Chiffres saisis : 2</);
});

test("the logo's accessible name follows the card's language", () => {
  for (const Cls of [al.AlarmCard, al.AlarmMiniCard]) {
    assert.match(newCard(makeHass(), { language: "fr" }, Cls).shadowRoot.innerHTML, /role="img" aria-label="Alarme"/);
    assert.match(newCard(makeHass(), { language: "de" }, Cls).shadowRoot.innerHTML, /role="img" aria-label="Alarmanlage"/);
  }
});

test("Activity: the tooltip's time follows the profile's 12 / 24 h clock (time_format)", async () => {
  const tip = async (time_format) => {
    const hass = activityHass();
    hass.locale = { language: "en", time_format };
    const card = newCard(hass, { show_activity: true });
    await tick();
    return card.shadowRoot.innerHTML.match(/class="act-time" title="([^"]+)"/)[1];
  };
  assert.match(await tip("12"), /\d:\d\d\s?[AP]M$/);
  assert.doesNotMatch(await tip("24"), /[AP]M/);
  assert.match(await tip("24"), /\b\d\d:\d\d$/);
});
