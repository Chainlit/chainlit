import uuid
from unittest.mock import AsyncMock

import pytest

from chainlit.element import (
    Audio,
    CustomElement,
    Element,
    ElementDict,
    File,
    Image,
    Pdf,
    Task,
    TaskList,
    TaskStatus,
    Text,
    Video,
)


@pytest.mark.asyncio
class TestElementBase:
    """Test suite for the base Element class."""

    async def test_element_initialization_with_url(self, mock_chainlit_context):
        """Test Element initialization with URL."""
        async with mock_chainlit_context:
            element = File(name="test_file", url="https://example.com/file.pdf")

            assert element.name == "test_file"
            assert element.url == "https://example.com/file.pdf"
            assert isinstance(element.id, str)
            uuid.UUID(element.id)  # Verify valid UUID
            assert element.persisted is False
            assert element.updatable is False

    async def test_element_initialization_with_content(self, mock_chainlit_context):
        """Test Element initialization with content."""
        async with mock_chainlit_context:
            content = b"test content"
            element = File(name="test_file", content=content)

            assert element.name == "test_file"
            assert element.content == content
            assert element.url is None
            assert element.path is None

    async def test_element_initialization_with_path(self, mock_chainlit_context):
        """Test Element initialization with path."""
        async with mock_chainlit_context:
            element = File(name="test_file", path="/path/to/file.txt")

            assert element.name == "test_file"
            assert element.path == "/path/to/file.txt"
            assert element.url is None
            assert element.content is None

    async def test_element_requires_url_path_or_content(self, mock_chainlit_context):
        """Test that Element raises error without url, path, or content."""
        async with mock_chainlit_context:
            with pytest.raises(ValueError, match="Must provide url, path or content"):
                File(name="test_file")

    async def test_element_to_dict(self, mock_chainlit_context):
        """Test Element serialization to dictionary."""
        async with mock_chainlit_context as ctx:
            element = File(
                name="test_file",
                url="https://example.com/file.pdf",
                display="inline",
            )

            element_dict = element.to_dict()

            assert element_dict["name"] == "test_file"
            assert element_dict["url"] == "https://example.com/file.pdf"
            assert element_dict["type"] == "file"
            assert element_dict["id"] == element.id
            assert element_dict["threadId"] == ctx.session.thread_id
            assert element_dict["display"] == "inline"

    async def test_element_send(self, mock_chainlit_context):
        """Test Element.send() method."""
        async with mock_chainlit_context as ctx:
            element = File(name="test_file", url="https://example.com/file.pdf")

            await element.send(for_id="message_123")

            assert element.for_id == "message_123"
            ctx.emitter.send_element.assert_called_once()

    async def test_element_remove(self, mock_chainlit_context):
        """Test Element.remove() method."""
        async with mock_chainlit_context as ctx:
            element = File(name="test_file", url="https://example.com/file.pdf")

            await element.remove()

            ctx.emitter.emit.assert_called_once_with(
                "remove_element", {"id": element.id}
            )

    async def test_element_display_options(self, mock_chainlit_context):
        """Test Element display options."""
        async with mock_chainlit_context:
            element_inline = File(
                name="test", url="https://example.com/file.pdf", display="inline"
            )
            element_side = File(
                name="test", url="https://example.com/file.pdf", display="side"
            )
            element_page = File(
                name="test", url="https://example.com/file.pdf", display="page"
            )

            assert element_inline.display == "inline"
            assert element_side.display == "side"
            assert element_page.display == "page"

    async def test_element_from_dict_file(self, mock_chainlit_context):
        """Test Element.from_dict() for File type."""
        async with mock_chainlit_context:
            element_dict: ElementDict = {
                "id": str(uuid.uuid4()),
                "name": "test_file",
                "type": "file",
                "url": "https://example.com/file.pdf",
                "display": "inline",
            }

            element = Element.from_dict(element_dict)

            assert isinstance(element, File)
            assert element.name == "test_file"
            assert element.url == "https://example.com/file.pdf"

    async def test_element_from_dict_image(self, mock_chainlit_context):
        """Test Element.from_dict() for Image type."""
        async with mock_chainlit_context:
            element_dict: ElementDict = {
                "id": str(uuid.uuid4()),
                "name": "test_image",
                "type": "image",
                "url": "https://example.com/image.png",
                "display": "inline",
            }

            element = Element.from_dict(element_dict)

            assert isinstance(element, Image)
            assert element.name == "test_image"
            assert element.type == "image"

    async def test_element_infer_type_from_mime(self):
        """Test Element.infer_type_from_mime() method."""
        assert Element.infer_type_from_mime("image/png") == "image"
        assert Element.infer_type_from_mime("image/jpeg") == "image"
        assert Element.infer_type_from_mime("application/pdf") == "pdf"
        assert Element.infer_type_from_mime("audio/mp3") == "audio"
        assert Element.infer_type_from_mime("video/mp4") == "video"
        assert Element.infer_type_from_mime("text/plain") == "file"
        assert Element.infer_type_from_mime("application/json") == "file"


@pytest.mark.asyncio
class TestImageElement:
    """Test suite for Image element."""

    async def test_image_initialization(self, mock_chainlit_context):
        """Test Image element initialization."""
        async with mock_chainlit_context:
            image = Image(
                name="test_image",
                url="https://example.com/image.png",
                size="large",
            )

            assert image.type == "image"
            assert image.name == "test_image"
            assert image.size == "large"

    async def test_image_size_options(self, mock_chainlit_context):
        """Test Image size options."""
        async with mock_chainlit_context:
            small = Image(name="test", url="https://example.com/img.png", size="small")
            medium = Image(
                name="test", url="https://example.com/img.png", size="medium"
            )
            large = Image(name="test", url="https://example.com/img.png", size="large")

            assert small.size == "small"
            assert medium.size == "medium"
            assert large.size == "large"


@pytest.mark.asyncio
class TestTextElement:
    """Test suite for Text element."""

    async def test_text_initialization(self, mock_chainlit_context):
        """Test Text element initialization."""
        async with mock_chainlit_context:
            text = Text(name="test_text", content="Hello, World!", language="python")

            assert text.type == "text"
            assert text.name == "test_text"
            assert text.content == "Hello, World!"
            assert text.language == "python"

    async def test_text_without_language(self, mock_chainlit_context):
        """Test Text element without language."""
        async with mock_chainlit_context:
            text = Text(name="test_text", content="Plain text")

            assert text.language is None


@pytest.mark.asyncio
class TestPdfElement:
    """Test suite for Pdf element."""

    async def test_pdf_initialization(self, mock_chainlit_context):
        """Test Pdf element initialization."""
        async with mock_chainlit_context:
            pdf = Pdf(name="test_pdf", url="https://example.com/document.pdf", page=5)

            assert pdf.type == "pdf"
            assert pdf.name == "test_pdf"
            assert pdf.mime == "application/pdf"
            assert pdf.page == 5

    async def test_pdf_without_page(self, mock_chainlit_context):
        """Test Pdf element without page number."""
        async with mock_chainlit_context:
            pdf = Pdf(name="test_pdf", url="https://example.com/document.pdf")

            assert pdf.page is None


@pytest.mark.asyncio
class TestAudioElement:
    """Test suite for Audio element."""

    async def test_audio_initialization(self, mock_chainlit_context):
        """Test Audio element initialization."""
        async with mock_chainlit_context:
            audio = Audio(
                name="test_audio",
                url="https://example.com/audio.mp3",
                auto_play=True,
            )

            assert audio.type == "audio"
            assert audio.name == "test_audio"
            assert audio.auto_play is True

    async def test_audio_default_auto_play(self, mock_chainlit_context):
        """Test Audio element default auto_play."""
        async with mock_chainlit_context:
            audio = Audio(name="test_audio", url="https://example.com/audio.mp3")

            assert audio.auto_play is False


@pytest.mark.asyncio
class TestVideoElement:
    """Test suite for Video element."""

    async def test_video_initialization(self, mock_chainlit_context):
        """Test Video element initialization."""
        async with mock_chainlit_context:
            player_config = {"youtube": {"playerVars": {"showinfo": 1}}}
            video = Video(
                name="test_video",
                url="https://example.com/video.mp4",
                size="large",
                player_config=player_config,
            )

            assert video.type == "video"
            assert video.name == "test_video"
            assert video.size == "large"
            assert video.player_config == player_config

    async def test_video_without_player_config(self, mock_chainlit_context):
        """Test Video element without player config."""
        async with mock_chainlit_context:
            video = Video(name="test_video", url="https://example.com/video.mp4")

            assert video.player_config is None


@pytest.mark.asyncio
class TestFileElement:
    """Test suite for File element."""

    async def test_file_initialization(self, mock_chainlit_context):
        """Test File element initialization."""
        async with mock_chainlit_context:
            file = File(name="test_file", url="https://example.com/file.txt")

            assert file.type == "file"
            assert file.name == "test_file"

    async def test_file_with_content(self, mock_chainlit_context):
        """Test File element with content."""
        async with mock_chainlit_context:
            content = b"File content"
            file = File(name="test_file", content=content)

            assert file.content == content


@pytest.mark.asyncio
class TestTaskListElement:
    """Test suite for TaskList element."""

    async def test_tasklist_initialization(self, mock_chainlit_context):
        """Test TaskList element initialization."""
        async with mock_chainlit_context:
            tasklist = TaskList(name="test_tasklist")

            assert tasklist.type == "tasklist"
            assert tasklist.name == "test_tasklist"
            assert tasklist.tasks == []
            assert tasklist.status == "Ready"
            assert tasklist.updatable is True

    async def test_tasklist_add_task(self, mock_chainlit_context):
        """Test adding tasks to TaskList."""
        async with mock_chainlit_context:
            tasklist = TaskList(name="test_tasklist")
            task1 = Task(title="Task 1", status=TaskStatus.READY)
            task2 = Task(title="Task 2", status=TaskStatus.RUNNING)

            await tasklist.add_task(task1)
            await tasklist.add_task(task2)

            assert len(tasklist.tasks) == 2
            assert tasklist.tasks[0].title == "Task 1"
            assert tasklist.tasks[1].title == "Task 2"

    async def test_tasklist_preprocess_content(self, mock_chainlit_context):
        """Test TaskList content preprocessing."""
        async with mock_chainlit_context:
            tasklist = TaskList(name="test_tasklist", status="In Progress")
            task = Task(title="Test Task", status=TaskStatus.DONE)
            await tasklist.add_task(task)

            await tasklist.preprocess_content()

            assert isinstance(tasklist.content, str)
            assert "Test Task" in tasklist.content
            assert "done" in tasklist.content
            assert "In Progress" in tasklist.content


@pytest.mark.asyncio
class TestTaskClass:
    """Test suite for Task class."""

    def test_task_initialization(self):
        """Test Task initialization."""
        task = Task(title="Test Task", status=TaskStatus.READY)

        assert task.title == "Test Task"
        assert task.status == TaskStatus.READY
        assert task.forId is None

    def test_task_with_for_id(self):
        """Test Task with forId."""
        task = Task(title="Test Task", status=TaskStatus.RUNNING, forId="step_123")

        assert task.forId == "step_123"

    def test_task_status_enum(self):
        """Test TaskStatus enum values."""
        assert TaskStatus.READY.value == "ready"
        assert TaskStatus.RUNNING.value == "running"
        assert TaskStatus.FAILED.value == "failed"
        assert TaskStatus.DONE.value == "done"


@pytest.mark.asyncio
class TestCustomElement:
    """Test suite for CustomElement."""

    async def test_custom_element_initialization(self, mock_chainlit_context):
        """Test CustomElement initialization."""
        async with mock_chainlit_context:
            props = {"key1": "value1", "key2": 42}
            custom = CustomElement(name="test_custom", props=props)

            assert custom.type == "custom"
            assert custom.name == "test_custom"
            assert custom.props == props
            assert custom.mime == "application/json"
            assert custom.updatable is True

    async def test_custom_element_content_serialization(self, mock_chainlit_context):
        """Test CustomElement content serialization."""
        async with mock_chainlit_context:
            props = {"nested": {"data": [1, 2, 3]}}
            custom = CustomElement(name="test_custom", props=props)

            assert isinstance(custom.content, str)
            assert "nested" in custom.content
            assert "data" in custom.content

    async def test_custom_element_update(self, mock_chainlit_context):
        """Test CustomElement update method."""
        async with mock_chainlit_context as ctx:
            custom = CustomElement(
                name="test_custom",
                props={"key": "value"},
                url="https://example.com/custom",
            )
            custom.for_id = "message_123"

            await custom.update()

            ctx.emitter.send_element.assert_called()


@pytest.mark.asyncio
class TestElementEdgeCases:
    """Test suite for Element edge cases."""

    async def test_element_with_custom_id(self, mock_chainlit_context):
        """Test Element with custom ID."""
        async with mock_chainlit_context:
            custom_id = str(uuid.uuid4())
            element = File(
                id=custom_id, name="test_file", url="https://example.com/file.txt"
            )

            assert element.id == custom_id

    async def test_element_with_object_key(self, mock_chainlit_context):
        """Test Element with object_key."""
        async with mock_chainlit_context:
            element = File(
                name="test_file",
                url="https://example.com/file.txt",
                object_key="s3://bucket/key",
            )

            assert element.object_key == "s3://bucket/key"

    async def test_element_with_chainlit_key(self, mock_chainlit_context):
        """Test Element with chainlit_key."""
        async with mock_chainlit_context:
            element = File(
                name="test_file",
                url="https://example.com/file.txt",
                chainlit_key="chainlit_key_123",
            )

            assert element.chainlit_key == "chainlit_key_123"

    async def test_element_send_without_url_or_key_raises_error(
        self, mock_chainlit_context
    ):
        """Test that send() raises error without url or chainlit_key."""
        async with mock_chainlit_context as ctx:
            # Mock persist_file to not set chainlit_key
            ctx.session.persist_file = AsyncMock(return_value={"id": None})

            element = File(name="test_file", content=b"test content")

            with pytest.raises(ValueError, match="Must provide url or chainlit key"):
                await element.send(for_id="message_123", persist=False)

    async def test_element_from_dict_with_missing_fields(self, mock_chainlit_context):
        """Test Element.from_dict() with minimal fields."""
        async with mock_chainlit_context:
            element_dict: ElementDict = {
                "type": "file",
                "url": "https://example.com/file.txt",
            }

            element = Element.from_dict(element_dict)

            assert isinstance(element, File)
            assert element.name == ""
            assert element.url == "https://example.com/file.txt"

    async def test_element_id_uniqueness(self, mock_chainlit_context):
        """Test that each Element gets a unique ID."""
        async with mock_chainlit_context:
            element1 = File(name="file1", url="https://example.com/file1.txt")
            element2 = File(name="file2", url="https://example.com/file2.txt")
            element3 = File(name="file3", url="https://example.com/file3.txt")

            ids = {element1.id, element2.id, element3.id}
            assert len(ids) == 3  # All unique
