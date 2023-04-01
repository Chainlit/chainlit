from chainlit.config import config
import os
import builtins


class UserEnv():
    def __init__(self, user_env):
        self.user_env = user_env

    def __enter__(self):
        if self.user_env and config.user_env:
            for key, _ in config.user_env.items():
                if key in self.user_env:
                    os.environ[key] = self.user_env[key]

    def __exit__(self, *args):
        if self.user_env and config.user_env:
            for key, _ in config.user_env.items():
                if key in self.user_env:
                    os.environ[key] = ""

class SDK():
    def __init__(self, sdk):
        self.sdk = sdk

    def __enter__(self):
        if self.sdk:
            builtins.__chainlit_sdk__ = self.sdk

    def __exit__(self, *args):
            builtins.__chainlit_sdk__ = None
