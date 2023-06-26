from enum import Enum
from chainlit.message import Message


class TaskStatus(Enum):
    NOT_STARTED = "not started"
    RUNNING = "running"
    DONE = "done"


class Task:
    title: str = None
    description: str = None
    status: TaskStatus = TaskStatus.NOT_STARTED

    def __init__(
        self,
        title: str,
        description: str = None,
        status: TaskStatus = TaskStatus.NOT_STARTED,
    ):
        self.title = title
        self.description = description
        self.status = status

    def emoji(self):
        to_string = {
            TaskStatus.NOT_STARTED: "🔲",
            TaskStatus.RUNNING: "⏳",
            TaskStatus.DONE: "✅",
        }
        return to_string[self.status] if self.status in to_string else "❓"

    def to_string(self):
        return (
            f"### {self.title}\n\n{self.emoji()} `{self.status}`\n\n{self.description}"
        )


class TaskList:
    tasks: list[Task] = []
    message = None

    def __init__(self):
        self.tasks = []

    def to_string(self):
        newline = "\n"  # backslash escapes are not supported in f-strings
        return f"### Task list\n\n{newline.join([f'{index+1}. {task.emoji()} {task.title}' for index, task in enumerate(self.tasks)])}"

    async def refresh(self):
        if not self.message:
            self.message = Message(content=self.to_string())
            await self.message.send()
        else:
            await self.message.update(content=self.to_string())

    async def add_task(self, task: Task):
        self.tasks.append(task)
        await self.refresh()
