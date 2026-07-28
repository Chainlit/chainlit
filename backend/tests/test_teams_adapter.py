import importlib
from unittest.mock import MagicMock, call, patch


def _reload_teams_app(monkeypatch, env_vars: dict):
    """Reload chainlit.teams.app with the given environment variables set."""
    for key, value in env_vars.items():
        monkeypatch.setenv(key, value)
    # Remove keys not in env_vars so tests are independent
    for key in ("TEAMS_APP_ID", "TEAMS_APP_PASSWORD", "TEAMS_APP_TENANT_ID"):
        if key not in env_vars:
            monkeypatch.delenv(key, raising=False)

    teams_mod = importlib.import_module("chainlit.teams.app")
    return importlib.reload(teams_mod)


def test_teams_adapter_without_tenant(monkeypatch):
    """Omitting TEAMS_APP_TENANT_ID leaves channel_auth_tenant as None (multi-tenant)."""
    with (
        patch("botbuilder.core.BotFrameworkAdapterSettings") as mock_settings,
        patch("botbuilder.core.BotFrameworkAdapter"),
    ):
        mock_settings.return_value = MagicMock()
        _reload_teams_app(
            monkeypatch,
            {"TEAMS_APP_ID": "app-id", "TEAMS_APP_PASSWORD": "app-secret"},
        )
        assert mock_settings.call_count >= 1
        assert mock_settings.call_args_list[-1] == call(
            app_id="app-id",
            app_password="app-secret",
            channel_auth_tenant=None,
        )


def test_teams_adapter_with_tenant(monkeypatch):
    """Setting TEAMS_APP_TENANT_ID forwards the tenant to BotFrameworkAdapterSettings."""
    tenant_id = "00000000-0000-0000-0000-000000000001"
    with (
        patch("botbuilder.core.BotFrameworkAdapterSettings") as mock_settings,
        patch("botbuilder.core.BotFrameworkAdapter"),
    ):
        mock_settings.return_value = MagicMock()
        _reload_teams_app(
            monkeypatch,
            {
                "TEAMS_APP_ID": "app-id",
                "TEAMS_APP_PASSWORD": "app-secret",
                "TEAMS_APP_TENANT_ID": tenant_id,
            },
        )
        assert mock_settings.call_count >= 1
        assert mock_settings.call_args_list[-1] == call(
            app_id="app-id",
            app_password="app-secret",
            channel_auth_tenant=tenant_id,
        )
