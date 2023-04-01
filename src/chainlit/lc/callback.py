from langchain.callbacks import get_callback_manager
from chainlit.uihandler import UiCallbackHandler


class LangchainCallback():
    def __init__(self, sdk):
        self.sdk = sdk

    def __enter__(self):
        self.handler = UiCallbackHandler(sdk=self.sdk)
        get_callback_manager()._callback_manager.add_handler(self.handler)

    def __exit__(self, *args):
        get_callback_manager()._callback_manager.remove_handler(self.handler)
