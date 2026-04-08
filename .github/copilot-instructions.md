# Chainlit Development Instructions

Chainlit is a Python framework for building conversational AI applications with Python backend and React frontend. It uses uv for Python dependency management and pnpm for Node.js packages.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test the Repository

**CRITICAL**: All commands must complete - NEVER CANCEL any build or test operations. Use appropriate timeouts.

1. **Install Dependencies (Required first)**:

   ```bash
   # Install uv (if not available)
   python3 -m pip install pipx
   python3 -m pipx install uv
   export PATH="$HOME/.local/bin:$PATH"

   # Install pnpm (if not available)
   npm install -g pnpm

   # Install Python dependencies - takes ~2 minutes, NEVER CANCEL
   cd backend
   uv sync --extra tests --extra mypy --extra dev --extra custom-data
   # Timeout: Use 300+ seconds (5+ minutes)

   # Install Node.js dependencies - takes ~3 minutes, NEVER CANCEL
   cd ..
   pnpm install --frozen-lockfile
   # Timeout: Use 600+ seconds (10+ minutes)
   # NOTE: Cypress download may fail due to network restrictions - this is expected in CI environments
   ```

2. **Run Tests**:

   ```bash
   # Backend tests - takes ~17 seconds, NEVER CANCEL
   cd backend
   export PATH="$HOME/.local/bin:$PATH"
   uv run pytest --cov=chainlit/
   # Timeout: Use 120+ seconds (2+ minutes)

   # Frontend tests - takes ~4 seconds
   cd ../frontend
   pnpm test
   # Timeout: Use 60 seconds

   # E2E tests require Cypress download - may not work in restricted environments
   # If available: pnpm test:e2e (takes variable time depending on tests)
   ```

3. **Run Development Servers**:

   ```bash
   # Start backend (in one terminal)
   cd backend
   export PATH="$HOME/.local/bin:$PATH"
   uv run chainlit run chainlit/sample/hello.py -h
   # Available at http://localhost:8000

   # Start frontend dev server (in another terminal)
   cd frontend
   pnpm run dev
   # Available at http://localhost:5173/
   ```

## Validation

### Manual Validation Requirements

- **ALWAYS** manually validate any changes by running complete scenarios.
- **ALWAYS** test the Chainlit application after making changes.
- Create a test app and verify it runs: `uv run chainlit run /path/to/test.py -h`
- **ALWAYS** run through at least one complete user workflow after making changes.

### Linting and Formatting - takes ~2 minutes, NEVER CANCEL

```bash
# Lint (check)
pnpm lint
# Timeout: Use 300+ seconds (5+ minutes)

# Lint (auto-fix)
pnpm lint:fix

# Check formatting
pnpm format-check

# Fix formatting
pnpm format

# Python (scripts/ wrappers around ruff and mypy)
uv run scripts/lint.py
uv run scripts/format.py
uv run scripts/format.py --check
```

### CI Requirements

- **ALWAYS** run `pnpm lint` and `pnpm format-check` before committing or the CI (.github/workflows/ci.yaml) will fail.
- The CI runs: pytest, lint-backend, lint-ui, and e2e-tests.
- **NEVER CANCEL** any CI commands - they take time but must complete.

## Key Project Structure

### Repository Root

```
/
├── README.md
├── CONTRIBUTING.md
├── package.json              # Root pnpm workspace config
├── pnpm-workspace.yaml       # Workspace definition
├── backend/                  # Python backend with uv
├── frontend/                 # React frontend app
├── libs/
│   ├── react-client/         # React client library
│   └── copilot/             # Copilot functionality
├── cypress/                  # E2E tests
└── .github/
    ├── workflows/            # CI/CD pipelines
    └── actions/              # Reusable GitHub actions
```

### Working with the Backend

- **Technology**: Python 3.10+ with uv, FastAPI, SocketIO
- **Entry point**: `backend/chainlit/`
- **Tests**: `backend/tests/`
- **Dependencies**: Defined in `backend/pyproject.toml`
- **Hello app**: `backend/chainlit/sample/hello.py`

### Working with the Frontend

- **Technology**: React 18+ with Vite, TypeScript, Tailwind CSS
- **Entry point**: `frontend/src/`
- **Dependencies**: Defined in `frontend/package.json`
- **Build output**: `frontend/dist/`

## Common Tasks

### Creating a New Chainlit App

```python
# Create app.py
import chainlit as cl

@cl.on_message
async def main(message: cl.Message):
    await cl.Message(content=f"You said: {message.content}").send()

# Run it
uv run chainlit run app.py -w
```

### Timing Expectations

- **pnpm install**: ~3 minutes (may fail on Cypress - this is normal)
- **uv install**: ~2 minutes
- **pnpm build**: ~1 minute
- **pnpm run lint**: ~2 minutes
- **Backend tests**: ~17 seconds
- **Frontend tests**: ~4 seconds
- **pnpm format-check**: ~12 seconds
- **pnpm format**: ~12 seconds

### Common Gotchas

- **NEVER CANCEL** long-running operations - they need time to complete.
- Cypress download often fails in CI environments - this is expected.
- Use `uv run` prefix for all Python commands in backend.
- Use `export PATH="$HOME/.local/bin:$PATH"` to ensure uv is available.
- Python lint/format/type-check: use `uv run scripts/lint.py`, `uv run scripts/format.py`, `uv run scripts/type_check.py` from repo root.
- Frontend dev server connects to backend at localhost:8000.
- Always start backend before frontend for development.

### File Locations for Quick Reference

- **Main CLI**: `backend/chainlit/cli/`
- **Server code**: `backend/chainlit/server.py`
- **Frontend app**: `frontend/src/App.tsx`
- **React client**: `libs/react-client/src/`
- **CI workflows**: `.github/workflows/ci.yaml`
- **uv config**: `backend/pyproject.toml`
- **Frontend config**: `frontend/package.json`

## Requirements

- **Python**: >= 3.10
- **Node.js**: >= 20 (24+ recommended)
- **uv**: 2.1.3 (install via pipx)
- **pnpm**: Latest (install via npm)
