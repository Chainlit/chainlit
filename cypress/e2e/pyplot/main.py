import matplotlib.pyplot as plt

import chainlit as cl


@cl.on_chat_start
async def start():
    fig, ax = plt.subplots()
    ax.plot([1, 2, 3, 4], [1, 4, 2, 3])
    elements = [cl.Pyplot(name="chart", figure=fig)]

    await cl.Message(content="This message has a chart", elements=elements).send()
