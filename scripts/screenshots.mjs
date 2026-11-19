// Renders the cards and the Alarm panel with mock alarm data and saves the README screenshots.
// Usage: npm run build && npm run screenshots
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { NOW, states, entities, sensors, logbook, alarmo, areas, history } from "./mock-states.mjs";
import { shots, gifs } from "./screenshot-shots.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const FRONTEND = `${root}custom_components/alarm_card/frontend`;
const cardJs = readFileSync(`${FRONTEND}/alarm-card.js`, "utf8");
const panelJs = readFileSync(`${FRONTEND}/alarm-panel.js`, "utf8");
const work = mkdtempSync(join(tmpdir(), "al-shots-"));

// The decoded pixels of an image or animation, frame by frame (size, timing and an MD5 of each RGBA frame):
// two files that look the same compare equal even when their bytes differ (PNG/GIF encoder, metadata).
const pixels = (file) =>
  execFileSync("ffmpeg", ["-nostdin", "-loglevel", "error", "-i", file, "-pix_fmt", "rgba", "-f", "framemd5", "-"], { encoding: "utf8" })
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .join("\n");

// Replaces screenshots/<name> with the fresh render only when it looks different: an unchanged render leaves
// the committed file (and the git history) alone.
const keep = (fresh, name) => {
  const dest = `${root}screenshots/${name}`;
  if (existsSync(dest) && pixels(dest) === pixels(fresh)) return console.log(`screenshots/${name} (unchanged)`);
  copyFileSync(fresh, dest);
  console.log(`screenshots/${name}`);
};

const THEMES = {
  light: {
    "--primary-background-color": "#e8eaed",
    "--secondary-background-color": "#ececec",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#212121",
    "--secondary-text-color": "#727272",
    "--divider-color": "rgba(0,0,0,.12)",
  },
  dark: {
    "--primary-background-color": "#111111",
    "--secondary-background-color": "#282828",
    "--card-background-color": "#1c1c1c",
    "--primary-text-color": "#e1e1e1",
    "--secondary-text-color": "#9b9b9b",
    "--divider-color": "rgba(225,225,225,.12)",
  },
};

// Minimal stand-in for Home Assistant's <ha-card>.
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;background:var(--card-background-color);border-radius:12px;" +
      "border:1px solid var(--divider-color);color:var(--primary-text-color);overflow:hidden}</style><slot></slot>";
  }
});`;

const page_html = (theme, width) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { ${Object.entries(THEMES[theme]).map(([k, v]) => `${k}:${v};`).join("")} }
  body { margin: 0; padding: 16px; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${width}px; }
</style></head><body><div id="root"></div></body></html>`;

const PANEL = "alarm_control_panel.alarmo";

// Opens a fresh page for one shot and mounts the card (or the panel, type "panel") with its mock states and overrides.
async function openCard(browser, s) {
  if (s.type === "panel") return openPanel(browser, s);
  const page = await newShotPage(browser, s, { width: 1000, height: 2000 });
  await page.setContent(page_html(s.theme, s.width));
  await trackAnimations(page);
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: cardJs });
  await page.evaluate(
    ({ type, config, states, entities, sensors, PANEL, overrides, logbook, event, dark }) => {
      for (const [id, o] of Object.entries(overrides || {})) states[id] = { ...states[id], ...o };
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, entity: PANEL, sensors, ...config });
      el.hass = {
        states, entities, language: "en", locale: { language: "en" }, callService: () => {},
        // The illustrated header's night picture follows the dark theme (no sun.sun in the mock).
        themes: { darkMode: dark },
        // The activity's logbook, and Alarmo's failed-to-arm event delivered right after the card subscribes.
        callWS: async (msg) => (msg.type === "logbook/get_events" ? logbook : []),
        connection: {
          subscribeEvents: async (cb, type) => {
            if (event && type === "alarmo_failed_to_arm") setTimeout(() => cb({ event_type: type, data: event, context: {} }), 0);
            return () => {};
          },
        },
      };
      document.getElementById("root").appendChild(el);
    },
    { type: s.type, config: s.config, states, entities, sensors, PANEL, overrides: s.overrides, logbook, event: s.event, dark: s.theme === "dark" }
  );
  return page;
}

// A new page per shot: the card's script declares top-level names, which cannot be evaluated twice in one page.
// Same time zone as this script (the mock's local timestamps) and a fixed locale, whatever the machine; the page's
// clock stands still at the mock's NOW: "for 2 h 05", the countdown and its bar never drift.
async function newShotPage(browser, s, viewport) {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport, timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: "en-US" });
  page.on("pageerror", (err) => console.error(`pageerror (${s.file}): ${err.message}`));
  await page.clock.setFixedTime(NOW);
  return page;
}

// document.getAnimations() leaves out the shadow DOM: window.allAnimations() walks into every shadow root.
const trackAnimations = (page) =>
  page.evaluate(() => {
    const walk = (root) => [...root.getAnimations(), ...[...root.querySelectorAll("*")].flatMap((el) => (el.shadowRoot ? walk(el.shadowRoot) : []))];
    window.allAnimations = () => walk(document);
  });

// The Alarm panel on a page of its own, on the tab of the shot, with Alarmo's mock data behind its websocket calls.
async function openPanel(browser, s) {
  const page = await newShotPage(browser, s, { width: s.width, height: 900 });
  // Served at the panel's address, as in Home Assistant: the panel reads its tab from the path.
  const html = page_html(s.theme, s.width).replace("padding: 16px;", "padding: 0;");
  await page.route("http://ha.local/**", (route) => route.fulfill({ body: html, contentType: "text/html" }));
  await page.goto(`http://ha.local/alarm-panel/${s.tab}`);
  await trackAnimations(page);
  await page.addScriptTag({ content: cardJs });
  await page.addScriptTag({ content: panelJs });
  await page.evaluate(
    ({ states, entities, areas, history, alarmo, overrides, dark, options, open }) => {
      for (const [id, o] of Object.entries(overrides || {})) states[id] = { ...states[id], ...o };
      const el = document.createElement("alarm-card-panel");
      el.panel = { config: {} };
      el.narrow = false;
      el.hass = {
        states, entities, areas, devices: {}, language: "en", locale: { language: "en" }, themes: { darkMode: dark }, user: { is_admin: true },
        services: { notify: { mobile_app_phone: {} } },
        callService: async () => {},
        callApi: async () => ({ success: true }),
        callWS: async (msg) =>
          msg.type === "history/history_during_period"
            ? history
            : msg.type === "alarm_card/settings"
            ? { options: { panel_title: "Alarm", hide_header: "off", panel_tabs: ["general", "sensors", "codes", "actions", "timeline"], sidebar_badge: true, entity: "", illustration_theme: "auto", ...options }, admin: true, alarmo: true }
            : alarmo[msg.type.replace("alarmo/", "")],
        connection: { subscribeMessage: async () => () => {}, subscribeEvents: async () => () => {} },
      };
      document.getElementById("root").appendChild(el);
      // The open tiles of the shot (an editor), once Alarmo's data is in.
      setTimeout(() => {
        for (const id of open || []) (id.startsWith("r-") || id.startsWith("t-") ? el._tlState().open : el._open).add(id);
        el._renderPage();
      }, 200);
    },
    { states, entities, areas, history, alarmo, overrides: s.overrides, dark: s.theme === "dark", options: s.options, open: s.open },
  );
  return page;
}

// Records one scene as a looping GIF. Needs ffmpeg on PATH. Every animation is paused and stepped frame by
// frame, so the GIF is identical whatever the machine's speed.
async function makeGif(browser, gif, { fps = 20, seconds = 3 } = {}) {
  const page = await openCard(browser, gif);
  await page.waitForTimeout(300);
  const box = await page.locator("#root").boundingBox();
  const clip = { x: 0, y: 0, width: gif.width + 32, height: Math.ceil(box.height) + 32 };
  const dir = mkdtempSync(join(tmpdir(), "al-frames-"));
  const frames = Math.round(fps * seconds);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => { for (const a of window.allAnimations()) { a.pause(); a.currentTime = t; } }, (i * 1000) / fps);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`), clip });
  }
  await page.close();
  const out = join(work, `${gif.file}.gif`);
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(fps), "-i", join(dir, "f%03d.png"),
    "-vf", `scale=${clip.width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop", "0", "-fflags", "+bitexact", "-flags:v", "+bitexact", out,
  ]);
  rmSync(dir, { recursive: true });
  keep(out, `${gif.file}.gif`);
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
// SHOTS=<regexp>: only the matching screenshots, no animation (a quick look while working on one view).
const only = process.env.SHOTS ? new RegExp(process.env.SHOTS) : null;
for (const s of shots.filter((x) => !only || only.test(x.file))) {
  const page = await openCard(browser, s);
  for (const sel of s.clicks || []) {
    // A mouse click (detail 1), not .click(): a keyboard-like click would move the focus and show its ring.
    await page.evaluate(
      (sel) =>
        document
          .querySelector("#root")
          .firstElementChild.shadowRoot.querySelector(sel)
          .dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 })),
      sel
    );
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(800);
  // Running animations (the shield's flash or pulse) are frozen at their start, so the shot is the same every run.
  await page.evaluate(() => { for (const a of window.allAnimations()) { a.pause(); a.currentTime = 0; } });
  const box = await page.locator("#root").boundingBox();
  const fresh = join(work, `${s.file}.png`);
  // The panel fills its page edge to edge; a card stands on the page's 16 px padding.
  const pad = s.type === "panel" ? 0 : 32;
  writeFileSync(
    fresh,
    await page.screenshot({ clip: { x: 0, y: 0, width: s.width + pad, height: Math.ceil(box.height) + pad }, animations: "disabled" })
  );
  keep(fresh, `${s.file}.png`);
  await page.close();
}

// One looping GIF per distinct shield animation (see scripts/screenshot-shots.mjs).
for (const gif of only ? [] : gifs) await makeGif(browser, gif, { seconds: gif.seconds || 3 });
await browser.close();
rmSync(work, { recursive: true });
