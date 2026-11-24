/*
 * Alarm panel for Home Assistant (served by the Alarm Card integration)
 * https://github.com/juju35/ha-alarm-card
 *
 * Sets up Alarmo (https://github.com/nielsfaber/alarmo) in the style of the alarm cards: the same tabs and settings
 * as Alarmo's own panel (General, Sensors, Codes, Actions), then the panel's Settings. The header is the alarm card's
 * illustrated banner across the page, with the mode buttons. Everything is read and written through Alarmo's own
 * API (its websocket commands and /api/alarmo/* views), so Alarmo's entities, cards and automations are unchanged.
 */

export const PANEL_VERSION = "__VERSION__";
