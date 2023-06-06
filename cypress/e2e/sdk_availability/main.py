import chainlit as cl
from chainlit.sync import asyncify, run_sync
from chainlit.sdk import get_sdk


async def async_function_from_sync():
    await cl.sleep(2)
    sdk = get_sdk()
    return sdk


def sync_function():
    sdk_from_asyncify = get_sdk()
    sdk_from_async_from_sync = run_sync(async_function_from_sync())
    return (sdk_from_asyncify, sdk_from_async_from_sync)


async def async_function():
    sdk = get_sdk()
    return sdk


@cl.on_chat_start
async def main():
    sdk_from_async = await async_function()
    if sdk_from_async:
        await cl.Message(content="SDK from async found!").send()
    else:
        await cl.ErrorMessage(content="SDK from async not found").send()

    sdk_from_asyncify, sdk_from_async_from_sync = await asyncify(sync_function)()

    if sdk_from_asyncify:
        await cl.Message(content="SDK from asyncify found!").send()
    else:
        await cl.ErrorMessage(content="SDK from asyncify not found").send()

    if sdk_from_async_from_sync:
        await cl.Message(content="SDK from async_from_sync found!").send()
    else:
        await cl.ErrorMessage(content="SDK from async_from_sync not found").send()
