from chainlit.data import chainlit_client
from fastapi import HTTPException


async def is_conversation_author(username: str, conversation_id: str):
    if not chainlit_client:
        raise HTTPException(status_code=401, detail="Unauthorized")

    conversation_author = await chainlit_client.get_conversation_author(conversation_id)

    if conversation_author != username:
        raise HTTPException(status_code=401, detail="Unauthorized")
    else:
        return True
