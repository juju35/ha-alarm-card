// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { MODES } from "./core.js";
import { BUTTON_ACTIONS, armModes, lang, normalize, supportedModes, t } from "./helpers.js";
import { AlarmCard } from "./full-card.js";

// The editor's name fields: name__<entity id>, folded back into { entity, name } items.
export const NAME_PREFIX = "name__";
export const NAMED_LISTS = ["sensors", "cameras", "buttons"];

export class AlarmEditorBase extends HTMLElement {
  static get toggles() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  // The toggles and their defaults for this config: confirm_disarm is on by default for a panel without a code.
  _toggles(config) {
    const entity = config.entity || AlarmCard.getStubConfig(this._hass).entity;
    const code = this._hass.states[entity]?.attributes?.code_format;
    // The mini card's badge: shown by default on the illustrated header, off on the classic one (the shield).
    const mini = this instanceof AlarmMiniCardEditor;
    return this.constructor.toggles.map(([name, def]) => [
      name,
      name === "confirm_disarm" ? !code : mini && name === "show_logo" ? config.illustration !== false : def,
    ]);
  }

  // The entities of the sensors, cameras and buttons, in that order, once each.
  _named() {
    return [...new Set(NAMED_LISTS.flatMap((k) => normalize(this._config[k]).map((i) => i.entity)))];
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const entity = this._config.entity || AlarmCard.getStubConfig(this._hass).entity;
    const st = entity && this._hass.states[entity];
    const all = st ? supportedModes(st) : MODES.map(([m]) => m);
    return [
      { name: "entity", selector: { entity: { domain: "alarm_control_panel" } } },
      { name: "title", selector: { text: {} } },
      { name: "modes", selector: { select: { multiple: true, mode: "list", options: all.map((m) => ({ value: m, label: tr(m) })) } } },
      { name: "sensors", selector: { entity: { domain: "binary_sensor", multiple: true } } },
      { name: "cameras", selector: { entity: { domain: "camera", multiple: true } } },
      { name: "buttons", selector: { entity: { domain: Object.keys(BUTTON_ACTIONS), multiple: true } } },
      // The name shown for each sensor, camera and button, the entity's own when left empty.
      ...(this._named().length
        ? [{ type: "expandable", name: "names", flatten: true, title: tr("names"), schema: this._named().map((id) => ({ name: `${NAME_PREFIX}${id}`, selector: { text: {} } })) }]
        : []),
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      // The illustration's day / night picture, offered while it is shown.
      ...(this._config.illustration !== false
        ? [
            {
              name: "illustration_theme",
              selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })) } },
            },
          ]
        : []),
      // The activity's size and period, offered once the activity is on.
      ...(this._config.show_activity === true
        ? [
            {
              type: "grid",
              name: "",
              schema: [
                { name: "activity_count", selector: { number: { min: 1, max: 50, mode: "box" } } },
                { name: "activity_hours", selector: { number: { min: 1, max: 168, mode: "box", unit_of_measurement: "h" } } },
              ],
            },
          ]
        : []),
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: tr("lang_auto") },
              { value: "en", label: "English" },
              { value: "fr", label: "Français" },
              { value: "de", label: "Deutsch" },
              { value: "es", label: "Español" },
              { value: "sr", label: "Српски" },
              { value: "sr-Latn", label: "Srpski (latinica)" },
              { value: "it", label: "Italiano" },
              { value: "nl", label: "Nederlands" },
              { value: "pt", label: "Português (Portugal)" },
              { value: "pl", label: "Polski" },
              { value: "ro", label: "Română" },
              { value: "da", label: "Dansk" },
              { value: "sv", label: "Svenska" },
              { value: "bg", label: "Български" },
              { value: "ru", label: "Русский" },
              { value: "uk", label: "Українська" },
              { value: "hu", label: "Magyar" },
              { value: "sk", label: "Slovenčina" },
              { value: "cs", label: "Čeština" },
              { value: "sl", label: "Slovenščina" },
              { value: "lv", label: "Latviešu" },
              { value: "el", label: "Ελληνικά" },
            ],
          },
        },
      },
    ];
  }

  // A change in the form: the config to save, as small as it can be.
  _changed(value) {
      const config = { ...value };
      // The name fields, read before the empty values go: an emptied name goes back to the entity's own.
      const names = {};
      for (const k of Object.keys(config)) {
        if (!k.startsWith(NAME_PREFIX)) continue;
        names[k.slice(NAME_PREFIX.length)] = String(config[k] ?? "").trim();
        delete config[k];
      }
      const defaults = Object.fromEntries(this._toggles(config));
      for (const [k, v] of Object.entries(config)) {
        // Keep the YAML minimal: drop empty values and options left at their default.
        const empty = v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length);
        if (empty || (k in defaults && v === defaults[k]) || (k === "illustration_theme" && v === "auto")) delete config[k];
      }
      // Each item keeps its name (the field's, else the one set before), as { entity, name }; a plain id without.
      for (const list of NAMED_LISTS) {
        if (!Array.isArray(config[list])) continue;
        const old = new Map(normalize(this._config[list]).map((i) => [i.entity, i.name]));
        config[list] = config[list].map((item) => {
          const id = typeof item === "string" ? item : item?.entity;
          const name = id in names ? names[id] : old.get(id);
          return name ? { entity: id, name } : id;
        });
      }
      this._config = config;
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      const named = (s) => s.name?.startsWith(NAME_PREFIX) && s.name.slice(NAME_PREFIX.length);
      this._form.computeLabel = (s) =>
        named(s)
          ? this._hass.states[named(s)]?.attributes?.friendly_name || named(s)
          : t(
              this._hass,
              this._config,
              { title: "title_option", sensors: "sensors_option", cameras: "ed_cameras", buttons: "ed_buttons" }[s.name] || s.name,
            );
      this._form.computeHelper = (s) =>
        named(s)
          ? `${named(s)} · ${t(this._hass, this._config, "names_helper")}`
          : s.name === "zoom" || s.name === "confirm_disarm" || s.name === "cameras_on_alarm" || s.name === "illustration"
            ? t(this._hass, this._config, `${s.name}_helper`)
            : undefined;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._changed(ev.detail.value);
      });
      this.appendChild(this._form);
    }
    const data = { ...this._config };
    for (const list of NAMED_LISTS) {
      const items = normalize(this._config[list]);
      if (this._config[list] !== undefined) data[list] = items.map((i) => i.entity);
      for (const i of items) data[`${NAME_PREFIX}${i.entity}`] = i.name || "";
    }
    // The selector's values carry the arm_ prefix, optional in YAML: without it nothing would be checked.
    if (data.modes !== undefined) data.modes = armModes(data.modes);
    if (!data.entity) data.entity = AlarmCard.getStubConfig(this._hass).entity;
    for (const [name, def] of this._toggles(data)) if (data[name] === undefined) data[name] = def;
    if (data.illustration_theme === undefined) data.illustration_theme = "auto";
    this._form.hass = this._hass;
    // A new data or schema object re-renders the whole form: only on a config or language change.
    if (this._dataFor !== this._config) {
      this._dataFor = this._config;
      this._form.data = data;
    }
    const key = `${lang(this._hass, this._config)}|${data.entity}|${this._hass.states[data.entity]?.attributes?.supported_features}|${this._config.show_activity === true}|${this._config.illustration !== false}|${this._named().join(",")}`;
    if (this._schemaFor !== key) {
      this._schemaFor = key;
      this._form.schema = this._schema();
    }
  }
}

export class AlarmCardEditor extends AlarmEditorBase {
  static get toggles() {
    return [
      ["illustration", true],
      ["show_title", true],
      ["show_subtitle", true],
      ["show_logo", true],
      ["show_controls", true],
      ["show_sensors", true],
      ["show_info", true],
      ["confirm_disarm", true],
      ["collapsed", false],
      ["show_activity", false],
      ["cameras_on_alarm", true],
    ];
  }
}

export class AlarmMiniCardEditor extends AlarmEditorBase {
  // The full card's options (the sensors and the activity apply to the zoomed view, which renders the full
  // card with the same options), and the detail button. The logo is off by default here: the compact mini
  // shows the state shield as its icon unless show_logo is turned on.
  static get toggles() {
    return [...AlarmCardEditor.toggles.map((t) => (t[0] === "show_logo" ? ["show_logo", false] : t)), ["zoom", true]];
  }
}
