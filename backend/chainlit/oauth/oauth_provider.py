import os
from typing import Dict, List, Tuple

from chainlit.user import User


class OAuthProvider:
    id: str
    env: List[str]
    client_id: str
    client_secret: str
    authorize_url: str
    authorize_params: Dict[str, str]

    def is_configured(self):
        return all([os.environ.get(env) for env in self.env])

    async def get_token(self, code: str, url: str) -> str:
        raise NotImplementedError()

    async def get_user_info(self, token: str) -> Tuple[Dict[str, str], User]:
        raise NotImplementedError()
