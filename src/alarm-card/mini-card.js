// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------
import { ICONS } from "./header.js";
import { SCENE_STYLE, STRUT, entityList, esc, fmtCountdown, fmtDuration, logo, remaining, shield, stateClass, svgIcon } from "./helpers.js";
import { BASE_STYLE, isOutside, textColor, watchOutside } from "./styles.js";
import { AlarmCard } from "./full-card.js";

export const MINI_STYLE = `
  /* One row when it fits; else the buttons (with the detail button) wrap under the title, right-aligned, and
     wrap again if even that row is too narrow (narrow cards: see the container query below). The title never
     drops under a few characters, the round buttons never shrink, and nothing leaves the card (ha-card clips
     its overflow). */
  .header { padding: 12px; flex-wrap: wrap; row-gap: 8px; }
  .header.with-pad { padding-bottom: 0; }
  .header .titles { margin-block: -2px; flex: 1 1 0; min-width: 64px; }
  .actions { display: flex; align-items: center; gap: 10px; margin-left: auto; flex: 0 1 auto; min-width: 0; max-width: 100%; }
  /* The state shield (the default compact-mini icon) is shown a bit larger, like the picture on the other ha-*
     mini cards; the logo badge (show_logo: true) keeps the 40 px header size. */
  .header .shield { width: 50px; height: 50px; }
  .header .shield .icon { width: 24px; height: 24px; }
  /* The state wraps (the line itself ends in an ellipsis for the time or the sensor after it): never cut at
     phone width (6 columns, ~156-178 px) in long languages ("Uzbrojony (poza domem)", "Aktiviran u odsustvu"). */
  .sub .st { color: ${textColor("var(--c)")}; font-weight: 500; white-space: normal; overflow-wrap: anywhere; }
  .sub .dot { margin-right: 4px; vertical-align: 1px; }
  .controls { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; min-width: 0; }
  .controls .btn.round { width: 32px; height: 32px; flex: none; }
  .controls .btn .icon { width: 16px; height: 16px; }
  /* Default size (6 columns, ~240 px) and narrower: always two rows, the detail button on the name's row and
     the buttons on their own full row, closer together so that every mode (6 buttons) fits on it. */
  ha-card { container: al-card / inline-size; }
  .strut > i { width: 36px; }
  @container (max-width: 300px) {
    .actions { display: contents; }
    .zoom { order: 1; }
    .controls { order: 2; flex: 1 1 100%; gap: 4px; }
  }
  .pad-wrap { padding: 8px 12px 12px; }
  /* Illustrated header: the round arm / disarm buttons in a column under the detail button, 24 px frosted discs like
     it (columns of two, added to the left); the shield, the radar and the text make room. */
  ha-card .banner .zoom { top: 4px; }
  ha-card .banner .mini-modes { position: absolute; z-index: 3; top: 31px; right: 5px; height: 51px; width: auto; display: flex; flex-direction: column;
                        flex-wrap: wrap-reverse; align-content: flex-start; justify-content: flex-start; gap: 3px 4px; }
  ha-card .banner .mini-modes .btn.round { width: 24px; height: 24px; flex: none; background: rgba(255,255,255,.55);
                                   box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
  ha-card .banner.dark .mini-modes .btn.round { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  ha-card .banner .mini-modes .btn.round:hover { background: rgba(255,255,255,.75); } ha-card .banner.dark .mini-modes .btn.round:hover { background: rgba(255,255,255,.22); }
  ha-card .banner .mini-modes .btn.round.alarm { background: color-mix(in srgb, var(--al-alarm) 22%, rgba(255,255,255,.6)); }
  ha-card .banner .mini-modes .btn .icon { width: 14px; height: 14px; }
  ha-card .banner.has-modes { --al-x: 14px; } ha-card .banner.has-modes.cols-2 { --al-x: 42px; } ha-card .banner.has-modes.cols-3 { --al-x: 70px; }
  ha-card .banner.has-modes { --al-scene-w: min(190px - var(--al-x), 100cqw - 228px - var(--al-x)); }
  ha-card .banner.has-modes .al-shield { right: calc(20px + var(--al-x)); }
  ha-card .banner.has-modes .al-scene { width: calc(var(--al-scene-w) + 30px + var(--al-x)); }
  ha-card .banner.has-modes .al-scene svg { right: calc(16px + var(--al-x)); }
  ha-card .banner.has-modes .htext { right: calc(var(--al-scene-w) + 30px + var(--al-x)); }
  ha-card .banner.alarm.has-modes::before { background: radial-gradient(circle at calc(100% - 56px - var(--al-x)) 40px, color-mix(in srgb, var(--c) 35%, transparent), transparent 70%); }
  /* The radar narrows by the buttons' width (the text keeps its room): what would come too close to the text is left out. */
  ha-card .banner.has-modes:is(.cols-2, .cols-3) :is(.al-cam, .al-rec), ha-card .banner.has-modes.cols-3 :is(.al-node-window, .al-link-window) { display: none; }
  @container al-card (max-width: 415px) { ha-card .banner.has-modes.cols-1 :is(.al-cam, .al-rec) { display: none; } }
  @container al-card (max-width: 388px) { ha-card .banner.has-modes.cols-1 :is(.al-node-window, .al-link-window) { display: none; } }
  @container al-card (max-width: 354px) { ha-card .banner.has-modes.cols-1 :is(.al-node-motion, .al-link-motion) { display: none; } }
  @container al-card (max-width: 346px) { ha-card .banner.has-modes.cols-1 :is(.al-node-door, .al-link-door) { display: none; } }
  @container al-card (max-width: 314px) { ha-card .banner.has-modes.cols-1 :is(.al-node-siren, .al-link-siren) { display: none; } }
  @container al-card (max-width: 416px) { ha-card .banner.has-modes.cols-2 :is(.al-node-window, .al-link-window) { display: none; } }
  @container al-card (max-width: 382px) { ha-card .banner.has-modes.cols-2 :is(.al-node-motion, .al-link-motion) { display: none; } }
  @container al-card (max-width: 374px) { ha-card .banner.has-modes.cols-2 :is(.al-node-door, .al-link-door) { display: none; } }
  @container al-card (max-width: 342px) { ha-card .banner.has-modes.cols-2 :is(.al-node-siren, .al-link-siren) { display: none; } }
  @container al-card (max-width: 410px) { ha-card .banner.has-modes.cols-3 :is(.al-node-motion, .al-link-motion) { display: none; } }
  @container al-card (max-width: 402px) { ha-card .banner.has-modes.cols-3 :is(.al-node-door, .al-link-door) { display: none; } }
  @container al-card (max-width: 370px) { ha-card .banner.has-modes.cols-3 :is(.al-node-siren, .al-link-siren) { display: none; } }
  /* Phone width with more than two buttons: they go back to a row under the banner, which keeps the title its room. */
  .mini-row { display: none; padding: 8px 12px; }
  .mini-row .controls { flex: 1 1 auto; justify-content: flex-end; }
  .mini-row + .pad-wrap { padding-top: 0; }
  @container al-card (max-width: 300px) {
    .mini-row:is(.cols-2, .cols-3) { display: flex; }
    ha-card .banner.has-modes:is(.cols-2, .cols-3) { --al-x: 0px; }
    ha-card .banner.has-modes:is(.cols-2, .cols-3) .mini-modes { display: none; }
  }
  @container (max-width: 300px) { ha-card .banner.has-modes .htext { right: calc(98px + var(--al-x)); } }
  @container (max-width: 230px) { ha-card .banner.has-modes .htext { right: calc(36px + var(--al-x) - 14px); } }
  ha-card .banner.has-modes:not(.has-zoom) .mini-modes { top: 4px; }
`;

// The mini card is a full card drawn compact: its detail button (top right, `zoom: false` removes it) switches
// it to the full card's content and back, and a click anywhere else on the page brings the compact view back.
export class AlarmMiniCard extends AlarmCard {
  constructor() {
    super();
    this._zoomed = false;
    this._unzoom = watchOutside(
      (ev) => isOutside(this, ev),
      () => {
        if (this._zoomed) this._setZoom(false);
      },
    );
  }

  static getConfigElement() {
    return document.createElement("alarm-mini-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    this._unzoom.on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unzoom.off();
    // Back to the compact view once off the screen (see the full card).
    this._zoomed = false;
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 };
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _setZoom(on) {
    this._zoomed = on;
    this._update();
  }

  // From the keyboard (Enter / Space: no click count), the focus stays on the button.
  _toggleZoom(ev) {
    this._setZoom(!this._zoomed);
    if (ev.detail === 0) this.shadowRoot.querySelector?.(".zoom")?.focus({ preventScroll: true });
  }

  // Compact view: a single row, the state in color under the name (with the countdown, or the open sensor
  // when the alarm goes off), the round arm / disarm buttons and the detail button.
  _render() {
    if (this._zoomed) return super._render();
    const { st, error } = this._panelOrError();
    if (error) return error;
    const c = this._config;
    const cls = stateClass(st.state);
    if (this._illustrated()) {
      // The round arm / disarm buttons stand in columns of two under the detail button, added to the left.
      const html = c.show_controls !== false ? this._modeButtons(st, true) : "";
      const count = (html.match(/<button /g) || []).length;
      const side = count ? { html, cols: Math.min(3, Math.ceil(count / 2)) } : null;
      return `<style>${BASE_STYLE}${MINI_STYLE}${SCENE_STYLE}</style>${STRUT}
      <ha-card>
        ${this._banner(st, this._miniDetail(st).replace(/^ · /, ""), c.show_logo !== false, side)}
        ${side && side.cols > 1 ? `<div class="mini-row cols-${side.cols}"><div class="controls">${html}</div></div>` : ""}
        ${this._pad ? `<div class="pad-wrap">${this._padHtml(st)}</div>` : ""}
      </ha-card>`;
    }
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>${STRUT}
      <ha-card>
        <div class="header${this._pad ? " with-pad" : ""}">
          ${c.show_logo === true ? logo(this._t("title")) : `<div class="clickable" role="button" tabindex="0" data-entity="${esc(st.entity_id)}">${shield(st.state, this._uid)}</div>`}
          <div class="titles">
            <div class="name">${esc(c.title || st.attributes?.friendly_name || this._t("title"))}</div>
            <div class="sub clickable" role="button" tabindex="0" data-entity="${esc(st.entity_id)}"><span class="st ${cls}"><span class="dot"></span>${esc(
              this._stateText(st)
            )}</span>${esc(this._miniDetail(st))}</div>
          </div>
          ${this._miniActions(st)}
        </div>
        ${this._pad ? `<div class="pad-wrap">${this._padHtml(st)}</div>` : ""}
      </ha-card>`;
  }

  // The round arm / disarm buttons and the detail button, kept together when they wrap under the title.
  _miniActions(st) {
    const controls = this._config.show_controls !== false ? `<div class="controls">${this._modeButtons(st, true)}</div>` : "";
    const zoom = this._zoomButton();
    return controls || zoom ? `<div class="actions">${controls}${zoom}</div>` : "";
  }

  // What follows the state: " · 30 s" during a delay, " · Kitchen window" for the open sensor while the
  // alarm goes off, else " · for 27 min".
  _miniDetail(st) {
    const rem = remaining(st);
    if (rem) return ` · ${fmtCountdown(rem.left)}`;
    const open = entityList(st.attributes?.open_sensors);
    if (open.length && /^(triggered|pending)$/.test(st.state)) return ` · ${open.map((id) => this._sensorName(id)).join(", ")}`;
    const since = (Date.now() - Date.parse(st.last_changed)) / 1000;
    if (!Number.isFinite(since)) return "";
    return ` · ${since < 60 ? this._t("just_now") : this._t("since", { d: fmtDuration(since, (k) => this._t(k)) })}`;
  }
}
