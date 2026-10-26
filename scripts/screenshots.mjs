// Renders the cards with mock alarm data and saves the README screenshots.
// Usage: npm run build && npm run screenshots
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { states, entities, sensors, armedAway, arming, triggered, withCode } from "./mock-states.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cardJs = readFileSync(`${root}dist/alarm-card.js`, "utf8");

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

// Opens a fresh page for one shot and mounts the card with its mock states and overrides.
async function openCard(browser, s) {
  // A new page per shot: the card's script declares top-level names, which cannot be evaluated twice in one page.
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1000, height: 2000 } });
  page.on("pageerror", (err) => console.error(`pageerror (${s.file}): ${err.message}`));
  await page.setContent(page_html(s.theme, s.width));
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: cardJs });
  await page.evaluate(
    ({ type, config, states, entities, sensors, PANEL, overrides }) => {
      for (const [id, o] of Object.entries(overrides || {})) states[id] = { ...states[id], ...o };
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, entity: PANEL, sensors, ...config });
      el.hass = {
        states, entities, language: "en", locale: { language: "en" }, callService: () => {},
      };
      document.getElementById("root").appendChild(el);
    },
    { type: s.type, config: s.config, states, entities, sensors, PANEL, overrides: s.overrides }
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
    await page.evaluate((t) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; } }, (i * 1000) / fps);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`), clip });
  }
  await page.close();
  const out = `${root}screenshots/${gif.file}.gif`;
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(fps), "-i", join(dir, "f%03d.png"),
    "-vf", `scale=${clip.width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop", "0", out,
  ]);
  rmSync(dir, { recursive: true });
  console.log(`screenshots/${gif.file}.gif`);
}

const shots = [
  { file: "card", type: "alarm-card", theme: "light", width: 460, config: {} },
  { file: "card-dark", type: "alarm-card", theme: "dark", width: 460, config: {}, overrides: arming },
  { file: "card-armed", type: "alarm-card", theme: "light", width: 460, config: {}, overrides: armedAway },
  { file: "card-triggered", type: "alarm-card", theme: "dark", width: 460, config: {}, overrides: triggered },
  { file: "card-code", type: "alarm-card", theme: "light", width: 460, config: { show_sensors: false }, overrides: withCode, clicks: ['[data-mode="disarm"]', '[data-digit="1"]', '[data-digit="2"]'] },
  { file: "mini-card", type: "alarm-mini-card", theme: "light", width: 380, config: {} },
  { file: "mini-card-dark", type: "alarm-mini-card", theme: "dark", width: 380, config: {}, overrides: arming },
  { file: "mini-card-zoom", type: "alarm-mini-card", theme: "light", width: 460, config: {}, clicks: [".zoom"] },
];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
for (const s of shots) {
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
  const box = await page.locator("#root").boundingBox();
  await page.screenshot({
    path: `${root}screenshots/${s.file}.png`,
    clip: { x: 0, y: 0, width: s.width + 32, height: Math.ceil(box.height) + 32 },
    animations: "disabled",
  });
  console.log(`screenshots/${s.file}.png`);
  await page.close();
}

// One looping GIF per distinct shield animation: al-flash while triggered, al-pulse while arming.
await makeGif(browser, { file: "triggered", type: "alarm-card", theme: "light", width: 460, config: {}, overrides: triggered });
await makeGif(browser, { file: "arming", type: "alarm-card", theme: "light", width: 460, config: {}, overrides: arming });
await browser.close();
