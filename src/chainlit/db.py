import os
from pathlib import Path
from prisma import Prisma
from prisma.models import Conversation, Project, Message

db_file_path = Path(os.path.join(__file__, '..', 'database.db')).resolve()

db = Prisma(auto_register=True, datasource={
    'url': f'file:{db_file_path}',
})
db.connect()
