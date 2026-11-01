// Text drawn in a state color must stay readable (WCAG AA, 4.5:1) in the light and the dark HA themes, on
// every background the card puts behind it. The state color itself stays on the dots, icons and tints; the
// text gets a mix of it with the theme's text color. This test reads the card's own CSS (as rendered in
// several states) and checks every rule that colors text with a state color.
import assert from "node:assert/strict";
import { test } from "node:test";
import { armedAway, arming, entities, sensors, states, triggered, withCode } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const al = load();
const PANEL = "alarm_control_panel.alarmo";

// HA's default theme values (frontend), and the card's own fallbacks when a variable is not defined.
const THEMES = {
  light: { "--card-background-color": "#ffffff", "--primary-text-color": "#212121", "--secondary-background-color": "#e5e5e5", "--disabled-text-color": "#bdbdbd" },
  dark: { "--card-background-color": "#1c1c1c", "--primary-text-color": "#e1e1e1", "--secondary-background-color": "#282828", "--disabled-text-color": "#6f6f6f" },
};
const HA_PALETTE = {
  "--success-color": "#4caf50",
  "--error-color": "#db4437",
  "--warning-color": "#ffa600",
  "--orange-color": "#ff9800",
  "--deep-purple-color": "#6e41ab",
  "--cyan-color": "#00bcd4",
  "--purple-color": "#926bc7",
};

const hex = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const mix = (a, b, p) => a.map((v, i) => v * p + b[i] * (1 - p));

// Resolves var(--x, fallback) and color-mix(in srgb, A p%, B) against a variable table, to an [r, g, b].
const resolve = (expr, vars) => {
  expr = expr.trim();
  if (/^#[0-9a-f]{6}$/i.test(expr)) return hex(expr);
  const args = (inner) => {
    const out = [];
    let depth = 0;
    let cur = "";
    for (const ch of inner) {
      if (ch === "," && depth === 0) {
        out.push(cur);
        cur = "";
        continue;
      }
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  let m = expr.match(/^var\((.*)\)$/s);
  if (m) {
    const [name, ...rest] = args(m[1]);
    if (name in vars) return resolve(vars[name], vars);
    if (!rest.length) throw new Error(`undefined variable ${name}`);
    return resolve(rest.join(","), vars);
  }
  m = expr.match(/^color-mix\(in srgb,(.*)\)$/s);
  if (m) {
    const [a, b] = args(m[1]);
    const pa = a.match(/^(.*)\s(\d+)%$/s);
    if (b === "transparent") return { tint: resolve(pa[1], vars), p: pa[2] / 100 };
    return mix(resolve(pa[1], vars), resolve(b, vars), pa[2] / 100);
  }
  throw new Error(`cannot resolve ${expr}`);
};

const render = (Cls, overrides, config = {}) => {
  const card = new Cls();
  card.setConfig({ entity: PANEL, sensors, ...config });
  card.hass = { states: { ...states, ...overrides }, entities, language: "en", callService() {} };
  return card.shadowRoot.innerHTML;
};

const css = [
  render(al.AlarmCard, {}),
  render(al.AlarmCard, armedAway),
  render(al.AlarmCard, arming),
  render(al.AlarmCard, triggered),
  render(al.AlarmCard, withCode),
  render(al.AlarmMiniCard, {}),
  render(al.AlarmMiniCard, triggered),
]
  .flatMap((html) => [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]))
  .filter((block, i, all) => all.indexOf(block) === i)
  .join("\n");

// The card's color variables (on :host) and the state classes that set --c.
const hostVars = Object.fromEntries([...css.match(/:host\s*\{([^}]*)\}/)[1].matchAll(/(--al-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const stateColors = Object.fromEntries([...css.matchAll(/\.(\w+)\s*\{\s*--c:\s*([^;]+);\s*\}/g)].map((m) => [m[1], m[2].trim()]));

// Rules that color text (not an icon, a dot or a shield) with a state color.
const textRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map((m) => ({ sel: m[1].trim(), color: m[2].match(/(?:^|;)\s*color:\s*([^;]+)/)?.[1]?.trim() }))
  .filter((r) => r.color && /var\(--(c|al-)/.test(r.color) && !/\.icon|\.shield|\.badge|\.dot|^(from|to|\d+%)/.test(r.sel))
  .filter((r, i, all) => all.findIndex((o) => o.sel === r.sel && o.color === r.color) === i);

test("the card's CSS was found", () => {
  assert.ok(Object.keys(stateColors).length >= 9, Object.keys(stateColors).join());
  assert.ok(textRules.length >= 5, textRules.map((r) => r.sel).join(" | "));
});

for (const [themeName, theme] of Object.entries(THEMES)) {
  for (const [paletteName, palette] of [
    ["HA palette", HA_PALETTE],
    ["card fallbacks", {}],
  ]) {
    test(`text in a state color reaches 4.5:1 (${themeName} theme, ${paletteName})`, () => {
      const failures = [];
      for (const [cls, cExpr] of Object.entries(stateColors)) {
        const vars = { ...theme, ...palette, ...hostVars };
        vars["--c"] = cExpr;
        const c = resolve(cExpr, vars);
        const card = resolve("var(--card-background-color)", vars);
        const backgrounds = {
          card,
          "chip/button tint 24%": mix(c, card, 0.24),
          "tile tint 12%": mix(c, resolve("var(--secondary-background-color)", vars), 0.12),
        };
        for (const { sel, color } of textRules) {
          const fg = resolve(color, vars);
          // A text that does not follow --c (the config warning) sits on the bare card only.
          const bgs = /var\(--c\b/.test(color) ? Object.entries(backgrounds) : [["card", card]];
          for (const [bgName, bg] of bgs) {
            const r = ratio(fg, bg);
            if (r < 4.5) failures.push(`${sel} .${cls} on ${bgName}: ${r.toFixed(2)}:1`);
          }
        }
      }
      assert.deepEqual(failures, []);
    });
  }
}
