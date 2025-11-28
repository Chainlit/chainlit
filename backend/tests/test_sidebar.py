import pytest

from chainlit.element import File, Image, Text
from chainlit.sidebar import ElementSidebar


@pytest.mark.asyncio
class TestElementSidebar:
    """Test suite for ElementSidebar class."""

    async def test_set_title(self, mock_chainlit_context):
        """Test ElementSidebar.set_title() method."""
        async with mock_chainlit_context as ctx:
            await ElementSidebar.set_title("My Sidebar Title")

            ctx.emitter.emit.assert_called_once_with(
                "set_sidebar_title", "My Sidebar Title"
            )

    async def test_set_title_with_empty_string(self, mock_chainlit_context):
        """Test ElementSidebar.set_title() with empty string."""
        async with mock_chainlit_context as ctx:
            await ElementSidebar.set_title("")

            ctx.emitter.emit.assert_called_once_with("set_sidebar_title", "")

    async def test_set_title_with_special_characters(self, mock_chainlit_context):
        """Test ElementSidebar.set_title() with special characters."""
        async with mock_chainlit_context as ctx:
            title = "Title with 特殊字符 & symbols! 🎉"
            await ElementSidebar.set_title(title)

            ctx.emitter.emit.assert_called_once_with("set_sidebar_title", title)

    async def test_set_elements_with_single_element(self, mock_chainlit_context):
        """Test ElementSidebar.set_elements() with a single element."""
        async with mock_chainlit_context as ctx:
            element = File(name="test.txt", url="https://example.com/test.txt")

            await ElementSidebar.set_elements([element])

            # Verify element.send() was called
            ctx.emitter.send_element.assert_called_once()

            # Verify emit was called with correct structure
            ctx.emitter.emit.assert_called_once()
            call_args = ctx.emitter.emit.call_args
            assert call_args[0][0] == "set_sidebar_elements"
            assert "elements" in call_args[0][1]
            assert "key" in call_args[0][1]
            assert len(call_args[0][1]["elements"]) == 1
            assert call_args[0][1]["key"] is None

    async def test_set_elements_with_multiple_elements(self, mock_chainlit_context):
        """Test ElementSidebar.set_elements() with multiple elements."""
        async with mock_chainlit_context as ctx:
            elements = [
                File(name="file1.txt", url="https://example.com/file1.txt"),
                Image(name="image1.png", url="https://example.com/image1.png"),
                Text(name="text1", content="Some text content"),
            ]

            await ElementSidebar.set_elements(elements)

            # Verify all elements were sent (3 send_element calls)
            assert ctx.emitter.send_element.call_count == 3

            # Verify emit was called with all elements
            ctx.emitter.emit.assert_called_once()
            call_args = ctx.emitter.emit.call_args
            assert call_args[0][0] == "set_sidebar_elements"
            assert len(call_args[0][1]["elements"]) == 3

    async def test_set_elements_with_empty_list(self, mock_chainlit_context):
        """Test ElementSidebar.set_elements() with empty list (closes sidebar)."""
        async with mock_chainlit_context as ctx:
            await ElementSidebar.set_elements([])

            # No elements to send
            ctx.emitter.send_element.assert_not_called()

            # Emit should still be called with empty elements
            ctx.emitter.emit.assert_called_once()
            call_args = ctx.emitter.emit.call_args
            assert call_args[0][0] == "set_sidebar_elements"
            assert call_args[0][1]["elements"] == []
            assert call_args[0][1]["key"] is None

    async def test_set_elements_with_key(self, mock_chainlit_context):
        """Test ElementSidebar.set_elements() with a key."""
        async with mock_chainlit_context as ctx:
            element = File(name="test.txt", url="https://example.com/test.txt")
            key = "my_sidebar_key"

            await ElementSidebar.set_elements([element], key=key)

            # Verify emit was called with the key
            ctx.emitter.emit.assert_called_once()
            call_args = ctx.emitter.emit.call_args
            assert call_args[0][1]["key"] == key

    async def test_set_elements_with_for_id(self, mock_chainlit_context):
        """Test ElementSidebar.set_elements() with elements that have for_id."""
        async with mock_chainlit_context as ctx:
            element = File(
                name="test.txt",
                url="https://example.com/test.txt",
                for_id="message_123",
            )

            await ElementSidebar.set_elements([element])

            # Element should be sent with its for_id
            ctx.emitter.send_element.assert_called_once()

            # Verify emit was called
            ctx.emitter.emit.assert_called_once()

    async def test_set_elements_without_for_id(self, mock_chainlit_context):
        """Test ElementSidebar.set_elements() with elements without for_id."""
        async with mock_chainlit_context as ctx:
            element = File(name="test.txt", url="https://example.com/test.txt")

            await ElementSidebar.set_elements([element])

            # Element should be sent with empty string for_id
            ctx.emitter.send_element.assert_called_once()

            # Verify emit was called
            ctx.emitter.emit.assert_called_once()

    async def test_set_elements_persist_false(self, mock_chainlit_context):
        """Test that set_elements() sends elements with persist=False."""
        async with mock_chainlit_context as ctx:
            # Mock persist_file to provide chainlit_key
            ctx.session.persist_file.return_value = {"id": "test_key"}

            element = File(name="test.txt", content=b"test content")

            await ElementSidebar.set_elements([element])

            # persist_file is still called to get chainlit_key, even with persist=False
            # The persist=False affects data layer persistence, not file upload
            ctx.session.persist_file.assert_called_once()

            # Verify element was sent
            ctx.emitter.send_element.assert_called_once()

    async def test_set_elements_serialization(self, mock_chainlit_context):
        """Test that elements are properly serialized in set_elements()."""
        async with mock_chainlit_context as ctx:
            file_elem = File(name="file.txt", url="https://example.com/file.txt")
            image_elem = Image(
                name="image.png", url="https://example.com/image.png", size="large"
            )

            await ElementSidebar.set_elements([file_elem, image_elem])

            # Verify emit was called with serialized elements
            call_args = ctx.emitter.emit.call_args
            elements_data = call_args[0][1]["elements"]

            assert len(elements_data) == 2
            assert elements_data[0]["name"] == "file.txt"
            assert elements_data[0]["type"] == "file"
            assert elements_data[1]["name"] == "image.png"
            assert elements_data[1]["type"] == "image"
            assert elements_data[1]["size"] == "large"


@pytest.mark.asyncio
class TestElementSidebarEdgeCases:
    """Test suite for ElementSidebar edge cases."""

    async def test_set_title_multiple_times(self, mock_chainlit_context):
        """Test calling set_title() multiple times."""
        async with mock_chainlit_context as ctx:
            await ElementSidebar.set_title("First Title")
            await ElementSidebar.set_title("Second Title")
            await ElementSidebar.set_title("Third Title")

            assert ctx.emitter.emit.call_count == 3

            # Verify last call had the third title
            last_call = ctx.emitter.emit.call_args
            assert last_call[0][1] == "Third Title"

    async def test_set_elements_multiple_times(self, mock_chainlit_context):
        """Test calling set_elements() multiple times."""
        async with mock_chainlit_context as ctx:
            element1 = File(name="file1.txt", url="https://example.com/file1.txt")
            element2 = File(name="file2.txt", url="https://example.com/file2.txt")

            await ElementSidebar.set_elements([element1])
            await ElementSidebar.set_elements([element2])

            # Should have sent both elements
            assert ctx.emitter.send_element.call_count == 2

            # Should have emitted twice
            assert ctx.emitter.emit.call_count == 2

    async def test_set_elements_with_same_key_twice(self, mock_chainlit_context):
        """Test calling set_elements() with the same key twice."""
        async with mock_chainlit_context as ctx:
            element1 = File(name="file1.txt", url="https://example.com/file1.txt")
            element2 = File(name="file2.txt", url="https://example.com/file2.txt")

            await ElementSidebar.set_elements([element1], key="same_key")
            await ElementSidebar.set_elements([element2], key="same_key")

            # Both should be sent (server doesn't prevent this)
            assert ctx.emitter.send_element.call_count == 2
            assert ctx.emitter.emit.call_count == 2

    async def test_set_elements_with_different_keys(self, mock_chainlit_context):
        """Test calling set_elements() with different keys."""
        async with mock_chainlit_context as ctx:
            element1 = File(name="file1.txt", url="https://example.com/file1.txt")
            element2 = File(name="file2.txt", url="https://example.com/file2.txt")

            await ElementSidebar.set_elements([element1], key="key1")
            await ElementSidebar.set_elements([element2], key="key2")

            assert ctx.emitter.emit.call_count == 2

            # Verify different keys were used
            calls = ctx.emitter.emit.call_args_list
            assert calls[0][0][1]["key"] == "key1"
            assert calls[1][0][1]["key"] == "key2"

    async def test_set_elements_with_large_number_of_elements(
        self, mock_chainlit_context
    ):
        """Test set_elements() with many elements."""
        async with mock_chainlit_context as ctx:
            # Create 50 elements
            elements = [
                File(name=f"file{i}.txt", url=f"https://example.com/file{i}.txt")
                for i in range(50)
            ]

            await ElementSidebar.set_elements(elements)

            # All 50 elements should be sent
            assert ctx.emitter.send_element.call_count == 50

            # Verify emit was called with all 50 elements
            call_args = ctx.emitter.emit.call_args
            assert len(call_args[0][1]["elements"]) == 50

    async def test_set_title_and_set_elements_together(self, mock_chainlit_context):
        """Test using set_title() and set_elements() together."""
        async with mock_chainlit_context as ctx:
            await ElementSidebar.set_title("My Documents")

            elements = [
                File(name="doc1.pdf", url="https://example.com/doc1.pdf"),
                File(name="doc2.pdf", url="https://example.com/doc2.pdf"),
            ]
            await ElementSidebar.set_elements(elements)

            # Verify both methods were called
            assert ctx.emitter.emit.call_count == 2

            # Verify the calls were correct
            calls = ctx.emitter.emit.call_args_list
            assert calls[0][0][0] == "set_sidebar_title"
            assert calls[0][0][1] == "My Documents"
            assert calls[1][0][0] == "set_sidebar_elements"

    async def test_set_elements_with_mixed_element_types(self, mock_chainlit_context):
        """Test set_elements() with various element types."""
        async with mock_chainlit_context as ctx:
            elements = [
                File(name="document.pdf", url="https://example.com/doc.pdf"),
                Image(
                    name="photo.jpg", url="https://example.com/photo.jpg", size="medium"
                ),
                Text(name="notes", content="Some important notes"),
            ]

            await ElementSidebar.set_elements(elements)

            # Verify all different types were sent
            assert ctx.emitter.send_element.call_count == 3

            # Verify serialization includes type information
            call_args = ctx.emitter.emit.call_args
            elements_data = call_args[0][1]["elements"]

            assert elements_data[0]["type"] == "file"
            assert elements_data[1]["type"] == "image"
            assert elements_data[2]["type"] == "text"

    async def test_set_title_with_long_string(self, mock_chainlit_context):
        """Test set_title() with a very long title."""
        async with mock_chainlit_context as ctx:
            long_title = "A" * 1000  # 1000 character title

            await ElementSidebar.set_title(long_title)

            ctx.emitter.emit.assert_called_once_with("set_sidebar_title", long_title)
