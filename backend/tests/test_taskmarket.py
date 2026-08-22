import asyncio
import json

import pytest

from chainlit.taskmarket import TaskmarketTool

FAKE_TASK_ID = "0x" + "ab" * 32

FIXTURE_TASK = {
    "id": FAKE_TASK_ID,
    "status": "open",
    "phase": "active",
    "mode": "bounty",
    "reward": "5000000",
    "awardCount": 0,
    "submissionCount": 1,
    "submissionWindowOpen": True,
    "expiryTime": "2026-08-25T00:00:00.000Z",
}

FIXTURE_TASKS = {
    "tasks": [
        dict(FIXTURE_TASK, description="Task one", reward="2000000"),
        dict(
            FIXTURE_TASK, id="0x" + "cd" * 32, description="Task two", reward="4000000"
        ),
    ]
}

FIXTURE_SUBMISSIONS = [
    {
        "id": "sub-1",
        "workerAddress": "0x1111",
        "workerAgentId": "agent-1",
        "submittedAt": "2026-08-22T00:00:00.000Z",
        "rejectedAt": None,
        "deliverableHash": "0xhash",
        "submitTxHash": "0xtx",
        "fileUrl": None,
    }
]


@pytest.fixture
def mock_get_json(monkeypatch):
    async def fake_get_json(url, timeout=45.0):
        if url.endswith("/submissions"):
            return FIXTURE_SUBMISSIONS
        if url.endswith("/tasks") or "?status=" in url:
            return FIXTURE_TASKS
        return FIXTURE_TASK

    monkeypatch.setattr("chainlit.taskmarket._get_json", fake_get_json)
    return fake_get_json


@pytest.fixture
def mock_taskmarket_cli(monkeypatch):
    """Pretend the taskmarket CLI binary exists so the settlement path is
    exercised even on machines/CI without the real CLI installed."""
    monkeypatch.setattr(
        "chainlit.taskmarket.shutil.which", lambda _name: "/usr/bin/taskmarket"
    )


def test_instantiation():
    tool = TaskmarketTool()
    assert tool.max_spend > 0
    assert tool.api_base == "https://api.taskmarket.dev/api"


@pytest.mark.asyncio
async def test_list_tasks_mocked(mock_chainlit_context, mock_get_json):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        out = await tool.list_tasks(status="open", limit=2)
        tasks = json.loads(out)
        assert isinstance(tasks, list)
        assert len(tasks) == 2
        assert tasks[0]["id"] == FAKE_TASK_ID
        assert tasks[0]["rewardUSDC"] == 2.0


@pytest.mark.asyncio
async def test_get_task_mocked(mock_chainlit_context, mock_get_json):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        detail = json.loads(await tool.get_task(FAKE_TASK_ID))
        assert detail["status"] == "open"
        assert detail["rewardUSDC"] == 5.0


@pytest.mark.asyncio
async def test_list_submissions_is_read_only(mock_chainlit_context, mock_get_json):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        subs = json.loads(await tool.list_submissions(FAKE_TASK_ID))
        assert len(subs) == 1
        assert subs[0]["id"] == "sub-1"
        assert subs[0]["rejectedAt"] is None


@pytest.mark.asyncio
async def test_create_task_refuses_without_token(mock_chainlit_context):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        out = await tool.create_task(description="test", reward=1.0, duration_hours=24)
        assert out.startswith("REFUSED")
        assert "request_authorization" in out
        assert "Nothing was created" in out


@pytest.mark.asyncio
async def test_create_task_refuses_unknown_token(mock_chainlit_context):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        out = await tool.create_task(
            description="test",
            reward=1.0,
            duration_hours=24,
            authorization_token="tm-forged",
        )
        assert out.startswith("REFUSED")
        assert "unknown authorization token" in out


@pytest.mark.asyncio
async def test_token_lifecycle_single_use(
    mock_chainlit_context, mock_taskmarket_cli, monkeypatch
):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        token_payload = json.loads(await tool.request_authorization(reward=1.0))
        token = token_payload["authorizationToken"]
        assert token.startswith("tm-")

        # Mock the CLI subprocess so no real money moves.
        class FakeProc:
            returncode = 0

            async def communicate(self):
                return (
                    f"created task {FAKE_TASK_ID} ok".encode(),
                    b"",
                )

        async def fake_spawn(*args, **kwargs):
            return FakeProc()

        async def fake_get_json(url, timeout=45.0):
            return FIXTURE_TASK

        monkeypatch.setattr(
            "chainlit.taskmarket.asyncio.create_subprocess_exec", fake_spawn
        )
        monkeypatch.setattr("chainlit.taskmarket._get_json", fake_get_json)

        first = json.loads(
            await tool.create_task(
                description="test task",
                reward=1.0,
                duration_hours=24,
                authorization_token=token,
            )
        )
        assert first["created"] is True
        assert first["taskId"] == FAKE_TASK_ID

        # Single-use: a second execution must refuse.
        second = await tool.create_task(
            description="test task",
            reward=1.0,
            duration_hours=24,
            authorization_token=token,
        )
        assert second.startswith("REFUSED")
        assert "already used" in second


@pytest.mark.asyncio
async def test_create_task_refuses_expired_token(mock_chainlit_context):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        token = json.loads(await tool.request_authorization(reward=1.0))[
            "authorizationToken"
        ]
        tool._auth_tokens[token]["expires_at"] = 0  # expire immediately
        out = await tool.create_task(
            description="test",
            reward=1.0,
            duration_hours=24,
            authorization_token=token,
        )
        assert out.startswith("REFUSED")
        assert "expired" in out


@pytest.mark.asyncio
async def test_create_task_refuses_reward_mismatch(mock_chainlit_context):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        token = json.loads(await tool.request_authorization(reward=1.0))[
            "authorizationToken"
        ]
        out = await tool.create_task(
            description="test",
            reward=2.0,
            duration_hours=24,
            authorization_token=token,
        )
        assert out.startswith("REFUSED")
        assert "bound to reward" in out


@pytest.mark.asyncio
async def test_create_task_unknown_when_cli_times_out(
    mock_chainlit_context, mock_taskmarket_cli, monkeypatch
):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        token = json.loads(await tool.request_authorization(reward=1.0))[
            "authorizationToken"
        ]

        hung_proc = {}

        class HungProc:
            returncode = None
            killed = False

            async def communicate(self):
                await asyncio.sleep(999)

            def kill(self):
                self.killed = True
                self.returncode = -9

            async def wait(self):
                return self.returncode

        async def fake_spawn(*args, **kwargs):
            hung_proc["proc"] = HungProc()
            return hung_proc["proc"]

        async def fake_wait_for(coro, timeout):
            # Simulate the wait_for timeout WITHOUT awaiting the hung coro.
            coro.close()
            raise asyncio.TimeoutError

        monkeypatch.setattr(
            "chainlit.taskmarket.asyncio.create_subprocess_exec", fake_spawn
        )
        monkeypatch.setattr("chainlit.taskmarket.asyncio.wait_for", fake_wait_for)

        out = json.loads(
            await tool.create_task(
                description="test",
                reward=1.0,
                duration_hours=24,
                authorization_token=token,
            )
        )
        assert out["created"] == "unknown"
        assert "UNKNOWN" in out["message"]
        # P1: a timed-out CLI process must be killed and reaped, not leaked.
        assert hung_proc["proc"].killed is True
        assert hung_proc["proc"].returncode == -9


@pytest.mark.asyncio
async def test_create_task_unknown_when_output_unrecognized(
    mock_chainlit_context, mock_taskmarket_cli, monkeypatch
):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        token = json.loads(await tool.request_authorization(reward=1.0))[
            "authorizationToken"
        ]

        class FakeProc:
            returncode = 0

            async def communicate(self):
                return b"all done, no id here", b""

        async def fake_spawn(*args, **kwargs):
            return FakeProc()

        monkeypatch.setattr(
            "chainlit.taskmarket.asyncio.create_subprocess_exec", fake_spawn
        )

        out = json.loads(
            await tool.create_task(
                description="test",
                reward=1.0,
                duration_hours=24,
                authorization_token=token,
            )
        )
        assert out["created"] == "unknown"
        assert out["cliOutput"] == "all done, no id here"


@pytest.mark.asyncio
async def test_create_task_returns_id_when_status_lookup_fails(
    mock_chainlit_context, mock_taskmarket_cli, monkeypatch
):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        token = json.loads(await tool.request_authorization(reward=1.0))[
            "authorizationToken"
        ]

        class FakeProc:
            returncode = 0

            async def communicate(self):
                return f"created task {FAKE_TASK_ID} ok".encode(), b""

        async def fake_spawn(*args, **kwargs):
            return FakeProc()

        async def fake_get_json(url, timeout=45.0):
            raise RuntimeError("status endpoint down")

        monkeypatch.setattr(
            "chainlit.taskmarket.asyncio.create_subprocess_exec", fake_spawn
        )
        monkeypatch.setattr("chainlit.taskmarket._get_json", fake_get_json)

        out = json.loads(
            await tool.create_task(
                description="test",
                reward=1.0,
                duration_hours=24,
                authorization_token=token,
            )
        )
        assert out["created"] is True
        assert out["taskId"] == FAKE_TASK_ID
        assert out["statusUnavailable"] is True


@pytest.mark.asyncio
async def test_create_task_refuses_token_issued_in_other_conversation(
    mock_chainlit_context, mock_taskmarket_cli, monkeypatch
):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        token = json.loads(await tool.request_authorization(reward=1.0))[
            "authorizationToken"
        ]
        # Token was issued in thread "test_thread_id"; bind it to a
        # different conversation thread and confirm create_task refuses.
        tool._auth_tokens[token]["scope"] = "some-other-thread"

        class FakeProc:
            returncode = 0

            async def communicate(self):
                return f"created task {FAKE_TASK_ID} ok".encode(), b""

        async def fake_spawn(*args, **kwargs):
            return FakeProc()

        monkeypatch.setattr(
            "chainlit.taskmarket.asyncio.create_subprocess_exec", fake_spawn
        )

        out = await tool.create_task(
            description="test",
            reward=1.0,
            duration_hours=24,
            authorization_token=token,
        )
        assert out.startswith("REFUSED")
        assert "different" in out
        assert "conversation" in out


@pytest.mark.asyncio
async def test_token_bound_to_thread_survives_session_id_change(
    mock_chainlit_context, mock_taskmarket_cli, monkeypatch
):
    """HTTP API flow: each request gets a NEW session id but the SAME
    thread id, so a token issued in request 1 must still be usable in
    request 2. The binding must follow the thread, not the session id."""
    async with mock_chainlit_context as ctx:
        tool = TaskmarketTool()
        token = json.loads(await tool.request_authorization(reward=1.0))[
            "authorizationToken"
        ]
        assert tool._auth_tokens[token]["scope"] == "test_thread_id"
        # Simulate a follow-up HTTP request: session.id changes, thread_id
        # stays put. (The mock session's thread_id attribute is what
        # _thread_id() reads; the raw session id is no longer consulted.)
        ctx.session.id = "some-other-ephemeral-session-id"

        class FakeProc:
            returncode = 0

            async def communicate(self):
                return f"created task {FAKE_TASK_ID} ok".encode(), b""

        async def fake_spawn(*args, **kwargs):
            return FakeProc()

        async def fake_get_json(url, timeout=45.0):
            return FIXTURE_TASK

        monkeypatch.setattr(
            "chainlit.taskmarket.asyncio.create_subprocess_exec", fake_spawn
        )
        monkeypatch.setattr("chainlit.taskmarket._get_json", fake_get_json)

        out = json.loads(
            await tool.create_task(
                description="test",
                reward=1.0,
                duration_hours=24,
                authorization_token=token,
            )
        )
        assert out["created"] is True
        assert out["taskId"] == FAKE_TASK_ID


@pytest.mark.asyncio
async def test_request_authorization_per_conversation_cap(
    mock_chainlit_context, mock_taskmarket_cli, monkeypatch
):
    """One conversation must not be able to exhaust the shared token cap
    and starve every other conversation: per-scope cap applies first."""
    from chainlit.taskmarket import MAX_AUTH_TOKENS, MAX_AUTH_TOKENS_PER_SCOPE

    assert MAX_AUTH_TOKENS_PER_SCOPE < MAX_AUTH_TOKENS
    async with mock_chainlit_context as ctx:
        tool = TaskmarketTool()
        for _ in range(MAX_AUTH_TOKENS_PER_SCOPE):
            out = await tool.request_authorization(reward=1.0)
            assert "REFUSED" not in out
        # The (N+1)-th token for THIS conversation is refused...
        out = await tool.request_authorization(reward=1.0)
        assert out.startswith("REFUSED")
        assert "this conversation" in out
        # ...but a different conversation (different thread) can still
        # obtain tokens while the first one is capped.
        ctx.session.thread_id = "another-conversation"
        out = await tool.request_authorization(reward=1.0)
        assert "REFUSED" not in out


@pytest.mark.asyncio
async def test_request_authorization_rejects_nonpositive_ttl(mock_chainlit_context):
    async with mock_chainlit_context:
        tool = TaskmarketTool()
        out = await tool.request_authorization(reward=1.0, ttl_seconds=0)
        assert out.startswith("REFUSED")
        assert "TTL" in out
        # None still falls back to the default lifetime.
        default = json.loads(await tool.request_authorization(reward=1.0))
        assert default["expiresInSeconds"] == tool.auth_ttl_seconds


def test_extract_task_id():
    assert (
        TaskmarketTool._extract_task_id(f"created task {FAKE_TASK_ID} ok")
        == FAKE_TASK_ID
    )
    assert TaskmarketTool._extract_task_id("no id here") is None
