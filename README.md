# Welcome to Chainlit by Literal AI 👋

[![](https://dcbadge.vercel.app/api/server/ZThrUxbAYw?style=flat)](https://discord.gg/k73SQ3FyUh)
[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/chainlit_io.svg?style=social&label=Follow%20%40chainlit_io)](https://twitter.com/chainlit_io)
![PyPI - Downloads](https://img.shields.io/pypi/dm/chainlit)
[![GitHub Contributors](https://img.shields.io/github/contributors/chainlit/chainlit)](https://github.com/chainlit/chainlit/graphs/contributors)
[![CI](https://github.com/Chainlit/chainlit/actions/workflows/ci.yaml/badge.svg)](https://github.com/Chainlit/chainlit/actions/workflows/ci.yaml)

**Build production-ready Conversational AI applications in minutes, not weeks ⚡️**

Chainlit is an open-source async Python framework which allows developers to build scalable Conversational AI or agentic applications.

- ✅ ChatGPT-like application
- ✅ Embedded Chatbot & Software Copilot
- ✅ Slack & Discord
- ✅ Custom frontend (build your own agentic experience)
- ✅ API Endpoint

Full documentation is available [here](https://docs.chainlit.io). You can ask Chainlit related questions to [Chainlit Help](https://help.chainlit.io/), an app built using Chainlit!

> [!NOTE]  
> Check out [Literal AI](https://literalai.com), our product to monitor and evaluate LLM applications! It works with any Python or TypeScript applications and [seamlessly](https://docs.chainlit.io/data-persistence/overview) with Chainlit by adding a `LITERAL_API_KEY` in your project.
> 
> Chainlit is developed and maintained by the Literal AI team, which is currently focused on expanding the capabilities of Literal AI. While we continue to support and maintain Chainlit, we are also committed to enabling the community to contribute, particularly in areas like integrations and data layers.

<p align="center">
    <img src="https://github.com/Chainlit/chainlit/assets/13104895/0c2cc7a9-766c-41d3-aae2-117a2d0eb8ed" alt="Chainlit user interface" width="80%"></img>
</p>

## Installation

Open a terminal and run:

```sh
pip install chainlit
chainlit hello
```

If this opens the `hello app` in your browser, you're all set!

## 🚀 Quickstart

### 🐍 Pure Python

Create a new file `demo.py` with the following code:

```python
import chainlit as cl


@cl.step(type="tool")
async def tool():
    # Fake tool
    await cl.sleep(2)
    return "Response from the tool!"


@cl.on_message  # this function will be called every time a user inputs a message in the UI
async def main(message: cl.Message):
    """
    This function is called every time a user inputs a message in the UI.
    It sends back an intermediate response from the tool, followed by the final answer.

    Args:
        message: The user's message.

    Returns:
        None.
    """


    # Call the tool
    tool_res = await tool()

    await cl.Message(content=tool_res).send()
```

Now run it!

```sh
chainlit run demo.py -w
```

<img src="/images/quick-start.png" alt="Quick Start"></img>

## 🎉 Key Features and Integrations

Full documentation is available [here](https://docs.chainlit.io). Key features:

- [💬 Multi Modal chats](https://docs.chainlit.io/advanced-features/multi-modal)
- [💭 Chain of Thought visualization](https://docs.chainlit.io/concepts/step)
- [💾 Data persistence + human feedback](https://docs.chainlit.io/data-persistence/overview)
- [🐛 Debug Mode](https://docs.chainlit.io/data-persistence/enterprise#debug-mode)
- [👤 Authentication](https://docs.chainlit.io/authentication/overview)

Chainlit is compatible with all Python programs and libraries. That being said, it comes with integrations for:

- [LangChain](https://docs.chainlit.io/integrations/langchain)
- [Llama Index](https://docs.chainlit.io/integrations/llama-index)
- [Autogen](https://github.com/Chainlit/cookbook/tree/main/pyautogen)
- [OpenAI Assistant](https://github.com/Chainlit/cookbook/tree/main/openai-assistant)
- [Haystack](https://docs.chainlit.io/integrations/haystack)

## 📚 More Examples - Cookbook

You can find various examples of Chainlit apps [here](https://github.com/Chainlit/cookbook) that leverage tools and services such as OpenAI, Anthropiс, LangChain, LlamaIndex, ChromaDB, Pinecone and more.

Tell us what you would like to see added in Chainlit using the Github issues or on [Discord](https://discord.gg/k73SQ3FyUh).

## 💁 Contributing

As an open-source initiative in a rapidly evolving domain, we welcome contributions, be it through the addition of new features or the improvement of documentation.

For detailed information on how to contribute, see [here](.github/CONTRIBUTING.md).

## 📃 License

Chainlit is open-source and licensed under the [Apache 2.0](LICENSE) license.
