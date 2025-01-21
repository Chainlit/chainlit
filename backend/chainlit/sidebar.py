from typing import Optional, List

from chainlit.element import ElementBased

class Sidebar:
    @staticmethod
    async def open(title: str, elements: Optional[List[ElementBased]] = None):
        pass
    
    @staticmethod
    async def close():
        pass
