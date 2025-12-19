# LLM Picker → Modes Implementation Handover Summary

## Current Status

The LLM picker feature is mostly implemented and working. The UI displays a dropdown in the message composer that allows users to select from a list of LLMs. See screenshots below:

![LLM Picker closed state](C:/Users/Haze/.gemini/antigravity/brain/35b4bf55-927d-4df2-875b-da44655f84af/uploaded_image_0_1766152819530.png)

![LLM Picker open with options](C:/Users/Haze/.gemini/antigravity/brain/35b4bf55-927d-4df2-875b-da44655f84af/uploaded_image_1_1766152819530.png)

---

## Files Modified & Created (Current LLM Implementation)

### Backend (Python)
- **`backend/chainlit/types.py`**: Added `LLMDict` TypedDict definition
- **`backend/chainlit/message.py`**: Updated `Message` class to include `llm` field
- **`backend/chainlit/step.py`**: Updated `StepDict` to include `llm` field
- **`backend/chainlit/emitter.py`**: Added `set_llms` method to send LLM configurations to frontend
- **`backend/chainlit/config.py`**: Added `set_llms` callback to `CodeSettings`
- **`backend/chainlit/server.py`**: Integrated `set_llms` into WebSocket connection initialization
- **`backend/chainlit/__init__.py`**: Exported the `set_llms` decorator

### Frontend (TypeScript/React)
- **`libs/react-client/src/types/llm.ts`**: [NEW] Defined `ILLM` interface
- **`libs/react-client/src/state.ts`**: Added `llmsState` Recoil atom
- **`libs/react-client/src/useChatSession.ts`**: Added socket listener for `set_llms` event
- **`libs/react-client/src/useConfig.ts`**: Updated hook to include `llms` config
- **`frontend/src/components/chat/MessageComposer/LLMPicker.tsx`**: [NEW] The UI component for the LLM picker
- **`frontend/src/components/chat/MessageComposer/index.tsx`**: Integrated `LLMPicker` and handled `selectedLLM` state

### Testing
- **`backend/tests/test_llm_picker.py`**: [NEW] Pytest suite covering backend logic (100% passing)
- **`cypress/e2e/llm_picker/main.py`**: [NEW] Chainlit test application for E2E testing
- **`cypress/e2e/llm_picker/spec.cy.ts`**: [NEW] Cypress E2E tests

---

## Next Steps: Refactor LLM Picker → Modes System

### Vision

Transform the single LLM dropdown into a flexible **Modes** system that supports multiple categories of user selections. Each "Mode" represents a category with options, and the user selects **one option per mode**. 

**Example modes:**
- **LLM/Model**: GPT-5, Gemini 3 Pro, Claude Opus 4.5
- **Approach**: Planning, Chat, Deep Research  
- **Reasoning Effort**: Low, Medium, High

![Multiple modes in UI](C:/Users/Haze/.gemini/antigravity/brain/35b4bf55-927d-4df2-875b-da44655f84af/uploaded_image_2_1766152819530.png)

### Data Model Changes

> [!IMPORTANT]
> **Using Pydantic dataclasses** (like `ChatSettings` and `Starter`) instead of TypedDict, since we'll have methods/logic.

```python
# backend/chainlit/mode.py (NEW FILE)

from dataclasses import dataclass
from typing import Optional, List
from dataclasses_json import DataClassJsonMixin

@dataclass
class ModeOption(DataClassJsonMixin):
    """A single selectable option within a Mode."""
    id: str                      # e.g., "gpt-5", "planning", "high"
    name: str                    # e.g., "GPT-5", "Planning", "High"
    description: Optional[str]   # e.g., "Most capable model"
    icon: Optional[str]          # Lucide icon name, local path, or URL
    default: bool = False        # Whether this is the default option

@dataclass  
class Mode(DataClassJsonMixin):
    """A category of options the user can select from."""
    id: str                      # e.g., "llm", "approach", "reasoning"
    name: str                    # e.g., "Model", "Approach", "Reasoning Effort"
    options: List[ModeOption]    # The available options for this mode
```

### Icon Handling

**Consolidate under single `icon` field** with type detection (following existing patterns in `Starter`):

| Icon Type | Example Value | Resolution |
|-----------|---------------|------------|
| Lucide | `"sparkles"` | Render `<Sparkles />` component |
| Local path | `/public/avatars/gemini.png` | Serve via `/avatars/{name}` endpoint |
| Remote URL | `https://example.com/icon.png` | Render `<img src={url} />` |

**Detection logic** (frontend):
```typescript
function resolveIcon(icon: string) {
  if (icon.startsWith('http://') || icon.startsWith('https://')) {
    return { type: 'url', value: icon };
  } else if (icon.startsWith('/public/') || icon.includes('/')) {
    return { type: 'path', value: icon };
  } else {
    return { type: 'lucide', value: icon };
  }
}
```

### API Changes

> [!TIP]
> **Design Decision: Emitter Pattern (like Commands)**
> 
> Using `cl.context.emitter.set_modes(...)` instead of a decorator because:
> - **Consistency**: Matches how Commands work (`await cl.context.emitter.set_commands(...)`)
> - **Dynamic**: Can change modes mid-session, based on user role, or conditionally
> - **Simpler**: No callback registration in config.py, just call when needed
> - **Explicit**: Clear when modes are set in the code flow

**Usage Example:**
```python
@cl.on_chat_start
async def start():
    await cl.context.emitter.set_modes([
        Mode(
            id="llm",
            name="Model", 
            options=[
                ModeOption(id="gpt-5", name="GPT-5", description="Most capable", icon="sparkles", default=True),
                ModeOption(id="gemini-3", name="Gemini 3 Pro", description="Fast and smart", icon="zap"),
            ]
        ),
        Mode(
            id="approach",
            name="Approach",
            options=[
                ModeOption(id="chat", name="Chat", description="Quick responses", icon="message-circle", default=True),
                ModeOption(id="planning", name="Planning", description="Structured thinking", icon="clipboard-list"),
                ModeOption(id="research", name="Deep Research", description="Thorough analysis", icon="search"),
            ]
        ),
    ])
```

| Current | New |
|---------|-----|
| `@cl.set_llms` decorator | `await cl.context.emitter.set_modes([...])` |
| `LLMDict` | `ModeOption` (with parent `Mode`) |
| `llms` field on Message | `modes: dict[str, str]` field on Message |

### Message/Thread Integration

- **`cl.Message.modes`**: `dict[str, str]` mapping `mode.id` → `selected_option.id`
  ```python
  # Example
  message.modes = {
      "llm": "gpt-5",
      "approach": "planning", 
      "reasoning": "high"
  }
  ```
- **Thread Metadata**: Store current mode selections in `threadMetadata` for persistence

### UI Changes

- **Multiple dropdowns**: One `ModePicker` component per mode, rendered horizontally in message composer
- **Each dropdown**: Shows mode name + currently selected option, expands to show all options
- **State**: Each mode tracks its own selected option independently

### Files to Create/Modify

#### Backend
- **[NEW]** `backend/chainlit/mode.py`: `Mode` and `ModeOption` dataclasses
- **[MODIFY]** `backend/chainlit/types.py`: Remove `LLMDict`, add mode type exports
- **[MODIFY]** `backend/chainlit/message.py`: Replace `llm` field with `modes: dict[str, str]`
- **[MODIFY]** `backend/chainlit/emitter.py`: Replace `set_llms` → `set_modes` method
- **[MODIFY]** `backend/chainlit/server.py`: Update socket event names (`set_llms` → `set_modes`)
- **[MODIFY]** `backend/chainlit/__init__.py`: Remove `set_llms` export, add `Mode`, `ModeOption` exports

#### Frontend
- **[MODIFY]** `libs/react-client/src/types/llm.ts` → `mode.ts`: Update interfaces
- **[MODIFY]** `libs/react-client/src/state.ts`: `llmsState` → `modesState`
- **[MODIFY]** `libs/react-client/src/useChatSession.ts`: Update socket listener
- **[MODIFY]** `LLMPicker.tsx` → `ModePicker.tsx`: Support multiple modes
- **[MODIFY]** `MessageComposer/index.tsx`: Render multiple `ModePicker` components

#### Tests
- **[MODIFY]** `backend/tests/test_llm_picker.py` → `test_modes.py`
- **[MODIFY]** `cypress/e2e/llm_picker/` → `cypress/e2e/modes/`

---

## Implementation Steps Taken (Historical)

1. **Architecture**: Designed system mirroring the existing `Command` feature but for LLM selection
2. **Backend**: Implemented data structures, socket events, and message handling for `llm` metadata
3. **Frontend**: Built UI using Popover/Command pattern and connected to global state
4. **Refactoring**: Renamed initial concepts from "Model" to "LLM" across the stack
5. **Debugging**: 
   - Addressed CORS issues (resolved and reverted)
   - Attempted to fix Icon rendering (Lucide vs. URL/Local)
   - Attempted to fix clickability issues by replacing `cmdk` with standard `div`s

---

# Usage
```py
@cl.on_chat_start
async def start():
    await cl.context.emitter.set_modes([
        cl.Mode(id="model", name="Model", options=[
            cl.ModeOption(id="gpt-4", name="GPT-4", default=True),
            cl.ModeOption(id="claude", name="Claude"),
        ]),
        cl.Mode(id="approach", name="Approach", options=[
            cl.ModeOption(id="fast", name="Fast"),
            cl.ModeOption(id="thorough", name="Thorough", default=True),
        ])
    ])
```

---

## Reference Implementations

For icon/path/url handling, reference these existing patterns:
- `backend/chainlit/types.py` → `Starter` class uses `icon: Optional[str]`
- `backend/chainlit/server.py` → `/avatars/{avatar_id}` endpoint serves local files from `public/avatars/`
- `backend/chainlit/chat_settings.py` → Pattern for pydantic dataclass with `send()` method
