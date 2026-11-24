// Arm modes: [mode, supported feature bit, icon]. Order of the buttons.
export const MODES = [
  ["arm_home", 1, ICONS.home],
  ["arm_away", 2, ICONS.away],
  ["arm_night", 4, ICONS.night],
  ["arm_vacation", 32, ICONS.vacation],
  ["arm_custom_bypass", 16, ICONS.custom],
];
export const MODE_ICON = Object.fromEntries(MODES.map(([m, , i]) => [m, i]));
