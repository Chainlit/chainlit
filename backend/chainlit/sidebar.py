import asyncio
from typing import List

from chainlit.context import context
from chainlit.element import ElementBased


class Sidebar:
    """Helper class to open/close the sidebar server side.
    The sidebar accepts a title and list of elements."""

    @staticmethod
    async def set_title(title: str):
        """Setting a title will open the sidebar"""
        await context.emitter.emit("set_sidebar_title", title)

    @staticmethod
    async def set_elements(elements: List[ElementBased]):
        """Passing an empty array will close the sidebar. Passing at least one element will open the sidebar."""
        coros = [
            element.send(for_id=element.for_id or "", persist=False)
            for element in elements
        ]
        await asyncio.gather(*coros)
        await context.emitter.emit(
            "set_sidebar_elements", [el.to_dict() for el in elements]
        )
