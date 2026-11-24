// Builds the integration's frontend from src/: the card (ES modules in src/alarm-card/), the Alarm panel (ES modules
// in src/alarm-panel/), each assembled into one classic script by scripts/bundle.mjs, and its sidebar badge
// (src/alarm-badge.js), into custom_components/alarm_card/frontend/ (not committed: CI and the release
// workflow build it, and the release zip carries it).
// Usage: node scripts/build.mjs
import { mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sourceOf } from "./bundle.mjs";
import { splitI18n } from "./i18n-split.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
export const FRONTEND = `${root}custom_components/alarm_card/frontend`;
export const FILES = ["alarm-card.js", "alarm-panel.js", "alarm-badge.js"];
const { version } = JSON.parse(readFileSync(`${root}custom_components/alarm_card/manifest.json`, "utf8"));

export function build({ split = true } = {}) {
  mkdirSync(FRONTEND, { recursive: true });
  for (const f of readdirSync(FRONTEND)) if (f.endsWith(".js")) rmSync(`${FRONTEND}/${f}`);
  for (const file of FILES) {
    const stem = file.replace(/\.js$/, "");
    const code = sourceOf(stem).replace("__VERSION__", version);
    // Translations: English stays in each file, every other language goes to <stem>.i18n.<lang>.js next to it,
    // fetched when needed (scripts/i18n-split.mjs). The panel is defined at once: it redraws when its language is in,
    // and Home Assistant's panel loader does not wait for a late definition.
    const opts = { stem, version, outDir: FRONTEND, waitDefine: stem !== "alarm-panel" };
    const r = split ? splitI18n(code, opts) : { code, tables: 0, langs: [] };
    writeFileSync(`${FRONTEND}/${file}`, r.code);
    const kb = (s) => `${(s.length / 1024).toFixed(1)} KB`;
    console.log(`Built ${file} ${kb(r.code)}${r.tables ? ` (${r.tables} tables split into ${r.langs.length} language files, from ${kb(code)})` : ""}`);
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) build();
