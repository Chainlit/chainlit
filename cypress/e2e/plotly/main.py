import chainlit as cl
import plotly.graph_objects as go


@cl.on_chat_start
async def start():
    fig = go.Figure(
        data=[go.Bar(y=[2, 1, 3])],
        layout_title_text="A Figure Displayed with fig.show()",
    )
    elements = [cl.Plotly(name="chart", figure=fig, display="inline")]

    await cl.Message(content="This message has a chart", elements=elements).send()
