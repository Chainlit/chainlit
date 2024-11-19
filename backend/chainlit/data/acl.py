from fastapi import HTTPException

from chainlit.data import get_data_layer


async def is_thread_author(username: str, thread_id: str):
    data_layer = get_data_layer()
    if not data_layer:
        raise HTTPException(status_code=400, detail="Data layer not initialized")

    thread_author = await data_layer.get_thread_author(thread_id)

    if not thread_author:
        raise HTTPException(status_code=404, detail="Thread not found")

    if thread_author != username:
        raise HTTPException(status_code=401, detail="Unauthorized")
    else:
        return True
