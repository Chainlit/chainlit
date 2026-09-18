"""Tests for the DynamoDB data layer's thread and step identifier handling.

DynamoDB stores a thread as ``PK="THREAD#<thread_id>"`` and a step as
``SK="STEP#<step_id>"``. Reading those identifiers back must strip the prefix
only, never the characters the identifier happens to end with.
"""

from unittest.mock import Mock

import pytest

from chainlit.data.dynamodb import DynamoDBDataLayer
from chainlit.types import Pagination, ThreadFilter


def _make_layer(items=None):
    client = Mock()
    client.query.return_value = {"Items": items or []}
    return DynamoDBDataLayer(table_name="test-table", client=client), client


@pytest.mark.asyncio
async def test_list_threads_keeps_thread_ids_ending_in_prefix_characters():
    """A thread id ending in T/H/R/E/A/D keeps every character.

    ``str.strip("THREAD#")`` treats its argument as a set of characters, so it
    eats the id's own trailing letters; ``removeprefix`` removes the prefix only.
    """
    layer, _ = _make_layer(
        [
            {
                "PK": {"S": "THREAD#DEMO"},
                "UserThreadSK": {"S": "TS#2026-01-01T00:00:00"},
                "name": {"S": "demo thread"},
            }
        ]
    )

    response = await layer.list_threads(
        Pagination(first=10), ThreadFilter(userId="user-1")
    )

    assert [thread["id"] for thread in response.data] == ["DEMO"]
    assert response.data[0]["createdAt"] == "2026-01-01T00:00:00"


@pytest.mark.asyncio
async def test_delete_feedback_builds_the_key_from_the_full_identifiers():
    """The delete key must reuse the ids from the feedback id verbatim."""
    layer, client = _make_layer()

    await layer.delete_feedback("THREAD#CODE::STEP#SEED")

    assert client.update_item.call_args.kwargs["Key"] == {
        "PK": {"S": "THREAD#CODE"},
        "SK": {"S": "STEP#SEED"},
    }
