"""Constants for the Alarm Card integration."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "alarm_card"
VERSION: Final = "2.1.4"

# Panel options, set in the panel's Settings tab or in Configure.
CONF_PANEL_TITLE: Final = "panel_title"
DEFAULT_PANEL_TITLE: Final = "Alarm"
# A sidebar label, not a text: longer would be cut off by the sidebar anyway.
PANEL_TITLE_MAX: Final = 50
# Who the panel's top bar (the illustrated header) is hidden for; the tabs and the menu button stay.
CONF_HIDE_HEADER: Final = "hide_header"
HIDE_HEADER_OFF: Final = "off"
HIDE_HEADER_CHOICES: Final = (HIDE_HEADER_OFF, "non_admin", "all")
# Tabs of the panel shown; Settings always is.
CONF_PANEL_TABS: Final = "panel_tabs"
PANEL_TABS: Final = ("general", "sensors", "codes", "actions", "timeline")
# The sidebar badge: the sensors keeping the alarm from arming, red while it is triggered.
CONF_SIDEBAR_BADGE: Final = "sidebar_badge"
DEFAULT_SIDEBAR_BADGE: Final = True
# The alarm shown in the panel's header and driven by its mode buttons;
# empty: Alarmo's master alarm, else its first area.
CONF_ENTITY: Final = "entity"
# Day or night picture of the header; auto follows Home Assistant's theme.
CONF_ILLUSTRATION_THEME: Final = "illustration_theme"
THEME_AUTO: Final = "auto"
THEME_CHOICES: Final = (THEME_AUTO, "day", "night")

FRONTEND_URL: Final = "/alarm_card_static"
CARD_FILENAME: Final = "alarm-card.js"
PANEL_FILENAME: Final = "alarm-panel.js"
BADGE_FILENAME: Final = "alarm-badge.js"
PANEL_ICON: Final = "mdi:shield-home"
PANEL_URL_PATH: Final = "alarm-panel"
PANEL_ELEMENT: Final = "alarm-card-panel"
