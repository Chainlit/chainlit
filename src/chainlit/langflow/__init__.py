try:
    import langflow

    if langflow.__version__ < "0.1.4":
        raise ValueError(
            "Langflow version is too old, expected >= 0.1.4. Run `pip install langflow --upgrade`"
        )

    LANGFLOW_INSTALLED = True
except ImportError:
    LANGFLOW_INSTALLED = False

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

    flow = load_flow_from_json(input=schema, tweaks=tweaks)

    return flow
