import os
from subprocess import call
from prisma import Prisma
from prisma.models import User, Project, UserToProject
from chainlit.config import config

DEFAULT_USER = "ADMIN"
db = None


def seed_data():
    user = User.prisma().find_unique(where={"name": DEFAULT_USER})

    if user is None:
        user = User.prisma().create(data={"name": DEFAULT_USER})

    project = Project.prisma().find_unique(where={"name": config.module})
    if project is None:
        project = Project.prisma().create(
            data={"name": config.module_name, "authorId": user.id})
        UserToProject.prisma().create(
            data={"userId": user.id, "projectId": project.id})

    config.project = project


def init_local_db():
    global db

    if config.local_db_path is None:
        raise ValueError("Config db path is None")

    database_url = f'file:{config.local_db_path}'
    os.environ["DATABASE_URL"] = database_url

    call(["prisma", 'db', 'push'],
         cwd=config.root)

    db = Prisma(auto_register=True, datasource={
        'url': database_url,
    })
    db.connect()
    seed_data()
