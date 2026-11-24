export const PANEL_TABS = ["general", "sensors", "codes", "actions", "timeline", "settings"];
// The tabs that can be hidden (Settings always shows).
export const CONTENT_TABS = PANEL_TABS.slice(0, -1);
export const TL_KEY = "alarm-card-panel-timeline";
export const TL_SPANS = { "6h": 6, "24h": 24, "3d": 72 };
export const TL_COLOR = { door: "c-blue", window: "c-cyan", motion: "c-violet", tamper: "c-amber", environmental: "c-red", other: "c-grey" };
export const ALARM_MODES = ["armed_home", "armed_away", "armed_night", "armed_vacation", "armed_custom_bypass"];
// The card's state classes, for each Alarmo arm mode.
export const MODE_CLASS = { armed_home: "home", armed_away: "away", armed_night: "night", armed_vacation: "vacation", armed_custom_bypass: "custom" };
// The service and the supported-feature bit of each mode button.
export const MODE_SERVICE = {
  armed_home: ["alarm_arm_home", 1],
  armed_away: ["alarm_arm_away", 2],
  armed_night: ["alarm_arm_night", 4],
  armed_vacation: ["alarm_arm_vacation", 32],
  armed_custom_bypass: ["alarm_arm_custom_bypass", 16],
};
export const SENSOR_TYPES = ["door", "window", "motion", "tamper", "environmental", "other"];
export const EVENTS = ["armed", "disarmed", "triggered", "untriggered", "arm_failure", "arming", "pending"];
export const ACTION_DOMAINS = ["switch", "light", "siren", "input_boolean", "script", "scene", "fan", "cover", "lock"];
export const SETTINGS_KEY = "alarm-card-panel-settings";

// Material Design Icons used by the panel (the card's own icons come from AlarmCardKit.ICONS).
export const PI = {
  menu: "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z",
  chev: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
  list: "M3,13H5V11H3V13M3,17H5V15H3V17M3,9H5V7H3V9M7,13H21V11H7V13M7,17H21V15H7V17M7,7V9H21V7H7Z",
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  del: "M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z",
  search: "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  info: "M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z",
  home: "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
  group: "M5,3H7V5H5V10A2,2 0 0,1 3,12A2,2 0 0,1 5,14V19H7V21H5C3.93,20.73 3,20.1 3,19V15A2,2 0 0,0 1,13H0V11H1A2,2 0 0,0 3,9V5A2,2 0 0,1 5,3M19,3A2,2 0 0,1 21,5V9A2,2 0 0,0 23,11H24V13H23A2,2 0 0,0 21,15V19A2,2 0 0,1 19,21H17V19H19V14A2,2 0 0,1 21,12A2,2 0 0,1 19,10V5H17V3H19M12,15A1,1 0 0,1 13,16A1,1 0 0,1 12,17A1,1 0 0,1 11,16A1,1 0 0,1 12,15M8,15A1,1 0 0,1 9,16A1,1 0 0,1 8,17A1,1 0 0,1 7,16A1,1 0 0,1 8,15M16,15A1,1 0 0,1 17,16A1,1 0 0,1 16,17A1,1 0 0,1 15,16A1,1 0 0,1 16,15Z",
  account: "M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z",
  key: "M7,14A2,2 0 0,1 5,12A2,2 0 0,1 7,10A2,2 0 0,1 9,12A2,2 0 0,1 7,14M12.65,10C11.83,7.67 9.61,6 7,6A6,6 0 0,0 1,12A6,6 0 0,0 7,18C9.61,18 11.83,16.33 12.65,14H17V18H21V14H23V10H12.65Z",
  bell: "M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21",
  flash: "M7,2V13H10V22L17,10H13L17,2H7Z",
  door: "M8,3C6.89,3 6,3.89 6,5V21H18V5C18,3.89 17.11,3 16,3H8M8,5H16V19H8V5M13,11V13H15V11H13Z",
  window: "M4 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V4C2 2.9 2.9 2 4 2M4 4V11H11V4H4M4 20H11V13H4V20M20 20V13H13V20H20M20 4H13V11H20V4Z",
  motion:
    "M10,0.2C9,0.2 8.2,1 8.2,2C8.2,3 9,3.8 10,3.8C11,3.8 11.8,3 11.8,2C11.8,1 11,0.2 10,0.2M15.67,1A7.33,7.33 0 0,0 23,8.33V7A6,6 0 0,1 17,1H15.67M18.33,1C18.33,3.58 20.42,5.67 23,5.67V4.33C21.16,4.33 19.67,2.84 19.67,1H18.33M21,1A2,2 0 0,0 23,3V1H21M7.92,4.03C7.75,4.03 7.58,4.06 7.42,4.11L2,5.8V11H3.8V7.33L5.91,6.67L2,22H3.8L6.67,13.89L9,17V22H10.8V15.59L8.31,11.05L9.04,8.18L10.12,10H15V8.2H11.38L9.38,4.87C9.08,4.37 8.54,4.03 7.92,4.03Z",
  tamper: "M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M11,7H13V13H11V7M11,15H13V17H11V15Z",
  environmental: "M12,3.25C12,3.25 6,10 6,14C6,17.32 8.69,20 12,20A6,6 0 0,0 18,14C18,10 12,3.25 12,3.25M14.47,9.97L15.53,11.03L9.53,17.03L8.47,15.97M9.75,10A1.25,1.25 0 0,1 11,11.25A1.25,1.25 0 0,1 9.75,12.5A1.25,1.25 0 0,1 8.5,11.25A1.25,1.25 0 0,1 9.75,10M14.25,14.5A1.25,1.25 0 0,1 15.5,15.75A1.25,1.25 0 0,1 14.25,17A1.25,1.25 0 0,1 13,15.75A1.25,1.25 0 0,1 14.25,14.5Z",
  other: "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z",
};
export const TYPE_COLOR = { door: "c-blue", window: "c-blue", motion: "c-violet", tamper: "c-amber", environmental: "c-red", other: "c-grey" };

export const pesc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const picon = (p) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg>`;
export const isOpenState = (s) => ["on", "open", "unlocked", "opening", "detected"].includes(s);
// A sensor type guessed from the device class, and its default settings in Alarmo's spirit.
export const guessType = (dc) => {
  if (["door", "garage_door", "opening"].includes(dc)) return "door";
  if (dc === "window") return "window";
  if (["motion", "occupancy", "presence", "moving"].includes(dc)) return "motion";
  if (["tamper", "vibration"].includes(dc)) return "tamper";
  if (["smoke", "gas", "moisture", "carbon_monoxide", "heat", "safety", "problem", "cold"].includes(dc)) return "environmental";
  return "other";
};
