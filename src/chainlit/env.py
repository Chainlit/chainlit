from chainlit.config import config
import os


class UserEnv():
    def __init__(self, user_env):
        self.user_env = user_env

    def __enter__(self):
        if self.user_env and config.user_env:
            for key in config.user_env:
                if key in self.user_env:
                    os.environ[key] = self.user_env[key]

    def __exit__(self, *args):
        if self.user_env and config.user_env:
            for key in config.user_env:
                if key in self.user_env:
                    os.environ[key] = ""
