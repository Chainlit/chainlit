import cachetools
from chainlit.config import config

# This blacklist blocks out JWT Tokens when users click "Log out" / "Sign out" manually
jwt_blacklist = cachetools.TTLCache(
    maxsize=8096, ttl=config.project.user_session_timeout
)
