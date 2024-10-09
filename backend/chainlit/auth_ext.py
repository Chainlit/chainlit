from typing import Any

from cachetools import TTLCache

from chainlit.config import config

jwt_session_tokens: TTLCache = TTLCache(
    maxsize=8096, ttl=config.project.user_session_timeout
)
