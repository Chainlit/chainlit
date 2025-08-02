import pytest

from chainlit.config import SlackFeature, FeaturesSettings


class TestSlackConfiguration:
    def test_slack_feature_default_values(self):
        slack_feature = SlackFeature()
        assert slack_feature.reaction_on_message_received is False

    def test_slack_feature_enabled(self):
        slack_feature = SlackFeature(reaction_on_message_received=True)
        assert slack_feature.reaction_on_message_received is True

    def test_features_settings_includes_slack(self):
        features = FeaturesSettings()
        assert hasattr(features, 'slack')
        assert isinstance(features.slack, SlackFeature)
        assert features.slack.reaction_on_message_received is False

    def test_features_settings_custom_slack(self):
        slack_feature = SlackFeature(reaction_on_message_received=True)
        features = FeaturesSettings(slack=slack_feature)
        assert features.slack.reaction_on_message_received is True