import chainlit as cl
from chainlit.context import get_emitter
from chainlit.sync import make_async, run_sync


async def async_function_from_sync():
    await cl.sleep(2)
    emitter = get_emitter()
    return emitter


def sync_function():
    emitter_from_make_async = get_emitter()
    emitter_from_async_from_sync = run_sync(async_function_from_sync())
    return (emitter_from_make_async, emitter_from_async_from_sync)


async def async_function():
    emitter = await another_async_function()
    return emitter


async def another_async_function():
    await cl.sleep(2)
    emitter = get_emitter()
    return emitter


@cl.on_chat_start
async def main():
    emitter_from_async = await async_function()
    if emitter_from_async:
        await cl.Message(content="emitter from async found!").send()
    else:
        await cl.ErrorMessage(content="emitter from async not found").send()

    emitter_from_make_async, emitter_from_async_from_sync = await make_async(
        sync_function
    )()

    if emitter_from_make_async:
        await cl.Message(content="emitter from make_async found!").send()
    else:
        await cl.ErrorMessage(content="emitter from make_async not found").send()

    if emitter_from_async_from_sync:
        await cl.Message(content="emitter from async_from_sync found!").send()
    else:
        await cl.ErrorMessage(content="emitter from async_from_sync not found").send()
