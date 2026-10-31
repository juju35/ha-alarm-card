// Every README screenshot or animation has a twin in the other theme that shows exactly the same state:
// only the theme (and the file name) may differ between the two.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shots, gifs } from "../scripts/screenshot-shots.mjs";

const pairKey = (file) => file.replace(/-(dark|light)$/, "");
const sameState = ({ file, theme, ...rest }) => rest;

for (const [kind, list] of [["screenshot", shots], ["animation", gifs]]) {
  test(`each ${kind} has a light/dark twin with the same state`, () => {
    const groups = new Map();
    for (const s of list) groups.set(pairKey(s.file), [...(groups.get(pairKey(s.file)) || []), s]);
    for (const [key, pair] of groups) {
      assert.equal(pair.length, 2, `${key}: expected a light and a dark shot`);
      assert.deepEqual(pair.map((s) => s.theme).sort(), ["dark", "light"], `${key}: themes`);
      assert.deepEqual(sameState(pair[0]), sameState(pair[1]), `${key}: the twins differ by more than the theme`);
    }
  });
}

test("the README shows every screenshot and animation, and nothing else from screenshots/", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const referenced = new Set([...readme.matchAll(/screenshots\/([\w-]+\.(?:png|gif))/g)].map((m) => m[1]));
  const rendered = new Set([...shots.map((s) => `${s.file}.png`), ...gifs.map((s) => `${s.file}.gif`)]);
  assert.deepEqual([...referenced].sort(), [...rendered].sort());
});
