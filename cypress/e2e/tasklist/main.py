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

# Not a good practice in a normal chainlit server as it's global to all users
# However it work in a testing scenario where we have just one user
task_list = None


@cl.on_message
async def on_message():
    # Waiting on a message to remove the tasklist to make sure
    # all checks are successful before we remove it
    await task_list.remove()


@cl.on_chat_start
async def main():
    global task_list
    await cl.sleep(1)
    task_list = cl.TaskList()
    task_list.status = "Running..."
    for i in range(17):
        task = cl.Task(title=fake_tasks[i])
        await cl.sleep(0.2)
        await task_list.add_task(task)
    await task_list.send()

    await cl.sleep(1)

    task_list.tasks[0].status = cl.TaskStatus.RUNNING
    await task_list.send()

    await cl.sleep(1)

    for i in range(9):
        task_list.tasks[i].status = cl.TaskStatus.DONE
        task_list.tasks[i + 1].status = cl.TaskStatus.RUNNING
        await cl.sleep(0.2)
        await task_list.send()

    await cl.sleep(1)

    task_list.tasks[9].status = cl.TaskStatus.FAILED
    await task_list.send()
