import chainlit as cl
from chainlit.sync import asyncify, run_sync
from chainlit.emitter import get_emitter


async def async_function_from_sync():
    await cl.sleep(2)
    emitter = get_emitter()
    return emitter


def sync_function():
    emitter_from_asyncify = get_emitter()
    emitter_from_async_from_sync = run_sync(async_function_from_sync())
    return (emitter_from_asyncify, emitter_from_async_from_sync)


async def async_function():
    emitter = get_emitter()
    return emitter


@cl.on_chat_start
async def main():
    emitter_from_async = await async_function()
    if emitter_from_async:
        await cl.Message(content="emitter from async found!").send()
    else:
        await cl.ErrorMessage(content="emitter from async not found").send()

    emitter_from_asyncify, emitter_from_async_from_sync = await asyncify(
        sync_function
    )()

    if emitter_from_asyncify:
        await cl.Message(content="emitter from asyncify found!").send()
    else:
        await cl.ErrorMessage(content="emitter from asyncify not found").send()

    if emitter_from_async_from_sync:
        await cl.Message(content="emitter from async_from_sync found!").send()
    else:
        await cl.ErrorMessage(content="emitter from async_from_sync not found").send()
