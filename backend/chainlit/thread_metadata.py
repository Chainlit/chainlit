"""Filter thread metadata at browser response boundaries."""

import json
from typing import Optional

from chainlit.types import ThreadDict


def public_thread(
    thread: Optional[ThreadDict], *, include_settings: bool = False
) -> Optional[ThreadDict]:
    """Copy a thread with only browser-visible metadata, preserving stored state.

    Args:
        thread: Internal thread returned by the data layer, or None.
        include_settings: Include profile and settings for an owner's chat view.
    """
    if thread is None:
        return None

    metadata = thread.get("metadata") or {}
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except (TypeError, ValueError):
            metadata = {}
    if not isinstance(metadata, dict):
        metadata = {}

    allowed = {"is_shared", "viewer_read_only"}
    if include_settings:
        allowed.update({"chat_profile", "chat_settings"})

    return {
        **thread,
        "metadata": {
            key: value for key, value in metadata.items() if key in allowed
        },
    }
