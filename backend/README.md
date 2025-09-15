<h1 align="center">Welcome to Chainlit 👋</h1>

<p align="center">
<b>Build python production-ready conversational AI applications in minutes, not weeks ⚡️</b>

</p>
<p align="center">
   <a href="https://discord.gg/k73SQ3FyUh" target="_blank">
   <img src="https://img.shields.io/discord/1088038867602526210?logo=discord&labelColor=%20%235462eb&logoColor=%20%23f5f5f5&color=%20%235462eb"
      alt="chat on Discord"></a>
    <a href="https://twitter.com/chainlit_io" rel="nofollow"><img alt="Twitter" src="https://img.shields.io/twitter/url/https/twitter.com/chainlit_io.svg?style=social&label=Follow%20%40chainlit_io" style="max-width:100%;"></a>
    <a href="https://pypistats.org/packages/chainlit" rel="nofollow"><img alt="Downloads" src="https://img.shields.io/pypi/dm/chainlit" style="max-width:100%;"></a>
        <a href="https://github.com/chainlit/chainlit/graphs/contributors" rel="nofollow"><img alt="Contributors" src="https://img.shields.io/github/contributors/chainlit/chainlit" style="max-width:100%;"></a>
    <a href="https://github.com/Chainlit/chainlit/actions/workflows/ci.yaml" rel="nofollow"><img alt="CI" src="https://github.com/Chainlit/chainlit/actions/workflows/ci.yaml/badge.svg" style="max-width:100%;"></a>
</p>

> ⚠️ **Notice:** Chainlit is now community-maintained.
>
> As of May 1st 2025, the original Chainlit team has stepped back from active development. The project is maintained by @Chainlit/chainlit-maintainers under a formal Maintainer Agreement.
>
> Maintainers are responsible for code review, releases, and security.  
> Chainlit SAS provides no warranties on future updates.
>
> Want to help maintain? [Apply here →](https://docs.google.com/forms/d/e/1FAIpQLSf6CllNWnKBnDIoj0m-DnHU6b0dj8HYFGixKy-_qNi_rD4iNA/viewform)

<p align="center">
    <a href="https://chainlit.io"><b>Website</b></a>  •  
    <a href="https://docs.chainlit.io"><b>Documentation</b></a>  •  
    <a href="https://help.chainlit.io"><b>Chainlit Help</b></a>  •  
    <a href="https://github.com/Chainlit/cookbook"><b>Cookbook</b></a>
</p>

<p align="center">
    <a href="https://trendshift.io/repositories/6708" target="_blank"><img src="https://trendshift.io/api/badge/repositories/6708" alt="Chainlit%2Fchainlit | Trendshift" style="width: 250px; height: 45px;" width="250" height="45"/></a>
</p>

https://github.com/user-attachments/assets/b3738aba-55c0-42fa-ac00-6efd1ee0d148


## Installation

Open a terminal and run:

```sh
pip install chainlit
chainlit hello
```

If this opens the `hello app` in your browser, you're all set!

### Development version

The latest in-development version can be installed straight from GitHub with:

```sh
pip install git+https://github.com/Chainlit/chainlit.git#subdirectory=backend/
```

(Requires Node and pnpm installed on the system.)

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

## 📚 More Examples - Cookbook

You can find various examples of Chainlit apps [here](https://github.com/Chainlit/cookbook) that leverage tools and services such as OpenAI, Anthropiс, LangChain, LlamaIndex, ChromaDB, Pinecone and more.

Tell us what you would like to see added in Chainlit using the Github issues or on [Discord](https://discord.gg/k73SQ3FyUh).

## 💁 Contributing

As an open-source initiative in a rapidly evolving domain, we welcome contributions, be it through the addition of new features or the improvement of documentation.

For detailed information on how to contribute, see [here](/CONTRIBUTING.md).

## 📃 License

Chainlit is open-source and licensed under the [Apache 2.0](LICENSE) license.

## Database backend selection (Postgres vs SQLite)

Chainlit supports two data layers:

- Postgres (default): high-scale, uses asyncpg
- SQLite: simple local persistence, uses SQLAlchemy + aiosqlite

Select the backend via the DATABASE_URL environment variable:

- Postgres example: `DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db`
- SQLite example: `DATABASE_URL=sqlite+aiosqlite:///./chainlit.db`

Notes

- When DATABASE_URL starts with `sqlite`, Chainlit will automatically use the SQLAlchemy data layer.
- To force a specific implementation, set CHAINLIT_DATA_LAYER:
    - `CHAINLIT_DATA_LAYER=sqlalchemy` to force SQLAlchemy (e.g., for SQLite)
    - `CHAINLIT_DATA_LAYER=asyncpg` to force Postgres implementation
- Cloud storage (S3/GCS/Azure) configuration is shared across both data layers via environment variables (`BUCKET_NAME`, `APP_AWS_*`, `APP_GCS_*`, `APP_AZURE_*`).
- Schema: Chainlit does not manage database migrations. Ensure required tables exist before running. For SQLite quick starts, see tests at `backend/tests/data/test_sql_alchemy.py` for create table statements you can adapt.
 - Schema: Chainlit does not manage database migrations. Ensure required tables exist before running. For SQLite quick starts, use `backend/chainlit/data/sqlite_schema.sql`.

Quick start for SQLite (optional)

1. Create the database file and schema (one-time):
    - On macOS/Linux: `sqlite3 chainlit.db < backend/chainlit/data/sqlite_schema.sql`
2. Run Chainlit with: `DATABASE_URL=sqlite+aiosqlite:///./chainlit.db chainlit run demo.py`
