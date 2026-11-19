// Mock Home Assistant states shaped like an Alarmo panel and its sensors, used for the tests and the
// screenshots. Neutral names only.
export const states = {};
export const entities = {};

// Every timestamp is relative to one instant, NOW, which scripts/screenshots.mjs also gives the page as its
// fixed clock: durations and countdowns render the same on every run.
export const NOW = Date.now();
const ago = (s) => new Date(NOW - s * 1000).toISOString();
// Alarmo's last_triggered: local time as "YYYY-MM-DD HH:MM:SS". Relative to now like the other timestamps, so
// the card always says "83 days ago" and the screenshots do not change from one day to the next.
const localAgo = (s) => {
  const d = new Date(NOW - s * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
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
    last_triggered: localAgo(83 * 86400),
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

// The buttons section: the cameras' smart plugs (off), the porch light (on), a script.
entity("switch.camera_plugs", "off", { friendly_name: "Camera plugs" }, "zha", 3600);
entity("light.porch", "on", { friendly_name: "Porch light" }, "hue", 3600);
entity("script.lights_off", "off", { friendly_name: "All lights off" }, "script", 3600);
export const buttons = ["switch.camera_plugs", "light.porch", { entity: "script.lights_off", name: "Lights off" }];

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

// People (their user_id names who armed or disarmed in the activity) and the panel's logbook for the activity
// section: Home Assistant's logbook/get_events entries, newest last. The newest one is the panel's current state.
entity("person.alex", "home", { friendly_name: "Alex", user_id: "u-alex" });
entity("person.sam", "not_home", { friendly_name: "Sam", user_id: "u-sam" });
const at = (s) => (NOW - s * 1000) / 1000;
export const logbook = [
  { when: at(30 * 3600), state: "armed_night", context_name: "Night arming" },
  { when: at(22 * 3600), state: "disarmed", context_user_id: "u-alex" },
  { when: at(14 * 3600), state: "arming", context_user_id: "u-sam" },
  { when: at(14 * 3600 - 60), state: "armed_away", context_user_id: "u-sam" },
  { when: at(7500), state: "disarmed", context_user_id: "u-alex" },
].map((e) => ({ entity_id: "alarm_control_panel.alarmo", ...e }));

// Alarmo's event when it refuses to arm over open sensors.
export const failedToArm = {
  entity_id: "alarm_control_panel.alarmo",
  command: "arm_away",
  reason: "open_sensors",
  sensors: ["binary_sensor.kitchen_window", "binary_sensor.patio_door"],
};

// Alarmo's own data (its websocket commands), for the Alarm panel's screenshots: one area, the sensors above, two
// users, two notifications and an action. Neutral names only.
entity("binary_sensor.garage_door", "off", { friendly_name: "Garage door", device_class: "garage_door" }, "zha", 3600);
entity("binary_sensor.back_door", "off", { friendly_name: "Back door", device_class: "door" }, "zha", 3600);
entity("binary_sensor.living_room_motion", "off", { friendly_name: "Living room motion", device_class: "motion" }, "zha", 3600);
entity("siren.outdoor", "off", { friendly_name: "Outdoor siren" }, "zha", 3600);
const mode = (enabled, exit_time, entry_time, trigger_time = 180) => ({ enabled, exit_time, entry_time, trigger_time });
const alarmoSensor = (entity_id, type, modes, extra = {}) => ({
  entity_id, type, modes, use_exit_delay: true, use_entry_delay: type === "door" || type === "motion", arm_on_close: false, allow_open: false,
  always_on: false, trigger_unavailable: false, auto_bypass: false, auto_bypass_modes: [], area: "home", enabled: true, group: null, ...extra,
});
export const alarmo = {
  config: {
    code_arm_required: false, code_disarm_required: true, code_mode_change_required: true, code_format: "number",
    disarm_after_trigger: false, ignore_blocking_sensors_after_trigger: false, master: { enabled: false, name: "master" },
    mqtt: { enabled: false, state_topic: "alarmo/state", command_topic: "alarmo/command", event_topic: "alarmo/event", require_code: true },
  },
  areas: {
    home: {
      area_id: "home", name: "Home",
      modes: { armed_home: mode(true, 0, 30), armed_away: mode(true, 60, 30), armed_night: mode(true, 0, 15), armed_vacation: mode(false, 60, 30), armed_custom_bypass: mode(false, 0, 30) },
    },
  },
  sensors: Object.fromEntries(
    [
      alarmoSensor("binary_sensor.front_door", "door", ["armed_away", "armed_night"]),
      alarmoSensor("binary_sensor.patio_door", "door", ["armed_away", "armed_night", "armed_home"]),
      alarmoSensor("binary_sensor.kitchen_window", "window", ["armed_away", "armed_night"], { use_exit_delay: false }),
      alarmoSensor("binary_sensor.bedroom_window", "window", ["armed_away"], { auto_bypass: true, auto_bypass_modes: ["armed_away"] }),
      alarmoSensor("binary_sensor.hallway_motion", "motion", ["armed_away"]),
      alarmoSensor("binary_sensor.kitchen_smoke", "environmental", [], { always_on: true, use_exit_delay: false }),
    ].map((s) => [s.entity_id, s]),
  ),
  users: {
    u1: { user_id: "u1", name: "Alex", enabled: true, can_arm: true, can_disarm: true, is_override_code: false, area_limit: [], code_format: "number", code_length: 4 },
    u2: { user_id: "u2", name: "Sam", enabled: true, can_arm: true, can_disarm: true, is_override_code: true, area_limit: [], code_format: "number", code_length: 4 },
    u3: { user_id: "u3", name: "Guest", enabled: false, can_arm: false, can_disarm: true, is_override_code: false, area_limit: [], code_format: "number", code_length: 4 },
  },
  automations: {
    a1: {
      automation_id: "a1", type: "notification", name: "Alarm triggered", enabled: true,
      triggers: [{ event: "triggered", area: 0, modes: [] }], actions: [{ service: "notify.mobile_app_phone", data: { title: "Alarm!", message: "Triggered by {{open_sensors}}" } }],
    },
    a2: {
      automation_id: "a2", type: "notification", name: "Failed to arm", enabled: true,
      triggers: [{ event: "arm_failure", area: 0, modes: [] }], actions: [{ service: "notify.mobile_app_phone", data: { title: "", message: "Open: {{open_sensors}}" } }],
    },
    a3: {
      automation_id: "a3", type: "action", name: "Siren when triggered", enabled: true,
      triggers: [{ event: "triggered", area: 0, modes: [] }], actions: [{ service: "siren.turn_on", entity_id: "siren.outdoor" }],
    },
  },
  sensor_groups: {},
  entities: [{ entity_id: "alarm_control_panel.alarmo", area_id: "home" }],
};

// The rooms of the sensors (Home Assistant's areas) and their last 24 hours in the history, for the panel's
// Timeline tab: armed away during the day, an evening at home, armed night with a short trigger by the kitchen
// window, then armed away again. Times are hours before NOW.
export const areas = { hall: { area_id: "hall", name: "Hall" }, living: { area_id: "living", name: "Living room" }, kitchen: { area_id: "kitchen", name: "Kitchen" }, bedroom: { area_id: "bedroom", name: "Bedroom" } };
const ROOM_OF = {
  "binary_sensor.front_door": "hall", "binary_sensor.hallway_motion": "hall", "binary_sensor.patio_door": "living",
  "binary_sensor.kitchen_window": "kitchen", "binary_sensor.kitchen_smoke": "kitchen", "binary_sensor.bedroom_window": "bedroom",
};
for (const [id, area_id] of Object.entries(ROOM_OF)) entities[id] = { ...(entities[id] || { entity_id: id }), area_id };
const OPENINGS = {
  "binary_sensor.front_door": [[17.62, 17.6], [5.05, 5.04], [1.36, 1.35]],
  "binary_sensor.hallway_motion": [[17.6, 17.55], [17.3, 17.25], [16.4, 16.3], [15.1, 15.0], [13.4, 13.3], [5.0, 4.9], [4.4, 4.3], [1.4, 1.36]],
  "binary_sensor.patio_door": [[16.8, 15.2]],
  "binary_sensor.kitchen_window": [[16.5, 14.6], [9.51, 9.4], [4.6, 4.4], [0.2, 0]],
  "binary_sensor.bedroom_window": [[14.2, 13.5], [6.0, 5.2]],
  "binary_sensor.kitchen_smoke": [],
};
const ALARM_DAY = [["armed_away", 24], ["pending", 17.6], ["disarmed", 17.58], ["armed_night", 13.2], ["triggered", 9.5], ["armed_night", 9.45], ["disarmed", 5.1], ["arming", 1.4], ["armed_away", 1.38]];
const sec = (hAgo) => (NOW - hAgo * 3600e3) / 1000;
export const history = {
  "alarm_control_panel.alarmo": ALARM_DAY.map(([s, h]) => ({ s, lu: sec(h) })),
  ...Object.fromEntries(
    Object.entries(OPENINGS).map(([id, list]) => [id, [{ s: "off", lu: sec(24) }, ...list.flatMap(([a, b]) => [{ s: "on", lu: sec(a) }, ...(b > 0 ? [{ s: "off", lu: sec(b) }] : [])])]]),
  ),
};
// The Timeline shots show the panel armed away since the history's last change, the kitchen window open.
export const armedAwayNow = {
  "alarm_control_panel.alarmo": { ...states["alarm_control_panel.alarmo"], state: "armed_away", last_changed: new Date(NOW - 1.38 * 3600e3).toISOString() },
  "binary_sensor.kitchen_window": { ...states["binary_sensor.kitchen_window"], state: "on", last_changed: new Date(NOW - 0.2 * 3600e3).toISOString() },
};
