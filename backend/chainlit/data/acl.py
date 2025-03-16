from fastapi import HTTPException

from chainlit.data import get_data_layer


async def has_thread_access(username: str, thread_id: str):
    """Check if a user has read access to a thread."""
    data_layer = get_data_layer()
    if not data_layer:
        raise HTTPException(status_code=400, detail="Data layer not initialized")

    # Get the thread to check if it's public
    thread = await data_layer.get_thread(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Allow access if the thread is public
    if thread.get("metadata", {}).get("is_shared"):
        return True

    # Check author access if not public
    thread_author = await data_layer.get_thread_author(thread_id)
    return thread_author == username


async def is_thread_author(username: str, thread_id: str):
    """Check if a user is the author of a thread (has write access)."""
    data_layer = get_data_layer()
    if not data_layer:
        raise HTTPException(status_code=400, detail="Data layer not initialized")

    # Get the thread
    thread = await data_layer.get_thread(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Check author access
    thread_author = await data_layer.get_thread_author(thread_id)
    if thread_author != username:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return True
