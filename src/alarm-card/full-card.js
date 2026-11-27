// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------
import { ICONS } from "./header.js";
import { BUTTON_ACTIONS, BUTTON_RUNS, SCENE_STYLE, SENSOR_KIND, STRUT, activityEntries, ago, esc, firstPanel, hour12Of, intlLang, normalize, parseTime, shield, stateClass, svgIcon } from "./helpers.js";
import { BASE_STYLE, textColor } from "./styles.js";
import { AlarmBase } from "./base.js";

export const FULL_STYLE = `
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  ha-card { container: al-card / inline-size; }
  .strut > i { width: 40px; }
  .header .titles { flex: 1 1 0; min-width: 64px; }
  /* The status pill right after the title, its whole label on one line, while the title stays whole beside it
     (measured by the card, see _fitPill); otherwise on its own line under a one-line subtitle, and with its dot alone
     when even that does not fit the header. */
  .tline { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .tline > .name { flex: 0 1 auto; min-width: 0; }
  .tline > .chip { flex: none; max-width: none; }
  .tline > .chip .chip-text { white-space: nowrap; overflow: visible; }
  .header .titles.below { display: grid; grid-template-columns: minmax(0, 1fr); align-content: center; }
  .header .titles.below > .tline { display: contents; }
  .header .titles.below > .tline > .chip { order: 3; justify-self: start; align-self: start; margin-top: 3px; }
  .header .titles.below > .sub { order: 2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header .titles.dot-only > .tline { display: flex; }
  .header .titles.dot-only > .tline > .chip { order: 0; margin-top: 0; align-self: center; padding: 4px; }
  .header .titles.dot-only > .tline > .chip .chip-text { display: none; }
  /* Phone width (6 columns of a Sections view, up to 200 px): the hero below already names the state, the chip
     keeps only its dot (the text stays in its title and aria-label). */
  @container al-card (max-width: 200px) { .header .chip { padding: 4px 6px; } .header .chip .chip-text { display: none; } }
  /* Narrow card with the zoomed mini card's detail button in the header (up to 280 px): the logo gives its room
     to the title and the chip, so that the button stays in the card and the chip's label stays whole (the
     shield below already shows the state). */
  @container (max-width: 280px) { .header.has-zoom > .badge { display: none; } }
  .hero { display: flex; align-items: center; gap: 14px; }
  .hero .shield { width: 72px; height: 72px; }
  .hero .shield .icon { width: 40px; height: 40px; }
  /* Phone width: the state gets the card's whole width under a smaller shield, so that it is never cut. */
  @container (max-width: 220px) {
    .hero { flex-direction: column; align-items: flex-start; gap: 8px; }
    .hero .info { width: 100%; }
    .hero .shield { width: 52px; height: 52px; }
    .hero .shield .icon { width: 30px; height: 30px; }
    .state { overflow-wrap: anywhere; }
  }
  .state { font-size: 22px; font-weight: 400; line-height: 1.2; color: ${textColor("var(--c)")}; }
  .modes { display: flex; flex-wrap: wrap; gap: 6px; }
  .modes .btn { flex: 1 1 auto; }
  .section-title { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title .chip { text-transform: none; letter-spacing: 0; }
  .section-title.toggle { cursor: pointer; user-select: none; }
  .section-title.toggle[aria-expanded="false"] { margin-bottom: 0; }
  .section-title .chevron { margin-left: auto; width: 16px; height: 16px; transition: transform .2s ease; }
  .section-title.toggle[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
  @media (prefers-reduced-motion: reduce) { .section-title .chevron { transition: none; } }
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(140px, 100%), 1fr)); gap: 6px; }
  .cams { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr)); gap: 6px; }
  .cam { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 16 / 9; background: var(--secondary-background-color); }
  .cam img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cam .nocam { display: grid; place-items: center; height: 100%; color: var(--secondary-text-color); }
  .cam-name { position: absolute; left: 6px; bottom: 6px; padding: 2px 8px; border-radius: 999px; font-size: 11px;
              background: rgba(0, 0, 0, 0.55); color: #fff; max-width: calc(100% - 12px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tile { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .icon { width: 20px; height: 20px; color: var(--c, var(--secondary-text-color)); }
  .tile .tx { min-width: 0; display: flex; flex-direction: column; }
  .tile .k { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile .v { font-size: 11px; color: ${textColor("var(--c, var(--secondary-text-color))")}; white-space: nowrap; }
  /* Calm tiles: an open sensor reads from its tinted icon and state line, the tile background stays neutral. */
  .tile.on { background: var(--secondary-background-color, transparent); }
  .tile.btn { padding: 4px 10px 4px 4px; }
  .tile.btn .tx { flex: 1 1 auto; }
  .btn-act { flex: none; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: none; border-radius: 50%; cursor: pointer;
             color: inherit; background: color-mix(in srgb, var(--c, var(--secondary-text-color)) 16%, transparent); }
  .btn-act:hover { background: color-mix(in srgb, var(--c, var(--secondary-text-color)) 26%, transparent); }
  .btn-act:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  .btn-act[disabled] { cursor: default; opacity: .5; }
  .btn-act .icon { width: 18px; height: 18px; }
  .acts { display: flex; flex-direction: column; gap: 6px; }
  .act { display: flex; flex-wrap: wrap; align-items: center; column-gap: 8px; row-gap: 2px; font-size: 13px; min-width: 0; }
  .act-state { color: ${textColor("var(--c)")}; font-weight: 500; min-width: 0; overflow-wrap: anywhere; }
  .act-by { flex: 1 1 auto; min-width: 0; color: var(--secondary-text-color); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .act-time { margin-left: auto; flex: none; color: var(--secondary-text-color); font-size: 12px; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .act-empty { font-size: 12px; color: var(--secondary-text-color); }
`;

export class AlarmCard extends AlarmBase {
  static getConfigElement() {
    return document.createElement("alarm-card-editor");
  }

  static getStubConfig(hass) {
    const id = firstPanel(hass);
    return id ? { entity: id } : {};
  }

  getCardSize() {
    // HA may ask before setConfig: no config yet, answer the bare card's size.
    return this._config
      ? 5 + Math.ceil(this._sensors().length / 2) + Math.ceil(this._buttons().length / 2) + (this._config.show_activity === true ? 2 : 0)
      : 5;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _render() {
    const { st, error } = this._panelOrError();
    if (error) return error;
    const c = this._config;
    const parts = [this._hero(st)];
    if (c.show_controls !== false) parts.push(`<div class="modes">${this._modeButtons(st)}</div>`, this._padHtml(st));
    if (c.show_sensors !== false) parts.push(this._sensorSection());
    parts.push(this._buttonSection());
    parts.push(this._cameraSection(st));
    if (c.show_activity === true) parts.push(this._activitySection(st));
    const pic = this._illustrated();
    return `<style>${BASE_STYLE}${FULL_STYLE}${pic ? SCENE_STYLE : ""}</style>${STRUT}
      <ha-card>
        ${pic ? this._banner(st, this._subtitle(st), c.show_logo !== false) : this._header(st)}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  _hero(st) {
    const cls = stateClass(st.state);
    const lines = [this._lines(st, true)];
    if (this._config.show_info !== false) {
      const last = parseTime(st.attributes?.last_triggered);
      if (Number.isFinite(last))
        lines.push(`<div class="line">${svgIcon(ICONS.history)}<span>${esc(this._t("last_triggered", { when: ago(intlLang(this._hass, this._config), last) }))}</span></div>`);
      else if ("last_triggered" in (st.attributes || {})) lines.push(`<div class="line">${svgIcon(ICONS.history)}<span>${esc(this._t("never_triggered"))}</span></div>`);
    }
    // Illustrated header: the shield and the state are in the banner, only the lines stay here.
    if (this._illustrated()) {
      const html = lines.join("");
      return html ? `<div class="hero ${cls}"><div class="info">${html}</div></div>` : "";
    }
    return `<div class="hero ${cls}">
      <div class="clickable" role="button" tabindex="0" data-entity="${esc(st.entity_id)}">${shield(st.state, this._uid)}</div>
      <div class="info">
        <div class="state">${esc(this._stateText(st))}</div>
        ${lines.join("")}
      </div>
    </div>`;
  }

  _isCollapsed(key) {
    const def = this._config.collapsed === true;
    return this._toggled.has(key) ? !def : def;
  }

  _sensorSection() {
    const items = this._sensors();
    if (!items.length) return "";
    const tiles = items.map((item) => {
      const s = this._hass.states[item.entity];
      const [group, offIcon, onIcon] = SENSOR_KIND[s?.attributes?.device_class] || ["problem", ICONS.sensor, ICONS.sensor];
      const on = s?.state === "on";
      const unavailable = !s || /^(unavailable|unknown)$/.test(s.state);
      const value = unavailable
        ? this._stateText(s || { state: "unavailable" })
        : this._t(group === "opening" ? (on ? "open" : "closed") : group === "motion" ? (on ? "detected" : "clear_state") : on ? "alert" : "ok_state");
      const cls = unavailable ? "idle" : on ? (group === "motion" ? "home" : "away") : "off";
      return `<div class="tile clickable ${cls} ${on ? "on" : ""}" role="button" tabindex="0" data-key="${esc(item.entity)}" data-entity="${esc(item.entity)}">
        ${svgIcon(on ? onIcon : offIcon)}<div class="tx"><span class="k">${esc(this._sensorName(item.entity))}</span><span class="v">${esc(value)}</span></div>
      </div>`;
    });
    const open = this._openSensors().length;
    const closed = this._isCollapsed("sensors");
    return `<div>
      <div class="section-title toggle" role="button" tabindex="0" data-action="toggle_section" data-section="sensors" aria-expanded="${!closed}">${svgIcon(ICONS.door)}${esc(this._t("sensors"))}
        <span class="chip ${open ? "away" : "off"}">${esc(open ? this._t("n_open", { n: open }) : this._t("all_closed"))}</span>${svgIcon(ICONS.chevron_down, "chevron")}</div>
      ${closed ? "" : `<div class="tiles">${tiles.join("")}</div>`}
    </div>`;
  }

  // ----- Buttons ----------------------------------------------------------------

  _buttons() {
    return normalize(this._config.buttons).filter((b) => BUTTON_ACTIONS[String(b.entity).split(".")[0]]);
  }

  // Switches, lights and the like show their state and toggle; buttons, scripts and scenes run. The icon's
  // tap acts, the name opens the entity's dialog (its history, its settings).
  _buttonSection() {
    const items = this._buttons();
    if (!items.length) return "";
    const tiles = items.map((item) => {
      const s = this._hass.states[item.entity];
      const domain = item.entity.split(".")[0];
      const runs = BUTTON_RUNS.has(domain);
      const on = !runs && s?.state === "on";
      // A scene or a button is "unknown" until first used: only unavailable stops it
      const unavailable = !s || s.state === "unavailable" || (!runs && s.state === "unknown");
      const value = unavailable ? this._stateText(s || { state: "unavailable" }) : this._t(runs ? "run" : on ? "on_state" : "off_state");
      const icon = runs ? ICONS.play : domain === "light" ? ICONS.bulb : ICONS.power;
      const name = item.name || s?.attributes?.friendly_name || item.entity;
      return `<div class="tile btn ${unavailable ? "idle" : runs ? "home" : on ? "home on" : "idle"}" data-key="${esc(item.entity)}">
        <button class="btn-act" data-action="button" data-entity="${esc(item.entity)}" aria-label="${esc(`${name}: ${value}`)}"${unavailable ? " disabled" : ""}>${svgIcon(icon)}</button>
        <div class="tx clickable" role="button" tabindex="0" data-entity="${esc(item.entity)}"><span class="k">${esc(name)}</span><span class="v">${esc(value)}</span></div>
      </div>`;
    });
    // Open by default (`collapsed` folds the sensors only); its title folds it
    const closed = this._toggled.has("buttons");
    return `<div>
      <div class="section-title toggle" role="button" tabindex="0" data-action="toggle_section" data-section="buttons" aria-expanded="${!closed}">${svgIcon(ICONS.power)}${esc(this._t("buttons"))}${svgIcon(ICONS.chevron_down, "chevron")}</div>
      ${closed ? "" : `<div class="tiles">${tiles.join("")}</div>`}
    </div>`;
  }

  _pressButton(entity) {
    const action = BUTTON_ACTIONS[String(entity).split(".")[0]];
    if (action) this._call(action[0], action[1], { entity_id: entity });
  }

  // ----- Cameras ----------------------------------------------------------------

  _cameraItems() {
    return normalize(this._config.cameras).filter((c) => typeof c.entity === "string" && c.entity.startsWith("camera."));
  }

  _cameras() {
    return this._cameraItems().map((c) => c.entity);
  }

  // The cameras' latest snapshots (their entity picture, which carries its access token), while the alarm is
  // triggered or counting down to it (`cameras_on_alarm`, by default), else always. A tap opens the camera.
  _cameraSection(st) {
    const items = this._cameraItems();
    if (!items.length) return "";
    if (this._config.cameras_on_alarm !== false && !["triggered", "pending"].includes(st.state)) return "";
    const tiles = items.map(({ entity: id, name: label }) => {
      const cam = this._hass.states[id];
      const pic = cam?.attributes?.entity_picture;
      const name = label || cam?.attributes?.friendly_name || id;
      const img = pic && cam.state !== "unavailable" ? `<img src="${esc(pic)}" alt="${esc(name)}" loading="lazy">` : `<div class="nocam">${svgIcon(ICONS.cctv)}</div>`;
      return `<div class="cam clickable" role="button" tabindex="0" data-entity="${esc(id)}" title="${esc(name)}">${img}<span class="cam-name">${esc(name)}</span></div>`;
    });
    return `<div>
      <div class="section-title">${svgIcon(ICONS.cctv)}${esc(this._t("cameras"))}</div>
      <div class="cams">${tiles.join("")}</div>
    </div>`;
  }

  // ----- Activity (logbook) --------------------------------------------------

  _activityHours() {
    return Math.min(168, Math.max(1, Number(this._config.activity_hours) || 24));
  }

  // The panel's changes over the period, fetched again when its state changes, the period changes, and every
  // 10 minutes (the window slides). A late answer for an older request is dropped.
  _fetchActivity(st) {
    const hours = this._activityHours();
    const key = `${st.entity_id}|${st.last_changed}|${hours}|${Math.floor(Date.now() / 600000)}`;
    if (key === this._activityKey || !this._hass.callWS) return;
    this._activityKey = key;
    const entity = st.entity_id;
    const start_time = new Date(Date.now() - hours * 3600000).toISOString();
    Promise.resolve(this._hass.callWS({ type: "logbook/get_events", start_time, entity_ids: [entity] }))
      .then((list) => {
        if (this._activityKey !== key) return;
        this._activity = { entity, list: Array.isArray(list) ? list : [] };
        this._update();
        this._fetchUsers();
      })
      .catch(() => {});
  }

  // Users with no person entity: names from Home Assistant's user list, which only administrators may read.
  _fetchUsers() {
    if (this._users || !this._hass.user?.is_admin || !this._hass.callWS) return;
    if (!(this._activity?.list || []).some((e) => e.context_user_id && !this._userName(e.context_user_id))) return;
    this._users = {};
    Promise.resolve(this._hass.callWS({ type: "config/auth/list" }))
      .then((users) => {
        this._users = Object.fromEntries((Array.isArray(users) ? users : []).map((u) => [u.id, u.name]));
        this._update();
      })
      .catch(() => {});
  }

  // Who made a change: the person linked to the user, the user itself, else nothing.
  _userName(uid) {
    if (!uid) return "";
    const states = this._hass.states;
    const person = Object.keys(states).find((id) => id.startsWith("person.") && states[id].attributes?.user_id === uid);
    if (person) return states[person].attributes.friendly_name || person;
    if (this._hass.user?.id === uid) return this._hass.user.name || "";
    return this._users?.[uid] || "";
  }

  // When, as "3 hours ago" (like the last trigger), with the date and time in the tooltip (12 / 24 h clock as in
  // the user's profile).
  _activityTime(sec) {
    const l = intlLang(this._hass, this._config);
    const ms = sec * 1000;
    const hour12 = hour12Of(this._hass);
    const abs = new Intl.DateTimeFormat(l, { dateStyle: "medium", timeStyle: "short", ...(hour12 === undefined ? {} : { hour12 }) }).format(new Date(ms));
    return `<span class="act-time" title="${esc(abs)}">${esc(ago(l, ms))}</span>`;
  }

  _activitySection(st) {
    this._fetchActivity(st);
    const hours = this._activityHours();
    const list = this._activity?.entity === st.entity_id ? [...this._activity.list] : [];
    // The logbook may not have the change that just happened yet: the panel's own state stands in for it.
    const when = Date.parse(st.last_changed) / 1000;
    if (Number.isFinite(when) && when * 1000 >= Date.now() - hours * 3600000 && !list.some((e) => e.state === st.state && Math.abs(e.when - when) < 5))
      list.push({ when, state: st.state, context_user_id: st.context?.user_id });
    const count = Math.min(50, Math.max(1, Math.round(Number(this._config.activity_count) || 5)));
    const rows = activityEntries(list, count).map((e) => {
      const by = this._userName(e.context_user_id) || e.context_name || "";
      return `<div class="act ${stateClass(e.state)}" data-key="act-${esc(e.when)}"><span class="dot"></span><span class="act-state">${esc(this._stateText({ state: e.state }))}</span>${
        by ? `<span class="act-by">${esc(this._t("by", { name: by }))}</span>` : ""
      }${this._activityTime(Number(e.when))}</div>`;
    });
    return `<div>
      <div class="section-title">${svgIcon(ICONS.history)}${esc(this._t("activity"))}</div>
      ${rows.length ? `<div class="acts">${rows.join("")}</div>` : `<div class="act-empty">${esc(this._t("no_activity"))}</div>`}
    </div>`;
  }
}
