from chainlit.data import get_persister
from fastapi import HTTPException


async def is_thread_author(username: str, thread_id: str):
    persister = get_persister()
    if not persister:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # TODO: persister is not implemented yet
    # conversation_author = await chainlit_client.get_conversation_author(conversation_id)

    # if conversation_author != username:
    #     raise HTTPException(status_code=401, detail="Unauthorized")
    # else:
    #     return True
