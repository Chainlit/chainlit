# Add comprehensive test coverage for message module

## Summary

This PR adds comprehensive unit test coverage for the `chainlit.message` module, which previously had no test coverage. The test suite includes 34 test cases covering all message classes and their core functionality.

## What's Changed

- **Added**: `backend/tests/test_message.py` - Complete test suite for the message module
  - 34 test cases organized into 7 test classes
  - Covers all public APIs and edge cases
  - Follows existing project testing patterns and conventions

## Test Coverage

### Test Classes

1. **TestMessageBase** (7 tests)
   - Serialization/deserialization (`to_dict`, `from_dict`)
   - Update and remove operations
   - Token streaming functionality
   - Edge cases (empty tokens, sequence mode)

2. **TestMessage** (9 tests)
   - Initialization with various content types (string, dict, None)
   - Sending messages with actions and elements
   - Updating and removing actions
   - Handling non-serializable content

3. **TestErrorMessage** (4 tests)
   - Error message initialization
   - Error persistence and failure handling
   - Custom author support

4. **TestAskUserMessage** (4 tests)
   - User input prompts
   - Timeout handling
   - Message removal

5. **TestAskFileMessage** (4 tests)
   - File upload prompts
   - Multiple file acceptance formats
   - Response handling and timeouts

6. **TestAskActionMessage** (3 tests)
   - Action selection prompts
   - Action lifecycle (send/remove)
   - Timeout scenarios

7. **TestMessageIntegration** (2 tests)
   - Messages with combined actions and elements
   - Complex update scenarios

## Why This Matters

- **Improves code quality**: Ensures message functionality works as expected
- **Prevents regressions**: Catches breaking changes early
- **Documents behavior**: Tests serve as living documentation
- **Increases confidence**: Enables safer refactoring of message-related code

## Testing

All tests follow the existing project patterns:
- Uses `pytest` with `pytest-asyncio` for async tests
- Leverages fixtures from `conftest.py` (`mock_chainlit_context`, etc.)
- Consistent with other test files in the project
- No linting errors

### Run Tests

```bash
cd backend
uv run pytest tests/test_message.py -v
```

### Expected Results

All 34 tests should pass, providing comprehensive coverage of the message module functionality.

## Checklist

- [x] Tests follow existing project patterns
- [x] All tests pass locally
- [x] No linting errors
- [x] Tests cover core functionality
- [x] Edge cases are handled
- [x] Code follows project style guidelines

## Related

This addresses the lack of test coverage for the `chainlit.message` module, which is a core component of the Chainlit framework for handling user and assistant messages.

