# Dynamic Configuration Management

Chainlit now supports dynamic configuration management, allowing you to programmatically update configuration settings at runtime, particularly when switching between ChatProfiles.

## Overview

This feature enables:
- **Profile-specific configurations**: Different settings for different ChatProfiles
- **Runtime configuration updates**: Change settings dynamically during a session
- **Session isolation**: Each user session maintains its own configuration overrides
- **Backward compatibility**: Existing config.toml files continue to work unchanged

## Key Components

### 1. Profile Switch Callback

Use the `@cl.on_profile_switch` decorator to react when users switch between ChatProfiles:

```python
import chainlit as cl
from chainlit.types import ChatProfile

@cl.on_profile_switch
async def handle_profile_switch(profile: ChatProfile):
    if profile.name == "vision-model":
        await cl.update_config({
            "features": {
                "spontaneous_file_upload": {
                    "enabled": True,
                    "accept": ["image/*"],
                    "max_files": 5
                }
            },
            "ui": {
                "name": f"Vision Assistant ({profile.name})"
            }
        })
    elif profile.name == "text-model":
        await cl.update_config({
            "features": {
                "spontaneous_file_upload": {
                    "enabled": False
                }
            },
            "ui": {
                "name": "Text Assistant"
            }
        })
```

### 2. Dynamic Configuration Updates

Use `cl.update_config()` to modify configuration at runtime:

```python
await cl.update_config({
    "features": {
        "latex": True,
        "spontaneous_file_upload": {
            "enabled": True,
            "max_files": 10,
            "max_size_mb": 50
        }
    },
    "ui": {
        "name": "Custom Assistant Name",
        "description": "Updated description"
    }
})
```

### 3. Session-specific Configuration

Access the current session's configuration (including overrides):

```python
import chainlit as cl

# Get configuration with session-specific overrides applied
current_config = cl.get_session_config()

# Check if file uploads are enabled for this session
if current_config.features.spontaneous_file_upload.enabled:
    await cl.Message("File uploads are enabled!").send()
```

## Configuration Structure

The `update_config()` function accepts a dictionary that mirrors the structure of `config.toml`:

```python
config_updates = {
    "features": {
        "latex": True,
        "user_message_autoscroll": False,
        "spontaneous_file_upload": {
            "enabled": True,
            "accept": ["image/*", "application/pdf"],
            "max_files": 5,
            "max_size_mb": 10
        },
        "audio": {
            "enabled": True,
            "sample_rate": 44100
        }
    },
    "ui": {
        "name": "Custom Assistant",
        "description": "Your personalized AI assistant",
        "default_theme": "dark"
    },
    "project": {
        "cache": True
    }
}

await cl.update_config(config_updates)
```

## How It Works

1. **Configuration Overlay**: Each session maintains a `config_overrides` dictionary that is merged with the global configuration
2. **Deep Merging**: Configuration updates are intelligently merged, preserving existing settings that aren't explicitly overridden
3. **Session Isolation**: Each user session has its own configuration overrides without affecting other sessions
4. **Global Fallback**: If no session-specific overrides exist, the global configuration is used

## Example Use Cases

### 1. Model-specific Capabilities

```python
@cl.on_profile_switch
async def configure_for_model(profile: ChatProfile):
    if "vision" in profile.name:
        # Enable image uploads for vision models
        await cl.update_config({
            "features": {
                "spontaneous_file_upload": {
                    "enabled": True,
                    "accept": ["image/*"]
                }
            }
        })
    elif "code" in profile.name:
        # Enable document uploads for code models
        await cl.update_config({
            "features": {
                "spontaneous_file_upload": {
                    "enabled": True,
                    "accept": ["text/*", "application/json"]
                }
            }
        })
```

### 2. User Role-based Configuration

```python
@cl.on_chat_start
async def configure_for_user():
    user = cl.context.session.user
    
    if user and user.role == "admin":
        await cl.update_config({
            "features": {
                "spontaneous_file_upload": {
                    "max_files": 20,
                    "max_size_mb": 100
                }
            }
        })
    else:
        await cl.update_config({
            "features": {
                "spontaneous_file_upload": {
                    "max_files": 3,
                    "max_size_mb": 5
                }
            }
        })
```

### 3. Progressive Feature Enablement

```python
@cl.on_message
async def unlock_features(message: cl.Message):
    # Enable advanced features after user engagement
    message_count = len(cl.chat_context.get())
    
    if message_count >= 5:
        await cl.update_config({
            "features": {
                "latex": True,
                "spontaneous_file_upload": {
                    "enabled": True
                }
            },
            "ui": {
                "name": "Advanced Assistant (Unlocked!)"
            }
        })
        
        await cl.Message(
            "🎉 Advanced features unlocked! You can now use LaTeX and file uploads."
        ).send()
```

## Frontend Integration

When configuration updates include UI changes, they are automatically sent to the frontend:

```python
# This will update the assistant name in the UI
await cl.update_config({
    "ui": {
        "name": "New Assistant Name",
        "description": "Updated description"
    }
})
```

### Profile Switching from Frontend

The backend now supports a `chat_profile_change` socket event for frontend-initiated profile switches:

```javascript
// Frontend can trigger profile switches
socket.emit('chat_profile_change', 'new-profile-name');

// Listen for confirmation
socket.on('chat_profile_changed', (data) => {
    console.log(`Profile changed from ${data.old_profile} to ${data.new_profile}`);
});
```

## Best Practices

1. **Clear User Communication**: Always inform users when configuration changes affect their experience
2. **Graceful Degradation**: Ensure your app works even if configuration updates fail
3. **Consistent Behavior**: Keep profile-specific configurations predictable and documented
4. **Performance**: Avoid frequent configuration updates as they involve session state management

## Migration from Static Configuration

Existing applications using static `config.toml` files require no changes. Dynamic configuration is additive:

- Your existing `config.toml` serves as the base configuration
- Dynamic updates create session-specific overlays
- All existing behavior is preserved

To add dynamic configuration to an existing app:

1. Add the `@cl.on_profile_switch` decorator
2. Use `cl.update_config()` where needed
3. Test that existing functionality remains unchanged

## Troubleshooting

### Configuration Updates Not Applied

- Ensure you're calling `cl.update_config()` from within a Chainlit context (inside a callback function)
- Check that the configuration structure matches the expected format
- Verify that the session has been properly initialized

### Profile Switch Not Triggered

- Make sure you have defined chat profiles using `@cl.set_chat_profiles`
- Verify that the profile switching is happening (check logs for "Switching to profile" messages)
- Ensure the `@cl.on_profile_switch` decorator is properly applied

### Session Isolation Issues

- Each session maintains its own configuration overrides
- Use `cl.get_session_config()` to access the current session's effective configuration
- Configuration changes in one session don't affect others