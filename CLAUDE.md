# Repository guide for agents

## Commits
- Write every commit message in **English**, following **Conventional Commits**:
  `type(scope): subject` — types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`,
  `perf`, `test`, `build`, `ci`, `revert`. Subject in imperative mood, lower case,
  no trailing period, ≤ 72 chars.
- Author identity must be **juju35** (`juju35 <julienstephan29@gmail.com>`), never an assistant identity.
- Messages are checked by **commitlint** (Conventional Commits) via the pre-commit
  `commit-msg` hook; run `pre-commit install` once so the hook is active locally.
- **External contributions**: add the contributor as a commit **co-author** (their GitHub
  noreply address) **only** when they supplied a patch/PR or a translation — never for a
  mere idea or feature issue.
- Keep history clean and linear: small, focused commits, one logical change each.
- `main` is protected by a ruleset: **squash-merge only**, the commit message is the PR
  **title + description** (not the commit list, so the screenshots bot's commits never
  reach `main`); tags follow a `v*` ruleset.

## Before opening a PR — run the checks locally
CI mirrors these; running them first avoids round-trips:
```sh
pre-commit run -a
npx --yes jscpd@5.4.2 .
npm run check
node --test test/*.test.mjs
pytest
```

## Releasing — how it works here
A release follows **every `feat` or `fix` merge** on `main` (the squash title) whose version has no
tag yet; `ci`/`docs`/`test`/`chore`/`refactor` merges publish nothing. Other bumps (e.g. `perf`) wait
for the next feat/fix, or run the Release workflow by hand (`gh workflow run release.yml`). The notes
gather the CHANGELOG sections of every version since the previous tag.
The workflow builds the frontend and attaches `alarm_card.zip` (the Marketplace installs it: `hacs.json` → `zip_release`).
**Never create a tag by hand.** The built frontend (`custom_components/alarm_card/frontend/`) is **not** committed.

The `Version consistency` check (validate.yml) requires the **same version in every place**, or the release fails.

## Bumping the version
This is an **INTEGRATION WITH A PANEL** repo (it serves the cards, the Alarm panel and its sidebar badge). A bump is
complete only when **every** file below carries the new version, updated together in one commit:
1. `CHANGELOG.md` → add a "## X.Y.Z - YYYY-MM-DD" section at the top (`### Features` | `Fixes` | `Performance` | `Maintenance`).
2. `custom_components/alarm_card/manifest.json` → `"version": "X.Y.Z"`.
3. `custom_components/alarm_card/const.py` → `VERSION: Final = "X.Y.Z"`.
4. `package.json` → `"version": "X.Y.Z"`, then `npm install` so `package-lock.json` matches (CI checks it).
- The card's, panel's and badge's JS take the manifest's version at build time (`__VERSION__`, scripts/build.mjs): no constant to bump there.
- Bump rule: `fix` → patch, `feat` → minor, breaking change → major.
- **Bump only when what users install changes** (shipped code, translations, assets of the
  release). CI, workflows, tests, screenshots, README, lint config, CLAUDE.md: no bump, no
  CHANGELOG entry, no version in the title (e.g. `ci: …`, `docs: …`, `test: …`, `chore: …`).
- A bumping PR/commit title carries the version in parentheses, e.g. `feat: new option (X.Y.Z)`.

## Layout
- `src/alarm-card/` (the cards), `src/alarm-panel/` (the Alarm panel), `src/alarm-badge.js` (its sidebar badge):
  built by `npm run build` into `custom_components/alarm_card/frontend/`.
- The panel reads and writes Alarmo only through Alarmo's API (`alarmo/*` websocket commands, `/api/alarmo/*` views);
  its own settings are the config entry's options (`alarm_card/settings`, `alarm_card/update_settings`).
- The panel draws its header with the card's helpers (`window.AlarmCardKit`, exported by the card).
- Python checks: `ruff`, `vulture custom_components .vulture_whitelist.py --min-confidence 60`, `pytest`.

## Source layout
- `src/alarm-card/` and `src/alarm-panel/` hold ES modules (entry `index.js`), concatenated in the order of the entry
  file by `scripts/bundle.mjs` (`sourceOf(name)`, called by `scripts/build.mjs`) into the classic script each ships as:
  import lines removed, `export` keywords dropped. Not committed once assembled. Modules share one scope, so keep
  top-level names unique across modules; a new module must be listed in the entry file.
- Translations: one file per language in `i18n/<lang>.js` (`export default { … };`), gathered by the table file next
  to them and rebuilt into a single object literal at build for `scripts/i18n-split.mjs`.
- `src/alarm-badge.js` (small) stays a single file. Tests evaluate the assembled sources (`test/source.mjs`).

## README layout
- Header order: H1, then the badge row, then the repo's **own logo** centered under the badges —
  `<p align="center"><img src=".../images/icon.svg" width="120"></p>`.
- **Brand logos**: right after the own logo, a centered `<p align="center">` row of the
  supported brands’ logos
  (`images/*.png|svg`), each linking to the brand site where relevant.
- Keep image `width`/`height` bounded so it doesn't render oversized (HACS/Marketplace).
- The README is consumed by the **homeassistant-projects** showcase site at build — keep its
  structure intact. Keep the **Marketplace** install section (badge/button, "Settings →
  Marketplace → Add from link", `/local/community/` resources) and the **Buy Me a Coffee**
  link; the public description must not mention the author's city.

## Supported integrations
This builds on other Home Assistant integrations, so keep the `## Supported integrations` section (title verbatim) listing the HA integrations it works on top of, with a link to each.

## Translations
- English is the source. Keep every language in sync when a user-facing string changes.
- Languages to keep in sync: en, fr, de, es, it, nl, pt, pl, sr, sr-Latn, ro, da, sv, bg, ru, uk, hu, sk, cs, sl, lv, el (no Irish or Maltese).
- Card and panel UI strings are split per language by `scripts/i18n-split.mjs` at build time (the sources keep every language).
- The integration's own strings are in `custom_components/alarm_card/translations/*.json` (pytest checks their keys).

## Screenshots — do not edit or commit them by hand
The Screenshots workflow regenerates them on the PR branch and commits them as the
`juju35-screenshots[bot]` GitHub App, so the PR checks re-run on that commit by themselves.
Comparison is exact. They are English, with light/dark twins, neutral/mock data, and never
real family names. **One GIF per distinct animation/state/variant** (not one per repo).

## Cards — UX & rendering
- Check rendering under **WebKit/Safari** (a `subgrid`-at-`:hover` bug has bitten before).
- New card or visual rework: **propose design options to choose from** before implementing.
- Visual editor: a mini-card's editor also exposes the **full-card options its expanded view
  uses** (README marks them "both"); complex options (lists/objects) stay **YAML-only**,
  flagged in the README.

## Conventions
- Prefer YAML over UI configuration; keep configurations minimal; test iteratively.
- Keep `ha-*` repos **independent**: no shared/factored code across repos — duplication is fine.
- English-only README and screenshots; mock/neutral data in any published screenshot.
- Call it the **Marketplace** (Home Assistant 2026.11), not HACS, in docs, issue comments
  and user replies.
- Reply to GitHub issues in the **language of the issue / reporter**, not French by default.
