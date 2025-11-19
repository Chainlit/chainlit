# LangChain Integration Tests

Essential test coverage for the Chainlit LangChain integration.

## Test Files

### `test_async_callback.py` (6 tests)
Core async callback handler tests:
- Tracer initialization
- LLM start and token streaming
- Trace management and step creation
- Run updates
- Error handling

### `test_sync_callback.py` (8 tests)
Helper class and filtering tests:
- **FinalStreamHelper**: Answer prefix detection
- **GenerationHelper**: Message conversion, LLM settings extraction, value serialization
- **Run Filtering**: Ignore/keep logic, parent ID traversal

### `test_chain_types.py` (4 tests)
Chain type and hierarchy tests:
- Different run types (agent, tool, llm, chain)
- Nested chain hierarchies
- Ignored runs (RunnableSequence, etc.)
- Custom filtering with to_ignore/to_keep

## Running the Tests

### Quick Start

Simply run pytest from the backend directory:

```bash
pytest tests/langchain/ -v
```

### Prerequisites

Ensure you have the virtual environment activated with all dependencies installed:
   - Windows (PowerShell): `.\venv\Scripts\Activate.ps1`
   - Windows (CMD): `venv\Scripts\activate.bat`
   - Linux/Mac: `source venv/bin/activate`

3. **Install dependencies**:
   ```bash
   pip install -e ".[tests]"
   ```

### Test Options

#### Run specific test files
```bash
# Run only async callback tests
pytest tests/langchain/test_async_callback.py -v

# Run only sync callback tests
pytest tests/langchain/test_sync_callback.py -v

# Run only chain types tests
pytest tests/langchain/test_chain_types.py -v
```

#### Run specific test functions
```bash
# Run a specific test
pytest tests/langchain/test_async_callback.py::test_tracer_initialization -v

# Run tests matching a pattern
pytest tests/langchain/ -k "error" -v
```

#### Run with coverage
```bash
# Generate coverage report
pytest tests/langchain/ --cov=chainlit.langchain --cov-report=term-missing

# Generate HTML coverage report
pytest tests/langchain/ --cov=chainlit.langchain --cov-report=html
```

#### Other useful options
```bash
# Run in quiet mode (less verbose)
pytest tests/langchain/ -q

# Stop on first failure
pytest tests/langchain/ -x

# Show local variables on failure
pytest tests/langchain/ -l

# Run tests in parallel (requires pytest-xdist)
pytest tests/langchain/ -n auto
```

## Test Coverage

The 18 tests cover:

1. **Initialization**: Tracer setup and configuration
2. **Async Callbacks**: LLM start, token streaming, trace management
3. **Helper Classes**: FinalStreamHelper and GenerationHelper utilities
4. **Run Filtering**: Ignore/keep logic and parent ID management
5. **Chain Types**: Different run types and nested hierarchies
6. **Error Handling**: Error callback processing

## Test Fixtures

The tests use the following fixtures from `tests/conftest.py`:

- `mock_chainlit_context`: Provides a mock Chainlit context for async operations
- `mock_session`: Provides a mock WebSocket session
- `persisted_test_user`: Provides a test user object

## Dependencies

The tests require the following packages (installed via `pip install -e ".[tests]"`):

- `pytest>=8.3.2`
- `pytest-asyncio>=0.23.8`
- `pytest-cov>=5.0.0` (for coverage reports)
- `langchain>=0.2.4`
- `openai>=1.11.1`
- Other dependencies from `pyproject.toml`

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Use descriptive test names that explain what is being tested
3. Add docstrings to test functions
4. Mock external dependencies appropriately
5. Ensure tests are isolated and don't depend on external state
6. Update this README if adding new test categories

## Troubleshooting

### Import Errors
If you encounter import errors, ensure:
- Virtual environment is activated
- Dependencies are installed: `pip install -e ".[tests]"`
- You're running from the `backend` directory

### Async Test Failures
If async tests fail:
- Check that `pytest-asyncio` is installed
- Verify `asyncio_mode = "auto"` is set in `pyproject.toml`

### Mock Issues
If mocks aren't working as expected:
- Ensure you're patching the correct import path
- Use `AsyncMock` for async methods
- Verify the mock is applied before the code under test runs
