import json

import pytest

from chainlit.taskmarket import TaskmarketTool


def test_instantiation():
    tool = TaskmarketTool()
    assert tool.max_spend > 0
    assert tool.api_base == "https://api.taskmarket.dev/api"


@pytest.mark.asyncio
async def test_list_tasks_reads_live_api():
    tool = TaskmarketTool()
    out = await tool.list_tasks(status="open", limit=2)
    tasks = json.loads(out)
    assert isinstance(tasks, list)
    assert len(tasks) <= 2


@pytest.mark.asyncio
async def test_get_task_live():
    tool = TaskmarketTool()
    out = await tool.list_tasks(status="open", limit=1)
    tasks = json.loads(out)
    if not tasks:
        pytest.skip("no open tasks on live API")
    detail = json.loads(await tool.get_task(tasks[0]["id"]))
    assert detail["status"] == "open"


@pytest.mark.asyncio
async def test_create_task_refuses_without_authorization():
    tool = TaskmarketTool()
    out = await tool.create_task(description="test", reward=1.0, duration_hours=24)
    assert out.startswith("REFUSED")
    assert "Nothing was created" in out


@pytest.mark.asyncio
async def test_create_task_refuses_wrong_authorization():
    tool = TaskmarketTool()
    out = await tool.create_task(
        description="test",
        reward=1.0,
        duration_hours=24,
        authorization="authorize 999 USDC for taskmarket task",
    )
    assert out.startswith("REFUSED")
    assert "must exactly match" in out


@pytest.mark.asyncio
async def test_create_task_refuses_over_max_spend():
    tool = TaskmarketTool(max_spend=0.5)
    out = await tool.create_task(
        description="test",
        reward=5.0,
        duration_hours=24,
        authorization="authorize 5.0 USDC for taskmarket task",
    )
    assert out.startswith("REFUSED")
    assert "exceeds max_spend" in out


@pytest.mark.asyncio
async def test_create_task_refuses_bad_duration():
    tool = TaskmarketTool()
    out = await tool.create_task(
        description="test",
        reward=1.0,
        duration_hours=0,
        authorization="authorize 1.0 USDC for taskmarket task",
    )
    assert out.startswith("REFUSED")
    assert "duration_hours" in out


def test_extract_task_id():
    fake_id = "0x" + "ab" * 32  # 64 hex chars, same shape as real task ids
    assert TaskmarketTool._extract_task_id(f"created task {fake_id} ok") == fake_id
    assert TaskmarketTool._extract_task_id("no id here") is None
