async def test_user_session_set_get(mock_chainlit_context, user_session):
    async with mock_chainlit_context as context:
        # Set up the mock context with a selected_assistant attribute
        context.session.selected_assistant = None

        # Test setting a value
        user_session.set("test_key", "test_value")

        # Test getting the value
        assert user_session.get("test_key") == "test_value"

        # Test getting a default value for a non-existent key
        assert user_session.get("non_existent_key", "default") == "default"

        # Test getting session-related values
        assert user_session.get("id") == context.session.id
        assert user_session.get("env") == context.session.user_env
        assert user_session.get("languages") == context.session.languages

        # Add a test for the selected_assistant
        assert (
            user_session.get("selected_assistant") == context.session.selected_assistant
        )
