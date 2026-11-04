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
  for (const language of ["en", "pl", "sr-Latn", "uk", "sk"])
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
  for (const language of ["en", "pl", "sr-Latn", "uk", "sk"])
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

// Opens a page with the card's script, for the tests below that mount several cards or move things around.
const openPage = async () => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  await page.clock.setFixedTime(NOW);
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>:root{${Object.entries(THEMES.light)
    .map(([k, v]) => `${k}:${v};`)
    .join("")}} body{margin:0;padding:16px;font-family:Roboto,Arial,sans-serif;font-size:14px}</style></head><body></body></html>`);
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: cardJs });
  return page;
};

// Every visible box of the card (cut by its clipping ancestors), and the texts that end in an ellipsis.
const audit = async ({ type, width, language = "en", theme = "light", ov = {}, config = {}, zoom = false }) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
  try {
    await page.clock.setFixedTime(NOW);
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>:root{${Object.entries(THEMES[theme])
      .map(([k, v]) => `${k}:${v};`)
      .join("")}} body{margin:0;padding:16px;font-family:Roboto,Arial,sans-serif;font-size:14px}</style></head><body><div id="root" style="width:${width}px"></div></body></html>`);
    await page.addScriptTag({ content: HA_CARD });
    await page.addScriptTag({ content: cardJs });
    return await page.evaluate(
      async ({ type, states, entities, sensors, ov, language, config, PANEL, zoom }) => {
        const all = structuredClone(states);
        for (const [id, o] of Object.entries(ov)) all[id] = { ...all[id], ...o };
        const el = document.createElement(type);
        el.setConfig({ type, entity: PANEL, sensors, ...config });
        el.hass = { states: all, entities, language, locale: { language }, callService: () => {} };
        document.getElementById("root").appendChild(el);
        const sr = el.shadowRoot;
        if (zoom) sr.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const card = sr.querySelector("ha-card").getBoundingClientRect();
        const outside = [];
        for (const n of sr.querySelectorAll("ha-card *")) {
          if (n.localName === "style") continue;
          const r = n.getBoundingClientRect();
          if (!r.width && !r.height) continue;
          let left = r.left;
          let right = r.right;
          for (let a = n.parentElement; a && a.localName !== "ha-card"; a = a.parentElement)
            if (getComputedStyle(a).overflowX !== "visible") {
              const q = a.getBoundingClientRect();
              left = Math.max(left, q.left);
              right = Math.min(right, q.right);
            }
          if (right - left >= 0.5 && (left < card.left - 0.5 || right > card.right + 0.5))
            outside.push(`${n.localName}.${[...n.classList].join(".")} ${Math.round(left - card.left)}–${Math.round(right - card.left)} px`);
        }
        const cut = [];
        for (const sel of [".state", ".header > .chip .chip-text", ".modes .btn", ".tile .v", ".section-title .chip"])
          for (const n of sr.querySelectorAll(sel)) if (getComputedStyle(n).display !== "none" && n.scrollWidth > n.clientWidth + 1) cut.push(n.textContent.trim());
        // The mini card's state under its name is inline in a line that ends in an ellipsis: it is cut when one of
        // its line boxes goes past that line's right edge.
        for (const n of sr.querySelectorAll(".sub .st")) {
          const box = n.parentElement.getBoundingClientRect();
          if ([...n.getClientRects()].some((r) => r.right > box.right + 1)) cut.push(n.textContent.trim());
        }
        const name = sr.querySelector(".header .name");
        const ctx = document.createElement("canvas").getContext("2d");
        const cs = getComputedStyle(name);
        ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const chip = sr.querySelector(".header > .chip .chip-text");
        return {
          card: card.width,
          outside,
          cut,
          name: name.getBoundingClientRect().width,
          fourChars: ctx.measureText(`${name.textContent.trim().slice(0, 4)}…`).width,
          chip: chip && { text: chip.textContent, shown: getComputedStyle(chip).display !== "none", whole: chip.scrollWidth <= chip.clientWidth + 1 },
        };
      },
      { type, states, entities, sensors, ov, language, config, PANEL, zoom },
    );
  } finally {
    await page.close();
  }
};

const unavailable = { [PANEL]: { ...states[PANEL], state: "unavailable" } };

test("phone width (6 of 12 columns, 156, 168 and 178 px) and 245 px: nothing leaves the card, no state is cut (mini card's too), the title keeps 4 characters", async (t) => {
  if (skip) return t.skip(skip);
  const kinds = [
    ["alarm-card", {}, false],
    ["alarm-mini-card", {}, false],
    ["alarm-mini-card", {}, true],
  ];
  for (const [type, config, zoom] of kinds)
    for (const language of ["en", "pl", "sr-Latn", "uk", "sk"])
      for (const [name, ov] of Object.entries({ ...VARIANTS, unavailable }))
        for (const width of [156, 168, 178, 245]) {
          const theme = width === 168 ? "dark" : "light";
          const m = await audit({ type, width, language, theme, ov: allModes(ov), config, zoom });
          const what = `${type}${zoom ? " zoomed" : ""} ${language} ${theme} ${name} ${width}px`;
          assert.deepEqual(m.outside, [], `${what}: leaves the card`);
          assert.deepEqual(m.cut, [], `${what}: cut`);
          assert.ok(m.name + 0.5 >= m.fourChars, `${what}: title ${Math.round(m.name)} px < 4 characters (${Math.round(m.fourChars)} px)`);
        }
});

test("full card (and zoomed mini card) from 245 to 500 px: the header chip shows its whole label in English, Polish, Serbian, Ukrainian and Slovak", async (t) => {
  if (skip) return t.skip(skip);
  for (const [type, zoom] of [["alarm-card", false], ["alarm-mini-card", true]])
    for (const language of ["en", "pl", "sr-Latn", "uk", "sk"])
      for (const [name, ov] of Object.entries({ ...VARIANTS, unavailable }))
        for (const width of [245, 285, 320, 500]) {
          const m = await audit({ type, width, language, ov, zoom });
          const what = `${type}${zoom ? " zoomed" : ""} ${language} ${name} ${width}px`;
          assert.ok(m.chip.shown && m.chip.whole, `${what}: chip "${m.chip.text}" ${m.chip.shown ? "cut" : "hidden"}`);
          assert.deepEqual(m.outside, [], `${what}: leaves the card`);
        }
});

test("in a parent sized by its content (inline-block, grid auto column, flex row) the cards keep a usable width", async (t) => {
  if (skip) return t.skip(skip);
  const page = await openPage();
  try {
    const widths = await page.evaluate(
      ({ states, entities, sensors, PANEL }) => {
        const out = {};
        const parents = {
          "inline-block": "display:inline-block",
          "grid auto": "display:grid;grid-template-columns:auto auto;justify-content:start",
          flex: "display:flex",
        };
        for (const [k, style] of Object.entries(parents))
          for (const type of ["alarm-card", "alarm-mini-card"]) {
            const parent = document.createElement("div");
            parent.style.cssText = style;
            document.body.appendChild(parent);
            const el = document.createElement(type);
            el.setConfig({ type, entity: PANEL, sensors });
            el.hass = { states, entities, language: "en", callService: () => {} };
            parent.appendChild(el);
            out[`${type} in ${k}`] = el.shadowRoot.querySelector("ha-card").getBoundingClientRect().width;
          }
        return out;
      },
      { states, entities, sensors, PANEL },
    );
    for (const [k, w] of Object.entries(widths)) assert.ok(w >= 300, `${k}: ${Math.round(w)} px`);
  } finally {
    await page.close();
  }
});

test("two cards side by side in a 1fr 1fr grid (grid card, layout-card) or a horizontal stack shrink with it: no overflow", async (t) => {
  if (skip) return t.skip(skip);
  const page = await openPage();
  try {
    const rows = await page.evaluate(
      ({ states, entities, sensors, PANEL }) => {
        const out = [];
        const parents = {
          "grid 1fr 1fr": ["display:grid;grid-template-columns:1fr 1fr;gap:8px", false],
          // layout-card and HA wrap each card in an element of their own: that wrapper is the grid item.
          "grid 1fr 1fr, wrapped": ["display:grid;grid-template-columns:1fr 1fr;gap:8px", true],
          "horizontal stack": ["display:flex;gap:8px", false],
        };
        for (const width of [320, 360, 500])
          for (const [k, [style, wrap]] of Object.entries(parents))
            for (const type of ["alarm-card", "alarm-mini-card"]) {
              document.body.innerHTML = "";
              const parent = document.createElement("div");
              parent.style.cssText = `${style};width:${width}px`;
              document.body.appendChild(parent);
              const cards = [];
              for (let i = 0; i < 2; i++) {
                const el = document.createElement(type);
                el.setConfig({ type, entity: PANEL, sensors });
                el.hass = { states, entities, language: "en", callService: () => {} };
                if (k === "horizontal stack") el.style.cssText = "flex:1 1 0;min-width:0";
                if (wrap) {
                  const box = document.createElement("div");
                  box.appendChild(el);
                  parent.appendChild(box);
                } else parent.appendChild(el);
                cards.push(el);
              }
              const right = parent.getBoundingClientRect().right;
              for (const el of cards) {
                const r = el.shadowRoot.querySelector("ha-card").getBoundingClientRect();
                out.push({ what: `${type} in ${k} at ${width}px`, width: r.width, overflow: r.right - right });
              }
            }
        return out;
      },
      { states, entities, sensors, PANEL },
    );
    for (const r of rows) {
      assert.ok(r.overflow <= 0.5, `${r.what}: overflows by ${Math.round(r.overflow)} px`);
      assert.ok(r.width > 100, `${r.what}: ${Math.round(r.width)} px`);
    }
  } finally {
    await page.close();
  }
});

test("hass updates with the focus in the card (code pad open) do not scroll the page", async (t) => {
  if (skip) return t.skip(skip);
  const page = await openPage();
  try {
    const moves = await page.evaluate(
      async ({ states, entities, sensors, PANEL, withCode }) => {
        const all = { ...structuredClone(states), ...structuredClone(withCode) };
        const out = [];
        for (const type of ["alarm-card", "alarm-mini-card"]) {
          document.body.innerHTML = "";
          const top = document.createElement("div");
          top.style.height = "1500px";
          const bottom = document.createElement("div");
          bottom.style.height = "1500px";
          const el = document.createElement(type);
          el.style.cssText = "display:block;width:360px";
          el.setConfig({ type, entity: PANEL, sensors });
          el.hass = { states: all, entities, language: "en", callService: () => {} };
          document.body.append(top, el, bottom);
          // The card's lower edge just in view. Opening the pad (a click: the user's own action) brings it on
          // screen; the hass updates after it must not scroll any further.
          window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight + 40);
          await new Promise((r) => requestAnimationFrame(r));
          el.shadowRoot.querySelector('[data-action="mode"]').dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
          await new Promise((r) => requestAnimationFrame(r));
          const before = window.scrollY;
          for (let i = 0; i < 3; i++) {
            el.hass = { states: { ...all }, entities, language: "en", callService: () => {} };
            await new Promise((r) => requestAnimationFrame(r));
          }
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          out.push({ type, before, after: window.scrollY, focused: !!el.shadowRoot.activeElement });
        }
        return out;
      },
      { states, entities, sensors, PANEL, withCode },
    );
    for (const m of moves) {
      assert.ok(m.focused, `${m.type}: the pad took the focus`);
      assert.equal(m.after, m.before, `${m.type}: the page scrolled from ${m.before} to ${m.after}`);
    }
  } finally {
    await page.close();
  }
});

test("opening the confirm popup or the code pad brings it on screen (phone, the card partly scrolled out)", async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage({ viewport: { width: 390, height: 700 } });
  try {
    await page.clock.setFixedTime(NOW);
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>:root{${Object.entries(THEMES.light)
      .map(([k, v]) => `${k}:${v};`)
      .join("")}} body{margin:0;padding:16px;font-family:Roboto,Arial,sans-serif;font-size:14px}</style></head><body></body></html>`);
    await page.addScriptTag({ content: HA_CARD });
    await page.addScriptTag({ content: cardJs });
    const rows = await page.evaluate(
      async ({ states, entities, sensors, PANEL, armedAway, withCode }) => {
        const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const out = [];
        const cases = [
          // The popup sits at the top of the card: the card's top scrolled out, the Disarm button near the top.
          ["confirm popup", "alarm-card", armedAway, { confirm_disarm: true }, ".modal", "top"],
          ["confirm popup", "alarm-mini-card", armedAway, { confirm_disarm: true }, ".modal", "top"],
          // The pad opens under the buttons: the button near the bottom of the screen, the pad below it.
          ["code pad", "alarm-card", withCode, {}, ".pad", "bottom"],
          ["code pad", "alarm-mini-card", withCode, {}, ".pad", "bottom"],
        ];
        for (const [what, type, ov, config, sel, edge] of cases) {
          document.body.innerHTML = "";
          const all = { ...structuredClone(states), ...structuredClone(ov) };
          const top = document.createElement("div");
          top.style.height = "1500px";
          const bottom = document.createElement("div");
          bottom.style.height = "1500px";
          const el = document.createElement(type);
          el.style.cssText = "display:block;width:358px";
          el.setConfig({ type, entity: PANEL, sensors, ...config });
          el.hass = { states: all, entities, language: "en", callService: () => {} };
          document.body.append(top, el, bottom);
          await frame();
          const btn = el.shadowRoot.querySelector('[data-action="mode"][data-mode="disarm"]') || el.shadowRoot.querySelector('[data-action="mode"]');
          const b = btn.getBoundingClientRect();
          window.scrollTo(0, window.scrollY + (edge === "top" ? b.top - 20 : b.bottom - window.innerHeight + 20));
          await frame();
          btn.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
          await frame();
          const r = el.shadowRoot.querySelector(sel).getBoundingClientRect();
          out.push({ what: `${what} (${type})`, top: r.top, bottom: r.bottom, height: window.innerHeight, focused: !!el.shadowRoot.activeElement });
        }
        return out;
      },
      { states, entities, sensors, PANEL, armedAway, withCode },
    );
    for (const r of rows) {
      assert.ok(r.focused, `${r.what}: took the focus`);
      assert.ok(r.top >= -0.5 && r.bottom <= r.height + 0.5, `${r.what}: at ${Math.round(r.top)}–${Math.round(r.bottom)} px, screen 0–${r.height}`);
    }
  } finally {
    await page.close();
  }
});
