# Welcome to Chainlit 👋

**A faster way to build chatbot UIs.**

Chainlit lets you create chatbot UIs on top of any Python code in minutes. It’s all Python, open-source, and free! Some of the key features include intermediary steps visualisation, element management & display (images, text, carousel, etc.) as well as cloud deployment.

[![](https://dcbadge.vercel.app/api/server/ZThrUxbAYw?style=flat)](https://discord.gg/ZThrUxbAYw)
[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/chainlit_io.svg?style=social&label=Follow%20%40chainlit_io)](https://twitter.com/chainlit_io)
[![CI](https://github.com/Chainlit/chainlit/actions/workflows/ci.yaml/badge.svg)](https://github.com/Chainlit/chainlit/actions/workflows/ci.yaml)

## Installation

Open a terminal and run:

```bash
$ pip install chainlit
$ chainlit hello
```

If this opens the `hello app` in your browser, you're all set!

## 📖 Documentation

Please see [here](https://docs.chainlit.io) for full documentation on:

- Getting started (installation, simple examples)
- Examples
- Reference (full API docs)

## 🚀 Quickstart

### 🐍 Pure Python

Create a new file `demo.py` with the following code:
```python
import chainlit as cl


@cl.on_message  # this function will be called every time a user inputs a message in the UI
def main(message: str):
    # this is an intermediate step
    cl.send_message(author="Tool 1", content=f"Response from tool1", indent=1)

    # send back the final answer
    cl.send_message(content=f"This is the final answer")
```

Now run it!
```
$ chainlit run demo.py -w
```

<img src="/images/quick-start.png" alt="Quick Start"></img>

### 🔗 With LangChain

Checkout our plug and play [integration](https://docs.chainlit.io/langchain) with LangChain!

## 🛣 Roadmap
- [ ] New UI elements (spreadsheet, video, carousel...)
- [ ] Create your own UI elements via component framework
- [ ] DAG-based chain-of-thought interface
- [ ] Support more LLMs in the prompt playground
- [ ] App deployment

Tell us what you would like to see added in Chainlit using the Github issues or on [Discord](https://discord.gg/ZThrUxbAYw).

## 💁 Contributing

As an open-source initiative in a rapidly evolving domain, we welcome contributions, be it through the addition of new features or the improvement of documentation.

For detailed information on how to contribute, see [here](.github/CONTRIBUTING.md).

## License
Chainlit is open-source and licensed under the [Apache 2.0](LICENSE) license.
