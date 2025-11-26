import pytest

from chainlit.types import (
    AskActionSpec,
    AskElementSpec,
    AskFileSpec,
    AskSpec,
    ChatProfile,
    CommandDict,
    DeleteFeedbackRequest,
    DeleteThreadRequest,
    Feedback,
    FeedbackDict,
    FileSpec,
    GetThreadsRequest,
    InputAudioChunk,
    PageInfo,
    PaginatedResponse,
    Pagination,
    ShareThreadRequest,
    Starter,
    Theme,
    ThreadFilter,
    UpdateThreadRequest,
)


class TestPageInfo:
    """Test suite for PageInfo class."""

    def test_page_info_initialization(self):
        """Test PageInfo with all fields."""
        page_info = PageInfo(
            hasNextPage=True,
            startCursor="cursor_start",
            endCursor="cursor_end",
        )

        assert page_info.hasNextPage is True
        assert page_info.startCursor == "cursor_start"
        assert page_info.endCursor == "cursor_end"

    def test_page_info_with_none_cursors(self):
        """Test PageInfo with None cursors."""
        page_info = PageInfo(
            hasNextPage=False,
            startCursor=None,
            endCursor=None,
        )

        assert page_info.hasNextPage is False
        assert page_info.startCursor is None
        assert page_info.endCursor is None

    def test_page_info_to_dict(self):
        """Test PageInfo serialization."""
        page_info = PageInfo(
            hasNextPage=True,
            startCursor="start",
            endCursor="end",
        )

        result = page_info.to_dict()

        assert result["hasNextPage"] is True
        assert result["startCursor"] == "start"
        assert result["endCursor"] == "end"

    def test_page_info_from_dict(self):
        """Test PageInfo deserialization."""
        data = {
            "hasNextPage": True,
            "startCursor": "abc",
            "endCursor": "xyz",
        }

        page_info = PageInfo.from_dict(data)

        assert page_info.hasNextPage is True
        assert page_info.startCursor == "abc"
        assert page_info.endCursor == "xyz"

    def test_page_info_from_dict_with_defaults(self):
        """Test PageInfo from empty dict uses defaults."""
        page_info = PageInfo.from_dict({})

        assert page_info.hasNextPage is False
        assert page_info.startCursor is None
        assert page_info.endCursor is None

    def test_page_info_from_dict_partial(self):
        """Test PageInfo from partial dict."""
        data = {"hasNextPage": True}

        page_info = PageInfo.from_dict(data)

        assert page_info.hasNextPage is True
        assert page_info.startCursor is None
        assert page_info.endCursor is None


class TestPagination:
    """Test suite for Pagination model."""

    def test_pagination_with_first_only(self):
        """Test Pagination with only first parameter."""
        pagination = Pagination(first=10)

        assert pagination.first == 10
        assert pagination.cursor is None

    def test_pagination_with_cursor(self):
        """Test Pagination with cursor."""
        pagination = Pagination(first=20, cursor="next_page_cursor")

        assert pagination.first == 20
        assert pagination.cursor == "next_page_cursor"


class TestThreadFilter:
    """Test suite for ThreadFilter model."""

    def test_thread_filter_empty(self):
        """Test ThreadFilter with no filters."""
        filter = ThreadFilter()

        assert filter.feedback is None
        assert filter.userId is None
        assert filter.search is None

    def test_thread_filter_with_feedback(self):
        """Test ThreadFilter with feedback filter."""
        filter = ThreadFilter(feedback=1)

        assert filter.feedback == 1

    def test_thread_filter_with_user_id(self):
        """Test ThreadFilter with userId."""
        filter = ThreadFilter(userId="user_123")

        assert filter.userId == "user_123"

    def test_thread_filter_with_search(self):
        """Test ThreadFilter with search query."""
        filter = ThreadFilter(search="hello world")

        assert filter.search == "hello world"

    def test_thread_filter_all_fields(self):
        """Test ThreadFilter with all fields."""
        filter = ThreadFilter(feedback=0, userId="user_456", search="test")

        assert filter.feedback == 0
        assert filter.userId == "user_456"
        assert filter.search == "test"


class TestFileSpec:
    """Test suite for FileSpec class."""

    def test_file_spec_with_list_accept(self):
        """Test FileSpec with list of accepted types."""
        spec = FileSpec(
            accept=["image/png", "image/jpeg"],
            max_files=5,
            max_size_mb=10,
        )

        assert spec.accept == ["image/png", "image/jpeg"]
        assert spec.max_files == 5
        assert spec.max_size_mb == 10

    def test_file_spec_with_dict_accept(self):
        """Test FileSpec with dict of accepted types."""
        spec = FileSpec(
            accept={"application/octet-stream": [".xyz", ".pdb"]},
            max_files=3,
            max_size_mb=50,
        )

        assert spec.accept == {"application/octet-stream": [".xyz", ".pdb"]}
        assert spec.max_files == 3
        assert spec.max_size_mb == 50


class TestAskSpec:
    """Test suite for AskSpec class."""

    def test_ask_spec_text_type(self):
        """Test AskSpec with text type."""
        spec = AskSpec(timeout=30, type="text", step_id="step_1")

        assert spec.timeout == 30
        assert spec.type == "text"
        assert spec.step_id == "step_1"

    def test_ask_spec_file_type(self):
        """Test AskSpec with file type."""
        spec = AskSpec(timeout=60, type="file", step_id="step_2")

        assert spec.type == "file"

    def test_ask_spec_action_type(self):
        """Test AskSpec with action type."""
        spec = AskSpec(timeout=120, type="action", step_id="step_3")

        assert spec.type == "action"


class TestAskFileSpec:
    """Test suite for AskFileSpec class."""

    def test_ask_file_spec(self):
        """Test AskFileSpec combines FileSpec and AskSpec."""
        spec = AskFileSpec(
            accept=["application/pdf"],
            max_files=1,
            max_size_mb=25,
            timeout=60,
            type="file",
            step_id="upload_step",
        )

        assert spec.accept == ["application/pdf"]
        assert spec.max_files == 1
        assert spec.max_size_mb == 25
        assert spec.timeout == 60
        assert spec.type == "file"
        assert spec.step_id == "upload_step"


class TestAskActionSpec:
    """Test suite for AskActionSpec class."""

    def test_ask_action_spec(self):
        """Test AskActionSpec with action keys."""
        spec = AskActionSpec(
            keys=["confirm", "cancel"],
            timeout=30,
            type="action",
            step_id="action_step",
        )

        assert spec.keys == ["confirm", "cancel"]
        assert spec.timeout == 30
        assert spec.type == "action"


class TestAskElementSpec:
    """Test suite for AskElementSpec class."""

    def test_ask_element_spec(self):
        """Test AskElementSpec with element_id."""
        spec = AskElementSpec(
            timeout=45,
            type="element",
            step_id="element_step",
            element_id="custom_element_1",
        )

        assert spec.timeout == 45
        assert spec.type == "element"
        assert spec.element_id == "custom_element_1"


class TestInputAudioChunk:
    """Test suite for InputAudioChunk class."""

    def test_input_audio_chunk(self):
        """Test InputAudioChunk initialization."""
        chunk = InputAudioChunk(
            isStart=True,
            mimeType="audio/wav",
            elapsedTime=1.5,
            data=b"audio_data_bytes",
        )

        assert chunk.isStart is True
        assert chunk.mimeType == "audio/wav"
        assert chunk.elapsedTime == 1.5
        assert chunk.data == b"audio_data_bytes"

    def test_input_audio_chunk_not_start(self):
        """Test InputAudioChunk when not start."""
        chunk = InputAudioChunk(
            isStart=False,
            mimeType="audio/mp3",
            elapsedTime=5.0,
            data=b"more_audio",
        )

        assert chunk.isStart is False
        assert chunk.elapsedTime == 5.0


class TestTheme:
    """Test suite for Theme enum."""

    def test_theme_light(self):
        """Test Theme light value."""
        assert Theme.light.value == "light"

    def test_theme_dark(self):
        """Test Theme dark value."""
        assert Theme.dark.value == "dark"

    def test_theme_is_string_enum(self):
        """Test Theme is a string enum."""
        assert isinstance(Theme.light, str)
        assert isinstance(Theme.dark, str)


class TestStarter:
    """Test suite for Starter class."""

    def test_starter_required_fields(self):
        """Test Starter with required fields only."""
        starter = Starter(label="Hello", message="Say hello")

        assert starter.label == "Hello"
        assert starter.message == "Say hello"
        assert starter.command is None
        assert starter.icon is None

    def test_starter_all_fields(self):
        """Test Starter with all fields."""
        starter = Starter(
            label="Custom",
            message="Custom message",
            command="/custom",
            icon="star",
        )

        assert starter.label == "Custom"
        assert starter.message == "Custom message"
        assert starter.command == "/custom"
        assert starter.icon == "star"


class TestChatProfile:
    """Test suite for ChatProfile class."""

    def test_chat_profile_required_fields(self):
        """Test ChatProfile with required fields."""
        profile = ChatProfile(
            name="default",
            markdown_description="Default profile",
        )

        assert profile.name == "default"
        assert profile.markdown_description == "Default profile"
        assert profile.icon is None
        assert profile.display_name is None
        assert profile.default is False
        assert profile.starters is None

    def test_chat_profile_all_fields(self):
        """Test ChatProfile with all fields."""
        starters = [Starter(label="Hi", message="Hello")]
        profile = ChatProfile(
            name="advanced",
            markdown_description="Advanced profile",
            icon="rocket",
            display_name="Advanced Mode",
            default=True,
            starters=starters,
        )

        assert profile.name == "advanced"
        assert profile.icon == "rocket"
        assert profile.display_name == "Advanced Mode"
        assert profile.default is True
        assert len(profile.starters) == 1


class TestFeedback:
    """Test suite for Feedback class."""

    def test_feedback_required_fields(self):
        """Test Feedback with required fields."""
        feedback = Feedback(forId="msg_123", value=1)

        assert feedback.forId == "msg_123"
        assert feedback.value == 1
        assert feedback.threadId is None
        assert feedback.id is None
        assert feedback.comment is None

    def test_feedback_all_fields(self):
        """Test Feedback with all fields."""
        feedback = Feedback(
            forId="msg_456",
            value=0,
            threadId="thread_789",
            id="feedback_001",
            comment="Not helpful",
        )

        assert feedback.forId == "msg_456"
        assert feedback.value == 0
        assert feedback.threadId == "thread_789"
        assert feedback.id == "feedback_001"
        assert feedback.comment == "Not helpful"

    def test_feedback_positive_value(self):
        """Test Feedback with positive value."""
        feedback = Feedback(forId="msg_1", value=1)
        assert feedback.value == 1

    def test_feedback_negative_value(self):
        """Test Feedback with negative value."""
        feedback = Feedback(forId="msg_2", value=0)
        assert feedback.value == 0


class TestUpdateThreadRequest:
    """Test suite for UpdateThreadRequest model."""

    def test_update_thread_request(self):
        """Test UpdateThreadRequest initialization."""
        request = UpdateThreadRequest(threadId="thread_123", name="New Name")

        assert request.threadId == "thread_123"
        assert request.name == "New Name"


class TestShareThreadRequest:
    """Test suite for ShareThreadRequest model."""

    def test_share_thread_request_shared(self):
        """Test ShareThreadRequest when sharing."""
        request = ShareThreadRequest(threadId="thread_456", isShared=True)

        assert request.threadId == "thread_456"
        assert request.isShared is True

    def test_share_thread_request_unshared(self):
        """Test ShareThreadRequest when unsharing."""
        request = ShareThreadRequest(threadId="thread_789", isShared=False)

        assert request.isShared is False


class TestDeleteThreadRequest:
    """Test suite for DeleteThreadRequest model."""

    def test_delete_thread_request(self):
        """Test DeleteThreadRequest initialization."""
        request = DeleteThreadRequest(threadId="thread_to_delete")

        assert request.threadId == "thread_to_delete"


class TestDeleteFeedbackRequest:
    """Test suite for DeleteFeedbackRequest model."""

    def test_delete_feedback_request(self):
        """Test DeleteFeedbackRequest initialization."""
        request = DeleteFeedbackRequest(feedbackId="feedback_to_delete")

        assert request.feedbackId == "feedback_to_delete"


class TestGetThreadsRequest:
    """Test suite for GetThreadsRequest model."""

    def test_get_threads_request(self):
        """Test GetThreadsRequest initialization."""
        pagination = Pagination(first=10)
        filter = ThreadFilter(search="test")

        request = GetThreadsRequest(pagination=pagination, filter=filter)

        assert request.pagination.first == 10
        assert request.filter.search == "test"


class TestPaginatedResponse:
    """Test suite for PaginatedResponse class."""

    def test_paginated_response_to_dict(self):
        """Test PaginatedResponse serialization."""
        page_info = PageInfo(hasNextPage=True, startCursor="a", endCursor="b")
        response = PaginatedResponse(pageInfo=page_info, data=["item1", "item2"])

        result = response.to_dict()

        assert result["pageInfo"]["hasNextPage"] is True
        assert result["data"] == ["item1", "item2"]

    def test_paginated_response_empty_data(self):
        """Test PaginatedResponse with empty data."""
        page_info = PageInfo(hasNextPage=False, startCursor=None, endCursor=None)
        response = PaginatedResponse(pageInfo=page_info, data=[])

        result = response.to_dict()

        assert result["data"] == []
        assert result["pageInfo"]["hasNextPage"] is False
