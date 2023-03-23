import os
from subprocess import call
from pathlib import Path
from prisma import Prisma
from prisma.models import Conversation, Project, Message
from chainlit.config import config

PACKAGE_ROOT = Path(os.path.join(__file__, '..')).resolve()

if config.db_path is None:
    db_file_path = os.path.join(PACKAGE_ROOT, "database.db")
else:
    db_file_path = config.db_path

database_url = f'file:{db_file_path}'

os.environ["DATABASE_URL"] = database_url

if not os.path.exists(db_file_path):
    call(["prisma", 'db', 'push'],
         cwd=PACKAGE_ROOT)

db = Prisma(auto_register=True, datasource={
    'url': database_url,
})
db.connect()
