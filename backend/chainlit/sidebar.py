import asyncio
from typing import List, Optional

from chainlit.context import context
from chainlit.element import ElementBased


class ElementSidebar:
    """Helper class to open/close the element sidebar server side.
    The element sidebar accepts a title and list of elements."""

    @staticmethod
    async def set_title(title: str):
        """
        Sets the title of the element sidebar and opens it.

        The sidebar will automatically open when a title is set using this method.

        Args:
            title (str): The title to display at the top of the sidebar.

        Returns:
            None: This method does not return anything.
        """
        await context.emitter.emit("set_sidebar_title", title)

    @staticmethod
    async def set_elements(elements: List[ElementBased], key: Optional[str] = None):
        """
        Sets the elements to display in the sidebar and controls sidebar visibility.

        This method sends all provided elements to the client and updates the sidebar.
        Passing an empty list will close the sidebar, while passing at least one element
        will open it.

        Args:
            elements (List[ElementBased]): A list of ElementBased objects to display in the sidebar.
            key (Optional[str], optional): If the sidebar is already opened with the same key, elements will not be replaced.

        Returns:
            None: This method does not return anything.

        Note:
            This method first sends each element separately using their send() method,
            then emits an event with all element dictionaries and the optional key.
        """
        coros = [
            element.send(for_id=element.for_id or "", persist=False)
            for element in elements
        ]
        await asyncio.gather(*coros)
        await context.emitter.emit(
            "set_sidebar_elements",
            {"elements": [el.to_dict() for el in elements], "key": key},
        )

    @staticmethod
    async def set(
        title: str,
        elements: List[ElementBased],
        key: Optional[str] = None,
    ):
        """
        Atomically set the sidebar title, elements, and key in a single event.

        Prefer this over calling set_title followed by set_elements: the
        two-call variant relies on the client reassembling state across two
        socket events, which is racy under React 18 + Recoil -- the second
        event's updater can observe the atom as unset even though the first
        event just wrote to it, causing the title to render as an empty
        string. Emitting one combined event avoids that race entirely.

        Passing an empty elements list will close the sidebar, matching the
        behaviour of set_elements([]).

        Args:
            title (str): The title to display at the top of the sidebar.
            elements (List[ElementBased]): A list of ElementBased objects to
                display in the sidebar.
            key (Optional[str], optional): If the sidebar is already opened
                with the same key and title, elements will not be replaced.

        Returns:
            None: This method does not return anything.
        """
        if not elements:
            await context.emitter.emit(
                "set_sidebar",
                {"title": title, "elements": [], "key": None},
            )
            return

        coros = [
            element.send(for_id=element.for_id or "", persist=False)
            for element in elements
        ]
        await asyncio.gather(*coros)
        await context.emitter.emit(
            "set_sidebar",
            {
                "title": title,
                "elements": [el.to_dict() for el in elements],
                "key": key,
            },
        )
