import os
from typing import Optional

from chainlit.config import config

_persister = None


def get_persister():
    global _persister
    if _persister is None:
        if config.data_persistence:
            pass
        else:
            pass
    return _persister
