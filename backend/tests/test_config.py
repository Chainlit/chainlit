import json
import logging
from pathlib import Path

import pytest
from pydantic import ValidationError

from chainlit import config as chainlit_config
from chainlit.config import (
    ChainlitConfig,
    ChainlitConfigOverrides,
    FeaturesSettings,
    McpFeature,
    McpUserServersFeature,
    SseMcpServer,
    StdioMcpServer,
    StreamableHttpMcpServer,
)
from chainlit.version import __version__


@pytest.fixture
def translation_dir(tmp_path: Path) -> Path:
    """Minimal translation directory with a controlled set of locale files."""
    t_dir = tmp_path / "translations"
    t_dir.mkdir()

    files: dict[str, dict] = {
        "en-US.json": {"greeting": "Hello"},
        "es.json": {"greeting": "Hola"},
        "da-DK.json": {"greeting": "Hej"},
        "de-DE.json": {"greeting": "Hallo"},
        "zh-CN.json": {"greeting": "你好 CN"},
        "zh-TW.json": {"greeting": "你好 TW"},
    }
    for filename, content in files.items():
        (t_dir / filename).write_text(json.dumps(content), encoding="utf-8")

    return t_dir


class TestLoadTranslation:
    """Regression tests for the load_translation fallback chain."""

    def test_exact_match_regional(
        self,
        test_config: ChainlitConfig,
        translation_dir: Path,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """Exact regional locale (da-DK) resolves directly to its file."""
        monkeypatch.setattr(
            chainlit_config, "config_translation_dir", str(translation_dir)
        )
        assert test_config.load_translation("da-DK") == {"greeting": "Hej"}

    def test_exact_match_base(
        self,
        test_config: ChainlitConfig,
        translation_dir: Path,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """Exact base locale (es) resolves directly to its file."""
        monkeypatch.setattr(
            chainlit_config, "config_translation_dir", str(translation_dir)
        )
        assert test_config.load_translation("es") == {"greeting": "Hola"}

    def test_parent_fallback(
        self,
        test_config: ChainlitConfig,
        translation_dir: Path,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """Regional locale (es-419) falls back to base file (es.json) when no exact match."""
        monkeypatch.setattr(
            chainlit_config, "config_translation_dir", str(translation_dir)
        )
        assert test_config.load_translation("es-419") == {"greeting": "Hola"}

    def test_regional_variant_lookup(
        self,
        test_config: ChainlitConfig,
        translation_dir: Path,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """Base locale (da) resolves to regional file (da-DK.json) when no exact match exists."""
        monkeypatch.setattr(
            chainlit_config, "config_translation_dir", str(translation_dir)
        )
        assert test_config.load_translation("da") == {"greeting": "Hej"}

    def test_regional_variant_lookup_de(
        self,
        test_config: ChainlitConfig,
        translation_dir: Path,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """Base locale (de) resolves to regional file (de-DE.json) via variant lookup."""
        monkeypatch.setattr(
            chainlit_config, "config_translation_dir", str(translation_dir)
        )
        assert test_config.load_translation("de") == {"greeting": "Hallo"}

    def test_regional_variant_sorted_deterministic(
        self,
        test_config: ChainlitConfig,
        translation_dir: Path,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """When multiple regional variants exist, the first sorted match (zh-CN) is returned."""
        monkeypatch.setattr(
            chainlit_config, "config_translation_dir", str(translation_dir)
        )
        assert test_config.load_translation("zh") == {"greeting": "你好 CN"}

    def test_default_fallback_unknown_locale(
        self,
        test_config: ChainlitConfig,
        translation_dir: Path,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """Completely unknown locale (xx) falls back to en-US."""
        monkeypatch.setattr(
            chainlit_config, "config_translation_dir", str(translation_dir)
        )
        assert test_config.load_translation("xx") == {"greeting": "Hello"}

    def test_default_fallback_base_without_regional_variant(
        self,
        test_config: ChainlitConfig,
        translation_dir: Path,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """Base locale (fr) with no matching file at all falls back to en-US."""
        monkeypatch.setattr(
            chainlit_config, "config_translation_dir", str(translation_dir)
        )
        assert test_config.load_translation("fr") == {"greeting": "Hello"}


class TestLegacyMcpConfigDetection:
    """Chainlit 2.12.0 replaced the per-transport MCP sections
    ([features.mcp.sse], [features.mcp.stdio], [features.mcp.streamable-http])
    and the `allowed_executables` key with [[features.mcp.servers]] entries and
    [features.mcp.user_servers]. Pydantic's default extra="ignore" would
    otherwise silently drop these legacy keys (app boots, MCP looks enabled,
    but no servers are configured and the frontend hides the MCP button, with
    no error at all). This must fail loudly -- but ONLY when MCP is actually
    enabled. The pre-2.12.0 default config template (generated by every
    Chainlit app that never touched its MCP settings) ships all of these
    legacy sections with `features.mcp.enabled = false`; that overwhelming
    majority of deployments must keep booting cleanly after an upgrade.
    """

    # Verbatim MCP block from the pre-2.12.0 default config template
    # (see `DEFAULT_CONFIG_STR` in `chainlit/config.py` prior to 2.12.0).
    PRE_2_12_LEGACY_MCP_BLOCK = """[features.mcp.sse]
    enabled = true

[features.mcp.streamable-http]
    enabled = true

[features.mcp.stdio]
    enabled = true
    # Only the executables in the allow list can be used for MCP stdio server.
    # Only need the base name of the executable, e.g. "npx", not "/usr/bin/npx".
    # Please don't comment this line for now, we need it to parse the executable name.
    allowed_executables = [ "npx", "uvx" ]
"""

    @staticmethod
    def _write_config(tmp_path: Path, body: str) -> Path:
        config_toml = tmp_path / "config.toml"
        config_toml.write_text(body, encoding="utf-8")
        return config_toml

    @pytest.mark.parametrize(
        ("legacy_section", "expected_key"),
        [
            ("[features.mcp.sse]\nenabled = true\n", "[features.mcp.sse]"),
            ("[features.mcp.stdio]\nenabled = true\n", "[features.mcp.stdio]"),
            (
                '[features.mcp."streamable-http"]\nenabled = true\n',
                "[features.mcp.streamable-http]",
            ),
        ],
    )
    def test_legacy_transport_section_raises(
        self,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
        legacy_section: str,
        expected_key: str,
    ):
        config_toml = self._write_config(
            tmp_path,
            f"""
[project]

[features.mcp]
enabled = true

{legacy_section}

[UI]
name = "Assistant"

[meta]
generated_by = "{__version__}"
""",
        )
        monkeypatch.setattr(chainlit_config, "config_file", str(config_toml))

        with pytest.raises(ValueError, match="MCP config schema changed") as exc_info:
            chainlit_config.load_settings()

        message = str(exc_info.value)
        assert "2.12.0" in message
        assert expected_key in message
        assert "[[features.mcp.servers]]" in message
        assert "[features.mcp.user_servers]" in message

    def test_legacy_allowed_executables_raises(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        config_toml = self._write_config(
            tmp_path,
            f"""
[project]

[features.mcp]
enabled = true
allowed_executables = ["npx", "uvx"]

[UI]
name = "Assistant"

[meta]
generated_by = "{__version__}"
""",
        )
        monkeypatch.setattr(chainlit_config, "config_file", str(config_toml))

        with pytest.raises(ValueError, match="MCP config schema changed") as exc_info:
            chainlit_config.load_settings()

        assert "allowed_executables" in str(exc_info.value)

    def test_ignored_legacy_sections_are_logged(
        self,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
        caplog: pytest.LogCaptureFixture,
    ):
        """Booting is right when MCP is off, but it should not be silent.

        This check only runs once against the on-disk config, and a chat
        profile's `config_overrides` can enable MCP afterwards — at which point
        the legacy sections are gone and there are no servers, with nothing to
        explain why. The log line is the breadcrumb.
        """
        config_toml = self._write_config(
            tmp_path,
            f"""
[project]

[features.mcp]
enabled = false

{self.PRE_2_12_LEGACY_MCP_BLOCK}
[UI]
name = "Assistant"

[meta]
generated_by = "{__version__}"
""",
        )
        monkeypatch.setattr(chainlit_config, "config_file", str(config_toml))

        with caplog.at_level(logging.WARNING):
            chainlit_config.load_settings()

        assert "pre-2.12.0 MCP config sections" in caplog.text

    def test_legacy_nested_allowed_executables_is_named_exactly(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        """The real pre-2.12.0 schema nested allowed_executables under
        [features.mcp.stdio]; the error must name that exact location rather
        than only reporting the enclosing section."""
        config_toml = self._write_config(
            tmp_path,
            f"""
[project]

[features.mcp]
enabled = true

[features.mcp.stdio]
enabled = true
allowed_executables = ["npx", "uvx"]

[UI]
name = "Assistant"

[meta]
generated_by = "{__version__}"
""",
        )
        monkeypatch.setattr(chainlit_config, "config_file", str(config_toml))

        with pytest.raises(ValueError, match="MCP config schema changed") as exc_info:
            chainlit_config.load_settings()

        assert "features.mcp.stdio.allowed_executables" in str(exc_info.value)

    def test_new_style_mcp_config_loads_cleanly(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        config_toml = self._write_config(
            tmp_path,
            f"""
[project]

[features.mcp]
enabled = true

[[features.mcp.servers]]
name = "github"
type = "stdio"
command = "npx -y @modelcontextprotocol/server-github"

[[features.mcp.servers]]
name = "my-sse"
type = "sse"
url = "https://mcp.example.com/sse"

[features.mcp.user_servers]
enabled = true
allowed_urls = ["https://mcp.example.com"]

[UI]
name = "Assistant"

[meta]
generated_by = "{__version__}"
""",
        )
        monkeypatch.setattr(chainlit_config, "config_file", str(config_toml))

        settings = chainlit_config.load_settings()

        assert settings["features"].mcp.enabled is True
        assert len(settings["features"].mcp.servers) == 2
        assert settings["features"].mcp.user_servers.enabled is True
        assert settings["features"].mcp.user_servers.allowed_urls == [
            "https://mcp.example.com"
        ]

    def test_no_mcp_section_loads_cleanly(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        config_toml = self._write_config(
            tmp_path,
            f"""
[project]

[UI]
name = "Assistant"

[meta]
generated_by = "{__version__}"
""",
        )
        monkeypatch.setattr(chainlit_config, "config_file", str(config_toml))

        settings = chainlit_config.load_settings()

        assert settings["features"].mcp.enabled is False
        assert settings["features"].mcp.servers == []

    @pytest.mark.parametrize(
        "mcp_header",
        [
            pytest.param(
                "[features.mcp]\n    enabled = false\n",
                id="enabled_explicitly_false",
            ),
            pytest.param(
                "",
                id="enabled_key_absent",
            ),
        ],
    )
    def test_pre_2_12_default_template_does_not_brick_upgrade(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, mcp_header: str
    ):
        """Regression test: the exact pre-2.12.0 default config template --
        the one Chainlit itself generated into every app's .chainlit/config.toml
        -- contains all the legacy MCP sections with MCP disabled. Every
        deployment that ever ran `chainlit init` (or just started the app once)
        has this file on disk. If loading it raises, every such deployment is
        bricked on upgrade to 2.12.0. It must load cleanly instead.
        """
        config_toml = self._write_config(
            tmp_path,
            f"""
[project]

{mcp_header}
{self.PRE_2_12_LEGACY_MCP_BLOCK}

[UI]
name = "Assistant"

[meta]
generated_by = "{__version__}"
""",
        )
        monkeypatch.setattr(chainlit_config, "config_file", str(config_toml))

        settings = chainlit_config.load_settings()

        assert settings["features"].mcp.enabled is False
        assert settings["features"].mcp.servers == []


class TestMcpServersSurviveConfigOverrides:
    """A chat profile's `config_overrides` must be able to declare MCP servers.

    `with_overrides` round-trips the overrides through
    `model_dump(exclude_unset=True)` and back. `type` is the discriminator for
    the server union, so if it carries a default it is treated as "unset",
    dropped from the dump, and the union can no longer be resolved -- which
    surfaced as a 500 from `/project/settings` for any profile declaring MCP
    servers. Keeping `type` required is what prevents that.
    """

    @pytest.mark.parametrize(
        ("server", "expected_type"),
        [
            (
                StdioMcpServer(type="stdio", name="s", command="npx -y server"),
                "stdio",
            ),
            (
                SseMcpServer(type="sse", name="s", url="https://mcp.example.com/sse"),
                "sse",
            ),
            (
                StreamableHttpMcpServer(
                    type="streamable-http", name="s", url="https://mcp.example.com/mcp"
                ),
                "streamable-http",
            ),
        ],
        ids=["stdio", "sse", "streamable-http"],
    )
    def test_servers_survive_a_config_override_round_trip(
        self, server, expected_type: str
    ):
        overrides = ChainlitConfigOverrides(
            features=FeaturesSettings(
                mcp=McpFeature(enabled=True, servers=[server]),
            )
        )

        merged = chainlit_config.config.with_overrides(overrides)

        assert merged.features.mcp.enabled is True
        assert len(merged.features.mcp.servers) == 1
        assert merged.features.mcp.servers[0].type == expected_type
        assert merged.features.mcp.servers[0].name == "s"

    def test_discriminator_is_required_so_it_cannot_be_dropped(self):
        """A default on `type` is exactly what made it vanish from the dump."""
        with pytest.raises(ValidationError):
            SseMcpServer(name="s", url="https://mcp.example.com/sse")


class TestMcpServerNameValidation:
    """Duplicate `[[features.mcp.servers]]` names silently shadow each other:
    server.py's named-server lookup does `next(...)` and returns only the
    first exact-string match, while /project/settings serialises every
    entry -- so a second server with the same name is dead config with no
    warning. Names must also be non-empty. Enforced by a
    `model_validator(mode="after")` on McpFeature (not a raw-dict check next
    to `_check_legacy_mcp_config`) so it also fires when a chat profile's
    `config_overrides` mutate `mcp.servers` via `with_overrides` (see
    TestMcpServersSurviveConfigOverrides above), which a load_settings()-only
    check would miss.
    """

    @staticmethod
    def _write_config(tmp_path: Path, servers_block: str) -> Path:
        config_toml = tmp_path / "config.toml"
        config_toml.write_text(
            f"""
[project]

[features.mcp]
enabled = true

{servers_block}

[UI]
name = "Assistant"

[meta]
generated_by = "{__version__}"
""",
            encoding="utf-8",
        )
        return config_toml

    def test_duplicate_mcp_server_names_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        config_toml = self._write_config(
            tmp_path,
            """
[[features.mcp.servers]]
name = "github"
type = "stdio"
command = "npx -y @modelcontextprotocol/server-github"

[[features.mcp.servers]]
name = "github"
type = "sse"
url = "https://mcp.example.com/sse"
""",
        )
        monkeypatch.setattr(chainlit_config, "config_file", str(config_toml))

        with pytest.raises(ValueError, match="Duplicate MCP server name") as exc_info:
            chainlit_config.load_settings()

        assert "github" in str(exc_info.value)

    def test_duplicate_mcp_server_names_rejected_case_and_whitespace_insensitive(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        """Matches the runtime collision check in the /mcp handler, which
        also compares names with .strip().casefold()."""
        config_toml = self._write_config(
            tmp_path,
            """
[[features.mcp.servers]]
name = "Foo"
type = "stdio"
command = "npx -y server-a"

[[features.mcp.servers]]
name = " foo "
type = "stdio"
command = "npx -y server-b"
""",
        )
        monkeypatch.setattr(chainlit_config, "config_file", str(config_toml))

        with pytest.raises(ValueError, match="Duplicate MCP server name"):
            chainlit_config.load_settings()

    @pytest.mark.parametrize("name", ["", "   "], ids=["empty", "whitespace_only"])
    def test_empty_or_whitespace_only_mcp_server_name_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, name: str
    ):
        config_toml = self._write_config(
            tmp_path,
            f"""
[[features.mcp.servers]]
name = "{name}"
type = "stdio"
command = "npx -y server-a"
""",
        )
        monkeypatch.setattr(chainlit_config, "config_file", str(config_toml))

        with pytest.raises(ValueError, match="must not be empty or whitespace-only"):
            chainlit_config.load_settings()

    def test_duplicate_mcp_server_names_rejected_through_with_overrides(
        self, test_config: ChainlitConfig
    ):
        """Build the whole override chain with `model_construct`, which
        skips validators at every level -- McpFeature, FeaturesSettings, and
        ChainlitConfigOverrides -- so the duplicate exists in memory without
        ever being rejected by a normal constructor call. The only thing
        that still catches it is `with_overrides`'s
        `model_dump()` -> merge -> `model_validate()` round trip, which
        re-validates the merged data from scratch. That's the path this
        test exercises -- proof that the check lives at the model level and
        isn't tied to `load_settings()` parsing the on-disk TOML.
        """
        bad_mcp = McpFeature.model_construct(
            enabled=True,
            servers=[
                StdioMcpServer(type="stdio", name="dup", command="npx -y a"),
                StdioMcpServer(type="stdio", name="DUP", command="npx -y b"),
            ],
            user_servers=McpUserServersFeature(),
        )
        bad_features = FeaturesSettings.model_construct(mcp=bad_mcp)
        overrides = ChainlitConfigOverrides.model_construct(features=bad_features)

        with pytest.raises(ValueError, match="Duplicate MCP server name"):
            test_config.with_overrides(overrides)


class TestStdioMcpServerEnv:
    """StdioMcpServer must accept an optional `env` mapping so operators can
    express `KEY=value cmd args`-style credentials (e.g. GITHUB_TOKEN) that
    the deleted `validate_mcp_command` used to parse out of the inline
    command string.
    """

    def test_env_defaults_to_none(self):
        server = StdioMcpServer(
            type="stdio", name="github", command="npx -y server-github"
        )
        assert server.env is None

    def test_env_round_trips(self):
        server = StdioMcpServer(
            type="stdio",
            name="github",
            command="npx -y @modelcontextprotocol/server-github",
            env={"GITHUB_TOKEN": "abc123"},
        )
        assert server.env == {"GITHUB_TOKEN": "abc123"}

        dumped = server.model_dump()
        assert dumped["env"] == {"GITHUB_TOKEN": "abc123"}

        restored = StdioMcpServer.model_validate(dumped)
        assert restored.env == {"GITHUB_TOKEN": "abc123"}
