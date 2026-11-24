// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------
import { ICONS } from "./header.js";
import { MODE_ICON } from "./core.js";
import { FAILED_ARM_MS, STATE_ICON, alarmRadar, claimFailure, entityList, esc, failedMode, firstPanel, fmtCountdown, fmtDuration, isNight, lang, logo, morph, normalize, remaining, sameSig, shield, stateClass, supportedModes, svgIcon, t, textWidth } from "./helpers.js";
import { BASE_STYLE, CONFIRM_GUARD_MS, DIALOG_STYLE, PAD_ACTIONS, isOutside, watchOutside } from "./styles.js";
import { STRINGS } from "./i18n/strings.js";

// Each card instance numbers its SVG ids, so that several cards never share one.
export let cardUid = 0;

export class AlarmBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._uid = ++cardUid;
    this._html = "";
    this._toggled = new Set();
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    this.shadowRoot.addEventListener("pointerdown", () => {
      // No update of the card between the press and the release: the patch keeps the nodes in place, but an element
      // appearing in front of the one pressed (a chip, a row) shifts its siblings, so that the element under the
      // pointer can change and the click land elsewhere or nowhere. The pending render is done once released (after
      // the click).
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click (same task): a press with no click (released elsewhere) draws what it held back.
      setTimeout(() => {
        this._pressing = false;
        if (this._dirty) this._update();
      }, 0);
    };
    this.shadowRoot.addEventListener("input", (ev) => {
      if (ev.target?.dataset?.action === "code_input") {
        this._code = ev.target.value;
        this._update();
      }
    });
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if (ev.target?.dataset?.action === "code_input" && ev.key === "Enter") {
        ev.preventDefault();
        this._submitCode();
      } else if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
    // Escape closes the popup or the code pad (as Cancel), listened on the window while one is open.
    this._onKey = (ev) => {
      if (ev.key !== "Escape") return this._padKey(ev);
      if (!this._confirm && !this._pad) return;
      ev.stopPropagation();
      if (this._confirm) this._closeConfirm();
      else this._closePad();
    };
    // A click elsewhere on the page closes the popup and the pad, and folds the sections back.
    this._outside = watchOutside(
      (ev) => isOutside(this, ev),
      () => {
        if (!this._confirm && !this._pad && !this._toggled.size) return;
        this._resetUnfolded();
        this._update();
      },
    );
  }

  // Popup and pad closed, sections folded back to their defaults (a click elsewhere, or the card left the page).
  _resetUnfolded() {
    this._confirm = null;
    this._pad = null;
    this._code = "";
    this._toggled = new Set();
    window.removeEventListener("keydown", this._onKey);
  }

  // Durations move with the clock: a render check every second while a delay counts down (the signature
  // changes on the second), every minute otherwise (it only changes on the minute).
  connectedCallback() {
    this._startClock();
    this._outside.on();
    // A new width (or the web font loaded): the status pill is fitted again, in the next frame.
    if (typeof ResizeObserver === "function") {
      this._resize ??= new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._fitWidth) return;
        this._fitWidth = w;
        cancelAnimationFrame(this._fitFrame);
        this._fitFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._resize.observe(this);
    }
    document.fonts?.ready?.then(() => this._fitPill());
    if (this._confirm || this._pad) window.addEventListener("keydown", this._onKey);
    // Back on the page after leaving it: rendered again in its default state (and the Alarmo subscription resumed).
    if (this._hass && this._config) this._update();
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._resize?.disconnect();
    this._fitWidth = null;
    this._timer = null;
    this._timerPeriod = null;
    this._outside.off();
    this._pressing = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded or with its popup or pad open.
    this._resetUnfolded();
    this._unsubAlarmo();
    this._lastArm = null;
  }

  // Alarmo refuses to arm with a sensor open and fires `alarmo_failed_to_arm` instead: the card listens to it
  // while it shows an Alarmo panel. Home Assistant lets only administrators subscribe to that event: for
  // other users the subscription fails, quietly, and is not retried.
  _syncAlarmoSub() {
    const want = this.isConnected && this._hass?.connection?.subscribeEvents && this._isAlarmo() ? this._entityId() : null;
    if (want === this._subFor) return;
    this._unsubAlarmo();
    if (!want) return;
    this._subFor = want;
    this._sub = Promise.resolve(this._hass.connection.subscribeEvents((ev) => this._onFailedToArm(ev), "alarmo_failed_to_arm")).catch(() => null);
  }

  _unsubAlarmo() {
    const sub = this._sub;
    this._sub = null;
    this._subFor = null;
    sub?.then((unsub) => unsub?.()).catch(() => {});
  }

  // The panel this card shows failed to arm because of open sensors: popup at the top of the card listing
  // them, with "Arm anyway" re-arming through `alarmo.arm` with `force: true`. Shown when the event names this
  // panel (to the user who tried to arm, when it says who), or, from an Alarmo that leaves the panel out of
  // the event, when this card has just sent the arming.
  _onFailedToArm(ev) {
    const d = ev?.data || {};
    if (d.reason && d.reason !== "open_sensors") return;
    const open = entityList(d.sensors ?? d.open_sensors);
    if (!open.length || !this._hass || !this._config) return;
    const mine = !!this._lastArm && Date.now() - this._lastArm.at < FAILED_ARM_MS;
    if (d.entity_id ? d.entity_id !== this._entityId() : !mine) return;
    const uid = ev.context?.user_id;
    if (!mine && uid && this._hass.user?.id && uid !== this._hass.user.id) return;
    const mode = failedMode(d) || (mine ? this._lastArm.mode : null);
    if (!mode) return;
    const code = mine && this._lastArm.mode === mode ? this._lastArm.code : undefined;
    const failKey = ev.time_fired;
    if (failKey && !claimFailure(failKey, this, mine)) return;
    this._lastArm = null;
    this._openConfirm({
      failKey,
      text: this._t("open_confirm", { list: open.map((id) => this._sensorName(id)).join(", "), mode: this._label(mode) }),
      ok: this._t("arm_anyway"),
      cls: stateClass(`armed_${mode.slice(4)}`),
      run: () => (code ? this._send(mode, code, true) : this._withCode(mode, true)),
    });
  }

  // (Re)arm the render clock at the pace the current state needs. State changes themselves arrive through
  // `set hass`, which re-renders and brings the clock back here, so each pace switch follows the state.
  _startClock() {
    const period = this._hass && this._config && remaining(this._panel()) ? 1000 : 60000;
    if (this._timer && this._timerPeriod === period) return;
    clearInterval(this._timer);
    this._timerPeriod = period;
    this._timer = setInterval(() => {
      if (this._hass) this.hass = this._hass;
    }, period);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const sig = this._signature();
    if (sameSig(sig, this._sig)) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    if (config.sensors !== undefined && !Array.isArray(config.sensors)) throw new Error("sensors must be a list");
    this._config = { ...config };
    // show_title / show_subtitle: the header's name / subtitle, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._autoEntity = undefined;
    this._html = "";
    this._sig = null;
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _lang() {
    return lang(this._hass, this._config);
  }

  // A mode / action label inside a sentence: lowercase, except in German where it is quoted as is.
  _label(key) {
    const v = this._t(key);
    return this._lang() === "de" ? v : v.toLowerCase();
  }

  // Without a configured entity, the first alarm panel (alphabetically) is used; the scan of every state is
  // memoized, and redone only if the chosen entity disappears.
  _entityId() {
    if (this._config.entity) return this._config.entity;
    if (this._autoEntity && this._hass.states[this._autoEntity]) return this._autoEntity;
    this._autoEntity = firstPanel(this._hass);
    return this._autoEntity;
  }

  _panel() {
    const id = this._entityId();
    return id ? this._hass.states[id] : undefined;
  }

  _sensors() {
    return normalize(this._config.sensors);
  }

  // What the render depends on: language (and clock format), the panel, the sensors (configured, open and bypassed ones) and
  // the clock (second while a delay runs, minute otherwise).
  _signature() {
    const h = this._hass;
    const panel = this._panel();
    const now = Date.now();
    const sig = [h.language, h.locale?.language, h.locale?.time_format, h.entities, panel, remaining(panel) ? Math.floor(now / 1000) : Math.floor(now / 60000)];
    // The illustration's day / night picture.
    sig.push(h.themes?.darkMode);
    const a = panel?.attributes || {};
    for (const id of [...this._sensors().map((s) => s.entity), ...entityList(a.open_sensors), ...entityList(a.bypassed_sensors)]) sig.push(h.states[id]);
    for (const id of this._cameras()) sig.push(h.states[id]?.attributes?.entity_picture, h.states[id]?.state);
    for (const b of this._buttons()) sig.push(h.states[b.entity]);
    return sig;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    if (this.isConnected) this._startClock();
    this._syncAlarmoSub();
    // Not under a press (see the pointerdown listener): drawn once released.
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    this._sig = sig ?? this._signature();
    let html = this._render();
    if (this._confirm) html = html.replace(/<ha-card([^>]*)>([\s\S]*)<\/ha-card>\s*$/, (_, _attrs, inner) => `<ha-card class="dialog-open">${inner}${this._confirmHtml()}</ha-card>`);
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
    this._fitPill();
    this._fitConfirm();
  }

  // The header's status pill goes right after the title, on its row, only while the title stays whole and the
  // pill's whole label fits beside it; otherwise it takes a line of its own under the subtitle (.below), the title
  // whole on its row (cut only when it does not fit alone). There, in the banner, the subtitle keeps one line; if the
  // text still does not fit above the ground strip, the pill keeps its dot alone (.dot-only, its label in its tooltip
  // and for screen readers). Measured after each render and on each new width, whatever the language: no fixed
  // width threshold.
  _fitPill() {
    if (!this.isConnected) return;
    for (const t of this.shadowRoot?.querySelectorAll?.(".titles") || []) {
      const row = t.querySelector(".tline");
      const pills = row ? [...row.children].filter((n) => n.matches(".chip")) : [];
      if (!pills.length || !pills[0].getBoundingClientRect) continue;
      t.classList.remove("below", "dot-only");
      const name = row.querySelector(".name");
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const title = name && getComputedStyle(name).display !== "none" ? textWidth(name) + gap : 0;
      const need = pills.reduce((w, p) => w + p.getBoundingClientRect().width + gap, title - gap);
      if (need > t.getBoundingClientRect().width - 0.5) {
        t.classList.add("below");
        const banner = t.closest(".banner");
        if (banner) {
          const b = banner.getBoundingClientRect();
          // Each element as it shows: its box cut by its ancestors that hide their overflow (a clamped line).
          const out = [...t.querySelectorAll("*")].some((n) => {
            let { top, bottom } = n.getBoundingClientRect();
            for (let p = n.parentElement; p && p !== t; p = p.parentElement) {
              if (getComputedStyle(p).overflowY === "visible") continue;
              top = Math.max(top, p.getBoundingClientRect().top);
              bottom = Math.min(bottom, p.getBoundingClientRect().bottom);
            }
            return bottom - top > 0.5 && (top < b.top - 0.5 || bottom > b.bottom - 10 + 0.5);
          });
          if (out) t.classList.add("dot-only");
        }
      }
      // A subtitle cut by its ellipsis keeps its whole text in its tooltip.
      const s = t.querySelector(".sub");
      if (s && (!s.hasAttribute("title") || s.dataset.fit)) {
        const cut = s.scrollWidth > s.clientWidth + 1;
        s.toggleAttribute("data-fit", cut);
        if (cut) s.title = s.textContent.trim();
        else s.removeAttribute("title");
      }
    }
  }

  // The popup lies over the card: a small card (the mini card) grows to the popup's full height, so that a long
  // message (several open sensors) is read whole. 36 px: the backdrop's top padding and the popup's margin (see
  // DIALOG_STYLE).
  _fitConfirm() {
    const card = this._confirm && this.shadowRoot.querySelector?.("ha-card.dialog-open");
    const modal = card?.querySelector?.(".modal");
    const msg = modal?.querySelector?.(".msg");
    if (msg) card.style.minHeight = `${Math.ceil(modal.offsetHeight - msg.clientHeight + msg.scrollHeight) + 36}px`;
  }

  // ----- Actions -------------------------------------------------------------

  _onClick(ev) {
    this._pressing = false;
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!this._confirm && !PAD_ACTIONS.has(el?.dataset.action) && Date.now() - (this._confirmClosedAt ?? 0) < CONFIRM_GUARD_MS) {
      ev.stopPropagation();
      return;
    }
    // Popup open: only its buttons and the backdrop itself (outside the dialog) act.
    if (this._confirm) {
      ev.stopPropagation();
      const action = el?.dataset.action;
      if (action === "confirm_ok") {
        const { run } = this._confirm;
        this._closeConfirm();
        run();
      } else if (action === "confirm_cancel" || (action === "confirm_backdrop" && path[0] === el)) this._closeConfirm();
      return;
    }
    if (!el) return;
    ev.stopPropagation();
    const { action, entity, mode } = el.dataset;
    switch (action) {
      case "zoom":
        return this._toggleZoom?.(ev);
      case "mode":
        return this._request(mode);
      case "key":
        this._code = `${this._code || ""}${el.dataset.digit}`;
        return this._update();
      case "key_back":
        this._code = String(this._code || "").slice(0, -1);
        return this._update();
      case "pad_cancel":
        return this._closePad();
      case "pad_ok":
        return this._submitCode();
      case "code_input":
        return;
      case "button":
        return this._pressButton(entity);
      case "toggle_section": {
        const k = el.dataset.section;
        this._toggled = new Set(this._toggled);
        if (this._toggled.has(k)) this._toggled.delete(k);
        else this._toggled.add(k);
        return this._update();
      }
      default:
        if (entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
    }
  }

  // Service call whose failure (wrong code, open sensors…) is already shown by Home Assistant as a toast.
  _call(domain, service, data) {
    return Promise.resolve(this._hass.callService(domain, service, data)).catch(() => {});
  }

  _needsCode(mode) {
    const a = this._panel()?.attributes || {};
    if (!a.code_format) return false;
    return mode === "disarm" || a.code_arm_required !== false;
  }

  _isAlarmo() {
    return this._hass.entities?.[this._entityId()]?.platform === "alarmo";
  }

  // Configured sensors that are open (or detecting): they would make the arming fail or trigger the alarm.
  _openSensors() {
    return this._sensors()
      .map((s) => this._hass.states[s.entity])
      .filter((s) => s?.state === "on");
  }

  _sensorName(id) {
    const item = this._sensors().find((s) => s.entity === id);
    return item?.name || this._hass.states[id]?.attributes?.friendly_name || id;
  }

  // Mode button: disarm (with confirmation when asked), or arm (warning first when sensors are open), with
  // the code pad first when the panel needs a code.
  _request(mode) {
    if (mode === "disarm") {
      const go = () => this._withCode(mode);
      // Without a code, one tap would disarm: confirm by default (`confirm_disarm: false` turns it off). With
      // a code, the code entry already guards it: confirm only when asked. Cancelling an exit delay (arming)
      // is not a disarm of an armed panel: never asked.
      if (this._panel()?.state !== "arming" && (this._config.confirm_disarm ?? !this._needsCode(mode))) return this._openConfirm({ text: this._t("disarm_confirm"), ok: this._t("disarm"), cls: "off", run: go });
      return go();
    }
    const open = this._openSensors();
    if (open.length)
      return this._openConfirm({
        text: this._t("open_confirm", { list: open.map((s) => this._sensorName(s.entity_id)).join(", "), mode: this._label(mode) }),
        ok: this._t("arm_anyway"),
        cls: stateClass(`armed_${mode.slice(4)}`),
        run: () => this._withCode(mode, true),
      });
    return this._withCode(mode);
  }

  _withCode(mode, force = false) {
    if (!this._needsCode(mode)) return this._send(mode, undefined, force);
    this._pad = { mode, force, opener: this._opener() };
    this._code = "";
    window.addEventListener("keydown", this._onKey);
    this._update();
    // The field of a text code, else the number pad itself: the focus leaves the mode button, so that Enter
    // submits the code instead of clicking that button again.
    (this.shadowRoot.querySelector?.(".pad input") || this.shadowRoot.querySelector?.(".pad"))?.focus({ preventScroll: true });
    this._reveal(".pad");
  }

  // Physical keyboard on the number pad (it has no field to type in): digits, Backspace and Enter, as in
  // Home Assistant's own dialog. Keys typed in a field (elsewhere on the page, or the password field of a text
  // code), shortcuts, and Enter on a focused button (which clicks that button) are left alone.
  _padKey(ev) {
    if (!this._pad || this._confirm || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (this._panel()?.attributes?.code_format !== "number") return;
    const target = ev.composedPath?.()[0];
    const tag = target?.localName;
    if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
    if (/^[0-9]$/.test(ev.key)) this._code = `${this._code || ""}${ev.key}`;
    else if (ev.key === "Backspace") this._code = String(this._code || "").slice(0, -1);
    else if (ev.key === "Enter" && tag !== "button" && target?.getAttribute?.("role") !== "button") {
      ev.preventDefault();
      return this._submitCode();
    } else return;
    ev.preventDefault();
    this._update();
  }

  _submitCode() {
    if (!this._pad || !this._code) return;
    const { mode, force } = this._pad;
    const code = this._code;
    this._closePad();
    this._send(mode, code, force);
  }

  _closePad() {
    const opener = this._pad?.opener;
    this._pad = null;
    this._code = "";
    if (!this._confirm) window.removeEventListener("keydown", this._onKey);
    this._update();
    this._restoreFocus(opener);
  }

  // The element that had the focus when the popup or the pad opened (a mode button): it gets the focus back
  // when they close, found again by its data-key if the render replaced it.
  _opener() {
    const el = this.shadowRoot.activeElement;
    return el ? { el, key: el.dataset?.key } : null;
  }

  _restoreFocus(opener) {
    if (!opener) return;
    const key = /^[\w-]+$/.test(opener.key || "") ? opener.key : null;
    const el = opener.el?.isConnected ? opener.el : key && this.shadowRoot.querySelector?.(`[data-key="${key}"]`);
    el?.focus?.({ preventScroll: true });
  }

  // Arm or disarm. Arming over open sensors goes through Alarmo's own service with `force` (the standard
  // service would be refused); other integrations decide for themselves.
  _send(mode, code, force = false) {
    const entity_id = this._entityId();
    // Remembered briefly for Alarmo's "failed to arm" popup (see _onFailedToArm).
    this._lastArm = !force && mode !== "disarm" ? { mode, code, at: Date.now() } : null;
    if (force && mode !== "disarm" && this._isAlarmo())
      return this._call("alarmo", "arm", { entity_id, mode: mode.slice(4).replace("custom_bypass", "custom"), force: true, ...(code ? { code } : {}) });
    return this._call("alarm_control_panel", `alarm_${mode}`, { entity_id, ...(code ? { code } : {}) });
  }

  _openConfirm(confirm) {
    this._confirm = { ...confirm, opener: this._opener() };
    window.addEventListener("keydown", this._onKey);
    this._update();
    this.shadowRoot.querySelector?.(".modal .primary")?.focus({ preventScroll: true });
    this._reveal(".modal");
  }

  // The user just opened the pad or the popup: bring the whole of it on screen (the popup sits at the top of
  // the card, which may be scrolled out; the pad opens under the buttons, maybe below the screen). The focus
  // itself never scrolls (preventScroll): it would scroll to the focused button only, not to the whole box.
  _reveal(sel) {
    this.shadowRoot.querySelector?.(sel)?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  _closeConfirm(restore = true) {
    const opener = this._confirm?.opener;
    this._confirm = null;
    this._confirmClosedAt = Date.now();
    if (!this._pad) window.removeEventListener("keydown", this._onKey);
    this._update();
    if (restore) this._restoreFocus(opener);
  }

  _confirmHtml() {
    const c = this._confirm;
    return `<style>${DIALOG_STYLE}</style><div class="backdrop" data-action="confirm_backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-describedby="confirm-msg">
        <div class="msg" id="confirm-msg">${esc(c.text)}</div>
        <div class="modal-actions">
          <button class="btn" data-action="confirm_cancel"><span>${esc(this._t("cancel"))}</span></button>
          <button class="btn primary ${c.cls || ""}" data-action="confirm_ok"><span>${esc(c.ok)}</span></button>
        </div>
      </div>
    </div>`;
  }

  // ----- Pieces ------------------------------------------------------------

  _stateText(st) {
    const k = `s_${st?.state}`;
    if (STRINGS[this._lang()][k]) return this._t(k);
    if (st && this._hass.formatEntityState) {
      try {
        return this._hass.formatEntityState(st);
      } catch (_e) {
        /* older Home Assistant */
      }
    }
    return String(st?.state ?? "");
  }

  // "for 2 h 05 · by Alex".
  _subtitle(st) {
    const tr = (k) => this._t(k);
    const bits = [];
    const since = (Date.now() - Date.parse(st.last_changed)) / 1000;
    if (Number.isFinite(since)) bits.push(since < 60 ? tr("just_now") : this._t("since", { d: fmtDuration(since, tr) }));
    const by = st.attributes?.changed_by;
    if (by && this._config.show_info !== false) bits.push(this._t("by", { name: by }));
    return bits.join(" · ");
  }

  _header(st) {
    const c = this._config;
    const cls = stateClass(st.state);
    const zoom = this._zoomButton();
    return `
      <div class="header${zoom ? " has-zoom" : ""}">
        ${c.show_logo !== false ? logo(this._t("title")) : ""}
        <div class="titles">
          <div class="tline">
            <div class="name">${esc(c.title || st.attributes?.friendly_name || this._t("title"))}</div>
            <span class="chip clickable ${cls}" role="button" tabindex="0" data-entity="${esc(st.entity_id)}" title="${esc(this._stateText(st))}" aria-label="${esc(this._stateText(st))}"><span class="dot"></span><span class="chip-text">${esc(this._stateText(st))}</span></span>
          </div>
          <div class="sub">${esc(this._subtitle(st))}</div>
        </div>
        ${zoom}
      </div>`;
  }

  // The illustrated header (illustration: false keeps the classic one): the round state icon, the title and
  // the state (with `detail` after it) at the left, the radar and the big state shield at the right.
  _illustrated() {
    return this._config.illustration !== false;
  }

  // `side`: the mini card's compact arm / disarm buttons, stacked under its detail button (`cols`: their columns).
  _banner(st, detail, showBadge, side = null) {
    const c = this._config;
    const cls = stateClass(st.state);
    const zoom = this._zoomButton();
    const modes = side ? ` has-modes cols-${side.cols}` : "";
    const name = esc(c.title || st.attributes?.friendly_name || this._t("title"));
    const ent = esc(st.entity_id);
    return `<div class="banner ${cls}${isNight(this._hass, c) ? " dark" : ""}${zoom ? " has-zoom" : ""}${modes}">
        <div class="al-ground" aria-hidden="true"></div>
        ${alarmRadar(this._uid)}
        <div class="al-shield clickable" role="button" tabindex="0" aria-label="${esc(this._stateText(st))}" data-entity="${ent}">${shield(st.state, this._uid)}</div>
        <div class="header htext">
          ${showBadge ? `<div class="ibadge">${svgIcon(STATE_ICON[cls] || ICONS.shield)}</div>` : ""}
          <div class="titles">
            <div class="tline">
              <div class="name">${name}</div>
              <span class="chip clickable ${cls}" role="button" tabindex="0" data-entity="${ent}" title="${esc(this._stateText(st))}" aria-label="${esc(
                this._stateText(st),
              )}"><span class="dot"></span><span class="chip-text">${esc(this._stateText(st))}</span></span>
            </div>
            ${detail ? `<div class="sub">${esc(detail)}</div>` : ""}
          </div>
        </div>
        ${zoom}
        ${side ? `<div class="mini-modes controls">${side.html}</div>` : ""}
      </div>`;
  }

  // Button at the far right of the header: only the mini card has one.
  _zoomButton() {
    return "";
  }

  // Delay countdown, open sensors reported by the panel, bypassed sensors: lines under the state.
  _lines(st, withBar) {
    const a = st.attributes || {};
    const out = [];
    const rem = remaining(st);
    if (rem) {
      const key = st.state === "pending" ? "pending_in" : "arming_in";
      out.push(`<div class="line">${svgIcon(ICONS.timer)}<span>${esc(this._t(key, { d: fmtCountdown(rem.left) }))}</span></div>`);
      if (withBar && rem.total) out.push(`<div class="bar ${stateClass(st.state)}"><div style="width:${((100 * rem.left) / rem.total).toFixed(1)}%"></div></div>`);
    }
    // Alarmo also lists unavailable sensors (or ones deleted/renamed since its setup) in open_sensors: they
    // block arming like open ones, but get their own "Unavailable" line instead of being called open.
    const reported = entityList(a.open_sensors);
    const isGone = (id) => {
      const s = a.open_sensors && !Array.isArray(a.open_sensors) ? a.open_sensors[id] : this._hass.states[id]?.state;
      return s === undefined || s === null || s === "unavailable" || s === "unknown";
    };
    const unavailable = reported.filter(isGone);
    const open = reported.filter((id) => !isGone(id));
    // Each name opens its own sensor's more-info: the names are spliced, already marked up, into the
    // escaped translated line through a placeholder no translation can contain.
    const sensorLine = (ids, key, cls) => {
      const names = ids
        .map((id) => `<span class="clickable" role="button" tabindex="0" data-entity="${esc(id)}">${esc(this._sensorName(id))}</span>`)
        .join(", ");
      out.push(`<div class="alert-line ${cls}">${svgIcon(ICONS.alert)}<span>${esc(this._t(key, { list: "\u0000" })).replace("\u0000", names)}</span></div>`);
    };
    if (open.length) sensorLine(open, "open_sensors", st.state === "triggered" ? "alarm" : "wait");
    if (unavailable.length) sensorLine(unavailable, "unavailable_sensors", "wait");
    const bypassed = entityList(a.bypassed_sensors);
    if (bypassed.length)
      out.push(`<div class="line">${svgIcon(ICONS.shield_off)}<span>${esc(this._t("bypassed", { list: bypassed.map((id) => this._sensorName(id)).join(", ") }))}</span></div>`);
    return out.join("");
  }

  // Mode buttons: the arm modes, and Disarm (Cancel while arming) when the panel is not disarmed.
  _modeButtons(st, round = false) {
    const modes = supportedModes(st, this._config.modes);
    const armedAs = st.state.startsWith("armed_") ? `arm_${st.state.slice(6)}` : null;
    const unavailable = /^(unavailable|unknown)$/.test(st.state);
    const btn = (mode, icon, label, cls, active) =>
      `<button class="btn ${round ? "round" : ""} ${cls} ${active ? "primary" : ""} ${unavailable ? "disabled" : ""}" ${
        unavailable ? "disabled" : ""
      } title="${esc(label)}" aria-pressed="${active}" data-key="${mode}" data-action="mode" data-mode="${mode}">${svgIcon(icon)}${round ? "" : `<span>${esc(label)}</span>`}</button>`;
    const list = [];
    if (st.state !== "disarmed")
      list.push(btn("disarm", ICONS.unlock, this._t(st.state === "arming" ? "cancel" : "disarm"), st.state === "triggered" ? "alarm" : "off", st.state === "triggered"));
    for (const m of modes) {
      if (round && armedAs === m) continue;
      list.push(btn(m, MODE_ICON[m], this._t(m), stateClass(`armed_${m.slice(4)}`), armedAs === m));
    }
    return list.join("");
  }

  // Code pad, opened by a mode button when the panel needs a code: digits for a number code, a field else.
  _padHtml(st) {
    const p = this._pad;
    if (!p) return "";
    const label = this._label(p.mode === "disarm" ? "disarm" : p.mode);
    const cls = p.mode === "disarm" ? "off" : stateClass(`armed_${p.mode.slice(4)}`);
    const code = String(this._code || "");
    let body;
    if (st.attributes?.code_format === "number") {
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => `<button class="btn" data-action="key" data-key="k${k}" data-digit="${k}">${k}</button>`);
      body = `<div class="dots" aria-live="polite">${
        code
          ? `${'<i aria-hidden="true"></i>'.repeat(code.length)}<span class="vh">${esc(this._t("digits_entered", { n: code.length }))}</span>`
          : `<span class="hint">${esc(this._t("code_placeholder"))}</span>`
      }</div>
        <div class="keys">${keys.join("")}
          <span></span><button class="btn" data-action="key" data-key="k0" data-digit="0">0</button>
          <button class="btn" data-action="key_back" title="${esc(this._t("clear"))}" aria-label="${esc(this._t("clear"))}">${svgIcon(ICONS.backspace)}</button>
        </div>`;
    } else {
      body = `<input type="password" autocomplete="off" data-action="code_input" placeholder="${esc(this._t("code_placeholder"))}">`;
    }
    return `<div class="pad ${cls}" tabindex="-1">
      <div class="pad-title">${svgIcon(p.mode === "disarm" ? ICONS.unlock : MODE_ICON[p.mode])}${esc(this._t("code_for", { action: label }))}</div>
      ${body}
      <div class="pad-actions">
        <button class="btn" data-action="pad_cancel"><span>${esc(this._t("cancel"))}</span></button>
        <button class="btn primary ${code ? "" : "disabled"}" data-action="pad_ok" ${code ? "" : "disabled"}><span>${esc(this._t("ok"))}</span></button>
      </div>
    </div>`;
  }

  _errorCard(key, extra = "") {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(extra ? `${this._t(key)}: ${extra}` : this._t(key))}</div></ha-card>`;
  }

  // Returns the panel state or an error card.
  _panelOrError() {
    const st = this._panel();
    if (st) return { st };
    return { error: this._config.entity ? this._errorCard("unknown_entity", this._config.entity) : this._errorCard("no_alarm") };
  }
}
