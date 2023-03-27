import os
import json
from subprocess import call
from pathlib import Path
from prisma import Prisma
from prisma.models import Conversation, Project, Message
from chainlit.config import config

db = None

def init_db():
    global db

    if config.db_path is None:
        raise ValueError("Config db path is None")

    PACKAGE_ROOT = Path(os.path.join(__file__, '..')).resolve()

    database_url = f'file:{config.db_path}'
    os.environ["DATABASE_URL"] = database_url

    call(["prisma", 'db', 'push'],
         cwd=PACKAGE_ROOT)

    db = Prisma(auto_register=True, datasource={
        'url': database_url,
    })
    db.connect()



def create_message(conversation_id: str, msg: dict):
    msg = msg.copy()
    if "llm_settings" in msg:
        msg["llm_settings"] = json.dumps(msg["llm_settings"])
    msg["conversation_id"] = conversation_id
    return Message.prisma().create(data=msg)


def get_conversations():
    conversations = Conversation.prisma().find_many(include={
        "messages": True
    })

    json_conversations = []

    for c in conversations:
        if not c.messages:
            continue
        messages = []
        for m in c.messages:
            if m.llm_settings:
                m.llm_settings = json.loads(m.llm_settings)
            messages.append(m.dict())
        conversation = c.dict(exclude={"messages": True})
        conversation["messages"] = messages
        json_conversations.append(conversation)
    return json_conversations
