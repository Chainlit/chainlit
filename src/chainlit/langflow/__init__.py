from chainlit.utils import check_module_version

if not check_module_version("langflow", "0.1.4"):
    raise ValueError(
        "Expected Langflow version >= 0.1.4. Run `pip install langflow --upgrade`"
    )

from typing import Dict, Optional, Union

import aiohttp

from chainlit.telemetry import trace_event


async def load_flow(schema: Union[Dict, str], tweaks: Optional[Dict] = None):
    from langflow import load_flow_from_json

    trace_event("load_langflow")

    if type(schema) == str:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                schema,
            ) as r:
                if not r.ok:
                    reason = await r.text()
                    raise ValueError(f"Error: {reason}")
                schema = await r.json()

    flow = load_flow_from_json(flow=schema, tweaks=tweaks)

    return flow
