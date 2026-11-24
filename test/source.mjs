// The sources the tests evaluate: src/alarm-card/ and src/alarm-panel/ assembled into one classic script each, as
// scripts/build.mjs does (scripts/bundle.mjs), placeholders (__VERSION__) left as they are.
import { sourceOf } from "../scripts/bundle.mjs";

export const cardSource = sourceOf("alarm-card");
export const panelSource = sourceOf("alarm-panel");
