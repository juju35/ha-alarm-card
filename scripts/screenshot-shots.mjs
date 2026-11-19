// The README screenshots and animations, as data: scripts/screenshots.mjs renders them and
// test/screenshots.test.mjs checks that every light shot has a dark twin showing the same state.
import { armedAway, arming, buttons, failedToArm, triggered, withCode } from "./mock-states.mjs";

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
  { file: "card-activity", type: "alarm-card", theme: "light", width: 460, config: { show_activity: true, show_sensors: false } },
  { file: "card-activity-dark", type: "alarm-card", theme: "dark", width: 460, config: { show_activity: true, show_sensors: false } },
  // The buttons section (#52), with the sensors folded.
  { file: "card-buttons", type: "alarm-card", theme: "light", width: 460, config: { buttons, collapsed: true } },
  { file: "card-buttons-dark", type: "alarm-card", theme: "dark", width: 460, config: { buttons, collapsed: true } },
  // Alarmo refused to arm away over open sensors: the popup at the top of the card, with "Arm anyway".
  { file: "card-failed-arm", type: "alarm-card", theme: "light", width: 460, config: {}, event: failedToArm },
  { file: "card-failed-arm-dark", type: "alarm-card", theme: "dark", width: 460, config: {}, event: failedToArm },
  // The Alarm panel (integration): one shot per tab, a sensor's editor open on the Sensors tab.
  { file: "panel-general", type: "panel", theme: "light", width: 1100, tab: "general" },
  { file: "panel-general-dark", type: "panel", theme: "dark", width: 1100, tab: "general" },
  { file: "panel-sensors", type: "panel", theme: "light", width: 1100, tab: "sensors", open: ["sensor:binary_sensor.kitchen_window"] },
  { file: "panel-sensors-dark", type: "panel", theme: "dark", width: 1100, tab: "sensors", open: ["sensor:binary_sensor.kitchen_window"] },
  { file: "panel-codes", type: "panel", theme: "light", width: 1100, tab: "codes", overrides: armedAway },
  { file: "panel-codes-dark", type: "panel", theme: "dark", width: 1100, tab: "codes", overrides: armedAway },
  { file: "panel-actions", type: "panel", theme: "light", width: 1100, tab: "actions", open: ["auto:a1"] },
  { file: "panel-actions-dark", type: "panel", theme: "dark", width: 1100, tab: "actions", open: ["auto:a1"] },
];

// One looping GIF per distinct animation: triggered, arming and armed (one full radar turn) — each in light and dark.
export const gifs = [
  { file: "triggered", type: "alarm-card", theme: "light", width: 460, config: {}, overrides: triggered },
  { file: "triggered-dark", type: "alarm-card", theme: "dark", width: 460, config: {}, overrides: triggered },
  { file: "arming", type: "alarm-card", theme: "light", width: 460, config: {}, overrides: arming },
  { file: "arming-dark", type: "alarm-card", theme: "dark", width: 460, config: {}, overrides: arming },
  { file: "armed", type: "alarm-card", theme: "light", width: 460, config: {}, overrides: armedAway, seconds: 6 },
  { file: "armed-dark", type: "alarm-card", theme: "dark", width: 460, config: {}, overrides: armedAway, seconds: 6 },
];
