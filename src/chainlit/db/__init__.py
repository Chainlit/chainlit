import os
from prisma.cli.prisma import run

from chainlit.logger import logger
from chainlit.config import config, PACKAGE_ROOT

SCHEMA_PATH = os.path.join(PACKAGE_ROOT, "db/prisma/schema.prisma")


def db_push():
    args = ["db", "push", f"--schema={SCHEMA_PATH}"]
    env = {"LOCAL_DB_PATH": os.environ.get("LOCAL_DB_PATH")}
    run(args, env=env)


def init_local_db():
    use_local_db = config.project.database == "local"
    if use_local_db:
        if not os.path.exists(config.project.local_db_path):
            db_push()
            logger.info(f"Local db created at: {config.project.local_db_path}")


def migrate_local_db():
    use_local_db = config.project.database == "local"
    if use_local_db:
        if os.path.exists(config.project.local_db_path):
            db_push()
            logger.info(f"Local db migrated")
    else:
        logger.info(f"Local db does not exist, skipping migration")
