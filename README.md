[![](https://dcbadge.vercel.app/api/server/ZThrUxbAYw)](https://discord.gg/ZThrUxbAYw)

# Welcome to Chainlit 👋

**A faster way to build and share LLM based agents.**

Chainlit lets you turn agents (LangChain or Pure Python) into shareable web apps in minutes. It’s all Python, open-source, and free!

## Installation

Open a terminal and run:

```bash
$ pip install chainlit
$ chainlit hello
```

If this opens the `hello app` in your browser, you're all set!

## Documentation

You can find the Chainlit documentation [on the website](https://docs.chainlit.io).

## Quickstart

### Pure Python

Create a new file `demo.py` with the following code:
```python
import chainlit as cl

@cl.on_message # this function will be called every time a user inputs a message in the UI
def main(message: str):
   # this is an intermediate step
   cl.send_message(
      author="Tool 1"
      content=f"Response from tool1"
      indent=1
   )

   # send back the final answer
   cl.send_message(
      content=f"This is the final answer"
   )
```

Now run it!
```
$ chainlit run demo.py -w
```

<img src="/images/quick-start.png" alt="Quick Start"></img>

### With LangChain

Checkout our plug and play [integration](https://docs.chainlit.io/langchain) with LangChain!

## Contribute

- [Python SDK](/src)
- [UI](/src/chainlit/frontend/)

## Telemetry

Chainlit collects specific data points by default to help us better understand and improve the package based on community usage. We greatly value your privacy and ensure that the data we collect [is limited](/src/chainlit//telemetry.py) and does not compromise user privacy.

### Data Collected

Chainlit collects the following data points:

- SDK function calls (excluding any input, parameters or return values)
- Duration of SDK function calls

This information allows us to get an accurate representation of how the community uses Chainlit and make improvements accordingly.

### Opting Out of Telemetry

If you prefer not to share this data, you can easily opt out by setting `enable_telemetry = false` in your `.chainlit/config.toml` file. This will disable the telemetry feature and prevent any data from being collected.


## License

Chainlit is completely free and open-source and licensed under the [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) license.