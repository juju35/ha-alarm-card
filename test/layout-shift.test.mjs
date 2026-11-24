// State updates in Chromium: Home Assistant sends a new hass on every state change of the instance, and a card
// rewritten at each one makes the dashboard jump. Updates of an entity the card does not show change nothing in its
// DOM; updates of its own sensors and buttons patch it in place (no element added or removed, no node replaced) and
// its height holds on every frame — disarmed and arming, full card and mini card (compact and zoomed).
// Needs Playwright's Chromium: skipped without it locally, and fails in CI (CI=true).
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { arming, buttons, entities, NOW, sensors, states } from "../scripts/mock-states.mjs";
import { cardSource } from "./source.mjs";

const cardJs = cardSource.replace("__VERSION__", "test");
const PANEL = "alarm_control_panel.alarmo";
// Home Assistant's <ha-card> is a Lit element: it renders its slot a few microtasks after it is attached, so that a
// card rewritten from scratch measured its header (the status pill) in an empty frame. A plain stand-in hides that;
// this one renders late, like Lit.
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement { connectedCallback() { if (this.shadowRoot) return;
  const r = this.attachShadow({ mode: "open" });
  Promise.resolve().then(() => Promise.resolve()).then(() => { r.innerHTML = "<style>:host{display:block;overflow:hidden}</style><slot></slot>"; }); } });`;

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

const flip = ["binary_sensor.hallway_motion", "binary_sensor.front_door", "light.porch"];
const unrelated = Array.from({ length: 10 }, (_, i) => ({ "sensor.other": { entity_id: "sensor.other", state: String(i), attributes: {} } }));
const relevant = Array.from({ length: 10 }, (_, i) => {
  const id = flip[i % flip.length];
  return { [id]: { ...states[id], state: i % 2 ? "on" : "off", last_changed: new Date(NOW - i * 1000).toISOString() } };
});

test("state updates patch the cards in place: nothing for others' entities, no node replaced, a steady height", async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
  await page.clock.setFixedTime(NOW);
  await page.setContent("<!doctype html><body style='margin:0;font-family:Roboto,Arial,sans-serif'></body>");
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: cardJs });
  const failures = await page.evaluate(
    async ({ base, arming, entities, sensors, buttons, unrelated, relevant, PANEL }) => {
      const frame = () => new Promise((r) => requestAnimationFrame(r));
      const out = [];
      for (const [variant, ov] of [["disarmed", {}], ["arming", arming]])
        for (const [type, zoom] of [["alarm-card", false], ["alarm-mini-card", false], ["alarm-mini-card", true]]) {
          const what = `${type}${zoom ? " zoomed" : ""} ${variant}`;
          const box = document.body.appendChild(document.createElement("div"));
          box.style.width = "420px";
          let states = { ...base, ...ov, "sensor.other": { entity_id: "sensor.other", state: "x", attributes: {} } };
          const el = document.createElement(type);
          el.setConfig({ type, entity: PANEL, sensors, buttons });
          const push = (patch) => {
            states = { ...states, ...patch };
            el.hass = { states, entities, language: "en", locale: { language: "en" }, callService: () => {} };
          };
          push({});
          box.appendChild(el);
          await frame();
          if (zoom) el.shadowRoot.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
          const mount = new Set();
          for (let i = 0; i < 3; i++) {
            await frame();
            mount.add(Math.round(el.getBoundingClientRect().height * 10) / 10);
          }
          if (mount.size !== 1) out.push(`${what}: height moved after it was shown: ${[...mount].join(" → ")}`);
          const r = el.shadowRoot;
          const nodes = [...r.querySelectorAll("*")];
          const height = el.getBoundingClientRect().height;
          const muts = [];
          new MutationObserver((l) => muts.push(...l)).observe(r, { subtree: true, childList: true, attributes: true, characterData: true });
          for (const p of unrelated) {
            push(p);
            await frame();
          }
          await new Promise((res) => setTimeout(res));
          if (muts.length) out.push(`${what}: ${muts.length} mutations on updates of another entity`);
          const heights = new Set();
          for (const p of relevant) {
            push(p);
            for (let f = 0; f < 3; f++) {
              heights.add(Math.round(el.getBoundingClientRect().height * 10) / 10);
              await frame();
            }
          }
          await new Promise((res) => setTimeout(res));
          const changed = muts.filter((m) => m.type === "childList" && [...m.addedNodes, ...m.removedNodes].some((n) => n.nodeType === 1));
          if (changed.length) out.push(`${what}: ${changed.length} element insertions/removals on updates of its own entities`);
          const gone = nodes.filter((n) => !n.isConnected).map((n) => n.localName);
          if (gone.length) out.push(`${what}: nodes replaced: ${[...new Set(gone)].join(", ")}`);
          if (heights.size !== 1 || !heights.has(Math.round(height * 10) / 10)) out.push(`${what}: height moved: ${height} → ${[...heights].join(", ")}`);
          box.remove();
        }
      return out;
    },
    { base: states, arming, entities, sensors, buttons, unrelated, relevant, PANEL },
  );
  await page.close();
  assert.deepEqual(failures, []);
});
