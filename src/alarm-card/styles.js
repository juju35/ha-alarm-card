// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

// Text in a state color: the color mixed with the theme's text color, which darkens it in a light theme and
// lightens it in a dark one, so that it stays readable (WCAG AA 4.5:1, checked by test/contrast.test.mjs) on
// the card and on the tinted chips, buttons and tiles. Dots, icons, borders and tints keep the pure color.
export const textColor = (c) => `color-mix(in srgb, ${c} 40%, var(--primary-text-color, #212121))`;

// The mode colors follow HA's palette variables, so that a theme can change them.
export const BASE_STYLE = `
  :host { --al-accent: #e5484d; --al-off: var(--success-color, #43a047); --al-home: var(--orange-color, #f59f00); --al-away: var(--error-color, #db4437);
          --al-night: var(--deep-purple-color, #7048e8); --al-vacation: var(--cyan-color, #1098ad); --al-custom: var(--purple-color, #ae3ec9);
          --al-wait: var(--warning-color, #ffa600);
          --al-alarm: var(--error-color, #db4437); --al-idle: var(--disabled-text-color, #9e9e9e); }
  ha-card { overflow: hidden; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible, .btn:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .off { --c: var(--al-off); } .home { --c: var(--al-home); } .away { --c: var(--al-away); } .night { --c: var(--al-night); }
  .vacation { --c: var(--al-vacation); } .custom { --c: var(--al-custom); } .wait { --c: var(--al-wait); }
  .alarm { --c: var(--al-alarm); } .idle { --c: var(--al-idle); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--al-off)) 15%, transparent); color: ${textColor("var(--c, var(--al-off))")}; flex: none; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 0; }
  .badge { --c: var(--al-accent); width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge .icon { width: 24px; height: 24px; }
  .titles { flex: 1 1 0; min-width: 0; }
  :host([hide-title]) .titles > .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  /* The container queries need a container (ha-card), and a container has no width of its own: in a parent
     sized by its content (inline-block, grid "auto" column, flex row: layout-card, button-card) the card would
     collapse to nothing. The strut, an invisible row of 10 small boxes next to ha-card, gives the card a
     preferred width (max-content: the whole row, 360-400 px) while its narrowest width (min-content: one box)
     stays small, so that a "1fr 1fr" grid or a stack still shrinks the card instead of letting it overflow
     (contain-intrinsic-size or a min-width would raise both). */
  :host { display: block; min-width: 0; }
  .strut { display: flex; flex-wrap: wrap; height: 0; overflow: hidden; visibility: hidden; pointer-events: none; }
  .strut > i { flex: none; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: ${textColor("var(--al-wait)")}; }
  /* The state "shield" is a frosted-glass emblem. The box only sizes it (72/52/40 px set elsewhere); the SVG
     fills it. Accent colours come from var(--c); the two gradients are literal white (WebKit/Safari-safe). */
  .shield { flex: none; display: grid; place-items: center; color: var(--c); }
  /* overflow: hidden clips the enlarged emblem's off-shield geometry to the badge (so nothing leaves the card);
     the shield and the trigger shockwaves live inside the view box, and the glow is the element's own filter,
     so neither is lost. */
  .shield .sc { width: 100%; height: 100%; display: block; overflow: hidden;
                filter: drop-shadow(0 0 4px color-mix(in srgb, var(--c) 26%, transparent)); transition: filter .4s ease; }
  .sc-tint { fill: var(--c); fill-opacity: .14; }
  .sc-ring { fill: none; stroke: var(--c); stroke-width: 3; stroke-linejoin: round; }
  .sc-guard { fill: none; stroke: var(--c); stroke-width: 1; }
  .sc-guard.g1 { opacity: .3; } .sc-guard.g2 { opacity: .18; }
  .sc-highlight { fill: none; stroke: #fff; stroke-opacity: .4; stroke-width: 1.6; stroke-linecap: round; }
  .sc-lock { fill: var(--c); }
  .sc-lock-shackle { fill: none; stroke: var(--c); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round;
                     transform-box: view-box; transform-origin: 64px 58px; transition: transform .5s cubic-bezier(.4, 1.4, .5, 1); }
  /* disarmed / idle: the padlock is open; every armed/arming/triggered state closes it */
  .shield.off .sc-lock-shackle, .shield.idle .sc-lock-shackle { transform: rotate(-26deg) translateX(-4px); }
  .sc-secure, .sc-shock, .sc-ringdraw { fill: none; stroke: var(--c); opacity: 0; transform-box: view-box; transform-origin: 60px 56px; }
  .sc-secure { stroke-width: 2; } .sc-shock { stroke-width: 2.5; }
  .sc-ringdraw { stroke-width: 2.4; stroke-linecap: round; }
  /* motion: a specular highlight glides across the glass */
  .sc-gleam { transform-box: view-box; transform-origin: center; animation: al-gleam 5s ease-in-out infinite; }
  /* disarmed / idle: slow, quiet */
  .shield.off .sc-gleam, .shield.idle .sc-gleam { animation-duration: 6.5s; }
  /* arming / pending: faster gleam + a thin ring that draws itself */
  .shield.wait .sc-gleam { animation-duration: 1.6s; }
  .shield.wait .sc-ringdraw { opacity: 1; animation: al-ringdraw 1.6s ease-in-out infinite; }
  /* armed (home/away/night/vacation/custom): stronger glow + a secured halo that breathes out */
  .shield.home .sc, .shield.away .sc, .shield.night .sc, .shield.vacation .sc, .shield.custom .sc {
    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--c) 46%, transparent)); }
  .shield.home .sc-secure, .shield.away .sc-secure, .shield.night .sc-secure,
  .shield.vacation .sc-secure, .shield.custom .sc-secure { animation: al-secure 3.2s ease-out infinite; }
  /* triggered: the glow swells and shockwaves burst past the shield */
  .shield.alarm .sc { animation: al-glow 1.1s ease-in-out infinite; }
  .shield.alarm .sc-shock { animation: al-shock 1.4s ease-out infinite; }
  .shield.alarm .s2 { animation-delay: .6s; }
  @keyframes al-gleam { 0% { transform: translateX(-46px); } 55%, 100% { transform: translateX(52px); } }
  @keyframes al-ringdraw { 0% { stroke-dashoffset: 170; opacity: .2; } 60% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
  @keyframes al-secure { 0% { opacity: .5; transform: scale(.82); } 70%, 100% { opacity: 0; transform: scale(1.3); } }
  @keyframes al-shock { 0% { opacity: .7; transform: scale(.6); } 100% { opacity: 0; transform: scale(2.1); } }
  @keyframes al-glow { 0%, 100% { filter: drop-shadow(0 0 5px color-mix(in srgb, var(--c) 40%, transparent)); }
                       50% { filter: drop-shadow(0 0 16px color-mix(in srgb, var(--c) 85%, transparent)); } }
  @media (prefers-reduced-motion: reduce) { .shield .sc, .shield .sc * { animation: none !important; } }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .line { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  .line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .line .icon { width: 14px; height: 14px; }
  .alert-line { display: flex; align-items: center; gap: 6px; font-size: 12px; color: ${textColor("var(--c, var(--al-wait))")}; min-width: 0; }
  .alert-line .icon { color: var(--c, var(--al-wait)); }
  /* What set the alarm off is the line that matters: up to three lines before it is cut. */
  .alert-line > span { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3;
                       overflow-wrap: anywhere; }
  .alert-line .icon { width: 14px; height: 14px; }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--al-wait)); transition: width 1s linear; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; cursor: pointer; font: inherit; font-size: 13px;
         font-weight: 500; padding: 6px 12px; border-radius: 18px; background: var(--secondary-background-color, rgba(127,127,127,.12));
         color: var(--primary-text-color); min-width: 0; }
  .btn:hover { background: color-mix(in srgb, var(--c, var(--al-accent)) 14%, var(--secondary-background-color, rgba(127,127,127,.12))); }
  .btn .icon { width: 18px; height: 18px; color: var(--c, var(--primary-text-color)); }
  .btn.primary { background: color-mix(in srgb, var(--c, var(--al-accent)) 16%, transparent); color: ${textColor("var(--c, var(--al-accent))")}; }
  .btn.primary:hover { background: color-mix(in srgb, var(--c, var(--al-accent)) 24%, transparent); }
  .btn.round { width: 36px; height: 36px; padding: 0; border-radius: 50%; }
  .btn.disabled { opacity: .45; cursor: default; }
  .pad { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 12px; border: 1px solid var(--divider-color, rgba(127,127,127,.25)); }
  .pad:focus { outline: none; }
  .pad-title { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; }
  .pad-title .icon { width: 18px; height: 18px; color: var(--c, var(--al-accent)); }
  .pad input { font: inherit; font-size: 18px; letter-spacing: .3em; text-align: center; padding: 8px; border-radius: 10px; box-sizing: border-box; width: 100%;
               border: 1px solid var(--divider-color, rgba(127,127,127,.35)); background: transparent; color: var(--primary-text-color); }
  .dots { display: flex; justify-content: center; gap: 8px; min-height: 14px; align-items: center; }
  .dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--primary-text-color); }
  /* Read by screen readers only (the dots' live region). */
  .vh { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .dots .hint { font-size: 13px; color: var(--secondary-text-color); }
  .keys { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 260px; width: 100%; margin: 0 auto; }
  .keys .btn { height: 42px; font-size: 18px; font-weight: 400; border-radius: 12px; }
  .pad-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--al-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
`;

// In-card confirmation popup, as in the other ha-* cards: a backdrop over the card with a small dialog at
// the top of the card, so that it stays in view when the card is long.
export const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 160px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal .msg { font-size: 14px; line-height: 1.4; min-height: 0; overflow: auto; overflow-wrap: anywhere; }
  /* Past the card's height (see _fitConfirm), the message scrolls inside the popup: the buttons stay in view, on two rows if needed. */
  .modal-actions { flex: none; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
`;

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
export const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));
export const isOutside = (card, ev) => !ev.composedPath().includes(card) && !inDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. It counts when the press and the release are both outside the card (a slider dragged out of the card
// does not fold it), and a scroll does not count (the browser cancels the pointer). Keyboard clicks still go through
// the click event. `tap(ev)` (press and release at the same spot) is for the tests.
export const watchOutside = (isOut, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOut(ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOut(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOut(ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};

// After the confirmation popup closes, clicks on the card are ignored for this long: the second click of a
// double click on OK would otherwise land on what lies under the button.
export const CONFIRM_GUARD_MS = 400;

// Code pad actions are exempt from that guard: confirming a disarm opens the pad, and the first tap on a
// digit may well come within the guard window.
export const PAD_ACTIONS = new Set(["key", "key_back", "pad_cancel", "pad_ok", "code_input"]);
