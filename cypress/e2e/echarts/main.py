from pyecharts.charts import Line
from pyecharts import options as opts
import chainlit as cl

import json


@cl.on_chat_start
async def start():
    line = Line()
    line.add_xaxis(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
    line.add_yaxis("Sales", [820, 932, 901, 934, 1290, 1330, 1320])

    line.set_global_opts(
        title_opts=opts.TitleOpts(title="Sales Data", subtitle="Weekly Sales")
    )

    elements = [cl.ECharts(content=line.dump_options_with_quotes())]

    await cl.Message(content="This message has a chart", elements=elements).send()
