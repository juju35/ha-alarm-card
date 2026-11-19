"""Fixtures for the Alarm Card tests."""

import logging
import os
from unittest.mock import patch

import pytest
from homeassistant.components import http
from homeassistant.helpers import frame

from custom_components.alarm_card.const import DOMAIN

FILES = ("alarm-card.js", "alarm-panel.js", "alarm-badge.js")


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Load custom_components/ in every test."""
    yield


class _DeprecationRecorder(logging.Handler):
    """Collects Home Assistant deprecation reports that name this integration."""

    def __init__(self) -> None:
        super().__init__(logging.WARNING)
        self.messages: list[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        message = record.getMessage()
        lowered = message.lower()
        reported = record.name == frame.__name__ or "deprecated" in lowered or "will stop working" in lowered
        if reported and (f"'{DOMAIN}'" in message or f"custom_components/{DOMAIN}/" in message):
            self.messages.append(message)


@pytest.fixture(autouse=True)
def no_deprecated_calls():
    """Fail a test whose code path makes Home Assistant report a deprecated call of this integration."""
    getattr(frame, "_REPORTED_INTEGRATIONS", set()).clear()
    recorder = _DeprecationRecorder()
    root = logging.getLogger()
    root.addHandler(recorder)
    try:
        yield
    finally:
        root.removeHandler(recorder)
    if recorder.messages and (path := os.environ.get("DEPRECATIONS_LOG")):
        with open(path, "a", encoding="utf-8") as log:
            log.writelines(f"{m}\n" for m in recorder.messages)
    assert not recorder.messages, "\n".join(recorder.messages)


@pytest.fixture(autouse=True)
def frontend_dir(tmp_path):
    """The built frontend (npm run build) stands in a temporary folder: the tests need no Node."""
    folder = tmp_path / "frontend"
    folder.mkdir()
    for name in FILES:
        (folder / name).write_text(f"// {name}\n", encoding="utf-8")
    with patch("custom_components.alarm_card.FRONTEND_DIR", folder):
        yield folder


@pytest.fixture(autouse=True)
def stub_frontend():
    """The real frontend needs the hass_frontend package, which tests don't install."""
    with (
        patch("homeassistant.components.frontend.async_setup", return_value=True),
        patch("custom_components.alarm_card.add_extra_js_url") as add_js,
    ):
        if hasattr(http, "start_http_server_and_save_config"):
            with patch.object(http, "start_http_server_and_save_config"):
                yield add_js
        else:
            yield add_js
