import os
from chainlit.logger import logger
from chainlit.config import config, PACKAGE_ROOT

SCHEMA_PATH = os.path.join(PACKAGE_ROOT, "db/prisma/schema.prisma")
POSTGRES_SCHEMA_PATH = os.path.join(
    PACKAGE_ROOT, "client/postgres/prisma/schema.prisma"
)


def local_db_push():
    from prisma.cli.prisma import run
    import prisma
    from importlib import reload

    args = ["db", "push", f"--schema={SCHEMA_PATH}"]
    env = {"LOCAL_DB_PATH": os.environ.get("LOCAL_DB_PATH")}
    run(args, env=env)

    # Without this the client will fail to initialize the first time.
    reload(prisma)


def postgres_db_push():
    import chainlit.client.postgres.prisma.app
    from chainlit.client.postgres.prisma.app.cli.prisma import run
    from importlib import reload

    args = ["db", "push", f"--schema={POSTGRES_SCHEMA_PATH}"]
    env = {"POSTGRES_DATABASE_URL": os.environ.get("POSTGRES_DATABASE_URL")}
    run(args, env=env)

    # Similar initialization than local_db_push
    reload(chainlit.client.postgres.prisma.app)


def init_local_db():
    use_local_db = config.project.database == "local"
    if use_local_db:
        if not os.path.exists(config.project.local_db_path):
            local_db_push()

    use_postgres_db = config.project.database == "postgres"
    if use_postgres_db:
        postgres_db_push()


def migrate_local_db():
    use_local_db = config.project.database == "local"
    use_postgres_db = config.project.database == "postgres"
    if use_local_db:
        if os.path.exists(config.project.local_db_path):
            local_db_push()
            logger.info(f"Local db migrated")
        else:
            logger.info(f"Local db does not exist, skipping migration")
    elif use_postgres_db:
        postgres_db_push()
        print("Postgres db migrated")
    else:
        logger.info(f"Database setting must be set to 'local' to migrate local db")
