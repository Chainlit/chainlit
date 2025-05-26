import unittest
from chainlit.message import Message, MessageBase # Adjust if MessageBase is not directly used or needed
from chainlit.context import init_context # Required for context initialization
from chainlit.session import WebsocketSession # Required for context
from chainlit.user import User # Required for context
from chainlit.config import init_config # Required for config init

# Mocking necessary parts for Message instantiation if not testing full context
class MockEmitter:
    async def send_step(self, step_dict):
        pass
    async def update_step(self, step_dict):
        pass
    async def delete_step(self, step_id):
        pass
    # Add other methods if Message interaction requires them

class MockWebsocketSession(WebsocketSession):
    def __init__(self, id="test_session_id", thread_id="test_thread_id", emit_fn=None, call_fn=None, client_type=None, user_env=None, user=None, token=None, chat_profile=None, environ=None):
        super().__init__(id, "test_socket_id", emit_fn or (lambda event, data: None), call_fn or (lambda event, data, timeout: None), client_type, user_env, user or User(identifier="test_user"), token, chat_profile, thread_id, environ)
        self.emitter = MockEmitter()

class TestMessageClass(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Initialize config (using default or test-specific config if available)
        init_config(True) # Assuming True sets up a basic/test config

    def setUp(self):
        # Initialize context for each test if Message relies on it
        # This is a simplified setup. If your Message class or its __post_init__
        # needs a more complete context, you'll need to expand this.
        session = MockWebsocketSession()
        init_context(session=session)


    def test_message_custom_widgets_population_on_init(self):
        metadata_with_widgets = {
            "custom_widgets": {"model_dropdown_widget": "gpt-4"},
            "location": "test_location"
        }
        
        # Test direct instantiation
        # __post_init__ in MessageBase is expected to handle custom_widgets from metadata
        msg = Message(content="Hello", author="User", metadata=metadata_with_widgets)

        self.assertIsNotNone(msg.custom_widgets, "custom_widgets should be populated")
        self.assertEqual(msg.custom_widgets.get("model_dropdown_widget"), "gpt-4", 
                         "custom_widgets 'model_dropdown_widget' value is incorrect")

        metadata_without_widgets = {"location": "test_location"}
        msg_no_widgets = Message(content="Hi", author="User", metadata=metadata_without_widgets)
        self.assertIsNone(msg_no_widgets.custom_widgets, 
                          "custom_widgets should be None when not in metadata")
        
        msg_empty_metadata = Message(content="Hola", author="User", metadata={})
        self.assertIsNone(msg_empty_metadata.custom_widgets,
                            "custom_widgets should be None for empty metadata")

        msg_none_metadata = Message(content="Bonjour", author="User", metadata=None)
        self.assertIsNone(msg_none_metadata.custom_widgets,
                            "custom_widgets should be None when metadata is None")


    def test_message_custom_widgets_population_from_dict(self):
        # This test relies on MessageBase.from_dict and how it handles metadata.
        # The actual dict structure for from_dict might be more complex than this example.
        # Adjust mock_payload based on the expected structure for StepDict.
        
        metadata_with_widgets = {
            "custom_widgets": {"model_select": "claude-2", "temperature": 0.7},
            "source": "from_dict_test"
        }
        mock_payload_with_widgets = {
            "id": "test_msg_id_1",
            "threadId": "test_thread_id_1", # threadId is used by __post_init__
            "parentId": None, # Optional
            "createdAt": "2023-01-01T12:00:00Z", # Example string
            "output": "Test message from dict", # Maps to content
            "name": "TestAuthor", # Maps to author
            "type": "user_message", # Or any valid MessageStepType
            "metadata": metadata_with_widgets,
            # Other fields like command, language, streaming, isError, waitForAnswer, tags
            # might be needed if from_dict or __init__ uses them.
        }

        # MessageBase.from_dict creates a Message instance
        msg_from_dict = MessageBase.from_dict(mock_payload_with_widgets)
        
        self.assertIsNotNone(msg_from_dict.custom_widgets, 
                             "custom_widgets should be populated from_dict")
        self.assertEqual(msg_from_dict.custom_widgets.get("model_select"), "claude-2")
        self.assertEqual(msg_from_dict.custom_widgets.get("temperature"), 0.7)

        metadata_without_widgets = {"source": "from_dict_test_no_widgets"}
        mock_payload_no_widgets = {
            "id": "test_msg_id_2",
            "threadId": "test_thread_id_2",
            "createdAt": "2023-01-01T12:01:00Z",
            "output": "Another test message",
            "name": "TestAuthor2",
            "type": "assistant_message",
            "metadata": metadata_without_widgets
        }
        msg_from_dict_no_widgets = MessageBase.from_dict(mock_payload_no_widgets)
        self.assertIsNone(msg_from_dict_no_widgets.custom_widgets,
                          "custom_widgets should be None from_dict when not in metadata")

if __name__ == '__main__':
    unittest.main()
