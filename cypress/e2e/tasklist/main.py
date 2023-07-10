import chainlit as cl

fake_tasks = [
    "Initializing",
    "Processing data",
    "Performing calculations",
    "Making decisions based on calculations",
    "Executing commands",
    "Monitoring system performance",
    "Running diagnostics",
    "Updating software components",
    "Creating reports",
    "Scheduling future tasks",
    "Performing maintenance routines",
    "Optimizing system performance",
    "Troubleshooting issues",
    "Improving algorithms",
    "Wrapping up and preparing for the next tasks",
    "Doing a system backup",
    "Updating the security protocols",
    "Preparing for shutdown",
]


@cl.on_chat_start
async def main():
    task_list = cl.TaskList()
    task_list.status = "Running..."
    for i in range(17):
        task = cl.Task(title=fake_tasks[i])
        await task_list.add_task(task)
    await task_list.send()

    task_list.tasks[0].status = cl.TaskStatus.RUNNING
    await task_list.send()

    for i in range(9):
        task_list.tasks[i].status = cl.TaskStatus.DONE
        task_list.tasks[i + 1].status = cl.TaskStatus.RUNNING
        await task_list.send()

    task_list.tasks[9].status = cl.TaskStatus.FAILED
    await task_list.send()
