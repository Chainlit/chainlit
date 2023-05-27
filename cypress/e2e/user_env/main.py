import chainlit as cl


@cl.on_message
def main():
    key = "TEST_KEY"
    user_env = cl.user_session.get("env")
    provided_key = user_env.get(key)
    cl.Message(content=f"Key {key} has value {provided_key}").send()
