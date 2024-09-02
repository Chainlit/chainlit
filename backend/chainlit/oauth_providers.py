import warnings

warnings.warn(
    "The 'oauth_providers' module is deprecated and will be removed in a future version. "
    "Please use 'oauth' instead.",
    DeprecationWarning,
    stacklevel=2,
)

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
from chainlit.oauth.providers import (
    get_configured_oauth_providers,
    get_oauth_provider,
    providers,
)

__all__ = [
    "providers",
    "get_oauth_provider",
    "get_configured_oauth_providers",
    "OAuthProvider",
    "GithubOAuthProvider",
    "GoogleOAuthProvider",
    "AzureADOAuthProvider",
    "AzureADHybridOAuthProvider",
    "OktaOAuthProvider",
    "Auth0OAuthProvider",
    "DescopeOAuthProvider",
    "AWSCognitoOAuthProvider",
    "GitlabOAuthProvider",
]
