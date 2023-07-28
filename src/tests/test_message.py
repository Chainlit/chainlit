import unittest.mock
import uuid

import pytest

from chainlit.message import Message


def fake_get_emitter():
    FakeEmitter = unittest.mock.MagicMock()
    return FakeEmitter


@unittest.mock.patch("chainlit.message.get_emitter", new=fake_get_emitter)
def test_Message_init():
    test_content = "Test Content"
    test_author = "Test Author"

    msg = Message(content=test_content, author=test_author)

    assert msg.content == test_content
    assert msg.author == test_author
    assert uuid.UUID(msg.id).version == 4
    assert msg.emitter is not None


@unittest.mock.patch("chainlit.message.get_emitter", new=fake_get_emitter)
def test_Message_dict():
    test_content = "Test Content"
    test_author = "Test Author"

    msg = Message(content=test_content, author=test_author)

    msg2 = Message.from_dict(msg.to_dict())

    assert msg.content == msg2.content
    assert msg.author == msg2.author
    assert msg.id == msg2.id
