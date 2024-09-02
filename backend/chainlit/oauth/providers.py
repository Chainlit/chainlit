from typing import Optional

from chainlit.config import config
from chainlit.oauth.auth0_oauth_provider import Auth0OAuthProvider
from chainlit.oauth.aws_cognito_oauth_provider import AWSCognitoOAuthProvider
from chainlit.oauth.azure_ad_hubrid_oauth_provider import AzureADHybridOAuthProvider
from chainlit.oauth.azure_ad_oauth_provider import AzureADOAuthProvider
from chainlit.oauth.descope_oauth_provider import DescopeOAuthProvider
from chainlit.oauth.github import GithubOAuthProvider
from chainlit.oauth.gitlab_oauth_provider import GitlabOAuthProvider
from chainlit.oauth.google import GoogleOAuthProvider
from chainlit.oauth.oauth_provider import OAuthProvider
from chainlit.oauth.okta_oauth_provider import OktaOAuthProvider

custom_oauth = config.code.custom_oauth_provider
providers = (
    [
        GithubOAuthProvider(),
        GoogleOAuthProvider(),
        AzureADOAuthProvider(),
        AzureADHybridOAuthProvider(),
        OktaOAuthProvider(),
        Auth0OAuthProvider(),
        DescopeOAuthProvider(),
        AWSCognitoOAuthProvider(),
        GitlabOAuthProvider(),
    ]
    + [custom_oauth()]
    if custom_oauth
    else []
)


def get_oauth_provider(provider: str) -> Optional[OAuthProvider]:
    for p in providers:
        if p.id == provider:
            return p
    return None


def get_configured_oauth_providers():
    return [p.id for p in providers if p.is_configured()]
