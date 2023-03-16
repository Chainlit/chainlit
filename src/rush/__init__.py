from langchain.callbacks.base import CallbackManager
from rush.inject import DocumentSpec
from rush.config import config

def callback_manager(handlers = None):
    if config.inject:
        return config.inject.callback_manager
    else:
        if handlers is None:
            return None
        else:
            return CallbackManager(handlers)

def send_local_image(path: str, spec: DocumentSpec):
    if not config.inject:
        pass
    else:
        return config.inject.send_local_image(path, spec)
    
def send_text_document(content: str, spec: DocumentSpec):
    print(config.inject)
    if not config.inject:
        pass
    else:
        print("SEND 1")
        return config.inject.send_text_document(content, spec)