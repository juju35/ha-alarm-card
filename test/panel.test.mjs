// The Alarm panel (src/alarm-panel.js) in Chromium, with a stand-in for Home Assistant: Alarmo's mock data behind
// the websocket calls, and every write recorded. Each test clicks through a tab the way a user would and checks
// what the panel sends to Alarmo's API (the same payloads as Alarmo's own panel).
// Needs Playwright's Chromium: skipped locally without it, failing in CI (CI=true).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { alarmo, entities, NOW, states, withCode } from "../scripts/mock-states.mjs";

const cardJs = readFileSync(new URL("../src/alarm-card.js", import.meta.url), "utf8").replace("__VERSION__", "test");
const panelJs = readFileSync(new URL("../src/alarm-panel.js", import.meta.url), "utf8").replace("__VERSION__", "test");
const strings = readFileSync(new URL("../src/alarm-panel.js", import.meta.url), "utf8");

let browser;
let skip = false;
before(async () => {
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch (e) {
    if (process.env.CI) throw e;
    skip = "Chromium not installed (npx playwright install chromium)";
  }
});
after(() => browser?.close());

// Mounts the panel on `tab` and returns the page; window.calls records { kind, path, data } of every write.
const mount = async ({ tab = "general", width = 1100, ov = {}, options = {} } = {}) => {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.errors = errors;
  await page.clock.setFixedTime(NOW);
  await page.route("http://ha.local/**", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><html><body style='margin:0'><div id=root></div></body></html>" }));
  await page.goto(`http://ha.local/alarm-panel/${tab}`);
  await page.addScriptTag({ content: cardJs });
  await page.addScriptTag({ content: panelJs });
  await page.evaluate(
    ({ states, entities, alarmo, ov, options }) => {
      const all = structuredClone(states);
      for (const [id, o] of Object.entries(ov)) all[id] = { ...all[id], ...o };
      window.calls = [];
      window.opts = { panel_title: "Alarm", hide_header: "off", panel_tabs: ["general", "sensors", "codes", "actions"], sidebar_badge: true, entity: "", illustration_theme: "auto", ...options };
      const el = document.createElement("alarm-card-panel");
      el.panel = { config: {} };
      el.hass = {
        states: all, entities, language: "en", locale: { language: "en" }, themes: { darkMode: false }, user: { is_admin: true },
        services: { notify: { mobile_app_phone: {} } },
        callService: async (domain, service, data) => window.calls.push({ kind: "service", path: `${domain}.${service}`, data }),
        callApi: async (_method, path, data) => {
          window.calls.push({ kind: "api", path, data });
          return { success: true };
        },
        callWS: async (msg) => {
          if (msg.type === "alarm_card/settings") return { options: window.opts, admin: true, alarmo: true };
          if (msg.type === "alarm_card/update_settings") {
            window.calls.push({ kind: "ws", path: msg.type, data: msg.options });
            window.opts = { ...window.opts, ...msg.options };
            return { options: window.opts };
          }
          return structuredClone(alarmo[msg.type.replace("alarmo/", "")]);
        },
        connection: { subscribeMessage: async () => () => {} },
      };
      document.getElementById("root").appendChild(el);
    },
    { states, entities, alarmo, ov, options },
  );
  await page.waitForFunction(() => document.querySelector("alarm-card-panel")?.shadowRoot?.querySelector(".tab.on"));
  await page.waitForTimeout(100);
  return page;
};
const $ = (page, sel) => page.locator(`alarm-card-panel >> css=${sel}`);
const calls = (page) => page.evaluate(() => window.calls);

test("the tabs of Alarmo's panel, then Settings; the Sensors tab counts the sensors keeping it from arming", async (t) => {
  if (skip) return t.skip(skip);
  const page = await mount();
  assert.deepEqual(await $(page, ".tab").allTextContents(), ["General", "Sensors1", "Codes", "Actions", "Settings"]);
  assert.match(await $(page, ".banner .sub").textContent(), /Kitchen window/);
  assert.deepEqual(page.errors, []);
  await page.close();
});

test("a mode switched on is sent with its delays (General)", async (t) => {
  if (skip) return t.skip(skip);
  const page = await mount();
  await $(page, '[data-id="mode:armed_vacation"] .tg').click();
  await page.waitForTimeout(50);
  const [c] = await calls(page);
  assert.deepEqual(c, { kind: "api", path: "alarmo/area", data: { area_id: "home", modes: { armed_vacation: { enabled: true, exit_time: 60, entry_time: 30, trigger_time: 180 } } } });
  await page.close();
});

test("a sensor's editor sends every setting, with the one changed (Sensors)", async (t) => {
  if (skip) return t.skip(skip);
  const page = await mount({ tab: "sensors" });
  await $(page, '[data-id="sensor:binary_sensor.kitchen_window"] .tx').click();
  await $(page, '[data-id="sensor:binary_sensor.kitchen_window"] [data-f="allow_open"]').click();
  await $(page, '[data-id="sensor:binary_sensor.kitchen_window"] [data-v="armed_home"]').click();
  await $(page, '[data-id="sensor:binary_sensor.kitchen_window"] [data-a="sensor-save"]').click();
  await page.waitForTimeout(50);
  const [c] = await calls(page);
  assert.equal(c.path, "alarmo/sensors");
  assert.equal(c.data.entity_id, "binary_sensor.kitchen_window");
  assert.equal(c.data.allow_open, true);
  assert.deepEqual(c.data.modes.sort(), ["armed_away", "armed_home", "armed_night"]);
  assert.equal(c.data.type, "window");
  await page.close();
});

test("sensors picked in Add sensors are added with a type from their device class", async (t) => {
  if (skip) return t.skip(skip);
  const page = await mount({ tab: "sensors" });
  await $(page, '[data-a="pick"][data-v="binary_sensor.garage_door"]').click();
  await $(page, '[data-a="sensors-add"]').click();
  await page.waitForTimeout(50);
  const [c] = await calls(page);
  assert.equal(c.data.entity_id, "binary_sensor.garage_door");
  assert.equal(c.data.type, "door");
  assert.equal(c.data.area, "home");
  assert.deepEqual(c.data.modes, ["armed_home", "armed_away", "armed_night"]);
  await page.close();
});

test("a new user needs a name and a code; an existing user's hashed code is never sent back (Codes)", async (t) => {
  if (skip) return t.skip(skip);
  const page = await mount({ tab: "codes" });
  await $(page, '[data-v="new-user"]').click();
  await $(page, '[data-id="new-user"] [data-f="name"]').fill("Pat");
  await $(page, '[data-id="new-user"] [data-a="user-save"]').click();
  assert.deepEqual(await calls(page), [], "no code: nothing sent");
  await $(page, '[data-id="new-user"] [data-f="code"]').fill("4321");
  await $(page, '[data-id="new-user"] [data-a="user-save"]').click();
  await page.waitForTimeout(50);
  const [c] = await calls(page);
  assert.deepEqual(c.data, { name: "Pat", can_arm: true, can_disarm: true, is_override_code: false, area_limit: [], code: "4321", enabled: true });
  await $(page, '[data-id="user:u1"] .tx').click();
  await $(page, '[data-id="user:u1"] [data-a="user-save"]').click();
  await page.waitForTimeout(50);
  const last = (await calls(page)).at(-1);
  assert.equal(last.data.user_id, "u1");
  assert.ok(!("code" in last.data) && !("old_code" in last.data));
  await page.close();
});

test("a notification is saved as Alarmo's automation, its wildcards kept as written (Actions)", async (t) => {
  if (skip) return t.skip(skip);
  const page = await mount({ tab: "actions" });
  await $(page, '[data-v="new-auto:notification"]').click();
  assert.match(await $(page, '[data-id="new-auto:notification"]').textContent(), /\{\{open_sensors\}\}/);
  await $(page, '[data-id="new-auto:notification"] [data-f="message"]').fill("Open: {{open_sensors}}");
  await $(page, '[data-id="new-auto:notification"] [data-a="auto-save"]').click();
  await page.waitForTimeout(50);
  const [c] = await calls(page);
  assert.equal(c.path, "alarmo/automations");
  assert.deepEqual(c.data.triggers, [{ event: "triggered", area: 0, modes: [] }]);
  assert.deepEqual(c.data.actions, [{ service: "notify.mobile_app_phone", data: { title: "", message: "Open: {{open_sensors}}" } }]);
  assert.equal(c.data.type, "notification");
  await page.close();
});

test("disarming from the header asks the code first, at the top of the panel", async (t) => {
  if (skip) return t.skip(skip);
  const page = await mount({ ov: withCode });
  await $(page, '.hbtns [data-v="disarm"]').click();
  await $(page, ".popup input").fill("1234");
  await $(page, '[data-a="popup-ok"]').click();
  await page.waitForTimeout(50);
  assert.deepEqual(await calls(page), [{ kind: "service", path: "alarm_control_panel.alarm_disarm", data: { entity_id: "alarm_control_panel.alarmo", code: "1234" } }]);
  await page.close();
});

test("the top bar hidden from the Settings tab: the tabs stay", async (t) => {
  if (skip) return t.skip(skip);
  const page = await mount({ tab: "settings" });
  await $(page, '[data-v="hide_header=all"]').click();
  await page.waitForTimeout(50);
  assert.deepEqual(await calls(page), [{ kind: "ws", path: "alarm_card/update_settings", data: { hide_header: "all" } }]);
  assert.equal(await page.locator("alarm-card-panel").getAttribute("bare"), "");
  assert.equal(await $(page, ".bannerwrap").isVisible(), false);
  assert.equal(await $(page, ".tabs").isVisible(), true);
  await page.close();
});

test("on a phone the mode buttons move under the header and nothing overflows", async (t) => {
  if (skip) return t.skip(skip);
  for (const tab of ["general", "sensors", "codes", "actions", "settings"]) {
    const page = await mount({ tab, width: 380 });
    assert.equal(await $(page, ".hbtns").isVisible(), false, tab);
    assert.equal(await $(page, ".modes-row").isVisible(), true, tab);
    const over = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(over <= 380, `${tab}: page ${over}px wide`);
    await page.close();
  }
});

test("every panel text has a translation in every language", () => {
  const src = strings.slice(strings.indexOf("const PANEL_STRINGS"), strings.indexOf("const PANEL_TABS"));
  const table = new Function(`${src}; return PANEL_STRINGS;`)();
  const langs = ["en", "fr", "de", "es", "it", "nl", "pt", "pl", "sr", "sr-Latn", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];
  assert.deepEqual(Object.keys(table).sort(), [...langs].sort());
  const keys = Object.keys(table.en).sort();
  for (const l of langs) {
    assert.deepEqual(Object.keys(table[l]).sort(), keys, l);
    for (const k of keys) {
      const ph = (s) => (s.match(/(?<!\{)\{\w+\}(?!\})|\{\{\w+\}\}/g) || []).sort();
      assert.deepEqual(ph(table[l][k]), ph(table.en[k]), `${l}.${k}: placeholders`);
    }
  }
});
