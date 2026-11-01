// Layout at narrow widths, measured in Chromium: the mini card at its default size (6 columns of the Sections
// view, ~240 px) with every arm mode, and the full card at its min_columns. The title must stay readable and
// no button or chip may leave the card (ha-card clips its overflow: a button outside cannot be clicked).
// Needs Playwright's Chromium (`npx playwright install chromium`). Without it the tests are skipped locally,
// and fail in CI (CI=true), where the Validate workflow installs it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { armedAway, arming, entities, NOW, sensors, states, triggered, withCode } from "../scripts/mock-states.mjs";

const cardJs = readFileSync(new URL("../src/alarm-card.js", import.meta.url), "utf8").replace("__VERSION__", "test");
const PANEL = "alarm_control_panel.alarmo";

const THEMES = {
  light: { "--secondary-background-color": "#ececec", "--card-background-color": "#ffffff", "--primary-text-color": "#212121", "--secondary-text-color": "#727272", "--divider-color": "rgba(0,0,0,.12)" },
  dark: { "--secondary-background-color": "#282828", "--card-background-color": "#1c1c1c", "--primary-text-color": "#e1e1e1", "--secondary-text-color": "#9b9b9b", "--divider-color": "rgba(225,225,225,.12)" },
};
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;background:var(--card-background-color);border-radius:12px;border:1px solid var(--divider-color);color:var(--primary-text-color);overflow:hidden}</style><slot></slot>"; } });`;

let browser;
let skip = false;
before(async () => {
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch();
  } catch (e) {
    if (process.env.CI) throw e;
    skip = "Chromium not installed (npx playwright install chromium)";
  }
});
after(() => browser?.close());

// Every arm mode (Manual, or Alarmo with all modes enabled): disarm + 5 modes in the mini card's row.
const allModes = (ov) => {
  const p = ov[PANEL] || states[PANEL];
  return { ...ov, [PANEL]: { ...p, attributes: { ...p.attributes, supported_features: 63 } } };
};
const VARIANTS = { disarmed: {}, armedAway, arming, triggered, withCode };

// Mounts a card at `width` px and returns the measured boxes, relative to the card.
const measure = async ({ type, width, language = "en", theme = "light", ov = {}, config = {} }) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
  try {
    await page.clock.setFixedTime(NOW);
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>:root{${Object.entries(THEMES[theme])
      .map(([k, v]) => `${k}:${v};`)
      .join("")}} body{margin:0;padding:16px;font-family:Roboto,Arial,sans-serif;font-size:14px}</style></head><body><div id="root" style="width:${width}px"></div></body></html>`);
    await page.addScriptTag({ content: HA_CARD });
    await page.addScriptTag({ content: cardJs });
    return await page.evaluate(
      ({ type, states, entities, sensors, ov, language, config, PANEL }) => {
        const all = structuredClone(states);
        for (const [id, o] of Object.entries(ov)) all[id] = { ...all[id], ...o };
        const el = document.createElement(type);
        el.setConfig({ type, entity: PANEL, sensors, ...config });
        el.hass = { states: all, entities, language, locale: { language }, callService: () => {} };
        document.getElementById("root").appendChild(el);
        const sr = el.shadowRoot;
        const card = sr.querySelector("ha-card").getBoundingClientRect();
        const box = (n) => {
          if (!n) return null;
          const r = n.getBoundingClientRect();
          return { left: r.left - card.left, right: r.right - card.left, top: r.top - card.top, bottom: r.bottom - card.top, width: r.width, height: r.height };
        };
        const span = sr.querySelector(".alert-line > span");
        return {
          card: { width: card.width },
          titles: box(sr.querySelector(".header .titles")),
          name: box(sr.querySelector(".header .name")),
          chip: box(sr.querySelector(".header > .chip")),
          chipText: box(sr.querySelector(".header > .chip .chip-text")),
          zoom: box(sr.querySelector(".zoom")),
          buttons: [...sr.querySelectorAll(".header .btn")].map(box),
          alert: span && { text: span.textContent, clipped: span.scrollHeight > span.clientHeight + 1 || span.scrollWidth > span.clientWidth + 1 },
        };
      },
      { type, states, entities, sensors, ov, language, config, PANEL },
    );
  } finally {
    await page.close();
  }
};

const inside = (m, b, what) => {
  assert.ok(b.left >= -0.5 && b.right <= m.card.width + 0.5, `${what} leaves the card: ${Math.round(b.left)}–${Math.round(b.right)} px of ${m.card.width}`);
};

test("mini card at its default width with every mode: the title stays readable and every button stays in the card", async (t) => {
  if (skip) return t.skip(skip);
  for (const language of ["en", "pl", "sr-Latn"])
    for (const [name, ov] of Object.entries(VARIANTS))
      for (const width of [240, 360]) {
        const m = await measure({ type: "alarm-mini-card", width, language, ov: allModes(ov) });
        const what = `${language} ${name} ${width}px`;
        assert.ok(m.titles.width >= 60, `${what}: titles ${Math.round(m.titles.width)} px`);
        inside(m, m.zoom, `${what}: detail button`);
        assert.ok(m.buttons.length >= 5, `${what}: ${m.buttons.length} buttons`);
        for (const [i, b] of m.buttons.entries()) {
          inside(m, b, `${what}: button ${i}`);
          assert.ok(b.width >= 31.5, `${what}: button ${i} shrunk to ${b.width} px`);
        }
        if (width === 240) {
          // Two rows: the detail button on the name's row, every button on the row below, all on one line.
          assert.ok(m.zoom.top < m.titles.bottom, `${what}: the detail button left the name's row`);
          assert.equal(new Set(m.buttons.map((b) => Math.round(b.top))).size, 1, `${what}: the buttons wrap on several rows`);
        }
      }
});

test("mini card with the mock's two modes keeps one row when it fits (360 px), and its title readable at 240 px", async (t) => {
  if (skip) return t.skip(skip);
  for (const [name, ov] of Object.entries({ arming, triggered })) {
    const m = await measure({ type: "alarm-mini-card", width: 240, ov });
    assert.ok(m.titles.width >= 60, `${name}: titles ${Math.round(m.titles.width)} px`);
  }
  const wide = await measure({ type: "alarm-mini-card", width: 360, ov: arming });
  for (const b of wide.buttons) assert.ok(b.top < wide.titles.bottom, "the buttons stay on the title's row when there is room");
});

test("full card at min_columns: the title keeps several characters and the chip stays a dot in the card", async (t) => {
  if (skip) return t.skip(skip);
  for (const language of ["en", "pl", "sr-Latn"])
    for (const theme of ["light", "dark"])
      for (const [name, ov] of Object.entries(VARIANTS)) {
        const m = await measure({ type: "alarm-card", width: 240, language, theme, ov });
        const what = `${language} ${theme} ${name}`;
        assert.ok(m.name.width >= 100, `${what}: title ${Math.round(m.name.width)} px`);
        inside(m, m.chip, `${what}: chip`);
        assert.equal(m.chipText.width, 0, `${what}: the hero already shows the state, the chip shows only its dot`);
      }
  // With room, the chip shows its text again.
  const wide = await measure({ type: "alarm-card", width: 400 });
  assert.ok(wide.chipText.width > 20);
});

test("full card: the header chip sits on the title's line, not across title and subtitle", async (t) => {
  if (skip) return t.skip(skip);
  for (const width of [460, 360]) {
    const m = await measure({ type: "alarm-card", width });
    const nameMid = (m.name.top + m.name.bottom) / 2;
    const chipMid = (m.chip.top + m.chip.bottom) / 2;
    assert.ok(Math.abs(nameMid - chipMid) <= 3, `${width}px: name centred at ${nameMid}, chip at ${chipMid}`);
  }
});

test("full card at 240 px: the line naming what triggered the alarm is not cut, even with two sensors", async (t) => {
  if (skip) return t.skip(skip);
  const m = await measure({ type: "alarm-card", width: 240, ov: triggered });
  assert.match(m.alert.text, /Kitchen window/);
  assert.equal(m.alert.clipped, false, `"${m.alert.text}" is cut`);
  const p = triggered[PANEL];
  const two = { [PANEL]: { ...p, attributes: { ...p.attributes, open_sensors: { "binary_sensor.kitchen_window": "on", "binary_sensor.front_door": "on" } } } };
  const m2 = await measure({ type: "alarm-card", width: 240, ov: two });
  assert.match(m2.alert.text, /Kitchen window, Front door/);
  assert.equal(m2.alert.clipped, false, `"${m2.alert.text}" is cut`);
});
