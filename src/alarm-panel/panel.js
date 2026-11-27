// ── End of the folded top bar ──
import { PANEL_VERSION } from "./header.js";
import { ACTION_DOMAINS, ALARM_MODES, CONTENT_TABS, EVENTS, MODE_CLASS, MODE_SERVICE, PANEL_TABS, PI, SENSOR_TYPES, SETTINGS_KEY, TL_COLOR, TL_KEY, TL_SPANS, TYPE_COLOR, guessType, isOpenState, pesc, picon } from "./core.js";
import { alarmPanelFold } from "./fold.js";
import { PANEL_STRINGS } from "./i18n/panel-strings.js";

export class AlarmCardPanel extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._d = null; // Alarmo's data
    this._set = null; // the panel's settings (integration options)
    this._open = new Set();
    this._draft = {};
    this._filter = "all";
    this._areaSel = null;
    this._query = "";
    this._picked = new Set();
    this._toast = "";
    this._popup = null;
    this._tab = this._tabFromUrl();
    try {
      this._set = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    } catch (_err) {
      this._set = null;
    }
    // Home Assistant may create the element and set its properties before it is defined (the definition waits
    // for the language file, scripts/i18n-split.mjs): they are then plain fields hiding the setters. Replay them.
    for (const key of ["panel", "narrow", "hass"]) {
      if (Object.hasOwn(this, key)) {
        const value = this[key];
        delete this[key];
        this[key] = value;
      }
    }
  }

  // Redrawn when a language file has loaded (scripts/i18n-split.mjs calls setConfig on the bundle's elements).
  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set panel(p) {
    this._panel = p;
  }

  set narrow(n) {
    this._narrow = n;
    this._syncMenu();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._start();
    this._syncMenu();
    const sig = this._signature();
    if (sig !== this._sig) {
      this._sig = sig;
      this._renderBanner();
      if (!this._busyEditing()) this._renderPage();
    }
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.addEventListener("click", (e) => this._onClick(e));
      this.shadowRoot.addEventListener("input", (e) => this._onInput(e));
      this.shadowRoot.addEventListener("change", (e) => this._onInput(e));
      this.shadowRoot.addEventListener("keydown", (e) => this._onKey(e));
      this.shadowRoot.addEventListener("mouseover", (e) => this._tlTip(e));
      this.shadowRoot.addEventListener("mouseout", (e) => {
        if (e.target.closest?.("[data-tip]")) this.shadowRoot.querySelector(".tip")?.remove();
      });
    }
    // Back on the panel after leaving it: Alarmo's changes made meanwhile were not followed, so its data is read
    // again before following them anew.
    if (this._hass && this._unsub === undefined && this._d) {
      this._subscribe();
      if (this._left) this._load().then(() => this._render());
    }
    this._left = false;
    this._render();
  }

  disconnectedCallback() {
    this._fold?.detach();
    this._fold = null;
    this._unsubscribe();
    this._left = true;
    // A popup left open (the arming code, a delete to confirm) closes without acting.
    this._popup = null;
  }

  // ── Data ──
  _t(key, vars = {}) {
    const l = this._hass?.locale?.language || this._hass?.language || "en";
    const table = PANEL_STRINGS[l] ? PANEL_STRINGS[l] : PANEL_STRINGS[l.split("-")[0]] || PANEL_STRINGS.en;
    return String(table[key] ?? PANEL_STRINGS.en[key] ?? key).replace(/(?<!\{)\{(\w+)\}(?!\})/g, (_, k) => vars[k] ?? "");
  }

  async _start() {
    await Promise.resolve(); // Home Assistant sets hass, panel and narrow together: panel (card_url) may come after hass
    // The card (header picture), the panel's settings and Alarmo's data load together; each redraws when it is in.
    const kitUrl = this._panel?.config?.card_url;
    if (kitUrl && !window.AlarmCardKit) {
      import(kitUrl).then(
        () => this._render(),
        (err) => console.warn("alarm-panel: card not loaded", err),
      );
    }
    const data = this._load();
    try {
      const set = await this._hass.callWS({ type: "alarm_card/settings" });
      this._set = set;
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(set));
      } catch (_err) {
        /* kept for this page only */
      }
    } catch (err) {
      console.warn("alarm-panel: settings not loaded", err);
      this._set ??= { options: {}, admin: true, alarmo: true };
    }
    if (!this._shownTabs().includes(this._tab)) this._tab = this._shownTabs()[0];
    this._render();
    await data;
    if (!this._d) this._set.alarmo = false;
    else this._subscribe();
    this._render();
  }

  async _load() {
    const ws = (type) => this._hass.callWS({ type });
    try {
      const [config, areas, sensors, users, automations, groups, entities] = await Promise.all([
        ws("alarmo/config"),
        ws("alarmo/areas"),
        ws("alarmo/sensors"),
        ws("alarmo/users"),
        ws("alarmo/automations"),
        ws("alarmo/sensor_groups"),
        ws("alarmo/entities"),
      ]);
      this._d = { config, areas, sensors, users, automations, groups, entities };
    } catch (err) {
      console.warn("alarm-panel: Alarmo data not loaded", err);
      this._d = null;
      if (this._set) this._set.alarmo = false;
    }
  }

  _subscribe() {
    if (this._unsub !== undefined || !this._hass?.connection) return;
    this._unsub = null;
    this._hass.connection
      .subscribeMessage(
        async () => {
          await this._load();
          this._render();
        },
        { type: "alarmo_config_updated" },
      )
      .then((u) => {
        if (this.isConnected) this._unsub = u;
        else u();
      })
      .catch(() => {
        this._unsub = undefined;
      });
  }

  _unsubscribe() {
    if (typeof this._unsub === "function") this._unsub();
    this._unsub = undefined;
  }

  _opts() {
    return this._set?.options || {};
  }

  _shownTabs() {
    const tabs = this._opts().panel_tabs;
    const shown = Array.isArray(tabs) && tabs.length ? PANEL_TABS.filter((t) => tabs.includes(t)) : CONTENT_TABS;
    return [...shown, "settings"];
  }

  _tabFromUrl() {
    const seg = (location.pathname.split("/")[2] || "").toLowerCase();
    return PANEL_TABS.includes(seg) ? seg : "general";
  }

  _setTab(tab) {
    this._tab = tab;
    this._open.clear();
    this._draft = {};
    this._query = "";
    this._picked.clear();
    const base = location.pathname.split("/")[1] || "alarm-panel";
    try {
      history.replaceState(history.state, "", `/${base}/${tab}`);
    } catch (_err) {
      /* the tab stays without the address */
    }
    this._renderPage();
    this._renderTabs();
  }

  // The alarm entity of the header: the chosen one, else Alarmo's master, else its first area, else any alarm.
  _entityId() {
    const chosen = this._opts().entity;
    if (chosen && this._hass?.states[chosen]) return chosen;
    const ents = this._d?.entities || [];
    const master = ents.find((e) => !e.area_id);
    const pick = master || ents[0];
    if (pick && this._hass?.states[pick.entity_id]) return pick.entity_id;
    return Object.keys(this._hass?.states || {}).find((id) => id.startsWith("alarm_control_panel.")) || null;
  }

  _areaEntity(areaId) {
    return (this._d?.entities || []).find((e) => e.area_id === areaId)?.entity_id;
  }

  _name(id) {
    return this._hass?.states[id]?.attributes?.friendly_name || id;
  }

  _areaName(id) {
    return this._d?.areas?.[id]?.name || (id ? id : this._t("all_areas"));
  }

  // What the page shows of the states: redrawn only when it changes.
  _signature() {
    const st = this._hass?.states || {};
    const ids = [this._entityId(), ...Object.keys(this._d?.sensors || {}), ...(this._d?.entities || []).map((e) => e.entity_id)];
    return ids.map((id) => `${id}=${st[id]?.state}`).join("|") + (this._hass?.themes?.darkMode ? "D" : "L");
  }

  // A field being typed in: the page is not redrawn under it (drafts keep what was typed anyway).
  _busyEditing() {
    const a = this.shadowRoot?.activeElement;
    return !!a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName);
  }

  _blocking() {
    const st = this._hass?.states || {};
    return Object.values(this._d?.sensors || {}).filter(
      (s) => s.enabled !== false && isOpenState(st[s.entity_id]?.state) && !s.allow_open && !s.auto_bypass && (s.modes || []).length,
    );
  }

  // ── API ──
  async _post(path, data, okText = this._t("saved")) {
    try {
      const res = await this._hass.callApi("POST", `alarmo/${path}`, data);
      if (res && res.success === false) throw new Error(res.error || "error");
      this._flash(okText);
      await this._load();
      return true;
    } catch (err) {
      this._flash(this._t("error", { error: err?.body?.message || err?.message || err }), true);
      return false;
    } finally {
      this._render();
    }
  }

  async _saveSettings(options) {
    try {
      const res = await this._hass.callWS({ type: "alarm_card/update_settings", options });
      this._set = { ...this._set, options: res.options };
      window.dispatchEvent(new Event("alarm-card-settings"));
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this._set));
      } catch (_err) {
        /* kept for this page only */
      }
      this._flash(this._t("saved"));
    } catch (err) {
      this._flash(this._t("error", { error: err?.message || err }), true);
    }
    if (!this._shownTabs().includes(this._tab)) this._tab = "settings";
    this._render();
  }

  _flash(text, bad = false) {
    this._toast = text;
    this._toastBad = bad;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toast = "";
      this.shadowRoot?.querySelector(".toast")?.remove();
    }, 3000);
  }

  // ── Events ──
  _onInput(e) {
    const el = e.target;
    if (el.matches("select[data-tl-sort]")) {
      if (e.type === "change") {
        this._tlState().sort = el.value;
        this._tlSave();
        this._renderPage();
      }
      return;
    }
    // The select of the Settings tab saves on change (a click on a <select> only opens it).
    if (el.matches("select[data-a='set']")) {
      if (e.type === "change") this._act_set(null, el.dataset.v, el);
      return;
    }
    if (el.dataset.q !== undefined) {
      this._query = el.value;
      if (e.type === "input") {
        clearTimeout(this._qTimer);
        this._qTimer = setTimeout(() => this._renderPage(true), 150);
      }
      return;
    }
    const f = el.dataset.f;
    const tile = el.closest("[data-id]")?.dataset.id;
    if (!f || !tile) return;
    (this._draft[tile] ||= {})[f] = el.type === "number" ? (el.value === "" ? "" : Number(el.value)) : el.value;
    if (el.tagName === "SELECT" && el.dataset.live !== undefined) this._renderPage(true);
  }

  _onKey(e) {
    if (e.key === "Enter" && e.target.closest(".popup") && e.target.tagName === "INPUT") this._popupOk();
    if (e.key === "Escape" && this._popup) {
      this._popup = null;
      this._render();
    }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".trow,[role='switch'],[role='button']") && e.target === e.composedPath()[0]) {
      e.preventDefault();
      e.target.click();
    }
  }

  _onClick(e) {
    // On a touch screen a tap on a bar of the timeline shows its tooltip.
    if (e.target.closest("[data-tip]") && matchMedia("(hover: none)").matches) return this._tlTip(e);
    const el = e.target.closest("[data-a]");
    if (!el || el.tagName === "SELECT") return;
    const a = el.dataset.a;
    const id = el.closest("[data-id]")?.dataset.id;
    const v = el.dataset.v;
    if (a === "tab") return this._setTab(v);
    if (a === "toggle-tile") {
      if (e.target.closest(".tg,input,select,button:not(.trow)")) return;
      this._open.has(id) ? this._open.delete(id) : this._open.add(id);
      return this._renderPage();
    }
    if (a === "mode") return this._arm(v);
    if (a === "popup-ok") return this._popupOk();
    if (a === "popup-cancel") {
      this._popup = null;
      return this._render();
    }
    if (a === "filter") {
      this._filter = v;
      return this._renderPage();
    }
    if (a === "area-sel") {
      this._areaSel = v;
      this._open.clear();
      return this._renderPage();
    }
    if (a === "chip") {
      const d = (this._draft[id] ||= {});
      const f = el.dataset.f;
      const cur = new Set(d[f] ?? this._current(id, f) ?? []);
      cur.has(v) ? cur.delete(v) : cur.add(v);
      d[f] = [...cur];
      return this._renderPage(true);
    }
    if (a === "dtg") {
      const d = (this._draft[id] ||= {});
      const f = el.dataset.f;
      d[f] = !(d[f] ?? this._current(id, f));
      return this._renderPage(true);
    }
    if (a === "pick") {
      this._picked.has(v) ? this._picked.delete(v) : this._picked.add(v);
      return this._renderPage(true);
    }
    const handler = this[`_act_${a.replace(/-/g, "_")}`];
    if (handler) handler.call(this, id, v, el);
  }

  // The value a field had before editing, for drafts started from chips and toggles.
  _current(id, f) {
    // Alarmo returns the users' hashed codes: never shown, never sent back.
    if (f === "code" || f === "old_code") return undefined;
    const [kind, key] = id.split(":");
    const d = this._d || {};
    const src =
      kind === "sensor"
        ? d.sensors?.[key]
        : kind === "user"
          ? d.users?.[key]
          : kind === "group"
            ? d.groups?.[key]
            : kind === "auto"
              ? this._autoFlat(d.automations?.[key])
              : kind === "mode"
                ? d.areas?.[this._curArea()]?.modes?.[key]
                : kind === "area"
                  ? d.areas?.[key]
                  : kind === "master"
                    ? d.config?.master
                : kind === "new-user"
                  ? { can_arm: true, can_disarm: true, is_override_code: false, area_limit: [] }
                  : kind === "new-auto"
                    ? { modes: [], event: "triggered", area: "0", service_action: "turn_on" }
                    : kind === "new-group"
                      ? { name: "", entities: [], timeout: 10, event_count: 2 }
                      : kind === "mqtt"
                        ? d.config?.mqtt
                        : null;
    return src?.[f];
  }

  _val(id, f, fallback) {
    const v = this._draft[id]?.[f];
    if (v !== undefined) return v;
    const c = this._current(id, f);
    return c === undefined || c === null ? fallback : c;
  }

  // An automation flattened for the editor: its first trigger and first action.
  _autoFlat(a) {
    if (!a) return null;
    const tr = a.triggers?.[0] || {};
    const ac = a.actions?.[0] || {};
    return {
      name: a.name,
      event: tr.event,
      area: tr.area === undefined || tr.area === null ? "0" : String(tr.area),
      modes: tr.modes || [],
      service: ac.service,
      entity_id: ac.entity_id || "",
      title: ac.data?.title || "",
      message: ac.data?.message || "",
      service_action: ac.service?.split(".")[1] || "turn_on",
      enabled: a.enabled,
    };
  }

  // ── Arming from the header ──
  _arm(mode) {
    const id = this._entityId();
    const st = this._hass.states[id];
    if (!st) return;
    const disarm = mode === "disarm";
    const cfg = this._d?.config || {};
    const needs = st.attributes.code_format && (disarm ? cfg.code_disarm_required !== false : st.attributes.code_arm_required !== false);
    if (needs) {
      this._popup = { kind: "code", mode, format: st.attributes.code_format };
      this._render();
      this.shadowRoot.querySelector(".popup input")?.focus();
      return;
    }
    this._callArm(mode);
  }

  _callArm(mode, code) {
    const service = mode === "disarm" ? "alarm_disarm" : MODE_SERVICE[mode][0];
    const data = { entity_id: this._entityId() };
    if (code) data.code = code;
    this._hass.callService("alarm_control_panel", service, data).catch((err) => this._flash(this._t("error", { error: err?.message || err }), true));
  }

  _popupOk() {
    const p = this._popup;
    if (!p) return;
    if (p.kind === "code") {
      const code = this.shadowRoot.querySelector(".popup input")?.value || "";
      this._popup = null;
      this._render();
      this._callArm(p.mode, code);
    } else if (p.kind === "confirm") {
      this._popup = null;
      this._render();
      p.run();
    }
  }

  _confirm(name, run) {
    this._popup = { kind: "confirm", name, run };
    this._render();
  }

  // ── Actions of the tiles ──
  _curArea() {
    const ids = Object.keys(this._d?.areas || {});
    return ids.includes(this._areaSel) ? this._areaSel : ids[0];
  }

  _num(v, fallback = null) {
    if (v === "" || v === null || v === undefined) return fallback;
    const n = Math.max(0, Math.round(Number(v)));
    return Number.isFinite(n) ? n : fallback;
  }

  _modePayload(mode, patch = {}) {
    const m = { ...(this._d.areas[this._curArea()]?.modes?.[mode] || {}), ...patch };
    return {
      area_id: this._curArea(),
      modes: { [mode]: { enabled: !!m.enabled, exit_time: this._num(m.exit_time, 0), entry_time: this._num(m.entry_time, 0), trigger_time: this._num(m.trigger_time, 0) } },
    };
  }

  _act_mode_enable(id) {
    const mode = id.split(":")[1];
    const cur = this._d.areas[this._curArea()]?.modes?.[mode];
    this._post("area", this._modePayload(mode, { enabled: !cur?.enabled }));
  }

  _act_mode_save(id) {
    const mode = id.split(":")[1];
    const d = this._draft[id] || {};
    this._post("area", this._modePayload(mode, d)).then((ok) => ok && this._done(id));
  }

  _done(id) {
    delete this._draft[id];
    this._open.delete(id);
    this._renderPage();
  }

  _act_area_add() {
    const name = String(this._draft["new-area"]?.name || "").trim();
    if (!name) return;
    this._post("area", { name }).then((ok) => ok && this._done("new-area"));
  }

  _act_area_save(id) {
    const areaId = id.split(":")[1];
    const name = String(this._draft[id]?.name ?? "").trim();
    if (!name) return;
    this._post("area", { area_id: areaId, name }).then((ok) => ok && this._done(id));
  }

  _act_area_delete(id) {
    const areaId = id.split(":")[1];
    this._confirm(this._areaName(areaId), () => this._post("area", { area_id: areaId, remove: true }));
  }

  _act_config(_id, v) {
    const cfg = this._d.config;
    if (v === "master") return this._post("config", { master: { enabled: !cfg.master?.enabled, name: cfg.master?.name || "master" } });
    if (v === "number" || v === "text") return this._post("config", { code_format: v });
    this._post("config", { [v]: !cfg[v] });
  }

  _act_master_save(id) {
    const name = String(this._draft[id]?.name ?? "").trim();
    if (!name) return;
    this._post("config", { master: { enabled: true, name } }).then((ok) => ok && this._done(id));
  }

  _mqttPayload(patch = {}) {
    const m = { ...(this._d.config.mqtt || {}), ...patch };
    const out = {
      enabled: !!m.enabled,
      state_topic: m.state_topic || "alarmo/state",
      command_topic: m.command_topic || "alarmo/command",
      event_topic: m.event_topic || "alarmo/event",
      require_code: m.require_code !== false,
    };
    if (m.state_payload && Object.keys(m.state_payload).length) out.state_payload = m.state_payload;
    if (m.command_payload && Object.keys(m.command_payload).length) out.command_payload = m.command_payload;
    return { mqtt: out };
  }

  _act_mqtt_enable() {
    this._post("config", this._mqttPayload({ enabled: !this._d.config.mqtt?.enabled }));
  }

  _act_mqtt_save(id) {
    this._post("config", this._mqttPayload(this._draft[id] || {})).then((ok) => ok && this._done(id));
  }

  _act_sensor_enable(id) {
    const s = this._d.sensors[id.split(":")[1]];
    this._post("sensors", { entity_id: s.entity_id, enabled: s.enabled === false });
  }

  _act_sensor_save(id) {
    const eid = id.split(":")[1];
    const s = { ...this._d.sensors[eid], ...(this._draft[id] || {}) };
    const data = {
      entity_id: eid,
      type: s.type,
      modes: s.modes || [],
      use_exit_delay: !!s.use_exit_delay,
      use_entry_delay: !!s.use_entry_delay,
      arm_on_close: !!s.arm_on_close,
      allow_open: !!s.allow_open,
      auto_bypass: !!s.auto_bypass,
      auto_bypass_modes: s.auto_bypass ? s.auto_bypass_modes || [] : [],
      trigger_unavailable: !!s.trigger_unavailable,
      always_on: !!s.always_on,
      area: s.area,
      group: s.group || null,
    };
    this._post("sensors", data).then((ok) => ok && this._done(id));
  }

  _act_sensor_remove(id) {
    const eid = id.split(":")[1];
    this._confirm(this._name(eid), () => this._post("sensors", { entity_id: eid, remove: true }));
  }

  async _act_sensors_add() {
    const area = this._draft["add-sensors"]?.area || this._curArea();
    const modes = Object.entries(this._d.areas[area]?.modes || {})
      .filter(([, m]) => m.enabled)
      .map(([k]) => k);
    const ids = [...this._picked];
    let ok = true;
    for (const eid of ids) {
      const type = guessType(this._hass.states[eid]?.attributes?.device_class);
      const env = type === "environmental";
      const data = {
        entity_id: eid,
        type,
        area,
        enabled: true,
        modes: env ? [] : type === "motion" ? modes.filter((m) => m !== "armed_home") : modes,
        always_on: env,
        use_exit_delay: !env && type !== "tamper",
        use_entry_delay: type === "door" || type === "motion",
      };
      try {
        await this._hass.callApi("POST", "alarmo/sensors", data);
      } catch (err) {
        ok = false;
        this._flash(this._t("error", { error: err?.message || err }), true);
      }
    }
    this._picked.clear();
    if (ok) this._flash(this._t("saved"));
    await this._load();
    this._render();
  }

  _act_group_save(id) {
    const gid = id.split(":")[1];
    const g = { ...(this._d.groups[gid] || {}), ...(this._draft[id] || {}) };
    const name = String(g.name || "").trim();
    if (!name) return;
    const data = { name, entities: g.entities || [], timeout: this._num(g.timeout, 0), event_count: Math.max(2, this._num(g.event_count, 2)) };
    if (gid && gid !== "new") data.group_id = gid;
    this._post("sensor_groups", data).then((ok) => ok && this._done(id));
  }

  _act_group_delete(id) {
    const gid = id.split(":")[1];
    this._confirm(this._d.groups[gid]?.name || gid, () => this._post("sensor_groups", { group_id: gid, remove: true }));
  }

  _act_new(_id, v) {
    this._open.add(v);
    this._renderPage();
    this.shadowRoot.querySelector(`[data-id="${v}"] input`)?.focus();
  }

  _act_close_new(_id, v) {
    this._done(v);
  }

  _act_user_enable(id) {
    const u = this._d.users[id.split(":")[1]];
    this._post("users", { user_id: u.user_id, enabled: !u.enabled });
  }

  _act_user_save(id) {
    const [kind, uid] = id.split(":");
    const fresh = kind === "new-user";
    const u = { ...(fresh ? {} : this._d.users[uid]), ...(this._draft[id] || {}) };
    const name = String(u.name || "").trim();
    const code = String(this._draft[id]?.code || "");
    if (!name || (fresh && !code)) return;
    const data = {
      name,
      can_arm: this._val(id, "can_arm", false),
      can_disarm: this._val(id, "can_disarm", false),
      is_override_code: this._val(id, "is_override_code", false),
      area_limit: this._val(id, "area_limit", []),
    };
    if (fresh) Object.assign(data, { code, enabled: true });
    else {
      data.user_id = uid;
      if (code) Object.assign(data, { code, old_code: String(this._draft[id]?.old_code || "") });
    }
    this._post("users", data).then((ok) => ok && this._done(id));
  }

  _act_user_delete(id) {
    const uid = id.split(":")[1];
    this._confirm(this._d.users[uid]?.name || uid, () => this._post("users", { user_id: uid, remove: true }));
  }

  _act_auto_enable(id) {
    const a = this._d.automations[id.split(":")[1]];
    this._post("automations", { automation_id: a.automation_id, enabled: !a.enabled });
  }

  _autoPayload(id, type) {
    const g = (f, d) => this._val(id, f, d);
    const event = g("event", "triggered");
    const areaRaw = String(g("area", "0"));
    const trigger = { event, area: areaRaw === "0" ? 0 : areaRaw, modes: g("modes", []) };
    const name = String(g("name", "")).trim();
    if (type === "notification") {
      const service = g("service", "");
      if (!service) return null;
      return {
        type,
        name: name || `${this._t(`ev_${event}`)} → ${service.replace(/^notify\./, "")}`,
        triggers: [trigger],
        actions: [{ service, data: { title: g("title", ""), message: g("message", "") } }],
      };
    }
    const entity = g("entity_id", "");
    if (!entity) return null;
    const service = `${entity.split(".")[0]}.${g("service_action", "turn_on")}`;
    return { type, name: name || `${this._name(entity)} · ${this._t(`ev_${event}`)}`, triggers: [trigger], actions: [{ service, entity_id: entity }] };
  }

  _act_auto_save(id, type) {
    const [kind, aid] = id.split(":");
    const data = this._autoPayload(id, type);
    if (!data) return;
    if (kind === "auto") data.automation_id = aid;
    else data.enabled = true;
    this._post("automations", data).then((ok) => ok && this._done(id));
  }

  _act_auto_delete(id) {
    const aid = id.split(":")[1];
    this._confirm(this._d.automations[aid]?.name || aid, () => this._post("automations", { automation_id: aid, remove: true }));
  }

  _act_auto_test(id) {
    const service = this._val(id, "service", "");
    if (!service) return;
    const [domain, name] = service.split(".");
    this._hass
      .callService(domain, name, { title: this._val(id, "title", ""), message: String(this._val(id, "message", "")).replace(/\{\{\s*\w+\s*\}\}/g, "…") || "Alarm" })
      .catch((err) => this._flash(this._t("error", { error: err?.message || err }), true));
  }

  _act_set(_id, v, el) {
    const [key, value] = v.split("=");
    if (key === "panel_tabs") {
      const cur = new Set(this._opts().panel_tabs || CONTENT_TABS);
      cur.has(value) ? cur.delete(value) : cur.add(value);
      if (!cur.size) return;
      return this._saveSettings({ panel_tabs: PANEL_TABS.filter((t) => cur.has(t)) });
    }
    if (key === "sidebar_badge") return this._saveSettings({ sidebar_badge: value === "true" });
    if (key === "panel_title") {
      const title = this.shadowRoot.querySelector("[data-set-title]")?.value?.trim();
      if (title) this._saveSettings({ panel_title: title });
      return;
    }
    if (key === "entity") return this._saveSettings({ entity: el.value || "" });
    this._saveSettings({ [key]: value });
  }

  // ── Rendering ──
  _render() {
    const root = this.shadowRoot;
    if (!root) return;
    const kit = window.AlarmCardKit;
    const bare = this._bare();
    this.toggleAttribute("bare", bare);
    this.classList.toggle("dark", !!this._hass?.themes?.darkMode);
    const folded = Boolean(this.hasAttribute?.("pf-folded"));
    root.innerHTML = `<style>${kit ? kit.BASE_STYLE + kit.SCENE_STYLE : ""}${PANEL_STYLE}</style>
      <div class="bannerwrap"></div>
      <div class="tabbar"><ha-menu-button class="tmenu"></ha-menu-button><div class="tabs" role="tablist"></div></div>
      <div class="page"></div><div class="overlay"></div>`;
    this._renderBanner();
    this._renderTabs();
    this._renderPage();
    this._syncMenu();
    this._attachFold(folded);
  }

  /** The top bar folds on scroll into one bar with the tabs as icon pills (see alarmPanelFold). */
  _attachFold(folded = false) {
    this._fold?.detach();
    this._fold = alarmPanelFold(this, {
      top: ".bannerwrap",
      tabs: ".tabbar",
      tab: ".tab",
      key: (b) => b.dataset.v,
      icons: {
        general: "mdi:tune",
        sensors: "mdi:motion-sensor",
        codes: "mdi:dialpad",
        actions: "mdi:flash-outline",
        timeline: "mdi:timeline-clock-outline",
        settings: "mdi:cog",
      },
      badge: ".cnt",
      name: ".bannerwrap .name",
      sub: ".bannerwrap .sub",
      icon: ".bannerwrap .ibadge",
      status: ".bannerwrap .chip",
      acts: ".bannerwrap .banner .hbtns > *",
      actsMenu: true,
      accent: "#e5484d",
      folded,
      menu: () => ({ hass: this._hass, narrow: this._narrow, show: Boolean(this._narrow) }),
    });
  }

  _bare() {
    const h = this._opts().hide_header;
    return h === "all" || (h === "non_admin" && this._set?.admin === false);
  }

  _syncMenu() {
    for (const m of this.shadowRoot?.querySelectorAll("ha-menu-button") || []) {
      m.hass = this._hass;
      m.narrow = this._narrow;
    }
  }

  _stateSub(st) {
    if (!st) return this._t("sub_none");
    const s = st.state;
    if (s === "triggered") {
      const open = st.attributes.open_sensors ? Object.keys(st.attributes.open_sensors).map((id) => this._name(id)) : [];
      return open.length ? this._t("sub_triggered", { names: open.join(", ") }) : this._t("s_triggered");
    }
    if (s === "disarmed") {
      const b = this._blocking();
      return b.length ? this._t("sub_blocking", { names: b.map((x) => this._name(x.entity_id)).join(", ") }) : this._t("sub_ready", { n: Object.keys(this._d?.sensors || {}).length });
    }
    if (s.startsWith("armed_")) {
      const time = new Date(st.last_changed).toLocaleTimeString(this._hass.locale?.language || undefined, { hour: "2-digit", minute: "2-digit" });
      return this._t("sub_since", { time });
    }
    return this._t(`s_${s}`);
  }

  _renderBanner() {
    const wrap = this.shadowRoot?.querySelector(".bannerwrap");
    const kit = window.AlarmCardKit;
    if (!wrap || !this._hass) return;
    if (!kit) {
      wrap.innerHTML = `<div class="plainbar"><ha-menu-button></ha-menu-button><div class="name">${pesc(this._opts().panel_title || this._t("title"))}</div></div>`;
      return this._syncMenu();
    }
    const id = this._entityId();
    const st = id ? this._hass.states[id] : null;
    const cls = st ? kit.stateClass(st.state) : "idle";
    const theme = this._opts().illustration_theme;
    const dark = kit.isNight(this._hass, { illustration_theme: theme === "auto" ? undefined : theme });
    const feats = st?.attributes?.supported_features || 0;
    const modes = ["disarm", ...ALARM_MODES.filter((m) => feats & MODE_SERVICE[m][1])];
    const curMode = st?.state === "disarmed" ? "disarm" : st?.state;
    const label = st ? this._t(`s_${st.state}`) : this._t("s_unavailable");
    const btns = st
      ? modes
          .map((m) => {
            const c = m === "disarm" ? "off" : MODE_CLASS[m];
            const icon = m === "disarm" ? kit.STATE_ICON.off : kit.STATE_ICON[c];
            const name = this._t(m === "disarm" ? "m_disarm" : `m_${m}`);
            return `<button class="mbtn ${c}${curMode === m ? " on" : ""}" data-a="mode" data-v="${m}" title="${pesc(name)}" aria-label="${pesc(name)}">${picon(icon)}</button>`;
          })
          .join("")
      : "";
    wrap.innerHTML = `<div class="banner ${cls}${dark ? " dark" : ""}">
        <div class="al-ground" aria-hidden="true"></div>${kit.alarmRadar("panel")}
        <div class="al-shield" aria-hidden="true">${kit.shield(st?.state, "panel")}</div>
        <div class="header htext"><ha-menu-button></ha-menu-button>
          <div class="ibadge">${picon(kit.STATE_ICON[cls] || kit.ICONS.shield)}</div>
          <div class="titles"><div class="tline"><div class="name">${pesc(this._opts().panel_title || this._t("title"))}</div>
            <span class="chip ${cls}"><span class="dot"></span><span class="chip-text">${pesc(label)}</span></span></div>
            <div class="sub">${pesc(this._stateSub(st))}</div></div>
        </div>
        <div class="hbtns">${btns}</div>
      </div>
      ${btns ? `<div class="modes-row">${btns}</div>` : ""}`;
    this._syncMenu();
  }

  _renderTabs() {
    const el = this.shadowRoot?.querySelector(".tabs");
    if (!el) return;
    const n = this._blocking().length;
    el.innerHTML = this._shownTabs()
      .map(
        (t) =>
          `<button class="tab${t === this._tab ? " on" : ""}" role="tab" aria-selected="${t === this._tab}" data-a="tab" data-v="${t}">${pesc(this._t(`t_${t}`))}${
            t === "sensors" && n ? `<span class="cnt">${n}</span>` : ""
          }</button>`,
      )
      .join("");
  }

  // keepFocus: redrawn while a field has the focus (a chip or a select): the focus goes back to the same field.
  _renderPage(keepFocus = false) {
    const page = this.shadowRoot?.querySelector(".page");
    if (!page || !this._hass) return;
    const focus = keepFocus ? this._focusKey() : null;
    let html;
    if (!this._set) html = `<div class="empty">${pesc(this._t("loading"))}</div>`;
    else if (this._tab === "settings") html = this._pageSettings();
    else if (this._set.alarmo === false) html = this._noAlarmo();
    else if (!this._d) html = `<div class="empty">${pesc(this._t("loading"))}</div>`;
    else html = this[`_page_${this._tab}`]();
    page.innerHTML = html;
    const ov = this.shadowRoot.querySelector(".overlay");
    if (ov) ov.innerHTML = this._popupHtml() + (this._toast ? `<div class="toast${this._toastBad ? " bad" : ""}" role="status">${pesc(this._toast)}</div>` : "");
    if (focus) this._restoreFocus(focus);
  }

  _focusKey() {
    const a = this.shadowRoot?.activeElement;
    if (!a) return null;
    return { id: a.closest("[data-id]")?.dataset.id, f: a.dataset.f, q: a.dataset.q !== undefined, pos: a.selectionStart };
  }

  _restoreFocus(k) {
    const sel = k.q ? "[data-q]" : k.f && k.id ? `[data-id="${CSS.escape(k.id)}"] [data-f="${CSS.escape(k.f)}"]` : null;
    const el = sel && this.shadowRoot.querySelector(sel);
    if (!el) return;
    el.focus();
    try {
      if (k.pos != null) el.setSelectionRange(k.pos, k.pos);
    } catch (_err) {
      /* not a text field */
    }
  }

  _noAlarmo() {
    return `<div class="box empty-box"><div class="ti c-grey big">${picon(PI.info)}</div><h3>${pesc(this._t("no_alarmo"))}</h3><p>${pesc(this._t("no_alarmo_hint"))}</p></div>`;
  }

  _popupHtml() {
    const p = this._popup;
    if (!p) return "";
    const body =
      p.kind === "code"
        ? `<h3>${pesc(this._t("code_title"))}</h3><p>${pesc(this._t("code_hint"))}</p><input class="txt" type="password" autocomplete="off" ${p.format === "number" ? 'inputmode="numeric"' : ""}>`
        : `<h3>${pesc(this._t("confirm_delete", { name: p.name }))}</h3>`;
    return `<div class="backdrop"><div class="popup" role="dialog" aria-modal="true">${body}
      <div class="actions"><button class="btn" data-a="popup-cancel">${pesc(this._t("cancel"))}</button>
      <button class="btn ${p.kind === "confirm" ? "danger" : "acc"}" data-a="popup-ok">${pesc(p.kind === "confirm" ? this._t("delete") : "OK")}</button></div></div></div>`;
  }

  // Building blocks.
  _tile(id, { icon, c = "c-grey", name, line, lineMuted = false, pill, pillC = "c-grey", right = "", body = "", tags = [] }) {
    const open = this._open.has(id);
    return `<div class="tile${open ? " open" : ""}" data-id="${pesc(id)}">
      <div class="trow"${body ? ` data-a="toggle-tile" role="button" tabindex="0" aria-expanded="${open}"` : ""}><div class="ti ${c}">${picon(icon)}</div>
        <div class="tx ${c}"><div class="tn">${pesc(name)}</div><div class="ts${lineMuted ? " muted" : ""}">${pesc(line)}</div>${
          tags.length ? `<div class="mini-tags">${tags.map((t) => `<span class="tag">${pesc(t)}</span>`).join("")}</div>` : ""
        }${pill ? `<span class="pill inline ${pillC}"><span class="dot"></span>${pesc(pill)}</span>` : ""}</div>
        ${pill ? `<span class="pill side ${pillC}"><span class="dot"></span>${pesc(pill)}</span>` : ""}${right}${body ? `<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="${PI.chev}"/></svg>` : ""}</div>
      ${body && open ? `<div class="tbody">${body}</div>` : ""}</div>`;
  }

  _tg(on, a, v = "", label = "") {
    return `<span class="tg${on ? " on" : ""}" role="switch" tabindex="0" aria-checked="${!!on}" aria-label="${pesc(label)}" data-a="${a}" data-v="${pesc(v)}"></span>`;
  }

  _row(label, hint, ctl) {
    return `<div class="frow"><div class="fl"><b>${pesc(label)}</b>${hint ? `<small>${pesc(hint)}</small>` : ""}</div>${ctl}</div>`;
  }

  _dtg(id, f, label, hint = "") {
    const on = !!this._val(id, f, false);
    return this._row(label, hint, `<span class="tg${on ? " on" : ""}" role="switch" tabindex="0" aria-checked="${on}" aria-label="${pesc(label)}" data-a="dtg" data-f="${f}"></span>`);
  }

  _numIn(id, f, label, hint, unit = this._t("sec")) {
    const v = this._val(id, f, "");
    return this._row(label, hint, `<span class="num"><input type="number" min="0" data-f="${f}" value="${pesc(v ?? "")}" aria-label="${pesc(label)}"><span>${pesc(unit)}</span></span>`);
  }

  _txtIn(id, f, label, hint = "", type = "text", width = 200) {
    return this._row(
      label,
      hint,
      `<input class="txt" style="width:min(${width}px,100%)" type="${type}" data-f="${f}" value="${pesc(this._val(id, f, ""))}" aria-label="${pesc(label)}"${type === "password" ? ' autocomplete="new-password"' : ""}>`,
    );
  }

  _sel(id, f, label, options, hint = "", live = false) {
    // A field with no value yet shows its first option: the draft holds it, so that saving sends what is shown.
    if (this._val(id, f, undefined) === undefined && options.length) (this._draft[id] ||= {})[f] = options[0][0];
    const cur = String(this._val(id, f, ""));
    return this._row(
      label,
      hint,
      `<select class="sel" data-f="${f}"${live ? " data-live" : ""} aria-label="${pesc(label)}">${options
        .map(([v, l]) => `<option value="${pesc(v)}"${String(v) === cur ? " selected" : ""}>${pesc(l)}</option>`)
        .join("")}</select>`,
    );
  }

  _chips(id, f, label, hint, options, colorOf = () => "c-acc") {
    const cur = new Set(this._val(id, f, []));
    return `<div class="frow col"><div class="fl"><b>${pesc(label)}</b>${hint ? `<small>${pesc(hint)}</small>` : ""}</div><div class="chips">${options
      .map(
        ([v, l]) =>
          `<button class="mchip ${colorOf(v)}${cur.has(v) ? " on" : ""}" aria-pressed="${cur.has(v)}" data-a="chip" data-f="${f}" data-v="${pesc(v)}">${pesc(l)}</button>`,
      )
      .join("")}</div></div>`;
  }

  _btns(...b) {
    return `<div class="actions">${b.join("")}</div>`;
  }

  _btn(label, a, { cls = "", v = "", icon = "" } = {}) {
    return `<button class="btn ${cls}" data-a="${a}" data-v="${pesc(v)}">${icon ? picon(icon) : ""}${pesc(label)}</button>`;
  }

  _box(title, body, { head = "", hint = "", wide = false } = {}) {
    return `<section class="box${wide ? " wide" : ""}"><div class="bh"><h2>${pesc(title)}</h2>${head}</div>${hint ? `<p class="hint">${pesc(hint)}</p>` : ""}${body}</section>`;
  }

  _areaChips(action, current, withAll) {
    const areas = Object.values(this._d.areas || {});
    if (areas.length < 2 && !withAll) return "";
    const items = [...(withAll ? [["all", this._t("all_areas")]] : []), ...areas.map((a) => [a.area_id, a.name])];
    return items.map(([v, l]) => `<button class="fchip${current === v ? " on" : ""}" data-a="${action}" data-v="${pesc(v)}">${pesc(l)}</button>`).join("");
  }

  _modeColor(m) {
    return MODE_CLASS[m] || "c-acc";
  }

  _modeOptions() {
    return ALARM_MODES.map((m) => [m, this._t(`m_${m}`)]);
  }

  // ── General ──
  _page_general() {
    const area = this._curArea();
    const modes = this._d.areas[area]?.modes || {};
    const kit = window.AlarmCardKit;
    const fmt = (s) => (s ? `${s} ${this._t("sec")}` : `0 ${this._t("sec")}`);
    const modeTiles = ALARM_MODES.map((m) => {
      const cfg = modes[m] || {};
      const id = `mode:${m}`;
      const c = MODE_CLASS[m];
      return this._tile(id, {
        icon: kit?.STATE_ICON[c] || PI.home,
        c: cfg.enabled ? `c-${c}` : "c-grey",
        name: this._t(`m_${m}`),
        line: cfg.enabled ? this._t("mode_line", { exit: fmt(cfg.exit_time), entry: fmt(cfg.entry_time), trigger: cfg.trigger_time ? fmt(cfg.trigger_time) : this._t("unlimited") }) : this._t("mode_off"),
        lineMuted: !cfg.enabled,
        right: this._tg(cfg.enabled, "mode-enable", "", this._t(`m_${m}`)),
        body:
          this._numIn(id, "exit_time", this._t("exit_time"), this._t("exit_time_hint")) +
          this._numIn(id, "entry_time", this._t("entry_time"), this._t("entry_time_hint")) +
          this._numIn(id, "trigger_time", this._t("trigger_time"), this._t("trigger_time_hint")) +
          this._btns(this._btn(this._t("save"), "mode-save", { cls: "acc" })),
      });
    }).join("");
    const st = this._hass.states;
    const areaTiles = Object.values(this._d.areas)
      .map((a) => {
        const id = `area:${a.area_id}`;
        const ent = this._areaEntity(a.area_id);
        const s = st[ent];
        const cls = s ? kit?.stateClass(s.state) || "idle" : "idle";
        const n = Object.values(this._d.sensors).filter((x) => x.area === a.area_id).length;
        return this._tile(id, {
          icon: PI.home,
          c: `c-${cls}`,
          name: a.name,
          line: `${this._t("area_line", { n })}${ent ? ` · ${ent}` : ""}`,
          pill: s ? this._t(`s_${s.state}`) : "",
          pillC: `c-${cls}`,
          body:
            this._txtIn(id, "name", this._t("area_name")) +
            this._btns(
              Object.keys(this._d.areas).length > 1 ? this._btn(this._t("delete_area"), "area-delete", { cls: "danger", icon: PI.del }) : "",
              this._btn(this._t("save"), "area-save", { cls: "acc" }),
            ),
        });
      })
      .join("");
    const newArea = this._open.has("new-area")
      ? `<div class="tile open new" data-id="new-area"><div class="tbody">${this._txtIn("new-area", "name", this._t("area_name"))}${this._btns(
          this._btn(this._t("cancel"), "close-new", { v: "new-area" }),
          this._btn(this._t("add"), "area-add", { cls: "acc" }),
        )}</div></div>`
      : "";
    const cfg = this._d.config;
    const mq = cfg.mqtt || {};
    const masterBody = cfg.master?.enabled
      ? `<div data-id="master">${this._txtIn("master", "name", this._t("master_name"))}${
          this._draft.master?.name !== undefined ? this._btns(this._btn(this._t("save"), "master-save", { cls: "acc" })) : ""
        }</div>`
      : "";
    const mqttBody = mq.enabled
      ? `<div data-id="mqtt">${this._txtIn("mqtt", "state_topic", this._t("state_topic"))}${this._txtIn("mqtt", "command_topic", this._t("command_topic"))}${this._txtIn(
          "mqtt",
          "event_topic",
          this._t("event_topic"),
        )}${this._dtg("mqtt", "require_code", this._t("require_code"), this._t("require_code_hint"))}${this._btns(this._btn(this._t("save"), "mqtt-save", { cls: "acc" }))}</div>`
      : "";
    const chips = this._areaChips("area-sel", area, false);
    return `${chips ? `<div class="filters">${chips}</div>` : ""}<div class="grid">
      ${this._box(this._t("modes"), `<div class="list">${modeTiles}</div>`, { hint: this._t("modes_hint") })}
      <div class="col">
        ${this._box(this._t("areas"), `<div class="list">${newArea}${areaTiles}</div>`, { head: this._btn(this._t("add_area"), "new", { cls: "acc", v: "new-area", icon: PI.plus }) })}
        ${this._box(
          this._t("behaviour"),
          this._row(this._t("master"), this._t("master_hint"), this._tg(cfg.master?.enabled, "config", "master", this._t("master"))) +
            masterBody +
            this._row(this._t("disarm_after_trigger"), this._t("disarm_after_trigger_hint"), this._tg(cfg.disarm_after_trigger, "config", "disarm_after_trigger", this._t("disarm_after_trigger"))) +
            this._row(
              this._t("ignore_blocking"),
              this._t("ignore_blocking_hint"),
              this._tg(cfg.ignore_blocking_sensors_after_trigger, "config", "ignore_blocking_sensors_after_trigger", this._t("ignore_blocking")),
            ),
        )}
        ${this._box(this._t("mqtt"), mqttBody, { head: this._tg(mq.enabled, "mqtt-enable", "", this._t("mqtt")), hint: this._t("mqtt_hint") })}
      </div></div>`;
  }

  // ── Sensors ──
  _sensorStatus(s) {
    const state = this._hass.states[s.entity_id]?.state;
    if (s.enabled === false) return [this._t("st_disabled"), "c-grey"];
    if (state === undefined || state === "unavailable" || state === "unknown") return [this._t("st_unavailable"), "c-red"];
    if (isOpenState(state)) {
      if (s.auto_bypass) return [this._t("st_bypassed"), "c-grey"];
      if (s.allow_open) return [this._t("st_open_ok"), "c-blue"];
      if ((s.modes || []).length) return [this._t("st_open"), "c-amber"];
    }
    return [this._t("st_ready"), "c-off"];
  }

  _page_sensors() {
    const q = this._query.trim().toLowerCase();
    const match = (id) => !q || id.toLowerCase().includes(q) || this._name(id).toLowerCase().includes(q);
    const groups = this._d.groups || {};
    const sensors = Object.values(this._d.sensors)
      .filter((s) => (this._filter === "all" || s.area === this._filter) && match(s.entity_id))
      .sort((a, b) => this._name(a.entity_id).localeCompare(this._name(b.entity_id)));
    const typeOpts = SENSOR_TYPES.map((t) => [t, this._t(`ty_${t}`)]);
    const areaOpts = Object.values(this._d.areas).map((a) => [a.area_id, a.name]);
    const groupOpts = [["", this._t("none")], ...Object.values(groups).map((g) => [g.group_id, g.name])];
    const tiles = sensors
      .map((s) => {
        const id = `sensor:${s.entity_id}`;
        const st = this._hass.states[s.entity_id];
        const [pill, pillC] = this._sensorStatus(s);
        const open = isOpenState(st?.state);
        const tags = [
          ...(s.modes || []).map((m) => this._t(`m_${m}`)),
          ...(s.always_on ? [this._t("f_always")] : []),
          ...(s.use_entry_delay ? [this._t("f_entry")] : (s.modes || []).length ? [this._t("f_immediate")] : []),
          ...(s.auto_bypass ? [this._t("f_bypass")] : []),
          ...(s.trigger_unavailable ? [this._t("f_unavailable")] : []),
        ];
        const autoBypass = this._val(id, "auto_bypass", false);
        return this._tile(id, {
          icon: PI[s.type] || PI.other,
          c: s.enabled === false ? "c-grey" : open ? "c-blue" : pillC === "c-red" ? "c-red" : "c-off",
          name: this._name(s.entity_id),
          line: `${st ? (open ? this._t("on") : st.state === "off" ? this._t("off") : (this._hass.formatEntityState?.(st) ?? st.state)) : this._t("st_unavailable")} · ${this._areaName(s.area)}`,
          pill,
          pillC,
          tags,
          right: this._tg(s.enabled !== false, "sensor-enable", "", this._name(s.entity_id)),
          body: `<div class="two"><div>${this._sel(id, "type", this._t("type"), typeOpts)}${areaOpts.length > 1 ? this._sel(id, "area", this._t("area"), areaOpts) : ""}${this._sel(
            id,
            "group",
            this._t("group"),
            groupOpts,
          )}${this._chips(id, "modes", this._t("sensor_modes"), this._t("sensor_modes_hint"), this._modeOptions(), (m) => this._modeColor(m))}</div><div>${this._dtg(
            id,
            "use_exit_delay",
            this._t("use_exit_delay"),
          )}${this._dtg(id, "use_entry_delay", this._t("use_entry_delay"), this._t("use_entry_delay_hint"))}${this._dtg(id, "arm_on_close", this._t("arm_on_close"), this._t("arm_on_close_hint"))}${this._dtg(
            id,
            "allow_open",
            this._t("allow_open"),
          )}${this._dtg(id, "auto_bypass", this._t("auto_bypass"), this._t("auto_bypass_hint"))}${
            autoBypass ? this._chips(id, "auto_bypass_modes", this._t("sensor_modes"), "", this._modeOptions(), (m) => this._modeColor(m)) : ""
          }${this._dtg(id, "trigger_unavailable", this._t("trigger_unavailable"))}${this._dtg(id, "always_on", this._t("always_on"), this._t("always_on_hint"))}</div></div>${this._btns(
            this._btn(this._t("remove"), "sensor-remove", { cls: "danger", icon: PI.del }),
            this._btn(this._t("save"), "sensor-save", { cls: "acc" }),
          )}`,
        });
      })
      .join("");
    // Candidates: binary sensors (and a few other open/closed entities) not in the alarm yet.
    const used = new Set(Object.keys(this._d.sensors));
    const cands = Object.keys(this._hass.states)
      .filter((id) => id.startsWith("binary_sensor.") && !used.has(id) && match(id))
      .sort((a, b) => this._name(a).localeCompare(this._name(b)));
    const candTiles = cands
      .slice(0, 60)
      .map((eid) => {
        const type = guessType(this._hass.states[eid]?.attributes?.device_class);
        const on = this._picked.has(eid);
        return `<div class="tile"><div class="trow" data-a="pick" data-v="${pesc(eid)}" role="checkbox" tabindex="0" aria-checked="${on}"><span class="check${on ? " on" : ""}"></span><div class="ti ${
          TYPE_COLOR[type]
        }">${picon(PI[type])}</div><div class="tx"><div class="tn">${pesc(this._name(eid))}</div><div class="ts muted">${pesc(eid)}</div></div></div></div>`;
      })
      .join("");
    const addHead = `<div class="hgroup">${
      areaOpts.length > 1
        ? `<span data-id="add-sensors"><select class="sel" data-f="area" aria-label="${pesc(this._t("area"))}">${areaOpts
            .map(([v, l]) => `<option value="${pesc(v)}"${(this._draft["add-sensors"]?.area || this._curArea()) === v ? " selected" : ""}>${pesc(l)}</option>`)
            .join("")}</select></span>`
        : ""
    }${this._picked.size ? this._btn(this._t("add_n", { n: this._picked.size }), "sensors-add", { cls: "acc", icon: PI.plus }) : ""}</div>`;
    const groupTiles = Object.values(groups)
      .map((g) => this._groupTile(`group:${g.group_id}`, g))
      .join("");
    const newGroup = this._open.has("new-group") ? this._groupTile("new-group", {}, true) : "";
    return `<div class="filters">${this._areaChips("filter", this._filter, true)}<label class="search">${picon(PI.search)}<input data-q placeholder="${pesc(this._t("search"))}" value="${pesc(
      this._query,
    )}"></label></div>
      <div class="grid">
        ${this._box(`${this._t("sensors")} · ${sensors.length}`, sensors.length ? `<div class="list">${tiles}</div>` : `<p class="hint">${pesc(this._t("no_sensors"))}</p>`, { wide: true })}
        ${this._box(this._t("add_sensors"), cands.length ? `<div class="list">${candTiles}</div>` : `<p class="hint">${pesc(this._t("no_candidates"))}</p>`, {
          head: addHead,
          hint: this._t("add_sensors_hint"),
        })}
        ${this._box(this._t("groups"), `<div class="list">${newGroup}${groupTiles}</div>`, {
          head: this._btn(this._t("new_group"), "new", { cls: "acc", v: "new-group", icon: PI.plus }),
          hint: this._t("groups_hint"),
        })}
      </div>`;
  }

  _groupTile(id, g, fresh = false) {
    const sensorOpts = Object.keys(this._d.sensors).map((eid) => [eid, this._name(eid)]);
    const body =
      this._txtIn(id, "name", this._t("name")) +
      this._numIn(id, "event_count", this._t("event_count"), "", "") +
      this._numIn(id, "timeout", this._t("timeout"), "") +
      this._chips(id, "entities", this._t("group_sensors"), "", sensorOpts) +
      this._btns(
        fresh ? this._btn(this._t("cancel"), "close-new", { v: id }) : this._btn(this._t("delete"), "group-delete", { cls: "danger", icon: PI.del }),
        this._btn(this._t("save"), "group-save", { cls: "acc" }),
      );
    if (fresh) return `<div class="tile open new" data-id="${id}"><div class="tbody">${body}</div></div>`;
    return this._tile(id, {
      icon: PI.group,
      c: "c-acc",
      name: g.name,
      line: this._t("group_line", { events: g.event_count, timeout: g.timeout, n: (g.entities || []).length }),
      body,
    });
  }

  // ── Codes ──
  _page_codes() {
    const cfg = this._d.config;
    const areaOpts = Object.values(this._d.areas).map((a) => [a.area_id, a.name]);
    const userBody = (id, fresh) =>
      this._txtIn(id, "name", this._t("user_name")) +
      (fresh ? this._txtIn(id, "code", this._t("code"), "", "password", 140) : this._txtIn(id, "code", this._t("code"), this._t("code_keep"), "password", 140)) +
      (!fresh && this._draft[id]?.code ? this._txtIn(id, "old_code", this._t("old_code"), "", "password", 140) : "") +
      this._dtg(id, "can_arm", this._t("can_arm")) +
      this._dtg(id, "can_disarm", this._t("can_disarm")) +
      this._dtg(id, "is_override_code", this._t("is_override_code"), this._t("is_override_code_hint")) +
      (areaOpts.length > 1 ? this._chips(id, "area_limit", this._t("area_limit"), this._t("area_limit_hint"), areaOpts) : "") +
      this._btns(
        fresh ? this._btn(this._t("cancel"), "close-new", { v: id }) : this._btn(this._t("delete"), "user-delete", { cls: "danger", icon: PI.del }),
        this._btn(this._t("save"), "user-save", { cls: "acc" }),
      );
    const users = Object.values(this._d.users || {})
      .map((u) => {
        const id = `user:${u.user_id}`;
        const rights = u.can_arm && u.can_disarm ? "u_arm_disarm" : u.can_arm ? "u_arm" : u.can_disarm ? "u_disarm" : "u_none";
        const areas = (u.area_limit || []).length ? u.area_limit.map((a) => this._areaName(a)).join(", ") : this._t("all_areas");
        return this._tile(id, {
          icon: u.is_override_code ? PI.key : PI.account,
          c: u.enabled ? "c-off" : "c-grey",
          name: u.name,
          line: `${this._t(rights)} · ${areas}`,
          lineMuted: !u.enabled,
          pill: u.is_override_code ? this._t("u_override") : "",
          pillC: "c-home",
          right: this._tg(u.enabled, "user-enable", "", u.name),
          body: userBody(id, false),
        });
      })
      .join("");
    const newUser = this._open.has("new-user") ? `<div class="tile open new" data-id="new-user"><div class="tbody">${userBody("new-user", true)}</div></div>` : "";
    const fmt = cfg.code_format === "text" ? "text" : "number";
    return `<div class="grid">
      ${this._box(
        this._t("code_usage"),
        this._row(this._t("code_arm_required"), "", this._tg(cfg.code_arm_required, "config", "code_arm_required", this._t("code_arm_required"))) +
          this._row(this._t("code_disarm_required"), "", this._tg(cfg.code_disarm_required, "config", "code_disarm_required", this._t("code_disarm_required"))) +
          this._row(
            this._t("code_mode_change_required"),
            this._t("code_mode_change_hint"),
            this._tg(cfg.code_mode_change_required, "config", "code_mode_change_required", this._t("code_mode_change_required")),
          ) +
          this._row(
            this._t("code_format"),
            this._t("code_format_hint"),
            `<span class="seg">${["number", "text"].map((f) => `<button class="${fmt === f ? "on" : ""}" aria-pressed="${fmt === f}" data-a="config" data-v="${f}">${pesc(this._t(`cf_${f}`))}</button>`).join("")}</span>`,
          ),
      )}
      ${this._box(`${this._t("users")} · ${Object.keys(this._d.users || {}).length}`, `<div class="list">${newUser}${users}</div>`, {
        head: this._btn(this._t("new_user"), "new", { cls: "acc", v: "new-user", icon: PI.plus }),
      })}
    </div>`;
  }

  // ── Actions ──
  _page_actions() {
    const autos = Object.values(this._d.automations || {});
    const areaOpts = [["0", this._t("all_areas")], ...Object.values(this._d.areas).map((a) => [a.area_id, a.name])];
    const evOpts = EVENTS.map((e) => [e, this._t(`ev_${e}`)]);
    const notifyOpts = Object.keys(this._hass.services?.notify || {})
      .sort()
      .map((s) => [`notify.${s}`, `notify.${s}`]);
    const entityOpts = Object.keys(this._hass.states)
      .filter((id) => ACTION_DOMAINS.includes(id.split(".")[0]))
      .sort((a, b) => this._name(a).localeCompare(this._name(b)))
      .map((id) => [id, `${this._name(id)} (${id})`]);
    const editor = (id, type, fresh) => {
      const common =
        this._txtIn(id, "name", this._t("name"), "", "text", 260) +
        this._sel(id, "event", this._t("event"), evOpts) +
        (areaOpts.length > 2 ? this._sel(id, "area", this._t("area"), areaOpts) : "") +
        this._chips(id, "modes", this._t("action_modes"), this._t("action_modes_hint"), this._modeOptions(), (m) => this._modeColor(m));
      const specific =
        type === "notification"
          ? this._sel(id, "service", this._t("target"), notifyOpts.length ? notifyOpts : [["", this._t("none")]]) +
            this._txtIn(id, "title", this._t("notif_title"), "", "text", 260) +
            this._txtIn(id, "message", this._t("message"), this._t("message_hint"), "text", 260)
          : this._sel(id, "entity_id", this._t("entity"), [["", this._t("none")], ...entityOpts]) +
            this._sel(id, "service_action", this._t("action"), [
              ["turn_on", this._t("turn_on")],
              ["turn_off", this._t("turn_off")],
            ]);
      return (
        common +
        specific +
        this._btns(
          type === "notification" ? this._btn(this._t("test"), "auto-test") : "",
          fresh ? this._btn(this._t("cancel"), "close-new", { v: id }) : this._btn(this._t("delete"), "auto-delete", { cls: "danger", icon: PI.del }),
          this._btn(this._t("save"), "auto-save", { cls: "acc", v: type }),
        )
      );
    };
    const list = (type) =>
      autos
        .filter((a) => (type === "notification" ? a.type === "notification" : a.type !== "notification"))
        .map((a) => {
          const id = `auto:${a.automation_id}`;
          const f = this._autoFlat(a);
          const ev = f.event ? this._t(`ev_${f.event}`) : "";
          const target = type === "notification" ? f.service : `${f.service || ""}${f.entity_id ? ` · ${this._name(f.entity_id)}` : ""}`;
          const color = !a.enabled ? "c-grey" : f.event === "triggered" ? "c-alarm" : f.event === "arm_failure" ? "c-home" : f.event === "disarmed" ? "c-off" : "c-acc";
          return this._tile(id, {
            icon: type === "notification" ? PI.bell : PI.flash,
            c: color,
            name: a.name || ev,
            line: [ev, target, f.area !== "0" ? this._areaName(f.area) : ""].filter(Boolean).join(" · "),
            lineMuted: !a.enabled,
            right: this._tg(a.enabled, "auto-enable", "", a.name),
            body: editor(id, type, false),
          });
        })
        .join("");
    const fresh = (type) => {
      const id = `new-auto:${type}`;
      return this._open.has(id) ? `<div class="tile open new" data-id="${id}"><div class="tbody">${editor(id, type, true)}</div></div>` : "";
    };
    const nl = list("notification");
    const al = list("action");
    return `<div class="grid">
      ${this._box(this._t("notifications"), `<div class="list">${fresh("notification")}${nl || `<p class="hint">${pesc(this._t("no_notifications"))}</p>`}</div>`, {
        head: this._btn(this._t("new_notification"), "new", { cls: "acc", v: "new-auto:notification", icon: PI.plus }),
      })}
      ${this._box(this._t("actions"), `<div class="list">${fresh("action")}${al || `<p class="hint">${pesc(this._t("no_actions"))}</p>`}</div>`, {
        head: this._btn(this._t("new_action"), "new", { cls: "acc", v: "new-auto:action", icon: PI.plus }),
      })}
    </div>`;
  }

  // ── Timeline ──
  // The activity of the alarm's sensors over 6 h, 24 h or 3 days, from Home Assistant's history: the alarm's state on
  // top, then one row per room, sensor type or sensor (the choice, the sort and the filters are kept by the browser).
  _tlState() {
    if (!this._tl) {
      let saved = {};
      try {
        saved = JSON.parse(localStorage.getItem(TL_KEY) || "{}") || {};
      } catch (_err) {
        saved = {};
      }
      this._tl = {
        room: saved.room || "all",
        period: TL_SPANS[saved.period] ? saved.period : "24h",
        group: ["room", "type", "none"].includes(saved.group) ? saved.group : "room",
        sort: ["recent", "count", "name"].includes(saved.sort) ? saved.sort : "recent",
        hidden: new Set(Array.isArray(saved.hidden) ? saved.hidden : []),
        open: new Set(),
        data: null,
        key: "",
        at: 0,
      };
    }
    return this._tl;
  }

  _tlSave() {
    const s = this._tl;
    try {
      localStorage.setItem(TL_KEY, JSON.stringify({ room: s.room, period: s.period, group: s.group, sort: s.sort, hidden: [...s.hidden] }));
    } catch (_err) {
      /* kept for this page only */
    }
  }

  _tlIds() {
    return [this._entityId(), ...Object.keys(this._d?.sensors || {})].filter(Boolean);
  }

  // The history of the window, read again when the period or the sensors change, and every 5 minutes.
  async _tlLoad(force = false) {
    const s = this._tlState();
    const ids = this._tlIds();
    const key = `${s.period}|${ids.join(",")}`;
    if (!force && s.key === key && Date.now() - s.at < 300000) return;
    if (s.loading) return;
    s.loading = true;
    s.key = key;
    s.at = Date.now();
    const start = new Date(Date.now() - TL_SPANS[s.period] * 3600e3).toISOString();
    try {
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start,
        entity_ids: ids,
        minimal_response: true,
        no_attributes: true,
        significant_changes_only: false,
      });
      s.data = res || {};
    } catch (err) {
      console.warn("alarm-panel: history not loaded", err);
      s.data = {};
    }
    s.loading = false;
    if (this._tab === "timeline") this._renderPage();
  }

  // [start ms, end ms, state] of an entity over the window; its live state extends the history to now.
  _tlSegs(id, t0, now) {
    const pts = (this._tl.data?.[id] || []).map((p) => [((p.lc ?? p.lu) || 0) * 1000, p.s]);
    const live = this._hass.states[id];
    if (live) {
      const t = Date.parse(live.last_changed);
      if (!pts.length || t > pts[pts.length - 1][0]) pts.push([Math.max(t, t0), live.state]);
    }
    return pts.map(([t, st], i) => [Math.max(t, t0), i + 1 < pts.length ? pts[i + 1][0] : now, st]).filter(([a, b]) => b > a);
  }

  _tlRoom(id) {
    const ent = this._hass.entities?.[id];
    const area = ent?.area_id || this._hass.devices?.[ent?.device_id]?.area_id;
    return area ? { id: area, name: this._hass.areas?.[area]?.name || area } : { id: "_none", name: this._t("no_room") };
  }

  _tlWord(type, on) {
    if (type === "motion") return this._t(on ? "tl_motion" : "tl_clear");
    if (type === "environmental" || type === "tamper") return this._t(on ? "tl_detected" : "tl_ok");
    return this._t(on ? "on" : "off");
  }

  _page_timeline() {
    const s = this._tlState();
    this._tlLoad();
    if (!s.data) return `<div class="empty">${pesc(this._t("loading"))}</div>`;
    const now = Date.now();
    const span = TL_SPANS[s.period] * 3600e3;
    const t0 = now - span;
    const pct = (t) => ((t - t0) / span) * 100;
    const lang = this._hass.locale?.language || this._hass.language || "en";
    const fmt = (t) => new Date(t).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
    const ago = (t) => {
      const m = Math.round((t - now) / 60000);
      return Math.abs(m) < 60 ? rtf.format(m, "minute") : Math.abs(m) < 2880 ? rtf.format(Math.round(m / 60), "hour") : rtf.format(Math.round(m / 1440), "day");
    };
    const dur = (a, b) => {
      const m = Math.max(1, Math.round((b - a) / 60000));
      return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
    };
    const kit = window.AlarmCardKit;
    const tip = (o) => `data-tip="${pesc(JSON.stringify(o))}"`;
    // The alarm's segments, its delays and its triggers.
    const alarmId = this._entityId();
    const alarm = alarmId ? this._tlSegs(alarmId, t0, now) : [];
    const stateAt = (t) => alarm.find(([a, b]) => t >= a && t < b)?.[2] || "";
    // The sensors, with their room, type and open / unavailable intervals.
    const all = Object.values(this._d.sensors).map((x) => {
      const segs = this._tlSegs(x.entity_id, t0, now);
      return {
        id: x.entity_id,
        name: this._name(x.entity_id),
        type: SENSOR_TYPES.includes(x.type) ? x.type : "other",
        room: this._tlRoom(x.entity_id),
        on: segs.filter(([, , st]) => isOpenState(st)),
        unav: segs.filter(([, , st]) => st === "unavailable" || st === "unknown"),
        live: this._hass.states[x.entity_id]?.state,
      };
    });
    const rooms = [...new Map(all.map((x) => [x.room.id, x.room])).values()].sort((a, b) => (a.id === "_none") - (b.id === "_none") || a.name.localeCompare(b.name));
    if (s.room !== "all" && !rooms.some((r) => r.id === s.room)) s.room = "all";
    const types = SENSOR_TYPES.filter((ty) => all.some((x) => x.type === ty));
    const shown = all.filter((x) => (s.room === "all" || x.room.id === s.room) && !s.hidden.has(x.type));
    const last = (x) => x.on.at(-1)?.[1] ?? 0;
    const sortFn = { recent: (a, b) => last(b) - last(a), count: (a, b) => b.on.length - a.on.length, name: (a, b) => a.name.localeCompare(b.name) }[s.sort];
    const sorted = (l) => [...l].sort(sortFn);
    // Summary tiles.
    const events = shown.flatMap((x) => x.on.map((iv) => ({ x, iv })));
    const most = [...shown].sort((a, b) => b.on.length - a.on.length)[0];
    const longest = [...events].sort((a, b) => b.iv[1] - b.iv[0] - (a.iv[1] - a.iv[0]))[0];
    const triggers = alarm.filter(([, , st]) => st === "triggered");
    const lastTrigger = triggers.at(-1);
    const culprit = lastTrigger && events.filter((e) => e.iv[0] <= lastTrigger[0] && e.iv[0] >= lastTrigger[0] - 300000).sort((a, b) => b.iv[0] - a.iv[0])[0];
    const tile = (c, icon, label, value, sub) =>
      `<div class="sum"><div class="ti ${c}">${picon(icon)}</div><div class="tx"><div class="sl">${pesc(label)}</div><div class="sv">${pesc(value)}</div><div class="ts muted">${pesc(sub)}</div></div></div>`;
    const sums = `<div class="sums">
      ${tile("c-acc", PI.list, this._t("tl_events"), String(events.length), this._t("tl_tracked", { n: shown.length }))}
      ${tile(triggers.length ? "c-alarm" : "c-off", kit?.STATE_ICON.alarm || PI.bell, this._t("tl_triggers"), triggers.length ? String(triggers.length) : this._t("tl_none"), lastTrigger ? `${fmt(lastTrigger[0])}${culprit ? ` · ${culprit.x.name}` : ""}` : this._t("tl_calm"))}
      ${most?.on.length ? tile(TL_COLOR[most.type], PI[most.type], this._t("tl_most"), most.name, `${this._t("tl_times", { n: most.on.length })} · ${most.room.name}`) : ""}
      ${longest ? tile(TL_COLOR[longest.x.type], PI[longest.x.type], this._t("tl_longest"), dur(longest.iv[0], longest.iv[1]), `${longest.x.name} · ${fmt(longest.iv[0])}`) : ""}
    </div>`;
    // Grid lines, armed periods and the delay / trigger marks drawn in every track.
    const step = TL_SPANS[s.period] > 24 ? 6 : TL_SPANS[s.period] > 6 ? 3 : 1;
    const ticks = [];
    const first = new Date(t0);
    first.setMinutes(0, 0, 0);
    for (let t = first.getTime() + 3600e3; t < now; t += 3600e3) {
      const h = new Date(t).getHours();
      if (h % step === 0 && pct(t) < 93) ticks.push([t, h === 0, h !== 0 && (TL_SPANS[s.period] > 24 || h % (step * 2) !== 0)]);
    }
    const under =
      ticks.map(([t, mid]) => `<i class="gl${mid ? " mid" : ""}" style="left:${pct(t)}%"></i>`).join("") +
      alarm
        .filter(([, , st]) => st.startsWith("armed_"))
        .map(([a, b, st]) => `<i class="armed ${MODE_CLASS[st] || "away"}" style="left:${pct(a)}%;width:${pct(b) - pct(a)}%"></i>`)
        .join("");
    const marks = alarm
      .filter(([a, , st]) => (st === "pending" || st === "triggered") && a > t0)
      .map(([a, , st]) => `<i class="mk ${st === "triggered" ? "alarm" : "wait"}" style="left:${pct(a)}%"></i>`)
      .join("");
    const stLabel = (st) => this._t(`s_${st}`);
    const alarmTrack = alarm
      .map(([a, b, st]) => {
        const c = kit ? kit.stateClass(st) : "idle";
        const w = pct(b) - pct(a);
        return `<i class="seg-a ${c}" ${tip({ t: stLabel(st), c: `c-${c}`, l: `${fmt(a)} → ${b >= now - 1000 ? this._t("tl_now") : fmt(b)}`, d: dur(a, b) })} style="left:${pct(a)}%;width:${Math.max(0.4, w)}%"><span>${w > 10 ? pesc(stLabel(st)) : ""}</span></i>`;
      })
      .join("");
    const alarmSt = alarmId ? this._hass.states[alarmId] : null;
    const alarmCls = alarmSt && kit ? kit.stateClass(alarmSt.state) : "idle";
    const alarmRow = `<div class="tl-row alarm"><div class="tl-lab"><div class="ti c-${alarmCls}">${picon(kit?.STATE_ICON[alarmCls] || PI.home)}</div><div class="tx c-${alarmCls}"><div class="tn">${pesc(
      alarmSt?.attributes?.friendly_name || this._t("alarm"),
    )}</div><div class="ts">${pesc(alarmSt ? this._stateSub(alarmSt) : "")}</div></div></div><div class="tl-track">${alarmTrack}<i class="nowdot c-${alarmCls}"></i></div></div>`;
    const bars = (x, cls = "") =>
      x.on
        .map(
          ([a, b]) =>
            `<i class="seg-s ${TL_COLOR[x.type]} ${cls}" ${tip({ t: x.name, r: x.room.name, c: TL_COLOR[x.type], l: `${this._tlWord(x.type, true)} · ${fmt(a)} → ${b >= now - 1000 ? this._t("tl_now") : fmt(b)}`, d: dur(a, b), w: stateAt(a) ? this._t("tl_alarm_at", { state: stLabel(stateAt(a)) }) : "" })} style="left:${pct(a)}%;width:${Math.max(0.4, pct(b) - pct(a))}%"></i>`,
        )
        .join("") +
      x.unav
        .map(([a, b]) => `<i class="seg-u ${cls}" ${tip({ t: x.name, r: x.room.name, c: "c-red", l: `${this._t("st_unavailable")} · ${fmt(a)} → ${fmt(b)}`, d: dur(a, b) })} style="left:${pct(a)}%;width:${pct(b) - pct(a)}%"></i>`)
        .join("");
    const sensorRow = (x, showRoom) => {
      const l = x.on.at(-1);
      // Open now: since when; otherwise its last activity.
      const openNow = isOpenState(x.live) && l && l[1] >= now - 1000;
      const when = openNow ? this._t("sub_since", { time: fmt(l[0]) }) : l ? this._t("tl_last", { ago: ago(l[1]) }) : this._t("tl_no_activity");
      const line = `${showRoom ? `${x.room.name} · ` : ""}${this._tlWord(x.type, isOpenState(x.live))} · ${when}`;
      return `<div class="tl-row"><div class="tl-lab"><div class="ti ${TL_COLOR[x.type]}">${picon(PI[x.type])}</div><div class="tx"><div class="tn">${pesc(x.name)}</div><div class="ts muted">${pesc(line)}</div></div><span class="tcnt">${x.on.length}</span></div>
        <div class="tl-track">${under}${bars(x)}${marks}</div></div>`;
    };
    // Rows: by room, by type, or one row per sensor.
    let groups;
    if (s.group === "type") groups = types.map((ty) => ({ id: `t-${ty}`, name: this._t(`ty_${ty}`), c: TL_COLOR[ty], icon: PI[ty], l: sorted(shown.filter((x) => x.type === ty)) }));
    else if (s.group === "room") groups = rooms.map((r) => ({ id: `r-${r.id}`, name: r.name, c: "c-acc", icon: PI.home, l: sorted(shown.filter((x) => x.room.id === r.id)) }));
    groups = (groups || []).filter((g) => g.l.length);
    const body =
      s.group === "none"
        ? sorted(shown)
            .map((x) => sensorRow(x, true))
            .join("")
        : groups
            .map((g) => {
              const n = g.l.reduce((acc, x) => acc + x.on.length, 0);
              const open = s.open.has(g.id) || (s.group === "room" && s.room !== "all");
              return `<div class="tl-row grp${open ? " open" : ""}" data-a="tl-toggle" data-v="${pesc(g.id)}" role="button" tabindex="0" aria-expanded="${open}"><div class="tl-lab"><div class="ti ${g.c}">${picon(g.icon)}</div><div class="tx"><div class="tn">${pesc(g.name)}</div><div class="ts muted">${pesc(
                `${this._t("tl_n_sensors", { n: g.l.length })} · ${g.l.map((x) => x.name).join(", ")}`,
              )}</div></div><span class="tcnt">${n}</span><svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="${PI.chev}"/></svg></div>
                <div class="tl-track lanes" style="--n:${g.l.length}">${under}${g.l.map((x) => `<div class="lane">${bars(x, "thin")}</div>`).join("")}${marks}</div></div>
                ${open ? `<div class="tl-sub">${g.l.map((x) => sensorRow(x, s.group !== "room")).join("")}</div>` : ""}`;
            })
            .join("");
    const axis = `<div class="tl-axis"><div></div><div class="tl-track">${ticks
      .map(
        ([t, mid, minor]) =>
          `<span class="${mid ? "mid" : ""}${minor ? " minor" : ""}" style="left:${pct(t)}%">${pesc(mid ? new Date(t).toLocaleDateString(lang, { weekday: "short", day: "numeric" }) : `${new Date(t).getHours()} h`)}</span>`,
      )
      .join("")}<span class="now" style="left:100%">${fmt(now)}</span></div></div>`;
    const seg = (a, values, cur) =>
      `<span class="seg">${values.map(([v, l]) => `<button class="${cur === v ? "on" : ""}" aria-pressed="${cur === v}" data-a="${a}" data-v="${v}">${pesc(l)}</button>`).join("")}</span>`;
    const filters = `<div class="filters">${[["all", this._t("all_rooms")], ...rooms.map((r) => [r.id, r.name])]
      .map(([v, l]) => `<button class="fchip${s.room === v ? " on" : ""}" data-a="tl-room" data-v="${pesc(v)}">${pesc(l)}</button>`)
      .join("")}<span class="grow"></span>${seg(
      "tl-period",
      Object.keys(TL_SPANS).map((p) => [p, this._t(`p_${p}`)]),
      s.period,
    )}</div>`;
    const legend = `<div class="legend">${types
      .map(
        (ty) =>
          `<button class="lchip ${TL_COLOR[ty]}${s.hidden.has(ty) ? "" : " on"}" aria-pressed="${!s.hidden.has(ty)}" data-a="tl-type" data-v="${ty}"><i></i>${pesc(this._t(`ty_${ty}`))}</button>`,
      )
      .join("")}<span class="lkey"><i class="u"></i>${pesc(this._t("st_unavailable"))}</span><span class="lkey"><i class="arm"></i>${pesc(this._t("tl_armed"))}</span><span class="lkey"><i class="mk"></i>${pesc(
      this._t("tl_marks"),
    )}</span></div>`;
    const title = this._t({ room: "tl_by_room", type: "tl_by_type", none: "tl_by_sensor" }[s.group]);
    const controls = `<div class="hgroup">${seg(
      "tl-group",
      [
        ["room", this._t("g_room")],
        ["type", this._t("g_type")],
        ["none", this._t("g_none")],
      ],
      s.group,
    )}<select class="sel" data-tl-sort aria-label="${pesc(this._t("so_label"))}">${[
      ["recent", this._t("so_recent")],
      ["count", this._t("so_count")],
      ["name", this._t("so_name")],
    ]
      .map(([v, l]) => `<option value="${v}"${s.sort === v ? " selected" : ""}>${pesc(l)}</option>`)
      .join("")}</select></div>`;
    const empty = !Object.keys(s.data).length ? `<p class="hint">${pesc(this._t("tl_no_history"))}</p>` : "";
    return `${filters}${sums}<section class="box wide"><div class="bh"><h2>${pesc(title)}</h2>${controls}</div>${legend}${empty}<div class="tl">${alarmRow}${body}${axis}</div></section>`;
  }

  _act_tl_room(_id, v) {
    this._tl.room = v;
    this._tlSave();
    this._renderPage();
  }

  _act_tl_period(_id, v) {
    this._tl.period = v;
    this._tlSave();
    this._tl.data = null;
    this._renderPage();
  }

  _act_tl_group(_id, v) {
    this._tl.group = v;
    this._tl.open.clear();
    this._tlSave();
    this._renderPage();
  }

  _act_tl_type(_id, v) {
    const h = this._tl.hidden;
    // At least one type stays shown.
    if (h.has(v)) h.delete(v);
    else if (h.size + 1 < SENSOR_TYPES.length) h.add(v);
    this._tlSave();
    this._renderPage();
  }

  _act_tl_toggle(_id, v) {
    const o = this._tl.open;
    o.has(v) ? o.delete(v) : o.add(v);
    this._renderPage();
  }

  // The tooltip of a bar of the timeline, under it, inside the panel.
  _tlTip(e) {
    const el = e.target.closest?.("[data-tip]");
    this.shadowRoot.querySelector(".tip")?.remove();
    if (!el) return;
    let o;
    try {
      o = JSON.parse(el.dataset.tip);
    } catch (_err) {
      return;
    }
    const host = this.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const d = document.createElement("div");
    d.className = `tip ${o.c || ""}`;
    d.setAttribute("role", "tooltip");
    d.innerHTML = `<b><i></i>${pesc(o.t)}</b>${o.r ? `<div class="m">${pesc(o.r)}</div>` : ""}<div>${pesc(o.l)}</div><div class="m">${pesc(this._t("tl_duration", { d: o.d }))}</div>${o.w ? `<div class="m">${pesc(o.w)}</div>` : ""}`;
    this.shadowRoot.appendChild(d);
    d.style.left = `${Math.min(Math.max(8, b.left - host.left + b.width / 2 - 100), host.width - d.offsetWidth - 8)}px`;
    d.style.top = `${b.bottom - host.top + 8}px`;
  }

  // ── Settings ──
  _pageSettings() {
    const o = this._opts();
    const seg = (key, values, cur) =>
      `<span class="seg">${values
        .map(([v, l]) => `<button class="${String(cur) === String(v) ? "on" : ""}" aria-pressed="${String(cur) === String(v)}" data-a="set" data-v="${key}=${v}">${pesc(l)}</button>`)
        .join("")}</span>`;
    const tabs = o.panel_tabs?.length ? o.panel_tabs : CONTENT_TABS;
    const alarms = Object.keys(this._hass.states).filter((id) => id.startsWith("alarm_control_panel."));
    return `<div class="grid">
      ${this._box(
        this._t("display"),
        this._row(
          this._t("panel_title"),
          "",
          `<span class="hgroup"><input class="txt" style="width:160px" data-set-title maxlength="50" value="${pesc(o.panel_title || "")}" aria-label="${pesc(this._t("panel_title"))}">${this._btn(this._t("save"), "set", {
            v: "panel_title=",
          })}</span>`,
        ) +
          this._row(
            this._t("hide_header"),
            this._t("hide_header_hint"),
            seg(
              "hide_header",
              [
                ["off", this._t("hh_off")],
                ["non_admin", this._t("hh_non_admin")],
                ["all", this._t("hh_all")],
              ],
              o.hide_header || "off",
            ),
          ) +
          `<div class="frow col"><div class="fl"><b>${pesc(this._t("panel_tabs"))}</b></div><div class="chips">${CONTENT_TABS
            .map((t) => `<button class="mchip c-acc${tabs.includes(t) ? " on" : ""}" aria-pressed="${tabs.includes(t)}" data-a="set" data-v="panel_tabs=${t}">${pesc(this._t(`t_${t}`))}</button>`)
            .join("")}</div></div>` +
          this._row(
            this._t("sidebar_badge"),
            this._t("sidebar_badge_hint"),
            seg(
              "sidebar_badge",
              [
                ["true", this._t("enabled")],
                ["false", this._t("disabled")],
              ],
              o.sidebar_badge !== false,
            ),
          ),
      )}
      ${this._box(
        this._t("alarm"),
        this._row(
          this._t("header_entity"),
          "",
          `<select class="sel" data-a="set" data-v="entity=" aria-label="${pesc(this._t("header_entity"))}"><option value="">${pesc(this._t("header_entity_auto"))}</option>${alarms
            .map((id) => `<option value="${pesc(id)}"${o.entity === id ? " selected" : ""}>${pesc(this._name(id))}</option>`)
            .join("")}</select>`,
        ) +
          this._row(
            this._t("illustration_theme"),
            this._t("illustration_theme_hint"),
            seg(
              "illustration_theme",
              [
                ["auto", this._t("th_auto")],
                ["day", this._t("th_day")],
                ["night", this._t("th_night")],
              ],
              o.illustration_theme || "auto",
            ),
          ) +
          `<div class="note">${picon(PI.info)}<span>${pesc(this._t("admin_note"))}</span></div>`,
      )}
    </div>`;
  }
}

export const PANEL_STYLE = `
  :host { display: block; min-height: 100vh; background: var(--primary-background-color); color: var(--primary-text-color);
          font-family: var(--paper-font-body1_-_font-family, inherit); font-size: 14px; container: al-panel / inline-size;
          --A: #e5484d; --tile: rgba(127,127,127,.07); }
  :host(.dark) { --tile: rgba(255,255,255,.05); }
  * { box-sizing: border-box; }
  .icon { width: 20px; height: 20px; fill: currentColor; flex: none; }
  /* The card's banner across the page: the whole radar at the right, the text and the mode buttons at its left. */
  .banner { container-type: inline-size; --al-scene-w: 260px; }
  .banner .htext { left: 8px; right: calc(var(--al-scene-w) + 238px); gap: 10px; }
  .banner .name { font-size: 20px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .banner .ibadge { width: 44px; height: 44px; } .banner .ibadge .icon { width: 26px; height: 26px; }
  .banner ha-menu-button { flex: none; color: inherit; margin-right: -6px; }
  .hbtns { position: absolute; z-index: 3; top: 24px; right: calc(var(--al-scene-w) + 12px); display: flex; gap: 6px; }
  .mbtn { all: unset; box-sizing: border-box; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; color: #33506b;
          background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
  .mbtn .icon { width: 18px; height: 18px; }
  .banner.dark .mbtn { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .mbtn:hover { background: rgba(255,255,255,.78); } .banner.dark .mbtn:hover { background: rgba(255,255,255,.22); }
  .banner .mbtn.on, .banner.dark .mbtn.on { color: var(--c); box-shadow: inset 0 0 0 1.5px var(--c); }
  .banner.dark .mbtn.on { color: color-mix(in srgb, var(--c) 70%, #fff); }
  .mbtn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .modes-row { display: none; gap: 6px; flex-wrap: wrap; padding: 10px 16px 0; max-width: 1100px; margin: 0 auto; }
  .modes-row .mbtn { background: var(--secondary-background-color, rgba(127,127,127,.12)); box-shadow: none; color: var(--secondary-text-color); }
  .modes-row .mbtn.on { color: var(--c); box-shadow: inset 0 0 0 1.5px var(--c); }
  @container al-panel (max-width: 780px) { .banner { --al-scene-w: 84px; } .banner .al-scene, .banner .al-grid { display: none; } }
  @container al-panel (max-width: 600px) { .hbtns { display: none; } .banner .htext { right: 84px; } .modes-row { display: flex; } }
  .plainbar { display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 12px; border-bottom: 1px solid var(--divider-color); }
  .plainbar .name { font-size: 20px; }
  /* Tabs under the header, as on the other ha-* panels. */
  :host([bare]) .bannerwrap { display: none; }
  .tabbar { display: flex; align-items: center; gap: 8px; padding: 0 12px; border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12)); background: var(--primary-background-color);
            position: sticky; top: 0; z-index: 4; }
  .tmenu { display: none; margin-left: -8px; color: var(--primary-text-color); } :host([bare]) .tmenu { display: block; }
  .tabs { flex: 1; min-width: 0; display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
  .tab { all: unset; cursor: pointer; padding: 12px 10px 10px; font-size: 14px; font-weight: 500; white-space: nowrap; color: var(--secondary-text-color); border-bottom: 2px solid transparent; }
  .tab.on { color: var(--primary-text-color); border-bottom-color: var(--A); }
  .tab:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
  .cnt { display: inline-block; min-width: 18px; padding: 1px 5px; margin-left: 4px; border-radius: 9px; font-size: 11px; text-align: center;
         color: color-mix(in srgb, var(--al-home) 45%, var(--primary-text-color)); background: color-mix(in srgb, var(--al-home) 18%, transparent); }
  .page { max-width: 1100px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr)); gap: 14px; align-items: start; }
  .col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
  .box { background: var(--card-background-color, #fff); border-radius: var(--ha-card-border-radius, 12px); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
         padding: 12px 16px 14px; min-width: 0; }
  .box.wide { grid-column: 1 / -1; }
  .bh { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; min-height: 32px; }
  .bh h2 { margin: 0; font-size: 14px; font-weight: 500; color: var(--secondary-text-color); }
  .hgroup { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
  .hint { font-size: 12px; color: var(--secondary-text-color); margin: -4px 0 10px; line-height: 1.4; }
  .empty { padding: 48px 16px; text-align: center; color: var(--secondary-text-color); }
  .empty-box { text-align: center; padding: 32px 16px; } .empty-box h3 { margin: 12px 0 4px; font-weight: 500; } .empty-box p { margin: 0 auto; max-width: 460px; color: var(--secondary-text-color); line-height: 1.5; }
  .ti.big { margin: 0 auto; width: 48px; height: 48px; }
  /* Tiles: the ha-* card look (neutral tile, round tinted icon, bold name, coloured state line, state pill). */
  .list { display: flex; flex-direction: column; gap: 6px; }
  .tile { border-radius: 10px; background: var(--tile); }
  .trow { display: flex; align-items: center; gap: 10px; padding: 8px 10px; min-height: 52px; border-radius: 12px; }
  .trow[data-a] { cursor: pointer; }
  .trow:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
  .ti { --c: var(--al-idle); width: 36px; height: 36px; border-radius: 50%; flex: none; display: grid; place-items: center; color: var(--c); background: color-mix(in srgb, var(--c) 16%, transparent); }
  .tx { flex: 1; min-width: 0; }
  .tn { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ts { font-size: 12px; margin-top: 1px; color: color-mix(in srgb, var(--c, var(--al-idle)) 45%, var(--primary-text-color)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ts.muted { color: var(--secondary-text-color); }
  .pill { --c: var(--al-idle); display: inline-flex; align-items: center; gap: 5px; flex: none; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 12px; white-space: nowrap;
          background: color-mix(in srgb, var(--c) 15%, transparent); color: color-mix(in srgb, var(--c) 40%, var(--primary-text-color)); }
  .pill .dot { width: 6px; height: 6px; }
  /* On a phone the state pill goes under the name, which keeps the room beside the switch. */
  .pill.inline { display: none; margin-top: 4px; }
  @container al-panel (max-width: 560px) {
    .pill.side { display: none; } .pill.inline { display: inline-flex; }
    .tbody { padding-left: 12px; }
    .sel { max-width: 55%; }
  }
  .chev { width: 18px; height: 18px; fill: var(--secondary-text-color); transition: transform .15s; flex: none; }
  .tile.open .chev { transform: rotate(90deg); }
  .tbody { padding: 4px 12px 12px 56px; }
  .tile.new .tbody { padding: 10px 12px 12px; }
  .two { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap: 0 20px; }
  .c-off { --c: var(--al-off); } .c-home { --c: var(--al-home); } .c-away { --c: var(--al-away); } .c-night { --c: var(--al-night); } .c-vacation { --c: var(--al-vacation); }
  .c-custom { --c: var(--al-custom); } .c-wait { --c: var(--al-wait); } .c-alarm, .c-red { --c: var(--al-alarm); } .c-idle, .c-grey { --c: var(--al-idle); }
  .c-amber { --c: var(--al-home); } .c-blue { --c: var(--info-color, #2f80ed); } .c-violet { --c: var(--al-night); } .c-acc { --c: var(--A); }
  /* Form rows. */
  .frow { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 42px; padding: 4px 0; border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent); }
  .frow:last-child { border-bottom: 0; }
  .frow.col { display: block; padding: 8px 0; } .frow.col .fl { margin-bottom: 6px; }
  .fl { min-width: 0; } .fl b { display: block; font-weight: 500; font-size: 13px; } .fl small { display: block; font-size: 12px; color: var(--secondary-text-color); margin-top: 1px; }
  .num { display: inline-flex; align-items: center; gap: 6px; flex: none; }
  .num input, .txt, .sel { font: inherit; font-size: 13px; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--card-background-color, #fff); color: var(--primary-text-color); }
  .num input { width: 76px; text-align: right; } .num span { font-size: 12px; color: var(--secondary-text-color); }
  .sel { max-width: 60%; }
  .txt:focus, .sel:focus, .num input:focus { outline: 2px solid color-mix(in srgb, var(--A) 50%, transparent); outline-offset: 0; }
  .tg { position: relative; width: 36px; height: 20px; border-radius: 10px; flex: none; cursor: pointer; background: color-mix(in srgb, var(--secondary-text-color) 40%, transparent); transition: background .15s; }
  .tg::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.3); transition: transform .15s; }
  .tg.on { background: var(--A); } .tg.on::after { transform: translateX(16px); }
  .tg:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .seg { display: inline-flex; border: 1px solid var(--divider-color); border-radius: 18px; overflow: hidden; flex: none; }
  .seg button { all: unset; cursor: pointer; padding: 5px 12px; font-size: 12px; color: var(--secondary-text-color); }
  .seg button + button { border-left: 1px solid var(--divider-color); }
  .seg button.on { color: color-mix(in srgb, var(--A) 55%, var(--primary-text-color)); background: color-mix(in srgb, var(--A) 14%, transparent); }
  .seg button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .mchip { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 4px 10px; border-radius: 14px; border: 1px solid var(--divider-color); color: var(--secondary-text-color); }
  .mchip.on { color: color-mix(in srgb, var(--c) 45%, var(--primary-text-color)); background: color-mix(in srgb, var(--c) 14%, transparent); border-color: color-mix(in srgb, var(--c) 45%, transparent); }
  .mchip:focus-visible { outline: 2px solid var(--primary-color); }
  .mini-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
  .tag { font-size: 10.5px; padding: 1px 6px; border-radius: 8px; background: color-mix(in srgb, var(--secondary-text-color) 14%, transparent); color: var(--secondary-text-color); }
  /* Buttons: never filled (tinted, as on the cards). */
  .btn { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; padding: 6px 12px; border-radius: 18px;
         background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); white-space: nowrap; }
  .btn .icon { width: 16px; height: 16px; }
  .btn.acc { background: color-mix(in srgb, var(--A) 14%, transparent); color: color-mix(in srgb, var(--A) 55%, var(--primary-text-color)); }
  .btn.danger { background: color-mix(in srgb, var(--al-alarm) 12%, transparent); color: color-mix(in srgb, var(--al-alarm) 55%, var(--primary-text-color)); }
  .btn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; flex-wrap: wrap; }
  .filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .fchip { all: unset; cursor: pointer; display: inline-flex; align-items: center; min-height: 32px; padding: 0 12px; border-radius: 18px; font-size: 13px; box-sizing: border-box;
           color: var(--secondary-text-color); background: var(--card-background-color, #fff); border: 1px solid var(--divider-color); }
  .fchip.on { color: var(--primary-text-color); border: 1.5px solid var(--A); }
  .fchip:focus-visible { outline: 2px solid var(--primary-color); }
  .search { flex: 1; min-width: 180px; display: flex; align-items: center; gap: 6px; padding: 0 10px; height: 34px; border-radius: 18px; border: 1px solid var(--divider-color);
            background: var(--card-background-color, #fff); color: var(--secondary-text-color); }
  .search input { all: unset; flex: 1; font-size: 13px; color: var(--primary-text-color); }
  .check { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid var(--secondary-text-color); flex: none; display: grid; place-items: center; }
  .check.on { background: color-mix(in srgb, var(--A) 18%, transparent); border-color: var(--A); }
  .check.on::after { content: ""; width: 5px; height: 9px; border: solid var(--A); border-width: 0 2px 2px 0; transform: rotate(45deg) translate(-1px, -1px); }
  .note { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--secondary-text-color); padding: 8px 10px; border-radius: 10px; background: var(--tile); margin-top: 10px; line-height: 1.4; }
  .note .icon { width: 16px; height: 16px; }
  /* Popups at the top of the panel (code, delete), and a short toast. */
  .backdrop { position: fixed; inset: 0; z-index: 10; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center; padding-top: 96px; }
  .popup { background: var(--card-background-color, #fff); color: var(--primary-text-color); width: min(92%, 360px); border-radius: 16px; padding: 16px 18px; box-shadow: 0 10px 40px rgba(0,0,0,.3); }
  .popup h3 { margin: 0 0 6px; font-size: 16px; font-weight: 500; } .popup p { margin: 0 0 10px; font-size: 13px; color: var(--secondary-text-color); }
  .popup .txt { width: 100%; font-size: 16px; }
  .toast { position: fixed; z-index: 11; left: 50%; bottom: 24px; transform: translateX(-50%); padding: 8px 16px; border-radius: 18px; font-size: 13px;
           background: var(--primary-text-color); color: var(--primary-background-color); box-shadow: 0 4px 16px rgba(0,0,0,.25); }
  .toast.bad { background: var(--al-alarm); color: #fff; }
  /* Timeline: summary tiles, then the alarm's band and the rows of the sensors over the window. */
  .c-cyan { --c: var(--al-vacation); }
  .grow { flex: 1; }
  .bh { flex-wrap: wrap; } .bh .sel { max-width: none; }
  .sums { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
  .sum { display: flex; gap: 10px; align-items: center; padding: 12px; border-radius: 12px; background: var(--card-background-color, #fff); border: 1px solid var(--divider-color); min-width: 0; }
  .sum .sl { font-size: 12px; color: var(--secondary-text-color); }
  .sum .sv { font-size: 17px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tl { display: flex; flex-direction: column; position: relative; }
  .tl-row { display: grid; grid-template-columns: minmax(170px, 250px) minmax(0, 1fr); align-items: center; gap: 12px; min-height: 46px; border-top: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent); }
  .tl-row.alarm { min-height: 54px; border-top: 0; }
  .tl-lab { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .tl-lab .ti { width: 30px; height: 30px; } .tl-lab .icon { width: 17px; height: 17px; }
  .tcnt { margin-left: auto; flex: none; font-size: 11px; font-weight: 600; color: var(--secondary-text-color); background: var(--tile); border-radius: 9px; padding: 1px 7px; }
  .tl-track { position: relative; height: 24px; border-radius: 6px; background: var(--tile); overflow: hidden; }
  .tl-row.alarm .tl-track { height: 28px; overflow: visible; }
  .tl-track > i, .lane > i { position: absolute; top: 0; bottom: 0; }
  .gl { width: 1px; background: color-mix(in srgb, var(--divider-color) 70%, transparent); }
  .gl.mid { width: 0; border-left: 1.5px dashed color-mix(in srgb, var(--secondary-text-color) 50%, transparent); }
  .armed { --c: var(--al-away); background: color-mix(in srgb, var(--c) 8%, transparent); }
  .armed.home { --c: var(--al-home); } .armed.night { --c: var(--al-night); } .armed.vacation { --c: var(--al-vacation); } .armed.custom { --c: var(--al-custom); }
  .mk { width: 0; border-left: 2px dotted var(--al-wait); z-index: 2; } .mk.alarm { border-left: 2px solid var(--al-alarm); }
  .seg-a { background: color-mix(in srgb, var(--c, var(--al-idle)) 72%, transparent); display: flex; align-items: center; overflow: hidden; cursor: pointer; }
  .seg-a:first-child { border-radius: 6px 0 0 6px; }
  .seg-a.off { background: color-mix(in srgb, var(--c) 28%, transparent); }
  .seg-a.alarm { background: var(--c); box-shadow: 0 0 0 2px color-mix(in srgb, var(--c) 35%, transparent); z-index: 2; }
  .seg-a span { font-size: 11px; font-weight: 500; color: #fff; padding-left: 7px; white-space: nowrap; }
  .seg-a.off span, .seg-a.idle span { color: color-mix(in srgb, var(--c) 45%, var(--primary-text-color)); }
  .nowdot { left: calc(100% - 5px) !important; top: 9px !important; bottom: auto !important; width: 10px; height: 10px; border-radius: 50%; background: var(--c); z-index: 3;
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 30%, transparent); animation: tl-pulse 2s ease-in-out infinite; }
  @keyframes tl-pulse { 50% { box-shadow: 0 0 0 6px transparent; } }
  .seg-s { top: 5px !important; bottom: 5px !important; border-radius: 4px; background: var(--c); min-width: 3px; cursor: pointer; z-index: 1; }
  .seg-u { background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--al-alarm) 55%, transparent) 0 4px, transparent 4px 8px); cursor: pointer; z-index: 1; }
  .seg-s:hover, .seg-a:hover, .seg-u:hover { filter: brightness(1.12); }
  .lanes { height: calc(var(--n) * 7px + 8px); padding: 4px 0; display: flex; flex-direction: column; gap: 1px; }
  .lane { position: relative; flex: 1; }
  .seg-s.thin, .seg-u.thin { top: 0 !important; bottom: 0 !important; border-radius: 2px; }
  .tl-row.grp { cursor: pointer; } .tl-row.grp .chev { margin-left: 6px; } .tl-row.grp.open .chev { transform: rotate(90deg); }
  .tl-row.grp:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
  .tl-sub { padding-left: 16px; border-left: 2px solid color-mix(in srgb, var(--A) 30%, transparent); margin: 0 0 6px 14px; }
  .tl-axis { display: grid; grid-template-columns: minmax(170px, 250px) minmax(0, 1fr); gap: 12px; margin-top: 6px; }
  .tl-axis .tl-track { background: none; height: 16px; overflow: visible; }
  .tl-axis span { position: absolute; transform: translateX(-50%); font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; }
  .tl-axis span.mid { font-weight: 600; color: var(--primary-text-color); }
  .tl-axis span.now { transform: translateX(-100%); color: var(--A); font-weight: 600; }
  .legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; font-size: 12px; color: var(--secondary-text-color); margin: -2px 0 12px; }
  .lchip { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 14px; border: 1px solid var(--divider-color); }
  .lchip:focus-visible { outline: 2px solid var(--primary-color); }
  .lchip i, .lkey i { width: 14px; height: 8px; border-radius: 3px; background: var(--c); display: inline-block; }
  .lchip:not(.on) { opacity: .5; } .lchip:not(.on) i { background: transparent; box-shadow: inset 0 0 0 1.5px var(--c); }
  .lchip.on { color: var(--primary-text-color); }
  .lkey { display: inline-flex; align-items: center; gap: 6px; }
  .lkey i.u { background: repeating-linear-gradient(135deg, var(--al-alarm) 0 3px, transparent 3px 6px); }
  .lkey i.arm { background: color-mix(in srgb, var(--al-away) 22%, transparent); }
  .lkey i.mk { width: 0; height: 12px; border-left: 2px dotted var(--al-wait); background: none; border-radius: 0; }
  .tip { position: absolute; z-index: 30; pointer-events: none; min-width: 180px; max-width: 260px; padding: 10px 12px; border-radius: 12px; background: var(--card-background-color, #fff);
         color: var(--primary-text-color); box-shadow: 0 8px 28px rgba(0,0,0,.22); border: 1px solid var(--divider-color); font-size: 12px; line-height: 1.45; }
  .tip b { display: flex; align-items: center; gap: 6px; font-size: 13px; } .tip b i { width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
  .tip .m { color: var(--secondary-text-color); }
  @container al-panel (max-width: 600px) {
    .tl-row, .tl-axis { grid-template-columns: minmax(0, 1fr); gap: 6px; padding: 8px 0; }
    .tl-axis > div:first-child { display: none; }
    .tl-axis span.minor { display: none; }
    .sums { grid-template-columns: 1fr 1fr; } .sum { padding: 10px; } .sum .ti { display: none; }
  }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;

if (!customElements.get("alarm-card-panel")) customElements.define("alarm-card-panel", AlarmCardPanel);
console.info(`%c ALARM-PANEL %c v${PANEL_VERSION} `, "color: white; background: #e5484d; font-weight: 700;", "color: #e5484d; background: white; font-weight: 700;");
