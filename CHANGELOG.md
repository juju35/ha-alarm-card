# Changelog

## 1.7.0 - 2026-11-09

### Features
- **Cameras**: `cameras` lists camera entities whose latest snapshots show in a Cameras section while the alarm is triggered or its entry delay runs (`cameras_on_alarm: false` shows them always); a tap opens the camera's live view. Picked in the visual editor.

## 1.6.1 - 2026-11-09

### Fixes
- Translations: the cards are defined once the page's language file has arrived (at most 1.5 s; Home Assistant builds a card when its element gets defined), so the first render is already translated instead of English then redrawn; until a language file is in, a missing text reads the English one wherever the card has no fallback of its own.

## 1.6.0 - 2026-11-09

### Performance
- **Translations load on demand**: the bundle keeps English only (141 KB → 87 KB) and each other language is its own `alarm-card.i18n.<lang>.js` file next to it, fetched the first time a card needs it. Home Assistant loads every dashboard resource on every dashboard, so each page used to download and parse all 22 languages to use one. Until a language file has arrived (a few milliseconds), texts fall back to English, and the cards redraw once it is there.

### Maintenance
- Build: `scripts/i18n-split.mjs` splits the built bundle and rebuilds every table from the split files to check them (the build fails on any difference); `src/` keeps every language as before.
- Release: every file of `dist/` is attached. Manual installation copies the translation files too.

## 1.5.2 - 2026-11-08

### Fixes
- Cancelling an exit delay (panel arming) no longer asks "Disarm the alarm?": Cancel stops the arming at once (the code pad still opens when the panel needs a code).
- Alarmo: when Alarmo refuses to arm, the "Arm anyway" popup opens on one card only, the one that sent the arming, instead of on every card showing the panel.
- Accessibility: the confirmation popup is described by its message for screen readers, and closing the popup or the code pad gives the focus back to the button that opened it.

## 1.5.1 - 2026-11-07

### Fixes
- Confirmation popup: with several open sensors, the mini card grows to show the whole message, and the Cancel and OK buttons no longer fall outside the popup (they wrap to two rows when the card is narrow).
- Accessibility: the code pad tells screen readers how many digits were typed (translated); the logo's spoken name follows the card's language; the activity tooltip uses the 12 / 24 h clock of the user's profile.

## 1.5.0 - 2026-11-07

### Changes
- New optional activity section (`show_activity: true`) on the full card and the zoomed mini card: the panel's latest arm, disarm and trigger changes from the logbook, with when and who (the person linked to the user, or the automation), set with `activity_count` (default 5) and `activity_hours` (default 24, up to 168).
- Alarmo: when Alarmo refuses to arm because sensors are open (`alarmo_failed_to_arm` event), the card lists them in a popup at the top of the card, and "Arm anyway" arms again with `alarmo.arm` and `force: true`, reusing the code just typed.

## 1.4.10 - 2026-11-07

### Fixes
- Behaviour change: on a panel that needs no code, disarming now asks for confirmation by default (popup at the top of the card), on the mini card and the full card, so one tap on the disarm button no longer disarms the alarm. `confirm_disarm: false` restores the immediate disarm; with a code, the code entry still protects it without an extra confirmation.

## 1.4.9 — 2026-11-04

### Documentation
- README: images and links use absolute URLs, so the screenshots, icons, badges and links display in HACS (relative paths broke there).
- README: screenshots get a display size, so cards no longer show oversized in HACS and on GitHub.

## 1.4.8 — 2026-11-04
### Changes
- Added Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek translations (`ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv`, `el`), offered in the visual editor's language list ("Română", "Dansk", "Svenska", "Български", "Русский", "Українська", "Magyar", "Slovenčina", "Čeština", "Slovenščina", "Latviešu", "Ελληνικά").

### Maintenance
- Tests: language resolution of the new languages (`ro-RO` → ro, `da-DK` → da, `sv-SE` → sv, `ru-RU` → ru, `uk-UA` → uk, `el-GR` → el, …), editor labels of the new languages; the Serbian script test still covers only `sr` and `sr-Latn`.

## 1.4.7 - 2026-11-02
### Fixes
- Mini card: the header icon keeps its full size (40 px) in the compact view, like the full card.

## 1.4.6 — 2026-11-01
### Fixes
- Mini card at its default size (6 columns) with every arm mode: the name, the state and the detail button disappeared behind the row of buttons, so the full card could no longer be opened. When the buttons do not fit beside the name, they now move to a second row under it, right-aligned, with the detail button; the name always keeps a few characters.
- Full card at its narrowest (6 columns on a phone, about 160-240 px): the header chip keeps only its colored dot (the state is written right below, and stays in the chip's tooltip and screen-reader label), so the title is no longer cut to one letter. From 245 px up, the chip shows its whole label: the title gives way first, and a long label (Polish "Uzbrojony (poza domem)") goes onto two lines instead of ending in "…".
- Full card on a phone (about 160 px): the state moves under a smaller shield and gets the card's whole width, the sensor tiles take one column, and the sensors heading wraps, so nothing is cut or pushed out of the card.
- Cards placed in a parent sized by its content (layout-card, button-card, a grid with an `auto` column) no longer collapse to a sliver, and two cards side by side in a `1fr 1fr` grid or a horizontal stack shrink with it instead of overflowing it.
- Opening the code pad or the confirm popup brings the whole of it on screen, even when the top of the card is scrolled out (the popup sits at the top of the card) or the pad opens below the screen; the focus itself never scrolls the page, so updates from Home Assistant leave the page where it is.
- Mini card on a phone (6 columns, about 156-178 px): the state under the name wraps instead of being cut ("Uzbrojony (p…", "Aktiviran u odsus…").
- The header chip of the full card sits on the title's line instead of straddling the title and the subtitle.
- The line naming what set the alarm off ("Open: Kitchen window, Front door") wraps (up to three lines) instead of being cut after a few characters.
- Number code pad: the keyboard's digits, Backspace and Enter now work, as in Home Assistant's own dialog. The pad takes the focus when it opens, so Enter sends the code instead of pressing the mode button again.
- Serbian: the triggered state, the last trigger and "never triggered" no longer use the word for "armed" ("Узбуна / Uzbuna", "Последње окидање / Poslednje okidanje", "Никада није окинут / Nikada nije okinut"), and the open sensor count reads "Отворено: 2 / Otvoreno: 2".
- Dutch: the subtitle reads "al 2 u 05" (for 2 h 05) instead of "sinds 2 u 05", which read as a time of day.

### Maintenance
- Tests: layout at narrow widths measured in Chromium (mini card with every mode at 240 and 360 px, full card at 240 px, in English, Polish and Serbian Latin, light and dark), physical keyboard on the number pad, Serbian and Dutch strings. The Validate workflow installs Chromium for them.
- Tests: full card, mini card and zoomed mini card at phone width (156, 168, 178 and 245 px) in every state including unavailable, the mini card's state under its name, header chip label from 245 to 500 px, cards in an inline-block, an `auto` grid column, a `1fr 1fr` grid (with and without a wrapper) and a horizontal stack at 320, 360 and 500 px, the page not scrolling on Home Assistant updates with the focus in the card, and the popup and the pad opening on screen.
- README: the feature list names the 10 languages.
- Screenshots: the script only rewrites a file whose decoded pixels changed, so an unchanged render no longer shows up as a new commit.

## 1.4.5 — 2026-11-01
### Changes
- Added Italian, Dutch, European Portuguese and Polish translations (`it`, `nl`, `pt`, `pl`), offered in the visual editor's language list ("Italiano", "Nederlands", "Português (Portugal)", "Polski"). A Home Assistant set to `pt-BR` now uses European Portuguese instead of English. Relative times use European Portuguese formats (`pt` → `pt-PT` for Intl; `pt-BR` keeps Brazilian formats).

### Maintenance
- Tests: language resolution (`it-IT` → it, `nl-BE` → nl, `pt` and `pt-BR` → pt, `pl-PL` → pl, `ja` → en), no empty translation, editor labels of the new languages.

## 1.4.4 — 2026-11-01
### Changes
- Serbian translations by @cpmarexel2f (#14): Cyrillic (`sr`, "Српски") and Latin (`sr-Latn`, "Srpski (latinica)"), offered in the visual editor's language list. A Home Assistant set to `sr-Latn` picks the Latin script automatically.

### Maintenance
- Tests: language resolution (`fr-FR` → fr, `sr-Latn` → sr-Latn, `sr` → sr, `pt-BR` → en), script check of the Serbian strings (no Latin letter in `sr`, no Cyrillic in `sr-Latn`), editor language list matching the card's languages.

## 1.4.3 — 2026-10-29
### Fixes
- Text drawn in a state color (header chip, big state label, active mode button, sensor values, alerts) is now readable in light and dark themes: it mixes the state color with the theme's text color and reaches at least 4.5:1, while dots, icons and tints keep the pure color. The orange "Armed home" text on a white card was at 2.1:1 and the purple "Armed night" chip at 2.7:1 in a dark theme.
- The Home, Night, Vacation and Custom mode colors follow Home Assistant's palette (`--orange-color`, `--deep-purple-color`, `--cyan-color`, `--purple-color`), so a theme can change them.
- The "Sensors" section header can be reached with Tab and folded or unfolded with Enter or Space.
- Smoke detectors show a smoke detector icon (with its alert variant when smoke is detected) instead of a "no entry" sign.
- With reduced motion requested, the shield's color change and the section chevron no longer animate.

### Maintenance
- Screenshots are reproducible: fixed clock and time zone, mock timestamps relative to one instant, animations frozen (in the card's shadow DOM too) and bit-exact GIF encoding, so a run on another day no longer commits new images.
- CI: Biome 2.6.3 everywhere; the Lint workflow reads the Biome version from `.pre-commit-config.yaml`.

## 1.4.2 — 2026-10-29
### Fixes
- The visual editor now ticks the arm modes written without the `arm_` prefix (`modes: [away, home]`, as in the README example) and they can be unticked; ticking another mode no longer adds a second button for a mode already listed.
- A mode listed twice in `modes` (for example `away` and `arm_away`) shows a single button.
- Sensors that Alarmo reports because they are unavailable (or were deleted or renamed since they were added to Alarmo) are listed on their own "Unavailable" line instead of being shown as open.

## 1.4.1 — 2026-10-29
### Fixes
- With no `entity` set and several alarm panels, the visual editor now shows the same panel as the card (the first one alphabetically) and its arm modes; editing an option no longer silently switches the card to another panel.

## 1.4.0 — 2026-10-29
### Changes
- German labels use Home Assistant's own alarm terminology ("Aktiviert (Abwesend)", "Deaktiviert", "Wird aktiviert", "Anstehend", "Mit Bypass"…) instead of "scharf / unscharf", so the card matches the more-info dialog; Spanish "Armada de vacaciones" likewise.
- The mini card's visual editor offers "Show sensors" and "Fold the sensors by default", which apply to its zoomed view.

### Fixes
- "Arm anyway" with an open sensor in **Custom** mode on Alarmo now actually arms (Alarmo's `custom` mode is sent instead of `custom_bypass`, which its service refused).
- The visual editor's "Show arm / disarm buttons" toggle is labelled in every language instead of showing `show_controls`.
- Long state labels (German) in the full card's header shrink with an ellipsis instead of squeezing the title out.
- Only known arm modes are used as the state's color class.

### Maintenance
- CI: screenshots workflow safe on fork pull requests, apt retries fail explicitly; after pushing refreshed screenshots it re-runs Lint, Validate and HACS on the pull request branch (a GITHUB_TOKEN push does not trigger them); Playwright range aligned on 1.64.1.

## 1.3.0 — 2026-10-28
### Changes
- German and Spanish translations: both cards and the visual editor in `de` and `es` (auto-detected from Home Assistant or forced with `language`), with Deutsch and Español in the editor's language selector.
- In German, the arm mode inside the code pad title and the open-sensor confirmation keeps its capital letter, quoted, instead of being lowercased.

## 1.2.1 — 2026-10-28
### Fixes
- Disarm confirmation followed by the code pad: the first tap on a digit right after the popup closes is no longer swallowed by the double-click guard.
- "Open: ..." line when the alarm goes off: every open sensor is now its own more-info link, not only the first one.
- No more error when Home Assistant asks for the card size before the configuration is set.

### Maintenance
- Lighter refresh: the card re-checks its state every second only while an exit / entry delay counts down (every minute otherwise), and the auto-chosen alarm panel is remembered instead of rescanning every entity.
- Animated GIFs of the arming pulse and the triggered flash in the README, regenerated by a Screenshots workflow on pull requests.
- CI: release gated on tests, HACS action pinned to a release, sturdier apt / ffmpeg installs, unused Ruff tooling removed, changelog sections dated.

## 1.2.0 — 2026-10-26
### Fixes
- Code pad with a text code field (non-numeric `code_format`): typing a code now re-renders the pad, so the **OK** button enables and can be clicked instead of only responding to the Enter key. The numeric keypad was already re-rendering through its click handler.

## 1.1.0 — 2026-10-26
### Changes
- Header logo on a round tinted badge (40 px, 32 px on the mini card) in the card's accent color, like the other ha-* cards; the mini card's state shield (`show_logo: false`) is 32 px too.
- Active and confirm buttons (the current arm mode, Disarm while triggered, OK in the code pad and the confirmation popup) are tinted with their color instead of filled, like the other ha-* cards.
- The state under the shield is 22 px (was 20 px), like the other cards' main state.
- Header spacing like the other cards: icon 12 px from the card's top and left edges (the mini card's icon was 1.5 px lower), the content 8 px under the header.

### Maintenance
- Screenshots: 16 px frame on the theme background, shared theme tokens, 460 px cards and 380 px mini cards, English everywhere (mock data included).

## 1.0.2 — 2026-10-26

### Changes
- Mini card on a single row: the state shows in color under the name (with the exit / entry delay countdown, or the open sensor when the alarm goes off), next to the round arm / disarm buttons and the detail button. No more state pill and state line repeating each other. With `show_logo: false`, the state shield takes the logo's place.

### Maintenance
- Test for the compact layout (18 in all); screenshots regenerated.

## 1.0.1 — 2026-10-26

### Changes
- New card logo: a red shield sending out radar waves on a slate background, lighter so that it stands out on dark themes.

### Maintenance
- Screenshots regenerated.

## 1.0.0 — 2026-10-25

### Changes
- First release: **Alarm Card** and **Alarm Mini Card** for any alarm control panel (Alarmo, Manual…).
- State shield colored by state and mode, pulsing during the exit / entry delay and flashing when triggered.
- Arm buttons from the panel's supported features (`modes` to narrow them), Disarm / Cancel.
- Exit and entry delay countdown with a progress bar.
- Code pad (digits or text field) when the panel needs a code.
- Sensors section; arming with a sensor open asks first and forces the arming with Alarmo.
- Open and bypassed sensors, last trigger and who changed the state (Alarmo).
- Optional confirmation before disarming, collapsible sensors, detail button on the mini card.
- Visual editors, English and French.

### Maintenance
- Build, unit tests (17), Biome, jscpd, pre-commit, HACS validation and release workflows.
