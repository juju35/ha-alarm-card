"""The Alarm Card integration: the alarm cards, and an admin panel to set up Alarmo in the cards' style."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import Any

import voluptuous as vol
from homeassistant.components import frontend, panel_custom, websocket_api
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .config_flow import clean_options
from .const import (
    BADGE_FILENAME,
    CARD_FILENAME,
    CONF_ENTITY,
    CONF_HIDE_HEADER,
    CONF_ILLUSTRATION_THEME,
    CONF_PANEL_TABS,
    CONF_PANEL_TITLE,
    CONF_SIDEBAR_BADGE,
    DOMAIN,
    FRONTEND_URL,
    HIDE_HEADER_CHOICES,
    PANEL_ELEMENT,
    PANEL_FILENAME,
    PANEL_ICON,
    PANEL_TABS,
    PANEL_TITLE_MAX,
    PANEL_URL_PATH,
    THEME_CHOICES,
    VERSION,
)

_LOGGER = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).parent / "frontend"
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
# hass.data keys: the card and the badge are added once per run, whatever the entry reloads.
DATA_CARD = f"{DOMAIN}_card"
DATA_BADGE = f"{DOMAIN}_badge"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the frontend files and register the websocket commands, once."""
    if FRONTEND_DIR.is_dir():
        # Cache headers on: every URL handed to the browser carries the file's hash (or the version for the
        # translation files), so a new release is fetched at once and an unchanged one comes from the cache.
        await hass.http.async_register_static_paths([StaticPathConfig(FRONTEND_URL, str(FRONTEND_DIR), True)])
    else:
        # A checkout of the sources: the frontend is built by `npm run build` (the release zip carries it).
        _LOGGER.error("Alarm Card frontend not found in %s: run `npm run build`", FRONTEND_DIR)
    websocket_api.async_register_command(hass, ws_settings)
    websocket_api.async_register_command(hass, ws_update_settings)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    if not FRONTEND_DIR.is_dir():
        return True
    if not hass.data.get(DATA_CARD):
        hass.data[DATA_CARD] = True
        await _async_register_card(hass)
    if not hass.data.get(DATA_BADGE):
        hass.data[DATA_BADGE] = True
        _base, badge_url = await _file_url(hass, BADGE_FILENAME)
        add_extra_js_url(hass, badge_url)
    await _async_register_panel(hass, entry)
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
    return True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Only the sidebar title lives in the panel's registration: the other settings are read by the panel itself."""
    panel = hass.data.get(frontend.DATA_PANELS, {}).get(PANEL_URL_PATH)
    if panel is not None and panel.sidebar_title != clean_options(entry.options)[CONF_PANEL_TITLE]:
        frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
        await _async_register_panel(hass, entry)


async def _file_url(hass: HomeAssistant, filename: str) -> tuple[str, str]:
    """Base URL of a frontend file, and the same URL versioned with the file's hash for the browser cache."""
    path = FRONTEND_DIR / filename
    digest = await hass.async_add_executor_job(
        lambda: hashlib.md5(path.read_bytes(), usedforsecurity=False).hexdigest()[:8]
    )
    base_url = f"{FRONTEND_URL}/{filename}"
    return base_url, f"{base_url}?v={digest}"


async def _async_register_panel(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """The admin panel in the sidebar; it imports the card file for the header picture and its helpers."""
    _base, url = await _file_url(hass, PANEL_FILENAME)
    _base, card_url = await _file_url(hass, CARD_FILENAME)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_ELEMENT,
        sidebar_title=clean_options(entry.options)[CONF_PANEL_TITLE],
        sidebar_icon=PANEL_ICON,
        module_url=url,
        require_admin=True,
        config={"card_url": card_url},
    )


async def _async_register_card(hass: HomeAssistant) -> None:
    """Add the card to the dashboard resources (storage mode), else load it on every page."""
    base_url, url = await _file_url(hass, CARD_FILENAME)

    async def register(_event: Event | None = None) -> None:
        resources, mode = _lovelace_resources(hass.data.get("lovelace"))
        if resources is None or mode != "storage":
            add_extra_js_url(hass, url)
            return
        try:
            if not resources.loaded:
                await resources.async_load()
                resources.loaded = True
            existing = [item for item in resources.async_items() if item.get("url", "").split("?")[0] == base_url]
            if not existing:
                await resources.async_create_item({"res_type": "module", "url": url})
                _LOGGER.info("Alarm Card added to dashboard resources: %s", url)
            elif existing[0].get("url") != url:
                await resources.async_update_item(existing[0]["id"], {"res_type": "module", "url": url})
            for duplicate in existing[1:]:
                await resources.async_delete_item(duplicate["id"])
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning(
                "Could not add the Alarm Card to dashboard resources (%s). Add %s manually "
                "in Settings > Dashboards > Resources (JavaScript module)",
                err,
                url,
            )
            add_extra_js_url(hass, url)

    if hass.is_running:
        await register()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, register)


def _lovelace_resources(lovelace: Any) -> tuple[Any, str]:
    """Lovelace resources and their mode: hass.data["lovelace"] is a dict before 2025.2, then a dataclass."""
    if isinstance(lovelace, dict):
        return lovelace.get("resources"), lovelace.get("resource_mode", lovelace.get("mode", "storage"))
    return getattr(lovelace, "resources", None), getattr(
        lovelace, "resource_mode", getattr(lovelace, "mode", "storage")
    )


def _entry(hass: HomeAssistant) -> ConfigEntry:
    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries:
        raise HomeAssistantError("Alarm Card is not set up")
    return entries[0]


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/settings"})
@callback
def ws_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """The panel's settings, and whether Alarmo is there, for the panel and the sidebar badge."""
    entries = hass.config_entries.async_entries(DOMAIN)
    options = clean_options(entries[0].options if entries else {})
    connection.send_result(
        msg["id"],
        {
            "options": options,
            "admin": connection.user.is_admin,
            "alarmo": "alarmo" in hass.config.components,
            "version": VERSION,
        },
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/update_settings",
        vol.Required("options"): vol.Schema(
            {
                vol.Optional(CONF_PANEL_TITLE): vol.All(cv.string, vol.Length(max=PANEL_TITLE_MAX)),
                vol.Optional(CONF_HIDE_HEADER): vol.In(HIDE_HEADER_CHOICES),
                vol.Optional(CONF_PANEL_TABS): [vol.In(PANEL_TABS)],
                vol.Optional(CONF_SIDEBAR_BADGE): cv.boolean,
                vol.Optional(CONF_ENTITY): vol.Any("", cv.entity_domain("alarm_control_panel")),
                vol.Optional(CONF_ILLUSTRATION_THEME): vol.In(THEME_CHOICES),
            }
        ),
    }
)
@callback
def ws_update_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Save the settings from the panel's Settings tab."""
    try:
        entry = _entry(hass)
    except HomeAssistantError as err:
        connection.send_error(msg["id"], "not_found", str(err))
        return
    options = clean_options({**entry.options, **msg["options"]})
    hass.config_entries.async_update_entry(entry, options=options)
    connection.send_result(msg["id"], {"options": options})
