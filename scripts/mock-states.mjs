// Mock Home Assistant states shaped like an Alarmo panel and its sensors, used for the tests and the
// screenshots. Neutral names only.
export const states = {};
export const entities = {};

const ago = (s) => new Date(Date.now() - s * 1000).toISOString();
const entity = (entity_id, state, attributes = {}, platform = null, changedAgo = 7500) => {
  states[entity_id] = { entity_id, state: String(state), attributes, last_changed: ago(changedAgo), last_updated: ago(changedAgo) };
  if (platform) entities[entity_id] = { entity_id, platform };
};

entity(
  "alarm_control_panel.alarmo",
  "disarmed",
  {
    friendly_name: "Home alarm",
    code_format: null,
    code_arm_required: false,
    changed_by: "Alex",
    arm_mode: null,
    next_state: "disarmed",
    open_sensors: null,
    bypassed_sensors: null,
    delay: null,
    last_triggered: "2026-08-09 19:28:27",
    supported_features: 11,
  },
  "alarmo",
);
const sensor = (id, name, device_class, state) => entity(`binary_sensor.${id}`, state, { friendly_name: name, device_class }, "zha", 3600);
sensor("front_door", "Front door", "door", "off");
sensor("patio_door", "Patio door", "door", "off");
sensor("kitchen_window", "Kitchen window", "window", "on");
sensor("bedroom_window", "Bedroom window", "window", "off");
sensor("hallway_motion", "Hallway motion", "motion", "off");
sensor("kitchen_smoke", "Smoke detector", "smoke", "off");

export const sensors = [
  "binary_sensor.front_door",
  "binary_sensor.patio_door",
  "binary_sensor.kitchen_window",
  "binary_sensor.bedroom_window",
  "binary_sensor.hallway_motion",
  "binary_sensor.kitchen_smoke",
];

// Overrides: the panel armed away; arming with a 60 s exit delay (20 s gone); triggered by the kitchen
// window; and a panel with a number code.
const panel = (state, attributes = {}, changedAgo = 7500) => ({
  "alarm_control_panel.alarmo": {
    ...states["alarm_control_panel.alarmo"],
    state,
    attributes: { ...states["alarm_control_panel.alarmo"].attributes, ...attributes },
    last_changed: ago(changedAgo),
  },
});
export const armedAway = { ...panel("armed_away", { arm_mode: "armed_away", next_state: "armed_away" }, 5400), "binary_sensor.kitchen_window": { ...states["binary_sensor.kitchen_window"], state: "off" } };
export const arming = { ...panel("arming", { arm_mode: "armed_away", next_state: "armed_away", delay: 60 }, 20), "binary_sensor.kitchen_window": { ...states["binary_sensor.kitchen_window"], state: "off" } };
export const triggered = panel("triggered", { arm_mode: "armed_away", open_sensors: { "binary_sensor.kitchen_window": "on" } }, 40);
export const withCode = panel("armed_home", { code_format: "number", code_arm_required: true, arm_mode: "armed_home" }, 900);
