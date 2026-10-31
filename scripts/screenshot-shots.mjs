// The README screenshots and animations, as data: scripts/screenshots.mjs renders them and
// test/screenshots.test.mjs checks that every light shot has a dark twin showing the same state.
import { armedAway, arming, triggered, withCode } from "./mock-states.mjs";

export const shots = [
  { file: "card", type: "alarm-card", theme: "light", width: 460, config: {} },
  { file: "card-dark", type: "alarm-card", theme: "dark", width: 460, config: {} },
  { file: "card-armed", type: "alarm-card", theme: "light", width: 460, config: {}, overrides: armedAway },
  { file: "card-armed-dark", type: "alarm-card", theme: "dark", width: 460, config: {}, overrides: armedAway },
  { file: "card-triggered", type: "alarm-card", theme: "dark", width: 460, config: {}, overrides: triggered },
  { file: "card-triggered-light", type: "alarm-card", theme: "light", width: 460, config: {}, overrides: triggered },
  { file: "card-code", type: "alarm-card", theme: "light", width: 460, config: { show_sensors: false }, overrides: withCode, clicks: ['[data-mode="disarm"]', '[data-digit="1"]', '[data-digit="2"]'] },
  { file: "card-code-dark", type: "alarm-card", theme: "dark", width: 460, config: { show_sensors: false }, overrides: withCode, clicks: ['[data-mode="disarm"]', '[data-digit="1"]', '[data-digit="2"]'] },
  { file: "mini-card", type: "alarm-mini-card", theme: "light", width: 380, config: {} },
  { file: "mini-card-dark", type: "alarm-mini-card", theme: "dark", width: 380, config: {} },
  { file: "mini-card-zoom", type: "alarm-mini-card", theme: "light", width: 460, config: {}, clicks: [".zoom"] },
  { file: "mini-card-zoom-dark", type: "alarm-mini-card", theme: "dark", width: 460, config: {}, clicks: [".zoom"] },
];

// One looping GIF per distinct shield animation: al-flash while triggered, al-pulse while arming — each in light and dark.
export const gifs = [
  { file: "triggered", type: "alarm-card", theme: "light", width: 460, config: {}, overrides: triggered },
  { file: "triggered-dark", type: "alarm-card", theme: "dark", width: 460, config: {}, overrides: triggered },
  { file: "arming", type: "alarm-card", theme: "light", width: 460, config: {}, overrides: arming },
  { file: "arming-dark", type: "alarm-card", theme: "dark", width: 460, config: {}, overrides: arming },
];
