import datetime
import uuid
from unittest.mock import ANY, AsyncMock, Mock, patch

import pytest
from httpx import HTTPStatusError, RequestError
from literalai import (
    AsyncLiteralClient,
    Attachment,
    Attachment as LiteralAttachment,
    PageInfo,
    PaginatedResponse,
    Score as LiteralScore,
    Step as LiteralStep,
    Thread,
    Thread as LiteralThread,
    User as LiteralUser,
    UserDict,
)
from literalai.api import AsyncLiteralAPI
from literalai.observability.step import (
    AttachmentDict as LiteralAttachmentDict,
    StepDict as LiteralStepDict,
)
from literalai.observability.thread import ThreadDict as LiteralThreadDict

from chainlit.data.literalai import LiteralDataLayer, LiteralToChainlitConverter
from chainlit.element import Audio, File, Image, Pdf, Text, Video
from chainlit.step import Step, StepDict
from chainlit.types import (
    Feedback,
    Pagination,
    ThreadFilter,
)
from chainlit.user import PersistedUser, User


@pytest.fixture
async def mock_literal_client(monkeypatch: pytest.MonkeyPatch):
    client = Mock(spec=AsyncLiteralClient)
    client.api = AsyncMock(spec=AsyncLiteralAPI)
    monkeypatch.setattr("literalai.AsyncLiteralClient", client)
    return client


@pytest.fixture
async def literal_data_layer(mock_literal_client):
    data_layer = LiteralDataLayer(api_key="fake_api_key", server="https://fake.server")
    data_layer.client = mock_literal_client
    return data_layer


@pytest.fixture
def test_thread():
    return LiteralThread.from_dict(
        {
            "id": "test_thread_id",
            "name": "Test Thread",
            "createdAt": "2023-01-01T00:00:00Z",
            "metadata": {},
            "participant": {},
            "steps": [],
            "tags": [],
        }
    )


@pytest.fixture
def test_step_dict(test_thread) -> StepDict:
    return {
        "createdAt": "2023-01-01T00:00:00Z",
        "start": "2023-01-01T00:00:00Z",
        "end": "2023-01-01T00:00:00Z",
        "generation": {},
        "id": "test_step_id",
        "name": "Test Step",
        "threadId": test_thread.id,
        "type": "user_message",
        "tags": [],
        "metadata": {"key": "value"},
        "input": "test input",
        "output": "test output",
        "waitForAnswer": True,
        "showInput": True,
        "language": "en",
    }


@pytest.fixture
def test_step(test_thread: LiteralThread):
    return LiteralStep.from_dict(
        {
            "id": str(uuid.uuid4()),
            "name": "Test Step",
            "type": "user_message",
            "environment": None,
            "threadId": test_thread.id,
            "error": None,
            "input": {},
            "output": {},
            "metadata": {},
            "tags": [],
            "parentId": None,
            "createdAt": "2023-01-01T00:00:00Z",
            "startTime": "2023-01-01T00:00:00Z",
            "endTime": "2023-01-01T00:00:00Z",
            "generation": {},
            "scores": [],
            "attachments": [],
            "rootRunId": None,
        }
    )


@pytest.fixture
def literal_test_user(test_user: User):
    return LiteralUser(
        id=str(uuid.uuid4()),
        created_at=datetime.datetime.now().isoformat(),
        identifier=test_user.identifier,
        metadata=test_user.metadata,
    )


@pytest.fixture
def test_filters() -> ThreadFilter:
    return ThreadFilter(feedback=1, userId="user1", search="test")


@pytest.fixture
def test_pagination() -> Pagination:
    return Pagination(first=10, cursor=None)


@pytest.fixture
def test_attachment(
    test_thread: LiteralThread, test_step: LiteralStep
) -> LiteralAttachment:
    return Attachment(
        id="test_attachment_id",
        step_id=test_step.id,
        thread_id=test_thread.id,
        metadata={
            "display": "side",
            "language": "python",
            "type": "file",
        },
        mime="text/plain",
        name="test_file.txt",
        object_key="test_object_key",
        url="https://example.com/test_file.txt",
    )


async def test_create_step(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    test_step_dict: StepDict,
    mock_chainlit_context,
):
    async with mock_chainlit_context:
        await literal_data_layer.create_step(test_step_dict)

    mock_literal_client.api.send_steps.assert_awaited_once_with(
        [
            {
                "createdAt": "2023-01-01T00:00:00Z",
                "startTime": "2023-01-01T00:00:00Z",
                "endTime": "2023-01-01T00:00:00Z",
                "generation": {},
                "id": "test_step_id",
                "parentId": None,
                "name": "Test Step",
                "threadId": "test_thread_id",
                "type": "user_message",
                "tags": [],
                "metadata": {
                    "key": "value",
                    "waitForAnswer": True,
                    "language": "en",
                    "showInput": True,
                },
                "input": {"content": "test input"},
                "output": {"content": "test output"},
            }
        ]
    )


async def test_safely_send_steps_success(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    mock_chainlit_context,
):
    test_steps = [{"id": "test_step_id", "name": "Test Step"}]

    async with mock_chainlit_context:
        await literal_data_layer.safely_send_steps(test_steps)

    mock_literal_client.api.send_steps.assert_awaited_once_with(test_steps)


async def test_safely_send_steps_http_status_error(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    mock_chainlit_context,
    caplog,
):
    test_steps = [{"id": "test_step_id", "name": "Test Step"}]
    mock_literal_client.api.send_steps.side_effect = HTTPStatusError(
        "HTTP Error", request=Mock(), response=Mock(status_code=500)
    )

    async with mock_chainlit_context:
        await literal_data_layer.safely_send_steps(test_steps)

    mock_literal_client.api.send_steps.assert_awaited_once_with(test_steps)
    assert "HTTP Request: error sending steps: 500" in caplog.text


async def test_safely_send_steps_request_error(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    mock_chainlit_context,
    caplog,
):
    test_steps = [{"id": "test_step_id", "name": "Test Step"}]
    mock_request = Mock()
    mock_request.url = "https://example.com/api"
    mock_literal_client.api.send_steps.side_effect = RequestError(
        "Request Error", request=mock_request
    )

    async with mock_chainlit_context:
        await literal_data_layer.safely_send_steps(test_steps)

    mock_literal_client.api.send_steps.assert_awaited_once_with(test_steps)
    assert "HTTP Request: error for 'https://example.com/api'." in caplog.text


async def test_get_user(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    literal_test_user: LiteralUser,
    persisted_test_user: PersistedUser,
):
    mock_literal_client.api.get_user.return_value = literal_test_user

    user = await literal_data_layer.get_user("test_user_id")

    assert user is not None
    assert user.id == literal_test_user.id
    assert user.identifier == literal_test_user.identifier

    mock_literal_client.api.get_user.assert_awaited_once_with(identifier="test_user_id")


async def test_get_user_not_found(
    literal_data_layer: LiteralDataLayer, mock_literal_client: Mock
):
    mock_literal_client.api.get_user.return_value = None

    user = await literal_data_layer.get_user("non_existent_user_id")

    assert user is None
    mock_literal_client.api.get_user.assert_awaited_once_with(
        identifier="non_existent_user_id"
    )


async def test_create_user_not_existing(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    test_user: User,
    literal_test_user: LiteralUser,
):
    mock_literal_client.api.get_user.return_value = None
    mock_literal_client.api.create_user.return_value = literal_test_user

    persisted_user = await literal_data_layer.create_user(test_user)

    mock_literal_client.api.create_user.assert_awaited_once_with(
        identifier=test_user.identifier, metadata=test_user.metadata
    )

    assert persisted_user is not None
    assert isinstance(persisted_user, PersistedUser)
    assert persisted_user.id == literal_test_user.id
    assert persisted_user.identifier == literal_test_user.identifier


async def test_create_user_update_existing(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    test_user: User,
    literal_test_user: LiteralUser,
    persisted_test_user: PersistedUser,
):
    mock_literal_client.api.get_user.return_value = literal_test_user

    persisted_user = await literal_data_layer.create_user(test_user)

    mock_literal_client.api.create_user.assert_not_called()
    mock_literal_client.api.update_user.assert_awaited_once_with(
        id=literal_test_user.id, metadata=test_user.metadata
    )

    assert persisted_user is not None
    assert isinstance(persisted_user, PersistedUser)
    assert persisted_user.id == literal_test_user.id
    assert persisted_user.identifier == literal_test_user.identifier


async def test_create_user_id_none(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    test_user: User,
    literal_test_user: LiteralUser,
):
    """Weird edge case; persisted user without an id. Do we need this!??"""

    literal_test_user.id = None
    mock_literal_client.api.get_user.return_value = literal_test_user

    persisted_user = await literal_data_layer.create_user(test_user)

    mock_literal_client.api.create_user.assert_not_called()
    mock_literal_client.api.update_user.assert_not_called()

    assert persisted_user is not None
    assert isinstance(persisted_user, PersistedUser)
    assert persisted_user.id == ""
    assert persisted_user.identifier == literal_test_user.identifier


async def test_update_thread(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    test_thread: LiteralThread,
):
    await literal_data_layer.update_thread(test_thread.id, name=test_thread.name)

    mock_literal_client.api.upsert_thread.assert_awaited_once_with(
        id=test_thread.id,
        name=test_thread.name,
        participant_id=None,
        metadata=None,
        tags=None,
    )


async def test_get_thread_author(
    literal_data_layer, mock_literal_client: Mock, test_thread: LiteralThread
):
    test_thread.participant_identifier = "test_user_identifier"
    mock_literal_client.api.get_thread.return_value = test_thread

    author = await literal_data_layer.get_thread_author(test_thread.id)

    assert author == "test_user_identifier"
    mock_literal_client.api.get_thread.assert_awaited_once_with(id=test_thread.id)


async def test_get_thread(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    test_thread: LiteralThread,
    test_step: LiteralStep,
):
    assert isinstance(test_thread.steps, list)
    test_thread.steps.append(test_step)

    mock_literal_client.api.get_thread.return_value = test_thread

    thread = await literal_data_layer.get_thread(test_thread.id)
    mock_literal_client.api.get_thread.assert_awaited_once_with(id=test_thread.id)

    assert thread is not None
    assert thread["id"] == test_thread.id
    assert thread["name"] == test_thread.name
    assert len(thread["steps"]) == 1
    assert thread["steps"][0].get("id") == test_step.id


async def test_get_thread_with_stub_step(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    test_thread: LiteralThread,
):
    # Create a step that should be stubbed
    stub_step = LiteralStep.from_dict(
        {
            "id": "stub_step_id",
            "name": "Stub Step",
            "type": "undefined",
            "threadId": test_thread.id,
            "createdAt": "2023-01-01T00:00:00Z",
        }
    )
    test_thread.steps = [stub_step]

    mock_literal_client.api.get_thread.return_value = test_thread

    # Mock the config.ui.cot value to ensure check_add_step_in_cot returns False
    with patch("chainlit.config.config.ui.cot", "hidden"):
        thread = await literal_data_layer.get_thread(test_thread.id)

    mock_literal_client.api.get_thread.assert_awaited_once_with(id=test_thread.id)

    assert thread is not None
    assert thread["id"] == test_thread.id
    assert thread["name"] == test_thread.name
    assert len(thread["steps"]) == 1
    assert thread["steps"][0].get("id") == "stub_step_id"
    assert thread["steps"][0].get("type") == "undefined"
    assert thread["steps"][0].get("input") == ""
    assert thread["steps"][0].get("output") == ""

    # Additional assertions to ensure the step is stubbed
    assert "metadata" not in thread["steps"][0]
    assert "createdAt" not in thread["steps"][0]


async def test_get_thread_with_attachment(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    test_thread: LiteralThread,
    test_step: LiteralStep,
    test_attachment: LiteralAttachment,
):
    # Add the attachment to the test step
    test_step.attachments = [test_attachment]
    test_thread.steps = [test_step]

    mock_literal_client.api.get_thread.return_value = test_thread

    thread = await literal_data_layer.get_thread(test_thread.id)
    mock_literal_client.api.get_thread.assert_awaited_once_with(id=test_thread.id)

    assert thread is not None
    assert thread["id"] == test_thread.id
    assert thread["name"] == test_thread.name
    assert thread["steps"] is not None
    assert len(thread["steps"]) == 1
    assert thread["elements"] is not None
    assert len(thread["elements"]) == 1

    element = thread["elements"][0] if thread["elements"] else None
    assert element is not None
    assert element["id"] == "test_attachment_id"
    assert element["forId"] == test_step.id
    assert element["threadId"] == test_thread.id
    assert element["type"] == "file"
    assert element["display"] == "side"
    assert element["language"] == "python"
    assert element["mime"] == "text/plain"
    assert element["name"] == "test_file.txt"
    assert element["objectKey"] == "test_object_key"
    assert element["url"] == "https://example.com/test_file.txt"


async def test_get_thread_non_existing(
    literal_data_layer: LiteralDataLayer, mock_literal_client: Mock
):
    mock_literal_client.api.get_thread.return_value = None

    thread = await literal_data_layer.get_thread("non_existent_thread_id")
    mock_literal_client.api.get_thread.assert_awaited_once_with(
        id="non_existent_thread_id"
    )

    assert thread is None


async def test_delete_thread(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    test_thread: LiteralThread,
):
    await literal_data_layer.delete_thread(test_thread.id)

    mock_literal_client.api.delete_thread.assert_awaited_once_with(id=test_thread.id)


async def test_list_threads(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    test_filters: ThreadFilter,
    test_pagination: Pagination,
):
    response: PaginatedResponse[Thread] = PaginatedResponse(
        page_info=PageInfo(
            has_next_page=True, start_cursor="start_cursor", end_cursor="end_cursor"
        ),
        data=[
            Thread(
                id="thread1",
                name="Thread 1",
            ),
            Thread(
                id="thread2",
                name="Thread 2",
            ),
        ],
    )

    mock_literal_client.api.list_threads.return_value = response

    result = await literal_data_layer.list_threads(test_pagination, test_filters)

    mock_literal_client.api.list_threads.assert_awaited_once_with(
        first=10,
        after=None,
        filters=[
            {"field": "participantId", "operator": "eq", "value": "user1"},
            {
                "field": "stepOutput",
                "operator": "ilike",
                "value": "test",
                "path": "content",
            },
            {
                "field": "scoreValue",
                "operator": "eq",
                "value": 1,
                "path": "user-feedback",
            },
        ],
        order_by={"column": "createdAt", "direction": "DESC"},
    )

    assert result.pageInfo.hasNextPage
    assert result.pageInfo.startCursor == "start_cursor"
    assert result.pageInfo.endCursor == "end_cursor"
    assert len(result.data) == 2
    assert result.data[0]["id"] == "thread1"
    assert result.data[1]["id"] == "thread2"


async def test_create_element(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    mock_chainlit_context,
):
    mock_literal_client.api.upload_file.return_value = {"object_key": "test_object_key"}

    async with mock_chainlit_context:
        text_element = Text(
            id=str(uuid.uuid4()),
            name="test.txt",
            mime="text/plain",
            content="test content",
            for_id="test_step_id",
        )

        await literal_data_layer.create_element(text_element)

    mock_literal_client.api.upload_file.assert_awaited_once_with(
        content=text_element.content,
        mime=text_element.mime,
        thread_id=text_element.thread_id,
    )

    mock_literal_client.api.send_steps.assert_awaited_once_with(
        [
            {
                "id": text_element.for_id,
                "threadId": text_element.thread_id,
                "attachments": [
                    {
                        "id": ANY,
                        "name": text_element.name,
                        "metadata": {
                            "size": None,
                            "language": None,
                            "display": text_element.display,
                            "type": text_element.type,
                            "page": None,
                            "props": None,
                        },
                        "mime": text_element.mime,
                        "url": None,
                        "objectKey": "test_object_key",
                    }
                ],
            }
        ]
    )


async def test_get_element(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    test_attachment: LiteralAttachment,
):
    mock_literal_client.api.get_attachment.return_value = test_attachment

    element_dict = await literal_data_layer.get_element(
        "test_thread_id", "test_element_id"
    )

    mock_literal_client.api.get_attachment.assert_awaited_once_with(
        id="test_element_id"
    )

    assert element_dict is not None

    # Compare element_dict attributes to attachment attributes
    assert element_dict["id"] == test_attachment.id
    assert element_dict["forId"] == test_attachment.step_id
    assert element_dict["threadId"] == test_attachment.thread_id
    assert element_dict["name"] == test_attachment.name
    assert element_dict["mime"] == test_attachment.mime
    assert element_dict["url"] == test_attachment.url
    assert element_dict["objectKey"] == test_attachment.object_key
    assert test_attachment.metadata
    assert element_dict["display"] == test_attachment.metadata["display"]
    assert element_dict["language"] == test_attachment.metadata["language"]
    assert element_dict["type"] == test_attachment.metadata["type"]


async def test_upsert_feedback_create(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
):
    feedback = Feedback(forId="test_step_id", value=1, comment="Great!")
    mock_literal_client.api.create_score.return_value = Mock(id="new_feedback_id")

    result = await literal_data_layer.upsert_feedback(feedback)

    mock_literal_client.api.create_score.assert_awaited_once_with(
        step_id="test_step_id",
        value=1,
        comment="Great!",
        name="user-feedback",
        type="HUMAN",
    )
    assert result == "new_feedback_id"


async def test_upsert_feedback_update(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
):
    feedback = Feedback(
        id="existing_feedback_id",
        forId="test_step_id",
        value=0,
        comment="Needs improvement",
    )

    result = await literal_data_layer.upsert_feedback(feedback)

    mock_literal_client.api.update_score.assert_awaited_once_with(
        id="existing_feedback_id",
        update_params={
            "comment": "Needs improvement",
            "value": 0,
        },
    )
    assert result == "existing_feedback_id"


async def test_delete_feedback(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
):
    feedback_id = "test_feedback_id"

    result = await literal_data_layer.delete_feedback(feedback_id)

    mock_literal_client.api.delete_score.assert_awaited_once_with(id=feedback_id)
    assert result is True


async def test_delete_feedback_empty_id(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
):
    feedback_id = ""

    result = await literal_data_layer.delete_feedback(feedback_id)

    mock_literal_client.api.delete_score.assert_not_awaited()
    assert result is False


async def test_build_debug_url(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
):
    mock_literal_client.api.get_my_project_id.return_value = "test_project_id"
    mock_literal_client.api.url = "https://api.example.com"

    result = await literal_data_layer.build_debug_url()

    mock_literal_client.api.get_my_project_id.assert_awaited_once()
    assert (
        result
        == "https://api.example.com/projects/test_project_id/logs/threads/[thread_id]?currentStepId=[step_id]"
    )


async def test_build_debug_url_error(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    caplog,
):
    mock_literal_client.api.get_my_project_id.side_effect = Exception("API Error")

    result = await literal_data_layer.build_debug_url()

    mock_literal_client.api.get_my_project_id.assert_awaited_once()
    assert result == ""
    assert "Error building debug url: API Error" in caplog.text


async def test_delete_element(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    mock_chainlit_context,
):
    element_id = "test_element_id"

    async with mock_chainlit_context:
        await literal_data_layer.delete_element(element_id)

    mock_literal_client.api.delete_attachment.assert_awaited_once_with(id=element_id)


async def test_delete_step(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    mock_chainlit_context,
):
    step_id = "test_step_id"

    async with mock_chainlit_context:
        await literal_data_layer.delete_step(step_id)

    mock_literal_client.api.delete_step.assert_awaited_once_with(id=step_id)


async def test_update_step(
    literal_data_layer: LiteralDataLayer,
    mock_literal_client: Mock,
    mock_chainlit_context,
    test_step_dict: StepDict,
):
    async with mock_chainlit_context:
        await literal_data_layer.update_step(test_step_dict)

    mock_literal_client.api.send_steps.assert_awaited_once_with(
        [
            {
                "createdAt": "2023-01-01T00:00:00Z",
                "startTime": "2023-01-01T00:00:00Z",
                "endTime": "2023-01-01T00:00:00Z",
                "generation": {},
                "id": "test_step_id",
                "parentId": None,
                "name": "Test Step",
                "threadId": "test_thread_id",
                "type": "user_message",
                "tags": [],
                "metadata": {
                    "key": "value",
                    "waitForAnswer": True,
                    "language": "en",
                    "showInput": True,
                },
                "input": {"content": "test input"},
                "output": {"content": "test output"},
            }
        ]
    )


def test_steptype_to_steptype():
    assert (
        LiteralToChainlitConverter.steptype_to_steptype("user_message")
        == "user_message"
    )
    assert (
        LiteralToChainlitConverter.steptype_to_steptype("assistant_message")
        == "assistant_message"
    )
    assert (
        LiteralToChainlitConverter.steptype_to_steptype("system_message")
        == "system_message"
    )
    assert LiteralToChainlitConverter.steptype_to_steptype("tool") == "tool"
    assert LiteralToChainlitConverter.steptype_to_steptype(None) == "undefined"


def test_score_to_feedbackdict():
    score = LiteralScore(
        id="test_score_id",
        step_id="test_step_id",
        value=1,
        comment="Great job!",
        name="user-feedback",
        type="HUMAN",
        dataset_experiment_item_id=None,
        tags=None,
    )
    feedback_dict = LiteralToChainlitConverter.score_to_feedbackdict(score)
    assert feedback_dict == {
        "id": "test_score_id",
        "forId": "test_step_id",
        "value": 1,
        "comment": "Great job!",
    }

    assert LiteralToChainlitConverter.score_to_feedbackdict(None) is None

    score.value = 0
    feedback_dict = LiteralToChainlitConverter.score_to_feedbackdict(score)
    assert feedback_dict is not None
    assert feedback_dict["value"] == 0

    score.id = None
    score.step_id = None
    feedback_dict = LiteralToChainlitConverter.score_to_feedbackdict(score)
    assert feedback_dict is not None
    assert feedback_dict["id"] == ""
    assert feedback_dict["forId"] == ""


def test_step_to_stepdict():
    literal_step = LiteralStep.from_dict(
        {
            "id": "test_step_id",
            "threadId": "test_thread_id",
            "type": "user_message",
            "name": "Test Step",
            "input": {"content": "test input"},
            "output": {"content": "test output"},
            "startTime": "2023-01-01T00:00:00Z",
            "endTime": "2023-01-01T00:00:01Z",
            "createdAt": "2023-01-01T00:00:00Z",
            "metadata": {"showInput": True, "language": "en"},
            "error": None,
            "scores": [
                {
                    "id": "test_score_id",
                    "stepId": "test_step_id",
                    "value": 1,
                    "comment": "Great job!",
                    "name": "user-feedback",
                    "type": "HUMAN",
                }
            ],
        }
    )

    step_dict = LiteralToChainlitConverter.step_to_stepdict(literal_step)

    assert step_dict.get("id") == "test_step_id"
    assert step_dict.get("threadId") == "test_thread_id"
    assert step_dict.get("type") == "user_message"
    assert step_dict.get("name") == "Test Step"
    assert step_dict.get("input") == "test input"
    assert step_dict.get("output") == "test output"
    assert step_dict.get("start") == "2023-01-01T00:00:00Z"
    assert step_dict.get("end") == "2023-01-01T00:00:01Z"
    assert step_dict.get("createdAt") == "2023-01-01T00:00:00Z"
    assert step_dict.get("showInput") == True
    assert step_dict.get("language") == "en"
    assert step_dict.get("isError") == False
    assert step_dict.get("feedback") == {
        "id": "test_score_id",
        "forId": "test_step_id",
        "value": 1,
        "comment": "Great job!",
    }


def test_attachment_to_elementdict():
    attachment = Attachment(
        id="test_attachment_id",
        step_id="test_step_id",
        thread_id="test_thread_id",
        name="test.txt",
        mime="text/plain",
        url="https://example.com/test.txt",
        object_key="test_object_key",
        metadata={
            "display": "side",
            "language": "python",
            "type": "file",
            "size": "large",
        },
    )

    element_dict = LiteralToChainlitConverter.attachment_to_elementdict(attachment)

    assert element_dict["id"] == "test_attachment_id"
    assert element_dict["forId"] == "test_step_id"
    assert element_dict["threadId"] == "test_thread_id"
    assert element_dict["name"] == "test.txt"
    assert element_dict["mime"] == "text/plain"
    assert element_dict["url"] == "https://example.com/test.txt"
    assert element_dict["objectKey"] == "test_object_key"
    assert element_dict["display"] == "side"
    assert element_dict["language"] == "python"
    assert element_dict["type"] == "file"
    assert element_dict["size"] == "large"


def test_attachment_to_element():
    attachment = Attachment(
        id="test_attachment_id",
        step_id="test_step_id",
        thread_id="test_thread_id",
        name="test.txt",
        mime="text/plain",
        url="https://example.com/test.txt",
        object_key="test_object_key",
        metadata={
            "display": "side",
            "language": "python",
            "type": "text",
            "size": "small",
        },
    )

    element = LiteralToChainlitConverter.attachment_to_element(attachment)

    assert isinstance(element, Text)
    assert element.id == "test_attachment_id"
    assert element.for_id == "test_step_id"
    assert element.thread_id == "test_thread_id"
    assert element.name == "test.txt"
    assert element.mime == "text/plain"
    assert element.url == "https://example.com/test.txt"
    assert element.object_key == "test_object_key"
    assert element.display == "side"
    assert element.language == "python"
    assert element.size == "small"

    # Test other element types
    for element_type in ["file", "image", "audio", "video", "pdf"]:
        attachment.metadata = {"type": element_type, "size": "small"}

        element = LiteralToChainlitConverter.attachment_to_element(attachment)
        assert isinstance(
            element,
            {
                "file": File,
                "image": Image,
                "audio": Audio,
                "video": Video,
                "text": Text,
                "pdf": Pdf,
            }[element_type],
        )


def test_step_to_step():
    literal_step = LiteralStep.from_dict(
        {
            "id": "test_step_id",
            "threadId": "test_thread_id",
            "type": "user_message",
            "name": "Test Step",
            "input": {"content": "test input"},
            "output": {"content": "test output"},
            "startTime": "2023-01-01T00:00:00Z",
            "endTime": "2023-01-01T00:00:01Z",
            "createdAt": "2023-01-01T00:00:00Z",
            "metadata": {"showInput": True, "language": "en"},
            "error": None,
            "attachments": [
                {
                    "id": "test_attachment_id",
                    "name": "test.txt",
                    "mime": "text/plain",
                    "url": "https://example.com/test.txt",
                    "objectKey": "test_object_key",
                    "metadata": {
                        "display": "side",
                        "language": "python",
                        "type": "text",
                    },
                }
            ],
        }
    )

    chainlit_step = LiteralToChainlitConverter.step_to_step(literal_step)

    assert isinstance(chainlit_step, Step)
    assert chainlit_step.id == "test_step_id"
    assert chainlit_step.thread_id == "test_thread_id"
    assert chainlit_step.type == "user_message"
    assert chainlit_step.name == "Test Step"
    assert chainlit_step.input == "test input"
    assert chainlit_step.output == "test output"
    assert chainlit_step.start == "2023-01-01T00:00:00Z"
    assert chainlit_step.end == "2023-01-01T00:00:01Z"
    assert chainlit_step.created_at == "2023-01-01T00:00:00Z"
    assert chainlit_step.metadata == {"showInput": True, "language": "en"}
    assert not chainlit_step.is_error
    assert chainlit_step.elements is not None
    assert len(chainlit_step.elements) == 1
    assert isinstance(chainlit_step.elements[0], Text)


def test_thread_to_threaddict():
    attachment_dict = LiteralAttachmentDict(
        id="test_attachment_id",
        stepId="test_step_id",
        threadId="test_thread_id",
        name="test.txt",
        mime="text/plain",
        url="https://example.com/test.txt",
        objectKey="test_object_key",
        metadata={
            "display": "side",
            "language": "python",
            "type": "text",
        },
    )
    step_dict = LiteralStepDict(
        id="test_step_id",
        threadId="test_thread_id",
        type="user_message",
        name="Test Step",
        input={"content": "test input"},
        output={"content": "test output"},
        startTime="2023-01-01T00:00:00Z",
        endTime="2023-01-01T00:00:01Z",
        createdAt="2023-01-01T00:00:00Z",
        metadata={"showInput": True, "language": "en"},
        error=None,
        attachments=[attachment_dict],
    )
    literal_thread = LiteralThread.from_dict(
        LiteralThreadDict(
            id="test_thread_id",
            name="Test Thread",
            createdAt="2023-01-01T00:00:00Z",
            participant=UserDict(id="test_user_id", identifier="test_user_identifier_"),
            tags=["tag1", "tag2"],
            metadata={"key": "value"},
            steps=[step_dict],
        )
    )

    thread_dict = LiteralToChainlitConverter.thread_to_threaddict(literal_thread)

    assert thread_dict["id"] == "test_thread_id"
    assert thread_dict["name"] == "Test Thread"
    assert thread_dict["createdAt"] == "2023-01-01T00:00:00Z"
    assert thread_dict["userId"] == "test_user_id"
    assert thread_dict["userIdentifier"] == "test_user_identifier_"
    assert thread_dict["tags"] == ["tag1", "tag2"]
    assert thread_dict["metadata"] == {"key": "value"}
    assert thread_dict["steps"] is not None
    assert len(thread_dict["steps"]) == 1
    assert thread_dict["elements"] is not None
    assert len(thread_dict["elements"]) == 1
