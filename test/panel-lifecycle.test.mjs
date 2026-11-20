// The panel element's lifecycle, without a browser: src/alarm-panel.js evaluated in a sandbox, its methods called on
// the element with the drawing stubbed out.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../src/alarm-panel.js", import.meta.url), "utf8");

const loadPanel = () => {
  const registry = new Map();
  const sandbox = {
    HTMLElement: class {},
    customElements: { define: (name, cls) => registry.set(name, cls), get: (name) => registry.get(name), whenDefined: async () => {} },
    document: { querySelector: () => null, createElement: () => ({}), addEventListener() {} },
    localStorage: { getItem: () => null, setItem() {} },
    console: { ...console, info() {} },
    Intl,
    matchMedia: () => ({ matches: false }),
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    location: { pathname: "/alarm-panel/general" },
    history: { replaceState() {} },
    addEventListener() {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return registry.get("alarm-card-panel");
};

// A panel already set up (shadow root, Alarmo's data, subscribed), with what it draws and loads counted.
const setUp = () => {
  const Panel = loadPanel();
  const panel = Object.create(Panel.prototype);
  const counts = { load: 0, render: 0, unsub: 0, sub: 0 };
  Object.assign(panel, {
    shadowRoot: {},
    _hass: { connection: {} },
    _d: { sensors: {} },
    _unsub: () => counts.unsub++,
    _render: () => counts.render++,
    _load: async () => {
      counts.load++;
    },
    _subscribe() {
      counts.sub++;
      this._unsub = null;
    },
  });
  return { panel, counts };
};

test("leaving the panel closes its popup without acting, and stops following Alarmo", () => {
  const { panel, counts } = setUp();
  panel._popup = { kind: "code", mode: "away" };
  panel.disconnectedCallback();
  assert.equal(panel._popup, null);
  assert.equal(counts.unsub, 1);
  assert.equal(panel._unsub, undefined);
});

test("back on the panel, Alarmo's data is read again and followed anew", async () => {
  const { panel, counts } = setUp();
  panel.connectedCallback();
  assert.equal(counts.load, 0, "not read again on the first attach");
  panel.disconnectedCallback();
  panel.connectedCallback();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(counts.sub, 1);
  assert.equal(counts.load, 1);
  assert.ok(counts.render >= 2, "drawn again once the data is in");
});
