# Changelog

All notable changes to Chainlit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

Nothing unreleased yet!

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
