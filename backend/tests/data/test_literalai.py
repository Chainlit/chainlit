import datetime
import uuid
from unittest.mock import ANY, AsyncMock, Mock, patch

import pytest
from httpx import HTTPStatusError, RequestError

from literalai import AsyncLiteralClient
from literalai import Step as LiteralStep
from literalai import Thread as LiteralThread
from literalai import User as LiteralUser
from literalai.api import AsyncLiteralAPI

from chainlit.data.literalai import LiteralDataLayer
from chainlit.element import Text
from chainlit.step import StepDict
from chainlit.types import Feedback, Pagination, ThreadFilter
from chainlit.user import PersistedUser, User


@pytest.fixture
async def mock_literal_client(monkeypatch: pytest.MonkeyPatch):
    client = Mock(spec=AsyncLiteralClient)
    client.api = AsyncMock(spec=AsyncLiteralAPI)
    monkeypatch.setattr("literalai.AsyncLiteralClient", client)
    yield client


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
):
    # Create a mock attachment
    mock_attachment = Mock()
    mock_attachment.id = "test_attachment_id"
    mock_attachment.step_id = test_step.id
    mock_attachment.thread_id = test_thread.id
    mock_attachment.metadata = {
        "display": "side",
        "language": "python",
        "type": "file",
    }
    mock_attachment.mime = "text/plain"
    mock_attachment.name = "test_file.txt"
    mock_attachment.object_key = "test_object_key"
    mock_attachment.url = "https://example.com/test_file.txt"

    # Add the attachment to the test step
    test_step.attachments = [mock_attachment]
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
    mock_response = Mock()
    mock_response.pageInfo = Mock(
        hasNextPage=True, startCursor="start_cursor", endCursor="end_cursor"
    )
    mock_response.data = [
        {
            "id": "thread1",
            "name": "Thread 1",
            "createdAt": "2023-01-01T00:00:00Z",
        },
        {
            "id": "thread2",
            "name": "Thread 2",
            "createdAt": "2023-01-02T00:00:00Z",
        },
    ]
    mock_literal_client.api.list_threads.return_value = mock_response

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
):
    mock_attachment = Mock()
    mock_attachment.id = "test_element_id"
    mock_attachment.step_id = "test_step_id"
    mock_attachment.thread_id = "test_thread_id"
    mock_attachment.metadata = {
        "display": "side",
        "language": "python",
        "type": "text",
    }
    mock_attachment.mime = "text/plain"
    mock_attachment.name = "test.txt"
    mock_attachment.object_key = "test_object_key"
    mock_attachment.url = "https://example.com/test.txt"

    mock_literal_client.api.get_attachment.return_value = mock_attachment

    element = await literal_data_layer.get_element("test_thread_id", "test_element_id")

    mock_literal_client.api.get_attachment.assert_awaited_once_with(
        id="test_element_id"
    )

    assert element is not None
    assert element["id"] == "test_element_id"
    assert element["forId"] == "test_step_id"
    assert element["threadId"] == "test_thread_id"
    assert element["type"] == "text"
    assert element["display"] == "side"
    assert element["language"] == "python"
    assert element["mime"] == "text/plain"
    assert element["name"] == "test.txt"
    assert element["objectKey"] == "test_object_key"
    assert element["url"] == "https://example.com/test.txt"


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


async def test_score_to_feedback_dict(literal_data_layer: LiteralDataLayer):
    from literalai import Score as LiteralScore

    # Test with a valid score
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
    feedback_dict = literal_data_layer.score_to_feedback_dict(score)
    assert feedback_dict == {
        "id": "test_score_id",
        "forId": "test_step_id",
        "value": 1,
        "comment": "Great job!",
    }

    # Test with None score
    assert literal_data_layer.score_to_feedback_dict(None) is None

    # Test with score value 0
    score.value = 0
    feedback_dict = literal_data_layer.score_to_feedback_dict(score)
    assert feedback_dict is not None
    assert feedback_dict["value"] == 0

    # Test with missing id or step_id
    score.id = None
    score.step_id = None
    feedback_dict = literal_data_layer.score_to_feedback_dict(score)
    assert feedback_dict is not None
    assert feedback_dict["id"] == ""
    assert feedback_dict["forId"] == ""
