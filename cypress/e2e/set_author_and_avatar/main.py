import chainlit as cl


@cl.on_chat_start
async def on_start():
    """Initialize the chat."""
    await cl.Message(
        content="""Welcome to the set_author_and_avatar test app!

Available test scenarios:
1. "test author" - Test changing author only
2. "test avatar" - Test changing avatar only  
3. "test both" - Test changing both author and avatar
4. "test extension" - Test avatar with file extension
5. "test metadata" - Test message with initial avatarName metadata"""
    ).send()


@cl.on_message
async def main(message: cl.Message):
    """Handle user messages and demonstrate set_author_and_avatar functionality."""
    user_msg = message.content.lower().strip()

    if user_msg == "test author":
        # Create a fresh message and change only the author
        test_msg = cl.Message(
            content="Original message from Assistant", author="Assistant"
        )
        await test_msg.send()

        # Change the author
        await test_msg.set_author_and_avatar(author="Dr. Watson")
        await cl.Message(content="✅ Author changed to 'Dr. Watson'").send()

    elif user_msg == "test avatar":
        # Create a fresh message and change only the avatar
        test_msg = cl.Message(content="Original message from Bob", author="Bob")
        await test_msg.send()

        # Change the avatar
        await test_msg.set_author_and_avatar(avatar="robot")
        await cl.Message(content="✅ Avatar changed to 'robot'").send()

    elif user_msg == "test both":
        # Create a fresh message and change both author and avatar
        test_msg = cl.Message(content="Original message from Helper", author="Helper")
        await test_msg.send()

        # Change both author and avatar
        await test_msg.set_author_and_avatar(
            author="Sherlock Holmes", avatar="detective"
        )
        await cl.Message(
            content="✅ Changed author to 'Sherlock Holmes' and avatar to 'detective'"
        ).send()

    elif user_msg == "test extension":
        # Create a fresh message and test avatar with extension
        test_msg = cl.Message(
            content="Original message from Researcher", author="Researcher"
        )
        await test_msg.send()

        # Change avatar with .png extension (should be stripped)
        await test_msg.set_author_and_avatar(avatar="scientist.png")
        await cl.Message(
            content="✅ Avatar changed to 'scientist.png' (extension should be stripped to 'scientist')"
        ).send()

    elif user_msg == "test metadata":
        # Create a message with initial avatarName in metadata
        test_msg = cl.Message(
            content="Message created with custom avatar metadata",
            author="Custom Bot",
            metadata={"avatarName": "robot"},
        )
        await test_msg.send()
        await cl.Message(
            content="✅ Message created with avatarName='robot' in metadata"
        ).send()

    else:
        # Show available commands for unknown input
        await cl.Message(
            content="""❓ Unknown command. Available test scenarios:

• **test author** - Test changing author only
• **test avatar** - Test changing avatar only  
• **test both** - Test changing both author and avatar
• **test extension** - Test avatar with file extension
• **test metadata** - Test message with initial avatarName metadata
"""
        ).send()
