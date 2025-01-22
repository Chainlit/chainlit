import asyncio
from typing import List

from chainlit.context import context
from chainlit.element import ElementBased


class Sidebar:
    @staticmethod
    async def set_title(title: str):
        await context.emitter.emit("set_sidebar_title", title)

    @staticmethod
    async def set_elements(elements: List[ElementBased]):
        coros = [
            element.send(for_id=element.for_id or "", persist=False)
            for element in elements
        ]
        await asyncio.gather(*coros)
        await context.emitter.emit(
            "set_sidebar_elements", [el.to_dict() for el in elements]
        )
