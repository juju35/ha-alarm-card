// Builds the integration's frontend from src/: the card (alarm-card.js), the Alarm panel (alarm-panel.js) and its
// sidebar badge (alarm-badge.js), into custom_components/alarm_card/frontend/ (not committed: CI and the release
// workflow build it, and the release zip carries it).
// Usage: node scripts/build.mjs
import { mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { splitI18n } from "./i18n-split.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
export const FRONTEND = `${root}custom_components/alarm_card/frontend`;
export const FILES = ["alarm-card.js", "alarm-panel.js", "alarm-badge.js"];
const { version } = JSON.parse(readFileSync(`${root}custom_components/alarm_card/manifest.json`, "utf8"));

export function build({ split = true } = {}) {
  mkdirSync(FRONTEND, { recursive: true });
  for (const f of readdirSync(FRONTEND)) if (f.endsWith(".js")) rmSync(`${FRONTEND}/${f}`);
  for (const file of FILES) {
    const code = readFileSync(`${root}src/${file}`, "utf8").replace("__VERSION__", version);
    const stem = file.replace(/\.js$/, "");
    // Translations: English stays in each file, every other language goes to <stem>.i18n.<lang>.js next to it,
    // fetched when needed (scripts/i18n-split.mjs).
    const r = split ? splitI18n(code, { stem, version, outDir: FRONTEND }) : { code, tables: 0, langs: [] };
    writeFileSync(`${FRONTEND}/${file}`, r.code);
    const kb = (s) => `${(s.length / 1024).toFixed(1)} KB`;
    console.log(`Built ${file} ${kb(r.code)}${r.tables ? ` (${r.tables} tables split into ${r.langs.length} language files, from ${kb(code)})` : ""}`);
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) build();
