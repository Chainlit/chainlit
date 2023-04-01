import builtins
from chainlit.types import DocumentDisplay, LLMSettings
from typing import TYPE_CHECKING, Union
if TYPE_CHECKING:
    from chainlit.sdk import Chainlit

# def get_session_id() -> Union[str, None]:
#     names = [i[0].f_globals["__name__"] for i in inspect.stack()]

#     for name in names:
#         if name in sessions:
#             return name

#     return None


# def populate_session(cl: 'Chainlit'):
#     session_id = get_session_id()
#     if session_id:
#         print(f"chainlit session: {session_id}")
#         cl.session = sessions[session_id]
#     else:
#         print("No chainlit session found")


def get_sdk() -> Union['Chainlit', None]:
    attr = "__chainlit_sdk__"
    if hasattr(builtins, attr):
        return getattr(builtins, attr)


def callback_manager(handlers=None):
    sdk = get_sdk()
    if sdk:
        return sdk.callback_manager(handlers)
    else:
        return None


def send_text_document(text: str, name: str, display: DocumentDisplay = "side"):
    sdk = get_sdk()
    if sdk:
        sdk.send_text_document(text, name, display)


def send_local_image(path: str, name: str, display: DocumentDisplay = "side"):
    sdk = get_sdk()
    if sdk:
        sdk.send_local_image(path, name, display)


def send_message(author: str, content: str, prompt: str = None, language: str = None, indent=0, is_error=False, final=False, llm_settings: LLMSettings = None):
    sdk = get_sdk()
    if sdk:
        sdk.send_message(author, content, prompt, language,
                         indent, is_error, final, llm_settings)
