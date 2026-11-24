// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { ICONS, VERSION } from "./header.js";
import { MODES } from "./core.js";
import { SCENE_STYLE, STATE_ICON, alarmRadar, esc, isNight, shield, stateClass, svgIcon } from "./helpers.js";
import { BASE_STYLE } from "./styles.js";
import { AlarmCard } from "./full-card.js";
import { AlarmMiniCard } from "./mini-card.js";
import { AlarmCardEditor, AlarmMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("alarm-card", AlarmCard);
define("alarm-mini-card", AlarmMiniCard);
define("alarm-card-editor", AlarmCardEditor);
define("alarm-mini-card-editor", AlarmMiniCardEditor);

// The Alarm panel (alarm-panel.js, served by the integration) imports this file and draws its header with the
// card's own picture, styles and helpers.
window.AlarmCardKit = { VERSION, alarmRadar, shield, isNight, stateClass, esc, svgIcon, ICONS, STATE_ICON, MODES, BASE_STYLE, SCENE_STYLE };

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "alarm-card",
    name: "Alarm Card",
    description: "Arm and disarm an alarm panel (Alarmo or any other): state, exit and entry delays, code pad, open sensors.",
  },
  {
    type: "alarm-mini-card",
    name: "Alarm Mini Card",
    description: "Compact alarm overview: state, countdown and one-tap arm / disarm buttons.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-alarm-card" });
}

console.info(
  `%c ALARM-CARD %c v${VERSION} `,
  "color: white; background: #e5484d; font-weight: 700;",
  "color: #e5484d; background: white; font-weight: 700;"
);
