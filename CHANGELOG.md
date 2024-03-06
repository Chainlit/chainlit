# Changelog

All notable changes to Chainlit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

Nothing is unreleased!

## [1.0.400] - 2023-03-06

### Added

- OpenAI integration

### Fixed

- Langchain final answer streaming should work again
- Elements with public URLs should be correctly persisted by the data layer

### Changed

- Enforce UTC DateTimes

## [1.0.300] - 2023-02-19

### Added

- Custom js script injection
- First token and token throughput per second metrics

### Changed

- The `ChatGeneration` and `CompletionGeneration` has been reworked to better match the OpenAI semantics

## [1.0.200] - 2023-01-22

### Added

- Chainlit Copilot
- Translations
- Custom font

### Fixed

- Tasklist flickering

## [1.0.101] - 2023-01-12

### Fixed

- Llama index callback handler should now correctly nest the intermediary steps
- Toggling hide_cot parameter in the UI should correctly hide the `took n steps` buttons
- `running` loading button should only be displayed once when `hide_cot` is true and a message is being streamed

## [1.0.100] - 2023-01-10

### Added

- `on_logout` hook allowing to clear cookies when a user logs out

### Changed

- Chainlit apps won't crash anymore if the data layer is not reachable

### Fixed

- File upload now works when switching chat profiles
- Avatar with an image no longer have a background color
- If `hide_cot` is set to `true`, the UI will never get the intermediary steps (but they will still be persisted)
- Fixed a bug preventing to open past chats

## [1.0.0] - 2023-01-08

### Added

- Scroll down button
- If `hide_cot` is set to `true`, a `running` loader is displayed by default under the last message when a task is running.

### Changed

- Avatars are now always displayed
- Chat history sidebar has been revamped
- Stop task button has been moved to the input bar

### Fixed

- If `hide_cot` is set to `true`, the UI will never get the intermediary steps (but they will still be persisted)

## [1.0.0rc3] - 2023-12-21

### Fixed

- Elements are now working when authenticated
- First interaction is correctly set when resuming a chat

### Changed

- The copy button is hidden if `disable_feedback` is `true`

## [1.0.0rc2] - 2023-12-18

### Added

- Copy button under messages
- OAuth samesite cookie policy is now configurable through the `CHAINLIT_COOKIE_SAMESITE` env var

### Changed

- Relax Python version requirements
- If `hide_cot` is configured to `true`, steps will never be sent to the UI, but still persisted.
- Message buttons are now positioned below

## [1.0.0rc0] - 2023-12-12

### Added

- cl.Step

### Changed

- File upload uses HTTP instead of WS and no longer has size limitation
- `cl.AppUser` becomes `cl.User`
- `Prompt` has been split in `ChatGeneration` and `CompletionGeneration`
- `Action` now display a toaster in the UI while running

## [0.7.700] - 2023-11-28

### Added

- Support for custom HTML in message content is now an opt in feature in the config
- Uvicorn `ws_per_message_deflate` config param is now configurable like `UVICORN_WS_PER_MESSAGE_DEFLATE=false`

### Changed

- Latex support is no longer enabled by default and is now a feature in the config

### Fixed

- Fixed LCEL memory message order in the prompt playground
- Fixed a key error when using the file watcher (-w)
- Fixed several user experience issues with `on_chat_resume`
- `on_chat_end` is now always called when a chat ends
- Switching chat profiles correctly clears previous AskMessages

## [0.7.604] - 2023-11-15

### Fixed

- `on_chat_resume` now works properly with non json serializable objects
- `LangchainCallbackHandler` no longer send tokens to the wrong user under high concurrency
- Langchain cache should work when `cache` is to `true` in `config.toml`

## [0.7.603] - 2023-11-15

### Fixed

- Markdown links special characters are no longer encoded
- Collapsed messages no longer make the chat scroll
- Stringified Python objects are now displayed in a Python code block

## [0.7.602] - 2023-11-14

### Added

- Latex support (only supporting $$ notation)
- Go back button on element page

### Fixed

- Code blocks should no longer flicker or display `[object object]`.
- Now properly displaying empty messages with inlined elements
- Fixed `Too many values to unpack error` in langchain callback
- Langchain final streamed answer is now annotable with human feedback
- AzureOpenAI should now work properly in the Prompt Playground

### Changed

- Code blocks display has been enhanced
- Replaced aiohttp with httpx
- Prompt Playground has been updated to work with the new openai release (v1). Including tools
- Auth0 oauth provider has a new configurable env variable `OAUTH_AUTH0_ORIGINAL_DOMAIN`

## [0.7.500] - 2023-11-07

### Added

- `cl.on_chat_resume` decorator to enable users to continue a conversation.
- Support for OpenAI functions in the Prompt Playground
- Ability to add/remove messages in the Prompt Playground
- Plotly element to display interactive charts

### Fixed

- Langchain intermediate steps display are now much more readable
- Chat history loading latency has been enhanced
- UTF-8 characters are now correctly displayed in json code blocks
- Select widget `items` attribute is now working properly
- Chat profiles widget is no longer scrolling horizontally

## [0.7.400] - 2023-10-27

### Added

- Support for Langchain Expression Language. https://docs.chainlit.io/integrations/langchain
- UI rendering optimization to guarantee high framerate
- Chainlit Cloud latency optimization
- Speech recognition to type messages. https://docs.chainlit.io/backend/config/features
- Descope OAuth provider

### Changed

- `LangchainCallbackHandler` is now displaying inputs and outputs of intermediate steps.

### Fixed

- AskUserMessage now work properly with data persistence
- You can now use a custom okta authorization server for authentication

## [0.7.3] - 2023-10-17

### Added

- `ChatProfile` allows to configure different agents that the user can freely chose
- Multi modal support at the input bar level. Enabled by `features.multi_modal` in the config
- `cl.AskUserAction` allows to block code execution until the user clicked an action.
- Displaying readme when chat is empty is now configurable through `ui.show_readme_as_default` in the config

### Changed

- `cl.on_message` is no longer taking a string as parameter but rather a `cl.Message`

### Fixed

- Chat history is now correctly displayed on mobile
- Azure AD OAuth authentication should now correctly display the user profile picture

### Removed

- `@cl.on_file_upload` is replaced by true multi modal support at the input bar level

## [0.7.2] - 2023-10-10

### Added

- Logo is displayed in the UI header (works with custom logo)
- Azure AD single tenant is now supported
- `collapsed` attribute on the `Action` class
- Latency improvements when data persistence is enabled

### Changed

- Chat history has been entirely reworked
- Chat messages redesign
- `config.ui.base_url` becomes `CHAINLIT_URL` env variable

### Fixed

- File watcher (-w) is now working with nested module imports
- Unsupported character during OAuth authentication

## [0.7.1] - 2023-09-29

### Added

- Pydantic v2 support
- Okta auth provider
- Auth0 auth provider
- Prompt playground support for mix of template/formatted prompts
- `@cl.on_chat_end` decorator
- Textual comments to user feedback

### Fixed

- Langchain errors are now correctly indented
- Langchain nested chains prompts are now correctly displayed
- Langchain error TypeError: 'NoneType' object is not a mapping.
- Actions are now displayed on mobile
- Custom logo is now working as intended

## [0.7.0] - 2023-09-13

### Changed

- Authentication is now unopinionated:
  1. `@cl.password_auth_callback` for login/password auth
  2. `@cl.oauth_callback` for oAuth auth
  3. `@cl.header_auth_callback` for header auth
- Data persistence is now enabled through `CHAINLIT_API_KEY` env variable

### Removed

- `@cl.auth_client_factory` (see new authentication)
- `@cl.db_client_factory` (see new data persistence)

### Added

- `disable_human_feedback` parameter on `cl.Message`
- Configurable logo
- Configurable favicon
- Custom CSS injection
- GCP Vertex AI LLM provider
- Long message collpasing feature flag
- Enable Prompt Playground feature flag

### Fixed

- History page filters now work properly
- History page does not show empty conversations anymore
- Langchain callback handler Message errors

## [0.6.4] - 2023-08-30

### Added

- `@cl.on_file_upload` to enable spontaneous file uploads
- `LangchainGenericProvider` to add any Langchain LLM in the Prompt Playground
- `cl.Message` content now support dict (previously only supported string)
- Long messages are now collapsed by default

### Fixed

- Deadlock in the Llama Index callback handler
- Langchain MessagesPlaceholder and FunctionMessage are now correctly supported

## [0.6.3] - 2023-08-22

### Added

- Complete rework of the Prompt playground. Now supports custom LLMs, templates, variables and more
- Enhanced Langchain final answer streaming
- `remove_actions` method on the `Message` class
- Button to clear message history

### Fixed

- Chainlit CLI performance issue
- Llama Index v0.8+ callback handler. Now supports messages prompts
- Tasklist display, persistence and `.remove()`
- Custom headers growing infinitely large
- Action callback can now handle multiple actions
- Langflow integration load_flow_from_json
- Video and audio elements on Safari

## [0.6.2] - 2023-08-06

### Added

- Make the chat experience configurable with Chat Settings
- Authenticate users based on custom headers with the Custom Auth client

### Fixed

- Author rename now works with all kinds of messages
- Create message error with chainlit cloud (chenjuneking)

## [0.6.1] - 2023-07-24

### Added

- Security improvements
- Haystack callback handler
- Theme customizability

### Fixed

- Allow multiple browser tabs to connect to one Chainlit app
- Sidebar blocking the send button on mobile

## [0.6.0] - 2023-07-20

### Breaking changes

- Factories, run and post process decorators are removed.
- langchain_rename becomes author_rename and works globally
- Message.update signature changed

Migration guide available [here](https://docs.chainlit.io/guides/migration/0.6.0).

### Added

- Langchain final answer streaming
- Redesign of chainlit input elements
- Possibility to add custom endpoints to the fast api server
- New File Element
- Copy button in code blocks

### Fixed

- Persist session between websocket reconnection
- The UI is now more mobile friendly
- Avatar element Path parameter
- Increased web socket message max size to 100 mb
- Duplicated conversations in the history tab

## [0.5.2] - 2023-07-10

### Added

- Add the video element

### Fixed

- Fix the inline element flashing when scrolling the page, due to un-needed re-rendering
- Fix the orange flash effect on messages

## [0.5.1] - 2023-07-06

### Added

- Task list element
- Audio element
- All elements can use the `.remove()` method to remove themselves from the UI
- Can now use cloud auth with any data persistence mode (like local)
- Microsoft auth

### Fixed

- Files in app dir are now properly served (typical use case is displaying an image in the readme)
- Add missing attribute `size` to Pyplot element

## [0.5.0] - 2023-06-28

### Added

- Llama Index integration. Learn more [here](https://docs.chainlit.io/integrations/llama-index).
- Langflow integration. Learn more [here](https://docs.chainlit.io/integrations/langflow).

### Fixed

- AskUserMessage.remove() now works properly
- Avatar element cannot be referenced in messages anymore

## [0.4.2] - 2023-06-26

### Added

- New data persistence mode `local` and `custom` are available on top of the pre-existing `cloud` one. Learn more [here](https://docs.chainlit.io/data).

## [0.4.101] - 2023-06-24

### Fixed

- Performance improvements and bug fixes on run_sync and asyncify

## [0.4.1] - 2023-06-20

### Added

- File watcher now reloads the app when the config is updated
- cl.cache to avoid wasting time reloading expensive resources every time the app reloads

### Fixed

- Bug introduced by 0.4.0 preventing to run private apps
- Long line content breaking the sidebar with Text elements
- File watcher preventing to keyboard interrupt the chainlit process
- Updated socket io to fix a security issue
- Bug preventing config settings to be the default values for the settings in the UI

## [0.4.0] - 2023-06-16

### Added

- Pyplot chart element
- Config option `default_expand_messages` to enable the default expand message settings by default in the UI (breaking change)

### Fixed

- Scoped elements sharing names are now correctly displayed
- Clickable Element refs are now correctly displayed, even if another ref being a substring of it exists

## [0.3.0] - 2023-06-13

### Added

- Moving from sync to async runtime (breaking change):
  - Support async implementation (eg openai, langchain)
  - Performance improvements
  - Removed patching of different libraries
- Elements:
  - Merged LocalImage and RemoteImage to Image (breaking change)
  - New Avatar element to display avatars in messages
- AskFileMessage now supports multi file uploads (small breaking change)
- New settings interface including a new "Expand all" messages setting
- The element sidebar is resizable

### Fixed

- Secure origin issues when running on HTTP
- Updated the callback handler to langchain 0.0.198 latest changes
- Filewatcher issues
- Blank screen issues
- Port option in the CLI does not fail anymore because of os import

## [0.2.111] - 2023-06-09

### Fixed

- Pdf element reloading issue
- CI is more stable

## [0.2.110] - 2023-06-08

### Added

- `AskFileMessage`'s accept parameter can now can take a Dict to allow more fine grained rules. More infos here https://react-dropzone.org/#!/Accepting%20specific%20file%20types.
- The PDF viewer element helps you display local or remote PDF files ([documentation](https://docs.chainlit.io/api-reference/elements/pdf-viewer)).

### Fixed

- When running the tests, the chainlit cli is installed is installed in editable mode to run faster.

## [0.2.109] - 2023-05-31

### Added

- URL preview for social media share

### Fixed

- `max_http_buffer_size` is now set to 100mb, fixing the `max_size_mb` parameter of `AskFileMessage`

## [0.2.108] - 2023-05-30

### Fixed

- Enhanced security
- Global element display
- Display elements with display `page` based on their ids instead of their names

## [0.2.107] - 2023-05-28

### Added

- Rework of the Message, AskUserMessage and AskFileMessage APIs:
- `cl.send_message(...)` becomes `cl.Message(...).send()`
- `cl.send_ask_user(...)` becomes `cl.AskUserMessage(...).send()`
- `cl.send_ask_file(...)` becomes `cl.AskFileMessage(...).send()`
- `update` and `remove` methods to the `cl.Message` class

### Fixed

- Blank screen for windows users (https://github.com/Chainlit/chainlit/issues/3)
- Header navigation for mobile (https://github.com/Chainlit/chainlit/issues/12)

## [0.2.106] - 2023-05-26

### Added

- Starting to log changes in CHANGELOG.md
- Port and hostname are now configurable through the `CHAINLIT_HOST` and `CHAINLIT_PORT` env variables. You can also use `--host` and `--port` when running `chainlit run ...`.
- A label attribute to Actions to facilitate localization.

### Fixed

- Clicks on inlined `RemoteImage` now opens the image in a NEW tab.
