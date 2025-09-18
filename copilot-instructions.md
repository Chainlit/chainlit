# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick Start

### Prerequisites
- **Python**: >= 3.10
- **Node.js**: >= 20 (24+ recommended)
- **uv**: 2.1.3+ (install via pipx)
- **pnpm**: Latest (install via npm)

### Essential Setup Commands

**CRITICAL**: Never cancel build operations - they can take several minutes and must complete.

```bash
# Install Python dependencies (~2 minutes)
cd backend
uv sync --extra tests --extra mypy --extra dev --extra custom-data
# Timeout: Use 300+ seconds minimum

# Install Node.js dependencies (~3 minutes, Cypress may fail - this is normal)
cd ..
pnpm install --frozen-lockfile
# Timeout: Use 600+ seconds minimum

# Build frontend (~1 minute)
pnpm run buildUi
# Timeout: Use 300+ seconds minimum
```

### Development Servers

```bash
# Backend (Terminal 1)
cd backend
export PATH="$HOME/.local/bin:$PATH"
uv run chainlit run chainlit/hello.py -h
# Available at http://localhost:8000

# Frontend (Terminal 2) - for UI development
cd frontend
pnpm run dev
# Available at http://localhost:5173/
```

### Testing & Linting

```bash
# Backend tests (~17 seconds)
cd backend
uv run pytest --cov=chainlit/

# Frontend tests (~4 seconds)
cd frontend
pnpm test

# All linting (~2 minutes, required before commits)
pnpm run lint
```

## Architecture Overview

Chainlit is a Python framework for building conversational AI applications with a **monorepo** structure:

```
/
├── backend/              # Python backend (FastAPI + SocketIO)
│   ├── chainlit/        # Main package
│   ├── pyproject.toml   # uv configuration
│   └── tests/          # Python tests
├── frontend/            # React frontend (Vite + TypeScript)
├── libs/
│   ├── react-client/    # React hooks & API client
│   └── copilot/        # Embeddable widget
├── cypress/            # E2E tests
└── pnpm-workspace.yaml # Workspace definition
```

### Core Architecture Components

**Backend (FastAPI + SocketIO)**
- **FastAPI** serves REST API and static files
- **SocketIO** handles real-time WebSocket communication
- **uv** manages Python dependencies
- **Entry point**: `backend/chainlit/server.py`

**Frontend (React + Recoil)**
- **React 18+** with TypeScript and Tailwind CSS
- **Recoil** for state management
- **Vite** for development and building
- **Entry point**: `frontend/src/App.tsx`

**Communication Flow**
1. Frontend connects via WebSocket to backend
2. Real-time bidirectional messaging through SocketIO
3. File uploads handled via REST endpoints
4. Authentication managed through JWT tokens

## Development Guide

### Core Patterns

**Creating a Chainlit App**
```python
import chainlit as cl

@cl.on_message
async def main(message: cl.Message):
    await cl.Message(content=f"You said: {message.content}").send()

# Run with: uv run chainlit run app.py -w
```

**Key Decorators & Hooks**
- `@cl.on_message` - Handle user messages
- `@cl.on_chat_start` - Initialize chat session
- `@cl.step(type="tool")` - Create structured steps
- `@cl.on_chat_end` - Cleanup on session end

**Message Types**
- `cl.Message` - Standard chat messages
- `cl.AskUserMessage` - Request user input
- `cl.ErrorMessage` - Error notifications
- Elements: `cl.Image`, `cl.File`, `cl.Audio`, etc.

### File Locations

**Backend Core**
- `backend/chainlit/__init__.py` - Main package exports
- `backend/chainlit/server.py` - FastAPI application
- `backend/chainlit/cli/` - Command-line interface
- `backend/chainlit/socket.py` - WebSocket handlers
- `backend/chainlit/auth/` - Authentication modules

**Frontend Core**
- `frontend/src/App.tsx` - Main React application
- `frontend/src/api/index.ts` - API client configuration
- `frontend/src/components/chat/` - Chat UI components
- `libs/react-client/src/` - Reusable React hooks

### Common Development Tasks

**Running Single Tests**
```bash
# Backend specific test
cd backend
uv run pytest tests/test_specific.py::test_function

# Frontend specific test
cd frontend
pnpm test src/components/Button.test.tsx

# E2E specific test
pnpm test -- --spec cypress/e2e/specific_test.cy.ts
```

**Format Code**
```bash
# Format frontend code
pnpm run formatUi

# Format Python code (use ruff instead of black)
cd backend
uv run ruff format chainlit/ tests/
```

**Manual Testing**
- Always test complete user workflows after changes
- Use `uv run chainlit run /path/to/test.py -h` for headless testing
- Frontend dev server connects to backend at localhost:8000

### Build & Deployment

**Production Build**
```bash
# Build all frontend components
pnpm run buildUi

# This builds:
# - libs/react-client (shared hooks)
# - libs/copilot (embeddable widget)  
# - frontend (main app)
```

**Environment Variables**
- `CHAINLIT_AUTH_SECRET` - JWT signing secret (required for auth)
- `CHAINLIT_HOST` / `CHAINLIT_PORT` - Server binding
- `OPENAI_API_KEY` - For LLM integrations

## Critical Gotchas

### Build & Install
- **Never cancel** long-running operations (pnpm install, buildUi, tests)
- Cypress download often fails in CI - this is expected and normal
- Always use `uv run` prefix for Python commands in backend
- Use `export PATH="$HOME/.local/bin:$PATH"` to ensure uv availability
- `pnpm run formatPython` may fail - use `uv run ruff format` instead

### Development
- Start backend before frontend for development
- Frontend dev server requires backend running on port 8000
- WebSocket reconnection may require browser refresh during development
- File uploads require proper MIME type configuration
- Theme changes require CSS variable updates

### Timing Expectations
- **pnpm install**: ~3 minutes
- **uv sync**: ~2 minutes
- **pnpm run buildUi**: ~1 minute
- **pnpm run lint**: ~2 minutes
- **Backend tests**: ~17 seconds
- **Frontend tests**: ~4 seconds

## Authentication & Security

Chainlit supports multiple authentication methods:

**OAuth Providers**
- Configure in `backend/chainlit/oauth_providers.py`
- Supports Google, GitHub, Azure, etc.

**Header-based Auth**
- For reverse proxy setups
- Configure via `@cl.header_auth_callback`

**Password Auth**
- Simple username/password
- Configure via `@cl.password_auth_callback`

**JWT Tokens**
- All auth methods generate JWT tokens
- Stored in HTTP-only cookies for security

## Testing Strategy

### Test Levels
1. **Unit Tests**: Backend (`pytest`) & Frontend (`vitest`)
2. **Integration Tests**: API endpoints and component interactions  
3. **E2E Tests**: Full user workflows with Cypress

### CI Pipeline
The CI runs 4 main jobs (see `.github/workflows/ci.yaml`):
- `pytest` - Backend unit tests
- `lint-backend` - Python code quality (mypy, ruff)
- `lint-ui` - Frontend code quality (eslint, tsc)
- `e2e-tests` - Full application testing

All must pass for PR merge. Run `pnpm run lint` locally to prevent CI failures.

## Performance Considerations

**WebSocket Management**
- Connections auto-reconnect on disconnect
- Session state persists during reconnections
- Use connection pooling in production

**File Handling**
- Files stored temporarily in `FILES_DIRECTORY`
- Cleanup happens on app shutdown
- Configure max file sizes via `max_size_mb`

**State Management**
- Frontend uses Recoil for reactive state
- Chat history managed client-side
- Backend maintains session context per connection

## Community Maintenance Notice

⚠️ **Notice**: Chainlit is now community-maintained as of May 1st 2025. The original team has stepped back from active development. The project is maintained by @Chainlit/chainlit-maintainers under a formal Maintainer Agreement.

**Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines and development setup instructions.