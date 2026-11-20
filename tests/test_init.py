"""Tests of the Alarm Card integration: setup, the panel, its settings and the config flow."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from homeassistant.components import frontend
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.alarm_card import _lovelace_resources
from custom_components.alarm_card.config_flow import clean_options
from custom_components.alarm_card.const import DOMAIN, PANEL_URL_PATH, VERSION

DEFAULTS = {
    "panel_title": "Alarm",
    "hide_header": "off",
    "panel_tabs": ["general", "sensors", "codes", "actions", "timeline"],
    "sidebar_badge": True,
    "entity": "",
    "illustration_theme": "auto",
}


async def _setup(hass: HomeAssistant, options: dict | None = None) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="Alarm Card", data={}, options=options or {})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def _panel(hass: HomeAssistant):
    return hass.data.get(frontend.DATA_PANELS, {}).get(PANEL_URL_PATH)


def test_lovelace_resources_before_and_after_2025_2() -> None:
    old = {"resources": "r", "resource_mode": "yaml"}
    assert _lovelace_resources(old) == ("r", "yaml")
    assert _lovelace_resources(SimpleNamespace(resources="r", resource_mode="storage")) == ("r", "storage")


def test_clean_options_fills_defaults_and_drops_bad_values() -> None:
    assert clean_options({}) == DEFAULTS
    bad = {"hide_header": "nope", "panel_tabs": ["codes", "general", "bogus"], "entity": "light.x", "panel_title": " "}
    assert clean_options({**bad, "x": 1}) == {**DEFAULTS, "panel_tabs": ["general", "codes"]}
    # No tab chosen means every tab: Settings alone would be an empty panel.
    assert clean_options({"panel_tabs": []})["panel_tabs"] == DEFAULTS["panel_tabs"]


async def test_setup_registers_an_admin_panel_the_card_and_the_badge(hass: HomeAssistant, stub_frontend) -> None:
    await async_setup_component(hass, "http", {})
    entry = await _setup(hass)
    assert entry.state is ConfigEntryState.LOADED
    panel = _panel(hass)
    assert panel is not None
    assert panel.require_admin is True
    assert panel.sidebar_title == "Alarm"
    assert panel.config["_panel_custom"]["name"] == "alarm-card-panel"
    assert panel.config["_panel_custom"]["module_url"].startswith("/alarm_card_static/alarm-panel.js?v=")
    assert panel.config["card_url"].startswith("/alarm_card_static/alarm-card.js?v=")
    urls = [c.args[1] for c in stub_frontend.call_args_list]
    assert any(u.startswith("/alarm_card_static/alarm-badge.js?v=") for u in urls)

    assert await hass.config_entries.async_unload(entry.entry_id)
    assert _panel(hass) is None


async def test_frontend_is_served_with_cache_headers(hass: HomeAssistant) -> None:
    """The URLs are versioned (hash / version), so the static path can let the browser cache them."""
    await async_setup_component(hass, "http", {})
    with patch.object(hass.http, "async_register_static_paths", AsyncMock()) as register:
        assert await async_setup_component(hass, DOMAIN, {})
    (configs,) = register.call_args.args
    assert [(c.url_path, c.cache_headers) for c in configs] == [("/alarm_card_static", True)]


async def test_a_new_sidebar_title_registers_the_panel_again(hass: HomeAssistant) -> None:
    await async_setup_component(hass, "http", {})
    entry = await _setup(hass)
    hass.config_entries.async_update_entry(entry, options={**DEFAULTS, "panel_title": "Security"})
    await hass.async_block_till_done()
    assert _panel(hass).sidebar_title == "Security"


async def test_settings_websocket(hass: HomeAssistant, hass_ws_client) -> None:
    await async_setup_component(hass, "http", {})
    entry = await _setup(hass)
    client = await hass_ws_client(hass)

    await client.send_json({"id": 1, "type": "alarm_card/settings"})
    msg = await client.receive_json()
    assert msg["success"]
    assert msg["result"] == {"options": DEFAULTS, "admin": True, "alarmo": False, "version": VERSION}

    await client.send_json(
        {"id": 2, "type": "alarm_card/update_settings", "options": {"hide_header": "all", "panel_tabs": ["sensors"]}}
    )
    msg = await client.receive_json()
    assert msg["success"]
    assert entry.options["hide_header"] == "all"
    assert entry.options["panel_tabs"] == ["sensors"]

    await client.send_json({"id": 3, "type": "alarm_card/update_settings", "options": {"hide_header": "sometimes"}})
    msg = await client.receive_json()
    assert not msg["success"]


async def test_settings_are_saved_by_admins_only(hass: HomeAssistant, hass_ws_client, hass_admin_user) -> None:
    await async_setup_component(hass, "http", {})
    await _setup(hass)
    hass_admin_user.groups = []
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "alarm_card/update_settings", "options": {"hide_header": "all"}})
    msg = await client.receive_json()
    assert not msg["success"]
    assert msg["error"]["code"] == "unauthorized"


async def test_config_flow_creates_one_entry_with_the_default_options(hass: HomeAssistant) -> None:
    await async_setup_component(hass, "http", {})
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["options"] == DEFAULTS
    await hass.async_block_till_done()

    again = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert again["type"] is FlowResultType.ABORT
    assert again["reason"] == "single_instance_allowed"


async def test_options_flow_saves_the_panel_settings(hass: HomeAssistant) -> None:
    await async_setup_component(hass, "http", {})
    entry = await _setup(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "panel_title": "Security",
            "hide_header": "non_admin",
            "panel_tabs": ["general", "codes"],
            "sidebar_badge": False,
            "illustration_theme": "night",
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    # The update listener re-registers the panel (new title) in a task: let it finish inside the test.
    await hass.async_block_till_done()
    assert _panel(hass).sidebar_title == "Security"
    assert entry.options == {
        **DEFAULTS,
        "panel_title": "Security",
        "hide_header": "non_admin",
        "panel_tabs": ["general", "codes"],
        "sidebar_badge": False,
        "illustration_theme": "night",
    }


async def test_without_a_built_frontend_the_entry_still_loads(hass: HomeAssistant, frontend_dir) -> None:
    await async_setup_component(hass, "http", {})
    for f in frontend_dir.iterdir():
        f.unlink()
    frontend_dir.rmdir()
    entry = await _setup(hass)
    assert entry.state is ConfigEntryState.LOADED
    assert _panel(hass) is None


async def test_the_panel_title_is_bounded(hass: HomeAssistant, hass_ws_client) -> None:
    """A sidebar label: the options flow cuts it, the websocket refuses a longer one."""
    assert clean_options({"panel_title": "x" * 80})["panel_title"] == "x" * 50
    await async_setup_component(hass, "http", {})
    await _setup(hass)
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "alarm_card/update_settings", "options": {"panel_title": "x" * 51}})
    assert not (await client.receive_json())["success"]


class _Resources:
    """Lovelace's resource collection in storage mode, in memory."""

    def __init__(self, items: list[dict], fail: bool = False) -> None:
        self.loaded = True
        self.items = items
        self.fail = fail

    def async_items(self) -> list[dict]:
        return list(self.items)

    async def async_create_item(self, data: dict) -> None:
        if self.fail:
            raise RuntimeError("storage down")
        self.items.append({"id": str(len(self.items) + 1), **data})

    async def async_update_item(self, item_id: str, data: dict) -> None:
        for item in self.items:
            if item["id"] == item_id:
                item.update(data)

    async def async_delete_item(self, item_id: str) -> None:
        self.items = [i for i in self.items if i["id"] != item_id]


async def test_the_card_resource_is_updated_and_duplicates_removed(hass: HomeAssistant) -> None:
    await async_setup_component(hass, "http", {})
    old = [
        {"id": "1", "res_type": "module", "url": "/alarm_card_static/alarm-card.js?v=old"},
        {"id": "2", "res_type": "module", "url": "/alarm_card_static/alarm-card.js"},
        {"id": "3", "res_type": "module", "url": "/local/other.js"},
    ]
    resources = _Resources(old)
    with patch("custom_components.alarm_card._lovelace_resources", return_value=(resources, "storage")):
        await _setup(hass)
    cards = [i for i in resources.items if i["url"].startswith("/alarm_card_static/alarm-card.js")]
    assert len(cards) == 1
    assert cards[0]["id"] == "1"
    assert cards[0]["url"] != "/alarm_card_static/alarm-card.js?v=old"
    assert any(i["url"] == "/local/other.js" for i in resources.items)


async def test_a_failing_resource_store_falls_back_to_an_extra_module(hass: HomeAssistant, stub_frontend) -> None:
    await async_setup_component(hass, "http", {})
    resources = _Resources([], fail=True)
    with patch("custom_components.alarm_card._lovelace_resources", return_value=(resources, "storage")):
        await _setup(hass)
    assert resources.items == []
    urls = [c.args[1] for c in stub_frontend.call_args_list]
    assert any(u.startswith("/alarm_card_static/alarm-card.js?v=") for u in urls)
