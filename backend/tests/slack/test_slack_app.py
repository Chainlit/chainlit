import pytest
from unittest.mock import AsyncMock, Mock, patch

from chainlit.config import ChainlitConfig, FeaturesSettings, SlackFeature
from chainlit.slack.app import add_reaction_if_enabled, process_slack_message


class TestSlackApp:
    @pytest.fixture
    def mock_event(self):
        return {
            "channel": "C1234567890",
            "user": "U1234567890",
            "ts": "1234567890.123456",
            "text": "Hello bot",
            "files": []
        }

    @pytest.fixture
    def mock_slack_app(self):
        with patch("chainlit.slack.app.slack_app") as mock_app:
            mock_app.client.reactions_add = AsyncMock()
            yield mock_app

    @pytest.mark.asyncio
    async def test_add_reaction_when_enabled(self, mock_event, mock_slack_app):
        with patch("chainlit.slack.app.config") as mock_config:
            mock_config.features = FeaturesSettings(
                slack=SlackFeature(reaction_on_message_received=True)
            )
            
            await add_reaction_if_enabled(mock_event)
            
            mock_slack_app.client.reactions_add.assert_called_once_with(
                channel="C1234567890",
                timestamp="1234567890.123456",
                name="eyes"
            )

    @pytest.mark.asyncio
    async def test_add_reaction_when_disabled(self, mock_event, mock_slack_app):
        with patch("chainlit.slack.app.config") as mock_config:
            mock_config.features = FeaturesSettings(
                slack=SlackFeature(reaction_on_message_received=False)
            )
            
            await add_reaction_if_enabled(mock_event)
            
            mock_slack_app.client.reactions_add.assert_not_called()

    @pytest.mark.asyncio
    async def test_add_reaction_custom_emoji(self, mock_event, mock_slack_app):
        with patch("chainlit.slack.app.config") as mock_config:
            mock_config.features = FeaturesSettings(
                slack=SlackFeature(reaction_on_message_received=True)
            )
            
            await add_reaction_if_enabled(mock_event, "rocket")
            
            mock_slack_app.client.reactions_add.assert_called_once_with(
                channel="C1234567890",
                timestamp="1234567890.123456",
                name="rocket"
            )

    @pytest.mark.asyncio
    async def test_add_reaction_handles_exception(self, mock_event, mock_slack_app):
        with patch("chainlit.slack.app.config") as mock_config:
            mock_config.features = FeaturesSettings(
                slack=SlackFeature(reaction_on_message_received=True)
            )
            mock_slack_app.client.reactions_add.side_effect = Exception("API Error")
            
            with patch("chainlit.slack.app.logger") as mock_logger:
                await add_reaction_if_enabled(mock_event)
                
                mock_logger.warning.assert_called_once_with("Failed to add reaction: API Error")

    @pytest.mark.asyncio
    async def test_process_slack_message_calls_add_reaction(self, mock_event, mock_slack_app):
        with patch("chainlit.slack.app.config") as mock_config:
            mock_config.features = FeaturesSettings(
                slack=SlackFeature(reaction_on_message_received=True)
            )
            
            with patch("chainlit.slack.app.get_user") as mock_get_user, \
                 patch("chainlit.slack.app.HTTPSession") as mock_session, \
                 patch("chainlit.slack.app.init_slack_context") as mock_context, \
                 patch("chainlit.slack.app.download_slack_files", return_value=[]) as mock_download, \
                 patch("chainlit.slack.app.config.code") as mock_code_config, \
                 patch("chainlit.slack.app.Message") as mock_message:
                
                mock_get_user.return_value = Mock(metadata={"real_name": "Test User"})
                mock_code_config.on_chat_start = None
                mock_code_config.on_message = None
                mock_code_config.on_chat_end = None
                mock_message_instance = Mock()
                mock_message_instance.send = AsyncMock()
                mock_message.return_value = mock_message_instance
                mock_context_instance = Mock()
                mock_context_instance.session.delete = AsyncMock()
                mock_context.return_value = mock_context_instance
                
                await process_slack_message(
                    event=mock_event,
                    say=Mock(),
                    thread_id="test_thread",
                    thread_ts="1234567890.123456"
                )
                
                mock_slack_app.client.reactions_add.assert_called_once_with(
                    channel="C1234567890",
                    timestamp="1234567890.123456",
                    name="eyes"
                )