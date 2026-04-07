# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Backward Compatibility (CRITICAL)

All changes MUST be backward-compatible. If a refactor or breaking change is unavoidable, notify the user and stop — do not proceed without explicit approval. When approved, prefer adding a compatibility layer over keeping legacy code in place.

## Overview

Chainlit is a Python framework for building production-ready conversational AI applications. It consists of a Python/FastAPI backend and a React frontend, with a pnpm monorepo for the JS packages.

## Prerequisites

- Python: **3.13** (3.10+ is the framework's minimum, but development targets 3.13)
- Node.js: **24+**
- [uv](https://docs.astral.sh/uv/) — Python package manager
- [pnpm 9](https://pnpm.io/) — Node.js package manager (Corepack)

## Quick Start

### Install

| | Command | Directory |
|---|---|---|
| Backend  | `uv sync --all-extras` | `backend/` |
| Frontend | `pnpm install` | repo root |

### Build

| | Command | Directory | What it does |
|---|---|---|---|
| Backend | `uv build` | `backend/` | Build Python package — runs `pnpm buildUi`, then copies assets into `backend/chainlit/frontend/dist/` and `backend/chainlit/copilot/dist/` |
| Frontend | `pnpm run buildUi` | repo root | Build libs + frontend JS assets |
| Frontend (libs only) | `pnpm run build:libs` | repo root | Build only `react-client` and `copilot` libs |

### Dev servers

| | Command | Directory | URL |
|---|---|---|---|
| Backend | `uv run chainlit run chainlit/sample/hello.py -h` | `backend/` | http://localhost:8000 |
| Frontend | `pnpm run dev` | `frontend/` | http://localhost:5173 (proxies to :8000) |

### Tests

| | Command | Directory |
|---|---|---|
| Backend (all) | `uv run pytest --cov=chainlit/` | `backend/` |
| Backend (single file) | `uv run pytest tests/test_file.py` | `backend/` |
| Frontend unit | `pnpm test` | `frontend/` |
| E2E (Cypress) | `pnpm test` | repo root |

### Lint & Format

| | Command | Directory |
|---|---|---|
| Lint all | `pnpm run lint` | repo root |
| Lint frontend only | `pnpm run lintUi` | repo root |
| Format Python | `uv run ruff format chainlit/ tests/` | `backend/` |
| Format JS/TS | `pnpm run formatUi` | repo root |

### Type checking

| | Command | Directory |
|---|---|---|
| Python (ty) | `uv run ty check chainlit tests` | `backend/` |
| TypeScript | `tsc --noemit` | `frontend/` |

Run `pnpm run lint` before committing — CI enforces this.

### Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Format: `<type>(<optional scope>): <description>`.

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`. Scope is optional but encouraged (e.g. `fix(data): ...`, `feat(i18n): ...`).

All commits made with AI assistance **must** include a `Co-Authored-By` trailer identifying the AI agent. Add it as the last line of the commit message body:

```
Co-Authored-By: <Agent Name> <agent-email-or-noreply>
```

Examples:
- `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- `Co-Authored-By: GitHub Copilot <noreply@github.com>`
- `Co-Authored-By: Gemini CLI <noreply@google.com>`

## Tech Stack

| Layer | Stack |
|---|---|
| **Frontend** | React 18, TypeScript 5.2, Vite 5, Tailwind CSS 3, Vitest, Zod 3 |
| **Frontend (state & routing)** | Recoil, React Router 6, react-hook-form, socket.io-client, SWR |
| **Frontend (rendering)** | react-markdown + remark-gfm/math + rehype-katex/raw, highlight.js, lucide-react (icons), Radix UI (primitives), Plotly.js |
| **Backend** | Python 3.13, FastAPI, Starlette, Uvicorn, python-socketio, Pydantic 2, PyJWT, httpx |
| **LLM integrations** | MCP, LangChain, LlamaIndex, OpenAI SDK, Semantic Kernel, MistralAI |
| **Infra / persistence** | SQLAlchemy (PostgreSQL/SQLite), DynamoDB + S3 (boto3), Azure Blob / Data Lake, Google Cloud Storage, LiteralAI |
| **DX** | Husky (pre-commit), ESLint, Prettier, ruff, ty, pytest, Cypress |

## Architecture

### Monorepo structure

```
backend/          # Python package (published to PyPI as "chainlit")
frontend/         # React app (built output served by backend)
libs/
  react-client/   # @chainlit/react-client — published npm package with React hooks
  copilot/        # Copilot widget (embedded chat bubble)
cypress/          # E2E tests
```

The pnpm workspace includes `frontend/`, `libs/react-client/`, and `libs/copilot/`. The built frontend assets are copied into `backend/chainlit/frontend/dist/` and served as static files.

### Backend (`backend/chainlit/`)

**Entry point for user apps**: `__init__.py` re-exports all public API decorators and classes.

**Key files:**
- `server.py` — FastAPI app, all REST routes (auth, elements, threads, file upload), serves the built frontend SPA, mounts the SocketIO app
- `socket.py` — SocketIO event handlers for real-time WebSocket communication (connect, message, audio, etc.)
- `callbacks.py` — Decorator functions registered via `@cl.on_message`, `@cl.on_chat_start`, `@cl.on_audio_chunk`, etc. These store functions on `config.code.*`
- `config.py` — Reads `.chainlit/config.toml` from `APP_ROOT`. `ChainlitConfig` holds both static TOML config and runtime user-registered callbacks. `APP_ROOT` defaults to `os.getcwd()`.
- `session.py` — `WebsocketSession` (per-connection state: user, files, MCP connections, message queue) and `HTTPSession`
- `context.py` — `ChainlitContext` per-coroutine context variable (similar to thread-local), providing access to the current session and emitter
- `emitter.py` — Sends events back to the frontend through the SocketIO session
- `data/base.py` — `BaseDataLayer` ABC for persistence (threads, steps, elements, users, feedback). Implementations: `sql_alchemy.py`, `dynamodb.py`, `literalai.py`
- `auth/` — JWT creation/validation (`jwt.py`), OAuth state cookies (`cookie.py`)
- `types.py` — Shared Pydantic models for API request/response types

**Data layer pattern**: The data layer is optional (no persistence by default). Register a custom implementation with `@cl.data_layer` decorator or use the built-in SQLAlchemy/DynamoDB/LiteralAI implementations. The `@queue_until_user_message()` decorator on `BaseDataLayer` methods queues write operations until the first user message arrives.

**Integrations**: `langchain/`, `llama_index/`, `openai/`, `semantic_kernel/`, `mistralai/` — each provides callback handlers that bridge those frameworks into Chainlit steps/messages.

### Frontend (`frontend/src/`)

React 18 + TypeScript + Vite, styled with Tailwind CSS and Radix UI primitives.

- `main.tsx` — React root, wraps app in `RecoilRoot` and `ChainlitContext.Provider`
- `App.tsx` — Handles auth readiness, chat profile selection, and WebSocket connection lifecycle
- `router.tsx` — Client-side routes: `/` (Home), `/thread/:id`, `/element/:id`, `/login`, `/login/callback`, `/share/:id`, `/env`
- `state/` — Recoil atoms: `chat.ts` (messages, elements, tasks), `project.ts` (config, session), `user.ts` (env vars)
- `components/chat/` — Core chat UI (message list, input bar, elements, audio)
- `components/header/` — Top navigation bar
- `components/LeftSidebar/` — Thread history sidebar

### `@chainlit/react-client` (`libs/react-client/src/`)

Publishable npm package — the bridge between the React UI and the backend WebSocket.

- `api.ts` — `ChainlitAPI` class: HTTP calls to backend REST endpoints
- `useChatSession.ts` — Manages socket.io connection lifecycle
- `useChatMessages.ts` — Exposes message tree state
- `useChatData.ts` — Exposes elements, actions, tasklists, connection status
- `useChatInteract.ts` — `sendMessage`, `replyMessage`, `callAction`, `stopTask`, `clear`
- `state.ts` — Recoil atoms shared between the lib and consuming apps

State is managed via Recoil; consuming apps must wrap the tree in `<RecoilRoot>` and provide a `ChainlitAPI` instance via `ChainlitContext.Provider`.

### Communication flow

1. User sends a message → `useChatInteract.sendMessage` → emits `client_message` over SocketIO
2. Backend `socket.py` handler receives it → calls `config.code.on_message(message)`
3. User's app calls `cl.Message(...).send()` → `emitter.py` emits `new_message` back over SocketIO
4. Frontend `useChatMessages` updates Recoil state → component re-renders

### App configuration

Apps configure Chainlit via `.chainlit/config.toml` (created automatically on first run). Key sections: `[project]` (auth, session timeouts, CORS), `[UI]` (name, theme, layout).

---

## Documentation Verification Requirements

Before writing/modifying code, verify against official docs.

**Lookup order**: Context7 MCP (preferred) → WebFetch → WebSearch.

Pre-resolved Context7 library IDs: [docs/context7.md](docs/context7.md)

Cross-reference API signatures and patterns during implementation. When uncertain, always check docs rather than relying on training data.
