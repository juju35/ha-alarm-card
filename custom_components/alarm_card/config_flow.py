"""Config flow for Alarm Card: one entry, whose options are the panel's settings."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    BooleanSelector,
    EntitySelector,
    EntitySelectorConfig,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
)

from .const import (
    CONF_ENTITY,
    CONF_HIDE_HEADER,
    CONF_ILLUSTRATION_THEME,
    CONF_PANEL_TABS,
    CONF_PANEL_TITLE,
    CONF_SIDEBAR_BADGE,
    DEFAULT_PANEL_TITLE,
    DEFAULT_SIDEBAR_BADGE,
    DOMAIN,
    HIDE_HEADER_CHOICES,
    HIDE_HEADER_OFF,
    PANEL_TABS,
    THEME_AUTO,
    THEME_CHOICES,
)


def clean_options(options: Mapping[str, Any]) -> dict[str, Any]:
    """Every option with its default, unknown keys and values dropped."""
    title = str(options.get(CONF_PANEL_TITLE) or "").strip() or DEFAULT_PANEL_TITLE
    hide = options.get(CONF_HIDE_HEADER)
    tabs = options.get(CONF_PANEL_TABS)
    theme = options.get(CONF_ILLUSTRATION_THEME)
    entity = str(options.get(CONF_ENTITY) or "").strip()
    return {
        CONF_PANEL_TITLE: title,
        CONF_HIDE_HEADER: hide if hide in HIDE_HEADER_CHOICES else HIDE_HEADER_OFF,
        # Kept in the panel's order; none chosen means every tab (Settings alone would be an empty panel).
        CONF_PANEL_TABS: [t for t in PANEL_TABS if t in tabs] if isinstance(tabs, list) and tabs else list(PANEL_TABS),
        CONF_SIDEBAR_BADGE: bool(options.get(CONF_SIDEBAR_BADGE, DEFAULT_SIDEBAR_BADGE)),
        CONF_ENTITY: entity if entity.startswith("alarm_control_panel.") else "",
        CONF_ILLUSTRATION_THEME: theme if theme in THEME_CHOICES else THEME_AUTO,
    }


def options_schema(options: Mapping[str, Any]) -> vol.Schema:
    """The options form, filled with the current values."""
    o = clean_options(options)

    def select(choices: tuple[str, ...], key: str, *, multiple: bool = False) -> SelectSelector:
        return SelectSelector(
            SelectSelectorConfig(
                options=list(choices),
                multiple=multiple,
                mode=SelectSelectorMode.LIST if multiple else SelectSelectorMode.DROPDOWN,
                translation_key=key,
            )
        )

    entity = {"suggested_value": o[CONF_ENTITY]} if o[CONF_ENTITY] else {}
    return vol.Schema(
        {
            vol.Required(CONF_PANEL_TITLE, default=o[CONF_PANEL_TITLE]): TextSelector(),
            vol.Required(CONF_HIDE_HEADER, default=o[CONF_HIDE_HEADER]): select(HIDE_HEADER_CHOICES, CONF_HIDE_HEADER),
            vol.Required(CONF_PANEL_TABS, default=o[CONF_PANEL_TABS]): select(
                PANEL_TABS, CONF_PANEL_TABS, multiple=True
            ),
            vol.Required(CONF_SIDEBAR_BADGE, default=o[CONF_SIDEBAR_BADGE]): BooleanSelector(),
            vol.Optional(CONF_ENTITY, description=entity): EntitySelector(
                EntitySelectorConfig(domain="alarm_control_panel")
            ),
            vol.Required(CONF_ILLUSTRATION_THEME, default=o[CONF_ILLUSTRATION_THEME]): select(
                THEME_CHOICES, CONF_ILLUSTRATION_THEME
            ),
        }
    )


class AlarmCardConfigFlow(ConfigFlow, domain=DOMAIN):
    """Add the integration: nothing to ask, the options hold the panel's settings."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title="Alarm Card", data={}, options=clean_options({}))
        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return AlarmCardOptionsFlow()


class AlarmCardOptionsFlow(OptionsFlow):
    """The panel's settings, the same as its Settings tab."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=clean_options(user_input))
        return self.async_show_form(step_id="init", data_schema=options_schema(self.config_entry.options))
