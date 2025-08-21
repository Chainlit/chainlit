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

2. **Build the Frontend - takes ~1 minute, NEVER CANCEL**:
   ```bash
   pnpm run buildUi
   # Timeout: Use 300+ seconds (5+ minutes)
   ```

3. **Run Tests**:
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
   # If available: pnpm test (takes variable time depending on tests)
   ```

4. **Run Development Servers**:
   ```bash
   # Start backend (in one terminal)
   cd backend
   export PATH="$HOME/.local/bin:$PATH" 
   uv run chainlit run chainlit/hello.py -h
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
# Run all linting (UI + Python) 
pnpm run lint
# Timeout: Use 300+ seconds (5+ minutes)

# Format UI code - takes ~5 seconds
pnpm run formatUi

# Format Python code using ruff (preferred)
cd backend
export PATH="$HOME/.local/bin:$PATH"
poetry run ruff format chainlit/ tests/

# NOTE: pnpm run formatPython may fail if black is not installed
# Use ruff format instead as shown above
```

### CI Requirements
- **ALWAYS** run `pnpm run lint` before committing or the CI (.github/workflows/ci.yaml) will fail.
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
├── backend/                  # Python backend with Poetry
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
- **Technology**: Python 3.10+ with Poetry, FastAPI, SocketIO
- **Entry point**: `backend/chainlit/` 
- **Tests**: `backend/tests/`
- **Dependencies**: Defined in `backend/pyproject.toml`
- **Hello app**: `backend/chainlit/hello.py`

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
poetry run chainlit run app.py -w
```

### Timing Expectations
- **pnpm install**: ~3 minutes (may fail on Cypress - this is normal)
- **poetry install**: ~2 minutes  
- **pnpm run buildUi**: ~1 minute
- **pnpm run lint**: ~2 minutes
- **Backend tests**: ~17 seconds
- **Frontend tests**: ~4 seconds
- **pnpm run formatUi**: ~5 seconds

### Common Gotchas
- **NEVER CANCEL** long-running operations - they need time to complete.
- Cypress download often fails in CI environments - this is expected.
- Use `poetry run` prefix for all Python commands in backend.
- Use `export PATH="$HOME/.local/bin:$PATH"` to ensure Poetry is available.
- The `pnpm run formatPython` command may fail - use `poetry run ruff format` instead.
- Frontend dev server connects to backend at localhost:8000.
- Always start backend before frontend for development.

### File Locations for Quick Reference
- **Main CLI**: `backend/chainlit/cli/`
- **Server code**: `backend/chainlit/server.py`
- **Frontend app**: `frontend/src/App.tsx`
- **React client**: `libs/react-client/src/`
- **CI workflows**: `.github/workflows/ci.yaml`
- **Poetry config**: `backend/pyproject.toml`
- **Frontend config**: `frontend/package.json`

## Requirements
- **Python**: >= 3.10
- **Node.js**: >= 20 (24+ recommended)
- **Poetry**: 2.1.3 (install via pipx)
- **pnpm**: Latest (install via npm)