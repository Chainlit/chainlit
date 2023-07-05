import os
from chainlit.logger import logger
from chainlit.config import config, PACKAGE_ROOT

SCHEMA_PATH = os.path.join(PACKAGE_ROOT, "db/prisma/schema.prisma")


def db_push():
    from prisma.cli.prisma import run
    import prisma
    from importlib import reload

    args = ["db", "push", f"--schema={SCHEMA_PATH}"]
    env = {"LOCAL_DB_PATH": os.environ.get("LOCAL_DB_PATH")}
    run(args, env=env)

    # Without this the client will fail to initialize the first time.
    reload(prisma)


def init_local_db():
    use_local_db = config.project.database == "local"
    if use_local_db:
        if not os.path.exists(config.project.local_db_path):
            db_push()


def migrate_local_db():
    use_local_db = config.project.database == "local"
    if use_local_db:
        if os.path.exists(config.project.local_db_path):
            db_push()
            logger.info(f"Local db migrated")
        else:
            logger.info(f"Local db does not exist, skipping migration")
    else:
        logger.info(f"Database setting must be set to 'local' to migrate local db")
